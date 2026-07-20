/* ============================================================
   TROUVAILLE v2 — Couche PUBLICITÉ (abstraction)
   ------------------------------------------------------------
   But : un SEUL point d'entrée pour la pub, qui marche :
     • sur le WEB (github.io)  -> pub SIMULÉE (mock plein écran)
       pour tester le flux (interstitiel, vidéo récompensée…).
     • en app NATIVE (Capacitor + @capacitor-community/admob)
       -> vraie pub AdMob (bannière, interstitiel, rewarded).

   ⚠️ À FAIRE avant publication :
     1. `npm i @capacitor-community/admob` puis `npx cap sync`.
     2. Remplacer les ID de TEST ci-dessous par tes vrais ID AdMob.
     3. Déclarer l'App ID AdMob dans AndroidManifest.xml / Info.plist.
     4. Gérer le consentement (UMP / RGPD) + Apple ATT (déjà amorcé ici).
     5. Ne JAMAIS mettre de pub pendant une manche classée (fair-play).
   ============================================================ */
const Ads = (function () {
  "use strict";

  // --- ID de TEST officiels Google (À REMPLACER) -------------
  var TEST = {
    banner:       { android: "ca-app-pub-3940256099942544/6300978111", ios: "ca-app-pub-3940256099942544/2934735716" },
    interstitial: { android: "ca-app-pub-3940256099942544/1033173712", ios: "ca-app-pub-3940256099942544/4411468910" },
    rewarded:     { android: "ca-app-pub-3940256099942544/5224354917", ios: "ca-app-pub-3940256099942544/1712485313" }
  };

  var natif = false;      // true si plugin AdMob dispo
  var admob = null;
  var pret = false;
  var dernierInter = 0;   // horodatage du dernier interstitiel (plafond fréquence)
  var INTER_MIN_MS = 90 * 1000; // pas plus d'un interstitiel / 90 s

  function pubActivee() {
    // le joueur peut couper la pub dans les réglages (option "premium"-like)
    try { return !Store || Store.reglages().pub !== false; } catch (e) { return true; }
  }

  /* -- Initialisation ---------------------------------------- */
  async function init() {
    try {
      if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
        var mod = window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob;
        if (mod) {
          admob = mod; natif = true;
          await admob.initialize({ requestTrackingAuthorization: true }); // déclenche l'ATT iOS
          // TODO : afficher le formulaire de consentement UMP (RGPD) ici.
          pret = true;
        }
      }
    } catch (e) { natif = false; }
    return pret;
  }

  function plateforme() {
    try { return (window.Capacitor && window.Capacitor.getPlatform && window.Capacitor.getPlatform()) || "web"; }
    catch (e) { return "web"; }
  }
  function unite(type) { var p = plateforme(); return TEST[type][p === "ios" ? "ios" : "android"]; }

  /* -- Bannière ---------------------------------------------- */
  async function banner(afficher) {
    if (!pubActivee()) afficher = false;
    if (natif) {
      try {
        if (afficher) {
          await admob.showBanner({ adId: unite("banner"), position: "BOTTOM_CENTER", margin: 0 });
        } else { await admob.hideBanner(); }
      } catch (e) {}
      return;
    }
    // web : bannière factice
    var el = document.getElementById("ad-banner");
    if (el) el.classList.toggle("show", !!afficher);
  }

  /* -- Interstitiel (entre deux parties) --------------------- */
  async function interstitial(force) {
    if (!pubActivee()) return;
    var now = Date.now();
    if (!force && now - dernierInter < INTER_MIN_MS) return; // plafond de fréquence
    dernierInter = now;
    if (natif) {
      try {
        await admob.prepareInterstitial({ adId: unite("interstitial") });
        await admob.showInterstitial();
      } catch (e) {}
      return;
    }
    await mockPlein("Publicité", 3, false); // web : mock 3 s
  }

  /* -- Vidéo récompensée (gagner des pièces / continuer) ----- */
  async function rewarded() {
    if (natif) {
      try {
        await admob.prepareRewardVideoAd({ adId: unite("rewarded") });
        var res = await admob.showRewardVideoAd();
        return !!res; // récompense obtenue
      } catch (e) { return false; }
    }
    return await mockPlein("Vidéo récompensée", 4, true); // web : mock, renvoie true si "regardée"
  }

  /* -- Mock plein écran (web uniquement) --------------------- */
  function mockPlein(titre, secondes, recompense) {
    return new Promise(function (resolve) {
      var ov = document.createElement("div");
      ov.className = "overlay active";
      ov.style.zIndex = 200;
      var reste = secondes;
      ov.innerHTML =
        '<div class="modal card pop" style="max-width:340px">' +
        '<div class="ad-banner show" style="min-height:120px;font-size:2.2rem">📺</div>' +
        '<h2 style="margin-top:14px">' + titre + '</h2>' +
        '<p style="color:var(--ink-soft)">Simulation web — vraie pub AdMob en app.</p>' +
        '<p style="font-weight:800" id="ad-count">' + reste + ' s…</p>' +
        '<button class="btn ghost sm" id="ad-skip" style="display:none">Fermer</button>' +
        '</div>';
      document.getElementById("app").appendChild(ov);
      var it = setInterval(function () {
        reste--;
        var c = ov.querySelector("#ad-count");
        if (c) c.textContent = reste > 0 ? reste + " s…" : (recompense ? "Récompense obtenue !" : "Terminé");
        if (reste <= 0) {
          clearInterval(it);
          var sk = ov.querySelector("#ad-skip");
          if (sk) { sk.style.display = "inline-flex"; sk.onclick = function () { ov.remove(); resolve(true); }; }
          else { setTimeout(function () { ov.remove(); resolve(true); }, 500); }
        }
      }, 1000);
    });
  }

  return { init: init, banner: banner, interstitial: interstitial, rewarded: rewarded,
           estNatif: function () { return natif; }, plateforme: plateforme };
})();
