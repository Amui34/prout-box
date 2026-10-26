# Prout Box — la boîte à meuh qui pète

Application iOS + web : on retourne le téléphone (ou la boîte à l'écran) et ça prout. Une seule page HTML, aucune dépendance de build côté app, une enveloppe iOS Capacitor. Même protocole que [Oplaa](../oplaa).

## Architecture

| Brique | Rôle | Où |
|---|---|---|
| `www/index.html` | **Toute l'application** (UI, sons synthétisés, enregistrement, jury, classement). Enregistrements dans IndexedDB sur l'appareil ; publiés en ligne seulement si l'utilisateur le demande | ce dépôt |
| `www/supabase-config.js` | URL + clé **publishable** du projet Supabase (publique par conception — jamais de clé secrète). Vide = mode local | ce dépôt |
| `supabase/schema.sql` | **Source de vérité** de la base : tables, RPC `security definer`, bucket Storage `prouts`, modération. Idempotent, rejouable de zéro | ce dépôt |
| Supabase | classement par pays / monde, votes 💩, signalements. Pas de compte : jeton = `device_id` secret par appareil | projet à créer (org Amui studio) |
| Capacitor (`ios/`) | enveloppe iOS, bundle `com.proutbox.app`, équipe `772LDD7BCT` | ce dépôt |
| `assets/` | icône et splash en SVG → PNG (sharp) → tailles iOS (`@capacitor/assets`) | ce dépôt |
| `appstore/` | fiche App Store, captures 6,9" (`shoot.sh` + `render.mjs`) | ce dépôt |
| `docs/` | page vitrine + politique de confidentialité, publiées par GitHub Pages sur https://amui34.github.io/prout-box/ | ce dépôt |

## Mettre en route le classement en ligne (une seule fois)

1. Supabase → **New project** (org Amui studio), région Europe (Frankfurt ou Paris), nom `proutbox`.
2. SQL Editor → coller `supabase/schema.sql` → **Run** (Supabase peut afficher « Potential issue detected » à cause des `drop policy if exists` → *Run query*). Le bucket `prouts` est créé par le script.
3. Project Settings → API : copier **Project URL** et la clé **publishable** dans `www/supabase-config.js`, puis `npm run sync:ios`.
4. Vérifier dans l'app : TOP PROUTS → onglet du pays doit afficher « AUCUN PROUT ICI… SOIS LE PREMIER ! » (et non « bientôt disponible »).

Modération : les requêtes utiles (voir les signalements, masquer, réhabiliter, bannir des initiales) sont en bas de `supabase/schema.sql`. Un prout est masqué automatiquement à partir de 3 signalements.

## Développement

```bash
npm install
npm run serve          # http://localhost:4817 — l'app web (www/)
```

Le micro et le capteur de mouvement exigent **HTTPS** sur un vrai téléphone (sauf localhost) : pour le web, tunnel HTTPS ou déploiement. Dans l'app iOS, pas de problème : Capacitor sert la page depuis une origine sûre.

## Essayer sur iPhone (compte développeur Apple)

1. `npm run sync:ios` — copie `www/` dans le projet iOS (à refaire après chaque modification de `index.html`).
2. `npm run open:ios` — ouvre `ios/App/App.xcodeproj` dans Xcode.
3. Brancher l'iPhone, l'autoriser (« Se fier à cet ordinateur ») et activer le **Mode développeur** (Réglages → Confidentialité et sécurité → Mode développeur).
4. Dans Xcode : cible **App** → onglet *Signing & Capabilities* → l'équipe est déjà `772LDD7BCT` (celle d'Oplaa). Choisir l'iPhone comme destination, puis ▶︎ Run.
5. Au premier lancement sur l'iPhone : Réglages → Général → VPN et gestion de l'appareil → faire confiance au certificat développeur, si iOS le demande.

En ligne de commande, sans ouvrir Xcode :

```bash
npm run sync:ios
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug \
  -destination 'platform=iOS,name=iPhone de Noa' -allowProvisioningUpdates build
```

puis installer et lancer avec `xcrun devicectl device install app --device <udid> <chemin App.app>` et `xcrun devicectl device process launch --device <udid> com.proutbox.app`.

Icônes et splash : modifier `assets/icon.svg` / `assets/splash.svg`, puis `npm run render && npm run assets`.

## Publier sur l'App Store (100 % ligne de commande)

Même procédure qu'Oplaa. App Store Connect : app id `6827309393`, bundle `com.proutbox.app`, équipe `772LDD7BCT`. La 1.0 (build 1) a été soumise le 26/10/2026. Prérequis : une clé API App Store Connect (rôle Admin) dans `~/.appstoreconnect/private_keys/AuthKey_FJ7JL8VV39.p8`.

1. `npm run sync:ios`
2. Dans `ios/App/App.xcodeproj/project.pbxproj` : `CURRENT_PROJECT_VERSION` = numéro de build **strictement supérieur** au dernier uploadé ; `MARKETING_VERSION` = version cible.
3. Archive : `xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release -destination 'generic/platform=iOS' -archivePath out/App.xcarchive archive -allowProvisioningUpdates -authenticationKeyID FJ7JL8VV39 -authenticationKeyIssuerID fd850757-5b61-43a4-8f6e-99059e4a50f4 -authenticationKeyPath ~/.appstoreconnect/private_keys/AuthKey_FJ7JL8VV39.p8`
4. Export : `xcodebuild -exportArchive -archivePath out/App.xcarchive -exportOptionsPlist exportOptions.plist -exportPath out` (plist : `method=app-store-connect`, `teamID`, `signingStyle=automatic`) avec les mêmes options d'authentification.
5. Upload : `xcrun altool --upload-app -f out/App.ipa -t ios --apiKey FJ7JL8VV39 --apiIssuer fd850757-5b61-43a4-8f6e-99059e4a50f4`
6. App Store Connect : créer la version, notes, attacher le build une fois « Valid », soumettre.
