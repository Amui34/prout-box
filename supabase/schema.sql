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
  jury          int  not null default 0 check (jury between 0 and 10000),
  path          text not null unique,            -- objet dans le bucket "prouts"
  mime          text not null default 'audio/mp4',
  votes_count   int  not null default 0,
  votes_sum     int  not null default 0,
  reports_count int  not null default 0,
  hidden        boolean not null default false,  -- masqué (signalements ou modération manuelle)
  created_at    timestamptz not null default now()
);
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
-- Pas de policy update/delete : seuls les RPC (definer) effacent.

-- ─────────────────────────────────────────────────────────────────────────
--  API (fonctions security definer, exposées à la clé publique)
-- ─────────────────────────────────────────────────────────────────────────

-- Publier un prout déjà déposé dans le bucket.
create or replace function publish_prout(
  p_device uuid, p_initials text, p_country text, p_species text, p_jury int, p_path text, p_mime text
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
  insert into prouts (device_id, initials, country, species, jury, path, mime)
  values (p_device, p_initials, p_country, left(coalesce(p_species, ''), 40), greatest(0, least(10000, coalesce(p_jury, 0))), p_path, left(coalesce(p_mime, 'audio/mp4'), 40))
  returning id into v_id;
  return v_id;
end $$;

-- Classement : par pays (p_country) ou mondial (null). Moyenne bayésienne pour éviter
-- qu'un seul vote à 5 prenne la tête : (somme + 3×3) / (nb + 3).
create or replace function top_prouts(p_device uuid, p_country text default null, p_limit int default 50)
returns table (
  id uuid, initials text, country text, species text, jury int, path text, mime text,
  votes int, avg numeric, my_stars int, mine boolean, created_at timestamptz
)
language sql security definer set search_path = public stable as $$
  select p.id, p.initials, p.country, p.species, p.jury, p.path, p.mime,
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

-- Supprimer SON prout (ligne + fichier).
create or replace function delete_prout(p_device uuid, p_prout uuid)
returns boolean
language plpgsql security definer set search_path = public as $$
declare v_path text;
begin
  delete from prouts where id = p_prout and device_id = p_device returning path into v_path;
  if v_path is null then return false; end if;
  begin
    delete from storage.objects where bucket_id = 'prouts' and name = v_path;
  exception when others then null; -- le fichier orphelin sera nettoyé à la main si besoin
  end;
  return true;
end $$;

grant execute on function publish_prout(uuid, text, text, text, int, text, text) to anon, authenticated;
grant execute on function top_prouts(uuid, text, int) to anon, authenticated;
grant execute on function vote_prout(uuid, uuid, int) to anon, authenticated;
grant execute on function report_prout(uuid, uuid, text) to anon, authenticated;
grant execute on function delete_prout(uuid, uuid) to anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────
--  MODÉRATION (à la main, depuis le dashboard)
-- ─────────────────────────────────────────────────────────────────────────
--  Voir les signalements :   select p.initials, p.country, p.reports_count, r.* from reports r join prouts p on p.id = r.prout_id order by r.created_at desc;
--  Masquer un prout :        update prouts set hidden = true where id = '<uuid>';
--  Réhabiliter :             update prouts set hidden = false, reports_count = 0 where id = '<uuid>'; delete from reports where prout_id = '<uuid>';
--  Bannir des initiales :    insert into banned_initials values ('XXX');
