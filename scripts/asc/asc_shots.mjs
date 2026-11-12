// Remplace les captures iPhone 6,9" (APP_IPHONE_67) d'une langue de la version donnée par les PNG d'appstore/screenshots/<dossier>/.
// Usage : node scripts/asc/asc_shots.mjs <version> [locale=fr-FR] [dossier=fr]   (ex. 1.3 en-US en ; 1.3 es-MX es)
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
import { req, APP } from './asc_lib.mjs';
const [VERSION, LOCALE = 'fr-FR', SUB = 'fr'] = process.argv.slice(2); if (!VERSION) { console.log('usage: asc_shots.mjs <version> [locale] [dossier]'); process.exit(1); }
const DIR = path.resolve('appstore/screenshots', SUB);
const files = fs.readdirSync(DIR).filter(f => /^proutbox-\d.*\.png$/.test(f)).sort();
if (!files.length) { console.log('aucun poster dans', DIR); process.exit(1); }
const die = (what, r) => { console.log('ERREUR', what, r.status, JSON.stringify(r.j).slice(0, 400)); process.exit(1); };
const vs = await req('GET', `/v1/apps/${APP}/appStoreVersions?limit=5`);
const v = (vs.j.data || []).find(x => x.attributes.versionString === VERSION); if (!v) { console.log(VERSION, 'introuvable'); process.exit(1); }
const locs = await req('GET', `/v1/appStoreVersions/${v.id}/appStoreVersionLocalizations`);
const loc = (locs.j.data || []).find(l => l.attributes.locale === LOCALE); if (!loc) { console.log('langue', LOCALE, 'absente de la version (asc_listing.mjs la crée)'); process.exit(1); }
const sets = await req('GET', `/v1/appStoreVersionLocalizations/${loc.id}/appScreenshotSets`);
let set = (sets.j.data || []).find(s => s.attributes.screenshotDisplayType === 'APP_IPHONE_67');
if (!set) { const c = await req('POST', '/v1/appScreenshotSets', { data: { type: 'appScreenshotSets', attributes: { screenshotDisplayType: 'APP_IPHONE_67' }, relationships: { appStoreVersionLocalization: { data: { type: 'appStoreVersionLocalizations', id: loc.id } } } } }); if (c.status >= 300) die('set', c); set = c.j.data; }
const existing = await req('GET', `/v1/appScreenshotSets/${set.id}/appScreenshots`);
for (const s of existing.j.data || []) { const d = await req('DELETE', `/v1/appScreenshots/${s.id}`); if (d.status >= 300) die('suppression', d); }
console.log('anciennes captures supprimées :', (existing.j.data || []).length);
for (const f of files) {
  const buf = fs.readFileSync(path.join(DIR, f));
  const r = await req('POST', '/v1/appScreenshots', { data: { type: 'appScreenshots', attributes: { fileName: f, fileSize: buf.length }, relationships: { appScreenshotSet: { data: { type: 'appScreenshotSets', id: set.id } } } } });
  if (r.status >= 300) die('réserve ' + f, r);
  for (const op of r.j.data.attributes.uploadOperations) {
    const h = {}; for (const x of op.requestHeaders) h[x.name] = x.value;
    const up = await fetch(op.url, { method: op.method, headers: h, body: buf.subarray(op.offset, op.offset + op.length) });
    if (!up.ok) { console.log('ERREUR upload', f, up.status); process.exit(1); }
  }
  const c = await req('PATCH', `/v1/appScreenshots/${r.j.data.id}`, { data: { type: 'appScreenshots', id: r.j.data.id, attributes: { uploaded: true, sourceFileChecksum: crypto.createHash('md5').update(buf).digest('hex') } } });
  if (c.status >= 300) die('commit ' + f, c);
  console.log('✓', f);
}
console.log('CAPTURES OK pour', VERSION, LOCALE);
