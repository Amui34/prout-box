# Prout Box

Application web façon « boîte à meuh », mais avec des bruits de prout : on retourne le téléphone (ou la boîte à l'écran) et ça prout. Projet perso et fun, en français.

## Fichiers

Même protocole que le projet Oplaa (`../oplaa`) : app web dans `www/`, enveloppe iOS Capacitor dans `ios/`.

- `www/index.html` : toute l'app (HTML + CSS + JS dans un seul fichier, aucune dépendance ni étape de build). Seules ressources externes : les polices Google Fonts (Luckiest Guy, Nunito, Press Start 2P).
- `capacitor.config.json` : `appId` `com.proutbox.app`, `appName` « Prout Box », `webDir` `www`.
- `ios/App/App.xcodeproj` : projet Xcode généré par `npx cap add ios`, bundle `com.proutbox.app`, équipe `772LDD7BCT` (la même qu'Oplaa), iPhone seulement, portrait. `ios/App/App/public/` est régénéré par `npx cap copy ios` (non versionné).
- `ios/App/App/Info.plist` : `NSMicrophoneUsageDescription` (enregistrement) et `NSMotionUsageDescription` (retournement) sont indispensables, sinon iOS tue l'app à la demande de permission.
- `assets/icon.svg`, `assets/splash.svg` : sources de l'icône et du splash. `npm run render` les rend en PNG (sharp), `npm run assets` génère les tailles iOS dans `Assets.xcassets`.

Commandes :

```bash
npm install
npm run serve          # http://localhost:4817 (www/), aussi lancé par .claude/launch.json
npm run sync:ios       # copie www/ dans le projet iOS, à relancer après chaque modif de index.html
npm run open:ios       # ouvre le projet dans Xcode
```

Tester sur le web : le micro et le capteur de mouvement exigent **HTTPS** sur téléphone (sauf localhost) : tunnel HTTPS, ou déployer (Netlify Drop : app.netlify.com/drop, ou le proxy Caddy partagé `../amui-proxy` sur le serveur).

Tester sur iPhone : `npm run sync:ios` puis build sur l'appareil depuis Xcode (ou `xcodebuild … -destination 'platform=iOS,id=<udid>' -allowProvisioningUpdates`), voir README.md.

## Ce que fait l'app

Un seul écran, volontairement très simple (l'utilisateur a rejeté deux versions plus chargées) :

1. **La boîte** au milieu : une canette SVG rouge à pois, couvercle jaune percé, mascotte nuage de gaz vert, étiquette « PROUT ».
   - Toucher la boîte : elle se retourne et ça prout.
   - La faire glisser : elle tourne avec le doigt, le prout part vers 140°.
   - Pendant le son : la boîte tremble, une bulle BD (« PRRRT RRT ! ») apparaît, le fond passe du jaune au vert, vibration sur Android.
2. **Sélecteur** : flèches ‹ › pour changer de prout (le son est joué à chaque changement). Les prouts enregistrés s'ajoutent après les classiques, avec un lien « Supprimer » (double confirmation).
3. **Bouton « Enregistrer mon prout »** : MediaRecorder, 6 s max, touche pour arrêter. À la fin, écran rétro « NOUVEAU PROUT ! » : le score monte façon compteur d'arcade avec des blips 8-bit, quatre barres (puissance, durée, pic, rafales), puis saisie de 3 initiales (flèches ▲▼ comme sur une borne). « Valider » enregistre et joue le prout, « Jeter » l'abandonne.
   Le jury (`JURY`) : Mamie Josette (puissance), Pr. Von Pfft (durée + rafales), DJ Flatule (groove) notent sur 10 avec une réplique tirée au sort par tranche ; `species()` donne l'« espèce » (LA MITRAILLETTE, LA TROMPETTE DE JÉRICHO, LE PNEU QUI SE DÉGONFLE…) ; stats absurdes (magnitude Richter du slip, pigeons effrayés, distance de sécurité). Tout est figé dans `rec.stats` à l'analyse.
4. **Bouton « ★ TOP PROUTS ★ »** : écran rétro plein écran (fond CRT, scanlines, police Press Start 2P, vert phosphore / rose néon / jaune) avec trois onglets : **🇫🇷 PAYS** (classement en ligne de son pays), **🌍 MONDE**, **📱 MOI** (ses prouts locaux, bouton PUBLIER). Toucher une ligne en ligne la joue et ouvre la notation : 1 à 5 💩, lien SIGNALER (ou SUPPRIMER si c'est le sien), double tap de confirmation. Le bouton PAYS ouvre la liste des pays (`COUNTRIES`, drapeaux calculés depuis le code ISO).
5. **Publier** : après VALIDER sur l'écran de score, si Supabase est configuré, écran « PUBLIER ? » (pays affiché, modifiable). Upload du blob dans le bucket `prouts` puis RPC `publish_prout`. `rec.remoteId` mémorise la publication.
6. **Mode démo** (easter egg, sert aux captures App Store) : 5 taps sur le titre « Prout Box » génèrent 4 prouts à partir des presets (rendu `OfflineAudioContext` → WAV) et ouvrent l'écran de score en consultation.

Les écrans rétro sont des overlays `.screen` (défilables) ; quand l'un est ouvert, `screenOpen` empêche `fire()` (retournement du téléphone inclus).

## Classement en ligne (Supabase)

- `www/supabase-config.js` : URL + clé publishable (publique par conception). **Vide = mode local** (onglet MOI seulement, message « bientôt disponible »).
- `supabase/schema.sql` : **source de vérité** de la base, idempotent. Pas de compte : un `device_id` (uuid secret dans `localStorage` `proutbox.device`) sert de jeton. Tables `prouts`, `votes`, `reports`, `banned_initials`, RLS sans policy ; tout passe par des RPC `security definer` : `publish_prout`, `top_prouts` (moyenne bayésienne `(somme+9)/(nb+3)`), `vote_prout` (1 vote par appareil et par prout), `report_prout` (masqué à 3 signalements), `delete_prout`. Bucket Storage public `prouts` (400 Ko max, audio seulement, dépôt sous `<device_id>/`).
- Client : `fetch` sur l'API REST (`/rest/v1/rpc/…`, `/storage/v1/object/…`), pas de SDK. Limites anti-spam dans la base : 20 prouts / jour / appareil, 300 votes / jour.
- Suppression d'un prout : `delete_prout` retire la ligne et renvoie le chemin, puis le client fait `DELETE /storage/v1/object/prouts/<chemin>` (Supabase interdit `delete from storage.objects` en SQL ; la policy n'autorise que les fichiers orphelins).
- Projet réel : `ufiwiuhtjtmiglishmgl` (org Amui studio, région Irlande), créé le 26/10/2026, schéma appliqué et flux publier / noter / signaler / supprimer vérifiés de bout en bout. Dashboard pilotable via l'extension Chrome (SQL Editor : injecter via `window.monaco.editor.getModels()[0].setValue(sql)` puis ⌘↵, confirmer « Run query » sur la modale « Potential issue detected »).
- Modération (exigée par Apple pour du contenu utilisateur) : signalement, masquage auto, suppression par l'auteur, liste d'initiales interdites (`banned_initials`). Requêtes SQL de modération en bas de `schema.sql`.

## Détails techniques

- **Sons classiques** (Trompette, Coussin, Discret, Mouillé, Rafale, Grinçant) : synthétisés en Web Audio (oscillateur dent de scie + bruit filtré + modulation d'amplitude irrégulière), presets dans `PRESETS`. Pas de fichiers audio.
- **Volume** : compresseur + gain ×2,2, filtre passe-bas relevé pour que ça s'entende sur un haut-parleur de téléphone.
- **iPhone en mode silencieux** : un `<audio>` silencieux en boucle + `navigator.audioSession.type = 'playback'` pour que le son passe quand même. L'audio est débloqué à chaque tap (`unlockAudio`).
- **Retournement du téléphone** : `deviceorientation`, retourné si `beta < -50` ou `beta > 145`, remis à l'endroit si `5 < beta < 125`, anti-rebond de 700 ms. La permission iOS (`DeviceOrientationEvent.requestPermission`) est demandée au premier toucher. Wake lock pour garder l'écran allumé.
- **Prout-o-mètre** (`analyzeBlob`) : l'enregistrement est décodé dans un `OfflineAudioContext` (pas besoin de geste utilisateur), découpé en fenêtres de 20 ms. Score sur 10 000 = puissance (RMS moyen des fenêtres actives, max 5000) + durée active (max 3000, plafond 4 s) + pic (max 1500) + 50 par rafale (max 10). Verdicts : TIMIDE < 2000 ≤ HONNÊTE < 4000 ≤ COSTAUD < 6000 ≤ MONSTRUEUX < 8000 ≤ LÉGENDAIRE. Les anciens enregistrements sans score sont analysés au chargement.
- **Enregistrements** : stockés dans IndexedDB (base `proutbox`, store `recs`, champs `id, name (initiales), blob, created, score, stats, remoteId, country`). localStorage : `proutbox.pick` (dernier prout choisi), `proutbox.initials`, `proutbox.country`, `proutbox.device` (jeton secret du classement en ligne, ne jamais l'afficher).
- **Test local** : toujours via un serveur HTTP (IndexedDB ne marche pas en `file://`).
- **Dans l'app iOS** : Capacitor sert la page depuis `capacitor://localhost`, origine sûre, donc `getUserMedia`, `deviceorientation` et IndexedDB fonctionnent comme sur un site HTTPS.

## Style

Fond jaune soleil `#FFD23F`, vert gaz `#8BD450` pendant le prout, rouge tomate `#FF5A3C`, contours épais brun-noir `#2A1B12`. Titres en Luckiest Guy, texte en Nunito. Garder ça simple et rigolo.

Écrans rétro : fond CRT `#0A0A1F`, vert phosphore `#39FF14`, rose néon `#FF2EA6`, jaune `#FFE600`, police Press Start 2P, scanlines et vignette en `::before` / `::after`.

## Idées pour la suite

- Publier sur l'App Store (même procédure qu'Oplaa : archive + export + `altool`, voir README.md), ou en PWA sur le web.
- Renommer ses prouts, partager un prout enregistré.
