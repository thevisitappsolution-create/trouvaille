/* ============================================================
   TROUVAILLE — Synchro en ligne des mots (partage entre joueurs)
   ------------------------------------------------------------
   LECTURE (tous les joueurs) : télécharge `mots-partages.json`
   depuis le dépôt GitHub — aucune clé requise.
   ÉCRITURE (créateur) : publie via l'API GitHub avec un jeton
   personnel stocké en local sur l'appareil du créateur (jamais
   dans le code). Voir STORES.md.
   Tout est optionnel : si le réseau échoue, le jeu marche en local.
   ============================================================ */
const Sync = (function () {
  "use strict";
  var MOTS = {};                 // { mondeId: [ [mot, syn…], … ] }
  var CLE_PAT = "trouvaille.pat"; // jeton GitHub, local à l'appareil

  function rawUrl() {
    return "https://raw.githubusercontent.com/" + CONFIG.partageRepo + "/" +
      CONFIG.partageBranche + "/" + CONFIG.partageFichier;
  }
  function apiUrl() {
    return "https://api.github.com/repos/" + CONFIG.partageRepo + "/contents/" + CONFIG.partageFichier;
  }

  function b64encode(s) { return btoa(unescape(encodeURIComponent(s))); }
  function b64decode(s) { return decodeURIComponent(escape(atob(String(s).replace(/\s/g, "")))); }

  /* Charge les mots partagés (pour TOUS les joueurs). Jamais bloquant. */
  function charger() {
    if (!CONFIG || !CONFIG.partageRepo) return Promise.resolve();
    return fetch(rawUrl() + "?ts=" + Date.now(), { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (j) { MOTS = (j && typeof j === "object") ? j : {}; })
      .catch(function () { MOTS = {}; });
  }
  function motsPartages(mondeId) { return MOTS[mondeId] || []; }

  /* Jeton (créateur uniquement, stocké localement). */
  function cle() { try { return localStorage.getItem(CLE_PAT) || ""; } catch (e) { return ""; } }
  function setCle(v) { try { v ? localStorage.setItem(CLE_PAT, v) : localStorage.removeItem(CLE_PAT); } catch (e) {} }
  function aCle() { return !!cle(); }

  /* Publie une entrée [mot, syn…] pour un monde -> visible par tous. */
  function publier(mondeId, entry) {
    var pat = cle();
    if (!pat) return Promise.reject(new Error("aucun jeton"));
    var head = { Authorization: "token " + pat, Accept: "application/vnd.github+json" };
    // 1) lire le fichier courant (sha + contenu)
    return fetch(apiUrl() + "?ref=" + CONFIG.partageBranche + "&ts=" + Date.now(), { headers: head, cache: "no-store" })
      .then(function (r) {
        if (r.status === 404) return null;
        if (!r.ok) throw new Error("lecture " + r.status);
        return r.json();
      })
      .then(function (file) {
        var data = {}, sha = null;
        if (file && file.content) { try { data = JSON.parse(b64decode(file.content)); } catch (e) { data = {}; } sha = file.sha; }
        if (!data[mondeId]) data[mondeId] = [];
        data[mondeId].push(entry);
        var body = {
          message: "mots partagés : +" + entry[0] + " (" + mondeId + ")",
          content: b64encode(JSON.stringify(data, null, 2) + "\n"),
          branch: CONFIG.partageBranche
        };
        if (sha) body.sha = sha;
        return fetch(apiUrl(), { method: "PUT", headers: head, body: JSON.stringify(body) });
      })
      .then(function (r) { if (!r.ok) throw new Error("écriture " + r.status); return true; });
  }

  return { charger: charger, motsPartages: motsPartages, aCle: aCle, cle: cle, setCle: setCle, publier: publier };
})();
