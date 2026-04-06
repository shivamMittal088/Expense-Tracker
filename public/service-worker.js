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
    '/assets/index-yaglyqDZ.js',
    '/assets/index-CBJbmTmS.css',
    '/assets/reactVendor-DllcryNJ.js',
    '/assets/uiVendor-DjDkK2NB.js',
    '/assets/utilsVendor-B9ygI19o.js',
    '/assets/Login-Copj51j3.js',
    '/assets/Analytics-DF4XRBWA.js',
    '/assets/Transactions-CIRNjKrf.js',
    '/assets/Profile-CeAklzh6.js',
    '/assets/Settings-DvqtnzZn.js',
    '/assets/AddExpenseModal-DT74tvAn.js',
    '/assets/AddTileModal-B0WTImge.js',
    '/assets/ExpenseDay-Ub9jc7ax.js',
    '/assets/ExpenseHeatmap-DfKwsODf.js',
    '/assets/ExportExcelPage-Bu0OjYC7.js',
    '/assets/FollowListPage-1cEQXGK-.js',
    '/assets/PublicProfile-Dc2yoj0d.js',
    '/assets/PeopleSearchModal-DMyFIG9D.js',
    '/assets/NotificationsModal-AH-Nr7g4.js',
    '/assets/FooterLazyIcons-DHzTPGY0.js',
    '/assets/FooterToolsPanel-vyryFRu5.js',
    '/assets/Calculator-YvXok7jd.js',
    '/assets/Calculator-CPpVsaOt.css',
    '/assets/CalendarPicker-B_LWi7F9.js',
    '/assets/CalendarPicker-IWvcE5VP.css',
    '/assets/TimePicker-aatDaI-z.js',
    '/assets/TimePicker-DHyYQhok.css',
    '/assets/Redirecttoast-DQhz_k59.js',
    '/assets/heavyOptional-DcbensUn.js',
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
