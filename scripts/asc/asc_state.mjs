// État de la révision Apple : versions, soumissions, builds, contact. Usage : node scripts/asc/asc_state.mjs
import { req, APP } from './asc_lib.mjs';
const v = await req('GET', `/v1/apps/${APP}/appStoreVersions?limit=3`);
for (const x of v.j.data || []) console.log('version', x.attributes.versionString, '→', x.attributes.appVersionState || x.attributes.appStoreState, '| releaseType', x.attributes.releaseType);
const s = await req('GET', `/v1/reviewSubmissions?filter[app]=${APP}&limit=5`);
for (const x of s.j.data || []) {
  console.log('soumission', x.id.slice(0, 8), '→', x.attributes.state, x.attributes.submittedDate || '');
  const items = await req('GET', `/v1/reviewSubmissions/${x.id}/items`);
  for (const it of items.j.data || []) console.log('   item →', it.attributes.state, it.attributes.resolved === undefined ? '' : ('resolved=' + it.attributes.resolved));
}
const b = await req('GET', `/v1/builds?filter[app]=${APP}&limit=3`);
for (const x of b.j.data || []) console.log('build', x.attributes.version, '→', x.attributes.processingState, '| expiré:', x.attributes.expired);
const rd = await req('GET', `/v1/appStoreVersions/${v.j.data[0].id}/appStoreReviewDetail`); console.log('contact révision:', rd.j.data && rd.j.data.attributes.contactPhone);
