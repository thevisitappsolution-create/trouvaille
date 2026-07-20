/* Trouvaille — Service Worker (PWA installable + hors-ligne)
   Ne s'active que sur https:// (github.io), pas en file://. */
var VERSION = "trouvaille-v2.5.3";
var CORE = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/data.js",
  "./js/engine.js",
  "./js/store.js",
  "./js/ads.js",
  "./js/config.js",
  "./js/sync.js",
  "./js/app.js",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./icons/icon-512.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

function metEnCache(req, res) {
  if (res && res.status === 200 && res.type === "basic") {
    var copy = res.clone();
    caches.open(VERSION).then(function (c) { c.put(req, copy); });
  }
  return res;
}
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var chemin = new URL(req.url).pathname;
  var estImage = /\.(png|jpe?g|gif|svg|webp|ico)$/i.test(chemin);

  if (estImage) {
    // Images : cache d'abord (elles changent rarement) — rapide + hors-ligne.
    e.respondWith(caches.match(req).then(function (hit) {
      return hit || fetch(req).then(function (res) { return metEnCache(req, res); });
    }));
  } else {
    // Code / données (html, css, js, json) : RÉSEAU D'ABORD -> toujours à jour ;
    // cache seulement en secours (hors-ligne). Fini les mises à jour bloquées.
    e.respondWith(fetch(req).then(function (res) { return metEnCache(req, res); })
      .catch(function () { return caches.match(req).then(function (hit) { return hit || caches.match("./index.html"); }); }));
  }
});
