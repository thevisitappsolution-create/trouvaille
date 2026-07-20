/* ============================================================
   TROUVAILLE v2 — Persistance locale (profil, pièces, progression)
   Sauvegarde dans localStorage. Aucune donnée envoyée à un serveur.
   ============================================================ */
const Store = (function () {
  "use strict";
  var CLE = "trouvaille.v2";

  var DEFAUT = {
    onboarding: false,
    profil: { pseudo: "", email: "", avatar: "😀", plus15ans: true },
    pieces: 50,
    // inventaire de bonus (démarrage : 3 jokers, 3 lettres, 2×+15s)
    bonus: { joker: 3, lettre: 3, plus15: 2 },
    // progression Conquête : { "mondeId:lettre": { etoiles: 0..3, best: score } }
    progression: {},
    // mots ajoutés par le joueur/créateur, par monde : { mondeId: [ [mot, syn…], … ] }
    motsPerso: {},
    reglages: { theme: "clair", sons: true, pub: true, consentPub: null, createur: false },
    stats: { partiesJouees: 0, motsTrouves: 0, meilleurScore: 0 },
    minutesJour: 0, joursActif: null
  };

  function charger() {
    try {
      var brut = localStorage.getItem(CLE);
      if (!brut) return clone(DEFAUT);
      var d = JSON.parse(brut);
      return fusion(clone(DEFAUT), d);
    } catch (e) { return clone(DEFAUT); }
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function fusion(base, extra) {
    Object.keys(extra || {}).forEach(function (k) {
      if (extra[k] && typeof extra[k] === "object" && !Array.isArray(extra[k]) && base[k]) {
        fusion(base[k], extra[k]);
      } else { base[k] = extra[k]; }
    });
    return base;
  }

  var d = charger();

  function save() { try { localStorage.setItem(CLE, JSON.stringify(d)); } catch (e) {} }

  return {
    data: function () { return d; },
    reset: function () { d = clone(DEFAUT); save(); },

    /* Profil / onboarding */
    profil: function () { return d.profil; },
    setProfil: function (p) { fusion(d.profil, p); save(); },
    onboardingFait: function () { return d.onboarding; },
    finirOnboarding: function () { d.onboarding = true; save(); },

    /* Pièces (banque) */
    pieces: function () { return d.pieces; },
    ajouterPieces: function (n) { d.pieces = Math.max(0, d.pieces + n); save(); return d.pieces; },
    depenser: function (n) { if (d.pieces < n) return false; d.pieces -= n; save(); return true; },

    /* Bonus */
    bonus: function () { return d.bonus; },
    aBonus: function (id) { return (d.bonus[id] || 0) > 0; },
    utiliserBonus: function (id) { if (!d.bonus[id]) return false; d.bonus[id]--; save(); return true; },
    ajouterBonus: function (id, n) { d.bonus[id] = (d.bonus[id] || 0) + (n || 1); save(); },

    /* Progression Conquête */
    niveauCle: function (mondeId, lettre) { return mondeId + ":" + lettre; },
    etoiles: function (mondeId, lettre) {
      var p = d.progression[mondeId + ":" + lettre]; return p ? p.etoiles : 0;
    },
    best: function (mondeId, lettre) {
      var p = d.progression[mondeId + ":" + lettre]; return p ? p.best : 0;
    },
    enregistrerNiveau: function (mondeId, lettre, etoiles, score) {
      var c = mondeId + ":" + lettre;
      var p = d.progression[c] || { etoiles: 0, best: 0 };
      p.etoiles = Math.max(p.etoiles, etoiles);
      p.best = Math.max(p.best, score);
      d.progression[c] = p;
      if (score > d.stats.meilleurScore) d.stats.meilleurScore = score;
      save();
    },

    /* Mots ajoutés par le joueur/créateur */
    motsPerso: function (mondeId) { return d.motsPerso[mondeId] || []; },
    ajouterMotPerso: function (mondeId, entry) {
      if (!d.motsPerso[mondeId]) d.motsPerso[mondeId] = [];
      d.motsPerso[mondeId].push(entry); save();
    },
    tousMotsPerso: function () { return d.motsPerso; },

    /* Réglages */
    reglages: function () { return d.reglages; },
    setReglage: function (k, v) { d.reglages[k] = v; save(); },

    /* Stats + temps de jeu */
    stats: function () { return d.stats; },
    incrStat: function (k, n) { d.stats[k] = (d.stats[k] || 0) + (n || 1); save(); },
    ajouterMinutes: function (min) {
      var auj = new Date().toDateString();
      if (d.joursActif !== auj) { d.joursActif = auj; d.minutesJour = 0; }
      d.minutesJour = Math.min(70, d.minutesJour + min); save(); return d.minutesJour;
    },
    minutesJour: function () {
      var auj = new Date().toDateString();
      if (d.joursActif !== auj) return 0;
      return d.minutesJour;
    }
  };
})();
