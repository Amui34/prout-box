# Fiche App Store — Prout Box

> **Depuis la 1.3, la source de la fiche est `appstore/listing.mjs`** (nom, sous-titre, promo, mots-clés, description, nouveautés en fr-FR, en-US, es-ES, es-MX, et notes de vérification), poussée par `node scripts/asc/asc_listing.mjs <version>`. Ce fichier garde l'historique de la 1.0 à la 1.2 et les réponses aux questionnaires Apple.

À coller dans App Store Connect (version 1.0). Tout est en français ; l'app est « Français » uniquement pour la v1.

## Identité

| Champ | Valeur |
|---|---|
| Nom | Prout Box |
| Sous-titre (30 car. max) | La boîte à meuh qui pète |
| Bundle ID | com.proutbox.app |
| SKU | proutbox |
| Catégorie principale | Divertissement |
| Catégorie secondaire | Jeux › Famille |
| Prix | Gratuit |
| Classification d'âge | déclarée par API : humour grossier « peu fréquent / léger », contenu généré par les utilisateurs : oui, tout le reste : non |
| Droits d'auteur | 2026 SAS NOMAD (source : `appstore/identite.json`) |
| App Store Connect | app id **6827309393**, bundle ID resource `MFL357LM76`, équipe `772LDD7BCT` |
| Version 1.0 | build 2 approuvée le 28/10/2026, en vente depuis le 31/10/2026 — https://apps.apple.com/fr/app/prout-box/id6827309393, publication automatique après approbation |

## Texte promotionnel (170 car. max)

Depuis la 1.2 (posé par `node scripts/asc/asc_listing.mjs 1.2`, qui pousse aussi la description de `appstore/description.txt` et les mots-clés) :

Retourne ton téléphone : ça prout. Enregistre ton prout, fais-le noter par un jury impitoyable, défie tes potes et décroche 14 médailles.

## Description (4000 car. max)

**Source de vérité depuis la 1.2 : `appstore/description.txt`** (ajoute le coussin péteur, la ville, la section TES POTES, TES DÉFIS et MES EXPLOITS). Texte d'origine de la 1.0 ci-dessous.

Prout Box, c'est la boîte à meuh de ton enfance… en version prout.

RETOURNE, ÇA PROUT
Retourne ton téléphone (ou la boîte à l'écran) et la Prout Box lâche un prout. Six prouts classiques au choix : la Trompette, le Coussin, le Discret, le Mouillé, la Rafale et le Grinçant. Aucun fichier audio : tout est synthétisé en direct, chaque prout est unique.

ENREGISTRE LE TIEN
Touche « Enregistrer mon prout », donne tout pendant 6 secondes, et ton chef-d'œuvre rejoint la boîte.

LE JURY
Chaque prout enregistré passe devant un jury impitoyable :
• Mamie Josette juge la puissance (« Mon Dieu, les voisins ! »)
• Le Professeur Von Pfft analyse la durée et les rafales (« Publiable dans Nature. »)
• DJ Flatule note le groove (« Ça claque, je le mets dans mon set ! »)

Le Prout-o-mètre calcule un score sur 10 000, identifie l'espèce de ton prout (la Mitraillette, la Trompette de Jéricho, le Pneu qui se dégonfle, la Souris timide…) et livre des statistiques essentielles : magnitude sur l'échelle de Richter du slip, nombre de pigeons effrayés, distance de sécurité.

TOP PROUTS
Entre tes initiales comme sur une borne d'arcade et publie ton prout dans le classement de ton pays… ou du monde entier. Écoute les prouts des autres, note-les de 1 à 5 crottes et fais grimper le tien.

(Apple refuse les emoji dans la description, et les « Nouveautés » ne peuvent pas être renseignées sur une première version.)

SIMPLE ET SANS PRISE DE TÊTE
• Un seul écran, zéro réglage
• Fonctionne même en mode silencieux
• Aucun compte, aucune pub : tu publies seulement si tu le veux, et tu peux retirer ton prout quand tu veux

Prout Box est 100 % gratuite. Bon prout !

## Mots-clés (100 car. max, séparés par des virgules)

prout,pet,boîte à meuh,blague,humour,rigolo,bruit,enfant,jury,arcade,rétro,drôle,farce

## Nouveautés de cette version

Première version : six prouts classiques, enregistrement de ton prout, jury à trois juges, Prout-o-mètre et classement TOP PROUTS façon arcade.

## URL

| Champ | Valeur |
|---|---|
| URL d'assistance | https://amui34.github.io/prout-box/assistance.html (FAQ + contact, source `docs/assistance.html`) |
| URL de politique de confidentialité | https://amui34.github.io/prout-box/privacy.html (source : `docs/privacy.html`) |
| Conditions d'utilisation | https://amui34.github.io/prout-box/cgu.html (éditeur SAS NOMAD ; l'EULA standard Apple s'applique en complément) |
| URL marketing (facultatif) | https://amui34.github.io/prout-box/ |

Un vrai domaine pourra remplacer ces URL plus tard (elles sont modifiables dans App Store Connect à tout moment).

## Confidentialité de l'app (questionnaire App Store Connect)

- Collecte de données : **Oui**, uniquement si l'utilisateur publie un prout.
  - **Contenu utilisateur › Audio** : l'enregistrement publié, avec 3 initiales, un pays et le score du jury. Finalité : *Fonctionnalités de l'app* (classement). **Non lié à l'identité** de l'utilisateur (pas de compte, pas d'e-mail), **pas utilisé pour le suivi**.
  - **Identifiants › ID utilisateur** : identifiant aléatoire par appareil (`device_id`), sert à compter un vote par personne et à retrouver ses propres prouts. Non lié à l'identité, pas de suivi.
  - **Localisation › Position approximative** (depuis la 1.1) : uniquement au moment de publier, si l'utilisateur accepte ; position arrondie à ~1 km, convertie en nom de ville (service BigDataCloud), seul le nom de la ville est stocké. Finalité : *Fonctionnalités de l'app*. Non liée à l'identité, pas de suivi. **À ajouter dans App Store Connect › Confidentialité de l'app avant de soumettre la 1.1.**
  - Rien d'autre : pas de contacts, pas d'analytics, pas de pub.
- Les prouts non publiés restent dans IndexedDB sur l'appareil. Les polices sont chargées depuis Google Fonts (pas d'identifiant utilisateur).
- Micro : uniquement pour enregistrer un prout à la demande (`NSMicrophoneUsageDescription`).
- Mouvement : uniquement pour détecter le retournement (`NSMotionUsageDescription`).

## Contenu généré par les utilisateurs (règle 1.2 de l'App Review)

Tout est en place côté app et base : à décrire dans les notes de révision.

- Filtre : initiales limitées à 3 lettres A–Z, liste noire `banned_initials` côté base (refus à la publication).
- Signalement : lien « SIGNALER » sur chaque prout (double tap de confirmation), masquage automatique à partir de 3 signalements distincts, table `reports` consultable.
- Blocage : un prout signalé disparaît immédiatement de l'écran de la personne qui signale ; masquage global dès 3 signalements ; masquage manuel possible (`update prouts set hidden = true`).
- Suppression : l'auteur peut retirer son prout (« SUPPRIMER »), fichier compris.
- Contact de modération : contact@proutbox.com (dans la politique de confidentialité).
- Conditions d'utilisation : à afficher sur la page vitrine (« En publiant un prout, tu acceptes qu'il soit écouté et noté par tout le monde, et retiré s'il est signalé »).

## Groupes (1.1) — ce qui change pour Apple

- Contenu utilisateur supplémentaire : pseudo (12 car., filtré par la liste noire) et prouts envoyés dans des groupes privés sur invitation (code à 6 lettres). Visibles seulement par les membres.
- Modération : SIGNALER masque le prout pour tout le groupe immédiatement ; l'auteur peut RETIRER ; QUITTER le groupe efface ses liens ; dernier membre parti = groupe supprimé.
- Confidentialité App Store Connect : rien de nouveau à déclarer (toujours « Contenu utilisateur › Audio », « Identifiants › ID utilisateur », plus « Localisation approximative » depuis la 1.1). Le pseudo entre dans « Contenu utilisateur » (autre contenu) : à cocher.
- Nouveautés 1.1 (texte) : « Les GROUPES : crée un groupe avec tes potes, une galerie privée de vos prouts, le jeu « Qui a pété ? », le prout du jour et l'imitateur. Nouvelle peau : le coussin péteur. Ta ville (approximative, si tu veux) à côté de ton prout dans le TOP PROUTS. »

## Informations pour la révision Apple

Notes pour l'équipe de révision (à coller) :

> L'app est une « boîte à meuh » humoristique. Pour tester : retournez l'iPhone (ou touchez la boîte à l'écran) pour entendre un prout. « Enregistrer mon prout » utilise le micro (6 s max) ; le prout enregistré est noté par un jury humoristique, puis l'utilisateur peut le publier (ou non) dans le classement « TOP PROUTS » de son pays, où tout le monde peut l'écouter et le noter de 1 à 5. Aucun compte requis. Modération du contenu utilisateur : filtre d'initiales, bouton « SIGNALER » sur chaque prout (masquage automatique à 3 signalements), suppression par l'auteur, contact dans la politique de confidentialité. Pour remplir le classement sans micro : touchez 5 fois le titre « Prout Box » (mode démo, 4 prouts générés), puis onglet « MOI » › « PUBLIER ».

Pas de compte de démonstration nécessaire. Contact : contact@proutbox.com.

## Captures d'écran

Générées par `sh appstore/shoot.sh <nom>` (simulateur iPhone 17 Pro Max, 1320 × 2868 = 6,9", brutes dans `appstore/raw/`) puis habillées par `node appstore/render-sharp.mjs` (posters dans `appstore/screenshots/`, titres dans `SHOTS`) et envoyées par `node scripts/asc/asc_shots.mjs <version>`. Les 6,9" suffisent : App Store Connect les redimensionne pour les tailles inférieures. Une version en attente de révision refuse la suppression des captures (409) : `asc_withdraw.mjs` d'abord, puis `asc_release.mjs` pour resoumettre.

Les 6 captures de la 1.2 (02/11/2026) :

1. `1-boite` : la boîte (écran d'accueil)
2. `2-prout` : la boîte retournée, bulle « PRRRT RRT ! », fond vert
3. `3-jury` : le jury (écran de score, mode démo)
4. `4-top` : TOP PROUTS (classement FRANCE)
5. `5-medailles` : MES EXPLOITS (14 médailles)
6. `6-groupes` : galerie d'un groupe (« LES PETOMANES »)

Trois posters réduits servent aussi la page vitrine (`docs/shot-*.png`).
