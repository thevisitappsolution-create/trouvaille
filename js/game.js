/* ============================================================
   TROUVAILLE — Interface & orchestration (client prototype solo)
   Dépend de : data.js (MONDES, LEURRES) et engine.js (Engine).
   ============================================================ */
(function () {
  "use strict";

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var ENJEU = 3;          // enjeu plafonné du Call Image (Option B §9.4)
  var SEUIL_LETTRE = 5;   // min. d'objets pour qu'une lettre soit tirée (§10)
  var CALLS_PAR_MANCHE = 2;

  var state = {
    mondeIndex: 0,
    ctx: null,
    mode: "decouverte",     // "decouverte" | "confiance"
    floue: true,
    difficulte: 0.8,        // 0..1
    duree: 60,
    nbManches: 3,
    // partie en cours
    manche: 0,
    lettre: "",
    lettresUtilisees: [],
    joueurClaims: [],
    botClaims: [],
    clesJoueur: null,       // Set des clés d'unicité déjà saisies
    scoreJoueur: 0,
    scoreBot: 0,
    roundJoueur: 0,
    roundBot: 0,
    callsRestants: CALLS_PAR_MANCHE,
    selection: [],          // claims bot sélectionnés pour contestation
    timer: null,
    restant: 0,
    manchesLog: []          // pour la carte de partage
  };

  /* ---------------------------------------------------------
     ROUTAGE D'ÉCRANS
     --------------------------------------------------------- */
  function montrer(nom) {
    $$(".screen").forEach(function (s) { s.classList.remove("active"); });
    $("#screen-" + nom).classList.add("active");
  }

  /* ---------------------------------------------------------
     ACCUEIL
     --------------------------------------------------------- */
  function rendreMondes() {
    var box = $("#mondes");
    box.innerHTML = "";
    MONDES.forEach(function (m, i) {
      var el = document.createElement("button");
      el.className = "monde" + (m.pret ? "" : " locked") + (i === state.mondeIndex ? " selected" : "");
      if (!m.pret) el.disabled = true;

      var puce = document.createElement("div");
      puce.className = "puce";
      if (m.image) {
        var im = document.createElement("img");
        im.src = encodeURI(m.image);
        im.alt = "";
        puce.appendChild(im);
      } else {
        puce.textContent = "🗺️";
      }

      var meta = document.createElement("div");
      meta.className = "meta";
      var b = document.createElement("b"); b.textContent = m.titre;
      var s = document.createElement("span"); s.textContent = m.sousTitre || "";
      meta.appendChild(b); meta.appendChild(s);

      var droite = document.createElement("div");
      if (m.pret) {
        var c = document.createElement("span");
        c.className = "compte";
        c.textContent = m.objets.length + " objets";
        droite.appendChild(c);
      } else {
        var lock = document.createElement("span");
        lock.className = "cadenas"; lock.textContent = "🔒";
        droite.appendChild(lock);
      }

      el.appendChild(puce); el.appendChild(meta); el.appendChild(droite);
      if (m.pret) {
        el.addEventListener("click", function () {
          state.mondeIndex = i;
          rendreMondes();
        });
      }
      box.appendChild(el);
    });
  }

  function initSegments() {
    // Chaque groupe .segments : boutons avec data-val ; on stocke dans state[clé]
    $$(".segments").forEach(function (grp) {
      var cle = grp.getAttribute("data-cle");
      grp.addEventListener("click", function (e) {
        var btn = e.target.closest("button");
        if (!btn) return;
        $$("button", grp).forEach(function (b) { b.classList.remove("on"); });
        btn.classList.add("on");
        var val = btn.getAttribute("data-val");
        if (cle === "difficulte") state.difficulte = parseFloat(val);
        else if (cle === "duree") state.duree = parseInt(val, 10);
        else if (cle === "mode") state.mode = val;
      });
    });
  }

  /* ---------------------------------------------------------
     DÉMARRAGE D'UNE PARTIE
     --------------------------------------------------------- */
  function demarrerPartie() {
    var monde = MONDES[state.mondeIndex];
    if (!monde || !monde.pret) return;
    state.ctx = Engine.compile(monde);

    // seuil adaptatif : au moins autant de lettres que de manches (+marge)
    state.seuil = Engine.seuilAdaptatif(state.ctx, Math.max(state.nbManches, 4));
    var lettres = Engine.lettresValides(state.ctx, state.seuil);
    if (lettres.length < 1) {
      toast("Ce monde n'a pas assez de mots pour jouer.", "non");
      return;
    }

    state.manche = 0;
    state.lettresUtilisees = [];
    state.scoreJoueur = 0;
    state.scoreBot = 0;
    state.callsRestants = CALLS_PAR_MANCHE;
    state.manchesLog = [];
    prochaineManche();
  }

  function prochaineManche() {
    state.manche++;
    state.lettre = Engine.tireLettre(state.ctx, state.seuil, state.lettresUtilisees);
    state.lettresUtilisees.push(state.lettre);
    state.joueurClaims = [];
    state.botClaims = [];
    state.clesJoueur = new Set();
    state.selection = [];
    state.roundJoueur = 0;
    state.roundBot = 0;
    lancerDecompte();
  }

  function lancerDecompte() {
    montrer("play");
    preparerScene();
    majHud();
    $("#liste-mots").innerHTML = "";
    $("#saisie").value = "";
    $("#saisie").disabled = true;

    var ov = $("#overlay-decompte");
    var el = $("#decompte");
    ov.classList.add("active");
    var n = 3;
    el.classList.remove("go");
    el.textContent = n;
    var it = setInterval(function () {
      n--;
      if (n > 0) { el.textContent = n; }
      else if (n === 0) { el.textContent = "GO"; el.classList.add("go"); }
      else {
        clearInterval(it);
        ov.classList.remove("active");
        demarrerManche();
      }
    }, 800);
  }

  /* ---------------------------------------------------------
     MANCHE (phase de recherche 60 s)
     --------------------------------------------------------- */
  function demarrerManche() {
    var s = $("#saisie");
    s.disabled = false;
    s.focus();
    state.restant = state.duree;
    majChrono();
    state.timer = setInterval(function () {
      state.restant -= 0.1;
      if (state.restant <= 0) { state.restant = 0; majChrono(); finManche(); }
      else majChrono();
    }, 100);
  }

  function majHud() {
    $("#hud-lettre").textContent = state.lettre.toUpperCase();
    $("#hud-score b").textContent = state.scoreJoueur;
    $("#hud-manche").textContent = "Manche " + state.manche + "/" + state.nbManches;
    var n = Engine.nbObjetsPourLettre(state.ctx, state.lettre);
    $("#scene-hint").textContent = "✋ glisse / molette pour zoomer · " + n + " objets en « " + state.lettre.toUpperCase() + " »";
  }

  function majChrono() {
    var t = Math.ceil(state.restant);
    $("#hud-chrono .temps").textContent = t;
    var pct = (state.restant / state.duree) * 100;
    $("#hud-chrono .barre > i").style.width = pct + "%";
    $("#hud-chrono").classList.toggle("urgence", state.restant <= 10);
  }

  function soumettre() {
    var input = $("#saisie");
    var brut = input.value;
    if (!brut.trim()) return;

    var res = Engine.classer(state.ctx, brut, state.lettre, { floue: state.floue });

    if (res.statut === "rejet") {
      input.classList.remove("shake"); void input.offsetWidth;
      input.classList.add("shake");
      toast(res.raison, "non");
      return;
    }

    var claim = res.statut === "valide"
      ? { objId: res.objId, display: res.display }
      : { key: res.key, display: res.display };
    var cle = Engine.cleUnicite(claim);

    if (state.clesJoueur.has(cle)) {
      toast("Déjà trouvé : « " + res.display + " »", "non");
      input.value = "";
      return;
    }
    state.clesJoueur.add(cle);
    state.joueurClaims.push(claim);
    ajouterChip(claim, res.statut);
    input.value = "";
    majCompteur();

    if (state.mode === "confiance") {
      // on ne révèle PAS la validité : simple accusé de réception (§9 bluff)
      toast("« " + res.display + " » ajouté", "");
      bip(520);
    } else if (res.statut === "valide") {
      toast("Trouvé : " + res.display + " !", "ok");
      bip(660);
    } else {
      toast("« " + res.display + " » — pari (non vérifié)", "");
      bip(392);
    }
  }

  function ajouterChip(claim, statut) {
    var chip = document.createElement("span");
    // en mode "confiance", on masque la validité pendant la manche (§9)
    var classe = "neutre";
    if (state.mode === "decouverte") classe = (statut === "valide") ? "valide" : "reclame";
    chip.className = "chip " + classe;
    chip.textContent = claim.display;
    $("#liste-mots").prepend(chip);
  }

  function majCompteur() {
    var n = state.joueurClaims.length;
    $("#compteur").textContent = n + (n > 1 ? " mots saisis" : " mot saisi");
  }

  /* ---------------------------------------------------------
     FIN DE MANCHE -> le bot joue, scoring provisoire, révélation
     --------------------------------------------------------- */
  function finManche() {
    clearInterval(state.timer);
    $("#saisie").disabled = true;

    state.botClaims = Engine.jouerBot(state.ctx, state.lettre, LEURRES, state.difficulte);
    var tot = Engine.scorer(state.joueurClaims, state.botClaims);
    state.roundJoueur = tot.totalJoueur;
    state.roundBot = tot.totalBot;
    state.selection = [];

    rendreRevelation();
    montrer("reveal");
  }

  function rendreRevelation() {
    $("#rev-lettre").textContent = state.lettre.toUpperCase();
    majScoresRev();

    // Colonne JOUEUR : ta connaissance (validité affichée)
    var pj = $("#rev-joueur .pile");
    pj.innerHTML = "";
    if (!state.joueurClaims.length) pj.appendChild(vide("Aucun mot trouvé…"));
    state.joueurClaims.forEach(function (c) {
      var valide = Engine.estValide(c);
      var row = motRev(c.display, c.pts, c.partage);
      row.classList.add(valide ? "valide-reveal" : "reclame");
      pj.appendChild(row);
    });

    // Colonne BOT : validité MASQUÉE, mots contestables (§9)
    var pb = $("#rev-bot .pile");
    pb.innerHTML = "";
    if (!state.botClaims.length) pb.appendChild(vide("Le bot n'a rien trouvé."));
    state.botClaims.forEach(function (c, idx) {
      var row = motRev(c.display, c.pts, c.partage);
      row.classList.add("contestable");
      row.setAttribute("data-idx", idx);
      row.addEventListener("click", function () { basculerSelection(idx, row); });
      pb.appendChild(row);
    });

    majCallInfo();
    $("#btn-valider-calls").style.display = "";
    $("#btn-suite-manche").style.display = "none";
  }

  function motRev(mot, pts, partage) {
    var row = document.createElement("div");
    row.className = "mot-rev " + (partage ? "partage" : "unique");
    var g = document.createElement("span"); g.textContent = mot;
    var d = document.createElement("span"); d.className = "pts";
    d.textContent = (partage ? "partagé · " : "unique · ") + (pts != null ? pts : 0) + " pt" + (pts > 1 ? "s" : "");
    row.appendChild(g); row.appendChild(d);
    return row;
  }
  function vide(txt) {
    var d = document.createElement("div");
    d.className = "mot-rev"; d.innerHTML = '<span class="masque">' + txt + "</span>";
    return d;
  }

  function basculerSelection(idx, row) {
    var p = state.selection.indexOf(idx);
    if (p >= 0) { state.selection.splice(p, 1); row.classList.remove("choisi"); }
    else {
      if (state.selection.length >= state.callsRestants) {
        toast("Plus de Call Image disponible cette manche", "non");
        return;
      }
      state.selection.push(idx);
      row.classList.add("choisi");
    }
    majCallInfo();
  }

  function majScoresRev() {
    $("#rev-score-joueur").textContent = Math.max(0, Math.round(state.roundJoueur));
    $("#rev-score-bot").textContent = Math.max(0, Math.round(state.roundBot));
  }

  function majCallInfo() {
    $("#calls-restants").textContent = (state.callsRestants - state.selection.length);
    $("#btn-valider-calls").textContent = state.selection.length
      ? "Lancer " + state.selection.length + " Call Image ⚔"
      : "Passer (aucune contestation)";
  }

  /* ---------------------------------------------------------
     RÉSOLUTION DES CALL IMAGE (§9.2)
     --------------------------------------------------------- */
  function validerCalls() {
    var journal = [];

    // 1) Contestations DU JOUEUR sur les mots du bot
    state.selection.forEach(function (idx) {
      var cible = state.botClaims[idx];
      var r = Engine.resoudreCall(cible, ENJEU);
      state.roundJoueur += r.deltaContestataire;
      state.roundBot += r.deltaProprietaire;
      var row = $('#rev-bot .mot-rev[data-idx="' + idx + '"]');
      if (row) row.classList.add(r.cibleValide ? "valide-reveal" : "bluff-reveal");
      if (r.cibleValide) journal.push("❌ Tu contestes « " + cible.display + " » : il ÉTAIT réel. Tu cèdes " + ENJEU + " pts.");
      else journal.push("✅ Tu démasques « " + cible.display + " » : bluff ! Tu gagnes " + ENJEU + " pts.");
    });

    // 2) Le bot dévoile la vérité sur SES autres mots (pédagogie)
    state.botClaims.forEach(function (c, idx) {
      if (state.selection.indexOf(idx) >= 0) return;
      var row = $('#rev-bot .mot-rev[data-idx="' + idx + '"]');
      if (row) row.classList.add(Engine.estValide(c) ? "valide-reveal" : "bluff-reveal");
    });

    // 3) Contre-attaque du bot sur un mot ambre du joueur
    var cibleBot = Engine.botConteste(state.joueurClaims, 0.7);
    if (cibleBot) {
      var r2 = Engine.resoudreCall(cibleBot, ENJEU); // le bot est contestataire
      state.roundBot += r2.deltaContestataire;
      state.roundJoueur += r2.deltaProprietaire;
      journal.push("🤖 Le bot conteste ton mot « " + cibleBot.display + " » : non listé. Il te prend " + (ENJEU + (cibleBot.pts || 0)) + " pts.");
      // surligne le mot perdu côté joueur
      var idxJ = state.joueurClaims.indexOf(cibleBot);
      var rows = $$("#rev-joueur .mot-rev");
      if (rows[idxJ]) rows[idxJ].classList.add("bluff-reveal");
    }

    // plancher à 0 pour la manche
    state.roundJoueur = Math.max(0, Math.round(state.roundJoueur));
    state.roundBot = Math.max(0, Math.round(state.roundBot));
    majScoresRev();

    state.callsRestants -= state.selection.length;

    // cumul
    state.scoreJoueur += state.roundJoueur;
    state.scoreBot += state.roundBot;

    // enregistre pour la carte de partage
    state.manchesLog.push({
      lettre: state.lettre.toUpperCase(),
      j: state.roundJoueur, b: state.roundBot
    });

    // désactive les contestations
    $$("#rev-bot .contestable").forEach(function (r) {
      r.classList.remove("contestable");
      r.style.pointerEvents = "none";
    });

    // journal éventuel
    var jd = $("#call-journal");
    jd.innerHTML = "";
    if (journal.length) {
      journal.forEach(function (t) {
        var p = document.createElement("div");
        p.style.marginTop = "6px";
        p.textContent = t;
        jd.appendChild(p);
      });
    }

    $("#btn-valider-calls").style.display = "none";
    $("#btn-suite-manche").style.display = "";
    bip(state.roundJoueur >= state.roundBot ? 720 : 300);
  }

  /* ---------------------------------------------------------
     RÉSULTAT DE MANCHE
     --------------------------------------------------------- */
  function montrerResultatManche() {
    $("#manche-titre").textContent = "Manche " + state.manche + " / " + state.nbManches
      + " — lettre « " + state.lettre.toUpperCase() + " »";

    var box = $("#manche-lignes");
    box.innerHTML = "";
    box.appendChild(ligne("Tes points de la manche", "+" + state.roundJoueur, "gain"));
    box.appendChild(ligne("Points du bot", "+" + state.roundBot, ""));
    box.appendChild(ligne("Cumul — Toi", state.scoreJoueur, "cumul"));
    box.appendChild(ligne("Cumul — Bot", state.scoreBot, "cumul"));

    if (state.manche >= state.nbManches) {
      $("#btn-manche-suivante").style.display = "none";
      $("#btn-fin").style.display = "";
    } else {
      $("#btn-manche-suivante").style.display = "";
      $("#btn-fin").style.display = "none";
    }
    montrer("manche");
  }

  function ligne(lbl, val, cls) {
    var d = document.createElement("div");
    d.className = "ligne-score " + (cls || "");
    var a = document.createElement("span"); a.className = "lbl"; a.textContent = lbl;
    var b = document.createElement("span"); b.className = "v"; b.textContent = val;
    d.appendChild(a); d.appendChild(b);
    return d;
  }

  /* ---------------------------------------------------------
     FIN DE PARTIE
     --------------------------------------------------------- */
  function montrerFin() {
    var v = $("#verdict");
    if (state.scoreJoueur > state.scoreBot) { v.textContent = "🏆 Victoire !"; v.className = "verdict gagne"; }
    else if (state.scoreJoueur < state.scoreBot) { v.textContent = "Défaite…"; v.className = "verdict perdu"; }
    else { v.textContent = "Égalité"; v.className = "verdict nul"; }

    var box = $("#fin-lignes");
    box.innerHTML = "";
    box.appendChild(ligne("Toi", state.scoreJoueur, "cumul"));
    box.appendChild(ligne("Bot", state.scoreBot, "cumul"));

    $("#carte-partage").textContent = carteDePartage();
    montrer("fin");
  }

  function carteDePartage() {
    var monde = MONDES[state.mondeIndex];
    var lignes = [];
    lignes.push("Trouvaille · " + monde.titre);
    state.manchesLog.forEach(function (m, i) {
      var barre = m.j > m.b ? "🟩" : (m.j < m.b ? "🟥" : "🟨");
      lignes.push(barre + " Manche " + (i + 1) + " [" + m.lettre + "]  " + m.j + " – " + m.b);
    });
    lignes.push("————————");
    var issue = state.scoreJoueur > state.scoreBot ? "🏆 " : (state.scoreJoueur < state.scoreBot ? "" : "🤝 ");
    lignes.push(issue + "Total  " + state.scoreJoueur + " – " + state.scoreBot);
    return lignes.join("\n");
  }

  /* ---------------------------------------------------------
     SCÈNE : zoom / pan sur l'image (§5)
     --------------------------------------------------------- */
  var vue = { scale: 1, min: 1, tx: 0, ty: 0, iw: 0, ih: 0 };

  function preparerScene() {
    var monde = MONDES[state.mondeIndex];
    var img = $("#scene-img");
    if (img.getAttribute("data-src") !== monde.image) {
      img.setAttribute("data-src", monde.image);
      img.onload = function () {
        vue.iw = img.naturalWidth; vue.ih = img.naturalHeight;
        ajusterVue();
      };
      img.src = encodeURI(monde.image);
    } else if (vue.iw) {
      ajusterVue();
    }
    var hint = $("#scene-hint");
    hint.style.opacity = "1";
    clearTimeout(preparerScene._t);
    preparerScene._t = setTimeout(function () { hint.style.opacity = "0"; }, 3500);
  }

  function ajusterVue() {
    var sc = $("#scene");
    var cw = sc.clientWidth, ch = sc.clientHeight;
    if (!vue.iw) return;
    if (!cw || !ch) { requestAnimationFrame(ajusterVue); return; } // layout pas prêt
    vue.min = Math.max(cw / vue.iw, ch / vue.ih); // "cover"
    vue.scale = vue.min;
    vue.tx = (cw - vue.iw * vue.scale) / 2;
    vue.ty = (ch - vue.ih * vue.scale) / 2;
    appliquer();
  }

  function clampPan() {
    var sc = $("#scene");
    var cw = sc.clientWidth, ch = sc.clientHeight;
    var w = vue.iw * vue.scale, h = vue.ih * vue.scale;
    if (w <= cw) vue.tx = (cw - w) / 2; else vue.tx = Math.min(0, Math.max(cw - w, vue.tx));
    if (h <= ch) vue.ty = (ch - h) / 2; else vue.ty = Math.min(0, Math.max(ch - h, vue.ty));
  }

  function appliquer() {
    clampPan();
    var img = $("#scene-img");
    img.style.transform = "translate(" + vue.tx + "px," + vue.ty + "px) scale(" + vue.scale + ")";
  }

  function zoomVers(cx, cy, facteur) {
    var sc = $("#scene").getBoundingClientRect();
    var px = cx - sc.left, py = cy - sc.top;
    var ns = Math.min(vue.min * 6, Math.max(vue.min, vue.scale * facteur));
    var k = ns / vue.scale;
    vue.tx = px - (px - vue.tx) * k;
    vue.ty = py - (py - vue.ty) * k;
    vue.scale = ns;
    appliquer();
  }

  function initScene() {
    var sc = $("#scene");

    // molette
    sc.addEventListener("wheel", function (e) {
      e.preventDefault();
      zoomVers(e.clientX, e.clientY, e.deltaY < 0 ? 1.15 : 1 / 1.15);
    }, { passive: false });

    // pointeurs (drag + pinch)
    var pts = {};
    var lastDist = 0, lastMid = null;
    sc.addEventListener("pointerdown", function (e) {
      sc.setPointerCapture(e.pointerId);
      pts[e.pointerId] = { x: e.clientX, y: e.clientY };
      sc.classList.add("grabbing");
    });
    sc.addEventListener("pointermove", function (e) {
      if (!pts[e.pointerId]) return;
      var ids = Object.keys(pts);
      if (ids.length === 1) {
        var p = pts[e.pointerId];
        vue.tx += e.clientX - p.x; vue.ty += e.clientY - p.y;
        p.x = e.clientX; p.y = e.clientY;
        appliquer();
      } else if (ids.length === 2) {
        pts[e.pointerId] = { x: e.clientX, y: e.clientY };
        var a = pts[ids[0]], b = pts[ids[1]];
        var dist = Math.hypot(a.x - b.x, a.y - b.y);
        var mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        if (lastDist) zoomVers(mid.x, mid.y, dist / lastDist);
        lastDist = dist; lastMid = mid;
      }
    });
    function up(e) {
      delete pts[e.pointerId];
      lastDist = 0; lastMid = null;
      if (!Object.keys(pts).length) sc.classList.remove("grabbing");
    }
    sc.addEventListener("pointerup", up);
    sc.addEventListener("pointercancel", up);

    // boutons
    $("#zoom-plus").addEventListener("click", function () {
      var r = sc.getBoundingClientRect(); zoomVers(r.left + r.width / 2, r.top + r.height / 2, 1.4);
    });
    $("#zoom-moins").addEventListener("click", function () {
      var r = sc.getBoundingClientRect(); zoomVers(r.left + r.width / 2, r.top + r.height / 2, 1 / 1.4);
    });
    $("#zoom-reset").addEventListener("click", ajusterVue);

    window.addEventListener("resize", function () { if (vue.iw) ajusterVue(); });
  }

  /* ---------------------------------------------------------
     TOAST + SON
     --------------------------------------------------------- */
  var toastT;
  function toast(msg, type) {
    var t = $("#toast");
    t.textContent = msg;
    t.className = "toast show " + (type || "");
    clearTimeout(toastT);
    toastT = setTimeout(function () { t.className = "toast " + (type || ""); }, 1600);
  }

  var audioCtx = null, muet = false;
  function bip(freq) {
    if (muet) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      var o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = "sine"; o.frequency.value = freq;
      g.gain.value = 0.05;
      o.connect(g); g.connect(audioCtx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.18);
      o.stop(audioCtx.currentTime + 0.2);
    } catch (e) { /* silencieux */ }
  }

  /* ---------------------------------------------------------
     CÂBLAGE DES ÉVÉNEMENTS
     --------------------------------------------------------- */
  function init() {
    rendreMondes();
    initSegments();
    initScene();

    $("#btn-jouer").addEventListener("click", demarrerPartie);
    $("#btn-aide").addEventListener("click", function () { $("#overlay-aide").classList.add("active"); });
    $("#btn-fermer-aide").addEventListener("click", function () { $("#overlay-aide").classList.remove("active"); });
    $("#btn-quitter").addEventListener("click", function () { clearInterval(state.timer); montrer("home"); });

    $("#btn-envoyer").addEventListener("click", soumettre);
    $("#saisie").addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); soumettre(); }
    });

    $("#btn-valider-calls").addEventListener("click", validerCalls);
    $("#btn-suite-manche").addEventListener("click", montrerResultatManche);
    $("#btn-manche-suivante").addEventListener("click", prochaineManche);
    $("#btn-fin").addEventListener("click", montrerFin);

    $("#btn-revanche").addEventListener("click", demarrerPartie);
    $("#btn-menu").addEventListener("click", function () { montrer("home"); });

    $("#btn-copier").addEventListener("click", function () {
      var txt = $("#carte-partage").textContent;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(txt).then(function () { toast("Copié !", "ok"); });
      } else { toast("Copie non supportée", "non"); }
    });

    $("#btn-muet").addEventListener("click", function () {
      muet = !muet;
      this.textContent = muet ? "🔇" : "🔊";
    });

    montrer("home");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
