# Publier Trouvaille sur l'App Store & Google Play

Le jeu est un site web statique. Pour le mettre **dans les stores**, on l'emballe
en app native avec **Capacitor** (une WebView + des plugins natifs, dont AdMob).
Ce guide liste tout ce qu'il reste à faire (les fichiers de base sont déjà là).

## 0. Pré-requis
- **Node.js** installé.
- **Android** : Android Studio + un JDK.
- **iOS** : un **Mac** avec Xcode (obligatoire pour compiler iOS).
- Comptes développeur : **Google Play** (25 $ une fois) et **Apple Developer** (99 $/an).

## 1. Installer Capacitor et les plateformes
```bash
npm install                 # installe les dépendances (déjà listées dans package.json)
npm run copy                # génère www/ (les assets web)
npx cap init Trouvaille com.trouvaille.app --web-dir=www   # si pas déjà fait
npm run cap:add:android     # ajoute le projet Android
npm run cap:add:ios         # ajoute le projet iOS (sur Mac)
npm run cap:sync            # copie le web + synchronise les plugins
```
> `com.trouvaille.app` est l'**identifiant** de l'app (à personnaliser, ex. `com.tonstudio.trouvaille`). Il doit être unique et identique sur les deux stores.

## 2. Icône & écran de démarrage
- L'icône source est `icons/icon-512.png` (et `icons/icon.svg`).
- Génère toutes les tailles natives avec :
  ```bash
  npm i -D @capacitor/assets
  npx capacitor-assets generate --iconBackgroundColor "#6c5ce7"
  ```

## 3. Publicité — AdMob
La couche pub est déjà abstraite dans `js/ads.js` (mock sur le web, AdMob en natif).
Il reste à :
1. Créer un compte **AdMob**, une app Android + une app iOS.
2. Créer les blocs : **bannière**, **interstitiel**, **vidéo récompensée** (×2 par plateforme).
3. Remplacer les **ID de TEST** en haut de `js/ads.js` par tes vrais ID.
4. Déclarer l'**App ID AdMob** :
   - Android → `android/app/src/main/AndroidManifest.xml`
     ```xml
     <meta-data android:name="com.google.android.gms.ads.APPLICATION_ID"
                android:value="ca-app-pub-XXXXXXXX~XXXXXXXX"/>
     ```
   - iOS → `ios/App/App/Info.plist`
     ```xml
     <key>GADApplicationIdentifier</key><string>ca-app-pub-XXXXXXXX~XXXXXXXX</string>
     ```
5. **Consentement** : afficher le formulaire UMP (RGPD) et gérer l'**ATT** iOS
   (`NSUserTrackingUsageDescription` dans Info.plist). Amorcé dans `Ads.init()`.
6. **Fair-play** : ne jamais montrer d'interstitiel pendant une manche (déjà respecté).

## 4. Compiler & tester
```bash
npm run cap:android   # ouvre Android Studio -> Run sur un appareil/emulateur
npm run cap:ios       # ouvre Xcode (Mac) -> Run
```

## 5. Éléments demandés par les stores (checklist)
- [ ] **Icône** 512×512 (Play) / jeux d'icônes iOS (générés à l'étape 2).
- [ ] **Captures d'écran** (téléphone, plusieurs tailles).
- [ ] **Description** courte + longue, mots-clés, catégorie « Jeux / Mots ».
- [ ] **Politique de confidentialité** en ligne (URL publique). Le texte de base
      est dans l'app (écran Confidentialité) — à héberger aussi comme page web.
- [ ] **Classification par âge** (questionnaire IARC). L'âge « ‹ 15 ans » active
      la pub **non personnalisée** (déjà prévu côté produit).
- [ ] **Data safety (Google)** / **App Privacy (Apple)** : déclarer AdMob
      (identifiants publicitaires, pas de données perso serveur dans cette version).
- [ ] **Version** : `version` dans `package.json` + versionCode/CFBundleVersion natifs.
- [ ] **Signature** : keystore Android, certificat/profil Apple.

## 6. Mettre à jour l'app
Après une modif du jeu :
```bash
npm run cap:sync      # recopie le web dans les projets natifs
```
puis recompiler. La version **web** (github.io) se met à jour, elle, par simple `git push`.
