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
            panicKey: 'x',
            panicModifiers: ['ctrl', 'shift'],
            panicUrl: 'https://classroom.google.com',

            maxMovieRating: 'R',
            offlineGames: [],
            gameLibrary: 'multi',
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

            // Background Management
            // 1. Always apply theme background color as the base
            const themeBg = s.background || d.background || { type: 'color', value: '#0a0a0a' };
            if (themeBg.type === 'color') {
                root.style.setProperty('--bg', themeBg.value);
            } else if (themeBg.type === 'gradient') {
                root.style.setProperty('--bg', 'transparent');
            }

            // 2. Handle background images/videos (either from theme or custom)
            let customBg = s.customBackground;
            const isCustomActive = customBg && customBg.type !== 'none';

            if (isCustomActive) {
                if (customBg.url) {
                    root.style.setProperty('--bg-image', `url(${customBg.url})`);
                }
            } else {
                // Revert to theme background if it has an image/gradient
                if (themeBg.type === 'image' || themeBg.type === 'video') {
                    root.style.setProperty('--bg-image', `url(${themeBg.value})`);
                } else if (themeBg.type === 'gradient') {
                    root.style.setProperty('--bg-image', themeBg.value);
                } else {
                    root.style.setProperty('--bg-image', 'none');
                }
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
        // Auto-inject Background System if not present
        if (!window.BackgroundManager && !document.querySelector('script[src*="background.js"]')) {
            const isSubPage = window.location.pathname.includes('/pages/') || window.location.pathname.includes('/staticsjv2/');
            const prefix = isSubPage ? '../' : '';

            // Inject CSS
            if (!document.querySelector('link[href*="background.css"]')) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = prefix + 'styles/background.css';
                document.head.appendChild(link);
            }

            // Inject JS
            const script = document.createElement('script');
            script.src = prefix + 'scripts/background.js';
            document.head.appendChild(script);
        }

        Settings.apply();

        // Check for Featured Background (Overrides current if ID is new)
        const featured = window.SITE_CONFIG?.featuredBackground;
        if (featured && featured.active && featured.id && featured.id !== _settings.lastSeenFeatured) {
            Settings.update({
                customBackground: featured,
                lastSeenFeatured: featured.id,
                backgroundRotation: false // Override auto-rotate as requested
            });
        }

        // Panic Key Handler - Fast white screen redirect
        document.addEventListener('keydown', (e) => {
            const mods = _settings.panicModifiers || [];
            const key = _settings.panicKey || 'x';

            // Check if all required modifiers are pressed
            const ctrlRequired = mods.includes('ctrl');
            const shiftRequired = mods.includes('shift');
            const altRequired = mods.includes('alt');

            // Match if required modifiers match AND unrequired modifiers are not pressed
            const ctrlMatch = ctrlRequired ? e.ctrlKey : !e.ctrlKey;
            const shiftMatch = shiftRequired ? e.shiftKey : !e.shiftKey;
            const altMatch = altRequired ? e.altKey : !e.altKey;

            if (ctrlMatch && shiftMatch && altMatch && e.key.toLowerCase() === key.toLowerCase()) {
                e.preventDefault();

                // Show white screen instantly (if panic-overlay exists in parent)
                const parentOverlay = window.parent?.document?.getElementById('panic-overlay');
                if (parentOverlay) {
                    parentOverlay.style.display = 'block';
                } else {
                    // Create overlay if it doesn't exist
                    const overlay = document.createElement('div');
                    overlay.id = 'panic-overlay';
                    overlay.style.cssText = 'position:fixed;inset:0;background:white;z-index:99999;';
                    document.body.appendChild(overlay);
                }

                // Redirect immediately
                const url = _settings.panicUrl || 'https://classroom.google.com';
                try {
                    window.location.replace(url);
                } catch (err) {
                    window.location.href = url;
                }
            }
        }, true); // Use capture phase for faster response

        window.addEventListener('settings-changed', (e) => {
            if (e.detail.rotateCloaks !== undefined || e.detail.rotateInterval !== undefined || e.detail.backgroundRotation !== undefined) {
                // Update local ref
                _settings = e.detail;
            }
        });

        // Listen for storage changes (cross-tab/frame)
        window.addEventListener('storage', (e) => {
            if (e.key === STORAGE_KEY) {
                const newSettings = load();
                // Update internal state
                _settings = newSettings;
                Settings.apply();
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
                // Ensure cloaking and other listeners are notified
                window.dispatchEvent(new CustomEvent('settings-changed', { detail: newSettings }));
            }
        });

        // Theme Rotation Logic
        const checkThemeRotation = () => {
            if (!_settings.themeRotation) return;

            const now = Date.now();
            const lastRotation = _settings.lastThemeRotation || 0;
            const TWO_DAYS = 172800000; // 2 * 24 * 60 * 60 * 1000

            if (now - lastRotation >= TWO_DAYS) {
                const presets = window.SITE_CONFIG?.themePresets || {};
                const keys = Object.keys(presets);

                if (keys.length > 0) {
                    let randomKey;

                    // First rotation: limit to default dark, midnight, or flame
                    if (lastRotation === 0) {
                        const allowed = ['dark', 'midnight'].filter(k => keys.includes(k));
                        if (allowed.length > 0) {
                            randomKey = allowed[Math.floor(Math.random() * allowed.length)];
                        }
                    } else if (keys.length > 1) {
                        // Subsequent rotations: avoid repeating current theme
                        let attempts = 0;
                        do {
                            randomKey = keys[Math.floor(Math.random() * keys.length)];
                            attempts++;
                        } while (presets[randomKey].surface === _settings.surfaceColor && attempts < 5);
                    } else {
                        randomKey = keys[0];
                    }

                    if (randomKey) {
                        const theme = presets[randomKey];
                        Settings.update({
                            background: theme.bg,
                            surfaceColor: theme.surface,
                            surfaceHoverColor: theme.surfaceHover,
                            surfaceActiveColor: theme.surfaceActive,
                            secondaryColor: theme.secondary,
                            borderColor: theme.border,
                            borderLightColor: theme.borderLight,
                            textColor: theme.text,
                            textSecondaryColor: theme.textSec,
                            textDimColor: theme.textDim,
                            accentColor: theme.accent,
                            lastThemeRotation: now
                        });
                    }
                }
            }
        };
        checkThemeRotation();

        // Background Rotation Logic
        const checkBackgroundRotation = () => {
            if (!_settings.backgroundRotation) return;

            const now = Date.now();
            const lastRotation = _settings.lastBackgroundRotation || 0;
            const TWO_DAYS = 172800000;

            if (now - lastRotation >= TWO_DAYS) {
                const presets = window.SITE_CONFIG?.backgroundPresets || [];
                // Filter out 'none' and optional 'custom' (though custom shouldn't be in presets)
                const validPresets = presets.filter(p => p.id !== 'none' && p.id !== 'custom');

                if (validPresets.length > 0) {
                    let randomPreset;
                    // Avoid repeating current background if possible
                    if (validPresets.length > 1) {
                        let attempts = 0;
                        const currentId = _settings.customBackground?.id;
                        do {
                            randomPreset = validPresets[Math.floor(Math.random() * validPresets.length)];
                            attempts++;
                        } while (randomPreset.id === currentId && attempts < 5);
                    } else {
                        randomPreset = validPresets[0];
                    }

                    if (randomPreset) {
                        Settings.update({
                            customBackground: randomPreset,
                            lastBackgroundRotation: now
                        });
                    }
                }
            }
        };
        checkBackgroundRotation();

        // Leave Confirmation
        window.addEventListener('beforeunload', (e) => {
            const isMainContainer = !!document.getElementById('main-frame');
            if (isMainContainer && _settings.leaveConfirmation) {
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
