// Modération automatique du TOP PROUTS : écoute chaque prout en attente à la place de Noa.
//   - décode l'audio (ffmpeg, sinon afconvert sur macOS) et le passe dans le Prout-o-mètre de l'app
//     (voiceScore et la boucle d'analyse sont extraits de www/index.html : une seule source de vérité) ;
//   - verdict « prout » (moins de 45 % de son « chanté ») → publié (admin_decide ok)
//   - verdict « voix » (une phrase clairement articulée)   → refusé (admin_decide hide)
//   - rien d'audible → refusé (enregistrement vide)
//   - verdict « doute » (prout très chantant ou voix brève), trop long ou illisible → laissé dans la file
//     « À valider » pour une écoute humaine. Calibrage : 47 vrais pets et 26 voix, voir CLAUDE.md.
// Usage : node scripts/moderate.mjs [--dry-run]
// Jeton : variable PROUTBOX_ADMIN_TOKEN (GitHub Actions) ou ~/.proutbox/admin-token.txt. Jamais affiché.
// Journal volontairement pauvre (le dépôt est public) : ni initiales, ni chemin (il contient le device_id).
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process'; import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DRY = process.argv.includes('--dry-run');
export const MAX_SECONDS = 7, MIN_ACTIVE = .1;

// --- le Prout-o-mètre de l'app, sur du PCM mono ---
const html = fs.readFileSync(path.join(root, 'www/index.html'), 'utf8');
const grab = name => { const m = html.match(new RegExp('  function ' + name + '\\([^)]*\\) \\{[\\s\\S]*?\\n  \\}\\n')); if (!m) throw new Error(name + ' introuvable dans www/index.html'); return m[0]; };
const { voiceCheck } = new Function(grab('fftInPlace') + grab('voiceCheck') + 'return { voiceCheck };')();
export function measure(d, sr) {                                       // même boucle que analyzeBlob
  const win = Math.max(1, Math.floor(sr / 50)); let peak = 0, th = .03, active = 0, bursts = 0, gap = 99, sum = 0;
  for (let i = 0; i < d.length; i += win) { let s = 0; const n = Math.min(win, d.length - i); for (let j = 0; j < n; j++) { const x = d[i + j]; s += x * x; if (x > peak) peak = x; else if (-x > peak) peak = -x; } const rms = Math.sqrt(s / n); if (rms > th) { active++; sum += rms; if (gap >= 3) bursts++; gap = 0; } else gap++; }
  const dur = active / 50, loud = Math.min(1, (active ? sum / active : 0) / .2);
  const vc = voiceCheck(d, sr, th);
  return { seconds: d.length / sr, active: dur, score: Math.round(loud * 5000 + Math.min(1, dur / 4) * 3000 + Math.min(1, peak / .9) * 1500 + Math.min(10, bursts) * 50), voice: vc.voice, heard: vc.verdict };
}
export function verdict(m) {
  if (m.active < MIN_ACTIVE) return ['hide', 'rien d’audible'];
  if (m.heard === 'voix') return ['hide', 'voix'];
  if (m.seconds > MAX_SECONDS) return ['wait', 'trop long'];
  if (m.heard === 'doute') return ['wait', 'prout chantant ou voix brève'];
  return ['ok', 'prout'];
}
// --- décodage : n'importe quel format du bucket → WAV mono 16 bits 44,1 kHz ---
const has = cmd => spawnSync('which', [cmd]).status === 0;
export function decode(file) {
  const wav = file + '.wav';
  if (has('ffmpeg')) execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', file, '-ac', '1', '-ar', '44100', '-c:a', 'pcm_s16le', wav]);
  else execFileSync('afconvert', ['-f', 'WAVE', '-d', 'LEI16@44100', '-c', '1', file, wav]);
  const b = fs.readFileSync(wav); let p = 12, sr = 44100, data = null;
  while (p + 8 <= b.length) { const id = b.toString('ascii', p, p + 4), sz = b.readUInt32LE(p + 4); if (id === 'fmt ') sr = b.readUInt32LE(p + 12); if (id === 'data') { data = b.subarray(p + 8, Math.min(b.length, p + 8 + sz)); break; } p += 8 + sz + (sz & 1); }
  if (!data) throw new Error('WAV sans données');
  const n = Math.floor(data.length / 2), d = new Float32Array(n); for (let i = 0; i < n; i++) d[i] = data.readInt16LE(i * 2) / 32768;
  return { d, sr };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const cfg = fs.readFileSync(path.join(root, 'www/supabase-config.js'), 'utf8');
  const url = cfg.match(/url:\s*'([^']+)'/)[1], key = cfg.match(/anonKey:\s*'([^']+)'/)[1];
  let token = (process.env.PROUTBOX_ADMIN_TOKEN || '').trim();
  if (!token) try { token = fs.readFileSync(path.join(os.homedir(), '.proutbox/admin-token.txt'), 'utf8').trim(); } catch { console.log('jeton admin absent'); process.exit(1); }
  const H = { apikey: key, Authorization: 'Bearer ' + key };
  const rpc = async (fn, args) => { const r = await fetch(`${url}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify(args) }); if (!r.ok) throw new Error(fn + ' HTTP ' + r.status); const t = await r.text(); return t ? JSON.parse(t) : null; };
  const queue = ((await rpc('admin_queue', { p_token: token })) || []).filter(p => !p.approved && !p.hidden);
  if (!queue.length) { console.log('file vide'); process.exit(0); }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'proutbox-mod-')); const tally = { ok: 0, hide: 0, wait: 0 };
  for (const p of queue) {
    const tag = p.id.slice(0, 8); let action = 'wait', why = 'illisible', m = null;
    try {
      const r = await fetch(`${url}/storage/v1/object/public/prouts/${p.path}`); if (!r.ok) throw new Error('fichier HTTP ' + r.status);
      const f = path.join(tmp, tag); fs.writeFileSync(f, Buffer.from(await r.arrayBuffer()));
      const { d, sr } = decode(f); m = measure(d, sr); [action, why] = verdict(m);
    } catch (e) { why = 'illisible (' + String(e.message).slice(0, 60) + ')'; }
    if (action !== 'wait' && !DRY) await rpc('admin_decide', { p_token: token, p_prout: p.id, p_action: action });
    tally[action]++;
    console.log(`${tag}  ${action === 'ok' ? 'PUBLIÉ ' : action === 'hide' ? 'REFUSÉ ' : 'EN FILE'}  ${why}` + (m ? `  · ${m.seconds.toFixed(1)} s, chanté à ${m.voice} %, score mesuré ${m.score} (déclaré ${p.jury})` : '') + (DRY ? '  [essai]' : ''));
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`${tally.ok} publié(s), ${tally.hide} refusé(s), ${tally.wait} laissé(s) à une écoute humaine`);
}
