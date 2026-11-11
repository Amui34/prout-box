// Publie des clips « maison » (vrais pets sous licence libre) dans le TOP PROUTS, signés PBX, puis les valide.
// Usage : node scripts/seed/publish.mjs <analysis.json> <dossier des clips> <set> <pays> <crédit> <clip,clip,...>
//   ex. : node scripts/seed/publish.mjs /tmp/seed/analysis.json /tmp/seed yle FR "Archives Yle" 12,24,10
// Le « device » maison (~/.proutbox/house-device.txt) et le jeton admin (~/.proutbox/admin-token.txt) restent hors dépôt.
// L'ordre compte : à égalité de votes le classement montre le plus récent d'abord, donc le dernier publié arrive en tête.
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process'; import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const [analysisFile, clipsRoot, set, country, credit, list] = process.argv.slice(2);
if (!list) { console.log('usage: publish.mjs <analysis.json> <dossier> <set> <pays> <crédit> <n,n,...>'); process.exit(1); }
const cfg = fs.readFileSync(path.join(root, 'www/supabase-config.js'), 'utf8');
const url = cfg.match(/url:\s*'([^']+)'/)[1], key = cfg.match(/anonKey:\s*'([^']+)'/)[1];
const home = path.join(os.homedir(), '.proutbox'), devFile = path.join(home, 'house-device.txt');
if (!fs.existsSync(devFile)) fs.writeFileSync(devFile, crypto.randomUUID() + '\n', { mode: 0o600 });
const device = fs.readFileSync(devFile, 'utf8').trim(), token = fs.readFileSync(path.join(home, 'admin-token.txt'), 'utf8').trim();
const H = { apikey: key, Authorization: 'Bearer ' + key };
const rpc = async (fn, args) => {
  const r = await fetch(`${url}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify(args) });
  const t = await r.text(); if (!r.ok) throw new Error(fn + ' ' + r.status + ' ' + t.slice(0, 200)); return t ? JSON.parse(t) : null;
};
const analysis = JSON.parse(fs.readFileSync(analysisFile, 'utf8')), done = [];
for (const n of list.split(',')) {
  const file = n.padStart(2, '0') + '.wav', st = analysis.find(a => a.dir === set && a.file === file);
  if (!st) { console.log('clip inconnu', set, file); continue; }
  if (st.voice >= 40) { console.log('recalé (voix)', set, file); continue; }
  const wav = path.join(clipsRoot, set, file), m4a = wav.replace(/\.wav$/, '.m4a');
  execFileSync('afconvert', ['-f', 'm4af', '-d', 'aac', '-b', '64000', wav, m4a]);
  const buf = fs.readFileSync(m4a), name = `pbx-${set}-${n.padStart(2, '0')}.m4a`, p = `${device}/${name}`;
  const up = await fetch(`${url}/storage/v1/object/prouts/${p}`, { method: 'POST', headers: { ...H, 'Content-Type': 'audio/mp4', 'x-upsert': 'false' }, body: buf });
  if (!up.ok) { console.log('dépôt refusé', name, up.status, (await up.text()).slice(0, 150)); continue; }
  const id = await rpc('publish_prout', { p_device: device, p_initials: 'PBX', p_country: country, p_species: st.species, p_jury: st.score, p_path: p, p_mime: 'audio/mp4', p_city: credit });
  await rpc('admin_decide', { p_token: token, p_prout: id, p_action: 'ok' });
  done.push({ id, clip: `${set}/${file}`, file: name, country, credit, species: st.species, score: st.score, seconds: st.len, voice: st.voice, bytes: buf.length });
  console.log('✓', name, `${Math.round(buf.length / 1024)} Ko`, st.species, st.score);
}
const man = path.join(root, 'scripts/seed/manifest.json'), prev = fs.existsSync(man) ? JSON.parse(fs.readFileSync(man, 'utf8')) : [];
fs.writeFileSync(man, JSON.stringify(prev.concat(done), null, 1) + '\n');
console.log(done.length, 'prouts maison publiés et validés');
