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
  if (s.db_bytes != null) {   // offre gratuite Supabase : 500 Mo de base, 1 Go de fichiers (à revérifier dans le dashboard si l'offre change)
    const mo = n => (n / 1048576).toFixed(1), pct = (n, max) => Math.round(n / max * 100);
    console.log(`monde : ${s.countries} pays (${(s.top_countries || []).map(c => c.country + ' ' + c.n).join(', ')}) · ${s.new_24h} publié(s) en 24 h · ${s.votes} votes · ${s.group_prouts} prouts de groupe`);
    console.log(`place : base ${mo(s.db_bytes)} Mo (${pct(s.db_bytes, 500 * 1048576)} % de 500 Mo) · fichiers ${mo(s.storage_bytes)} Mo en ${s.storage_files} fichiers (${pct(s.storage_bytes, 1024 * 1048576)} % de 1 Go)`);
    if (pct(s.db_bytes, 500 * 1048576) >= 70 || pct(s.storage_bytes, 1024 * 1048576) >= 70) console.log('⚠ PLUS DE 70 % DE L’OFFRE GRATUITE : prévoir le passage à l’offre payante ou un ménage');
  }
  const q = await rpc('admin_queue', { p_token: token });
  if (!q.length) console.log('file vide, rien à juger (le robot scripts/moderate.mjs trie toutes les 10 minutes).');
  for (const p of q) {
    const d = new Date(p.created_at);
    console.log(`- ${p.initials} ${p.country}${p.city ? ' · ' + p.city : ''} · ${p.species || '?'} · score ${p.jury} · ${d.toLocaleDateString('fr-FR')} ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} · ${p.votes} vote(s)${p.reports ? ' · ⚠ ' + p.reports + ' signalement(s)' : ''}${p.approved ? ' · en ligne' : ' · EN ATTENTE'}${p.hidden ? ' · masqué' : ''}`);
  }
  console.log('\nJuger : https://amui34.github.io/prout-box/admin.html');
} catch (e) { console.log('modération indisponible :', e.message); }
