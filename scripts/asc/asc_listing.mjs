// Pose la description, le texte promotionnel et les mots-clés (fr-FR) sur une version App Store.
// Usage : node scripts/asc/asc_listing.mjs <version> [appstore/description.txt]
// Pièges : pas d'emoji dans la description ; promo 170 car. max ; mots-clés 100 car. max ; la version doit être modifiable
// (pas en attente de révision : retirer avec asc_withdraw.mjs d'abord).
import fs from 'node:fs';
import { req, APP } from './asc_lib.mjs';
const [VERSION, FILE = 'appstore/description.txt'] = process.argv.slice(2);
if (!VERSION) { console.log('usage: asc_listing.mjs <version> [description.txt]'); process.exit(1); }
const PROMO = 'Retourne ton téléphone : ça prout. Enregistre ton prout, fais-le noter par un jury impitoyable, défie tes potes et décroche 14 médailles.';
const KEYWORDS = 'prout,pet,boîte à meuh,blague,humour,rigolo,bruit,enfant,jury,arcade,rétro,drôle,farce';
const description = fs.readFileSync(FILE, 'utf8').trim();
if (/\p{Extended_Pictographic}/u.test(description + PROMO)) { console.log('emoji interdit dans la description / promo'); process.exit(1); }
if (PROMO.length > 170 || KEYWORDS.length > 100 || description.length > 4000) { console.log('texte trop long', PROMO.length, KEYWORDS.length, description.length); process.exit(1); }
const die = (what, r) => { console.log('ERREUR', what, r.status, JSON.stringify(r.j).slice(0, 400)); process.exit(1); };
const vs = await req('GET', `/v1/apps/${APP}/appStoreVersions?limit=5`);
const v = (vs.j.data || []).find(x => x.attributes.versionString === VERSION); if (!v) { console.log(VERSION, 'introuvable'); process.exit(1); }
const locs = await req('GET', `/v1/appStoreVersions/${v.id}/appStoreVersionLocalizations`);
const loc = (locs.j.data || []).find(l => l.attributes.locale === 'fr-FR'); if (!loc) { console.log('pas de localisation fr-FR'); process.exit(1); }
const r = await req('PATCH', `/v1/appStoreVersionLocalizations/${loc.id}`, { data: { type: 'appStoreVersionLocalizations', id: loc.id, attributes: { description, promotionalText: PROMO, keywords: KEYWORDS } } });
if (r.status >= 300) die('listing', r);
console.log('FICHE OK pour', VERSION, '· description', description.length, 'car. · promo', PROMO.length, 'car.');
