/* ============================================================
   TROUVAILLE — Moteur de jeu (règles, validation, scoring, bot)
   ------------------------------------------------------------
   Aucune dépendance. Expose l'objet global `Engine`.
   Tout ce qui touche aux RÈGLES vit ici ; l'UI (game.js) ne fait
   qu'orchestrer. Ainsi le jour où tu passes en multijoueur serveur
   (PRD §15), cette logique se transpose telle quelle côté serveur.
   ============================================================ */
const Engine = (function () {
  "use strict";

  /* -- Normalisation d'un mot (§8.1) --------------------------
     minuscule, accents retirés, ligatures œ/æ, ponctuation et
     espaces supprimés -> "Cerf-Volant" ≈ "cerf volant" ≈ "cerfvolant". */
  function normalize(str) {
    return String(str)
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "") // accents (diacritiques combinants)
      .replace(/œ/g, "oe") // œ
      .replace(/æ/g, "ae") // æ
      .replace(/[^a-z0-9]/g, ""); // espaces, tirets, apostrophes…
  }

  /* Enlève un pluriel simple (-s / -x) sans casser les mots courts. */
  function singular(w) {
    if (w.length >= 4 && w.endsWith("x")) return w.slice(0, -1);
    if (w.length >= 3 && w.endsWith("s")) return w.slice(0, -1);
    return w;
  }

  /* Distance de Levenshtein plafonnée (tolérance fautes de frappe). */
  function editDistance(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    const prev = new Array(b.length + 1);
    const cur = new Array(b.length + 1);
    for (let j = 0; j <= b.length; j++) prev[j] = j;
    for (let i = 1; i <= a.length; i++) {
      cur[0] = i;
      let best = cur[0];
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
        if (cur[j] < best) best = cur[j];
      }
      if (best > max) return max + 1; // coupe tôt
      for (let j = 0; j <= b.length; j++) prev[j] = cur[j];
    }
    return prev[b.length];
  }

  /* -- Compilation d'un monde en index jouable ---------------- */
  function compile(monde) {
    const objets = monde.objets.map((o, i) => ({
      id: monde.id + "#" + i,
      canonique: o.mots[0],
      mots: o.mots,
      f: typeof o.f === "number" ? o.f : 3
    }));

    // clé normalisée -> objet.id (avec fusion défensive des doublons)
    const clefVersObjet = new Map();
    // toutes les clés d'un objet, pour la recherche floue
    const toutesLesClefs = [];

    objets.forEach((obj) => {
      obj.mots.forEach((mot) => {
        const n = normalize(mot);
        [n, singular(n)].forEach((k) => {
          if (!k) return;
          const dejaLa = clefVersObjet.get(k);
          if (dejaLa && dejaLa !== obj.id) {
            // collision : deux entrées partagent un mot -> on garde
            // la première et on signale (à corriger dans le dico).
            if (typeof console !== "undefined") {
              console.warn("[Trouvaille] mot ambigu ignoré :", k,
                "->", dejaLa, "&", obj.id);
            }
            return;
          }
          clefVersObjet.set(k, obj.id);
          if (!toutesLesClefs.includes(k)) toutesLesClefs.push(k);
        });
      });
    });

    // Index par lettre (§10) : lettre -> Map(objId -> mot à afficher)
    const parLettre = {};
    objets.forEach((obj) => {
      obj.mots.forEach((mot) => {
        const n = normalize(mot);
        if (!n) return;
        const L = n[0];
        if (!parLettre[L]) parLettre[L] = new Map();
        // on privilégie le 1er mot rencontré (souvent le canonique)
        if (!parLettre[L].has(obj.id)) parLettre[L].set(obj.id, mot);
      });
    });

    return { monde, objets, byId: indexById(objets), clefVersObjet, toutesLesClefs, parLettre };
  }

  function indexById(objets) {
    const m = new Map();
    objets.forEach((o) => m.set(o.id, o));
    return m;
  }

  /* Lettres jouables : celles qui offrent assez d'objets (§10). */
  function lettresValides(ctx, seuil) {
    seuil = seuil || 5;
    return Object.keys(ctx.parLettre)
      .filter((L) => /[a-z]/.test(L) && ctx.parLettre[L].size >= seuil)
      .sort();
  }

  /* Seuil adaptatif : on garde un seuil élevé (qualité) tant qu'il reste
     assez de lettres jouables, sinon on l'abaisse (petits mondes §10). */
  function seuilAdaptatif(ctx, minLettres) {
    minLettres = minLettres || 4;
    for (var s = 5; s >= 2; s--) {
      if (lettresValides(ctx, s).length >= minLettres) return s;
    }
    return 2;
  }

  function tireLettre(ctx, seuil, exclues) {
    const dispo = lettresValides(ctx, seuil).filter(
      (L) => !exclues || exclues.indexOf(L) === -1
    );
    const pool = dispo.length ? dispo : lettresValides(ctx, seuil);
    return pool[Math.floor(Math.random() * pool.length)];
  }

  /* Combien d'objets trouvables pour une lettre (info joueur). */
  function nbObjetsPourLettre(ctx, L) {
    return ctx.parLettre[L] ? ctx.parLettre[L].size : 0;
  }

  /* -- Classe une saisie du joueur (§8.1) --------------------
     Retour :
       {statut:"valide",  objId, display}      -> objet reconnu (vert)
       {statut:"reclame", key, display}        -> commence par la lettre
                                                   mais inconnu (ambre,
                                                   pari / bluff)
       {statut:"rejet",   raison}              -> hors-lettre / trop court
     `floue` active la tolérance aux fautes de frappe. */
  function classer(ctx, brut, lettre, options) {
    options = options || {};
    const n = normalize(brut);
    const L = normalize(lettre);
    if (n.length < 2) return { statut: "rejet", raison: "Trop court" };
    if (n[0] !== L) {
      return { statut: "rejet", raison: "Doit commencer par « " + lettre.toUpperCase() + " »" };
    }

    // correspondance directe (mot ou singulier)
    let objId = ctx.clefVersObjet.get(n) || ctx.clefVersObjet.get(singular(n));

    // tolérance fautes de frappe (prudente §8.1 : mots ≥ 6 lettres,
    // distance 1, même initiale. Le seuil élevé évite qu'un vrai mot en
    // devienne un autre — ex. « porte » ne doit pas matcher « poste »).
    if (!objId && options.floue && n.length >= 6) {
      let best = null, bestD = 2;
      for (const k of ctx.toutesLesClefs) {
        if (k[0] !== n[0]) continue;
        if (Math.abs(k.length - n.length) > 1) continue;
        const d = editDistance(n, k, 1);
        if (d < bestD) { bestD = d; best = k; if (d === 0) break; }
      }
      if (best) objId = ctx.clefVersObjet.get(best);
    }

    if (objId) {
      // Affiche le mot qui commence par la LETTRE DU NIVEAU (pas forcément le
      // canonique). Ex. niveau « E » + "écouteur" -> on montre « écouteurs »,
      // pas « casque ». Repli sur le canonique si besoin.
      const motLettre = (ctx.parLettre[L] && ctx.parLettre[L].get(objId)) || ctx.byId.get(objId).canonique;
      return { statut: "valide", objId: objId, display: motLettre };
    }
    return { statut: "reclame", key: "mot:" + n, display: brut.trim() };
  }

  /* Clé d'unicité d'une trouvaille : par objet si reconnu,
     sinon par mot normalisé. Deux joueurs avec la même clé = partagé. */
  function cleUnicite(claim) {
    return claim.objId ? "obj:" + claim.objId : claim.key;
  }

  /* -- Le bot joue (§7 duel) ---------------------------------
     Choisit surtout les objets évidents (freq élevée), parfois un
     rare, et bluffe éventuellement avec un leurre.
     difficulte ∈ [0..1] (≈0.8 conseillé). */
  function jouerBot(ctx, lettre, leurres, difficulte) {
    difficulte = difficulte == null ? 0.8 : difficulte;
    const L = normalize(lettre);
    const candidats = ctx.parLettre[L] ? Array.from(ctx.parLettre[L].entries()) : [];
    const claims = [];

    candidats.forEach(([objId, mot]) => {
      const obj = ctx.byId.get(objId);
      const p = (obj.f / 6) * (0.4 + 0.6 * difficulte); // évident≈0.7, rare≈0.15
      if (Math.random() < p) {
        claims.push({ objId, display: mot, key: "obj:" + objId, bluff: false });
      }
    });

    // parfois, le bot déniche un objet rare en plus (pression sur le joueur)
    if (Math.random() < 0.4) {
      const rares = candidats.filter(
        ([id]) => !claims.some((c) => c.objId === id) && ctx.byId.get(id).f <= 2
      );
      if (rares.length) {
        const [id, mot] = rares[Math.floor(Math.random() * rares.length)];
        claims.push({ objId: id, display: mot, key: "obj:" + id, bluff: false });
      }
    }

    // bluff éventuel : 0 à 2 leurres (§9)
    // Garde-fou : on retire tout leurre qui serait EN VRAI un objet de ce
    // monde (les leurres sont globaux, un mot piège ici peut être réel là).
    const pool = ((leurres && leurres[L]) ? leurres[L] : []).filter(function (mot) {
      const n = normalize(mot);
      return !ctx.clefVersObjet.has(n) && !ctx.clefVersObjet.has(singular(n));
    });
    let nbBluff = Math.random() < 0.55 ? 1 : (Math.random() < 0.2 ? 2 : 0);
    while (nbBluff-- > 0 && pool.length) {
      const mot = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
      claims.push({ key: "mot:" + normalize(mot), display: mot, bluff: true });
    }

    // mélange l'ordre pour ne pas trahir les bluffs
    for (let i = claims.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [claims[i], claims[j]] = [claims[j], claims[i]];
    }
    return claims;
  }

  /* Un claim est-il réellement valide (présent dans la liste maîtresse) ?
     -> "valide" quand il pointe un objet ; un bluff/réclamé ne l'est pas. */
  function estValide(claim) {
    return !!claim.objId;
  }

  /* -- Scoring provisoire (§8.2) avant Call Image -------------
     RÈGLE PROTOTYPE (arbitrage de Q7 §21) : on ne vérifie PAS
     automatiquement la validité — on joue sur la confiance (§9).
     Donc CHAQUE mot réclamé compte comme s'il était valide :
        mot unique  = 3 pts   |   mot partagé = 1 pt
     Le Call Image (§9) vient ensuite corriger les bluffs.
     Retour : chaque claim reçoit {partage:bool, pts:number}. */
  function scorer(joueurClaims, botClaims) {
    const clesJoueur = new Set(joueurClaims.map(cleUnicite));
    const clesBot = new Set(botClaims.map(cleUnicite));

    function annote(claims, clesAdverse) {
      let total = 0;
      claims.forEach((c) => {
        c.partage = clesAdverse.has(cleUnicite(c));
        c.pts = c.partage ? 1 : 3;
        total += c.pts;
      });
      return total;
    }
    const totalJoueur = annote(joueurClaims, clesBot);
    const totalBot = annote(botClaims, clesJoueur);
    return { totalJoueur, totalBot };
  }

  /* -- Résolution d'un Call Image (§9.2) ---------------------
     `contestataire` conteste le claim `cible` (propriété de l'adversaire).
     Enjeu plafonné (Option B §9.4).
     Retour : { gagnant:"contestataire"|"proprietaire", cibleValide, enjeu,
                deltaContestataire, deltaProprietaire }
       deltas = variation de score de MANCHE (à additionner ensuite,
                plancher 0 appliqué par l'appelant). */
  function resoudreCall(cible, enjeu) {
    enjeu = enjeu == null ? 3 : enjeu;
    const valide = estValide(cible);
    if (valide) {
      // le mot EST dans la liste -> le contestataire avait tort (§9.2)
      return {
        gagnant: "proprietaire",
        cibleValide: true,
        enjeu,
        deltaContestataire: -enjeu,
        deltaProprietaire: +enjeu
      };
    }
    // le mot N'EST PAS dans la liste -> le contestataire avait raison :
    // le propriétaire perd les points du mot (cible.pts) ET cède l'enjeu.
    return {
      gagnant: "contestataire",
      cibleValide: false,
      enjeu,
      deltaContestataire: +enjeu,
      deltaProprietaire: -((cible.pts || 0) + enjeu)
    };
  }

  /* Le bot décide s'il conteste un mot ambre du joueur, et lequel.
     Il ne vise jamais un mot vert (il perdrait). Précision imparfaite. */
  function botConteste(joueurClaims, precision) {
    precision = precision == null ? 0.7 : precision;
    const cibles = joueurClaims.filter((c) => !estValide(c)); // les ambres
    if (!cibles.length) return null;
    if (Math.random() > precision) return null; // le bot laisse filer
    // il vise le mot ambre qui rapporte le plus (le plus "gros" bluff)
    cibles.sort((a, b) => (b.pts || 0) - (a.pts || 0));
    return cibles[0];
  }

  return {
    normalize, singular, editDistance,
    compile, lettresValides, seuilAdaptatif, tireLettre, nbObjetsPourLettre,
    classer, cleUnicite, estValide,
    jouerBot, scorer, resoudreCall, botConteste
  };
})();
