// Crée (ou retrouve) une version App Store, pose les notes de version, attache un build traité et soumet à la révision.
// Usage : node scripts/asc/asc_release.mjs <version> <build> [fichier-notes.txt]
//   ex. : node scripts/asc/asc_release.mjs 1.1 3 appstore/notes-1.1.txt
import fs from 'node:fs';
import { req, APP, sleep } from './asc_lib.mjs';
const NO_SUBMIT = process.argv.includes('--no-submit'); // prépare la version (notes + build) sans la soumettre
const [VERSION, BUILD, NOTES_FILE] = process.argv.slice(2).filter(a => !a.startsWith('--'));
if (!VERSION || !BUILD) { console.log('usage: asc_release.mjs <version> <build> [notes.txt] [--no-submit]'); process.exit(1); }
const NOTES = NOTES_FILE ? fs.readFileSync(NOTES_FILE, 'utf8').trim() : null;
const die = (what, r) => { console.log('ERREUR', what, r.status, JSON.stringify(r.j).slice(0, 500)); process.exit(1); };

// 1) version
const vs = await req('GET', `/v1/apps/${APP}/appStoreVersions?filter[platform]=IOS&limit=10`);
let v = (vs.j.data || []).find(x => x.attributes.versionString === VERSION);
if (!v) {
  const c = await req('POST', '/v1/appStoreVersions', { data: { type: 'appStoreVersions', attributes: { platform: 'IOS', versionString: VERSION, releaseType: 'AFTER_APPROVAL' }, relationships: { app: { data: { type: 'apps', id: APP } } } } });
  if (c.status >= 300) die('création version', c); v = c.j.data; console.log('1) version', VERSION, 'créée');
} else console.log('1) version', VERSION, 'existe :', v.attributes.appVersionState || v.attributes.appStoreState);

// 2) notes de version (fr-FR)
if (NOTES) {
  const locs = await req('GET', `/v1/appStoreVersions/${v.id}/appStoreVersionLocalizations`);
  let loc = (locs.j.data || []).find(l => l.attributes.locale === 'fr-FR');
  if (!loc) { const c = await req('POST', '/v1/appStoreVersionLocalizations', { data: { type: 'appStoreVersionLocalizations', attributes: { locale: 'fr-FR' }, relationships: { appStoreVersion: { data: { type: 'appStoreVersions', id: v.id } } } } }); if (c.status >= 300) die('localisation', c); loc = c.j.data; }
  const u = await req('PATCH', `/v1/appStoreVersionLocalizations/${loc.id}`, { data: { type: 'appStoreVersionLocalizations', id: loc.id, attributes: { whatsNew: NOTES } } });
  if (u.status >= 300) die('notes', u); console.log('2) notes de version OK');
}

// 3) build traité
let build = null;
for (let i = 0; i < 40; i++) {
  const b = await req('GET', `/v1/builds?filter[app]=${APP}&filter[version]=${BUILD}&limit=1`); build = (b.j.data || [])[0];
  if (build && build.attributes.processingState === 'VALID') break;
  console.log('3) build', BUILD, ':', build ? build.attributes.processingState : 'pas encore visible', '… 30 s'); await sleep(30000);
}
if (!build || build.attributes.processingState !== 'VALID') { console.log('build pas VALID, relancer plus tard'); process.exit(1); }
let r = await req('PATCH', `/v1/appStoreVersions/${v.id}`, { data: { type: 'appStoreVersions', id: v.id, attributes: { releaseType: 'AFTER_APPROVAL' }, relationships: { build: { data: { type: 'builds', id: build.id } } } } });
if (r.status >= 300) die('attache build', r); console.log('3) build', BUILD, 'attaché');
if (NO_SUBMIT) { console.log('4) pas de soumission (--no-submit) : version prête, à soumettre plus tard'); process.exit(0); }

// 4) soumission
let subs = await req('GET', `/v1/reviewSubmissions?filter[app]=${APP}&filter[state]=READY_FOR_REVIEW&limit=5`); let SUB = (subs.j.data || [])[0]?.id;
if (!SUB) { r = await req('POST', '/v1/reviewSubmissions', { data: { type: 'reviewSubmissions', attributes: { platform: 'IOS' }, relationships: { app: { data: { type: 'apps', id: APP } } } } }); if (r.status >= 300) die('soumission', r); SUB = r.j.data.id; }
let ok = false;
for (let i = 0; i < 20; i++) {
  r = await req('POST', '/v1/reviewSubmissionItems', { data: { type: 'reviewSubmissionItems', relationships: { reviewSubmission: { data: { type: 'reviewSubmissions', id: SUB } }, appStoreVersion: { data: { type: 'appStoreVersions', id: v.id } } } } });
  if (r.status < 300) { ok = true; break; } const t = JSON.stringify(r.j);
  if (/already/i.test(t)) { ok = true; break; }
  if (/ASSET_IN_POST_PROCESSING|not in valid state/i.test(t)) { console.log('4) en attente… 30 s'); await sleep(30000); continue; }
  die('item', r);
}
if (!ok) process.exit(1);
r = await req('PATCH', `/v1/reviewSubmissions/${SUB}`, { data: { type: 'reviewSubmissions', id: SUB, attributes: { submitted: true } } });
if (r.status >= 300) die('submit', r);
console.log('4) SOUMIS →', r.j.data.attributes.state);
