// Client minimal App Store Connect API (JWT ES256 avec la clé .p8 locale) — même méthode qu'Oplaa / MemeWar.
// La clé privée reste dans ~/.appstoreconnect/private_keys/ (jamais dans le dépôt).
import crypto from 'node:crypto'; import fs from 'node:fs'; import os from 'node:os';
export const KEY_ID = 'FJ7JL8VV39', ISSUER = 'fd850757-5b61-43a4-8f6e-99059e4a50f4', TEAM = '772LDD7BCT';
export const BUNDLE = 'com.proutbox.app', APP = '6827309393';
const pk = fs.readFileSync(os.homedir() + '/.appstoreconnect/private_keys/AuthKey_' + KEY_ID + '.p8', 'utf8');
const b64u = o => Buffer.from(JSON.stringify(o)).toString('base64url');
export function tok() {
  const n = Math.floor(Date.now() / 1000);
  const si = b64u({ alg: 'ES256', kid: KEY_ID, typ: 'JWT' }) + '.' + b64u({ iss: ISSUER, iat: n, exp: n + 600, aud: 'appstoreconnect-v1' });
  return si + '.' + crypto.sign('SHA256', Buffer.from(si), { key: pk, dsaEncoding: 'ieee-p1363' }).toString('base64url');
}
export const sleep = ms => new Promise(r => setTimeout(r, ms));
export const req = async (m, u, body) => {
  let last;
  for (let a = 1; a <= 3; a++) {
    try {
      const r = await fetch('https://api.appstoreconnect.apple.com' + u, { method: m, headers: { Authorization: 'Bearer ' + tok(), 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(60000) });
      const t = await r.text(); let j; try { j = JSON.parse(t); } catch { j = t; }
      return { status: r.status, j };
    } catch (e) { last = e; await sleep(3000 * a); }
  }
  throw last;
};
if (process.argv[1] && process.argv[1].endsWith('asc_lib.mjs') && process.argv[2]) {
  const r = await req('GET', process.argv[2]);
  console.log(r.status, JSON.stringify(r.j, null, 1).slice(0, 3000));
}
