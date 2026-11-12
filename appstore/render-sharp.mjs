// Habille les captures brutes (appstore/raw/<nom>.png, 1320 × 2868) en posters App Store avec sharp
// (pas de navigateur nécessaire) : fond jaune à pois, gros titre, sous-titre, capture dans un cadre à contour épais.
// Usage : node appstore/render-sharp.mjs <langue>   → appstore/screenshots/<langue>/proutbox-<nom>.png
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const W = 1320, H = 2868;
// Titres par langue. Captures brutes : appstore/raw/<langue>/<nom>.png → posters : appstore/screenshots/<langue>/proutbox-<nom>.png
const TITLES = {
  fr: {
    '1-groupes':  { title: ['TES AMIS,', 'TA GALERIE'],     sub: 'Un groupe privé, un code à 6 lettres' },
    '2-jury':     { title: ['UN JURY', 'IMPITOYABLE'],      sub: 'Mamie Josette, le Pr. Von Pfft et DJ Flatule' },
    '3-missions': { title: ['39 MÉDAILLES', 'À DÉCROCHER'], sub: 'Missions, médailles mystères et titres' },
    '4-top':      { title: ['LE CLASSEMENT', 'MONDIAL'],    sub: 'Par pays, noté de 1 à 5 par tout le monde' },
    '5-defis':    { title: ['DES DÉFIS', 'CHAQUE JOUR'],    sub: 'Le prout du jour et l’imitateur' },
    '6-boite':    { title: ['RETOURNE,', 'ÇA PROUT !'],     sub: 'Et pour s’échauffer : la boîte' }
  },
  en: {
    '1-groupes':  { title: ['YOUR FRIENDS,', 'YOUR GALLERY'], sub: 'A private group with a 6-letter code' },
    '2-jury':     { title: ['A MERCILESS', 'JURY'],           sub: 'Granny Josette, Prof. Von Pfft and DJ Flatule' },
    '3-missions': { title: ['39 MEDALS', 'TO EARN'],          sub: 'Missions, secret medals and titles' },
    '4-top':      { title: ['THE WORLD', 'RANKING'],          sub: 'By country, rated from 1 to 5 by everyone' },
    '5-defis':    { title: ['NEW DARES', 'EVERY DAY'],        sub: 'Toot of the day and the copycat' },
    '6-boite':    { title: ['FLIP IT,', 'IT TOOTS!'],         sub: 'And to warm up: the box' }
  },
  es: {
    '1-groupes':  { title: ['TUS AMIGOS,', 'TU GALERÍA'],     sub: 'Un grupo privado con un código de 6 letras' },
    '2-jury':     { title: ['UN JURADO', 'IMPLACABLE'],       sub: 'La Abuela Josefina, el Prof. Von Pfft y DJ Flatule' },
    '3-missions': { title: ['39 MEDALLAS', 'POR GANAR'],      sub: 'Misiones, medallas secretas y títulos' },
    '4-top':      { title: ['CLASIFICACIÓN', 'MUNDIAL'],      sub: 'Por país, puntuada del 1 al 5 por todos' },
    '5-defis':    { title: ['RETOS NUEVOS', 'CADA DÍA'],      sub: 'El pedo del día y el imitador' },
    '6-boite':    { title: ['DALE LA VUELTA', 'Y SUENA'],     sub: 'Y para calentar: la caja' }
  }
};
// Usage : node appstore/render-sharp.mjs <langue> [langue des captures]   (ex. « es en » : titres espagnols sur captures anglaises)
const LANG = process.argv[2] || 'fr', RAWLANG = process.argv[3] || LANG, SHOTS = TITLES[LANG];
if (!SHOTS) { console.log('langue inconnue :', LANG, '(', Object.keys(TITLES).join(', '), ')'); process.exit(1); }
const names = Object.keys(SHOTS);
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/'/g, '’');

// Cadre : largeur 1040 → hauteur 2260 (ratio 1320/2868), coin 150, bordure 14
const FW = 1040, FH = Math.round(FW * H / W), R = 150, B = 14, FX = (W - FW) / 2, FY = H - FH + 60;

function background(cfg) {
  const dots = [];
  for (let y = 60; y < H; y += 160) for (let x = 40; x < W; x += 160) dots.push(`<circle cx="${x}" cy="${y}" r="18" fill="#F2B705" opacity=".55"/>`);
  const t1 = esc(cfg.title[0]), t2 = esc(cfg.title[1] || '');
  const FS = Math.min(150, Math.floor(1180 / (Math.max(cfg.title[0].length, (cfg.title[1] || '').length) * .56)));
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <rect width="${W}" height="${H}" fill="#FFD23F"/>
    ${dots.join('')}
    <g font-family="Impact, 'Arial Black', Helvetica, sans-serif" font-weight="900" text-anchor="middle">
      <text x="${W / 2 + 10}" y="${310}" font-size="${FS}" fill="#2A1B12">${t1}</text>
      <text x="${W / 2}" y="${300}" font-size="${FS}" fill="#FF5A3C" stroke="#2A1B12" stroke-width="8" paint-order="stroke">${t1}</text>
      <text x="${W / 2 + 10}" y="${470}" font-size="${FS}" fill="#2A1B12">${t2}</text>
      <text x="${W / 2}" y="${460}" font-size="${FS}" fill="#FF5A3C" stroke="#2A1B12" stroke-width="8" paint-order="stroke">${t2}</text>
    </g>
    <text x="${W / 2}" y="${560}" font-family="Helvetica, Arial, sans-serif" font-weight="800" font-size="54" text-anchor="middle" fill="#2A1B12">${esc(cfg.sub)}</text>
    <rect x="${FX}" y="${FY + 50}" width="${FW}" height="${FH}" rx="${R}" fill="#2A1B12" opacity=".18"/>
    <rect x="${FX - B}" y="${FY - B}" width="${FW + 2 * B}" height="${FH + 2 * B}" rx="${R + B}" fill="#2A1B12"/>
  </svg>`);
}
function mask() {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${FW}" height="${FH}"><rect width="${FW}" height="${FH}" rx="${R}" fill="#fff"/></svg>`);
}

fs.mkdirSync(path.join(dir, 'screenshots', LANG), { recursive: true });
for (const n of names) {
  const raw = path.join(dir, 'raw', RAWLANG, n + '.png');
  if (!SHOTS[n] || !fs.existsSync(raw)) { console.log('… pas de capture brute pour', n); continue; }
  const shot = await sharp(raw).resize(FW, FH).composite([{ input: await sharp(mask()).png().toBuffer(), blend: 'dest-in' }]).png().toBuffer();
  const out = path.join(dir, 'screenshots', LANG, `proutbox-${n}.png`);
  await sharp(background(SHOTS[n])).composite([{ input: shot, left: FX, top: FY }]).png().toFile(out);
  console.log('✓', path.basename(out), `${W}×${H}`);
}
