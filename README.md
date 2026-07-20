# Trouvaille — prototype jouable

> **1 image · 1 lettre · 1 minute.**
> Observe une scène foisonnante, reçois une lettre, et trouve un maximum
> d'objets visibles commençant par cette lettre en 60 secondes.
> Prototype web du jeu décrit dans `PRD_Trouvaille (1).md`.

## ▶ Lancer le jeu

Double-clique sur **`index.html`** (il s'ouvre dans ton navigateur).
Aucune installation, aucun serveur : tout est en HTML/CSS/JS.

> Astuce : pour tester le rendu « mobile », ouvre les DevTools (F12) et
> active la vue responsive.

## 🎮 Comment on joue

1. Choisis un **monde**, un **mode**, la **difficulté** et la **durée**, puis **Jouer**.
2. Pendant 60 s, tape des objets **visibles dans l'image** qui **commencent
   par la lettre imposée** (Entrée pour valider). Zoome à la molette / au pincer.
3. À la **révélation**, tes mots sont comparés à ceux du bot :
   - **mot unique** (toi seul l'as vu) = **3 pts**
   - **mot partagé** = **1 pt**
4. **Call Image ⚔** : un mot du bot te paraît inventé ? Conteste-le.
   - il était **réel** → tu avais tort, tu cèdes tes points ;
   - il était **faux** → tu rafles ses points.
   *Celui qui a raison prend les points de celui qui a tort.* (2 max/manche)
5. Après **3 manches**, le cumul désigne le vainqueur. Carte de score partageable.

### Les deux modes (arbitrage de la question Q7 du PRD)
- **Découverte** — validation instantanée (✓ vert / ? ambre). Idéal pour apprendre.
- **Confiance · bluff** — tes mots restent **secrets** pendant la manche : on joue
  vraiment sur la confiance et le bluff, comme dans la vision d'origine (§9).

## 🌍 Les 5 mondes

| Monde | Image | Dictionnaire | Objets |
|---|---|---|---|
| La Caverne des Curiosités | `ChatGPT Image 20 juil. 2026, 18_00_56.png` | `dictionnaire_la_caverne_des_curiosites.txt` | 143 |
| Le Bureau en Pagaille | `bureau en pagaille.png` | `dictionnaire_bureau_en_pagaille.txt` | 56 |
| La Classe des Mille Trouvailles | `classe des mill trouvailles.png` | `dictionnaire_classe_des_mille_trouvailles.txt` | 56 |
| Le Parc des Trouvailles | `parc des trouvailles.png` | `dictionnaire_parc_des_trouvailles.txt` | 48 |
| La Plage aux Trésors | `plage aux tresors.png` | `dictionnaire_plage_aux_tresors.txt` | 48 |

Chaque monde a été transcrit **depuis ton dictionnaire officiel** : ce qui est
listé = ce qui est valide (la « liste maîtresse » du §10). Zéro décalage entre
l'image et la liste → le **risque produit n°1** du PRD est éliminé par construction.

## 🗂️ Structure du projet

```
index.html        Structure des écrans (accueil, jeu, révélation, résultats)
css/style.css     Thème « cabinet de merveilles »
js/data.js        LES MONDES : images + listes maîtresses + leurres du bot
js/engine.js      RÈGLES pures : normalisation, validation, scoring, bot, Call Image
js/game.js        Interface : machine à états, chrono, saisie, zoom/pan
```

La logique de règles (`engine.js`) est volontairement **séparée de l'UI** : le
jour où tu passes au multijoueur serveur (PRD §15), elle se transpose telle
quelle côté serveur autoritatif.

## ✏️ Ajouter / corriger du contenu

Tout se passe dans **`js/data.js`**.

**Corriger un mot** (ex. ajouter un synonyme) : trouve l'objet dans le bon
`OBJETS_*` et ajoute le mot dans son tableau `mots`. Le 1er mot est le libellé
canonique ; les suivants sont des synonymes acceptés. Singulier/pluriel et
accents sont gérés automatiquement.

```js
{ mots: ["perroquet", "ara", "cacatoès"], f: 5 }
//        ^canonique   ^synonymes         ^évidence 1..5 (optionnel, bot)
```

**Ajouter un monde** : crée un tableau `OBJETS_MONMONDE`, mets l'image dans le
dossier, puis ajoute une entrée dans `MONDES` avec `pret: true`, le bon `image:`
et `objets: OBJETS_MONMONDE`.

**Régler la difficulté du bot** : le champ `f` (1 = rare/piège … 5 = évident)
indique à quel point un objet saute aux yeux. Le bot trouve surtout les `f`
élevés ; le joueur est récompensé (3 pts) quand il repère les `f` bas.

**Les leurres du bot** (`LEURRES`, en bas de `data.js`) : mots plausibles mais
absents des images, avec lesquels le bot bluffe. Un garde-fou empêche
automatiquement le bot de bluffer un mot qui serait réel dans le monde courant.

## ✅ Ce qui est implémenté (vs PRD)

- Boucle de jeu complète (§6), barème unique/partagé (§8.2), départage implicite.
- **Call Image** avec enjeu plafonné — Option B (§9.4), garde-fou 2/manche (§9.5).
- Moteur de validation : accents, casse, singulier/pluriel, synonymes, tolérance
  de fautes prudente (§8.1).
- Sélection de lettre par seuil de jouabilité **adaptatif** (§10).
- Adversaire (bot) paramétrable, mode solo, zoom/pan mobile (§5), carte de partage (§12).

## 🚧 Volontairement hors périmètre (prototype)

- **Multijoueur temps réel / backend autoritatif** (§15) : ici l'adversaire est un
  bot local. C'est le gros chantier suivant.
- Hitboxes / « voici où était l'objet » à la révélation (§10) — pas de coordonnées.
- Comptes, ligues/saisons, boutique, pass, anti-triche serveur (§11-16).
- Localisation (§18) : français uniquement.

## 🧪 Tests

La logique du moteur est couverte par un script Node (validation, scoring,
Call Image, absence de collisions de mots dans les 5 dictionnaires, garde-fou du
bot). Il tourne hors du navigateur, sur `data.js` + `engine.js`.
