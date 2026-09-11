# Ludo Royal

Jeu de Ludo en Next.js et React : 2 à 4 joueurs sur un appareil, ou un joueur contre 1 à 3 ordinateurs. Interface française, plateau responsive, déplacements animés, dés aléatoires, captures, cases protégées, arrivée exacte et victoire. Sons synthétisés avec Web Audio, désactivables.

## Démarrer

Node.js 20.9 ou supérieur.

```sh
npm install
npm run dev
```

Ouvrir http://localhost:3000. Pour produire la version statique : `npm run build` (dossier `out`). Tests des règles : `npm test`.

## Règles

Un 6 sort un pion et permet de rejouer. Une capture ou une arrivée permet également de rejouer. Trois 6 successifs terminent le tour sans déplacer au troisième lancer. Arrivée avec le chiffre exact. Cases étoilées protégées ; pas de blocages par empilement. Quatre pions arrivés gagnent.

Les parties restent en mémoire : recharger la page recommence la partie. Aucun multijoueur réseau, compte ni matchmaking. Le mode Entre amis se joue sur le même appareil. Graphismes et sons créés pour ce projet ; aucune affiliation à Ludo King.
