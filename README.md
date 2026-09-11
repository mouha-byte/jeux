# ProxPlay — collection de jeux

Un dépôt Next.js avec cinq jeux indépendants : Ludo Classic, Échecs, X O infini, Billard 8 et UNO. Interface française, adaptée aux téléphones et ordinateurs. Aucun meme, clip ou son de meme.

## Démarrage

Node.js 20.9 ou supérieur.

```sh
npm ci
npm run dev
```

- `/` : bibliothèque de jeux.
- `/ludo` : Ludo, deux ou quatre joueurs, local ou contre des ordinateurs.
- `/chess` : échecs, deux joueurs sur le même appareil ou contre un ordinateur.
- `/xo` : morpion infini, trois signes maximum par joueur, contre un bot ou à deux.
- `/pool` : billard à huit boules, contre un bot ou à deux sur le même appareil.
- `/uno` : UNO contre un ou trois bots, avec cartes spéciales.

`npm test` vérifie les règles des cinq jeux, les collisions du billard et le worker d’échecs. `npm run build` produit le site statique dans `out/`. Le projet est lié à Vercel ; publier depuis ce dossier avec `npx vercel deploy --prod --yes --scope mouhanned7s-projects`.

Les parties restent en mémoire ; recharger ou quitter un jeu termine la partie. Aucun multijoueur réseau ni compte utilisateur.

## Échecs

Thème noir et or commun au Ludo : gros boutons, grandes lettres et peu de texte. Pièces SVG originales, sans moteur 3D. Effets sonores dédiés : pièces en bois, double impact de capture, alerte d’échec et victoire. Ils sont synthétisés localement avec Web Audio, sans charger les sons du Ludo. Les sons et animations de memes ont été retirés.

Les règles utilisent [chess.js 1.4.0](https://jhlywa.github.io/chess.js/) : coups légaux, échec, mat, pat, roque, prise en passant, choix de promotion, répétition triple, matériel insuffisant et règle des 50 coups. Les nulles sont appliquées automatiquement.

L’ordinateur propose trois niveaux de recherche, limités à environ 100, 300 et 650 ms, dans un Web Worker distinct. Il s’agit d’un adversaire léger pour le jeu occasionnel, sans classement Elo. Les horloges mesurent le temps passé sans limite de temps. Annulation d’un coup (ou d’un aller-retour contre l’ordinateur), rotation du plateau, abandon, nouvelle partie et commande des sons. La préférence sonore est mémorisée localement.

Animations de déplacement et capture, mise en évidence du dernier coup et du roi en échec. Navigation au clavier avec les flèches sur le plateau. Les animations respectent la réduction des mouvements du système.

Positions de vérification, disponibles uniquement en développement : `/chess?chessTest=promotion`, `/chess?chessTest=castling`, `/chess?chessTest=enpassant`.

## Structure

- `app/page.tsx` et `app/library.css` : bibliothèque.
- `app/chess/` : interface et pièces des échecs.
- `lib/chess-ai.mjs`, `lib/chess-worker.ts` : ordinateur.
- `lib/chess-sound.ts`, `lib/context-audio.ts` : sons originaux adaptés aux jeux.
- `app/xo/`, `lib/infinite-xo.mjs`, `lib/tictactoe.mjs` : morpion infini.
- `app/pool/`, `lib/pool-engine.mjs`, `lib/pool-draw.ts` : billard, physique et rendu Canvas.
- `app/uno/`, `lib/uno.mjs` : cartes, règles et bots UNO.
- `app/arcade.css` : thème partagé pour les menus et nouveaux jeux.
- `scripts/build-chess-worker.mjs` : compilation du worker autonome avant développement et publication.
- `app/ludo/`, `lib/engine.mjs`, `lib/motion.mjs` : Ludo.
- `tests/` : tests des règles et comportements.

## Ludo Classic

## Règles

Un 6 sort un pion et permet de rejouer. Pour un lancer de 1 à 5, si un seul pion peut légalement avancer, son déplacement est automatique. Si plusieurs pions peuvent avancer, ou si le dé indique 6, choisissez votre pion. Une capture ou une arrivée permet également de rejouer. Trois 6 successifs terminent le tour sans déplacer au troisième lancer. Arrivée avec le chiffre exact. Cases étoilées protégées ; pas de blocages par empilement. Quatre pions arrivés gagnent.

Les parties restent en mémoire : recharger la page recommence la partie. Aucun multijoueur réseau, compte ni matchmaking. Le mode Entre amis se joue sur le même appareil. Aucune affiliation à Ludo King.

## Animations et audio

- Le dé tourne avec six faces en perspective et le son `diceRoll`.
- Chaque case parcourue déclenche un bond, une ombre et le son `tokenMove`.
- Une capture produit un impact, des particules et le son `tokenKill`, puis renvoie visuellement le pion adverse vers sa base. Le tour reste verrouillé jusqu’à la fin du retour.
- Les boutons, le début de partie, les cases protégées, les arrivées et la musique utilisent aussi les fichiers de la référence.

Les huit fichiers de `public/audio/` proviennent des ressources publiques de [Ludo King](https://ludoking.com/play/) ; ils n’ont pas été réencodés. Les URL exactes et les empreintes SHA-256 sont conservées dans `public/audio/sources.json`. Ces ressources appartiennent à leurs ayants droit. Les animations respectent la préférence système de réduction des mouvements.

Pour vérifier le déplacement automatique et une capture en développement : `http://localhost:3000/ludo?motionTest=capture`. Le pion vert avance automatiquement et capture le pion bleu. Cette position de vérification est désactivée dans la compilation de production.

## Pions superposés

Les pions partageant une case sont espacés, y compris entre couleurs différentes. Les pions jouables restent devant et les pions désactivés ne bloquent pas les clics. Vérification locale : `/ludo?motionTest=overlap` (désactivée en production).


## X O infini

Chaque joueur garde au maximum trois signes. Au quatrième placement, son plus ancien signe disparaît avant de vérifier la victoire. Les signes qui vont disparaître sont atténués avec une bordure pointillée. On joue sur une case vide ; la case du plus ancien signe doit d’abord se libérer. Il n’y a plus de grille pleine ni de match nul : la partie continue jusqu’à trois signes alignés.

Trois niveaux de bot, recherche bornée à 1, 3 ou 7 demi-coups selon le niveau (le premier niveau est aléatoire). Le bot tient compte de l’ordre des signes ; aucune promesse d’invincibilité. Scores entre manches, pause, nouvelle partie ; sons de tracé distincts pour X et O, effacement et victoire.

## Billard 8

Table bleue à six poches, bandes bois rouge, boules brillantes numérotées, queue et guide de visée. Canvas 2D, sans moteur 3D, sans vidéo et sans nouvelle dépendance. Le tapis agrandi remplit presque la largeur du téléphone et utilise une grande disposition horizontale sur ordinateur ou en paysage. Les commandes compactes libèrent la place pour le jeu. Touchez ou glissez sur le tapis pour viser. Saisissez la queue (ou la blanche), reculez dans son axe puis relâchez pour tirer. La direction reste verrouillée pendant le recul ; les écarts latéraux n’augmentent pas la puissance. Un recul de 150 unités de table donne 100 %, avec un seuil de 6 unités contre les gestes involontaires. Ramener la queue à son point de départ annule le tir ; Échap, perte du geste, changement de taille, pause et passage en arrière-plan annulent aussi le geste. La jauge verticale à droite offre le même tir au lâcher : reculez son bouton blanc vers le bas pour doser de 0 à 100 %. Un toucher sans recul ne tire pas. Aucun bouton TIRER ou VALIDER. Flèches sur la jauge pour doser au clavier, Entrée pour tirer. Flèches gauche/droite pour ajuster au clavier, Entrée pour tirer. Après une faute, déplacez la blanche au doigt ou avec les quatre flèches, sa position est acceptée dès que vous la lâchez dans un emplacement libre.

Physique à pas fixe de 1/240 s, collisions élastiques amorties, bandes, frottement et poches. Boucle d’animation uniquement pendant les tirs ; rendu limité à une densité de pixels de 2. Sons propres au billard : choc de queue, collisions de billes dont le volume dépend du choc, rebonds amortis, poches, faute et victoire. Les impacts rapprochés sont espacés. Mise en pause manuelle et quand la page devient cachée.

Règles de billard occasionnel : table ouverte après la casse ; pleines/rayées attribuées au premier empochage légal suivant. Empocher sa bille permet de rejouer. Blanche empochée, absence de contact, premier contact incorrect ou absence de bande/empochage après contact : faute et bille en main adverse. La 8 gagne seulement quand toutes les billes du groupe étaient déjà rentrées avant le tir ; 8 prématurée ou blanche avec la 8 fait perdre. La 8 rentrée à la casse est replacée. Pas de poche annoncée, d’effets latéraux ou de règle de casse à quatre bandes. Le bot vise une bille vers une poche accessible et se rabat sur un contact direct : adversaire occasionnel, sans moteur lourd.

## Mobile

Accueil à cinq jeux en grille de deux colonnes sur mobile, grandes commandes, marges de sécurité du téléphone, plateaux adaptés aux écrans courts, disposition paysage pour le billard. Les plateaux d’échecs gardent leurs cases sélectionnables, et les pions Ludo superposés restent accessibles.

## Validation

49 tests passent : règles Ludo, sélection des pions, worker et règles d’échecs, moteur classique et infini du X/O, physique et règles du billard. Tests UNO : cartes spéciales, pioche, annonces, pénalités, recyclage et 24 parties complètes. Tests audio : profils distincts, sourdine, fermeture et absence d’imports Ludo dans les autres jeux. Compilation statique Next.js pour les six routes. Les tests d’invincibilité concernent seulement l’ancien moteur de morpion classique ; le bot infini utilise une recherche différente.


## UNO

108 cartes, sept cartes par joueur, contre un ou trois bots. Même couleur ou symbole ; passe-tour, inversion, +2, joker et +4 avec choix de couleur. Les pénalités font piocher puis passer, sans cumul. Le +4 est bloqué si une carte de la couleur active est encore en main. Après une pioche volontaire, seule la carte piochée peut être jouée, sinon on peut passer. La défausse est recyclée quand la pioche se vide, en conservant la carte du dessus.

Bouton UNO activable avec deux cartes, ou dans une fenêtre de 2,2 secondes après l’animation du coup qui laisse une carte. Un oubli est signalé par les bots et coûte deux cartes. La fenêtre se suspend avec la pause. Les bots annoncent automatiquement UNO. Le premier sans carte gagne la manche ; une dernière carte +2/+4 applique encore sa pénalité. Rejouer relance une manche indépendante.

Base de règles vérifiée dans les [règles Mattel](https://shop.mattel.com/pages/games-uno-braille-rules). Adaptation pour parties rapides : carte numérique au départ, joueur humain en premier, +4 illégal empêché plutôt que contesté, pas de score cumulé à 500 points. À deux joueurs, l’inversion permet de rejouer. Le bot privilégie la couleur majoritaire et les cartes d’action, en conservant ses jokers. Cartes dessinées en CSS, sans textures téléchargées ni moteur lourd.

## Sons par jeu

Seul le Ludo utilise ses MP3 existants. Les échecs, le billard, le X/O et UNO utilisent `ContextAudio`, avec des enveloppes, filtres et timbres différents. UNO accompagne la distribution d’un mélange, les pioches d’un froissement et les poses d’un claquement de carte ; les actions et UNO ont leurs propres accents. Aucune musique ni son de meme ajouté. Aucun nouveau fichier média ni dépendance sonore. Les préférences de sourdine restent propres à chaque jeu et enregistrées sur cet appareil. L’audio démarre après une interaction, et le contexte est fermé en quittant la page.
"# jeux" 
