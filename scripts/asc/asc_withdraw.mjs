// Retire la soumission en cours de révision (la version repasse en « rejetée par le développeur »,
// donc modifiable : on peut attacher un autre build et resoumettre avec asc_release.mjs).
// Usage : node scripts/asc/asc_withdraw.mjs
import { req, APP, sleep } from './asc_lib.mjs';
const subs = await req('GET', `/v1/reviewSubmissions?filter[app]=${APP}&filter[state]=WAITING_FOR_REVIEW,READY_FOR_REVIEW,IN_REVIEW,UNRESOLVED_ISSUES&limit=5`);
const open = subs.j.data || [];
if (!open.length) { console.log('aucune soumission ouverte'); process.exit(0); }
for (const s of open) {
  const r = await req('PATCH', `/v1/reviewSubmissions/${s.id}`, { data: { type: 'reviewSubmissions', id: s.id, attributes: { canceled: true } } });
  console.log('retrait', s.id.slice(0, 8), r.status < 300 ? ('→ ' + r.j.data.attributes.state) : ('ERREUR ' + r.status + ' ' + JSON.stringify(r.j).slice(0, 300)));
}
for (let i = 0; i < 30; i++) {
  const s = await req('GET', `/v1/reviewSubmissions?filter[app]=${APP}&limit=5`);
  if (!(s.j.data || []).some(x => x.attributes.state === 'CANCELING')) break;
  console.log('annulation en cours… 15 s'); await sleep(15000);
}
const v = await req('GET', `/v1/apps/${APP}/appStoreVersions?limit=3`);
for (const x of v.j.data || []) console.log('version', x.attributes.versionString, '→', x.attributes.appVersionState || x.attributes.appStoreState);
