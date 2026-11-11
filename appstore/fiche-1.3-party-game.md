# Fiche 1.3 — repositionnement « party game » (brouillon, rien n'est publié)

Objectif : répondre au refus 4.3(b) (« it prominently features that functionality ») en mettant le jeu social devant le bruit, sans renier l'app. À poser avec `asc_listing.mjs` (description, promo, mots-clés), les captures avec `asc_shots.mjs`, le sous-titre dans App Store Connect (appInfoLocalizations, à ajouter au script). **À n'utiliser que pour une seule resoumission préparée, après la réponse d'Apple.**

## Nom et sous-titre

| Champ | Actuel | Proposé |
|---|---|---|
| Nom | Prout Box | Prout Box : le party game |
| Sous-titre (30 car.) | La boîte à meuh qui pète | Qui a pété ? Jury, défis, potes |

## Texte promotionnel (170 car.)

Le party game des prouts : enregistre, fais-toi noter par un jury impitoyable, devine qui a pété dans ton groupe de potes et grimpe au classement de ton pays.

## Description (sans emoji)

Prout Box est un party game entre potes : chacun enregistre son prout, un jury impitoyable le note, et le groupe doit deviner qui a pété.

QUI A PÉTÉ ?
Crée un groupe, partage son code à 6 lettres et retrouve tes potes dans une galerie privée. Écoute un prout, devine son auteur : une tentative par prout, +1 au flair si tu as raison. Le classement des renifleurs désigne le meilleur nez de la bande.

LE JURY
Chaque enregistrement passe devant trois juges : Mamie Josette (la puissance), le Professeur Von Pfft (la durée et les rafales) et DJ Flatule (le groove). Le Prout-o-mètre calcule un score sur 10 000, identifie l'espèce (la Mitraillette, la Trompette de Jéricho, le Pneu qui se dégonfle…) et livre des statistiques essentielles : magnitude sur l'échelle de Richter du slip, pigeons effrayés, distance de sécurité.

LES DÉFIS
Le prout du jour (un thème différent chaque jour), l'imitateur (reproduis un prout classique, le Prout-o-mètre mesure la ressemblance en %), et des missions à accomplir au fil des jours.

MISSIONS, MÉDAILLES ET TITRES
27 médailles à décrocher (Prout d'or, Marathonien, Fin nez, Chef de bande…), 12 médailles mystères à deviner, et des titres qui montent avec tes exploits, d'Apprenti péteur à Légende du slip. Les 1000 premiers joueurs reçoivent la médaille Pionnier.

TOP PROUTS
Publie ton prout dans le classement de ton pays ou du monde : tout le monde l'écoute et le note de 1 à 5. Chaque prout publié est contrôlé avant d'apparaître, les voix sont refusées, et tu peux retirer le tien quand tu veux.

LA BOÎTE
Et pour s'échauffer : retourne ton téléphone, ça prout. Six prouts classiques synthétisés en direct, canette ou coussin péteur au choix.

Aucun compte, aucune pub, 100 % gratuit. Bon prout !

## Mots-clés (100 car.)

qui a pété,party game,jeu entre amis,prout,pet,jury,défis,groupe,classement,humour,rigolo,arcade

## Captures (ordre)

1. Groupe : galerie + « Qui a pété ? » (titre « QUI A PÉTÉ ? »)
2. Le jury (« UN JURY IMPITOYABLE »)
3. Missions / médailles (« 39 MÉDAILLES À DÉCROCHER »)
4. TOP PROUTS (« LE CLASSEMENT DE TON PAYS »)
5. Défis du groupe (« LE PROUT DU JOUR, L'IMITATEUR »)
6. La boîte (« ET POUR S'ÉCHAUFFER… »)

Dans `appstore/render-sharp.mjs`, renommer/ordonner `SHOTS` en conséquence (préfixes 1- à 6-).

## Notes de révision (à mettre dans « Remarques »)

Prout Box is a party game built around user recordings: a three-judge comic jury scores each recording, friends play "Qui a pété ?" in private groups (6-letter code), daily and imitation challenges, missions and medals, and a worldwide ranking by country where every public recording goes through an automated check before it is shown (speech is refused, doubtful recordings are held for manual review by the developer; report, automatic hiding and author deletion are available). Demo without an account: tap the title "Prout Box" five times on the main screen to generate four recordings and open the jury, then TOP PROUTS and GROUPES. No login required.

## Dans l'app (build 8, optionnel mais cohérent)

- Écran d'accueil : le bouton « 👯 GROUPES » devient « 👯 QUI A PÉTÉ ? » et passe en premier (avant TOP PROUTS).
- Indication sous la boîte : « Retourne la boîte… ou défie tes potes ! ».
- Rien d'autre à changer : le jeu existe déjà, seule la vitrine change.
