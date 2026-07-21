/* ============================================================
   TROUVAILLE v2 — Application (habillage clair & coloré)
   Dépend de : data.js, engine.js, store.js, ads.js
   ============================================================ */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var ENJEU = 3, CALLS = 2;
  var VERSION_APP = "2.6.2"; // affichée dans Réglages ; à bumper à chaque déploiement
  var TACTILE = !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);

  var S = {
    mondeIndex: 0, ctx: null, seuil: 5,
    mode: null,             // "solo" | "duel"
    lettre: "", duree: 60, restant: 0, timer: null,
    joueurClaims: [], botClaims: [], clesJoueur: null,
    streak: 0, scoreSolo: 0, motsIndices: {},
    // duel
    manche: 0, nbManches: 3, lettresUtilisees: [], scoreJoueur: 0, scoreBot: 0,
    roundJoueur: 0, roundBot: 0, callsRestants: CALLS, selection: [], manchesLog: [],
    // solo level ref
    soloLettre: null, soloAvail: 0,
    ob: { pseudo: "", email: "", avatar: "😀", plus15ans: true }, obStep: 0
  };

  /* =========================================================
     ROUTEUR
     ========================================================= */
  function montrer(nom) {
    $$(".screen").forEach(function (s) { s.classList.remove("active"); });
    var el = $("#screen-" + nom); if (el) el.classList.add("active");
    Ads.banner(nom === "home"); // bannière sur l'accueil seulement
    if (nom === "home") rafraichirHome();
    if (nom === "map") rendreCarte();
    if (nom === "boutique") rendreBoutique();
    if (nom === "banque") rendreBanque();
    if (nom === "classement") rendreClassement();
    if (nom === "reglages") rendreReglages();
    majPieces();
  }

  function majPieces() {
    var p = Store.pieces();
    $$(".coins-val").forEach(function (e) { e.textContent = p; });
    var hc = $("#home-coins-val"); if (hc) hc.textContent = p;
    var bs = $("#banque-solde"); if (bs) bs.textContent = p;
  }

  /* =========================================================
     ONBOARDING
     ========================================================= */
  var OB = [
    { form: true },
    { titre: "Trouve des mots", html:
      '<p class="ob-sub">Observe l\'image et tape un maximum d\'objets qui y sont visibles <b>et</b> qui commencent par la lettre imposée.</p>' +
      '<div class="tuto-tiles"><div class="tile">P</div><div class="tile">→</div><div class="tile">🦜</div></div>' +
      '<p class="ob-sub">Ex. lettre « P » → <b>perroquet</b>, <b>plume</b>, <b>pomme</b>… Zoome pour débusquer les petits objets !</p>' },
    { titre: "Deux modes de jeu", html:
      '<ul class="rule-list">' +
      '<li>🗺️ <b>Conquête</b> — avance sur la carte, gagne des <b>étoiles</b> et des <b>pièces</b>, bats le record de chaque niveau.</li>' +
      '<li>⚔️ <b>Duel</b> — 3 manches contre un adversaire, mêmes lettres, le plus de points gagne.</li></ul>' },
    { titre: "Gagne des étoiles", html:
      '<ul class="rule-list">' +
      '<li>⭐ <b>1 étoile</b> — trouve quelques mots : tu passes !</li>' +
      '<li>⭐⭐ <b>2 étoiles</b> — trouves-en davantage.</li>' +
      '<li>⭐⭐⭐ <b>3 étoiles</b> — trouve <b>tous</b> les mots (gros bonus de score si le niveau en compte beaucoup !).</li>' +
      '<li>😌 <b>Aucune pénalité</b> : un mauvais mot ne coûte rien, ose !</li></ul>' },
    { titre: "Tes bonus", html:
      '<ul class="rule-list">' +
      '<li>🃏 <b>Joker</b> — dévoile un mot</li>' +
      '<li>🔤 <b>Lettre</b> — affiche les lettres d\'un mot dans le désordre</li>' +
      '<li>⏳ <b>+15 s</b> — rallonge le temps</li></ul>' +
      '<p class="ob-sub">Gagne-les en jouant, ou achète-les en 🛒 boutique.</p>' },
    { titre: "Tout est là", html:
      '<ul class="rule-list">' +
      '<li>🛒 <b>Boutique</b> — dépense tes pièces</li>' +
      '<li>🏦 <b>Banque</b> — encaisse des pièces</li>' +
      '<li>🏆 <b>Classement</b> — Monde et Amis</li>' +
      '<li>⚙️ <b>Réglages</b> — thème, sons, aide</li></ul>' +
      '<p class="ob-sub">Tu démarres avec <b>50 pièces</b>, 3 jokers et 3 lettres.</p>' }
  ];

  function rendreOnboarding() {
    var step = OB[S.obStep];
    var c = $("#ob-content");
    if (step.form) {
      c.innerHTML =
        '<div style="text-align:center;margin-bottom:10px"><span class="logo-tile">T</span></div>' +
        '<h2 class="ob-title serif">Bienvenue !</h2>' +
        '<p class="ob-sub">Crée ton profil joueur :</p>' +
        '<input class="field" id="ob-pseudo" placeholder="Ton pseudo (obligatoire)" maxlength="16" value="' + esc(S.ob.pseudo) + '">' +
        '<input class="field" id="ob-email" placeholder="Ton e-mail (facultatif)" value="' + esc(S.ob.email) + '">' +
        '<div class="label">Choisis ton avatar</div><div class="avatar-grid" id="ob-avatars"></div>' +
        '<div class="label">Ton âge</div><div class="seg" id="ob-age">' +
        '<button data-age="1" class="' + (S.ob.plus15ans ? "on" : "") + '">15 ans ou plus</button>' +
        '<button data-age="0" class="' + (!S.ob.plus15ans ? "on" : "") + '">Moins de 15 ans</button></div>';
      var grid = $("#ob-avatars");
      AVATARS.forEach(function (a) {
        var b = document.createElement("button");
        b.textContent = a; if (a === S.ob.avatar) b.classList.add("on");
        b.onclick = function () { S.ob.avatar = a; $$("#ob-avatars button").forEach(function (x) { x.classList.remove("on"); }); b.classList.add("on"); };
        grid.appendChild(b);
      });
      $("#ob-pseudo").oninput = function () { S.ob.pseudo = this.value; };
      $("#ob-email").oninput = function () { S.ob.email = this.value; };
      $$("#ob-age button").forEach(function (b) {
        b.onclick = function () { S.ob.plus15ans = b.getAttribute("data-age") === "1"; $$("#ob-age button").forEach(function (x) { x.classList.remove("on"); }); b.classList.add("on"); };
      });
    } else {
      c.innerHTML = '<h2 class="ob-title serif">' + step.titre + '</h2>' + step.html;
    }
    // dots
    var dots = $("#ob-dots"); dots.innerHTML = "";
    OB.forEach(function (_, i) { var d = document.createElement("i"); if (i === S.obStep) d.classList.add("on"); dots.appendChild(d); });
    $("#ob-suivant").textContent = S.obStep === OB.length - 1 ? "C'est parti !" : "Suivant";
  }

  function obSuivant() {
    if (S.obStep === 0 && !S.ob.pseudo.trim()) { toast("Choisis un pseudo 🙂", "non"); return; }
    if (S.obStep < OB.length - 1) { S.obStep++; rendreOnboarding(); }
    else finirOnboarding();
  }
  function finirOnboarding() {
    Store.setProfil({ pseudo: S.ob.pseudo.trim() || "Joueur", email: S.ob.email.trim(), avatar: S.ob.avatar, plus15ans: S.ob.plus15ans });
    Store.finirOnboarding();
    montrer("home");
  }

  /* =========================================================
     ACCUEIL
     ========================================================= */
  function rafraichirHome() {
    $("#home-avatar").textContent = Store.profil().avatar || "😀";
    var min = Store.minutesJour(), bars = $("#playtime-bars"); bars.innerHTML = "";
    for (var i = 0; i < 7; i++) { var b = document.createElement("i"); if (min >= (i + 1) * 10) b.classList.add("on"); bars.appendChild(b); }
    $("#playtime-lbl").textContent = min + "/70 min";
  }

  /* =========================================================
     CONQUÊTE — carte des niveaux
     ========================================================= */
  function mondesPrets() { return MONDES.filter(function (m) { return m.pret; }); }

  // objets du monde + mots PARTAGÉS (en ligne, pour tous) + mots LOCAUX.
  // Ajouts uniquement en fin de liste (objId de base stables) et dédoublonnés
  // par 1er mot (un mot partagé + local identique n'apparaît qu'une fois).
  function objetsEffectifs(m) {
    var out = m.objets.slice(), vus = {};
    m.objets.forEach(function (o) { o.mots.forEach(function (w) { vus[Engine.normalize(w)] = 1; }); });
    function ajoute(entries) {
      (entries || []).forEach(function (e) {
        if (!e || !e.length) return;
        var k = Engine.normalize(e[0]);
        if (!k || vus[k]) return;
        vus[k] = 1; out.push({ mots: e });
      });
    }
    ajoute(typeof Sync !== "undefined" ? Sync.motsPartages(m.id) : []);
    ajoute(Store.motsPerso(m.id));
    return out;
  }
  function compilerMonde(idx) {
    var m = mondesPrets()[idx];
    S.mondeIndex = idx;
    S.ctx = Engine.compile({ id: m.id, titre: m.titre, image: m.image, objets: objetsEffectifs(m) });
    S.seuil = 4; // règle : une lettre n'est jouable qu'avec AU MOINS 4 mots
    return m;
  }

  function lettresDuMonde() { return Engine.lettresValides(S.ctx, S.seuil); }

  function rendreCarte() {
    if (!S.ctx) compilerMonde(S.mondeIndex);
    var m = mondesPrets()[S.mondeIndex], th = THEMES[m.id] || { emoji: "🗺️", chapitre: m.titre };
    $("#chapter-chip").textContent = th.emoji + " " + th.chapitre + " ▾";
    var lettres = lettresDuMonde();
    var cont = $("#map-container"); cont.innerHTML = "";

    // Progression STRICTE : on fait les niveaux DANS L'ORDRE. On ne débloque
    // que le premier niveau non complété ; les suivants restent verrouillés.
    var premierTrou = lettres.length; // tout complété par défaut
    for (var k = 0; k < lettres.length; k++) {
      if (Store.etoiles(m.id, lettres[k]) === 0) { premierTrou = k; break; }
    }
    lettres.forEach(function (L, i) {
      var fait = i < premierTrou;       // complété (dans l'ordre)
      var courant = i === premierTrou;  // à faire maintenant (avatar unique)
      var etoiles = Store.etoiles(m.id, L);
      var row = document.createElement("div");
      row.className = "map-row r" + (i % 3);
      var node = document.createElement("button");
      node.className = "node " + (fait ? "done" : (courant ? "current" : "locked"));
      node.innerHTML = (fait ? '<span class="stars">' + "⭐".repeat(etoiles) + '</span>' : "") +
        (i + 1) + (courant ? '<span class="me">' + (Store.profil().avatar || "😀") + '</span>' : "");
      if (fait || courant) node.onclick = (function (LL, idx) { return function () { introNiveau(LL, idx); }; })(L, i);
      row.appendChild(node); cont.appendChild(row);
      if (i < lettres.length - 1) { var conn = document.createElement("div"); conn.className = "connector"; conn.textContent = "·····"; cont.appendChild(conn); }
    });
  }

  function introNiveau(L, idx) {
    var m = mondesPrets()[S.mondeIndex], th = THEMES[m.id] || { emoji: "🗺️" };
    var avail = Engine.nbObjetsPourLettre(S.ctx, L);
    var s = seuilsEtoiles(avail);
    var best = Store.best(m.id, L);
    ouvrirModal(
      '<div class="emoji-round">' + th.emoji + '</div>' +
      '<h2 class="serif">Niveau ' + (idx + 1) + ' · lettre « ' + L.toUpperCase() + ' »</h2>' +
      '<p>' + esc(m.titre) + '</p>' +
      '<p style="color:var(--ink-soft)"><b>' + avail + '</b> mots à trouver<br>' +
      '⭐ ' + s.s1 + '  ·  ⭐⭐ ' + s.s2 + '  ·  ⭐⭐⭐ ' + s.s3 + '<br>' +
      '<span style="color:var(--green-d);font-weight:700">⏱️ +2,5 s par mot trouvé</span>' +
      (best ? '<br>Record : <b>' + best + ' pts</b>' : '') + '</p>' +
      '<div class="actions"><button class="btn ghost" id="m-fermer">Fermer</button>' +
      '<button class="btn green" id="m-jouer">Jouer</button></div>');
    $("#m-fermer").onclick = fermerModal;
    $("#m-jouer").onclick = function () { fermerModal(); demarrerSolo(L, avail); };
  }

  /* Seuils d'étoiles basés sur le temps (~15 s/mot pour 1★), proportionnels ;
     3★ = TOUS les mots. Ne révèle jamais le nombre de mots disponibles. */
  function seuilsEtoiles(avail) {
    // 1★ = passer facilement (~40% des mots, plafonné par le temps),
    // 2★ ~70%, 3★ = tous. Toujours atteignable : 3 mots ne peuvent plus valoir 0★.
    var cap1 = Math.max(1, Math.ceil(S.duree / 15)); // ~4 en 60 s
    var cap2 = Math.max(2, Math.ceil(S.duree / 10)); // ~6 en 60 s
    var s1 = Math.max(1, Math.min(avail, Math.ceil(avail * 0.4), cap1));
    var s2 = Math.min(avail, Math.max(s1 + 1 <= avail ? s1 + 1 : s1, Math.min(Math.ceil(avail * 0.7), cap2)));
    return { s1: s1, s2: s2, s3: avail };
  }
  function etoilesPour(found, avail) {
    var s = seuilsEtoiles(avail);
    return found >= s.s3 ? 3 : found >= s.s2 ? 2 : found >= s.s1 ? 1 : 0;
  }
  function motsTrouvesValides() { return S.joueurClaims.filter(function (c) { return c.objId; }).length; }
  function majEtoilesLive() {
    if (S.mode !== "solo") return;
    var el = $("#play-stars"); if (!el) return;
    var n = etoilesPour(motsTrouvesValides(), S.soloAvail);
    el.textContent = "⭐".repeat(n) + "☆".repeat(3 - n);
  }

  /* =========================================================
     GAMEPLAY commun (solo + duel)
     ========================================================= */
  function demarrerSolo(L, avail) {
    S.mode = "solo"; S.lettre = L; S.soloAvail = avail; S.duree = 60;
    S.joueurClaims = []; S.clesJoueur = new Set(); S.streak = 0; S.scoreSolo = 0; S.motsIndices = {};
    lancerPartie("Niveau · « " + L.toUpperCase() + " »");
    var s = seuilsEtoiles(avail);
    $("#play-objectif").innerHTML = '🎯 ⭐ ' + s.s1 + ' · ⭐⭐ ' + s.s2 + ' · ⭐⭐⭐ ' + s.s3 +
      ' &nbsp; <span id="play-stars">☆☆☆</span>';
  }

  function demarrerDuel() {
    if (!S.ctx) compilerMonde(S.mondeIndex);
    S.mode = "duel"; S.manche = 0; S.lettresUtilisees = []; S.scoreJoueur = 0; S.scoreBot = 0;
    S.callsRestants = CALLS; S.manchesLog = [];
    prochaineMancheDuel();
  }
  function prochaineMancheDuel() {
    S.manche++;
    S.lettre = Engine.tireLettre(S.ctx, S.seuil, S.lettresUtilisees); S.lettresUtilisees.push(S.lettre);
    S.joueurClaims = []; S.botClaims = []; S.clesJoueur = new Set(); S.streak = 0; S.motsIndices = {};
    S.selection = []; S.roundJoueur = 0; S.roundBot = 0; S.duree = 60;
    lancerPartie("Duel " + S.manche + "/" + S.nbManches + " · « " + S.lettre.toUpperCase() + " »");
    $("#play-objectif").innerHTML = "⚔️ Trouve plus de mots que le bot";
  }

  function lancerPartie(titre) {
    montrer("play"); Ads.banner(false);
    $("#play-title").textContent = titre;
    $("#liste-mots").innerHTML = ""; majCompteur();
    $("#play-pts").textContent = "0 pts";
    $("#play-hint").style.display = "none";
    $("#saisie").value = ""; $("#saisie").disabled = true;
    $("#btn-add-mot").style.display = Store.reglages().createur ? "" : "none";
    preparerScene(); rendreBonusBar();
    // décompte
    var ov = $("#overlay-decompte"), el = $("#decompte"); ov.classList.add("active");
    var n = 3; el.classList.remove("go"); el.textContent = n;
    var it = setInterval(function () {
      n--; if (n > 0) el.textContent = n;
      else if (n === 0) { el.textContent = "GO"; el.classList.add("go"); }
      else { clearInterval(it); ov.classList.remove("active"); demarrerChrono(); }
    }, 700);
  }

  function demarrerChrono() {
    // Sur mobile : PAS de focus auto (sinon on part en mode réduit sans clavier).
    // On reste en mode 2 (tout le design) ; le mode réduit s'active au tap.
    var s = $("#saisie"); s.disabled = false; if (!TACTILE) s.focus();
    S.restant = S.duree; S._lastTick = 0; majFuse();
    S.timer = setInterval(function () {
      S.restant -= 0.1;
      if (S.restant <= 0) { S.restant = 0; majFuse(); finPartie(); return; }
      majFuse();
      // tic-tac qui accélère (et monte en aigu) sur les 20 dernières secondes
      if (S.restant <= 20) {
        var now = performance.now();
        var interval = Math.max(90, S.restant * 45);
        if (now - S._lastTick >= interval) {
          tone(1000 + (20 - S.restant) * 26, 0.045, 0.06);
          S._lastTick = now;
        }
      }
    }, 100);
  }

  function majFuse() {
    var pct = Math.max(0, Math.min(1, S.restant / S.duree)); // borné (le temps peut dépasser la durée)
    $("#fuse-flame").style.left = (pct * 100) + "%";
    $("#fuse-burn").style.width = ((1 - pct) * 100) + "%";
    var t = Math.ceil(S.restant), mm = Math.floor(t / 60), ss = t % 60;
    $("#play-time").textContent = mm + ":" + (ss < 10 ? "0" : "") + ss;
    $("#fuse-row").classList.toggle("urgent", S.restant <= 10);
  }

  function soumettre(motAuto) {
    var input = $("#saisie");
    var auto = motAuto != null;
    var brut = auto ? motAuto : input.value;
    if (!String(brut).trim()) return;
    var res = Engine.classer(S.ctx, brut, S.lettre, { floue: true });

    // Aucune pénalité : un mauvais mot est simplement ignoré (petit shake).
    if (res.statut === "rejet") { if (!auto) secoue(input); return; }

    var claim = res.statut === "valide" ? { objId: res.objId, display: res.display } : { key: res.key, display: res.display };
    var cle = Engine.cleUnicite(claim);
    if (!auto) input.value = "";

    if (S.clesJoueur.has(cle)) { if (!auto) secoue(input); return; } // déjà joué : ignoré, sans pénalité

    if (res.statut === "reclame") { // bonne lettre mais pas dans la liste
      if (S.mode === "solo") { secoue(input); return; } // ignoré, aucune pénalité
      // en duel : on l'ajoute (bluff possible §9)
      S.clesJoueur.add(cle); S.joueurClaims.push(claim); ajouterChip(claim, "reclame");
      majCompteur(); bip(392); return;
    }

    // mot valide
    S.clesJoueur.add(cle); S.joueurClaims.push(claim); ajouterChip(claim, "valide");
    majCompteur(); bip(660);
    if (S.mode === "solo") {
      gagnerPointsSolo(res.objId); majEtoilesLive();
      toast("✅ " + res.display + "  +2,5 s ⏱️", "ok");
      if (motsRestants().length === 0) setTimeout(finPartie, 350); // tout trouvé → fin anticipée
    } else {
      toast("Trouvé : " + res.display + " !", "ok");
    }
  }

  function gagnerPointsSolo(objId) {
    var obj = S.ctx.byId.get(objId), f = obj ? obj.f : 3;
    var base = 10 + (6 - f);        // objet rare = plus de points (11..15)
    S.streak++;
    var mult = Math.min(2, 1 + 0.08 * (S.streak - 1)); // série (positive uniquement)
    S.scoreSolo += Math.round(base * mult);
    $("#play-pts").textContent = S.scoreSolo + " pts";
    S.restant += 2.5; majFuse(); // +2,5 s par mot -> permet de tout trouver / viser 3★
    var ft = $("#play-time"); if (ft) { ft.classList.remove("flash-plus"); void ft.offsetWidth; ft.classList.add("flash-plus"); }
  }

  function ajouterChip(claim, statut) {
    var chip = document.createElement("span");
    var cls = statut === "valide" ? "valide" : (statut === "reclame" ? "reclame" : "neutre");
    chip.className = "chip " + cls; chip.textContent = claim.display;
    $("#liste-mots").prepend(chip);
  }
  function majCompteur() {
    if (S.mode === "solo") { $("#compteur").textContent = motsTrouvesValides() + " / " + S.soloAvail + " mots"; }
    else { var n = S.joueurClaims.length; $("#compteur").textContent = n + (n > 1 ? " mots" : " mot"); }
  }

  /* ---- Bonus en partie ---- */
  function rendreBonusBar() {
    var bar = $("#bonus-bar"); bar.innerHTML = "";
    ["joker", "lettre", "plus15"].forEach(function (id) {
      var b = document.createElement("button"); b.className = "bonus-btn";
      var n = Store.bonus()[id] || 0;
      b.innerHTML = BONUS[id].emoji + '<small>' + BONUS[id].nom + '</small><span class="cnt">' + n + '</span>';
      b.disabled = n <= 0;
      b.onclick = function () { utiliserBonus(id, b); };
      bar.appendChild(b);
    });
  }
  function motsRestants() {
    var map = S.ctx.parLettre[S.lettre]; if (!map) return [];
    var trouves = {}; S.joueurClaims.forEach(function (c) { if (c.objId) trouves[c.objId] = 1; });
    var out = [];
    map.forEach(function (mot, id) { if (!trouves[id]) out.push({ objId: id, mot: mot }); });
    return out;
  }
  // mots restants qui n'ont pas déjà servi d'indice (un Joker et une Lettre
  // ne portent jamais sur le même mot au cours d'une même partie).
  function motsRestantsPourIndice() {
    return motsRestants().filter(function (x) { return !S.motsIndices[x.objId]; });
  }
  function utiliserBonus(id, btn) {
    if (!Store.aBonus(id)) return;
    if (id === "plus15") {
      Store.utiliserBonus(id); S.restant += 15; majFuse(); toast("+15 secondes ⏳", "ok");
    } else if (id === "joker") {
      var rr = motsRestantsPourIndice(); if (!rr.length) { toast("Rien à dévoiler !", "non"); return; }
      Store.utiliserBonus(id);
      var pick = rr[Math.floor(Math.random() * rr.length)];
      S.motsIndices[pick.objId] = true;
      var claim = { objId: pick.objId, display: pick.mot }; // mot de la lettre du niveau
      S.clesJoueur.add(Engine.cleUnicite(claim)); S.joueurClaims.push(claim); ajouterChip(claim, "valide");
      majCompteur();
      if (S.mode === "solo") {
        gagnerPointsSolo(pick.objId); majEtoilesLive();
        if (motsRestants().length === 0) setTimeout(finPartie, 350);
      }
      toast("Joker : " + pick.mot + " 🃏", "ok");
    } else if (id === "lettre") {
      // mot d'un seul tenant (sans espace) de préférence, différent d'un joker
      var pool = motsRestantsPourIndice();
      var simples = pool.filter(function (x) { return !/\s/.test(x.mot); });
      var cand = (simples.length ? simples : pool);
      if (!cand.length) { toast("Aucun indice dispo !", "non"); return; }
      Store.utiliserBonus(id);
      var p = cand[Math.floor(Math.random() * cand.length)];
      S.motsIndices[p.objId] = true;
      var lettres = melange(p.mot.replace(/[^a-zA-Zàâäéèêëîïôöùûüçœæ-]/g, "").split(""));
      $("#play-hint").innerHTML = "🔤 Remets dans l'ordre : <b>" +
        lettres.map(function (c) { return c.toUpperCase(); }).join(" · ") + "</b>";
      $("#play-hint").style.display = "";
      toast("Indice affiché 🔤", "ok");
    }
    rendreBonusBar();
    $("#saisie").focus();
  }
  function melange(arr) {
    var a = arr.slice(), orig = a.join("");
    for (var t = 0; t < 6; t++) {
      for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var tmp = a[i]; a[i] = a[j]; a[j] = tmp; }
      if (a.join("") !== orig || a.length < 2) break;
    }
    return a;
  }

  /* ---- Fin de partie : image verte qui se brise, puis résultat ---- */
  function finPartie() {
    clearInterval(S.timer); $("#saisie").disabled = true;
    Store.ajouterMinutes(1); Store.incrStat("partiesJouees");
    shatterScene(function () { if (S.mode === "solo") finSolo(); else finMancheDuel(); });
  }

  function finSolo() {
    var m = mondesPrets()[S.mondeIndex], L = S.lettre;
    var trouves = motsTrouvesValides();
    var avail = S.soloAvail || 1;
    var stars = etoilesPour(trouves, avail);
    var tout = trouves >= avail;
    // bonus de complétion (gros si le niveau compte beaucoup de mots) + vitesse
    if (tout) S.scoreSolo += (avail > 6 ? avail * 10 : 15) + Math.round(S.restant) * 2;
    var prevStars = Store.etoiles(m.id, L), prevBest = Store.best(m.id, L);
    var record = S.scoreSolo > prevBest;
    Store.enregistrerNiveau(m.id, L, stars, S.scoreSolo);
    Store.incrStat("motsTrouves", trouves);
    var gainEtoiles = Math.max(0, stars - prevStars);
    var pieces = 5 + gainEtoiles * 10 + (record ? 5 : 0) + (tout && avail > 6 ? 15 : 0);
    Store.ajouterPieces(pieces);

    var lettres = Engine.lettresValides(S.ctx, S.seuil);
    var idxL = lettres.indexOf(L);
    var aSuivant = stars >= 1 && idxL >= 0 && idxL < lettres.length - 1;
    var titre = stars >= 3 ? "🎉 Parfait !" : stars === 2 ? "🌟 Bravo !" : stars === 1 ? "✅ Réussi !" : "Presque…";

    var html =
      '<div class="big-stars ' + (stars ? "gagne" : "") + '">' + (stars ? "⭐".repeat(stars) + "☆".repeat(3 - stars) : "☆☆☆") + '</div>' +
      '<h2 class="serif" style="text-align:center">' + titre + '</h2>' +
      (stars ? '<p style="text-align:center;color:var(--green-d);font-weight:800">' + (tout ? "🎉 Tous les mots trouvés !" : "Bien joué, niveau validé !") + '</p>'
             : '<p style="text-align:center;color:var(--ink-soft)">Trouve 1 ou 2 mots de plus pour valider !</p>') +
      '<div class="result-line"><span>Mots trouvés</span><span class="v">' + trouves + '</span></div>' +
      '<div class="result-line"><span>Score</span><span class="v">' + S.scoreSolo + ' pts' + (record ? ' 🏅' : '') + '</span></div>' +
      '<div class="result-line"><span>Record</span><span class="v">' + Math.max(prevBest, S.scoreSolo) + ' pts</span></div>' +
      '<div class="result-line"><span>Pièces gagnées</span><span class="v gain">+' + pieces + ' 🪙</span></div>' +
      '<div class="actions" style="display:flex;gap:10px;margin-top:14px">' +
      '<button class="btn ghost" id="r-quitter">Quitter</button>' +
      '<button class="btn ghost" id="r-rejouer">Rejouer</button>' +
      (aSuivant ? '<button class="btn green" id="r-suivant">Suivant →</button>'
                : '<button class="btn green" id="r-carte">Carte</button>') + '</div>' +
      '<div class="actions" style="margin-top:8px"><button class="btn coin" id="r-double" style="width:100%">📺 Doubler mes pièces</button></div>';
    $("#result-content").innerHTML = html; montrer("result");

    if (stars >= 1) { confettis(stars); jingleVictoire(stars); } else { bip(300); }

    var bDouble = $("#r-double");
    bDouble.onclick = function () {
      bDouble.disabled = true;
      Ads.rewarded().then(function (ok) { if (ok) { Store.ajouterPieces(pieces); majPieces(); toast("+" + pieces + " pièces ! 🪙", "coin"); } });
    };
    $("#r-quitter").onclick = function () { Ads.interstitial(); montrer("map"); };
    $("#r-rejouer").onclick = function () { demarrerSolo(L, avail); };
    var bSuiv = $("#r-suivant"); if (bSuiv) bSuiv.onclick = function () { niveauSuivant(L); };
    var bCarte = $("#r-carte"); if (bCarte) bCarte.onclick = function () { Ads.interstitial(); montrer("map"); };
  }

  // Passe au niveau (lettre) suivant du monde, ou revient à la carte si dernier.
  function niveauSuivant(Lcourante) {
    var lettres = Engine.lettresValides(S.ctx, S.seuil);
    var idx = lettres.indexOf(Lcourante);
    if (idx >= 0 && idx < lettres.length - 1) {
      var L = lettres[idx + 1];
      demarrerSolo(L, Engine.nbObjetsPourLettre(S.ctx, L));
    } else { montrer("map"); }
  }

  // Feux d'artifice / confettis + petit jingle de victoire.
  function confettis(force) {
    var n = 40 + (force || 1) * 28;
    var couleurs = ["#6c5ce7", "#22c55e", "#f5b301", "#ff7a66", "#16c2b0", "#ff6fae", "#4aa3ff"];
    var host = document.createElement("div"); host.className = "confetti-host";
    for (var i = 0; i < n; i++) {
      var p = document.createElement("i");
      p.style.background = couleurs[i % couleurs.length];
      p.style.left = (50 + (Math.random() * 2 - 1) * 42) + "%";
      p.style.setProperty("--dx", ((Math.random() * 2 - 1) * 230) + "px");
      p.style.setProperty("--dy", (220 + Math.random() * 470) + "px");
      p.style.setProperty("--rot", (Math.random() * 960 - 480) + "deg");
      p.style.animationDelay = (Math.random() * 0.22) + "s";
      host.appendChild(p);
    }
    document.getElementById("app").appendChild(host);
    setTimeout(function () { host.remove(); }, 2700);
  }
  function jingleVictoire(stars) {
    if (Store.reglages().sons === false) return;
    var notes = stars >= 3 ? [660, 880, 1175, 1568] : [660, 880, 1175];
    notes.forEach(function (f, i) { setTimeout(function () { tone(f, 0.16, 0.06); }, i * 110); });
  }

  /* =========================================================
     DUEL — révélation + Call Image
     ========================================================= */
  function finMancheDuel() {
    S.botClaims = Engine.jouerBot(S.ctx, S.lettre, LEURRES, 0.8);
    var tot = Engine.scorer(S.joueurClaims, S.botClaims);
    S.roundJoueur = tot.totalJoueur; S.roundBot = tot.totalBot; S.selection = [];
    rendreRevelation(); montrer("reveal");
  }
  function rendreRevelation() {
    $("#rev-lettre").textContent = S.lettre.toUpperCase();
    majScoresRev();
    var pj = $("#rev-joueur .pile"); pj.innerHTML = "";
    if (!S.joueurClaims.length) pj.appendChild(vide("Aucun mot…"));
    S.joueurClaims.forEach(function (c) { var r = motRev(c.display, c.pts, c.partage); r.classList.add(Engine.estValide(c) ? "valide-reveal" : "reclame"); pj.appendChild(r); });
    var pb = $("#rev-bot .pile"); pb.innerHTML = "";
    if (!S.botClaims.length) pb.appendChild(vide("Rien."));
    S.botClaims.forEach(function (c, idx) { var r = motRev(c.display, c.pts, c.partage); r.classList.add("contestable"); r.setAttribute("data-idx", idx); r.onclick = function () { basculer(idx, r); }; pb.appendChild(r); });
    majCallInfo(); $("#btn-valider-calls").style.display = ""; $("#btn-suite-manche").style.display = "none";
  }
  function motRev(mot, pts, partage) {
    var r = document.createElement("div"); r.className = "mot-rev " + (partage ? "partage" : "unique");
    r.innerHTML = '<span>' + esc(mot) + '</span><span class="pts">' + (partage ? "partagé" : "unique") + " · " + (pts != null ? pts : 0) + " pt" + (pts > 1 ? "s" : "") + '</span>';
    return r;
  }
  function vide(t) { var d = document.createElement("div"); d.className = "mot-rev"; d.innerHTML = '<span class="masque">' + t + '</span>'; return d; }
  function basculer(idx, row) {
    var p = S.selection.indexOf(idx);
    if (p >= 0) { S.selection.splice(p, 1); row.classList.remove("choisi"); }
    else { if (S.selection.length >= S.callsRestants) { toast("Plus de contestation", "non"); return; } S.selection.push(idx); row.classList.add("choisi"); }
    majCallInfo();
  }
  function majScoresRev() { $("#rev-score-joueur").textContent = Math.max(0, Math.round(S.roundJoueur)); $("#rev-score-bot").textContent = Math.max(0, Math.round(S.roundBot)); }
  function majCallInfo() {
    $("#calls-restants").textContent = S.callsRestants - S.selection.length;
    $("#btn-valider-calls").textContent = S.selection.length ? "Lancer " + S.selection.length + " Call Image ⚔" : "Passer";
  }
  function validerCalls() {
    var journal = [];
    S.selection.forEach(function (idx) {
      var cible = S.botClaims[idx], r = Engine.resoudreCall(cible, ENJEU);
      S.roundJoueur += r.deltaContestataire; S.roundBot += r.deltaProprietaire;
      var row = $('#rev-bot .mot-rev[data-idx="' + idx + '"]'); if (row) row.classList.add(r.cibleValide ? "valide-reveal" : "bluff-reveal");
      journal.push(r.cibleValide ? "❌ « " + cible.display + " » était réel : −" + ENJEU + " pts." : "✅ Bluff démasqué « " + cible.display + " » : +" + ENJEU + " pts.");
    });
    S.botClaims.forEach(function (c, idx) { if (S.selection.indexOf(idx) >= 0) return; var row = $('#rev-bot .mot-rev[data-idx="' + idx + '"]'); if (row) row.classList.add(Engine.estValide(c) ? "valide-reveal" : "bluff-reveal"); });
    var cibleBot = Engine.botConteste(S.joueurClaims, 0.7);
    if (cibleBot) {
      var r2 = Engine.resoudreCall(cibleBot, ENJEU);
      S.roundBot += r2.deltaContestataire; S.roundJoueur += r2.deltaProprietaire;
      journal.push("🤖 Le bot conteste « " + cibleBot.display + " » : −" + (ENJEU + (cibleBot.pts || 0)) + " pts.");
      var rows = $$("#rev-joueur .mot-rev"), ij = S.joueurClaims.indexOf(cibleBot); if (rows[ij]) rows[ij].classList.add("bluff-reveal");
    }
    S.roundJoueur = Math.max(0, Math.round(S.roundJoueur)); S.roundBot = Math.max(0, Math.round(S.roundBot));
    majScoresRev();
    S.callsRestants -= S.selection.length;
    S.scoreJoueur += S.roundJoueur; S.scoreBot += S.roundBot;
    S.manchesLog.push({ lettre: S.lettre.toUpperCase(), j: S.roundJoueur, b: S.roundBot });
    $$("#rev-bot .contestable").forEach(function (r) { r.classList.remove("contestable"); r.style.pointerEvents = "none"; });
    var jd = $("#call-journal"); jd.innerHTML = ""; journal.forEach(function (t) { var p = document.createElement("div"); p.textContent = t; jd.appendChild(p); });
    $("#btn-valider-calls").style.display = "none"; $("#btn-suite-manche").style.display = "";
  }
  function suiteManche() {
    if (S.manche >= S.nbManches) finDuel();
    else prochaineMancheDuel();
  }
  function finDuel() {
    var verdict, cls, pieces;
    if (S.scoreJoueur > S.scoreBot) { verdict = "🏆 Victoire !"; cls = "win"; pieces = 30; }
    else if (S.scoreJoueur < S.scoreBot) { verdict = "Défaite…"; cls = "lose"; pieces = 5; }
    else { verdict = "Égalité"; cls = "draw"; pieces = 15; }
    Store.ajouterPieces(pieces);
    var carte = ["Trouvaille · Duel"];
    S.manchesLog.forEach(function (mm, i) { carte.push((mm.j > mm.b ? "🟩" : mm.j < mm.b ? "🟥" : "🟨") + " Manche " + (i + 1) + " [" + mm.lettre + "]  " + mm.j + "–" + mm.b); });
    carte.push("————\nTotal  " + S.scoreJoueur + "–" + S.scoreBot);
    var html =
      '<div class="verdict ' + cls + '">' + verdict + '</div>' +
      '<div class="result-line"><span>Toi</span><span class="v">' + S.scoreJoueur + '</span></div>' +
      '<div class="result-line"><span>Bot</span><span class="v">' + S.scoreBot + '</span></div>' +
      '<div class="result-line"><span>Pièces</span><span class="v gain">+' + pieces + ' 🪙</span></div>' +
      '<div class="carte-partage" style="margin-top:12px">' + esc(carte.join("\n")) + '</div>' +
      '<div class="actions" style="display:flex;gap:10px;margin-top:14px">' +
      '<button class="btn ghost" id="d-copier">📋 Copier</button>' +
      '<button class="btn green" id="d-rejouer">Revanche</button>' +
      '<button class="btn" id="d-accueil">Accueil</button></div>';
    $("#result-content").innerHTML = html; montrer("result");
    $("#d-copier").onclick = function () { if (navigator.clipboard) navigator.clipboard.writeText(carte.join("\n")).then(function () { toast("Copié !", "ok"); }); };
    $("#d-rejouer").onclick = function () { demarrerDuel(); };
    $("#d-accueil").onclick = function () { Ads.interstitial(); montrer("home"); };
  }

  /* =========================================================
     BOUTIQUE / BANQUE / CLASSEMENT / RÉGLAGES
     ========================================================= */
  function rendreBoutique() {
    var g = $("#shop-grid"); g.innerHTML = "";
    SHOP.forEach(function (it) {
      var b = BONUS[it.id], own = Store.bonus()[it.id] || 0;
      var card = document.createElement("div"); card.className = "card shop-item";
      card.innerHTML = '<div class="em">' + b.emoji + '</div><div class="nm">' + b.nom + '</div><div class="ds">' + b.desc + '</div>' +
        '<div class="own">Tu en as : ' + own + '</div><button class="btn coin sm">' + it.prix + ' 🪙</button>';
      card.querySelector("button").onclick = function () {
        if (Store.depenser(it.prix)) { Store.ajouterBonus(it.id, 1); majPieces(); rendreBoutique(); toast("Acheté : " + b.nom, "ok"); }
        else toast("Pas assez de pièces", "non");
      };
      g.appendChild(card);
    });
  }
  function rendreBanque() { majPieces(); }
  function rendreClassement() {
    var moi = Store.profil(), best = Store.stats().meilleurScore || 0;
    var bots = [
      { av: "🦊", nm: "Renard72", sc: 640 }, { av: "🐼", nm: "PandaZen", sc: 520 }, { av: "🦄", nm: "Licorne★", sc: 470 },
      { av: "🐙", nm: "Poulpe", sc: 390 }, { av: "🐸", nm: "Kero", sc: 300 }, { av: "🌵", nm: "Cactus", sc: 240 }
    ];
    bots.push({ av: moi.avatar, nm: moi.pseudo || "Toi", sc: best, me: true });
    bots.sort(function (a, b) { return b.sc - a.sc; });
    var list = $("#lb-list"); list.innerHTML = "";
    bots.forEach(function (r, i) {
      var row = document.createElement("div"); row.className = "lb-row" + (r.me ? " me" : "");
      row.innerHTML = '<span class="rk ' + (i < 3 ? "g" + (i + 1) : "") + '">' + (i + 1) + '</span><span class="av">' + r.av + '</span>' +
        '<span class="nm">' + esc(r.nm) + '</span><span class="sc">' + r.sc + '</span>';
      list.appendChild(row);
    });
  }
  function rendreReglages() {
    var rg = Store.reglages();
    $("#sw-theme").classList.toggle("on", rg.theme === "sombre");
    $("#sw-sons").classList.toggle("on", rg.sons !== false);
    $("#sw-pub").classList.toggle("on", rg.pub !== false);
    $("#sw-createur").classList.toggle("on", rg.createur === true);
    $("#row-createur").style.display = rg.createur ? "" : "none";
    $("#row-export").style.display = rg.createur ? "" : "none";
    $("#reglages-version").textContent = "Trouvaille v" + VERSION_APP + " · " + (Ads.estNatif() ? "app" : "web") + " · " + Ads.plateforme();
  }

  /* =========================================================
     SCÈNE : zoom / pan
     ========================================================= */
  var vue = { scale: 1, min: 1, tx: 0, ty: 0, iw: 0, ih: 0 };
  function preparerScene() {
    var m = mondesPrets()[S.mondeIndex], img = $("#scene-img");
    if (img.getAttribute("data-src") !== m.image) {
      img.setAttribute("data-src", m.image);
      img.onload = function () { vue.iw = img.naturalWidth; vue.ih = img.naturalHeight; ajusterVue(); };
      img.src = encodeURI(m.image);
    } else if (vue.iw) ajusterVue();
    var hint = $("#scene-hint"); hint.style.opacity = "1"; clearTimeout(preparerScene._t);
    preparerScene._t = setTimeout(function () { hint.style.opacity = "0"; }, 3000);
  }
  function ajusterVue() {
    var sc = $("#scene"), cw = sc.clientWidth, ch = sc.clientHeight;
    if (!vue.iw) return; if (!cw || !ch) { requestAnimationFrame(ajusterVue); return; }
    vue.min = Math.max(cw / vue.iw, ch / vue.ih); vue.scale = vue.min;
    vue.tx = (cw - vue.iw * vue.scale) / 2; vue.ty = (ch - vue.ih * vue.scale) / 2; appliquer();
  }
  function clampPan() {
    var sc = $("#scene"), cw = sc.clientWidth, ch = sc.clientHeight, w = vue.iw * vue.scale, h = vue.ih * vue.scale;
    vue.tx = w <= cw ? (cw - w) / 2 : Math.min(0, Math.max(cw - w, vue.tx));
    vue.ty = h <= ch ? (ch - h) / 2 : Math.min(0, Math.max(ch - h, vue.ty));
  }
  function appliquer() { clampPan(); $("#scene-img").style.transform = "translate(" + vue.tx + "px," + vue.ty + "px) scale(" + vue.scale + ")"; }

  // Recale l'app sur la zone réellement visible (au-dessus du clavier mobile)
  // et bascule le mode "réduit" seulement si le clavier est vraiment ouvert.
  function ajusterViewport() {
    var vv = window.visualViewport; if (!vv) return;
    var app = document.getElementById("app");
    app.style.height = Math.round(vv.height) + "px";
    app.style.transform = vv.offsetTop ? "translateY(" + Math.round(vv.offsetTop) + "px)" : "none";
    var sp = $("#screen-play");
    if (sp) {
      var clavier = (window.innerHeight - vv.height) > 150; // clavier réellement ouvert
      var modal = $("#overlay").classList.contains("active") || $("#overlay-decompte").classList.contains("active");
      sp.classList.toggle("saisie-active", clavier && sp.classList.contains("active") && !modal);
      if (sp.classList.contains("active") && vue.iw) ajusterVue();
    }
  }
  function zoomVers(cx, cy, f) {
    var r = $("#scene").getBoundingClientRect(), px = cx - r.left, py = cy - r.top;
    var ns = Math.min(vue.min * 6, Math.max(vue.min, vue.scale * f)), k = ns / vue.scale;
    vue.tx = px - (px - vue.tx) * k; vue.ty = py - (py - vue.ty) * k; vue.scale = ns; appliquer();
  }
  function initScene() {
    var sc = $("#scene");
    sc.addEventListener("wheel", function (e) { e.preventDefault(); zoomVers(e.clientX, e.clientY, e.deltaY < 0 ? 1.15 : 1 / 1.15); }, { passive: false });
    var pts = {}, lastDist = 0;
    sc.addEventListener("pointerdown", function (e) { sc.setPointerCapture(e.pointerId); pts[e.pointerId] = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: Date.now() }; sc.classList.add("grabbing"); });
    sc.addEventListener("pointermove", function (e) {
      if (!pts[e.pointerId]) return; var ids = Object.keys(pts);
      if (ids.length === 1) { var p = pts[e.pointerId]; vue.tx += e.clientX - p.x; vue.ty += e.clientY - p.y; p.x = e.clientX; p.y = e.clientY; appliquer(); }
      else if (ids.length === 2) { pts[e.pointerId] = { x: e.clientX, y: e.clientY }; var a = pts[ids[0]], b = pts[ids[1]], dist = Math.hypot(a.x - b.x, a.y - b.y); if (lastDist) zoomVers((a.x + b.x) / 2, (a.y + b.y) / 2, dist / lastDist); lastDist = dist; }
    });
    function up(e) {
      var p = pts[e.pointerId];
      delete pts[e.pointerId]; lastDist = 0;
      if (!Object.keys(pts).length) sc.classList.remove("grabbing");
      // Tap simple ? -> double-tap recadre l'image (remplace l'ancien bouton ⤢).
      if (p && Math.hypot(e.clientX - p.sx, e.clientY - p.sy) < 10 && Date.now() - p.t < 250) {
        var now = Date.now();
        if (now - (sc._lastTap || 0) < 320) { ajusterVue(); sc._lastTap = 0; } else sc._lastTap = now;
      }
    }
    sc.addEventListener("pointerup", up); sc.addEventListener("pointercancel", up);
    window.addEventListener("resize", function () { if (vue.iw && $("#screen-play").classList.contains("active")) ajusterVue(); });
  }

  /* =========================================================
     MODAL / TOAST / SON
     ========================================================= */
  function ouvrirModal(html) { $("#overlay-content").innerHTML = html; $("#overlay").classList.add("active"); }
  function fermerModal() { $("#overlay").classList.remove("active"); }
  var toastT;
  function toast(msg, type) { var t = $("#toast"); t.textContent = msg; t.className = "toast show " + (type || ""); clearTimeout(toastT); toastT = setTimeout(function () { t.className = "toast " + (type || ""); }, 1500); }
  function secoue(el) { el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake"); }
  var audioCtx = null;
  function tone(freq, dur, vol) {
    if (Store.reglages().sons === false) return;
    dur = dur || 0.18; vol = vol || 0.05;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      var o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = "sine"; o.frequency.value = freq; g.gain.value = vol;
      o.connect(g); g.connect(audioCtx.destination); o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
      o.stop(audioCtx.currentTime + dur + 0.02);
    } catch (e) {}
  }
  function bip(freq) { tone(freq, 0.18, 0.05); }

  /* Effet de fin : flash vert + image brisée en morceaux, puis callback. */
  function shatterScene(cb) {
    var sc = $("#scene"); if (!sc || !vue.iw) { if (cb) cb(); return; }
    var w = sc.clientWidth, h = sc.clientHeight;
    var cont = document.createElement("div"); cont.className = "shatter";
    var flash = document.createElement("div"); flash.className = "shatter-flash"; cont.appendChild(flash);
    var cols = 5, rows = 6, cw = w / cols, ch = h / rows;
    var url = encodeURI(mondesPrets()[S.mondeIndex].image);
    var bgW = vue.iw * vue.scale, bgH = vue.ih * vue.scale;
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      var f = document.createElement("div"); f.className = "frag";
      f.style.left = (c * cw) + "px"; f.style.top = (r * ch) + "px";
      f.style.width = cw + "px"; f.style.height = ch + "px";
      f.style.backgroundImage = "url('" + url + "')";
      f.style.backgroundSize = bgW + "px " + bgH + "px";
      f.style.backgroundPosition = (vue.tx - c * cw) + "px " + (vue.ty - r * ch) + "px";
      cont.appendChild(f);
      (function (frag) {
        requestAnimationFrame(function () {
          setTimeout(function () {
            var dx = (Math.random() * 2 - 1) * 220;
            var dy = (Math.random() * -1 - 0.2) * 240 + 140;
            var rot = (Math.random() * 2 - 1) * 200;
            frag.style.transform = "translate(" + dx + "px," + dy + "px) rotate(" + rot + "deg)";
            frag.style.opacity = "0";
          }, 180);
        });
      })(f);
    }
    sc.appendChild(cont);
    tone(180, 0.5, 0.08); // "crash"
    setTimeout(function () { cont.remove(); if (cb) cb(); }, 1150);
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* =========================================================
     WORLD PICKER (chapitre)
     ========================================================= */
  function ouvrirWorldPicker() {
    var html = '<h2 class="serif">Choisis un monde</h2><div style="display:flex;flex-direction:column;gap:10px;margin-top:10px">';
    mondesPrets().forEach(function (m, i) {
      var th = THEMES[m.id] || { emoji: "🗺️" };
      html += '<button class="btn ghost" data-w="' + i + '" style="justify-content:flex-start;gap:10px">' + th.emoji + ' ' + esc(m.titre) + '</button>';
    });
    html += '</div><button class="btn ghost sm" id="w-fermer" style="margin-top:12px">Fermer</button>';
    ouvrirModal(html);
    $$('#overlay [data-w]').forEach(function (b) { b.onclick = function () { compilerMonde(parseInt(b.getAttribute("data-w"), 10)); fermerModal(); rendreCarte(); }; });
    $("#w-fermer").onclick = fermerModal;
  }

  /* =========================================================
     CARNET DE NOTES — repérer des objets à m'envoyer
     ========================================================= */
  function ouvrirNote() {
    var m = mondesPrets()[S.mondeIndex];
    ouvrirModal(
      '<h2 class="serif">📝 Noter des mots</h2>' +
      '<p style="color:var(--ink-soft)">Note les objets que tu vois sur <b>' + esc(m.titre) + '</b> ' +
      '(toutes lettres). Tu me les enverras pour enrichir le jeu.</p>' +
      '<div class="saisie-ligne"><input class="field" id="note-mot" placeholder="Un objet que tu vois…" autocomplete="off" style="margin:0">' +
      '<button class="btn green" id="note-add">Noter</button></div>' +
      '<div class="liste-mots" id="note-liste" style="margin-top:12px"></div>' +
      '<div class="actions"><button class="btn ghost" id="note-fermer">Fermer</button></div>');
    function rendre() {
      var box = $("#note-liste"); box.innerHTML = "";
      var arr = Store.notes(m.id);
      if (!arr.length) { box.innerHTML = '<span style="color:var(--ink-soft);font-size:.85rem">Aucune note pour l\'instant.</span>'; return; }
      arr.forEach(function (w, i) {
        var chip = document.createElement("span"); chip.className = "chip neutre"; chip.style.cursor = "pointer";
        chip.textContent = w + "  ✕";
        chip.title = "Retirer";
        chip.onclick = function () { Store.retirerNote(m.id, i); rendre(); };
        box.appendChild(chip);
      });
    }
    function ajouter() {
      var champ = $("#note-mot"), v = (champ.value || "").trim();
      if (v.length < 2) { toast("Écris un mot", "non"); return; }
      Store.ajouterNote(m.id, v); champ.value = ""; champ.focus(); rendre();
      toast("Noté : " + v + " 📝", "ok");
    }
    $("#note-add").onclick = ajouter;
    $("#note-mot").addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); ajouter(); } });
    $("#note-fermer").onclick = function () { fermerModal(); if ($("#screen-play").classList.contains("active")) $("#saisie").focus(); };
    rendre();
    setTimeout(function () { var c = $("#note-mot"); if (c) c.focus(); }, 50);
  }

  function ouvrirToutesNotes() {
    var all = Store.toutesNotes(), lignes = [], vide = true;
    mondesPrets().forEach(function (m) {
      var arr = all[m.id]; if (!arr || !arr.length) return;
      vide = false; lignes.push(m.titre + " : " + arr.join(", "));
    });
    var txt = vide ? "(aucune note — note des mots pendant une partie avec 📝)" : lignes.join("\n");
    ouvrirModal(
      '<h2 class="serif">📝 Mes mots notés</h2>' +
      '<p style="color:var(--ink-soft)">Ta liste par image. <b>Copie-la et envoie-la-moi</b> : je l\'intègre au dictionnaire pour tous les joueurs.</p>' +
      '<div class="carte-partage" style="text-align:left;max-height:240px;overflow:auto">' + esc(txt) + '</div>' +
      '<div class="actions">' +
      (vide ? '' : '<button class="btn ghost" id="notes-vider">Vider</button>') +
      '<button class="btn ghost" id="notes-fermer">Fermer</button>' +
      (vide ? '' : '<button class="btn green" id="notes-copier">📋 Copier</button>') + '</div>');
    $("#notes-fermer").onclick = fermerModal;
    var cp = $("#notes-copier"); if (cp) cp.onclick = function () { if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { toast("Copié !", "ok"); }); };
    var vd = $("#notes-vider"); if (vd) vd.onclick = function () { if (confirm("Vider toutes tes notes ?")) { Store.viderNotes(); ouvrirToutesNotes(); } };
  }

  /* =========================================================
     MODE CRÉATEUR — ajouter des mots au dictionnaire de l'image
     ========================================================= */
  function ouvrirAjoutMot() {
    var L = S.lettre.toUpperCase();
    ouvrirModal(
      '<h2 class="serif">➕ Ajouter un mot</h2>' +
      '<p style="color:var(--ink-soft)">Un objet visible sur l\'image qui commence par « ' + L + ' ». ' +
      'Il devient valable tout de suite (et pour tous après publication).</p>' +
      '<input class="field" id="am-mot" placeholder="Mot (commence par ' + L + ')" autocomplete="off" autocapitalize="off">' +
      '<input class="field" id="am-syn" placeholder="Synonymes, séparés par des virgules (optionnel)">' +
      '<div class="actions"><button class="btn ghost" id="am-annuler">Annuler</button>' +
      '<button class="btn green" id="am-ok">Ajouter</button></div>');
    var champ = $("#am-mot"); if (champ) setTimeout(function () { champ.focus(); }, 50);
    $("#am-annuler").onclick = function () { fermerModal(); $("#saisie").focus(); };
    function valider() {
      var mot = ($("#am-mot").value || "").trim();
      if (!mot) { toast("Écris un mot", "non"); return; }
      var n = Engine.normalize(mot);
      if (n.length < 2) { toast("Trop court", "non"); return; }
      if (n[0] !== Engine.normalize(S.lettre)) { toast("Doit commencer par « " + L + " »", "non"); return; }
      if (Engine.classer(S.ctx, mot, S.lettre, { floue: false }).statut === "valide") { toast("« " + mot + " » est déjà valable", "non"); fermerModal(); return; }
      var syns = ($("#am-syn").value || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
      var m = mondesPrets()[S.mondeIndex];
      var entry = [mot].concat(syns);
      Store.ajouterMotPerso(m.id, entry);
      compilerMonde(S.mondeIndex);                       // recompile avec le nouveau mot
      S.soloAvail = Engine.nbObjetsPourLettre(S.ctx, S.lettre);
      fermerModal();
      soumettre(mot);                                    // compté comme trouvé
      // publication en ligne (pour TOUS les joueurs) si un jeton est configuré
      if (Sync.aCle()) {
        toast("« " + mot + " » ajouté — publication…", "ok");
        Sync.publier(m.id, entry).then(function () { toast("Publié pour tous ✅", "ok"); })
          .catch(function () { toast("Ajouté ici ; publication en ligne échouée", "non"); });
      } else {
        toast("« " + mot + " » ajouté (sur cet appareil) 🎉", "ok");
      }
    }
    $("#am-ok").onclick = valider;
    $("#am-mot").addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); valider(); } });
  }

  function exporterMots() {
    var all = Store.tousMotsPerso(), lignes = [];
    Object.keys(all).forEach(function (mid) {
      if (!all[mid] || !all[mid].length) return;
      lignes.push("// " + mid + " — à coller dans OBJETS_" + mid.toUpperCase() + " :");
      all[mid].forEach(function (e) { lignes.push('  { mots: ["' + e.join('", "') + '"] },'); });
    });
    var txt = lignes.length ? lignes.join("\n") : "(aucun mot ajouté pour l'instant)";
    var actif = Sync.aCle();
    ouvrirModal(
      '<h2 class="serif">📤 Publier / exporter</h2>' +
      '<p style="color:var(--ink-soft)">Publication en ligne (pour <b>tous</b> les joueurs) : ' +
        (actif ? '<b style="color:var(--green-d)">active ✅</b>' : '<b style="color:var(--coral)">inactive</b>') + '</p>' +
      '<input class="field" id="ex-pat" type="password" placeholder="Jeton GitHub (une seule fois)" value="' + (actif ? "••••••••••" : "") + '">' +
      '<div class="actions" style="margin-bottom:8px">' +
        '<button class="btn ghost sm" id="ex-pat-save">Enregistrer le jeton</button>' +
        (actif ? '<button class="btn ghost sm" id="ex-pat-clear">Retirer</button>' : '') + '</div>' +
      '<p style="color:var(--ink-soft);font-size:.82rem">Le jeton reste sur <b>cet appareil</b> (jamais partagé). Voir STORES.md pour le créer. ' +
        'Sans jeton, tu peux publier manuellement : copie ci-dessous dans <b>js/data.js</b>.</p>' +
      '<div class="carte-partage" style="text-align:left;max-height:160px;overflow:auto">' + esc(txt) + '</div>' +
      '<div class="actions"><button class="btn ghost" id="ex-close">Fermer</button><button class="btn green" id="ex-copy">📋 Copier</button></div>');
    $("#ex-close").onclick = fermerModal;
    $("#ex-copy").onclick = function () { if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { toast("Copié !", "ok"); }); };
    $("#ex-pat-save").onclick = function () {
      var v = ($("#ex-pat").value || "").trim();
      if (!v || v.indexOf("•") === 0) { toast("Colle un jeton valide", "non"); return; }
      Sync.setCle(v); toast("Jeton enregistré ✅ publication activée", "ok"); exporterMots();
    };
    var clr = $("#ex-pat-clear"); if (clr) clr.onclick = function () { Sync.setCle(""); toast("Jeton retiré", ""); exporterMots(); };
  }

  /* =========================================================
     INIT
     ========================================================= */
  function appliquerTheme() { document.documentElement.setAttribute("data-theme", Store.reglages().theme === "sombre" ? "dark" : "light"); }

  function init() {
    appliquerTheme();
    Ads.init();
    majPieces();
    initScene();

    // onboarding
    $("#ob-suivant").onclick = obSuivant;
    $("#ob-passer").onclick = finirOnboarding;

    // accueil
    $("#btn-conquete").onclick = function () { if (!S.ctx) compilerMonde(0); montrer("map"); };
    $("#nav-duel").onclick = function () { demarrerDuel(); };
    $("#nav-boutique").onclick = function () { montrer("boutique"); };
    $("#nav-classement").onclick = function () { montrer("classement"); };
    $("#nav-reglages").onclick = function () { montrer("reglages"); };
    $("#home-coins").onclick = function () { montrer("banque"); };
    $("#home-avatar").onclick = function () { montrer("reglages"); };

    // navigation générique data-go
    $$("[data-go]").forEach(function (b) { b.onclick = function () { montrer(b.getAttribute("data-go")); }; });

    // carte
    $("#chapter-chip").onclick = ouvrirWorldPicker;

    // jeu
    $("#btn-envoyer").onclick = function () { soumettre(); }; // sans passer l'événement !
    // garde le focus de l'input (clavier ouvert) au tap sur "Go" sur mobile
    $("#btn-envoyer").addEventListener("mousedown", function (e) { e.preventDefault(); });
    $("#saisie").addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); soumettre(); } });
    // Le mode "réduit" (image plein écran) est piloté par l'OUVERTURE RÉELLE du
    // clavier (visualViewport), pas par le focus -> au démarrage on reste en
    // mode 2 (tout le design), et on passe en mode 3 seulement quand le clavier sort.
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", ajusterViewport);
      window.visualViewport.addEventListener("scroll", ajusterViewport);
    }
    $("#play-quitter").onclick = function () { clearInterval(S.timer); montrer(S.mode === "duel" ? "home" : "map"); };
    $("#btn-add-mot").onclick = ouvrirAjoutMot;
    $("#btn-note").onclick = ouvrirNote;
    $("#btn-notes").onclick = ouvrirToutesNotes;

    // duel reveal
    $("#btn-valider-calls").onclick = validerCalls;
    $("#btn-suite-manche").onclick = suiteManche;

    // boutique / banque
    $("#btn-rewarded-shop").onclick = function () { Ads.rewarded().then(function (ok) { if (ok) { Store.ajouterPieces(20); majPieces(); toast("+20 pièces ! 🪙", "coin"); } }); };
    $("#btn-rewarded-banque").onclick = function () { Ads.rewarded().then(function (ok) { if (ok) { Store.ajouterPieces(20); majPieces(); toast("+20 pièces ! 🪙", "coin"); } }); };
    $("#btn-cadeau").onclick = function () { Store.ajouterPieces(10); majPieces(); toast("+10 pièces 🎁", "coin"); };

    // classement tabs
    $$('#screen-classement [data-lb]').forEach(function (b) { b.onclick = function () { $$('#screen-classement [data-lb]').forEach(function (x) { x.classList.remove("on"); }); b.classList.add("on"); rendreClassement(); }; });

    // réglages
    $("#sw-theme").onclick = function () { var v = Store.reglages().theme === "sombre" ? "clair" : "sombre"; Store.setReglage("theme", v); appliquerTheme(); this.classList.toggle("on", v === "sombre"); };
    $("#sw-sons").onclick = function () { var v = !(Store.reglages().sons !== false); Store.setReglage("sons", v); this.classList.toggle("on", v); };
    $("#sw-pub").onclick = function () { var v = !(Store.reglages().pub !== false); Store.setReglage("pub", v); this.classList.toggle("on", v); Ads.banner(v && $("#screen-home").classList.contains("active")); };
    $("#sw-createur").onclick = function () { var v = !(Store.reglages().createur === true); Store.setReglage("createur", v); rendreReglages(); toast(v ? "Mode créateur activé 🛠️" : "Mode créateur désactivé", v ? "ok" : ""); };
    $("#btn-export").onclick = exporterMots;
    // Déblocage CACHÉ du mode créateur : taper 5× la ligne de version.
    var tapCrea = 0, tapCreaT = null;
    $("#reglages-version").addEventListener("click", function () {
      tapCrea++; clearTimeout(tapCreaT); tapCreaT = setTimeout(function () { tapCrea = 0; }, 1500);
      if (tapCrea >= 5) {
        tapCrea = 0;
        var v = !(Store.reglages().createur === true);
        Store.setReglage("createur", v); rendreReglages();
        toast(v ? "🛠️ Mode créateur débloqué" : "Mode créateur masqué", v ? "ok" : "");
      }
    });
    $("#btn-aide").onclick = function () { S.obStep = 1; montrer("onboarding"); rendreOnboarding(); $("#ob-passer").textContent = "Fermer"; };
    $("#btn-reset").onclick = function () { if (confirm("Effacer ta progression et tes pièces ?")) { Store.reset(); appliquerTheme(); S.obStep = 0; rendreOnboarding(); montrer("onboarding"); } };
    // Forcer la mise à jour : vide le cache + le service worker, puis recharge.
    // NE touche PAS à la progression (localStorage conservé).
    $("#btn-maj").onclick = function () {
      toast("Mise à jour en cours…", "");
      var taches = [];
      try { if (window.caches) taches.push(caches.keys().then(function (ks) { return Promise.all(ks.map(function (k) { return caches.delete(k); })); })); } catch (e) {}
      try { if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) taches.push(navigator.serviceWorker.getRegistrations().then(function (rs) { return Promise.all(rs.map(function (r) { return r.unregister(); })); })); } catch (e) {}
      Promise.all(taches).catch(function () {}).then(function () {
        var base = location.href.split("?")[0].split("#")[0];
        location.replace(base + "?maj=" + Date.now());
      });
    };

    function demarrer() {
      // hook de développement : index.html?dev=home|map|play|boutique…
      try {
        var dev = new URLSearchParams(location.search).get("dev");
        if (dev) {
          compilerMonde(0);
          if (dev === "play") { var LL = Engine.lettresValides(S.ctx, S.seuil)[2] || "c"; demarrerSolo(LL, Engine.nbObjetsPourLettre(S.ctx, LL)); }
          else montrer(dev);
          return;
        }
      } catch (e) {}
      if (Store.onboardingFait()) { S.ob = JSON.parse(JSON.stringify(Store.profil())); montrer("home"); }
      else { S.obStep = 0; rendreOnboarding(); montrer("onboarding"); }
    }
    // charge les mots partagés (pour TOUS les joueurs) puis démarre — jamais bloquant
    if (typeof Sync !== "undefined") Sync.charger().then(demarrer, demarrer); else demarrer();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
