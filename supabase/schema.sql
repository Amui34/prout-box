-- ============================================================================
--  Prout Box — Schéma Supabase (classement en ligne par pays + notation)
--  © 2026 Noa Madar
--
--  Modèle : pas de compte. Chaque appareil génère un identifiant secret
--  (device_id, uuid dans localStorage) qui sert de « jeton » : il permet de
--  publier, de voter une fois par prout, de signaler, et de supprimer SES prouts.
--
--  Toute l'API passe par des fonctions `security definer` (ci-dessous) :
--  les tables ne sont pas accessibles directement avec la clé publique.
--
--  À faire : Supabase → SQL Editor → coller ce fichier → Run.
--  Idempotent : peut être relancé sans casser.
-- ============================================================================

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────────────────
--  TABLES
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists prouts (
  id            uuid primary key default gen_random_uuid(),
  device_id     uuid not null,
  initials      text not null check (initials ~ '^[A-Z]{3}$'),
  country       text not null check (country ~ '^[A-Z]{2}$'),
  species       text not null default '',
  city          text,                            -- ville approximative (facultative), ex. « Montpellier »
  jury          int  not null default 0 check (jury between 0 and 10000),
  path          text not null unique,            -- objet dans le bucket "prouts"
  mime          text not null default 'audio/mp4',
  votes_count   int  not null default 0,
  votes_sum     int  not null default 0,
  reports_count int  not null default 0,
  hidden        boolean not null default false,  -- masqué (signalements ou modération manuelle)
  created_at    timestamptz not null default now()
);
alter table prouts add column if not exists city text; -- ajout 1.1 (bases créées avant)
create index if not exists prouts_country_idx on prouts (country) where not hidden;
create index if not exists prouts_created_idx on prouts (created_at desc);

create table if not exists votes (
  prout_id   uuid not null references prouts(id) on delete cascade,
  device_id  uuid not null,
  stars      int  not null check (stars between 1 and 5),
  created_at timestamptz not null default now(),
  primary key (prout_id, device_id)
);

create table if not exists reports (
  prout_id   uuid not null references prouts(id) on delete cascade,
  device_id  uuid not null,
  reason     text not null default '',
  created_at timestamptz not null default now(),
  primary key (prout_id, device_id)
);

-- Initiales interdites (complétable depuis le dashboard)
create table if not exists banned_initials (word text primary key);
insert into banned_initials (word) values
  ('CUL'),('BIT'),('PUT'),('SEX'),('KKK'),('FUK'),('FCK'),('FUC'),('NIK'),('NIQ'),('ZOB'),('PED'),('NAZ'),
  ('ASS'),('DIK'),('DIC'),('CON'),('FDP'),('NTM'),('PIS'),('GAY'),('FAG'),('JEW'),('NEG'),('NGR'),('NIG'),
  ('CUM'),('TIT'),('VAG'),('ANL'),('ANU'),('COQ'),('SUC'),('PNE')
on conflict do nothing;

-- Aucun accès direct avec la clé publique : RLS activé, zéro policy.
alter table prouts          enable row level security;
alter table votes           enable row level security;
alter table reports         enable row level security;
alter table banned_initials enable row level security;

-- ─────────────────────────────────────────────────────────────────────────
--  STOCKAGE : bucket public "prouts" (lecture publique, dépôt limité)
-- ─────────────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('prouts', 'prouts', true, 400000, array['audio/mp4','audio/webm','audio/ogg','audio/wav','audio/mpeg','audio/aac','audio/x-m4a'])
on conflict (id) do update set public = true, file_size_limit = 400000, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "prouts: lecture publique" on storage.objects;
create policy "prouts: lecture publique" on storage.objects
  for select using (bucket_id = 'prouts');

-- Dépôt : chemin "<device_id>/<nom>.<ext>" ; la fonction publish_prout vérifie ensuite
-- que le device_id du chemin est bien celui de l'appareil qui publie.
drop policy if exists "prouts: dépôt" on storage.objects;
create policy "prouts: dépôt" on storage.objects
  for insert with check (
    bucket_id = 'prouts'
    and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and array_length(storage.foldername(name), 1) = 1
  );
-- Pas de policy update. Suppression : Supabase interdit `delete from storage.objects` depuis le SQL
-- (trigger storage.protect_delete), donc le client efface le fichier via l'API Storage APRÈS que
-- delete_prout a retiré la ligne ; la policy n'autorise que les fichiers orphelins (sans ligne `prouts`).
drop policy if exists "prouts: suppression des orphelins" on storage.objects;
create policy "prouts: suppression des orphelins" on storage.objects
  for delete to anon, authenticated
  using (bucket_id = 'prouts' and not exists (select 1 from public.prouts p where p.path = storage.objects.name));

-- ─────────────────────────────────────────────────────────────────────────
--  API (fonctions security definer, exposées à la clé publique)
-- ─────────────────────────────────────────────────────────────────────────

-- Publier un prout déjà déposé dans le bucket. p_city (1.1) : ville approximative, facultative.
drop function if exists publish_prout(uuid, text, text, text, int, text, text);
create or replace function publish_prout(
  p_device uuid, p_initials text, p_country text, p_species text, p_jury int, p_path text, p_mime text, p_city text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_today int;
begin
  if p_initials !~ '^[A-Z]{3}$' then raise exception 'initiales invalides'; end if;
  if exists (select 1 from banned_initials where word = p_initials) then raise exception 'initiales refusées'; end if;
  if p_country !~ '^[A-Z]{2}$' then raise exception 'pays invalide'; end if;
  if p_path !~ ('^' || p_device::text || '/[A-Za-z0-9._-]+$') then raise exception 'chemin invalide'; end if;
  if not exists (select 1 from storage.objects where bucket_id = 'prouts' and name = p_path) then raise exception 'fichier absent'; end if;
  select count(*) into v_today from prouts where device_id = p_device and created_at > now() - interval '1 day';
  if v_today >= 20 then raise exception 'trop de prouts aujourd''hui'; end if;
  insert into prouts (device_id, initials, country, species, jury, path, mime, city)
  values (p_device, p_initials, p_country, left(coalesce(p_species, ''), 40), greatest(0, least(10000, coalesce(p_jury, 0))), p_path, left(coalesce(p_mime, 'audio/mp4'), 40), nullif(left(trim(coalesce(p_city, '')), 40), ''))
  returning id into v_id;
  return v_id;
end $$;

-- Classement : par pays (p_country) ou mondial (null). Moyenne bayésienne pour éviter
-- qu'un seul vote à 5 prenne la tête : (somme + 3×3) / (nb + 3).
drop function if exists top_prouts(uuid, text, int);
create function top_prouts(p_device uuid, p_country text default null, p_limit int default 50)
returns table (
  id uuid, initials text, country text, species text, city text, jury int, path text, mime text,
  votes int, avg numeric, my_stars int, mine boolean, created_at timestamptz
)
language sql security definer set search_path = public stable as $$
  select p.id, p.initials, p.country, p.species, p.city, p.jury, p.path, p.mime,
         p.votes_count,
         case when p.votes_count = 0 then 0 else round(p.votes_sum::numeric / p.votes_count, 1) end,
         (select v.stars from votes v where v.prout_id = p.id and v.device_id = p_device),
         p.device_id = p_device,
         p.created_at
  from prouts p
  where not p.hidden and (p_country is null or p.country = p_country)
  order by (p.votes_sum + 9.0) / (p.votes_count + 3) desc, p.votes_count desc, p.created_at desc
  limit greatest(1, least(100, p_limit));
$$;

-- Voter (1 à 5 crottes) : un vote par appareil et par prout, modifiable.
create or replace function vote_prout(p_device uuid, p_prout uuid, p_stars int)
returns table (votes int, avg numeric)
language plpgsql security definer set search_path = public as $$
declare v_today int;
begin
  if p_stars not between 1 and 5 then raise exception 'note invalide'; end if;
  select count(*) into v_today from votes where device_id = p_device and created_at > now() - interval '1 day';
  if v_today >= 300 then raise exception 'trop de votes aujourd''hui'; end if;
  insert into votes (prout_id, device_id, stars) values (p_prout, p_device, p_stars)
  on conflict (prout_id, device_id) do update set stars = excluded.stars, created_at = now();
  update prouts p set
    votes_count = s.c, votes_sum = s.s
  from (select count(*) c, coalesce(sum(stars), 0) s from votes where prout_id = p_prout) s
  where p.id = p_prout;
  return query select p.votes_count, case when p.votes_count = 0 then 0 else round(p.votes_sum::numeric / p.votes_count, 1) end
               from prouts p where p.id = p_prout;
end $$;

-- Signaler : masqué automatiquement à partir de 3 signalements distincts.
create or replace function report_prout(p_device uuid, p_prout uuid, p_reason text default '')
returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into reports (prout_id, device_id, reason) values (p_prout, p_device, left(coalesce(p_reason, ''), 200))
  on conflict do nothing;
  update prouts p set
    reports_count = r.c, hidden = p.hidden or r.c >= 3
  from (select count(*) c from reports where prout_id = p_prout) r
  where p.id = p_prout;
end $$;

-- Supprimer SON prout : retire la ligne et renvoie le chemin du fichier (null si ce n'est pas le sien),
-- le client efface ensuite le fichier via l'API Storage (policy « suppression des orphelins »).
drop function if exists delete_prout(uuid, uuid);
create function delete_prout(p_device uuid, p_prout uuid)
returns text
language plpgsql security definer set search_path = public as $$
declare v_path text;
begin
  delete from prouts where id = p_prout and device_id = p_device returning path into v_path;
  return v_path;
end $$;

grant execute on function publish_prout(uuid, text, text, text, int, text, text, text) to anon, authenticated;
grant execute on function top_prouts(uuid, text, int) to anon, authenticated;
grant execute on function vote_prout(uuid, uuid, int) to anon, authenticated;
grant execute on function report_prout(uuid, uuid, text) to anon, authenticated;
grant execute on function delete_prout(uuid, uuid) to anon, authenticated;

-- ═════════════════════════════════════════════════════════════════════════
--  GROUPES (1.2) : des potes, une galerie privée, des défis.
--  Un groupe se rejoint avec un code à 6 lettres. Dans un groupe chacun a un pseudo.
--  members.id (uuid public) identifie un membre côté client ; device_id reste secret.
-- ═════════════════════════════════════════════════════════════════════════

create table if not exists groups (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 24),
  code       text not null unique check (code ~ '^[A-Z]{6}$'),
  created_by uuid not null,
  created_at timestamptz not null default now()
);
create table if not exists members (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references groups(id) on delete cascade,
  device_id  uuid not null,
  pseudo     text not null check (char_length(pseudo) between 1 and 12),
  joined_at  timestamptz not null default now(),
  unique (group_id, device_id),
  unique (group_id, pseudo)
);
create table if not exists group_prouts (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references groups(id) on delete cascade,
  member_id  uuid not null references members(id) on delete cascade,  -- auteur
  path       text not null unique,
  mime       text not null default 'audio/mp4',
  species    text not null default '',
  jury       int  not null default 0,
  kind       text not null default 'libre' check (kind in ('libre', 'jour', 'imitation')),
  theme      text,            -- kind = 'jour' : le thème du jour
  target     text,            -- kind = 'imitation' : id du prout classique imité
  similarity int,             -- kind = 'imitation' : ressemblance 0-100 (calculée côté client)
  votes_count int not null default 0,
  votes_sum   int not null default 0,
  hidden     boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists group_prouts_group_idx on group_prouts (group_id, created_at desc);
create table if not exists guesses (
  group_prout_id uuid not null references group_prouts(id) on delete cascade,
  member_id      uuid not null references members(id) on delete cascade,  -- qui devine
  guessed_member uuid not null references members(id) on delete cascade,
  correct        boolean not null,
  created_at     timestamptz not null default now(),
  primary key (group_prout_id, member_id)
);
create table if not exists group_votes (
  group_prout_id uuid not null references group_prouts(id) on delete cascade,
  member_id      uuid not null references members(id) on delete cascade,
  stars          int not null check (stars between 1 and 5),
  primary key (group_prout_id, member_id)
);
alter table groups       enable row level security;
alter table members      enable row level security;
alter table group_prouts enable row level security;
alter table guesses      enable row level security;
alter table group_votes  enable row level security;

-- membre courant (ou exception)
create or replace function _member(p_device uuid, p_group uuid) returns members
language sql security definer set search_path = public stable as $$
  select m.* from members m where m.group_id = p_group and m.device_id = p_device;
$$;

create or replace function create_group(p_device uuid, p_name text, p_pseudo text)
returns table (id uuid, name text, code text, pseudo text)
language plpgsql security definer set search_path = public as $$
declare v_code text; v_id uuid; v_pseudo text := left(trim(coalesce(p_pseudo, '')), 12); v_name text := left(trim(coalesce(p_name, '')), 24);
begin
  if char_length(v_pseudo) = 0 then raise exception 'pseudo vide'; end if;
  if exists (select 1 from banned_initials b where upper(v_pseudo) like '%' || b.word || '%') then raise exception 'pseudo refusé'; end if;
  if char_length(v_name) = 0 then raise exception 'nom vide'; end if;
  if (select count(*) from groups g where g.created_by = p_device and g.created_at > now() - interval '1 day') >= 5 then raise exception 'trop de groupes aujourd''hui'; end if;
  loop
    v_code := (select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ', 1 + floor(random() * 24)::int, 1), '') from generate_series(1, 6));
    exit when not exists (select 1 from groups g where g.code = v_code);
  end loop;
  insert into groups (name, code, created_by) values (v_name, v_code, p_device) returning groups.id into v_id;
  insert into members (group_id, device_id, pseudo) values (v_id, p_device, v_pseudo);
  return query select v_id, v_name, v_code, v_pseudo;
end $$;

create or replace function join_group(p_device uuid, p_code text, p_pseudo text)
returns table (id uuid, name text, code text, pseudo text)
language plpgsql security definer set search_path = public as $$
declare g groups; v_pseudo text := left(trim(coalesce(p_pseudo, '')), 12);
begin
  select * into g from groups where groups.code = upper(trim(coalesce(p_code, '')));
  if g.id is null then raise exception 'code inconnu'; end if;
  if exists (select 1 from members m where m.group_id = g.id and m.device_id = p_device) then
    return query select g.id, g.name, g.code, m.pseudo from members m where m.group_id = g.id and m.device_id = p_device; return;
  end if;
  if char_length(v_pseudo) = 0 then raise exception 'pseudo vide'; end if;
  if exists (select 1 from banned_initials b where upper(v_pseudo) like '%' || b.word || '%') then raise exception 'pseudo refusé'; end if;
  if (select count(*) from members m where m.group_id = g.id) >= 30 then raise exception 'groupe complet'; end if;
  if exists (select 1 from members m where m.group_id = g.id and lower(m.pseudo) = lower(v_pseudo)) then raise exception 'pseudo déjà pris'; end if;
  insert into members (group_id, device_id, pseudo) values (g.id, p_device, v_pseudo);
  return query select g.id, g.name, g.code, v_pseudo;
end $$;

create or replace function leave_group(p_device uuid, p_group uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from members where group_id = p_group and device_id = p_device;
  delete from groups g where g.id = p_group and not exists (select 1 from members m where m.group_id = g.id); -- dernier parti : le groupe disparaît
end $$;

create or replace function my_groups(p_device uuid)
returns table (id uuid, name text, code text, pseudo text, members int, prouts int, to_guess int)
language sql security definer set search_path = public stable as $$
  select g.id, g.name, g.code, me.pseudo,
         (select count(*)::int from members m where m.group_id = g.id),
         (select count(*)::int from group_prouts p where p.group_id = g.id and not p.hidden),
         (select count(*)::int from group_prouts p where p.group_id = g.id and not p.hidden and p.member_id <> me.id
            and not exists (select 1 from guesses q where q.group_prout_id = p.id and q.member_id = me.id))
  from groups g join members me on me.group_id = g.id and me.device_id = p_device
  order by g.created_at desc;
$$;

create or replace function group_members(p_device uuid, p_group uuid)
returns table (id uuid, pseudo text, me boolean, prouts int, correct int, guesses int)
language sql security definer set search_path = public stable as $$
  select m.id, m.pseudo, m.device_id = p_device,
         (select count(*)::int from group_prouts p where p.member_id = m.id and not p.hidden),
         (select count(*)::int from guesses q where q.member_id = m.id and q.correct),
         (select count(*)::int from guesses q where q.member_id = m.id)
  from members m
  where m.group_id = p_group and exists (select 1 from members x where x.group_id = p_group and x.device_id = p_device)
  order by 5 desc, 6 asc, m.joined_at;
$$;

-- Galerie : l'auteur n'est révélé que pour ses propres prouts ou ceux déjà devinés.
create or replace function group_gallery(p_device uuid, p_group uuid, p_limit int default 60)
returns table (
  id uuid, path text, mime text, species text, jury int, kind text, theme text, target text, similarity int,
  author_id uuid, author text, mine boolean, guessed uuid, guess_correct boolean,
  votes int, avg numeric, my_stars int, created_at timestamptz
)
language sql security definer set search_path = public stable as $$
  with me as (select m.id from members m where m.group_id = p_group and m.device_id = p_device)
  select p.id, p.path, p.mime, p.species, p.jury, p.kind, p.theme, p.target, p.similarity,
         case when p.member_id = me.id or q.member_id is not null then p.member_id end,
         case when p.member_id = me.id or q.member_id is not null then a.pseudo end,
         p.member_id = me.id,
         q.guessed_member, q.correct,
         p.votes_count, case when p.votes_count = 0 then 0 else round(p.votes_sum::numeric / p.votes_count, 1) end,
         (select v.stars from group_votes v where v.group_prout_id = p.id and v.member_id = me.id),
         p.created_at
  from group_prouts p
  cross join me
  join members a on a.id = p.member_id
  left join guesses q on q.group_prout_id = p.id and q.member_id = me.id
  where p.group_id = p_group and not p.hidden
  order by p.created_at desc
  limit greatest(1, least(200, p_limit));
$$;

create or replace function publish_group_prout(
  p_device uuid, p_group uuid, p_path text, p_mime text, p_species text, p_jury int,
  p_kind text default 'libre', p_theme text default null, p_target text default null, p_similarity int default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare me members; v_id uuid;
begin
  me := _member(p_device, p_group); if me.id is null then raise exception 'pas membre'; end if;
  if p_path !~ ('^' || p_device::text || '/[A-Za-z0-9._-]+$') then raise exception 'chemin invalide'; end if;
  if not exists (select 1 from storage.objects where bucket_id = 'prouts' and name = p_path) then raise exception 'fichier absent'; end if;
  if (select count(*) from group_prouts p where p.member_id = me.id and p.created_at > now() - interval '1 day') >= 30 then raise exception 'trop de prouts aujourd''hui'; end if;
  insert into group_prouts (group_id, member_id, path, mime, species, jury, kind, theme, target, similarity)
  values (p_group, me.id, p_path, left(coalesce(p_mime, 'audio/mp4'), 40), left(coalesce(p_species, ''), 40), greatest(0, least(10000, coalesce(p_jury, 0))),
          coalesce(p_kind, 'libre'), left(p_theme, 60), left(p_target, 20), case when p_similarity is null then null else greatest(0, least(100, p_similarity)) end)
  returning id into v_id;
  return v_id;
end $$;

-- Qui a pété ? Une seule tentative par prout ; renvoie la bonne réponse.
create or replace function guess_author(p_device uuid, p_group_prout uuid, p_member uuid)
returns table (correct boolean, author_id uuid, author text)
language plpgsql security definer set search_path = public as $$
declare p group_prouts; me members;
begin
  select * into p from group_prouts where id = p_group_prout; if p.id is null then raise exception 'prout inconnu'; end if;
  me := _member(p_device, p.group_id); if me.id is null then raise exception 'pas membre'; end if;
  if p.member_id = me.id then raise exception 'c''est ton prout'; end if;
  if exists (select 1 from guesses q where q.group_prout_id = p.id and q.member_id = me.id) then raise exception 'déjà deviné'; end if;
  insert into guesses (group_prout_id, member_id, guessed_member, correct) values (p.id, me.id, p_member, p_member = p.member_id);
  return query select p_member = p.member_id, p.member_id, a.pseudo from members a where a.id = p.member_id;
end $$;

create or replace function vote_group_prout(p_device uuid, p_group_prout uuid, p_stars int)
returns table (votes int, avg numeric)
language plpgsql security definer set search_path = public as $$
declare p group_prouts; me members;
begin
  if p_stars not between 1 and 5 then raise exception 'note invalide'; end if;
  select * into p from group_prouts where id = p_group_prout; if p.id is null then raise exception 'prout inconnu'; end if;
  me := _member(p_device, p.group_id); if me.id is null then raise exception 'pas membre'; end if;
  if p.member_id = me.id then raise exception 'on ne vote pas pour soi'; end if;
  insert into group_votes (group_prout_id, member_id, stars) values (p.id, me.id, p_stars)
  on conflict (group_prout_id, member_id) do update set stars = excluded.stars;
  update group_prouts g set votes_count = s.c, votes_sum = s.s
  from (select count(*) c, coalesce(sum(stars), 0) s from group_votes where group_prout_id = p.id) s where g.id = p.id;
  return query select g.votes_count, case when g.votes_count = 0 then 0 else round(g.votes_sum::numeric / g.votes_count, 1) end from group_prouts g where g.id = p.id;
end $$;

-- Retirer son prout du groupe (renvoie le chemin pour effacer le fichier côté client) ;
-- signaler un prout du groupe (masqué immédiatement : entre potes, on ne discute pas).
create or replace function delete_group_prout(p_device uuid, p_group_prout uuid) returns text
language plpgsql security definer set search_path = public as $$
declare v_path text;
begin
  delete from group_prouts p using members m where p.id = p_group_prout and m.id = p.member_id and m.device_id = p_device returning p.path into v_path;
  return v_path;
end $$;
create or replace function report_group_prout(p_device uuid, p_group_prout uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update group_prouts p set hidden = true
  where p.id = p_group_prout and exists (select 1 from members m where m.group_id = p.group_id and m.device_id = p_device);
end $$;

-- la policy « suppression des orphelins » couvre aussi les fichiers de groupe
drop policy if exists "prouts: suppression des orphelins" on storage.objects;
create policy "prouts: suppression des orphelins" on storage.objects
  for delete to anon, authenticated
  using (bucket_id = 'prouts'
         and not exists (select 1 from public.prouts p where p.path = storage.objects.name)
         and not exists (select 1 from public.group_prouts g where g.path = storage.objects.name));

grant execute on function create_group(uuid, text, text) to anon, authenticated;
grant execute on function join_group(uuid, text, text) to anon, authenticated;
grant execute on function leave_group(uuid, uuid) to anon, authenticated;
grant execute on function my_groups(uuid) to anon, authenticated;
grant execute on function group_members(uuid, uuid) to anon, authenticated;
grant execute on function group_gallery(uuid, uuid, int) to anon, authenticated;
grant execute on function publish_group_prout(uuid, uuid, text, text, text, int, text, text, text, int) to anon, authenticated;
grant execute on function guess_author(uuid, uuid, uuid) to anon, authenticated;
grant execute on function vote_group_prout(uuid, uuid, int) to anon, authenticated;
grant execute on function delete_group_prout(uuid, uuid) to anon, authenticated;
grant execute on function report_group_prout(uuid, uuid) to anon, authenticated;
revoke execute on function _member(uuid, uuid) from public, anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────
--  MODÉRATION (à la main, depuis le dashboard)
-- ─────────────────────────────────────────────────────────────────────────
--  Voir les signalements :   select p.initials, p.country, p.reports_count, r.* from reports r join prouts p on p.id = r.prout_id order by r.created_at desc;
--  Masquer un prout :        update prouts set hidden = true where id = '<uuid>';
--  Réhabiliter :             update prouts set hidden = false, reports_count = 0 where id = '<uuid>'; delete from reports where prout_id = '<uuid>';
--  Bannir des initiales :    insert into banned_initials values ('XXX');
