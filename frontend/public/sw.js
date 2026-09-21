// Minimal service worker whose only job is to satisfy Chrome/Android's PWA
// installability requirement (a registered SW with a fetch handler). It
// intentionally does NOT cache API calls, auth, or page navigations — this
// app's dashboards are dynamic and per-tenant, so serving stale responses
// from cache would be a correctness bug, not a performance win. It only
// precaches the static PWA icons/manifest so the install experience itself
// (icon, name) is available even on a flaky first load.
const CACHE_NAME = 'arogyix-static-v1';
const PRECACHE_URLS = [
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => {
        // Precaching is a nice-to-have; never block install on it.
      }),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only serve precached static assets from cache; everything else
  // (API requests, authenticated pages, navigations) always goes to the
  // network so the app never shows stale or cross-tenant data.
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request)),
  );
});
