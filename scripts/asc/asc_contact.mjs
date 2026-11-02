// Copie le contact de révision (nom, téléphone, e-mail) d'une autre app du compte vers la version modifiable de Prout Box.
import { req, APP } from './asc_lib.mjs';
const SOURCES = ['6810034842', '6827291937']; // Oplaa, MemeWar
let src = null;
for (const id of SOURCES) {
  const vs = await req('GET', `/v1/apps/${id}/appStoreVersions?limit=3`);
  for (const v of vs.j.data || []) {
    const rd = await req('GET', `/v1/appStoreVersions/${v.id}/appStoreReviewDetail`);
    const a = rd.j && rd.j.data && rd.j.data.attributes;
    if (a && a.contactPhone && !/^\+33600000000$/.test(a.contactPhone)) { src = a; console.log('source :', id, v.attributes.versionString, '→', a.contactFirstName, a.contactLastName, a.contactEmail, a.contactPhone.replace(/\d(?=\d{2})/g, '•')); break; }
  }
  if (src) break;
}
if (!src) { console.log('aucun contact trouvé sur les autres apps'); process.exit(1); }
const vs = await req('GET', `/v1/apps/${APP}/appStoreVersions?limit=3`);
for (const v of vs.j.data || []) {
  const rd = await req('GET', `/v1/appStoreVersions/${v.id}/appStoreReviewDetail`);
  if (!rd.j.data) continue;
  const r = await req('PATCH', `/v1/appStoreReviewDetails/${rd.j.data.id}`, { data: { type: 'appStoreReviewDetails', id: rd.j.data.id, attributes: { contactFirstName: src.contactFirstName, contactLastName: src.contactLastName, contactEmail: src.contactEmail, contactPhone: src.contactPhone } } });
  console.log('version', v.attributes.versionString, '→', r.status < 300 ? 'contact mis à jour' : ('non modifiable (' + r.status + ')'));
}
