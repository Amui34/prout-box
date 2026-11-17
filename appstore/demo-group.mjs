// Remplit un groupe de démonstration pour les captures App Store : trois potes (LEA, TOM, JULIE) rejoignent le
// groupe dont on donne le code, envoient des prouts (libres, prout du jour, imitation) et se notent entre eux.
// Tout passe par les mêmes appels publics que l'app (clé publishable de www/supabase-config.js), dans un groupe
// PRIVÉ créé à la main sur le simulateur : rien n'apparaît dans le TOP PROUTS public.
// Les prouts envoyés sont des sons de synthèse (bruit + dent de scie), pas des enregistrements.
// Usage : node appstore/demo-group.mjs <CODE>            (rejoindre et remplir)
//         node appstore/demo-group.mjs <CODE> --leave    (les trois potes retirent leurs prouts et quittent le groupe)
// Les identifiants d'appareil des potes sont gardés dans ~/.proutbox/demo-friends.json (hors dépôt).
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import vm from 'node:vm'; import crypto from 'node:crypto'; import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const code = (process.argv[2] || '').toUpperCase(), leave = process.argv.includes('--leave');
if (!/^[A-Z]{6}$/.test(code)) { console.log('usage : node appstore/demo-group.mjs <CODE à 6 lettres> [--leave]'); process.exit(1); }

const cfg = { window: {} }; vm.createContext(cfg); vm.runInContext(fs.readFileSync(path.join(root, 'www/supabase-config.js'), 'utf8'), cfg);
const SB = cfg.window.PROUTBOX_SUPABASE, H = { apikey: SB.anonKey, Authorization: 'Bearer ' + SB.anonKey };
async function rpc(fn, args) {
  const r = await fetch(`${SB.url}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify(args) });
  const t = await r.text(); if (!r.ok) throw new Error(`${fn} : ${t}`); return t ? JSON.parse(t) : null;
}

// même thème du jour que l'app (THEMES et calcul extraits de www/index.html)
const html = fs.readFileSync(path.join(root, 'www/index.html'), 'utf8');
const THEMES = new Function('return ' + html.match(/var THEMES = (\[[^\]]*\]);/)[1])();
const now = new Date(), theme = THEMES[Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000) % THEMES.length];

// un « prout » de synthèse : dent de scie grave + bruit, découpés par une enveloppe irrégulière (WAV mono 16 bits)
function wav(seed, dur, f0, bursts) {
  const sr = 22050, n = Math.round(sr * dur), pcm = Buffer.alloc(44 + n * 2); let s = seed;
  const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  pcm.write('RIFF', 0); pcm.writeUInt32LE(36 + n * 2, 4); pcm.write('WAVEfmt ', 8); pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(1, 22);
  pcm.writeUInt32LE(sr, 24); pcm.writeUInt32LE(sr * 2, 28); pcm.writeUInt16LE(2, 32); pcm.writeUInt16LE(16, 34); pcm.write('data', 36); pcm.writeUInt32LE(n * 2, 40);
  let ph = 0, lp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n, f = f0 * (1 - .35 * t) * (1 + .08 * Math.sin(i / sr * 31));
    ph = (ph + f / sr) % 1; lp += ((rnd() * 2 - 1) - lp) * .12;
    const gate = Math.sin(Math.PI * t) ** .5 * (.55 + .45 * Math.sign(Math.sin(2 * Math.PI * bursts * t * (1 + .3 * t))));
    pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, ((ph * 2 - 1) * .55 + lp * 1.6) * gate * .8)) * 32767), 44 + i * 2);
  }
  return pcm;
}

const store = path.join(os.homedir(), '.proutbox', 'demo-friends.json');
const saved = fs.existsSync(store) ? JSON.parse(fs.readFileSync(store, 'utf8')) : {};
const FRIENDS = ['LEA', 'TOM', 'JULIE'].map(pseudo => ({ pseudo, device: (saved[pseudo] = saved[pseudo] || crypto.randomUUID()) }));
fs.mkdirSync(path.dirname(store), { recursive: true }); fs.writeFileSync(store, JSON.stringify(saved, null, 1), { mode: 0o600 });

if (leave) {
  for (const f of FRIENDS) {
    const g = (await rpc('my_groups', { p_device: f.device })).find(x => x.code === code);
    if (!g) { console.log(f.pseudo, ': pas dans ce groupe'); continue; }
    for (const row of (await rpc('group_gallery', { p_device: f.device, p_group: g.id, p_limit: 200 })).filter(r => r.mine)) {
      const p = await rpc('delete_group_prout', { p_device: f.device, p_group_prout: row.id });
      if (p) await fetch(`${SB.url}/storage/v1/object/prouts/${p}`, { method: 'DELETE', headers: H });
    }
    await rpc('leave_group', { p_device: f.device, p_group: g.id }); console.log(f.pseudo, ': prouts retirés, groupe quitté');
  }
  process.exit(0);
}

// qui envoie quoi : [pote, genre, espèce, score du jury, {durée, hauteur, rafales}, cible et ressemblance pour une imitation]
const PLAN = [
  ['LEA', 'libre', 'LA TROMPETTE DE JÉRICHO', 7412, [1.6, 150, 3]],
  ['TOM', 'libre', 'LA MITRAILLETTE', 8120, [1.9, 110, 9]],
  ['JULIE', 'jour', 'LE PNEU QUI SE DÉGONFLE', 5230, [2.8, 95, 2]],
  ['LEA', 'jour', 'LE SERPENT SOURNOIS', 3890, [3.2, 80, 1]],
  ['TOM', 'imitation', 'LE COUSSIN PÉTEUR', 6140, [1.2, 130, 4], 'trompette', 87],
  ['JULIE', 'libre', 'LA SOURIS TIMIDE', 1830, [.7, 210, 1]]
];
const group = {};
for (const f of FRIENDS) {
  const mine = (await rpc('my_groups', { p_device: f.device })).find(x => x.code === code);
  group[f.pseudo] = mine || (await rpc('join_group', { p_device: f.device, p_code: code, p_pseudo: f.pseudo }))[0];
  console.log(f.pseudo, mine ? ': déjà dans' : ': rejoint', group[f.pseudo].name);
}
let k = 0;
for (const [who, kind, species, jury, [dur, f0, bursts], target, sim] of PLAN) {
  const f = FRIENDS.find(x => x.pseudo === who), file = `${f.device}/gdemo-${Date.now().toString(36)}-${k++}.wav`;
  const up = await fetch(`${SB.url}/storage/v1/object/prouts/${file}`, { method: 'POST', headers: { ...H, 'Content-Type': 'audio/wav', 'x-upsert': 'false' }, body: wav(1000 + k * 77, dur, f0, bursts) });
  if (!up.ok) throw new Error('dépôt : ' + await up.text());
  await rpc('publish_group_prout', { p_device: f.device, p_group: group[who].id, p_path: file, p_mime: 'audio/wav', p_species: species, p_jury: jury, p_kind: kind, p_theme: kind === 'jour' ? theme : null, p_target: target || null, p_similarity: sim == null ? null : sim });
  console.log(who, '→', kind, species);
}
// les potes se notent entre eux (jamais son propre prout)
const STARS = [5, 4, 3, 5, 4, 2, 4, 5, 3];
let v = 0;
for (const f of FRIENDS) for (const row of (await rpc('group_gallery', { p_device: f.device, p_group: group[f.pseudo].id, p_limit: 200 })).filter(r => !r.mine).slice(0, 3)) {
  try { await rpc('vote_group_prout', { p_device: f.device, p_group_prout: row.id, p_stars: STARS[v++ % STARS.length] }); } catch (e) { console.log('vote ignoré :', e.message.slice(0, 80)); }
}
console.log('✓ groupe', code, 'rempli · thème du jour :', theme);
