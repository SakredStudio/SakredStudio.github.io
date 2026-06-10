const CACHE_NAME = 'swaiyu-v1';
const ASSETS = ['/', '/index.html', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/icon-512-maskable.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;                    // never touch POSTs (FANI/Worker)
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;           // never touch cross-origin (Sovrn, retailers, Worker)
  if (e.request.mode === 'navigate') {                       // HTML: network-first, offline-fallback to cached shell
    e.respondWith(
      fetch(e.request).then((r) => { const c = r.clone(); caches.open(CACHE_NAME).then((ch) => ch.put('/', c)); return r; })
        .catch(() => caches.match('/'))
    );
    return;
  }
  e.respondWith(                                             // static assets: cache-first, then network
    caches.match(e.request).then((cached) => cached || fetch(e.request).then((r) => {
      if (!r || r.status !== 200 || r.type !== 'basic') return r;
      const c = r.clone(); caches.open(CACHE_NAME).then((ch) => ch.put(e.request, c)); return r;
    }))
  );
});
