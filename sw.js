const CACHE_NAME = 'playhaus-cache-v8';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/locker.html',
  '/profile.html',
  '/game.html',
  '/styles.css?v=8',
  '/manifest.json',
  '/js/main.js',
  '/js/auth.js',
  '/js/daily.js',
  '/js/firebase.js',
  '/js/leaderboard.js',
  '/js/locker.js',
  '/js/profile.js',
  '/js/game.js',
  '/data/games.js',
  '/img/icons/icon-192.png',
  '/img/icons/icon-512.png',
  '/img/icons/apple-touch-icon.png'
];

// Install Service Worker and cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Pre-caching offline assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Service Worker and clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Interceptor: Cache First with Network Fallback
self.addEventListener('fetch', (event) => {
  // Only handle GET requests and local scope fetches
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached response
          return cachedResponse;
        }

        // Otherwise fetch from network
        return fetch(event.request)
          .then((response) => {
            // Check if response is valid
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Dynamically cache new assets (except firebase/firestore operations)
            if (!event.request.url.includes('/_/auth') && !event.request.url.includes('firestore')) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }

            return response;
          })
          .catch(() => {
            // Fallback for document navigation in case of completely offline
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
          });
      })
  );
});
