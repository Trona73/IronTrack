const CACHE_NAME = 'irontrack-v1';

// Removi o 'index.html' explícito para evitar conflitos de rota no Vite/Vercel
const urlsToCache = [
  '/',
  '/icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Usamos um loop para que, se um arquivo falhar, os outros ainda sejam cacheados
        return Promise.allSettled(
          urlsToCache.map(url => cache.add(url))
        );
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});