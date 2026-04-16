import { precacheAndRoute } from 'workbox-precaching';

// Injected by vite-plugin-pwa at build time — precaches all hashed assets
precacheAndRoute(self.__WB_MANIFEST);

var STATIC_CACHE_NAME = 'Static-V2';
var DYNAMIC_CACHE_NAME = 'Dynamic-V2';

self.addEventListener('install', (event) => {
  console.log("[Service Worker] Installed");

  // pre-cache assets (stable files that don't change between builds)
  const assetsToCache = [
    '/',
    '/offline.html',
    '/manifest.json',
    '/favicon.svg',
    '/logo.svg',
    '/vite.svg',
  ]

  self.skipWaiting();

  event.waitUntil(
    caches.delete(DYNAMIC_CACHE_NAME).then(() =>
      caches.open(STATIC_CACHE_NAME)
        .then((cache) => cache.addAll(assetsToCache))
    )
  );
});


// 👉 The activate event runs when a new Service Worker takes control.So if we change in any file of our code , then service worker code is not changed , hence it use the precached files and gives us stale data hence we change the name of our caching so that service worker file changed but again it first check in previous cache so we also need to cleanup the previous cache so activate is the best place for cleanup as when new service worker takes control then the previous cache automtically deleted

// This also known as cache versioning, where we can use different cache names for different versions of our app. When we update our app, we can change the cache name to ensure that users get the latest assets and we can also clean up old caches in the activate event.

self.addEventListener('activate', (event) => {
  console.log("[Service Worker] Activated");

  const allowedCaches = [STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => !allowedCaches.includes(name))
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});


self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and cross-origin requests
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Skip API requests
  if (url.pathname.startsWith('/api/')) return;

  // SPA navigation fallback: network-first for HTML so new deployments
  // always deliver the latest index.html (Vite hashes JS/CSS filenames, so
  // a stale cached index.html would reference missing chunks → white screen).
  // Fallback chain when offline:
  //   1. workbox-precached /index.html (ignoreSearch strips the ?__WB_REVISION__= hash)
  //   2. manually cached '/' from Static-V2 install cache
  //   3. /offline.html as last resort
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match('/index.html', { ignoreSearch: true })
          .then((res) => res || caches.match('/'))
          .then((res) => res || caches.match('/offline.html'))
          .then((res) => res || new Response('App is offline. Please reload when connected.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' },
          }))
      )
    );
    return;
  }

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
          caches.open(DYNAMIC_CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      });
    })
  );
});

// Push notification handler
self.addEventListener('push', (event) => {
  if (Notification.permission !== 'granted') return;

  let data = { title: 'Expense Tracker', body: 'You have a new notification.' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/logo.svg',
      badge: '/logo.svg',
      data: data.url ? { url: data.url } : undefined,
    })
  );
});

// Open the app (or a specific URL) when a notification is clicked
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus any already-open window first
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // No open window — open a new one
      return clients.openWindow(url);
    })
  );
});
