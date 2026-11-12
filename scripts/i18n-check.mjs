// Vérifie les traductions de l'app : extrait toutes les clés (textes français) de www/index.html et signale
// celles qui manquent dans chaque langue (www/lang-xx.js), ainsi que les clés devenues inutiles.
// Usage : node scripts/i18n-check.mjs            (rapport, code de sortie 1 s'il manque des clés)
//         node scripts/i18n-check.mjs --keys     (liste JSON des clés, pour préparer une nouvelle langue)
import fs from 'node:fs'; import path from 'node:path'; import vm from 'node:vm'; import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'www/index.html'), 'utf8');
const js = html.slice(html.indexOf('<script>\n(function () {')), body = html.slice(html.indexOf('<body>'), html.indexOf('<script src="supabase-config.js">'));
const un = raw => new Function("return '" + raw + "'")();           // littéral JS entre apostrophes → chaîne
const LIT = "'((?:[^'\\\\]|\\\\.)*)'";
const keys = new Set(), add = k => { if (k && /\p{L}/u.test(k)) keys.add(k); };   // au moins une lettre
// 1) T('…') et P(n, '…', '…')
for (const m of js.matchAll(new RegExp('\\bT\\(' + LIT, 'g'))) add(un(m[1]));
for (const m of js.matchAll(new RegExp('\\bP\\([^,()]+(?:\\([^()]*\\))?[^,()]*, ' + LIT + ', ' + LIT, 'g'))) { add(un(m[1])); add(un(m[2])); }
// 2) données traduites à l'affichage
const block = (a, b) => { const i = js.indexOf(a), j = js.indexOf(b, i); if (i < 0 || j < 0) throw new Error('bloc introuvable : ' + a); return js.slice(i, j); };
for (const m of block('var SOUNDS = [', '];').matchAll(new RegExp("(?:name|bang): " + LIT, 'g'))) add(un(m[1]));
add('PROUT\nMAISON !');
{ const b = block('var JURY = [', '  function pick('); for (const m of b.matchAll(new RegExp(LIT, 'g'))) if (!/^(👵|🧪|🎧)$/.test(un(m[1]))) add(un(m[1])); }
for (const m of block('function species(st) {', '  // Adds the jury').matchAll(new RegExp('return ' + LIT, 'g'))) add(un(m[1]));
for (const m of block('var THEMES = [', '];').matchAll(new RegExp(LIT, 'g'))) add(un(m[1]));
for (const m of block('var MEDALS = [', '  var ALL = ').matchAll(new RegExp("(?:name|how|clue|rare): " + LIT, 'g'))) add(un(m[1]));
add('MYSTÈRE');
for (const m of block('var RANKS = [', '];').matchAll(new RegExp(LIT, 'g'))) add(un(m[1]));
// 3) messages d'erreur du serveur (supabase/schema.sql), affichés en majuscules par friendly()
['CODE INCONNU', 'PSEUDO DÉJÀ PRIS', 'PSEUDO REFUSÉ', 'PSEUDO VIDE', 'NOM VIDE', 'GROUPE COMPLET', 'PAS MEMBRE', "C'EST TON PROUT", 'DÉJÀ DEVINÉ', 'ON NE VOTE PAS POUR SOI', 'NOM REFUSÉ', 'NOM INVALIDE', 'PAYS INVALIDE', 'FICHIER ABSENT', 'PROUT INCONNU', 'NOTE INVALIDE'].forEach(add);
// 4) textes écrits dans le HTML (hors SVG) et attributs
const noSvg = body.replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
for (const m of noSvg.matchAll(/>([^<>]+)</g)) { const t = m[1].trim(); if (t && t !== 'Prout Box' && !/^(FR|000000|GROUPE|CODE : ABCDEF · PARTAGER)$/.test(t)) add(t.replace(/&amp;/g, '&')); }
for (const m of noSvg.matchAll(/(?:aria-label|placeholder)="([^"]+)"/g)) if (m[1] !== 'Noa' && !/^x+-/.test(m[1])) add(m[1]);

const list = [...keys].sort((a, b) => a.localeCompare(b, 'fr'));
if (process.argv.includes('--keys')) { console.log(JSON.stringify(list, null, 1)); process.exit(0); }
const ctx = { window: {} }; vm.createContext(ctx);
for (const f of fs.readdirSync(path.join(root, 'www')).filter(f => /^lang-[a-z]{2}\.js$/.test(f)).sort()) vm.runInContext(fs.readFileSync(path.join(root, 'www', f), 'utf8'), ctx);
const dicts = ctx.window.PROUTBOX_I18N || {}; let missing = 0;
console.log(list.length, 'clés dans l’app ;', Object.keys(dicts).length, 'langue(s) en plus du français :', Object.keys(dicts).join(', '));
for (const [lang, d] of Object.entries(dicts)) {
  const miss = list.filter(k => d[k] == null), extra = Object.keys(d).filter(k => !keys.has(k));
  const args = list.filter(k => d[k] != null && (k.match(/\{\d\}/g) || []).sort().join() !== (d[k].match(/\{\d\}/g) || []).sort().join());
  console.log(`\n[${lang}] ${list.length - miss.length} / ${list.length} traduites` + (miss.length ? '' : ' ✓'));
  miss.forEach(k => console.log('  manque  :', JSON.stringify(k)));
  args.forEach(k => console.log('  {n} différents :', JSON.stringify(k), '→', JSON.stringify(d[k])));
  if (extra.length) console.log('  inutiles (' + extra.length + ') :', extra.slice(0, 8).map(k => JSON.stringify(k)).join(', ') + (extra.length > 8 ? '…' : ''));
  missing += miss.length + args.length;
}
process.exit(missing ? 1 : 0);
