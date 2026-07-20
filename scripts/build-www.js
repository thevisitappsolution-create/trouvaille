/* Copie les fichiers web statiques dans www/ pour Capacitor.
   Usage : npm run copy  (appelé automatiquement par cap:sync). */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "www");

// Fichiers/dossiers embarqués dans l'app native.
const ASSETS = [
  "index.html",
  "manifest.webmanifest",
  "sw.js",
  "css",
  "js",
  "icons"
];

// + toutes les images des mondes (.png à la racine)
fs.readdirSync(ROOT).forEach((f) => {
  if (f.toLowerCase().endsWith(".png")) ASSETS.push(f);
});

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

let n = 0;
for (const a of ASSETS) {
  const src = path.join(ROOT, a);
  if (!fs.existsSync(src)) continue;
  fs.cpSync(src, path.join(OUT, a), { recursive: true });
  n++;
}
console.log("www/ généré :", n, "éléments copiés.");
