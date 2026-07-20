# Trouvaille — v2

> **1 image · 1 lettre · 1 minute.** Observe une scène foisonnante, reçois une
> lettre, trouve un maximum d'objets (dans le dictionnaire de l'image) en 60 s.
> App casual complète, **thème clair & coloré**, prête à être emballée pour les stores.

**En ligne (web) :** https://thevisitappsolution-create.github.io/trouvaille/

## ▶ Lancer
- **Web** : ouvre `index.html` (ou l'URL ci-dessus). Installable (PWA) : « Ajouter à l'écran d'accueil ».
- **Aperçu d'un écran** (dev) : `index.html?dev=home` (ou `map`, `play`, `boutique`, `banque`, `classement`, `reglages`).

## 🎮 Contenu du jeu
- **Onboarding** (profil : pseudo, e-mail, avatar, âge → tuto → modes → scoring → bonus → récap).
- **Accueil** : solde de pièces, bouton **Conquête**, barre **Duel · Boutique · Classement · Réglages**, temps de jeu.
- **Conquête** (solo) : carte de niveaux par monde ; chaque niveau = 1 image + 1 lettre.
  Trouve des mots, gagne des **⭐ (1-3)**, des **🪙 pièces**, bats le **record**.
- **Duel** : 3 manches contre un bot (unique/partagé + **Call Image** de bluff).
- **Bonus** en partie : 🃏 Joker (dévoile un mot), 🔤 Lettre (lettres d'un mot en désordre), ⏳ +15 s.
  **Aucune pénalité** ; les étoiles dépendent du nombre de mots trouvés (⭐ ≈ 4 mots, ⭐⭐⭐ = tous).
  Le nombre de mots par lettre n'est jamais affiché. Fin de manche : l'image vire au vert et se brise.
- **Boutique / Banque** (économie de pièces, vidéo récompensée), **Classement**, **Réglages** (thème clair/sombre, sons, pub).
- **5 mondes** : Caverne, Bureau, Classe, Parc, Plage — chacun bâti sur ton image + ton dictionnaire.

## 🗂️ Code
```
index.html            Écrans (onboarding, accueil, carte, jeu, duel, boutique…)
css/style.css         Thème CLAIR & coloré
js/data.js            Mondes (images + dictionnaires) + thèmes + boutique + bonus
js/engine.js          Règles pures (validation, scoring, bot, Call Image) — testé
js/store.js           Persistance locale (profil, pièces, progression, réglages)
js/ads.js             Couche PUB (mock web + AdMob-ready)
js/app.js             Application (routeur + tous les écrans + gameplay)
tests/test-moteur.js  Tests du moteur (node tests/test-moteur.js)
```

## 📱 Publier sur l'App Store / Google Play
Le web ne va pas seul sur les stores : on l'emballe avec **Capacitor**.
Les fondations sont là :
- **PWA** : `manifest.webmanifest`, `sw.js` (hors-ligne), `icons/` (512 + SVG), meta mobile.
- **Capacitor** : `capacitor.config.json`, `package.json`, `scripts/build-www.js`.
- **Publicité** : `js/ads.js` (abstraction AdMob) + guide.
- **Confidentialité** : écran in-app + section dans le guide.

👉 **Tout est détaillé dans [STORES.md](STORES.md)** (Capacitor, AdMob, checklist Apple/Google).

Ce qui reste **de ton côté** : comptes développeur, vraies clés AdMob, un Mac pour iOS.

## 💰 Publicité (design)
- **Bannière** (accueil), **interstitiel** (entre deux parties, plafonné à 1/90 s, jamais en manche),
  **vidéo récompensée** (×2 pièces, cadeau). Désactivable dans les Réglages.
- Sur le web, la pub est **simulée** ; en app native, elle passe par **AdMob** (voir STORES.md).

## 🧪 Tests
`node tests/test-moteur.js` — valide les 5 dictionnaires (0 collision), le scoring,
le Call Image et le garde-fou du bot.

## Notes
- Après un déploiement web, si tu changes des fichiers, pense à **incrémenter `VERSION`
  dans `sw.js`** pour que le cache PWA se rafraîchisse chez les joueurs.
- Le moteur (`engine.js`) est indépendant de l'UI : réutilisable tel quel côté serveur
  pour un vrai multijoueur temps réel plus tard.
