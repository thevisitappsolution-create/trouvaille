// Test du moteur Trouvaille dans Node (charge data.js + engine.js en global)
const fs = require("fs");
const vm = require("vm");
const path = require("path");
const ROOT = require("path").join(__dirname, "..");

const warns = [];
const sandbox = {
  console: { warn: (...a) => warns.push(a.join(" ")), log: console.log, error: console.error },
  window: {},
};
sandbox.global = sandbox;
vm.createContext(sandbox);

for (const f of ["js/data.js", "js/engine.js"]) {
  const code = fs.readFileSync(path.join(ROOT, f), "utf8");
  vm.runInContext(code, sandbox, { filename: f });
}
// les const de haut niveau ne sont pas des propriétés du global vm : on les expose
vm.runInContext("globalThis.Engine=Engine;globalThis.MONDES=MONDES;globalThis.LEURRES=LEURRES;", sandbox);

const { Engine, MONDES, LEURRES } = sandbox;
let fails = 0;
function ok(cond, label) {
  console.log((cond ? "  ok " : "FAIL ") + label);
  if (!cond) fails++;
}

const monde = MONDES[0];
const ctx = Engine.compile(monde);

console.log("\n== Compilation ==");
console.log("objets:", ctx.objets.length);
console.log("collisions signalées:", warns.length);
warns.forEach((w) => console.log("   ⚠", w));

console.log("\n== Lettres valides (seuil 5) ==");
const lettres = Engine.lettresValides(ctx, 5);
console.log(lettres.map((L) => L.toUpperCase() + ":" + Engine.nbObjetsPourLettre(ctx, L)).join("  "));
ok(lettres.length >= 12, "au moins 12 lettres jouables");

console.log("\n== Validation de mots ==");
function classer(mot, lettre) { return Engine.classer(ctx, mot, lettre, { floue: true }); }
ok(classer("perroquet", "p").statut === "valide", "perroquet/P valide");
ok(classer("Pommes", "p").statut === "valide", "Pommes (pluriel+majuscule)/P valide");
ok(classer("ara", "p").statut === "rejet", "ara/P rejeté (mauvaise lettre)");
ok(classer("ara", "a").statut === "valide", "ara/A valide (synonyme perroquet)");
ok(classer("clef", "c").statut === "valide", "clef/C valide (synonyme clé)");
ok(classer("cle", "c").statut === "valide", "cle sans accent/C valide");
ok(classer("chapeau haut-de-forme", "c").statut === "valide", "chapeau haut-de-forme/C valide");
ok(classer("réveil", "r").statut === "valide", "réveil/R valide");
ok(classer("peroquet", "p").statut === "valide", "peroquet/P (faute) toléré (floue)");
ok(classer("xylophone", "p").statut === "rejet", "xylophone/P rejeté (mauvaise lettre)");
ok(classer("porte", "p").statut === "reclame", "porte/P réclamé (absent = pari)");
ok(classer("z", "z").statut === "rejet", "z seul rejeté (trop court)");

console.log("\n== Objet identique via 2 synonymes = même clé ==");
const a = { objId: classer("hibou", "h").objId };
const b = { objId: classer("chouette", "c").objId };
ok(a.objId && a.objId === b.objId, "hibou et chouette -> même objet (" + a.objId + ")");

console.log("\n== Bot + scoring ==");
const bot = Engine.jouerBot(ctx, "c", LEURRES, 0.8);
console.log("le bot réclame:", bot.map((c) => c.display + (c.bluff ? "*" : "")).join(", "));
const joueur = [
  { objId: classer("chapeau", "c").objId, display: "chapeau" },
  { objId: classer("crâne", "c").objId, display: "crâne" },
  { key: "mot:casserole", display: "casserole" }, // pari/bluff du joueur
];
const tot = Engine.scorer(joueur, bot);
console.log("score provisoire — joueur:", tot.totalJoueur, "bot:", tot.totalBot);
ok(joueur.every((c) => c.pts === 1 || c.pts === 3), "chaque mot joueur vaut 1 ou 3");

console.log("\n== Résolution Call Image ==");
const bluff = { key: "mot:casserole", display: "casserole", pts: 3 };
const r1 = Engine.resoudreCall(bluff, 3);
ok(r1.gagnant === "contestataire" && r1.deltaContestataire === 3, "contester un bluff -> +3 pour le contestataire");
ok(r1.deltaProprietaire === -6, "propriétaire du bluff perd pts(3)+enjeu(3) = -6");
const vrai = { objId: "caverne#0", display: "clé", pts: 3 };
const r2 = Engine.resoudreCall(vrai, 3);
ok(r2.gagnant === "proprietaire" && r2.deltaContestataire === -3, "contester un vrai mot -> -3 pour le contestataire");

console.log("\n== Les 5 mondes ==");
MONDES.forEach((m) => {
  warns.length = 0;
  const c = Engine.compile(m);
  const seuil = Engine.seuilAdaptatif(c, 4);
  const L = Engine.lettresValides(c, seuil);
  console.log("  • " + m.titre.padEnd(34) + " objets:" + String(c.objets.length).padStart(3) +
    "  collisions:" + warns.length + "  seuil:" + seuil + "  lettres jouables:" + L.length +
    " (" + L.map((x) => x.toUpperCase()).join("") + ")");
  ok(c.objets.length > 0, "    " + m.id + " non vide" + (m.pret ? " (actif)" : " (désactivé)"));
  ok(warns.length === 0, "    " + m.id + " sans collision de mots" +
    (warns.length ? " -> " + warns.join("; ") : ""));
  ok(L.length >= 3, "    " + m.id + " a au moins 3 lettres jouables");
  // le bot ne doit jamais bluffer un mot RÉEL de ce monde
  let bluffReel = null;
  for (let i = 0; i < 300 && !bluffReel; i++) {
    const lettre = Engine.tireLettre(c, seuil, []);
    Engine.jouerBot(c, lettre, LEURRES, 1).forEach((cl) => {
      if (cl.bluff && (c.clefVersObjet.has(Engine.normalize(cl.display)) ||
        c.clefVersObjet.has(Engine.singular(Engine.normalize(cl.display))))) bluffReel = cl.display;
    });
  }
  ok(!bluffReel, "    " + m.id + " : aucun bluff n'est un objet réel" + (bluffReel ? " -> " + bluffReel : ""));
});

console.log("\n== Robustesse : simulation de 200 manches ==");
let crash = null;
try {
  for (let i = 0; i < 200; i++) {
    const L = Engine.tireLettre(ctx, 5, []);
    const bc = Engine.jouerBot(ctx, L, LEURRES, Math.random());
    Engine.scorer([], bc);
    bc.forEach((c) => Engine.resoudreCall(c, 3));
    Engine.botConteste([{ key: "mot:truc", display: "truc", pts: 3 }], 1);
  }
} catch (e) { crash = e; }
ok(!crash, "200 manches sans exception" + (crash ? " -> " + crash.message : ""));

console.log("\n" + (fails === 0 ? "✅ TOUS LES TESTS PASSENT" : "❌ " + fails + " test(s) en échec"));
process.exit(fails === 0 ? 0 : 1);
