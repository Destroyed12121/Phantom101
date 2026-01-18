/**
 * PHANTOM - BACKGROUND MANAGER
 * Handles custom background images and videos
 */
(function () {
    'use strict';

    // Prevent multiple instances
    if (window.BackgroundManager) return;

    // Shared YouTube regex (also used in settingspage.js)
    const YOUTUBE_REGEX = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;

    const BackgroundManager = {
        container: null,
        mediaLayer: null,
        videoElement: null,
        imageElement: null,
        iframeElement: null,
        currentType: null,
        currentUrl: null,

        init() {
            // Create background container
            this.container = document.createElement('div');
            this.container.className = 'phantom-background';
            this.container.innerHTML = '<div class="phantom-background-overlay"></div><div class="phantom-background-layer"></div>';
            this.mediaLayer = this.container.querySelector('.phantom-background-layer');

            // Insert at the beginning of body
            document.body.insertBefore(this.container, document.body.firstChild);

            // Listen for settings changes
            window.addEventListener('settings-changed', () => this.applyBackground());
            window.addEventListener('storage', () => this.applyBackground());

            // Cleanup on page unload to prevent audio continuation
            window.addEventListener('beforeunload', () => this.cleanup());
            window.addEventListener('pagehide', () => this.cleanup());

            // Pause videos when page becomes hidden for performance
            document.addEventListener('visibilitychange', () => {
                if (document.hidden && this.videoElement) {
                    this.videoElement.pause();
                } else if (!document.hidden && this.videoElement && this.currentType === 'video') {
                    this.videoElement.play().catch(() => {}); // Ignore play promise rejection
                }
            });

            // Initial apply
            this.applyBackground();
        },

        applyBackground() {
            const settings = window.Settings?.getAll() || {};
            const customBg = settings.customBackground;
            const themeBg = settings.background || {};

            let bgType = null;
            let bgUrl = null;
            let bgObjectPosition = null;
            let bgOverlay = 0.4;

            // Check custom background first
            if (customBg && customBg.type !== 'none') {
                bgType = customBg.type;
                bgUrl = customBg.url;
                bgObjectPosition = customBg.objectPosition;
                bgOverlay = customBg.overlay !== undefined ? customBg.overlay : 0.4;
            } else if (themeBg.type === 'image' || themeBg.type === 'video') {
                bgType = themeBg.type;
                bgUrl = themeBg.value;
                bgObjectPosition = themeBg.objectPosition;
                bgOverlay = themeBg.overlay !== undefined ? themeBg.overlay : 0.4;
            }

            // Apply overlay value to CSS variable
            document.documentElement.style.setProperty('--bg-overlay', bgOverlay);

            // No background to apply
            if (!bgType || !bgUrl) {
                this.clearBackground();
                return;
            }

            // Skip if already displaying this background
            if (this.currentType === bgType && this.currentUrl === bgUrl) {
                return;
            }

            this.currentType = bgType;
            this.currentUrl = bgUrl;

            // Clear existing media
            this.clearMedia();

            // Create appropriate media element
            if (bgType === 'video' || bgUrl.match(/\.(mp4|webm|ogg|mov|m4v)$/i)) {
                this.createVideo(bgUrl);
            } else if (bgType === 'youtube' || YOUTUBE_REGEX.test(bgUrl)) {
                this.createYouTube(bgUrl);
            } else if (bgType === 'image') {
                this.createImage(bgUrl, bgObjectPosition);
            }

            // Activate container
            this.container.classList.add('active');
            
            // Add class to body for CSS styling
            document.body.classList.add('phantom-bg-active');
        },

        createVideo(url) {
            this.videoElement = document.createElement('video');
            this.videoElement.className = 'phantom-background-media';
            this.videoElement.src = url;
            this.videoElement.autoplay = true;
            this.videoElement.loop = true;
            this.videoElement.muted = true;
            this.videoElement.playsInline = true;
            this.videoElement.volume = 0; // Ensure volume is 0

            // Error handling
            this.videoElement.onerror = () => {
                console.warn('Failed to load video background:', url);
                this.videoElement = null;
            };

            this.mediaLayer.appendChild(this.videoElement);
        },

        createImage(url, objectPosition) {
            this.imageElement = document.createElement('img');
            this.imageElement.className = 'phantom-background-media';
            this.imageElement.src = url;
            this.imageElement.alt = 'Background';

            // Apply object-position if specified (e.g., 'top left' for moon-landing)
            if (objectPosition) {
                this.imageElement.style.objectPosition = objectPosition;
            }

            // Error handling
            this.imageElement.onerror = () => {
                console.warn('Failed to load image background:', url);
                this.imageElement = null;
            };

            this.mediaLayer.appendChild(this.imageElement);
        },

        createYouTube(url) {
            // Extract YouTube video ID using shared regex
            const ytId = url.match(YOUTUBE_REGEX)?.[1];
            if (!ytId) {
                console.warn('Invalid YouTube URL:', url);
                return;
            }

            // Create iframe for YouTube embed
            this.iframeElement = document.createElement('iframe');
            this.iframeElement.className = 'phantom-background-media';
            this.iframeElement.src = `https://www.youtube.com/embed/${ytId}?autoplay=1&loop=1&playlist=${ytId}&controls=0&modestbranding=1&rel=0&mute=1&enablejsapi=1`;
            this.iframeElement.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
            this.iframeElement.allowFullscreen = false;
            this.iframeElement.muted = true;
            this.iframeElement.playsInline = true;

            // Handle iframe load errors (YouTube may block embedding)
            this.iframeElement.onerror = () => {
                console.warn('Failed to load YouTube background:', url);
                this.iframeElement = null;
            };

            this.mediaLayer.appendChild(this.iframeElement);
        },

        clearMedia() {
            if (this.videoElement) {
                this.videoElement.pause();
                this.videoElement.currentTime = 0;
                this.videoElement.remove();
                this.videoElement = null;
            }
            if (this.imageElement) {
                this.imageElement.remove();
                this.imageElement = null;
            }
            if (this.iframeElement) {
                this.iframeElement.src = 'about:blank';
                this.iframeElement.remove();
                this.iframeElement = null;
            }
        },

        clearBackground() {
            this.clearMedia();
            this.currentType = null;
            this.currentUrl = null;
            this.container.classList.remove('active');
            document.body.classList.remove('phantom-bg-active');
        },

        cleanup() {
            // Stop all media playback before page unload
            if (this.videoElement) {
                this.videoElement.pause();
                this.videoElement.currentTime = 0;
                this.videoElement.src = '';
                this.videoElement.load(); // Reset the video element
            }
            if (this.iframeElement) {
                this.iframeElement.src = 'about:blank';
            }
            this.clearMedia();
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => BackgroundManager.init());
    } else {
        BackgroundManager.init();
    }

    window.BackgroundManager = BackgroundManager;
})();
