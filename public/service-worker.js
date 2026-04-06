self.addEventListener('install', (event) => {
  console.log("[Service Worker] Installed");

  // pre-cache assets
  const cacheName = 'Static';
  const assetsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.svg',
    '/logo.svg',
    '/vite.svg',
  ]

  event.waitUntil(
    caches.open(cacheName)
      .then((cache) => cache.addAll(assetsToCache))
  );
});

self.addEventListener('activate', (event) => {
  console.log("[Service Worker] Activated");
  return self.clients.claim();
});


self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
})
