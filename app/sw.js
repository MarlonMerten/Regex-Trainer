/* Regex Trainer — Offline-Cache */
var CACHE = 'regex-trainer-v4';
var ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './css/styles.css',
  './js/engine.js',
  './js/explain.js',
  './js/core.js',
  './js/regex-worker.js',
  './js/data-reference.js',
  './js/data-lessons.js',
  './js/data-exercises.js',
  './js/data-quiz.js',
  './js/store.js',
  './js/ui-lessons.js',
  './js/ui-reference.js',
  './js/ui-playground.js',
  './js/ui-trainer.js',
  './js/ui-quiz.js',
  './js/boot.js'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) {
        return k.indexOf('regex-trainer-') === 0 && k !== CACHE;
      }).map(function (k) {
        return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.open(CACHE).then(function (cache) {
      return cache.match(e.request).then(function (cached) {
        if (cached) return cached;
        return fetch(e.request).then(function (res) {
          if (res && res.status === 200 && res.type === 'basic') {
            cache.put(e.request, res.clone()).catch(function () {
              /* Eine volle/gesperrte Cache-Quota darf Online-Antworten nicht blockieren. */
            });
          }
          return res;
        }).catch(function () {
          if (e.request.mode === 'navigate') return cache.match('./index.html');
          return Response.error();
        });
      });
    })
  );
});

self.addEventListener('message', function (e) {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
