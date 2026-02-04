const CACHE_NAME = 'phantom-offline-v1';
const ASSETS_TO_CACHE = [
    './index2.html',
    './pages/games.html',
    './styles/main.css',
    './styles/search.css',
    './styles/background.css',
    './styles/layout.css',
    './styles/card.css',
    './components/topbar.css',
    './scripts/init.js',
    './scripts/games.js',
    './scripts/gloader.js',
    './scripts/background.js',
    './scripts/settings.js',
    './favicon.svg',
    './config.js',
    './components/topbar.js',
    './components/footer.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    return caches.delete(key);
                }
            }));
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    // Ignore proxy requests or external API calls if we don't want to cache them actively (except what's in ASSETS_TO_CACHE)
    const url = new URL(event.request.url);
    if ((url.origin !== location.origin && !ASSETS_TO_CACHE.includes(event.request.url)) || url.pathname.includes('/staticsjv2/')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request).catch(() => {
                // Optional: Return offline page if navigation
                if (event.request.mode === 'navigate') {
                    return caches.match('./index2.html');
                }
            });
        })
    );
});
