// Background Manager with IndexedDB caching and proxy iframe
(function () {
    'use strict';

    if (window.BackgroundManager) return;

    const YOUTUBE_REGEX = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;
    const DB_NAME = 'phantom-bg-cache';
    const DB_VERSION = 1;
    const STORE_NAME = 'images';
    const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

    // ================== IndexedDB Cache ==================
    const ImageCache = {
        db: null,

        async open() {
            if (this.db) return this.db;
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(DB_NAME, DB_VERSION);
                request.onerror = () => reject(request.error);
                request.onsuccess = () => {
                    this.db = request.result;
                    resolve(this.db);
                };
                request.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains(STORE_NAME)) {
                        const store = db.createObjectStore(STORE_NAME, { keyPath: 'url' });
                        store.createIndex('timestamp', 'timestamp');
                    }
                };
            });
        },

        async get(url) {
            try {
                const db = await this.open();
                return new Promise((resolve) => {
                    const tx = db.transaction(STORE_NAME, 'readonly');
                    const store = tx.objectStore(STORE_NAME);
                    const request = store.get(url);
                    request.onsuccess = () => {
                        const result = request.result;
                        if (result && (Date.now() - result.timestamp) < CACHE_EXPIRY) {
                            resolve(result.data);
                        } else {
                            resolve(null);
                        }
                    };
                    request.onerror = () => resolve(null);
                });
            } catch {
                return null;
            }
        },

        async set(url, data) {
            try {
                const db = await this.open();
                return new Promise((resolve) => {
                    const tx = db.transaction(STORE_NAME, 'readwrite');
                    const store = tx.objectStore(STORE_NAME);
                    store.put({ url, data, timestamp: Date.now() });
                    tx.oncomplete = () => resolve(true);
                    tx.onerror = () => resolve(false);
                });
            } catch {
                return false;
            }
        },

        async cleanup() {
            try {
                const db = await this.open();
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                const index = store.index('timestamp');
                const cutoff = Date.now() - CACHE_EXPIRY;

                index.openCursor().onsuccess = (e) => {
                    const cursor = e.target.result;
                    if (cursor) {
                        if (cursor.value.timestamp < cutoff) {
                            cursor.delete();
                        }
                        cursor.continue();
                    }
                };
            } catch {
                // Silent fail
            }
        }
    };

    // ================== Proxy Manager ==================
    const ProxyManager = {
        iframe: null,
        ready: false,
        pending: new Map(),
        requestId: 0,

        init() {
            if (this.iframe) return;
            // Create invisible iframe for proxying
            this.iframe = document.createElement('iframe');
            this.iframe.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;border:none;';
            this.iframe.src = this.getProxyPath();
            document.body.appendChild(this.iframe);

            // Listen for responses from proxy iframe
            window.addEventListener('message', (e) => {
                if (e.data?.type === 'bg-proxy-ready') {
                    this.ready = true;
                    console.log('Background proxy ready');
                } else if (e.data?.type === 'bg-proxy-response' && e.data.requestId) {
                    const resolver = this.pending.get(e.data.requestId);
                    if (resolver) {
                        this.pending.delete(e.data.requestId);
                        if (e.data.success) {
                            resolver.resolve(e.data.data);
                        } else {
                            resolver.reject(new Error(e.data.error));
                        }
                    }
                }
            });
        },

        getProxyPath() {
            const path = window.location.pathname;
            // The proxies folder is at the root
            if (path.includes('/staticsjv2/') || path.includes('/pages/')) return '../scripts/bg-proxy.html';
            return 'scripts/bg-proxy.html';
        },

        async waitForReady(timeout = 5000) {
            if (this.ready) return true;
            const start = Date.now();
            while (!this.ready && (Date.now() - start) < timeout) {
                await new Promise(r => setTimeout(r, 100));
            }
            return this.ready;
        },

        async proxyImage(url) {
            this.init();
            const isReady = await this.waitForReady();
            if (!isReady) throw new Error('Proxy not ready');

            const id = ++this.requestId;
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    this.pending.delete(id);
                    reject(new Error('Proxy timeout'));
                }, 15000);

                this.pending.set(id, {
                    resolve: (data) => { clearTimeout(timeout); resolve(data); },
                    reject: (err) => { clearTimeout(timeout); reject(err); }
                });

                this.iframe.contentWindow.postMessage({ type: 'bg-proxy-request', url, requestId: id }, '*');
            });
        },

        cleanup() {
            if (this.iframe) { this.iframe.remove(); this.iframe = null; }
            this.pending.clear();
            this.ready = false;
        }
    };

    // ================== Background Manager ==================
    const BackgroundManager = {
        container: null,
        mediaLayer: null,
        elements: { video: null, image: null, iframe: null },
        current: { type: null, url: null },
        blobUrls: new Set(),
        requestId: 0,

        init() {
            this.container = document.createElement('div');
            this.container.className = 'phantom-background';
            this.container.innerHTML = '<div class="phantom-background-overlay"></div><div class="phantom-background-layer"></div>';
            this.mediaLayer = this.container.querySelector('.phantom-background-layer');
            document.body.insertBefore(this.container, document.body.firstChild);

            // Periodic cache cleanup
            ImageCache.cleanup();

            const apply = () => this.applyBackground();
            window.addEventListener('settings-changed', apply);
            window.addEventListener('storage', apply);

            document.addEventListener('visibilitychange', () => {
                const video = this.elements.video;
                if (!video) return;
                if (document.hidden) video.pause();
                else if (this.current.type === 'video') video.play().catch(() => { });
            });

            apply();
        },

        applyBackground() {
            if (!this.container) return;

            const s = window.Settings?.getAll() || {};
            const custom = s.customBackground;
            const theme = s.background || {};

            let type = null, url = null, pos = null, overlay = 0.4;

            if (custom && custom.type !== 'none') {
                if (custom.id && custom.id !== 'custom') {
                    const preset = window.SITE_CONFIG?.backgroundPresets?.find(b => b.id === custom.id);
                    if (preset) Object.assign(custom, preset);
                }
                ({ type, url, objectPosition: pos, overlay = 0.4 } = custom);
            } else if (theme.type === 'image' || theme.type === 'video' || theme.type === 'youtube') {
                type = theme.type;
                url = theme.value || theme.url;
                pos = theme.objectPosition;
                overlay = theme.overlay || 0.4;
            }

            document.documentElement.style.setProperty('--bg-overlay', overlay);

            if (pos && typeof pos === 'string') {
                pos = pos.toLowerCase().trim().replace(/\s+/g, ' ')
                    .replace('topleft', 'top left').replace('topright', 'top right')
                    .replace('bottomleft', 'bottom left').replace('bottomright', 'bottom right')
                    .replace('centercenter', 'center').replace('centerleft', 'center left')
                    .replace('centerright', 'center right');
            }

            document.documentElement.style.setProperty('--bg-image-position', pos || 'center');

            if (!type || !url) {
                this.clear();
                document.documentElement.style.backgroundColor = 'var(--bg)';
                return;
            }

            const thisRequest = ++this.requestId;
            this.clearMedia();
            this.current = { type, url };

            if (type === 'video' || url.match(/\.(mp4|webm|ogg|mov|m4v)$/i)) {
                this.createVideo(url, pos);
                this.activateBackground();
            } else if (type === 'youtube' || YOUTUBE_REGEX.test(url)) {
                this.createYouTube(url, pos);
                this.activateBackground();
            } else if (type === 'image') {
                this.handleImageBackground(url, pos, thisRequest);
            }
        },

        async handleImageBackground(url, pos, thisRequest) {
            const isStale = () => this.requestId !== thisRequest;

            // 1. Check Cache
            const cached = await ImageCache.get(url);
            if (cached) {
                if (isStale()) return;
                this.createImage(cached, pos);
                return;
            }

            // 2. Try Direct Load (CORS)
            const directUrl = await this.tryDirectLoad(url);
            if (directUrl) {
                if (isStale()) {
                    if (directUrl.startsWith('blob:')) URL.revokeObjectURL(directUrl);
                    return;
                }
                this.cacheFromUrl(url, directUrl);
                this.createImage(directUrl, pos);
                return;
            }

            // 3. Proxy
            try {
                const base64Data = await ProxyManager.proxyImage(url);
                if (isStale()) return;
                ImageCache.set(url, base64Data);
                this.createImage(base64Data, pos);
            } catch (err) {
                if (isStale()) return;
                console.warn('Background proxy failed, using fallback', err);
                this.createImage(url, pos);
            }
        },

        async tryDirectLoad(url) {
            if (!url.startsWith('http') || url.includes(location.hostname)) return url;
            try {
                const response = await fetch(url, { method: 'GET', mode: 'cors' });
                if (response.ok) {
                    const blob = await response.blob();
                    const blobUrl = URL.createObjectURL(blob);
                    this.blobUrls.add(blobUrl);
                    return blobUrl;
                }
            } catch { }
            return null;
        },

        async cacheFromUrl(originalUrl, loadedUrl) {
            try {
                if (loadedUrl.startsWith('blob:')) {
                    const response = await fetch(loadedUrl);
                    const blob = await response.blob();
                    const reader = new FileReader();
                    reader.onload = () => ImageCache.set(originalUrl, reader.result);
                    reader.readAsDataURL(blob);
                } else if (loadedUrl.startsWith('data:')) {
                    ImageCache.set(originalUrl, loadedUrl);
                }
            } catch { }
        },

        activateBackground() {
            this.container.classList.add('active');
            document.documentElement.classList.add('phantom-bg-active');
            document.body.classList.add('phantom-bg-active');
        },

        createVideo(url, pos) {
            const el = Object.assign(document.createElement('video'), {
                className: 'phantom-background-media', src: url, autoplay: true, loop: true, muted: true, playsInline: true, volume: 0
            });
            if (pos) el.style.objectPosition = pos;
            this.elements.video = el;
            this.mediaLayer.appendChild(el);
        },

        createImage(src, pos) {
            const el = Object.assign(document.createElement('img'), { className: 'phantom-background-media', src: src });
            if (pos) el.style.objectPosition = pos;
            el.onload = () => this.activateBackground();
            el.onerror = () => { if (this.elements.image === el) this.elements.image = null; };
            this.elements.image = el;
            this.mediaLayer.appendChild(el);
        },

        createYouTube(url, pos) {
            const id = url.match(YOUTUBE_REGEX)?.[1];
            if (!id) return;
            const el = Object.assign(document.createElement('iframe'), {
                className: 'phantom-background-media',
                src: `https://www.youtube.com/embed/${id}?autoplay=1&loop=1&playlist=${id}&controls=0&modestbranding=1&rel=0&mute=1&enablejsapi=1`,
                allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
            });
            if (pos) el.style.objectPosition = pos;
            this.elements.iframe = el;
            this.mediaLayer.appendChild(el);
        },

        clearMedia() {
            Object.entries(this.elements).forEach(([key, el]) => {
                if (!el) return;
                if (key === 'video') { el.pause(); el.src = ''; }
                if (key === 'iframe') el.src = 'about:blank';
                el.remove();
                this.elements[key] = null;
            });
            this.blobUrls.forEach(url => URL.revokeObjectURL(url));
            this.blobUrls.clear();
        },

        clear() {
            this.clearMedia();
            this.current = { type: null, url: null };
            document.documentElement.classList.remove('phantom-bg-active');
            document.body.classList.remove('phantom-bg-active');
            if (this.container) this.container.classList.remove('active');
        },

        cleanup() {
            this.clearMedia();
            ProxyManager.cleanup();
        }
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => BackgroundManager.init());
    else BackgroundManager.init();
    window.BackgroundManager = BackgroundManager;
})();