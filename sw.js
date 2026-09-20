
const CACHE = 'amg-v4';

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './capa.png',
  './abertura.opus',
  './final.opus',
  './musica_abertura_original.wav',

  './abertura_01.jpg',
  './abertura_02.jpg',
  './abertura_03.jpg',
  './abertura_04.jpg',
  './abertura_05.jpg',

  './final_01.jpg',
  './final_02.jpg',
  './final_03.jpg',
  './final_04.jpg',

  './level_01.jpg',
  './level_02.jpg',
  './level_03.jpg',
  './level_04.jpg',
  './level_05.jpg',
  './level_06.jpg',
  './level_07.jpg',
  './level_08.jpg',
  './level_09.jpg',
  './level_10.jpg',
  './level_11.jpg',
  './level_12.jpg',
  './level_13.jpg',
  './level_14.jpg',
  './level_15.jpg',
  './level_16.jpg',
  './level_17.jpg',
  './level_18.jpg',
  './level_19.jpg',
  './level_20.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        const copy = response.clone();

        caches.open(CACHE).then(cache => {
          cache.put(event.request, copy);
        });

        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
