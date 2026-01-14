/**
 * PHANTOM - BACKGROUND MANAGER
 * Handles robust image and video backgrounds with cross-fading.
 */
(function () {
    'use strict';

    const BackgroundManager = {
        container: null,
        layers: [],
        currentLayerIndex: 0,
        settings: null,
        pendingShowNext: null,
        pendingUrl: null,

        init() {
            // Create container if it doesn't exist
            if (!document.getElementById('phantom-background')) {
                this.container = document.createElement('div');
                this.container.id = 'phantom-background';
                this.container.className = 'phantom-background';

                // Overlay for readability
                const overlay = document.createElement('div');
                overlay.className = 'phantom-background-overlay';
                this.container.appendChild(overlay);

                // Two layers for cross-fading
                for (let i = 0; i < 2; i++) {
                    const layer = document.createElement('div');
                    layer.className = 'phantom-background-layer';
                    layer.style.opacity = '0';
                    this.container.appendChild(layer);
                    this.layers.push(layer);
                }

                document.body.prepend(this.container);
            } else {
                this.container = document.getElementById('phantom-background');
                this.layers = Array.from(this.container.querySelectorAll('.phantom-background-layer'));
            }

            // Listen for settings changes
            window.addEventListener('settings-changed', (e) => {
                this.updateFromSettings(e.detail);
            });

            // Listen for proxy messages
            window.addEventListener('message', (e) => this.handleMessage(e));

            // Initial load
            const initialSettings = window.Settings ? window.Settings.getAll() : {};
            this.updateFromSettings(initialSettings);
        },

        handleMessage(e) {
            if (e.data?.type === 'bg-loaded') {
                if (this.pendingUrl === e.data.url && this.pendingShowNext) {
                    this.pendingShowNext();
                    this.pendingShowNext = null; // Clear to prevent double calls (though showNext handles it too)
                }
            } else if (e.data?.type === 'bg-error') {
                if (this.pendingUrl === e.data.url) {
                    console.warn('Proxy background failed:', e.data.error);
                    if (window.Notify) window.Notify.error('Background Error', 'Failed to load background image.');
                    this.pendingShowNext = null;
                }
            }
        },

        updateFromSettings(settings) {
            this.settings = settings;
            const bg = settings.customBackground || { type: 'none' };
            this.applyBackground(bg);
        },

        // Extract YouTube video ID from various URL formats
        getYouTubeId(url) {
            if (!url) return null;
            const patterns = [
                /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
                /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
            ];
            for (const pattern of patterns) {
                const match = url.match(pattern);
                if (match) return match[1];
            }
            return null;
        },

        applyBackground(bg) {
            const nextIndex = (this.currentLayerIndex + 1) % 2;
            const currentLayer = this.layers[this.currentLayerIndex];
            const nextLayer = this.layers[nextIndex];

            // Cancel any pending transition if settings changed quickly
            this.pendingShowNext = null;
            this.pendingUrl = null;

            // Handle "None" - reset to theme default
            if (!bg || bg.type === 'none' || bg.id === 'none') {
                this.container.classList.remove('active');
                document.body.classList.remove('phantom-bg-active');
                this.updateOverlay(0);

                // Fade out layers
                this.layers.forEach(layer => {
                    layer.style.opacity = '0';
                    setTimeout(() => { layer.innerHTML = ''; }, 500);
                });

                // Inform Settings API to re-apply basic theme variables
                if (window.Settings) window.Settings.apply();
                return;
            }

            // Check for YouTube URL
            const youtubeId = this.getYouTubeId(bg.url);
            if (youtubeId) {
                bg = { ...bg, type: 'youtube', youtubeId };
            }

            // Check if URL is actually different to avoid flickering
            const currentMedia = currentLayer.querySelector('img, video, iframe');
            // Check dataset.url first (for proxies), then src
            const currentSrc = currentMedia?.dataset?.url || currentMedia?.src;

            if (currentSrc === bg.url || (bg.youtubeId && currentSrc?.includes(bg.youtubeId))) {
                this.container.classList.add('active');
                currentLayer.style.opacity = '1';
                this.updateOverlay(bg.overlay || 0.3);
                return;
            }

            this.container.classList.add('active');
            document.body.classList.add('phantom-bg-active');
            nextLayer.innerHTML = '';

            let mediaElement;
            let showNextCalled = false;

            // Define showNext callback
            const showNext = () => {
                if (showNextCalled) return;
                showNextCalled = true;

                nextLayer.style.opacity = '1';
                currentLayer.style.opacity = '0';
                this.currentLayerIndex = nextIndex;
                this.updateOverlay(bg.overlay || 0.3);

                // Cleanup old layer after transition
                setTimeout(() => {
                    if (this.currentLayerIndex === nextIndex) {
                        currentLayer.innerHTML = '';
                    }
                }, 1000);
            };

            if (bg.type === 'youtube') {
                // YouTube embed as background
                mediaElement = document.createElement('iframe');
                mediaElement.src = `https://www.youtube.com/embed/${bg.youtubeId}?autoplay=1&mute=1&loop=1&playlist=${bg.youtubeId}&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&fs=0`;
                mediaElement.dataset.url = bg.url;
                mediaElement.className = 'phantom-background-media';
                mediaElement.allow = 'autoplay; encrypted-media';
                mediaElement.setAttribute('frameborder', '0');
                mediaElement.setAttribute('allowfullscreen', '');

                nextLayer.appendChild(mediaElement);
                // YouTube iframes are ready immediately (load event is unreliable for cross-origin iframes)
                setTimeout(showNext, 500);

            } else {
                // NORMAL MEDIA HANDLING (No Proxy)
                if (bg.type === 'video') {
                    mediaElement = document.createElement('video');
                    mediaElement.src = bg.url;
                    mediaElement.dataset.url = bg.url;
                    mediaElement.className = 'phantom-background-media';
                    mediaElement.autoplay = true;
                    mediaElement.muted = true;
                    mediaElement.loop = true;
                    mediaElement.playsInline = true;
                    mediaElement.setAttribute('playsinline', '');
                    mediaElement.setAttribute('webkit-playsinline', '');
                    if (bg.poster) mediaElement.poster = bg.poster;
                    mediaElement.preload = 'auto';

                    mediaElement.onloadeddata = () => { mediaElement.play().catch(() => { }); };
                    mediaElement.onerror = () => {
                        console.warn('Video failed to load:', bg.url);
                        if (window.Notify) window.Notify.error('Background Error', 'Video failed to load.');
                    };
                    mediaElement.oncanplay = showNext;
                    nextLayer.appendChild(mediaElement);
                    setTimeout(showNext, 3000); // Video fallback
                } else {
                    // Image Handling
                    mediaElement = document.createElement('img');
                    mediaElement.src = bg.url;
                    mediaElement.dataset.url = bg.url;
                    mediaElement.className = 'phantom-background-media';

                    mediaElement.onerror = () => {
                        console.warn('Image failed to load:', bg.url);
                        if (window.Notify) window.Notify.error('Background Error', 'Image failed to load.');
                        showNext();
                    };

                    if (mediaElement.complete) showNext();
                    else {
                        mediaElement.onload = showNext;
                        setTimeout(showNext, 2500); // Image fallback
                    }
                    nextLayer.appendChild(mediaElement);
                }
            }

            if (bg.objectPosition && mediaElement) {
                mediaElement.style.objectPosition = bg.objectPosition;
            }
        },

        updateOverlay(opacity) {
            const overlay = this.container.querySelector('.phantom-background-overlay');
            if (overlay) {
                overlay.style.backgroundColor = `rgba(0,0,0, ${opacity})`;
            }
        }
    };

    window.BackgroundManager = BackgroundManager;

    // Auto-init on DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => BackgroundManager.init());
    } else {
        BackgroundManager.init();
    }
})();
