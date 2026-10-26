# Fiche App Store — Prout Box

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
| Classification d'âge | 4+ (humour pipi-caca, aucune violence, aucun contenu généré par d'autres utilisateurs) |
| Droits d'auteur | © 2026 Noa Madar |

## Texte promotionnel (170 car. max)

Retourne ton téléphone : ça prout. Enregistre ton propre prout, fais-le noter par un jury impitoyable et grimpe au TOP PROUTS.

## Description (4000 car. max)

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
Entre tes initiales comme sur une borne d'arcade et publie ton prout dans le classement de ton pays… ou du monde entier. Écoute les prouts des autres, note-les de 1 à 5 💩 et fais grimper le tien.

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
| URL d'assistance | https://proutbox.app (à créer : page vitrine, derrière le proxy Caddy `amui-proxy` ou Netlify) |
| URL de politique de confidentialité | https://proutbox.app/privacy (contenu : `appstore/privacy.html`) |
| URL marketing (facultatif) | https://proutbox.app |

Si le domaine n'est pas encore acheté : héberger `privacy.html` sur n'importe quelle URL publique (Netlify Drop) et renseigner cette URL ; elle peut changer plus tard.

## Confidentialité de l'app (questionnaire App Store Connect)

- Collecte de données : **Oui**, uniquement si l'utilisateur publie un prout.
  - **Contenu utilisateur › Audio** : l'enregistrement publié, avec 3 initiales, un pays et le score du jury. Finalité : *Fonctionnalités de l'app* (classement). **Non lié à l'identité** de l'utilisateur (pas de compte, pas d'e-mail), **pas utilisé pour le suivi**.
  - **Identifiants › ID utilisateur** : identifiant aléatoire par appareil (`device_id`), sert à compter un vote par personne et à retrouver ses propres prouts. Non lié à l'identité, pas de suivi.
  - Rien d'autre : pas de localisation (le pays est choisi à la main), pas de contacts, pas d'analytics, pas de pub.
- Les prouts non publiés restent dans IndexedDB sur l'appareil. Les polices sont chargées depuis Google Fonts (pas d'identifiant utilisateur).
- Micro : uniquement pour enregistrer un prout à la demande (`NSMicrophoneUsageDescription`).
- Mouvement : uniquement pour détecter le retournement (`NSMotionUsageDescription`).

## Contenu généré par les utilisateurs (règle 1.2 de l'App Review)

Tout est en place côté app et base : à décrire dans les notes de révision.

- Filtre : initiales limitées à 3 lettres A–Z, liste noire `banned_initials` côté base (refus à la publication).
- Signalement : lien « SIGNALER » sur chaque prout (double tap de confirmation), masquage automatique à partir de 3 signalements distincts, table `reports` consultable.
- Blocage : un prout signalé disparaît immédiatement de l'écran de la personne qui signale ; masquage global dès 3 signalements ; masquage manuel possible (`update prouts set hidden = true`).
- Suppression : l'auteur peut retirer son prout (« SUPPRIMER »), fichier compris.
- Contact de modération : noamadar.noa@gmail.com (dans la politique de confidentialité).
- Conditions d'utilisation : à afficher sur la page vitrine (« En publiant un prout, tu acceptes qu'il soit écouté et noté par tout le monde, et retiré s'il est signalé »).

## Informations pour la révision Apple

Notes pour l'équipe de révision (à coller) :

> L'app est une « boîte à meuh » humoristique. Pour tester : retournez l'iPhone (ou touchez la boîte à l'écran) pour entendre un prout. « Enregistrer mon prout » utilise le micro (6 s max) ; le prout enregistré est noté par un jury humoristique, puis l'utilisateur peut le publier (ou non) dans le classement « TOP PROUTS » de son pays, où tout le monde peut l'écouter et le noter de 1 à 5. Aucun compte requis. Modération du contenu utilisateur : filtre d'initiales, bouton « SIGNALER » sur chaque prout (masquage automatique à 3 signalements), suppression par l'auteur, contact dans la politique de confidentialité. Pour remplir le classement sans micro : touchez 5 fois le titre « Prout Box » (mode démo, 4 prouts générés), puis onglet « MOI » › « PUBLIER ».

Pas de compte de démonstration nécessaire. Contact : noamadar.noa@gmail.com.

## Captures d'écran

Générées par `appstore/shoot.sh` (simulateur iPhone 17 Pro Max, 1320 × 2868 = 6,9") puis habillées par `node appstore/render.mjs`. Résultat dans `appstore/screenshots/`. Les 6,9" suffisent : App Store Connect les redimensionne pour les tailles inférieures.

1. La boîte (écran d'accueil)
2. La boîte retournée, bulle « PRRRT RRT ! », fond vert
3. Le jury (écran de score)
4. TOP PROUTS (classement)
5. Enregistrement en cours
