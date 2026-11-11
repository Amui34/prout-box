// Découpe un WAV PCM en évènements sonores par détection de silence, écrit chaque évènement en WAV mono 16 bits normalisé.
// Usage : node segment.mjs src.wav outdir [gapSec] [minSec]
import fs from 'node:fs'; import path from 'node:path';
const [src, out, gapS = '0.45', minS = '0.12'] = process.argv.slice(2);
const b = fs.readFileSync(src);
let p = 12, fmt = null, data = null;
while (p + 8 <= b.length) { const id = b.toString('ascii', p, p + 4), sz = b.readUInt32LE(p + 4); if (id === 'fmt ') fmt = { tag: b.readUInt16LE(p + 8), ch: b.readUInt16LE(p + 10), sr: b.readUInt32LE(p + 12), bits: b.readUInt16LE(p + 22) }; if (id === 'data') { data = b.subarray(p + 8, Math.min(b.length, p + 8 + sz)); break; } p += 8 + sz + (sz & 1); }
if (!fmt || !data || (fmt.tag !== 1 && fmt.tag !== 0xFFFE)) throw new Error('WAV PCM attendu');
const { ch, sr, bits } = fmt, bps = bits / 8, n = Math.floor(data.length / (bps * ch)), x = new Float32Array(n);
for (let i = 0; i < n; i++) { let s = 0; for (let c = 0; c < ch; c++) { const o = (i * ch + c) * bps; s += bps === 3 ? data.readIntLE(o, 3) / 8388608 : bps === 2 ? data.readInt16LE(o) / 32768 : data.readInt32LE(o) / 2147483648; } x[i] = s / ch; }
const win = Math.floor(sr * .02), m = Math.floor(n / win), rms = new Float32Array(m);
for (let k = 0; k < m; k++) { let s = 0; for (let i = 0; i < win; i++) { const v = x[k * win + i]; s += v * v; } rms[k] = Math.sqrt(s / win); }
const sorted = Array.from(rms).sort((a, c) => a - c), noise = sorted[Math.floor(m * .2)], th = Math.max(noise * 4, .006);
const GAP = Math.round(+gapS / .02), segs = [];
for (let i = 0; i < m;) { if (rms[i] > th) { let j = i, last = i; while (j < m && j - last <= GAP) { if (rms[j] > th) last = j; j++; } segs.push([i, last + 1]); i = last + 1; } else i++; }
const keep = segs.filter(([a, c]) => (c - a) * .02 >= +minS);
console.log(`sr ${sr}, ${ch} canaux, ${bits} bits, durée ${(n / sr).toFixed(1)} s, bruit ${noise.toFixed(4)}, seuil ${th.toFixed(4)}, ${keep.length} évènements`);
fs.mkdirSync(out, { recursive: true }); const meta = [];
keep.forEach(([a, c], k) => {
  const s0 = Math.max(0, a * win - Math.round(.06 * sr)), s1 = Math.min(n, c * win + Math.round(.15 * sr)), len = s1 - s0;
  let pk = 0, e = 0; for (let i = s0; i < s1; i++) { const v = Math.abs(x[i]); if (v > pk) pk = v; e += v * v; }
  const g = Math.min(8, .89 / (pk || 1)), fade = Math.round(.01 * sr);          // normalisation au pic (-1 dB), gain plafonné
  const w = Buffer.alloc(44 + len * 2); w.write('RIFF', 0); w.writeUInt32LE(36 + len * 2, 4); w.write('WAVEfmt ', 8); w.writeUInt32LE(16, 16); w.writeUInt16LE(1, 20); w.writeUInt16LE(1, 22); w.writeUInt32LE(sr, 24); w.writeUInt32LE(sr * 2, 28); w.writeUInt16LE(2, 32); w.writeUInt16LE(16, 34); w.write('data', 36); w.writeUInt32LE(len * 2, 40);
  for (let i = 0; i < len; i++) { const f = Math.min(1, i / fade, (len - 1 - i) / fade); w.writeInt16LE(Math.round(Math.max(-1, Math.min(1, x[s0 + i] * g * f)) * 32767), 44 + i * 2); }
  const name = String(k + 1).padStart(2, '0') + '.wav'; fs.writeFileSync(path.join(out, name), w);
  meta.push({ file: name, t0: +(s0 / sr).toFixed(2), dur: +(len / sr).toFixed(2), peak: +pk.toFixed(3), rms: +Math.sqrt(e / len).toFixed(4), gain: +g.toFixed(2) });
  console.log(`${name}  t=${(s0 / sr).toFixed(2).padStart(7)} s  durée ${(len / sr).toFixed(2).padStart(5)} s  pic ${pk.toFixed(3)}  rms ${Math.sqrt(e / len).toFixed(4)}  gain ×${g.toFixed(1)}`);
});
fs.writeFileSync(path.join(out, 'segments.json'), JSON.stringify({ sr, segs: meta }, null, 1));
