// Point du matin : état App Store (versions, soumissions, builds) + modération Supabase (compteurs et file).
// Usage : node scripts/morning.mjs      (lit le jeton admin dans ~/.proutbox/admin-token.txt, jamais affiché)
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

console.log('═══ APP STORE ═══');
const st = spawnSync('node', [path.join(root, 'scripts/asc/asc_state.mjs')], { encoding: 'utf8' });
process.stdout.write((st.stdout || '').split('\n').slice(0, 8).join('\n') + '\n');
if (st.stderr) console.log('(asc_state :', st.stderr.trim().slice(0, 200), ')');

console.log('\n═══ MODÉRATION ═══');
const cfg = fs.readFileSync(path.join(root, 'www/supabase-config.js'), 'utf8');
const url = (cfg.match(/url:\s*'([^']+)'/) || [])[1], key = (cfg.match(/anonKey:\s*'([^']+)'/) || [])[1];
let token = '';
try { token = fs.readFileSync(path.join(os.homedir(), '.proutbox/admin-token.txt'), 'utf8').trim(); } catch { console.log('jeton admin introuvable (~/.proutbox/admin-token.txt)'); process.exit(0); }
const rpc = async (fn, args) => {
  const r = await fetch(`${url}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }, body: JSON.stringify(args) });
  if (!r.ok) throw new Error(fn + ' HTTP ' + r.status + ' ' + (await r.text()).slice(0, 200));
  return r.json();
};
try {
  const s = await rpc('admin_stats', { p_token: token });
  if (!s) { console.log('jeton admin refusé'); process.exit(0); }
  console.log(`à valider : ${s.pending} · signalés : ${s.reported} · en ligne : ${s.online} · masqués : ${s.hidden} · pionniers : ${s.pioneers} · groupes : ${s.groups}`);
  const q = await rpc('admin_queue', { p_token: token });
  if (!q.length) console.log('file vide, rien à juger.');
  for (const p of q) {
    const d = new Date(p.created_at);
    console.log(`- ${p.initials} ${p.country}${p.city ? ' · ' + p.city : ''} · ${p.species || '?'} · score ${p.jury} · ${d.toLocaleDateString('fr-FR')} ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} · ${p.votes} vote(s)${p.reports ? ' · ⚠ ' + p.reports + ' signalement(s)' : ''}${p.approved ? ' · en ligne' : ' · EN ATTENTE'}${p.hidden ? ' · masqué' : ''}`);
  }
  console.log('\nJuger : https://amui34.github.io/prout-box/admin.html');
} catch (e) { console.log('modération indisponible :', e.message); }
