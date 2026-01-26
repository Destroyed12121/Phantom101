// background stuff
(function () {
    'use strict';

    if (window.BackgroundManager) return;

    const YOUTUBE_REGEX = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;

    const BackgroundManager = {
        container: null,
        mediaLayer: null,
        elements: { video: null, image: null, iframe: null },
        current: { type: null, url: null },
        cacheName: 'phantom-bg-cache-v2',

        init() {
            this.container = document.createElement('div');
            this.container.className = 'phantom-background';
            this.container.innerHTML = '<div class="phantom-background-overlay"></div><div class="phantom-background-layer"></div>';
            this.mediaLayer = this.container.querySelector('.phantom-background-layer');
            document.body.insertBefore(this.container, document.body.firstChild);

            const apply = () => this.applyBackground();
            window.addEventListener('settings-changed', apply);
            window.addEventListener('storage', apply);
            window.addEventListener('beforeunload', () => this.cleanup());
            window.addEventListener('pagehide', () => this.cleanup());

            document.addEventListener('visibilitychange', () => {
                const video = this.elements.video;
                if (!video) return;
                if (document.hidden) video.pause();
                else if (this.current.type === 'video') video.play().catch(() => { });
            });

            this.applyBackground();
        },

        applyBackground() {
            if (!this.container) return; // Wait for init() to create the container

            const s = window.Settings?.getAll() || {};
            const custom = s.customBackground;
            const theme = s.background || {};

            let type = null, url = null, pos = null, overlay = 0.4;

            if (custom && custom.type !== 'none') {
                // Refresh from config if possible to get latest props like objectPosition
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

            // Handle common positioning typos and normalize
            if (pos && typeof pos === 'string') {
                pos = pos.toLowerCase().trim()
                    .replace(/\s+/g, ' ') // Normalize multiple spaces
                    .replace('topleft', 'top left')
                    .replace('topright', 'top right')
                    .replace('bottomleft', 'bottom left')
                    .replace('bottomright', 'bottom right')
                    .replace('centercenter', 'center')
                    .replace('centerleft', 'center left')
                    .replace('centerright', 'center right');
            }

            document.documentElement.style.setProperty('--bg-image-position', pos || 'center');

            if (!type || !url) {
                this.clear();
                document.documentElement.style.backgroundColor = 'var(--bg)';
                document.documentElement.style.setProperty('--bg-image-position', 'center');
                return;
            }
            if (this.current.type === type && this.current.url === url) return;

            this.current = { type, url };

            if (type === 'video' || url.match(/\.(mp4|webm|ogg|mov|m4v)$/i)) {
                this.clearMedia();
                this.createVideo(url, pos);
                this.container.classList.add('active');
                document.documentElement.classList.add('phantom-bg-active');
                document.body.classList.add('phantom-bg-active');
            } else if (type === 'youtube' || YOUTUBE_REGEX.test(url)) {
                this.clearMedia();
                this.createYouTube(url, pos);
                this.container.classList.add('active');
                document.documentElement.classList.add('phantom-bg-active');
                document.body.classList.add('phantom-bg-active');
            } else if (type === 'image') {
                this.handleImageBackground(url, pos);
            }
        },

        async getProxiedCachedUrl(url) {
            // Local images don't need proxying
            if (!url.startsWith('http') || url.includes(location.hostname)) return url;

            // Try direct load first (faster)
            try {
                const directTest = await fetch(url, { method: 'HEAD', mode: 'cors' });
                if (directTest.ok) return url;
            } catch (e) {
                // CORS blocked, need to proxy
            }

            // Wait for BareMux (max 500ms)
            let retries = 0;
            while (!window.BareMux && retries < 5) {
                await new Promise(r => setTimeout(r, 100));
                retries++;
            }

            if (!window.BareMux) {
                console.warn("Background: BareMux not found, trying direct URL.");
                return url; // Try direct anyway
            }

            try {
                const client = new window.BareMux.BareClient();
                const response = await client.fetch(url);
                if (!response.ok) throw new Error('Proxy fetch failed');

                const blob = await response.blob();
                return URL.createObjectURL(blob);
            } catch (error) {
                console.error("Background proxy failed:", error);
                return url; // Fallback to direct URL
            }
        },

        async handleImageBackground(url, pos) {
            // Pre-load the image (proxied/cached or direct)
            const finalUrl = await this.getProxiedCachedUrl(url);

            // Check if this is still the current background after async fetch
            if (this.current.url !== url) {
                if (finalUrl && finalUrl.startsWith('blob:')) URL.revokeObjectURL(finalUrl);
                return;
            }

            this.clearMedia();
            this.createImage(finalUrl, pos);
        },

        createVideo(url, pos) {
            const el = Object.assign(document.createElement('video'), {
                className: 'phantom-background-media', src: url, autoplay: true, loop: true, muted: true, playsInline: true, volume: 0
            });
            // Apply objectPosition from settings/preset
            if (pos) el.style.objectPosition = pos;
            el.onerror = () => (this.elements.video = null);
            this.elements.video = el;
            this.mediaLayer.appendChild(el);
        },

        createImage(url, pos) {
            const el = Object.assign(document.createElement('img'), {
                className: 'phantom-background-media',
                src: url
            });

            // Apply objectPosition from settings/preset
            if (pos) el.style.objectPosition = pos;

            el.onload = () => {
                if (this.current.url === url || url.startsWith('blob:')) {
                    this.container.classList.add('active');
                    document.documentElement.classList.add('phantom-bg-active');
                    document.body.classList.add('phantom-bg-active');
                }
            };
            el.onerror = () => {
                console.warn("Background image failed to load:", url);
                if (this.elements.image === el) this.elements.image = null;
            };

            this.elements.image = el;
            this.mediaLayer.appendChild(el);
        },

        // youtube logic
        createYouTube(url, pos) {
            const id = url.match(YOUTUBE_REGEX)?.[1];
            if (!id) return;
            const el = Object.assign(document.createElement('iframe'), {
                className: 'phantom-background-media',
                src: `https://www.youtube.com/embed/${id}?autoplay=1&loop=1&playlist=${id}&controls=0&modestbranding=1&rel=0&mute=1&enablejsapi=1`,
                allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
            });
            // Apply objectPosition from settings/preset
            if (pos) el.style.objectPosition = pos;
            this.elements.iframe = el;
            this.mediaLayer.appendChild(el);
        },

        clearMedia() {
            Object.entries(this.elements).forEach(([key, el]) => {
                if (!el) return;
                if (key === 'video') { el.pause(); el.src = ''; }
                if (key === 'iframe') el.src = 'about:blank';
                if (key === 'image' && el.src.startsWith('blob:')) {
                    URL.revokeObjectURL(el.src);
                }
                el.remove();
                this.elements[key] = null;
            });
        },

        clear() {
            this.clearMedia();
            this.current = { type: null, url: null };
            document.documentElement.classList.remove('phantom-bg-active');
            document.body.classList.remove('phantom-bg-active');
            document.documentElement.style.backgroundColor = '';
            if (this.container) this.container.classList.remove('active');
        },

        cleanup() {
            this.clearMedia();
        }
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => BackgroundManager.init());
    else BackgroundManager.init();

    window.BackgroundManager = BackgroundManager;
})();
