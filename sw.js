const CACHE_NAME = 'playhaus-cache-v11';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/locker.html',
  '/profile.html',
  '/game.html',
  '/styles.css?v=9',
  '/manifest.json',
  '/js/main.js',
  '/js/auth.js',
  '/js/daily.js',
  '/js/firebase.js',
  '/js/leaderboard.js',
  '/js/locker.js',
  '/js/profile.js',
  '/js/game.js',
  '/js/security.js',
  '/js/haptics.js',
  '/js/games/color-guess.js',
  '/js/games/higher-lower.js',
  '/js/games/math-avalanche.js',
  '/js/games/pop-lock.js',
  '/js/games/tanks.js',
  '/js/games/word-gravity.js',
  '/js/games/word-rush.js',
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

// Fetch Interceptor: Network First with Cache Fallback
self.addEventListener('fetch', (event) => {
  // Only handle GET requests and local scope fetches
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If we get a valid response from the network, cache it and return it
        if (response && response.status === 200 && response.type === 'basic') {
          // Dynamically cache new assets (except firebase/firestore operations)
          if (!event.request.url.includes('/_/auth') && !event.request.url.includes('firestore')) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
        }
        return response;
      })
      .catch(() => {
        // If network fails (offline), try the cache
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Fallback for document navigation in case of completely offline
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
          });
      })
  );
});
