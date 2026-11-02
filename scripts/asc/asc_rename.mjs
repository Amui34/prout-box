// Renomme la version App Store modifiable (ex. 1.1.1 retirée → 1.2) pour y attacher un build d'un autre numéro.
// Usage : node scripts/asc/asc_rename.mjs <ancienne> <nouvelle>
import { req, APP } from './asc_lib.mjs';
const [FROM, TO] = process.argv.slice(2);
const vs = await req('GET', `/v1/apps/${APP}/appStoreVersions?limit=5`);
const v = (vs.j.data || []).find(x => x.attributes.versionString === FROM);
if (!v) { console.log(FROM, 'introuvable'); process.exit(1); }
const r = await req('PATCH', `/v1/appStoreVersions/${v.id}`, { data: { type: 'appStoreVersions', id: v.id, attributes: { versionString: TO } } });
console.log('renommage', FROM, '→', TO, ':', r.status < 300 ? 'OK' : ('ERREUR ' + r.status + ' ' + JSON.stringify(r.j).slice(0, 400)));
if (r.status >= 300) process.exit(1);
