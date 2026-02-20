

const CACHE_NAME = 'phantom-offline-v3';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './index2.html',
    './pages/games.html',
    './pages/settings.html',
    './styles/main.css',
    './styles/search.css',
    './styles/background.css',
    './styles/layout.css',
    './styles/card.css',
    './styles/settings.css',
    './styles/error.css',
    './styles/modals.css',
    './components/topbar.css',
    './scripts/init.js',
    './scripts/games.js',
    './scripts/gloader.js',
    './scripts/background.js',
    './scripts/settings.js',
    './scripts/settingspage.js',
    './scripts/notifications.js',
    './scripts/cloaking.js',
    './scripts/rotation.js',
    './scripts/quotes.js',
    './scripts/featured.js',
    './scripts/search.js',
    './favicon.svg',
    './config.js',
    './components/topbar.js',
    './components/footer.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
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

    const url = new URL(event.request.url);

    // Ignore proxy requests or external API calls (except FontAwesome)
    const isFontAwesome = event.request.url.includes('cdnjs.cloudflare.com/ajax/libs/font-awesome');
    if ((url.origin !== location.origin && !isFontAwesome) || url.pathname.includes('/staticsjv2/')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request).catch(() => {
                if (event.request.mode === 'navigate') {
                    // Fallback to index.html for navigation errors if offline
                    return caches.match('./index.html') || caches.match('./index2.html');
                }
            });
        })
    );
});
