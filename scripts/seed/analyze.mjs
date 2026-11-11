// Passe des clips WAV mono 16 bits dans le Prout-o-mètre de l'app (mêmes fonctions, extraites de www/index.html).
// Usage : node analyze.mjs <index.html> <dossier de clips>...
import fs from 'node:fs'; import path from 'node:path';
const [html, ...dirs] = process.argv.slice(2);
const src = fs.readFileSync(html, 'utf8');
const grab = name => { const m = src.match(new RegExp('  function ' + name + '\\([^)]*\\) \\{[\\s\\S]*?\\n  \\}\\n')); if (!m) throw new Error(name + ' introuvable'); return m[0]; };
const { voiceScore, species } = new Function(grab('voiceScore') + grab('species') + 'return { voiceScore, species };')();
function analyze(d, sr) {                                  // copie conforme de la boucle d'analyzeBlob
  const win = Math.max(1, Math.floor(sr / 50)); let peak = 0, th = .03, active = 0, bursts = 0, gap = 99, sum = 0;
  for (let i = 0; i < d.length; i += win) { let s = 0; const n = Math.min(win, d.length - i); for (let j = 0; j < n; j++) { const x = d[i + j]; s += x * x; if (x > peak) peak = x; else if (-x > peak) peak = -x; } const rms = Math.sqrt(s / n); if (rms > th) { active++; sum += rms; if (gap >= 3) bursts++; gap = 0; } else gap++; }
  const dur = active / 50, loud = Math.min(1, (active ? sum / active : 0) / .2), pk = Math.min(1, peak / .9), dd = Math.min(1, dur / 4), bb = Math.min(10, bursts);
  const st = { score: Math.round(loud * 5000 + dd * 3000 + pk * 1500 + bb * 50), loud, dur: dd, peak: pk, bursts: bb / 10, len: Math.round(d.length / sr * 10) / 10 };
  st.voice = voiceScore(d, sr, th); st.species = species(st); return st;
}
const out = [];
for (const dir of dirs) for (const f of fs.readdirSync(dir).filter(f => /^\d+\.wav$/.test(f)).sort()) {
  const b = fs.readFileSync(path.join(dir, f)), sr = b.readUInt32LE(24), n = (b.length - 44) / 2, d = new Float32Array(n);
  for (let i = 0; i < n; i++) d[i] = b.readInt16LE(44 + i * 2) / 32768;
  const st = analyze(d, sr); out.push({ dir: path.basename(dir), file: f, ...st });
  console.log(`${path.basename(dir).padEnd(6)} ${f}  ${String(st.len).padStart(4)} s  score ${String(st.score).padStart(5)}  voix ${String(st.voice).padStart(3)} %  rafales ${st.bursts * 10}  ${st.species}`);
}
fs.writeFileSync(path.join(path.dirname(dirs[0]), 'analysis.json'), JSON.stringify(out, null, 1));
const v = out.filter(o => o.voice >= 40).length; console.log(`\n${out.length} clips, ${v} recalés par le détecteur de voix (${Math.round(v / out.length * 100)} %)`);
