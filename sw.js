/* Trouvaille — Service Worker (PWA installable + hors-ligne)
   Ne s'active que sur https:// (github.io), pas en file://. */
var VERSION = "trouvaille-v2.6.2";
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
    // Code / données : RÉSEAU D'ABORD avec TIMEOUT (3 s). Si le réseau traîne
    // (mobile lent), on sert le cache pour que l'app charge toujours vite ;
    // sinon on renvoie la version fraîche. Fini les "ne charge pas".
    e.respondWith(new Promise(function (resolve) {
      var done = false;
      function secours() { caches.match(req).then(function (hit) { resolve(hit || caches.match("./index.html")); }); }
      var t = setTimeout(function () { if (!done) { done = true; secours(); } }, 3000);
      fetch(req).then(function (res) {
        if (done) { metEnCache(req, res); return; }
        done = true; clearTimeout(t); metEnCache(req, res); resolve(res);
      }, function () { if (!done) { done = true; clearTimeout(t); secours(); } });
    }));
  }
});
