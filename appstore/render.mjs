// Habille les captures brutes (appstore/raw/*.png, 1320 × 2868) en posters App Store :
// gros titre façon Prout Box en haut, capture dans un cadre à contour épais en dessous.
// Usage : node appstore/render.mjs [nom...]   → appstore/screenshots/proutbox-<nom>.png
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const W = 1320, H = 2868; // 6,9" (iPhone 17 Pro Max). App Store Connect redimensionne pour les autres tailles.
const SHOTS = {
  '1-boite':    { title: 'Retourne,<br>ça prout !',        sub: 'La boîte à meuh qui pète' },
  '2-prout':    { title: 'PRRRT<br>RRT !',                  sub: 'Six prouts synthétisés, tous différents' },
  '3-jury':     { title: 'Un jury<br>impitoyable',          sub: 'Mamie Josette, le Pr. Von Pfft et DJ Flatule' },
  '4-top':      { title: 'Grimpe au<br>TOP PROUTS',         sub: 'Classement façon borne d’arcade' },
  '5-enregistre': { title: 'Enregistre<br>le tien',         sub: '6 secondes pour entrer dans la légende' }
};
const names = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SHOTS);

const page = (name, cfg) => `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Luckiest+Guy&family=Nunito:wght@800;900&display=swap" rel="stylesheet">
<style>
  html, body { margin: 0; width: ${W}px; height: ${H}px; overflow: hidden; }
  body { background: #FFD23F; font-family: Nunito, system-ui, sans-serif; color: #2A1B12; position: relative; }
  .dots { position: absolute; inset: 0; background-image: radial-gradient(#F2B705 18px, transparent 19px); background-size: 160px 160px; background-position: 40px 60px; opacity: .55; }
  h1 { position: relative; margin: 150px 80px 0; font: 400 150px/1.02 'Luckiest Guy', 'Arial Black', Impact, sans-serif; text-align: center; letter-spacing: 2px;
       color: #FF5A3C; -webkit-text-stroke: 6px #2A1B12; paint-order: stroke fill; text-shadow: 12px 12px 0 #2A1B12; }
  p { position: relative; margin: 36px 120px 0; font-size: 54px; font-weight: 900; text-align: center; line-height: 1.25; }
  .frame { position: absolute; left: 50%; bottom: -60px; transform: translateX(-50%); width: 1040px; height: 2260px; border: 14px solid #2A1B12; border-radius: 150px;
           overflow: hidden; background: #2A1B12; box-shadow: 0 50px 0 rgba(42,27,18,.18); }
  .frame img { display: block; width: 100%; height: 100%; object-fit: cover; }
</style></head><body>
  <div class="dots"></div>
  <h1>${cfg.title}</h1>
  <p>${cfg.sub}</p>
  <div class="frame"><img src="file://${path.join(dir, 'raw', name + '.png')}" alt=""></div>
</body></html>`;

fs.mkdirSync(path.join(dir, 'screenshots'), { recursive: true });
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: W, height: H } });
for (const n of names) {
  const raw = path.join(dir, 'raw', n + '.png');
  if (!SHOTS[n] || !fs.existsSync(raw)) { console.log('… pas de capture brute pour', n); continue; }
  const html = path.join(dir, 'screenshots', `poster_${n}.html`);
  fs.writeFileSync(html, page(n, SHOTS[n]));
  await pg.goto('file://' + html);
  await pg.waitForTimeout(1500); // polices
  const out = path.join(dir, 'screenshots', `proutbox-${n}.png`);
  await pg.screenshot({ path: out, clip: { x: 0, y: 0, width: W, height: H } });
  fs.unlinkSync(html);
  console.log('✓', path.basename(out), `${W}×${H}`);
}
await b.close();
