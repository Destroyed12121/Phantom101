// ============================================
// SETTINGS API
// ============================================
// Centralized settings management with localStorage
// persistence and reactive updates across components.
// ============================================

(function () {
    'use strict';

    const STORAGE_KEY = 'void_settings';

    // Default settings from config
    const getDefaults = () => {
        if (window.SITE_CONFIG?.defaults) {
            return { ...window.SITE_CONFIG.defaults };
        }
        return {
            cloakMode: 'none',
            cloakRotation: false,
            cloakInterval: 5000,
            panicKey: 'Escape',
            panicModifiers: ['ctrl', 'shift'],
            panicUrl: 'https://classroom.google.com',

            maxMovieRating: 'R',
            offlineGames: [],
            gameLibrary: 'lib1',
            leaveConfirmation: false
        };
    };

    // Load settings from storage
    const load = () => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return { ...getDefaults(), ...JSON.parse(stored) };
            }
        } catch (e) {
            console.warn('Failed to load settings:', e);
        }
        return getDefaults();
    };

    // Save settings to storage
    const save = (settings) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
            window.dispatchEvent(new CustomEvent('settings-changed', { detail: settings }));
            if (window.parent !== window) {
                window.parent.postMessage({ type: 'settings-update' }, '*');
            }
        } catch (e) {
            console.warn('Failed to save settings:', e);
        }
    };

    let _settings = load();

    // Settings API
    window.Settings = {
        // Get a single setting
        get(key) {
            return _settings[key];
        },

        // Set a single setting
        set(key, value) {
            _settings[key] = value;
            save(_settings);
            this.apply();
            return value;
        },

        // Get all settings
        getAll() {
            return { ..._settings };
        },

        // Update multiple settings
        update(partial) {
            _settings = { ..._settings, ...partial };
            save(_settings);
            this.apply();
        },

        // Reset to defaults
        reset() {
            _settings = getDefaults();
            save(_settings);
            this.apply();
        },

        // Apply settings to DOM (theme & other)
        apply() {
            const root = document.documentElement;
            const s = _settings;
            const d = window.SITE_CONFIG?.defaults || {};

            // Apply variables (with fallbacks to defaults)
            root.style.setProperty('--accent', s.accentColor || d.accentColor || '#ffffff');
            root.style.setProperty('--surface', s.surfaceColor || d.surfaceColor || '#0f0f0f');
            root.style.setProperty('--surface-hover', s.surfaceHoverColor || d.surfaceHoverColor || '#1a1a1a');
            root.style.setProperty('--surface-active', s.surfaceActiveColor || d.surfaceActiveColor || '#252525');
            root.style.setProperty('--secondary', s.secondaryColor || d.secondaryColor || '#2e2e33');
            root.style.setProperty('--border', s.borderColor || d.borderColor || '#1f1f1f');
            root.style.setProperty('--border-light', s.borderLightColor || d.borderLightColor || '#2a2a2a');
            root.style.setProperty('--text', s.textColor || d.textColor || '#e4e4e7');
            root.style.setProperty('--text-muted', s.textSecondaryColor || d.textSecondaryColor || '#71717a');
            root.style.setProperty('--text-dim', s.textDimColor || d.textDimColor || '#52525b');

            // Background
            if (s.background) {
                const bg = s.background;
                if (bg.type === 'color') {
                    root.style.setProperty('--bg', bg.value);
                    root.style.setProperty('--bg-image', 'none');
                } else if (bg.type === 'gradient') {
                    root.style.setProperty('--bg', 'transparent');
                    root.style.setProperty('--bg-image', bg.value);
                } else if (bg.type === 'image' || bg.type === 'video') {
                    root.style.setProperty('--bg-image', `url(${bg.value})`);
                }
            } else {
                root.style.setProperty('--bg', d.background?.value || '#0a0a0a');
                root.style.setProperty('--bg-image', 'none');
            }
        },

        // Listen for changes
        onChange(callback) {
            window.addEventListener('settings-changed', (e) => callback(e.detail));
        },

        // Rating check - returns true if rating is allowed
        isRatingAllowed(rating) {
            // NR and NC-17 are NEVER allowed
            if (!rating || rating === 'NR' || rating === 'NC-17') {
                return false;
            }

            const ratingOrder = ['G', 'PG', 'PG-13', 'R'];
            const maxIndex = ratingOrder.indexOf(_settings.maxMovieRating);
            const ratingIndex = ratingOrder.indexOf(rating);

            if (maxIndex === -1 || ratingIndex === -1) return false;
            return ratingIndex <= maxIndex;
        }
    };

    // Initialize on load
    const init = () => {
        Settings.apply();

        // Panic Key Handler
        document.addEventListener('keydown', (e) => {
            const mods = _settings.panicModifiers || [];
            const key = _settings.panicKey || 'Escape';

            // Check modifiers
            const ctrl = mods.includes('ctrl') === e.ctrlKey;
            const shift = mods.includes('shift') === e.shiftKey;
            const alt = mods.includes('alt') === e.altKey;

            if (ctrl && shift && alt && e.key.toLowerCase() === key.toLowerCase()) {
                e.preventDefault();
                const url = _settings.panicUrl || 'https://classroom.google.com';

                // Try to use replace to avoid history
                try {
                    window.location.replace(url);
                } catch (err) {
                    window.location.href = url;
                }
            }
        });

        // Rotating Cloaks Handler
        let rotationInterval;
        const startRotation = () => {
            if (rotationInterval) clearInterval(rotationInterval);
            if (!_settings.rotateCloaks) return;

            const cloaks = [...(window.SITE_CONFIG?.cloakPresets || []), ...(_settings.customCloaks || [])];

            if (!cloaks.length) return;

            let index = 0;
            const rotate = () => {
                const c = cloaks[index];
                document.title = c.title || c.name;

                // Update favicon
                let link = document.querySelector("link[rel*='icon']");
                if (!link) {
                    link = document.createElement('link');
                    link.type = 'image/x-icon';
                    link.rel = 'shortcut icon';
                    document.head.appendChild(link);
                }
                link.href = c.icon || '';

                index = (index + 1) % cloaks.length;
            };

            const interval = (_settings.rotateInterval || 5) * 1000;
            rotate(); // Initial
            rotationInterval = setInterval(rotate, interval);
        };

        if (_settings.rotateCloaks) startRotation();

        window.addEventListener('settings-changed', (e) => {
            if (e.detail.rotateCloaks !== undefined || e.detail.rotateInterval !== undefined) {
                // Update local ref
                _settings = e.detail;
                startRotation();
            }
        });

        // Listen for storage changes (cross-tab/frame)
        window.addEventListener('storage', (e) => {
            if (e.key === STORAGE_KEY) {
                const newSettings = load();
                // Update internal state
                _settings = newSettings;
                Settings.apply();
                startRotation();
                // Re-dispatch for local listeners
                window.dispatchEvent(new CustomEvent('settings-changed', { detail: newSettings }));
            }
        });

        // Listen for postMessage updates (from settings iframe)
        window.addEventListener('message', (e) => {
            if (e.data?.type === 'settings-update' || e.data === 'updateCloak') {
                const newSettings = load();
                _settings = newSettings;
                Settings.apply();
                startRotation();
            }
        });
        // Leave Confirmation
        window.addEventListener('beforeunload', (e) => {
            if (_settings.leaveConfirmation) {
                e.preventDefault();
                e.returnValue = '';
                return '';
            }
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
