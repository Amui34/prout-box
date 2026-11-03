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
   **Ville approximative (1.1)** : à l'ouverture de l'écran, `locateCity()` demande la position (`navigator.geolocation`, précision basse, 8 s max), l'arrondit à 2 décimales (~1 km), la convertit en ville via BigDataCloud (`reverse-geocode-client`, sans clé) et ne garde que le nom (`pubCity`). Le pays détecté remplace le pays choisi s'il est dans `COUNTRIES`. Lien « 📍 VILLE · TOUCHE POUR RETIRER » pour publier sans ville. Colonne `prouts.city`, affichée dans le classement (« ESPÈCE · 📍 VILLE »). Permission iOS : `NSLocationWhenInUseUsageDescription`. Dans l'app iOS, la position passe par le plugin **`@capacitor/geolocation`** (`window.Capacitor.Plugins.Geolocation.getCurrentPosition`) : avec `navigator.geolocation` seul, WKWebView affichait un second popup « localhost would like to use your location » après celui d'iOS. Plugin ajouté en 1.2 (`npm i @capacitor/geolocation` + `npx cap sync ios`).
6. **Peau de la boîte** : lien « Changer de boîte » sous l'indication → canette ou **coussin péteur** (deux SVG dans `#can`, bascule via `style.display` car `hidden` n'existe pas sur les éléments SVG), mémorisé dans `localStorage` `proutbox.skin`. La canette est simplifiée (mascotte ×1,15, sans reflets, seul « PROUT » en texte). Le coussin (redessiné en 1.3, l'ancien « ne ressemblait à rien ») : embout plat dressé vers le haut avec l'ouverture visible, grosse poche ronde rouge-rose à plis, mascotte réduite (×0,85) et « PROUT » en bas.
7. **Groupes (1.1)** : bouton « 👯 GROUPES ». Un groupe = code à 6 lettres (sans I/O) à partager, chacun y a un **pseudo** (12 car., filtré par `banned_initials`), 30 membres max. Écran groupe à 4 onglets : **GALERIE** (prouts du groupe, auteur masqué « ??? » tant qu'on n'a pas deviné, notes 💩, RETIRER / SIGNALER = masqué pour tous, bouton « + ENVOYER UN DE MES PROUTS »), **QUI ?** (« Qui a pété ? » : écoute, choisis le pote, une tentative par prout, +1 si juste), **DÉFIS** (« Le prout du jour » = thème du jour tiré de `THEMES` par date UTC ; « L'imitateur » = reproduire un classique, `similarity()` compare les stats du prout-o-mètre au preset rendu offline, 0-100 %), **FLAIR** (classement des renifleurs). Les défis lancent l'enregistrement avec `recContext` ; après VALIDER, `publishToGroup()` envoie dans le groupe au lieu de proposer le TOP PROUTS public. Tables `groups`, `members` (id public, device_id secret), `group_prouts`, `guesses`, `group_votes` ; RPC `create_group`, `join_group`, `leave_group`, `my_groups`, `group_members`, `group_gallery`, `publish_group_prout`, `guess_author`, `vote_group_prout`, `delete_group_prout`, `report_group_prout`.
8. **Exploits (1.2, refondus en 1.3)** : bouton 🏅 en haut à droite (badge = nombre de médailles, point vert clignotant = défi du jour pas encore fait) → écran « MES EXPLOITS » avec un **titre** (`RANKS` : Apprenti péteur → Pétomane amateur 100 PP → confirmé 300 → Maître péteur 600 → Grand Maître 1000 → Légende du slip 1500 ; les PP = points des médailles gagnées, barre vers le titre suivant) et trois onglets :
   - **MISSIONS** : carte Défi du jour (thème `themeOfDay()`, `recContext = {kind:'daily'}`) puis toutes les médailles pas encore gagnées avec une barre de progression (`m.prog(X)` → `[actuel, objectif]`), triées par proximité, **PIONNIER** toujours en tête (parmi les 1000 premiers appareils : RPC `claim_pioneer` appelée une fois au lancement, rang mémorisé dans `X.pioneer`, médaille si ≤ 1000, « PIONNIER N°x »).
   - **MÉDAILLES** : 27 médailles (`MEDALS`, chacune avec `pts` et une rareté COMMUNE / RARE / ÉPIQUE / LÉGENDAIRE, couleurs `.r-rare/.r-pique/.r-lgendaire`), gagnées d'abord, animation `.new` le jour de l'obtention.
   - **MYSTÈRES** : 12 médailles secrètes (`MYSTERIES`) : seul l'indice est visible (« ??? ») jusqu'au déblocage ; déclenchées par des drapeaux `X.flags` posés dans `exploitRecording()` (heure < 4 h, 5–7 h, enregistrement ≥ 5,8 s, score < 300, score finissant par 77, score palindrome, vendredi 13, 1er avril, 25 déc., 13e prout), `trackFlip()` (10 prouts en 1 min), les 5 taps sur le titre (`curieux`).
   Stats `X` dans `localStorage` `proutbox.exploits` (best, loud, dur, bursts, count, days, daily, dailyCount, pubCount, votes, countries, group, created, guesses, imit, imits, cushion, flips, flipTimes, pioneer, flags, medals). Accroches : `exploitRecording` (VALIDER), `trackFlip` (chaque `fire()`), vote (`votes`), écoute d'un prout en ligne (`countries`), publication (`pubCount`), création de groupe (`created`), imitation ≥ 80 % (`imits`), peau coussin (`cushion`). `exploit(patch)` recalcule, débloque, joue le jingle, affiche « 🏅 Nouvelle médaille » et « 👑 Nouveau titre » (gardé via `withMedal()` dans les notes du flux de publication).
9. **Vrais prouts (1.3)** : deux filtres.
   - **Détecteur de voix** (`voiceScore()` dans `analyzeBlob`) : signal ramené à ~11 kHz, fenêtres de 40 ms, autocorrélation normalisée sur 95–400 Hz (> 0,6 = voisé) + énergie au-dessus de 400 Hz (formants) + stabilité de la hauteur d'une fenêtre à l'autre. `st.voice` 0-100 ; `st.recale = voice ≥ 40` → verdict rouge « RECALÉ : ON DIRAIT UNE VOIX », le prout est gardé en local mais jamais publiable (ni TOP PROUTS ni groupe, pas de bouton PUBLIER, « RECALÉ (VOIX) » dans MOI). Testé sur signaux synthétiques : parole 94, cri tenu 99, prout bruité 0, buzz 60 Hz 0, preset 0. Les rendus de presets (démo, imitateur) passent `analyzeBlob(blob, true)` pour sauter le test.
   - **Validation avant publication** : colonne `prouts.approved` (défaut false), `top_prouts` ne renvoie que les prouts validés. Après PUBLIER : « Le jury suprême l'écoute avant de l'afficher », l'onglet MOI (RPC `my_prouts`) affiche ⏳ EN VALIDATION / EN LIGNE 💩 x,x / REFUSÉ (et retire `remoteId` si le prout a été supprimé par l'admin). **Page d'admin** `docs/admin.html` (GitHub Pages, « JURY SUPRÊME », style rétro) : jeton uuid dans `localStorage` `proutbox.admin`, RPC `admin_stats`, `admin_queue` (à valider + signalés), `admin_decide(ok | hide | delete)` ; `delete` renvoie le chemin et la page efface le fichier via l'API Storage. Le jeton est dans la table `admins` (inséré à la main le 02/11/2026, **jamais dans le dépôt** ; copie locale dans `~/.proutbox/admin-token.txt`). Les groupes ne sont pas pré-modérés (privés, signalement = masquage immédiat).
9. **Navigation** : bouton **‹** en haut à gauche de chaque écran rétro (`BACK`, injecté au chargement), Échap sur le web ; l'écran du jury garde seulement Valider / Jeter.
10. **Mise en page** : `fitCan()` donne à la boîte la hauteur disponible dans `.hero` (moins l'indication et le lien de peau), plafonnée par `--canmax` (46 % de l'écran, 36 % sous 700 pt de haut, 30 % sous 580, 48 % au-dessus de 860) ; appelée au chargement, au resize et dans `show()`. Media queries `max-height: 700px` / `min-height: 860px` pour les tailles de police et de boutons.
11. **Mode démo** (easter egg, sert aux captures App Store) : 5 taps sur le titre « Prout Box » génèrent 4 prouts à partir des presets (rendu `OfflineAudioContext` → WAV) et ouvrent l'écran de score en consultation.

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
  ⚠️ **Piège (bug des builds 1 à 3)** : avec la session en `playback`, `getUserMedia` échoue dans l'app iOS avec `InvalidStateError — AudioSession category is not compatible with audio capture` (le message « Micro bloqué ici » s'affichait). `setAudioSession('play-and-record')` juste avant `getUserMedia`, puis retour à `playback` dans `onstop` et dans le `catch` ; `mediaUnlock()` ne touche plus à la session pendant l'enregistrement. Corrigé dans le build 4.
- **Retournement du téléphone** : `deviceorientation`, retourné si `beta < -50` ou `beta > 145`, remis à l'endroit si `5 < beta < 125`, anti-rebond de 700 ms. La permission iOS (`DeviceOrientationEvent.requestPermission`) est demandée au premier toucher. Wake lock pour garder l'écran allumé.
- **Prout-o-mètre** (`analyzeBlob`) : l'enregistrement est décodé dans un `OfflineAudioContext` (pas besoin de geste utilisateur), découpé en fenêtres de 20 ms. Score sur 10 000 = puissance (RMS moyen des fenêtres actives, max 5000) + durée active (max 3000, plafond 4 s) + pic (max 1500) + 50 par rafale (max 10). Verdicts : TIMIDE < 2000 ≤ HONNÊTE < 4000 ≤ COSTAUD < 6000 ≤ MONSTRUEUX < 8000 ≤ LÉGENDAIRE. Les anciens enregistrements sans score sont analysés au chargement.
- **Enregistrements** : stockés dans IndexedDB (base `proutbox`, store `recs`, champs `id, name (initiales), blob, created, score, stats, remoteId, country`). localStorage : `proutbox.pick` (dernier prout choisi), `proutbox.initials`, `proutbox.country`, `proutbox.device` (jeton secret du classement en ligne, ne jamais l'afficher).
- **Test local** : toujours via un serveur HTTP (IndexedDB ne marche pas en `file://`).
- **Dans l'app iOS** : Capacitor sert la page depuis `capacitor://localhost`, origine sûre, donc `getUserMedia`, `deviceorientation` et IndexedDB fonctionnent comme sur un site HTTPS.

## Style

Fond jaune soleil `#FFD23F`, vert gaz `#8BD450` pendant le prout, rouge tomate `#FF5A3C`, contours épais brun-noir `#2A1B12`. Titres en Luckiest Guy, texte en Nunito. Garder ça simple et rigolo.

Écrans rétro : fond CRT `#0A0A1F`, vert phosphore `#39FF14`, rose néon `#FF2EA6`, jaune `#FFE600`, police Press Start 2P, scanlines et vignette en `::before` / `::after`.

## App Store

- App Store Connect : app id **6827309393**, bundle `com.proutbox.app` (resource `MFL357LM76`), équipe `772LDD7BCT`, clé API `FJ7JL8VV39` (Issuer ID dans README.md, `.p8` hors dépôt).
- **1.0 (build 2) APPROUVÉE le 28/10/2026, en vente depuis le 31/10/2026** : https://apps.apple.com/fr/app/prout-box/id6827309393 (build 1 retiré avant révision).
- **1.1 (build 3) SOUMISE le 01/11/2026 et APPROUVÉE le soir même** (groupes, coussin péteur, ville) : `node scripts/asc/asc_release.mjs 1.1 3 appstore/notes-1.1.txt`. Confidentialité App Store Connect complétée (localisation approximative + autre contenu utilisateur). Schéma Supabase rejoué le même jour. ⚠️ Les builds 1 à 3 ont le bug du micro (voir Détails techniques).
- **1.1.1 → 1.2 (build 6) SOUMISE le 02/11/2026** : la 1.1.1 (build 5, en attente) a été retirée, la version renommée en 1.2 (`scripts/asc/asc_rename.mjs 1.1.1 1.2`, possible tant qu'elle n'est pas approuvée) et le build 6 attaché : correctif micro, bouton retour, mise en page, pages légales Amuï, plugin Geolocation, médailles + défi du jour. Une version approuvée ferme son « train » (impossible d'y ajouter un build), et une seule version peut être en révision à la fois (créer la suivante échoue tant que la précédente n'est pas approuvée). Scripts : `asc_withdraw.mjs` (retrait), `asc_rename.mjs`, `asc_release.mjs <version> <build> <notes> [--no-submit]`, `asc_urls.mjs`, `asc_state.mjs`. Pas d'emoji ni dans la description ni dans les notes de version.
  Resoumise le soir même avec les 6 captures 1.2 et la nouvelle description : une version en attente refuse la suppression des captures (409), donc `asc_withdraw.mjs` → `asc_shots.mjs 1.2` → `asc_listing.mjs 1.2` → `asc_release.mjs 1.2 6 appstore/notes-1.2.txt`.
- **Fiche** : description dans `appstore/description.txt`, promo et mots-clés dans `scripts/asc/asc_listing.mjs <version>` (vérifie l'absence d'emoji et les longueurs). Contact de révision (nom, téléphone, e-mail) copié depuis Oplaa par `asc_contact.mjs` (déjà fait pour 1.0 à 1.2 ; à relancer pour chaque nouvelle version, Apple ne le reporte pas toujours).
- **Captures** : `sh appstore/shoot.sh <nom>` (simulateur iPhone 17 Pro Max, mode démo pour remplir les classements) → `node appstore/render-sharp.mjs` (posters, titres dans `SHOTS`) → `node scripts/asc/asc_shots.mjs <version>`. Liste des 6 écrans dans `appstore/fiche.md`.
- **Build 7 (02/11/2026, soir)** : l'utilisateur a vu sur son iPhone la page « zoomée et bloquée » (WKWebView zoome sur un champ < 16 px et ne revient pas, `body` étant en `overflow: hidden`). Correctif : `.pxinput` à 16 px, viewport `maximum-scale=1,user-scalable=no` (meta `#vp`), `touch-action: manipulation` sur `body` (pas de zoom au double tap), `gesturestart/change/end` annulés (pas de pincement) et remise à l'échelle 1 au `focusout` (on retouche le `content` du meta viewport). Le build 6 (sans ce correctif) a été retiré de la 1.2 au profit du build 7 (**1.2 build 7 soumise le 02/11/2026 au soir**). Le formulaire de groupe n'a plus de focus automatique (c'est lui qui ouvrait le clavier et déclenchait le zoom à l'ouverture) : dans `www/` et sur l'iPhone de Noa, pas dans le build 7 → à embarquer dans le prochain build. Installé aussi en Debug sur l'iPhone de Noa (`xcodebuild -destination 'platform=iOS,id=ACAEA629-…' -derivedDataPath out/dd` puis `devicectl install/launch`).
- Prochaine version : `npm run sync:ios` → bump `CURRENT_PROJECT_VERSION` (> 7) et `MARKETING_VERSION` → archive / export / `altool` (README) → `asc_contact.mjs`, `asc_listing.mjs`, `asc_shots.mjs` si la fiche change → `asc_release.mjs`. Pièges : pas d'emoji dans la description, `whatsNew` interdit sur une 1re version.
- Dépôt GitHub public `Amui34/prout-box`, site vitrine (lien App Store, 3 captures `docs/shot-*.png`, groupes, médailles) + pages légales sur GitHub Pages (`docs/`).

## Équipe d'agents (04/11/2026)

Six agents dans `.claude/agents/` (frontmatter `name`, `description`, `tools`, `model`), lancés par l'outil Agent ou appelés par leur nom : **apple** (App Store Connect, scripts `asc_*`, réponses à la révision), **testeur** (simulateur Pro Max, parcours complets, ne modifie pas le code), **backend** (schéma Supabase, RPC, modération), **moderateur** (lit la file et les compteurs, ne décide rien), **design** (canette, coussin, icône, posters, vitrine), **redaction** (fiche, notes, pages légales, textes Apple). Tâche planifiée `prout-box-matin` (9 h chaque jour, `~/.claude/scheduled-tasks/`) : `node scripts/morning.mjs` = état App Store + file de modération, résumé en 10 lignes. Le refus 4.3(b) et les textes de réponse/appel sont dans `appstore/reponse-apple-1.2.md`.

## Idées pour la suite

- Publier sur l'App Store (même procédure qu'Oplaa : archive + export + `altool`, voir README.md), ou en PWA sur le web.
- Renommer ses prouts, partager un prout enregistré.
