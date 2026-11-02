// Pose les URL d'assistance et marketing sur la version modifiable la plus récente (fr-FR).
// Usage : node scripts/asc/asc_urls.mjs
import { req, APP } from './asc_lib.mjs';
const SUPPORT = 'https://amui34.github.io/prout-box/assistance.html', SITE = 'https://amui34.github.io/prout-box/';
const vs = await req('GET', `/v1/apps/${APP}/appStoreVersions?limit=5`);
for (const v of vs.j.data || []) {
  const st = v.attributes.appVersionState || v.attributes.appStoreState;
  const locs = await req('GET', `/v1/appStoreVersions/${v.id}/appStoreVersionLocalizations`);
  const loc = (locs.j.data || []).find(l => l.attributes.locale === 'fr-FR'); if (!loc) continue;
  const r = await req('PATCH', `/v1/appStoreVersionLocalizations/${loc.id}`, { data: { type: 'appStoreVersionLocalizations', id: loc.id, attributes: { supportUrl: SUPPORT, marketingUrl: SITE } } });
  console.log('version', v.attributes.versionString, st, '→', r.status < 300 ? 'URL OK' : ('non modifiable (' + r.status + ')'));
}
