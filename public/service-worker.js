self.addEventListener('install', (event) => {
  console.log("[Service Worker] Installed");

  // pre-cache assets (stable files that don't change between builds)
  const cacheName = 'Static';
  const assetsToCache = [
    '/',
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
  const url = new URL(event.request.url);

  // Skip non-GET and cross-origin requests
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Skip API requests
  if (url.pathname.startsWith('/api/')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((networkResponse) => {
        // Dynamic cache: JS, CSS, and assets on first fetch
        if (
          url.pathname.startsWith('/assets/') ||
          url.pathname.endsWith('.js') ||
          url.pathname.endsWith('.css')
        ) {
          const clone = networkResponse.clone();
          caches.open('Dynamic').then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      });
    })
  );
})
