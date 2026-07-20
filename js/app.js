/* ============================================================
   TROUVAILLE v2 — Application (habillage clair & coloré)
   Dépend de : data.js, engine.js, store.js, ads.js
   ============================================================ */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var ENJEU = 3, CALLS = 2;

  var S = {
    mondeIndex: 0, ctx: null, seuil: 5,
    mode: null,             // "solo" | "duel"
    lettre: "", duree: 60, restant: 0, timer: null,
    joueurClaims: [], botClaims: [], clesJoueur: null,
    streak: 0, doubleActif: false, scoreSolo: 0,
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
    { titre: "À faire, à éviter", html:
      '<ul class="rule-list">' +
      '<li><span class="pt-plus">✅</span> Mot valide du thème <b>(+ points)</b></li>' +
      '<li><span class="pt-plus">✅</span> Enchaîner sans faute <b>(série ×1,5)</b></li>' +
      '<li><span class="pt-minus">❌</span> Mot inventé : <b>−5 s</b></li>' +
      '<li><span class="pt-minus">❌</span> Mot déjà joué : <b>−10 s</b></li></ul>' },
    { titre: "Tes bonus", html:
      '<ul class="rule-list">' +
      '<li>🃏 <b>Joker</b> — révèle et ajoute un mot</li>' +
      '<li>🔍 <b>Loupe</b> — donne un indice</li>' +
      '<li>⏳ <b>+15 s</b> — rallonge le temps</li>' +
      '<li>✨ <b>×2</b> — double le prochain mot</li></ul>' +
      '<p class="ob-sub">Gagne-les en jouant, ou achète-les en 🛒 boutique.</p>' },
    { titre: "Tout est là", html:
      '<ul class="rule-list">' +
      '<li>🛒 <b>Boutique</b> — dépense tes pièces</li>' +
      '<li>🏦 <b>Banque</b> — encaisse des pièces</li>' +
      '<li>🏆 <b>Classement</b> — Monde et Amis</li>' +
      '<li>⚙️ <b>Réglages</b> — thème, sons, aide</li></ul>' +
      '<p class="ob-sub">Tu démarres avec <b>50 pièces</b>, 3 jokers et 3 loupes.</p>' }
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

  function compilerMonde(idx) {
    var m = mondesPrets()[idx];
    S.mondeIndex = idx; S.ctx = Engine.compile(m);
    S.seuil = Engine.seuilAdaptatif(S.ctx, 4);
    return m;
  }

  function lettresDuMonde() { return Engine.lettresValides(S.ctx, S.seuil); }

  function rendreCarte() {
    if (!S.ctx) compilerMonde(S.mondeIndex);
    var m = mondesPrets()[S.mondeIndex], th = THEMES[m.id] || { emoji: "🗺️", chapitre: m.titre };
    $("#chapter-chip").textContent = th.emoji + " " + th.chapitre + " ▾";
    var lettres = lettresDuMonde();
    var cont = $("#map-container"); cont.innerHTML = "";

    var debloque = true; // niveau 1 toujours ouvert
    lettres.forEach(function (L, i) {
      var etoiles = Store.etoiles(m.id, L);
      var etatDeblo = debloque;
      var row = document.createElement("div");
      row.className = "map-row r" + (i % 3);
      var node = document.createElement("button");
      node.className = "node " + (etoiles > 0 ? "done" : (etatDeblo ? "current" : "locked"));
      node.innerHTML = (etoiles > 0 ? '<span class="stars">' + "⭐".repeat(etoiles) + '</span>' : "") +
        (i + 1) + (etatDeblo && etoiles === 0 ? '<span class="me">' + (Store.profil().avatar || "😀") + '</span>' : "");
      if (etatDeblo) node.onclick = (function (LL, idx) { return function () { introNiveau(LL, idx); }; })(L, i);
      row.appendChild(node); cont.appendChild(row);
      if (i < lettres.length - 1) { var conn = document.createElement("div"); conn.className = "connector"; conn.textContent = "·····"; cont.appendChild(conn); }
      debloque = etoiles > 0; // niveau suivant ouvert si celui-ci a ≥1 étoile
    });
  }

  function introNiveau(L, idx) {
    var m = mondesPrets()[S.mondeIndex], th = THEMES[m.id] || { emoji: "🗺️" };
    var avail = Engine.nbObjetsPourLettre(S.ctx, L);
    var cible3 = Math.max(3, Math.ceil(avail * 0.8));
    var best = Store.best(m.id, L);
    ouvrirModal(
      '<div class="emoji-round">' + th.emoji + '</div>' +
      '<h2 class="serif">Niveau ' + (idx + 1) + ' · lettre « ' + L.toUpperCase() + ' »</h2>' +
      '<p>' + m.titre + '</p>' +
      '<p style="color:var(--ink-soft)">≈ ' + avail + ' objets · trouve <b>' + cible3 + '</b> mots pour ⭐⭐⭐' +
      (best ? '<br>Record : <b>' + best + ' pts</b>' : '') + '</p>' +
      '<div class="actions"><button class="btn ghost" id="m-fermer">Fermer</button>' +
      '<button class="btn green" id="m-jouer">Jouer</button></div>');
    $("#m-fermer").onclick = fermerModal;
    $("#m-jouer").onclick = function () { fermerModal(); demarrerSolo(L, avail); };
  }

  /* =========================================================
     GAMEPLAY commun (solo + duel)
     ========================================================= */
  function demarrerSolo(L, avail) {
    S.mode = "solo"; S.lettre = L; S.soloAvail = avail; S.duree = 60;
    S.joueurClaims = []; S.clesJoueur = new Set(); S.streak = 0; S.doubleActif = false; S.scoreSolo = 0;
    lancerPartie("Niveau · « " + L.toUpperCase() + " »", "🎯 Trouve " + Math.max(3, Math.ceil(avail * 0.8)) + " mots pour 3⭐");
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
    S.joueurClaims = []; S.botClaims = []; S.clesJoueur = new Set(); S.streak = 0; S.doubleActif = false;
    S.selection = []; S.roundJoueur = 0; S.roundBot = 0; S.duree = 60;
    lancerPartie("Duel " + S.manche + "/" + S.nbManches + " · « " + S.lettre.toUpperCase() + " »", "⚔️ Trouve plus de mots que le bot");
  }

  function lancerPartie(titre, objectif) {
    montrer("play"); Ads.banner(false);
    $("#play-title").textContent = titre;
    $("#play-objectif").textContent = objectif;
    $("#liste-mots").innerHTML = ""; $("#compteur").textContent = "0 mot";
    $("#play-pts").textContent = "0 pts";
    $("#saisie").value = ""; $("#saisie").disabled = true;
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
    var s = $("#saisie"); s.disabled = false; s.focus();
    S.restant = S.duree; majFuse();
    S.timer = setInterval(function () {
      S.restant -= 0.1;
      if (S.restant <= 0) { S.restant = 0; majFuse(); finPartie(); }
      else majFuse();
    }, 100);
  }

  function majFuse() {
    var pct = Math.max(0, S.restant / S.duree);
    $("#fuse-flame").style.left = (pct * 100) + "%";
    $("#fuse-burn").style.width = ((1 - pct) * 100) + "%";
    var t = Math.ceil(S.restant), mm = Math.floor(t / 60), ss = t % 60;
    $("#play-time").textContent = mm + ":" + (ss < 10 ? "0" : "") + ss;
    $("#fuse-row").classList.toggle("urgent", S.restant <= 10);
  }

  function penaliteTemps(sec, msg) {
    S.restant = Math.max(0.1, S.restant - sec); majFuse();
    toast(msg, "non"); S.streak = 0;
  }

  function soumettre() {
    var input = $("#saisie"), brut = input.value; if (!brut.trim()) return;
    var res = Engine.classer(S.ctx, brut, S.lettre, { floue: true });

    if (res.statut === "rejet") { secoue(input); toast(res.raison, "non"); return; }

    var claim = res.statut === "valide" ? { objId: res.objId, display: res.display } : { key: res.key, display: res.display };
    var cle = Engine.cleUnicite(claim);
    input.value = "";

    if (S.clesJoueur.has(cle)) { // déjà joué
      if (S.mode === "solo") penaliteTemps(10, "Déjà joué : −10 s");
      else toast("Déjà trouvé", "non");
      return;
    }

    if (res.statut === "reclame") { // mot inventé (bonne lettre, pas dans le dico)
      if (S.mode === "solo") { penaliteTemps(5, "Mot inventé : −5 s"); return; }
      // en duel : on l'ajoute (bluff possible §9)
      S.clesJoueur.add(cle); S.joueurClaims.push(claim); ajouterChip(claim, "reclame");
      majCompteur(); bip(392); return;
    }

    // mot valide
    S.clesJoueur.add(cle); S.joueurClaims.push(claim); ajouterChip(claim, "valide");
    majCompteur();
    if (S.mode === "solo") { gagnerPointsSolo(res.objId); toast("Trouvé : " + res.display + " !", "ok"); }
    else toast("Trouvé : " + res.display + " !", "ok");
    bip(660);
  }

  function gagnerPointsSolo(objId) {
    var obj = S.ctx.byId.get(objId), f = obj ? obj.f : 3;
    var base = Math.max(6, 20 - f * 2);
    S.streak++;
    var mult = Math.min(2, 1 + 0.1 * (S.streak - 1));
    var gain = Math.round(base * mult);
    if (S.doubleActif) { gain *= 2; S.doubleActif = false; toast("×2 ! +" + gain, "coin"); }
    S.scoreSolo += gain;
    $("#play-pts").textContent = S.scoreSolo + " pts";
  }

  function ajouterChip(claim, statut) {
    var chip = document.createElement("span");
    var cls = statut === "valide" ? "valide" : (statut === "reclame" ? "reclame" : "neutre");
    chip.className = "chip " + cls; chip.textContent = claim.display;
    $("#liste-mots").prepend(chip);
  }
  function majCompteur() { var n = S.joueurClaims.length; $("#compteur").textContent = n + (n > 1 ? " mots" : " mot"); }

  /* ---- Bonus en partie ---- */
  function rendreBonusBar() {
    var bar = $("#bonus-bar"); bar.innerHTML = "";
    ["joker", "loupe", "plus15", "double"].forEach(function (id) {
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
  function utiliserBonus(id, btn) {
    if (!Store.aBonus(id)) return;
    if (id === "plus15") { Store.utiliserBonus(id); S.restant += 15; majFuse(); toast("+15 secondes ⏳", "ok"); }
    else if (id === "double") { Store.utiliserBonus(id); S.doubleActif = true; toast("Prochain mot ×2 ✨", "coin"); }
    else if (id === "loupe") {
      var r = motsRestants(); if (!r.length) { toast("Rien à révéler !", "non"); return; }
      Store.utiliserBonus(id);
      var w = r[Math.floor(Math.random() * r.length)].mot;
      toast("Indice : « " + w.slice(0, 2).toUpperCase() + " » · " + w.length + " lettres", "coin");
    } else if (id === "joker") {
      var rr = motsRestants(); if (!rr.length) { toast("Rien à révéler !", "non"); return; }
      Store.utiliserBonus(id);
      var pick = rr[Math.floor(Math.random() * rr.length)];
      var obj = S.ctx.byId.get(pick.objId);
      var claim = { objId: pick.objId, display: obj.canonique };
      S.clesJoueur.add(Engine.cleUnicite(claim)); S.joueurClaims.push(claim); ajouterChip(claim, "valide");
      majCompteur(); if (S.mode === "solo") gagnerPointsSolo(pick.objId);
      toast("Joker : " + obj.canonique + " 🃏", "ok");
    }
    rendreBonusBar();
    $("#saisie").focus();
  }

  /* ---- Fin de partie ---- */
  function finPartie() {
    clearInterval(S.timer); $("#saisie").disabled = true;
    Store.ajouterMinutes(1); Store.incrStat("partiesJouees");
    if (S.mode === "solo") finSolo(); else finMancheDuel();
  }

  function finSolo() {
    var m = mondesPrets()[S.mondeIndex], L = S.lettre;
    var trouves = S.joueurClaims.filter(function (c) { return c.objId; }).length;
    var avail = S.soloAvail || 1;
    var ratio = trouves / avail;
    var stars = ratio >= 0.8 ? 3 : (ratio >= 0.5 ? 2 : (trouves >= 3 && ratio >= 0.3 ? 1 : 0));
    var prevStars = Store.etoiles(m.id, L), prevBest = Store.best(m.id, L);
    var record = S.scoreSolo > prevBest;
    Store.enregistrerNiveau(m.id, L, stars, S.scoreSolo);
    Store.incrStat("motsTrouves", trouves);
    var gainEtoiles = Math.max(0, stars - prevStars);
    var pieces = 5 + gainEtoiles * 10 + (record ? 5 : 0);
    Store.ajouterPieces(pieces);

    var html =
      '<div class="big-stars">' + (stars ? "⭐".repeat(stars) + "☆".repeat(3 - stars) : "☆☆☆") + '</div>' +
      '<h2 class="serif" style="text-align:center">' + (stars ? "Niveau réussi !" : "Presque !") + '</h2>' +
      '<div class="result-line"><span>Mots trouvés</span><span class="v">' + trouves + " / " + avail + '</span></div>' +
      '<div class="result-line"><span>Score</span><span class="v">' + S.scoreSolo + ' pts' + (record ? ' 🏅' : '') + '</span></div>' +
      '<div class="result-line"><span>Record</span><span class="v">' + Math.max(prevBest, S.scoreSolo) + ' pts</span></div>' +
      '<div class="result-line"><span>Pièces gagnées</span><span class="v gain">+' + pieces + ' 🪙</span></div>' +
      '<div class="actions" style="display:flex;gap:10px;margin-top:14px">' +
      '<button class="btn coin" id="r-double">📺 ×2 pièces</button>' +
      '<button class="btn ghost" id="r-rejouer">Rejouer</button>' +
      '<button class="btn green" id="r-carte">Carte</button></div>';
    $("#result-content").innerHTML = html; montrer("result");
    bip(stars ? 720 : 300);

    $("#r-double").onclick = function () {
      this.disabled = true;
      Ads.rewarded().then(function (ok) { if (ok) { Store.ajouterPieces(pieces); majPieces(); toast("+" + pieces + " pièces ! 🪙", "coin"); } });
    };
    $("#r-rejouer").onclick = function () { demarrerSolo(L, avail); };
    $("#r-carte").onclick = function () { Ads.interstitial(); montrer("map"); };
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
    $("#reglages-version").textContent = "Trouvaille v2 · " + (Ads.estNatif() ? "app native" : "web") + " · " + Ads.plateforme();
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
  function zoomVers(cx, cy, f) {
    var r = $("#scene").getBoundingClientRect(), px = cx - r.left, py = cy - r.top;
    var ns = Math.min(vue.min * 6, Math.max(vue.min, vue.scale * f)), k = ns / vue.scale;
    vue.tx = px - (px - vue.tx) * k; vue.ty = py - (py - vue.ty) * k; vue.scale = ns; appliquer();
  }
  function initScene() {
    var sc = $("#scene");
    sc.addEventListener("wheel", function (e) { e.preventDefault(); zoomVers(e.clientX, e.clientY, e.deltaY < 0 ? 1.15 : 1 / 1.15); }, { passive: false });
    var pts = {}, lastDist = 0;
    sc.addEventListener("pointerdown", function (e) { sc.setPointerCapture(e.pointerId); pts[e.pointerId] = { x: e.clientX, y: e.clientY }; sc.classList.add("grabbing"); });
    sc.addEventListener("pointermove", function (e) {
      if (!pts[e.pointerId]) return; var ids = Object.keys(pts);
      if (ids.length === 1) { var p = pts[e.pointerId]; vue.tx += e.clientX - p.x; vue.ty += e.clientY - p.y; p.x = e.clientX; p.y = e.clientY; appliquer(); }
      else if (ids.length === 2) { pts[e.pointerId] = { x: e.clientX, y: e.clientY }; var a = pts[ids[0]], b = pts[ids[1]], dist = Math.hypot(a.x - b.x, a.y - b.y); if (lastDist) zoomVers((a.x + b.x) / 2, (a.y + b.y) / 2, dist / lastDist); lastDist = dist; }
    });
    function up(e) { delete pts[e.pointerId]; lastDist = 0; if (!Object.keys(pts).length) sc.classList.remove("grabbing"); }
    sc.addEventListener("pointerup", up); sc.addEventListener("pointercancel", up);
    $("#zoom-plus").onclick = function () { var r = sc.getBoundingClientRect(); zoomVers(r.left + r.width / 2, r.top + r.height / 2, 1.4); };
    $("#zoom-moins").onclick = function () { var r = sc.getBoundingClientRect(); zoomVers(r.left + r.width / 2, r.top + r.height / 2, 1 / 1.4); };
    $("#zoom-reset").onclick = ajusterVue;
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
  function bip(freq) {
    if (Store.reglages().sons === false) return;
    try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); var o = audioCtx.createOscillator(), g = audioCtx.createGain(); o.type = "sine"; o.frequency.value = freq; g.gain.value = .05; o.connect(g); g.connect(audioCtx.destination); o.start(); g.gain.exponentialRampToValueAtTime(.0001, audioCtx.currentTime + .18); o.stop(audioCtx.currentTime + .2); } catch (e) {}
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
    $("#btn-envoyer").onclick = soumettre;
    $("#saisie").addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); soumettre(); } });
    $("#play-quitter").onclick = function () { clearInterval(S.timer); montrer(S.mode === "duel" ? "home" : "map"); };

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
    $("#btn-aide").onclick = function () { S.obStep = 1; montrer("onboarding"); rendreOnboarding(); $("#ob-passer").textContent = "Fermer"; };
    $("#btn-reset").onclick = function () { if (confirm("Effacer ta progression et tes pièces ?")) { Store.reset(); appliquerTheme(); S.obStep = 0; rendreOnboarding(); montrer("onboarding"); } };

    // hook de développement (aperçu d'un écran) : index.html?dev=home|map|boutique…
    try {
      var dev = new URLSearchParams(location.search).get("dev");
      if (dev) {
        compilerMonde(0);
        if (dev === "play") { var LL = Engine.lettresValides(S.ctx, S.seuil)[2] || "c"; demarrerSolo(LL, Engine.nbObjetsPourLettre(S.ctx, LL)); }
        else montrer(dev);
        return;
      }
    } catch (e) {}

    // démarrage
    if (Store.onboardingFait()) { S.ob = JSON.parse(JSON.stringify(Store.profil())); montrer("home"); }
    else { S.obStep = 0; rendreOnboarding(); montrer("onboarding"); }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
