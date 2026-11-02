// Habille les captures brutes (appstore/raw/<nom>.png, 1320 × 2868) en posters App Store avec sharp
// (pas de navigateur nécessaire) : fond jaune à pois, gros titre, sous-titre, capture dans un cadre à contour épais.
// Usage : node appstore/render-sharp.mjs [nom...]   → appstore/screenshots/proutbox-<nom>.png
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const W = 1320, H = 2868;
const SHOTS = {
  '1-boite':   { title: ['RETOURNE,', 'ÇA PROUT !'],        sub: 'La boîte à meuh qui pète' },
  '2-prout':   { title: ['PRRRT', 'RRT !'],                 sub: 'Six prouts synthétisés, tous différents' },
  '3-jury':    { title: ['UN JURY', 'IMPITOYABLE'],         sub: 'Mamie Josette, le Pr. Von Pfft et DJ Flatule' },
  '4-top':     { title: ['GRIMPE AU', 'TOP PROUTS'],        sub: 'Classement par pays, noté de 1 à 5 crottes' },
  '5-medailles': { title: ['14 MÉDAILLES', 'À DÉCROCHER'],  sub: 'Prout d’or, Marathonien, Fin nez… et le défi du jour' },
  '6-groupes': { title: ['TES POTES,', 'TES DÉFIS'],        sub: 'Galerie privée, « Qui a pété ? », l’imitateur' }
};
const names = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SHOTS);
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/'/g, '’');

// Cadre : largeur 1040 → hauteur 2260 (ratio 1320/2868), coin 150, bordure 14
const FW = 1040, FH = Math.round(FW * H / W), R = 150, B = 14, FX = (W - FW) / 2, FY = H - FH + 60;

function background(cfg) {
  const dots = [];
  for (let y = 60; y < H; y += 160) for (let x = 40; x < W; x += 160) dots.push(`<circle cx="${x}" cy="${y}" r="18" fill="#F2B705" opacity=".55"/>`);
  const t1 = esc(cfg.title[0]), t2 = esc(cfg.title[1] || '');
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <rect width="${W}" height="${H}" fill="#FFD23F"/>
    ${dots.join('')}
    <g font-family="Impact, 'Arial Black', Helvetica, sans-serif" font-weight="900" text-anchor="middle">
      <text x="${W / 2 + 10}" y="${310}" font-size="150" fill="#2A1B12">${t1}</text>
      <text x="${W / 2}" y="${300}" font-size="150" fill="#FF5A3C" stroke="#2A1B12" stroke-width="8" paint-order="stroke">${t1}</text>
      <text x="${W / 2 + 10}" y="${470}" font-size="150" fill="#2A1B12">${t2}</text>
      <text x="${W / 2}" y="${460}" font-size="150" fill="#FF5A3C" stroke="#2A1B12" stroke-width="8" paint-order="stroke">${t2}</text>
    </g>
    <text x="${W / 2}" y="${560}" font-family="Helvetica, Arial, sans-serif" font-weight="800" font-size="54" text-anchor="middle" fill="#2A1B12">${esc(cfg.sub)}</text>
    <rect x="${FX}" y="${FY + 50}" width="${FW}" height="${FH}" rx="${R}" fill="#2A1B12" opacity=".18"/>
    <rect x="${FX - B}" y="${FY - B}" width="${FW + 2 * B}" height="${FH + 2 * B}" rx="${R + B}" fill="#2A1B12"/>
  </svg>`);
}
function mask() {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${FW}" height="${FH}"><rect width="${FW}" height="${FH}" rx="${R}" fill="#fff"/></svg>`);
}

fs.mkdirSync(path.join(dir, 'screenshots'), { recursive: true });
for (const n of names) {
  const raw = path.join(dir, 'raw', n + '.png');
  if (!SHOTS[n] || !fs.existsSync(raw)) { console.log('… pas de capture brute pour', n); continue; }
  const shot = await sharp(raw).resize(FW, FH).composite([{ input: await sharp(mask()).png().toBuffer(), blend: 'dest-in' }]).png().toBuffer();
  const out = path.join(dir, 'screenshots', `proutbox-${n}.png`);
  await sharp(background(SHOTS[n])).composite([{ input: shot, left: FX, top: FY }]).png().toFile(out);
  console.log('✓', path.basename(out), `${W}×${H}`);
}
