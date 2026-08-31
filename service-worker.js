// Blitz Power Dashboard — service worker
// BELANGRIJK: verhoog CACHE_VERSION bij elke keer dat je een nieuwe
// index.html/manifest/icon naar Vercel upload, anders blijven gebruikers
// een oude, gecachete versie van het dashboard zien.
const CACHE_VERSION = 'blitz-dashboard-v1';
const APP_SHELL = ['./', './index.html', './manifest.json', './icon-dashboard.svg'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL).catch(() => {}))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Network-first: altijd de nieuwste versie proberen te halen (dit dashboard
// verandert vaak), met de cache alleen als offline-terugvalmuziek.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
        return resp;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html')))
  );
});
