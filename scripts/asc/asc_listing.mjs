// Pose toute la fiche App Store d'une version, dans chaque langue de appstore/listing.mjs :
//   - nom et sous-titre de l'app (appInfoLocalizations, sur la fiche encore modifiable) ;
//   - description, texte promotionnel, mots-clés, nouveautés, URL d'assistance et marketing (appStoreVersionLocalizations) ;
//   - URL de confidentialité ; notes pour l'équipe de vérification ; copyright de appstore/identite.json.
// Crée les langues manquantes. Usage : node scripts/asc/asc_listing.mjs <version> [--dry-run]
// La version doit être modifiable (pas en attente de révision : asc_withdraw.mjs d'abord). Ne soumet rien.
import fs from 'node:fs';
import { req, APP } from './asc_lib.mjs';
import { LISTING, REVIEW_NOTES } from '../../appstore/listing.mjs';
const VERSION = process.argv.slice(2).find(a => !a.startsWith('--')), DRY = process.argv.includes('--dry-run');
if (!VERSION) { console.log('usage: asc_listing.mjs <version> [--dry-run]'); process.exit(1); }
const IDENT = JSON.parse(fs.readFileSync(new URL('../../appstore/identite.json', import.meta.url), 'utf8'));
const SITE = 'https://amui34.github.io/prout-box/';   // à passer sur https://proutbox.com/ quand le domaine servira le site
const urls = loc => { const en = !loc.startsWith('fr'); return { supportUrl: SITE + (en ? 'en/support.html' : 'assistance.html'), marketingUrl: SITE + (en ? 'en/' : ''), privacy: SITE + (en ? 'en/privacy.html' : 'privacy.html') }; };
// garde-fous
let bad = 0; const len = s => [...s].length;
for (const [loc, l] of Object.entries(LISTING)) {
  const pb = [];
  if (/\p{Extended_Pictographic}/u.test(l.name + l.subtitle + l.promo + l.keywords + l.description + l.whatsNew)) pb.push('emoji');
  if (len(l.name) > 30) pb.push('nom > 30'); if (len(l.subtitle) > 30) pb.push('sous-titre > 30'); if (len(l.promo) > 170) pb.push('promo > 170');
  if (len(l.keywords) > 100) pb.push('mots-clés > 100'); if (l.description.length > 4000) pb.push('description > 4000'); if (l.whatsNew.length > 4000) pb.push('nouveautés > 4000');
  if (pb.length) { console.log('✗', loc, pb.join(', ')); bad++; }
}
if (bad) process.exit(1);
if (DRY) { console.log('fiche valide pour', Object.keys(LISTING).join(', '), '(essai : rien n’est envoyé)'); process.exit(0); }
const show = (what, r) => console.log(r.status < 300 ? '✓' : '✗', what, r.status < 300 ? '' : r.status + ' ' + JSON.stringify(r.j).slice(0, 260));

const vs = await req('GET', `/v1/apps/${APP}/appStoreVersions?limit=5`);
const v = (vs.j.data || []).find(x => x.attributes.versionString === VERSION); if (!v) { console.log('version', VERSION, 'introuvable (la créer avec asc_release.mjs --no-submit)'); process.exit(1); }
show('copyright ' + IDENT.copyright, await req('PATCH', `/v1/appStoreVersions/${v.id}`, { data: { type: 'appStoreVersions', id: v.id, attributes: { copyright: IDENT.copyright } } }));

// 1) textes de la version, par langue
const locs = (await req('GET', `/v1/appStoreVersions/${v.id}/appStoreVersionLocalizations?limit=50`)).j.data || [];
for (const [locale, l] of Object.entries(LISTING)) {
  const u = urls(locale), attributes = { description: l.description.trim(), promotionalText: l.promo, keywords: l.keywords, whatsNew: l.whatsNew.trim(), supportUrl: u.supportUrl, marketingUrl: u.marketingUrl };
  const cur = locs.find(x => x.attributes.locale === locale);
  const r = cur ? await req('PATCH', `/v1/appStoreVersionLocalizations/${cur.id}`, { data: { type: 'appStoreVersionLocalizations', id: cur.id, attributes } })
                : await req('POST', '/v1/appStoreVersionLocalizations', { data: { type: 'appStoreVersionLocalizations', attributes: { locale, ...attributes }, relationships: { appStoreVersion: { data: { type: 'appStoreVersions', id: v.id } } } } });
  show(`textes ${locale}` + (cur ? '' : ' (langue créée)'), r);
}
// 2) nom, sous-titre et URL de confidentialité : sur la fiche d'app encore modifiable
const infos = (await req('GET', `/v1/apps/${APP}/appInfos`)).j.data || [];
const info = infos.find(i => !/READY_FOR_SALE|READY_FOR_DISTRIBUTION/.test(i.attributes.appStoreState || i.attributes.state || '')) || infos[0];
const ils = (await req('GET', `/v1/appInfos/${info.id}/appInfoLocalizations?limit=50`)).j.data || [];
for (const [locale, l] of Object.entries(LISTING)) {
  const attributes = { name: l.name, subtitle: l.subtitle, privacyPolicyUrl: urls(locale).privacy };
  const cur = ils.find(x => x.attributes.locale === locale);
  const r = cur ? await req('PATCH', `/v1/appInfoLocalizations/${cur.id}`, { data: { type: 'appInfoLocalizations', id: cur.id, attributes } })
                : await req('POST', '/v1/appInfoLocalizations', { data: { type: 'appInfoLocalizations', attributes: { locale, ...attributes }, relationships: { appInfo: { data: { type: 'appInfos', id: info.id } } } } });
  show(`nom « ${l.name} » · sous-titre « ${l.subtitle} » ${locale}`, r);
}
// 3) notes pour l'équipe de vérification
const rd = await req('GET', `/v1/appStoreVersions/${v.id}/appStoreReviewDetail`);
if (rd.j.data) show('notes de vérification', await req('PATCH', `/v1/appStoreReviewDetails/${rd.j.data.id}`, { data: { type: 'appStoreReviewDetails', id: rd.j.data.id, attributes: { notes: REVIEW_NOTES, demoAccountRequired: false } } }));
else show('notes de vérification (fiche créée)', await req('POST', '/v1/appStoreReviewDetails', { data: { type: 'appStoreReviewDetails', attributes: { notes: REVIEW_NOTES, demoAccountRequired: false }, relationships: { appStoreVersion: { data: { type: 'appStoreVersions', id: v.id } } } } }));
console.log('FICHE', VERSION, 'posée (rien n’est soumis).');
