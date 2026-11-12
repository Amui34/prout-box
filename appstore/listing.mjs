// Fiche App Store de Prout Box, par langue. Source unique, poussée par `node scripts/asc/asc_listing.mjs <version>`.
// Règles Apple : pas d'emoji ; nom 30 car. max ; sous-titre 30 ; promo 170 ; mots-clés 100 (séparés par des virgules,
// sans répéter les mots du nom ni du sous-titre) ; description 4000.
// Positionnement depuis la 1.3 (après le refus 4.3(b) de la 1.2, levé en appel) : un party game entre amis,
// le jury et le classement d'abord, la boîte à bruits en dernier.

const fr = {
  name: 'Prout Box : le party game',
  subtitle: 'Qui a pété ? Jury, défis, amis',
  promo: 'Le party game des prouts : enregistre, fais-toi noter par un jury impitoyable, devine qui a pété dans ton groupe d’amis et grimpe au classement mondial.',
  keywords: 'jeu entre amis,soirée,pet,blague,humour,rigolo,coussin péteur,classement,groupe,médailles,arcade',
  description: `Prout Box est un party game entre amis : chacun enregistre son prout, un jury impitoyable le note, et le groupe doit deviner qui a pété.

QUI A PÉTÉ ?
Crée un groupe, partage son code à 6 lettres et retrouve tes amis dans une galerie privée. Écoute un prout, devine son auteur : une seule tentative par prout, un point de flair si tu as raison. Le classement des renifleurs désigne le meilleur nez de la bande.

LE JURY
Chaque enregistrement passe devant trois juges : Mamie Josette (la puissance), le Professeur Von Pfft (la durée et les rafales) et DJ Flatule (le groove). Le Prout-o-mètre calcule un score sur 10 000, identifie l'espèce (la Mitraillette, la Trompette de Jéricho, le Pneu qui se dégonfle…) et livre des statistiques essentielles : magnitude sur l'échelle de Richter du slip, pigeons effrayés, distance de sécurité.

LES DÉFIS
Le prout du jour, avec un thème différent chaque jour. L'imitateur : reproduis un prout classique, le Prout-o-mètre mesure la ressemblance en pourcentage. Et des missions à accomplir au fil des jours.

MISSIONS, MÉDAILLES ET TITRES
27 médailles à décrocher (Prout d'or, Marathonien, Fin nez, Chef de bande…), 12 médailles mystères à deviner grâce à un indice, et des titres qui montent avec tes exploits, d'Apprenti péteur à Légende du slip. Les 1000 premiers joueurs reçoivent la médaille Pionnier.

LE CLASSEMENT MONDIAL
Choisis ton nom et publie ton prout dans le classement de ton pays ou du monde entier : tout le monde l'écoute et le note de 1 à 5. Chaque publication est contrôlée avant d'apparaître, les voix sont refusées, et tu peux retirer la tienne quand tu veux.

LA BOÎTE
Et pour s'échauffer : retourne ton téléphone, ça prout. Six prouts classiques synthétisés en direct, en canette ou en coussin péteur.

En français, en anglais et en espagnol. Aucun compte, aucune pub, 100 % gratuit. Bon prout !`,
  whatsNew: `• Prout Box parle maintenant français, anglais et espagnol, et le classement accueille tous les pays du monde.
• Choisis ton nom : fini les 3 initiales.
• Missions avec barres de progression, 27 médailles, 12 médailles mystères et des titres à gravir.
• Les 1000 premiers joueurs reçoivent la médaille Pionnier.
• Un coussin péteur tout neuf.
• Un classement plus vivant, avec de vrais enregistrements d'archives pour lancer la partie et un contrôle automatique qui écarte les voix.
• Corrections : le clavier ne zoome plus l'écran, la flèche retour ne touche plus les onglets.`
};

const en = {
  name: 'Prout Box: Party Game',
  subtitle: 'Who tooted? Jury, dares, pals',
  promo: 'The party game of toots: record yours, face a merciless jury, guess who tooted in your group of friends and climb the world ranking.',
  keywords: 'friends,funny,prank,fart,whoopee cushion,joke,guess who,ranking,group,medals,arcade,retro,humor',
  description: `Prout Box is a party game for friends: everyone records a toot, a merciless jury scores it, and the group has to guess who did it. ("Prout" is the French kid word for a fart. Now you know.)

WHO TOOTED?
Create a group, share its 6-letter code and meet your friends in a private gallery. Listen to a toot and guess who made it: one try per toot, one point for your nose if you are right. The sniffers' ranking crowns the sharpest nose in the gang.

THE JURY
Every recording faces three judges: Granny Josette (power), Professor Von Pfft (duration and bursts) and DJ Flatule (groove). The Toot-o-meter computes a score out of 10,000, names the species (the Machine Gun, the Trumpet of Jericho, the Leaky Tire…) and delivers essential statistics: magnitude on the underpants Richter scale, pigeons scared, safe distance.

THE DARES
The toot of the day, with a new theme every day. The copycat: reproduce a classic toot and the Toot-o-meter measures how close you get, in percent. Plus missions to complete day after day.

MISSIONS, MEDALS AND TITLES
27 medals to earn (Golden Toot, Marathon Runner, Sharp Nose, Gang Leader…), 12 secret medals to work out from a single clue, and titles that rise with your feats, from Toot Trainee to Legend of the Underpants. The first 1000 players receive the Pioneer medal.

THE WORLD RANKING
Pick your name and publish your toot in your country's ranking or the world's: everyone can listen and rate it from 1 to 5. Every entry is checked before it appears, voices are refused, and you can remove yours whenever you like.

THE BOX
And to warm up: flip your phone and it toots. Six classic toots synthesized live, as a can or as a whoopee cushion.

In English, French and Spanish. No account, no ads, 100% free. Happy tooting!`,
  whatsNew: `• Prout Box now speaks English, French and Spanish, and the ranking welcomes every country in the world.
• Pick your own name instead of three initials.
• Missions with progress bars, 27 medals, 12 secret medals and titles to climb.
• The first 1000 players receive the Pioneer medal.
• A brand new whoopee cushion.
• A livelier ranking, seeded with real archive recordings, and an automatic check that filters out voices.
• Fixes: the keyboard no longer zooms the screen, the back arrow no longer overlaps the tabs.`
};

const es = {
  name: 'Prout Box: juego de fiesta',
  subtitle: '¿Quién ha sido? Jurado y retos',
  promo: 'El juego de fiesta de los pedos: graba el tuyo, enfréntate a un jurado implacable, adivina quién ha sido en tu grupo de amigos y sube en la clasificación mundial.',
  keywords: 'amigos,gracioso,broma,pedo,cojín,chiste,adivina,clasificación,grupo,medallas,arcade,retro,humor,risa',
  description: `Prout Box es un juego de fiesta para amigos: cada uno graba su pedo, un jurado implacable lo puntúa y el grupo tiene que adivinar quién ha sido. («Prout» es como los niños franceses llaman a un pedo. Ya lo sabes.)

¿QUIÉN HA SIDO?
Crea un grupo, comparte su código de 6 letras y reúnete con tus amigos en una galería privada. Escucha un pedo y adivina de quién es: un solo intento por pedo y un punto de olfato si aciertas. La clasificación de sabuesos corona a la mejor nariz de la pandilla.

EL JURADO
Cada grabación pasa ante tres jueces: la Abuela Josefina (la potencia), el Profesor Von Pfft (la duración y las ráfagas) y DJ Flatule (el ritmo). El Pedómetro calcula una puntuación sobre 10 000, identifica la especie (la Ametralladora, la Trompeta de Jericó, la Rueda que se desinfla…) y entrega estadísticas esenciales: magnitud en la escala Richter del calzoncillo, palomas asustadas, distancia de seguridad.

LOS RETOS
El pedo del día, con un tema distinto cada día. El imitador: reproduce un pedo clásico y el Pedómetro mide el parecido en porcentaje. Y misiones que cumplir día tras día.

MISIONES, MEDALLAS Y TÍTULOS
27 medallas por conseguir, 12 medallas secretas que descubrir con una sola pista y títulos que suben con tus hazañas. Los primeros 1000 jugadores reciben la medalla Pionero.

LA CLASIFICACIÓN MUNDIAL
Elige tu nombre y publica tu pedo en la clasificación de tu país o del mundo entero: todos pueden escucharlo y puntuarlo del 1 al 5. Cada publicación se revisa antes de aparecer, las voces se rechazan y puedes retirar la tuya cuando quieras.

LA CAJA
Y para calentar: dale la vuelta al teléfono y suena. Seis pedos clásicos sintetizados en directo, en lata o en cojín de broma.

En español, inglés y francés. Sin cuenta, sin publicidad, 100 % gratis. ¡Buen provecho!`,
  whatsNew: `• Prout Box ahora habla español, inglés y francés, y la clasificación acoge a todos los países del mundo.
• Elige tu nombre en lugar de tres iniciales.
• Misiones con barras de progreso, 27 medallas, 12 medallas secretas y títulos que escalar.
• Los primeros 1000 jugadores reciben la medalla Pionero.
• Un cojín de broma nuevo.
• Una clasificación más viva, con grabaciones reales de archivo para empezar la partida y un control automático que descarta las voces.
• Correcciones: el teclado ya no amplía la pantalla y la flecha de volver ya no toca las pestañas.`
};

// Langues de la fiche. en-US sert aussi aux boutiques anglophones sans traduction propre ; es-MX couvre l'Amérique latine.
export const LISTING = { 'fr-FR': fr, 'en-US': en, 'es-ES': es, 'es-MX': es };

// Notes pour l'équipe de vérification (champ « Remarques », en anglais).
export const REVIEW_NOTES = `Prout Box is a party game built around user recordings. A three-judge comic jury scores each recording; friends play "Who tooted?" in private groups (6-letter code); there are daily and imitation challenges, missions, 39 medals and titles; and a world ranking by country.

What is new in 1.3: the app is localized in English, French and Spanish (language button at the top left of the main screen), players choose a name (2 to 12 characters) instead of three initials, missions with progress bars, and a redesigned second skin for the box.

User-generated content safeguards: names go through a server-side blocklist; every public recording goes through an automated check before it is shown (speech is refused, doubtful recordings are held for manual review by the developer); each entry has a Report button, entries are hidden automatically after three reports, authors can delete their own entries, and private groups hide a reported entry immediately. Contact: see the support URL.

Demo without an account or a microphone: on the main screen, tap the title "Prout Box" five times quickly. Four sample recordings are generated and the jury screen opens. Then open TOP PROUTS / TOP TOOTS and GROUPES / GROUPS. No login is required anywhere in the app.`;
