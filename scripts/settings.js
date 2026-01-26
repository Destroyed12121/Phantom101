// settings handler
(function () {
    'use strict';

    const STORAGE_KEY = 'void_settings';

    const getDefaults = () => {
        return window.SITE_CONFIG?.defaults || {
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

    window.Settings = {
        get(key) { return _settings[key]; },

        getAll() { return { ..._settings }; },

        set(key, value) {
            _settings[key] = value;
            save(_settings);
            this.apply();
            return value;
        },

        update(partial) {
            _settings = { ..._settings, ...partial };
            save(_settings);
            this.apply();
        },

        reset() {
            _settings = getDefaults();
            save(_settings);
            this.apply();
        },

        apply() {
            const root = document.documentElement;
            const s = _settings;
            const d = window.SITE_CONFIG?.defaults || {};

            const vars = {
                '--accent': s.accentColor || d.accentColor || '#ffffff',
                '--surface': s.surfaceColor || d.surfaceColor || '#0f0f0f',
                '--surface-hover': s.surfaceHoverColor || d.surfaceHoverColor || '#1a1a1a',
                '--surface-active': s.surfaceActiveColor || d.surfaceActiveColor || '#252525',
                '--secondary': s.secondaryColor || d.secondaryColor || '#2e2e33',
                '--border': s.borderColor || d.borderColor || '#1f1f1f',
                '--border-light': s.borderLightColor || d.borderLightColor || '#2a2a2a',
                '--text': s.textColor || d.textColor || '#e4e4e7',
                '--text-muted': s.textSecondaryColor || d.textSecondaryColor || '#71717a',
                '--text-dim': s.textDimColor || d.textDimColor || '#52525b',
                '--toggle': s.toggleColor || d.toggleColor,
                '--toggle-knob': s.toggleKnobColor || d.toggleKnobColor
            };

            Object.entries(vars).forEach(([key, val]) => {
                if (val) root.style.setProperty(key, val);
            });

            const themeBg = s.background || d.background || { type: 'color', value: '#0a0a0a' };
            const customBg = s.customBackground;
            const isCustomActive = customBg && customBg.type !== 'none';

            if (themeBg.type === 'color') {
                root.style.setProperty('--bg', themeBg.value);
            }

            if (isCustomActive && customBg.url) {
                root.style.setProperty('--bg-image', `url(${customBg.url})`);

                let position = customBg.objectPosition;
                if (customBg.id && customBg.id !== 'custom') {
                    const preset = window.SITE_CONFIG?.backgroundPresets?.find(b => b.id === customBg.id);
                    if (preset?.objectPosition) position = preset.objectPosition;
                }

                root.style.setProperty('--bg-image-position', position || 'center');
            } else if (themeBg.type === 'image' || themeBg.type === 'video') {
                root.style.setProperty('--bg-image', `url(${themeBg.value || themeBg.url})`);
                root.style.setProperty('--bg-image-position', themeBg.objectPosition || 'center');
            } else if (themeBg.type === 'gradient') {
                root.style.setProperty('--bg-image', themeBg.value || themeBg.url);
                root.style.setProperty('--bg-image-position', 'center');
            } else {
                root.style.setProperty('--bg-image', 'none');
            }
        },

        onChange(callback) {
            window.addEventListener('settings-changed', (e) => callback(e.detail));
        },

        isRatingAllowed(rating) {
            if (!rating || rating === 'NR' || rating === 'NC-17') return false;
            const ratingOrder = ['G', 'PG', 'PG-13', 'R'];
            const maxIndex = ratingOrder.indexOf(_settings.maxMovieRating);
            const ratingIndex = ratingOrder.indexOf(rating);
            return maxIndex !== -1 && ratingIndex !== -1 && ratingIndex <= maxIndex;
        }
    };

    // panic button go brr
    const handlePanic = (e) => {
        const mods = _settings.panicModifiers || [];
        const key = _settings.panicKey || 'x';

        if (mods.includes('ctrl') !== e.ctrlKey) return;
        if (mods.includes('shift') !== e.shiftKey) return;
        if (mods.includes('alt') !== e.altKey) return;

        if (e.key.toLowerCase() === key.toLowerCase()) {
            e.preventDefault();
            const overlayId = 'panic-overlay';
            let overlay = window.parent?.document?.getElementById(overlayId) || document.getElementById(overlayId);

            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = overlayId;
                overlay.style.cssText = 'position:fixed;inset:0;background:white;z-index:99999;';
                document.body.appendChild(overlay);
            } else {
                overlay.style.display = 'block';
            }

            window.location.replace(_settings.panicUrl || 'https://classroom.google.com');
        }
    };

    const init = () => {
        Settings.apply();

        const featured = window.SITE_CONFIG?.featuredBackground;
        const activePreset = window.SITE_CONFIG?.backgroundPresets?.find(p => p.active);

        const target = activePreset || featured;

        if (target?.id && target.id !== _settings.lastSeenFeatured) {
            Settings.update({
                customBackground: target,
                lastSeenFeatured: target.id,
                backgroundRotation: false
            });
        }

        document.addEventListener('keydown', handlePanic, true);

        window.addEventListener('storage', (e) => {
            if (e.key === STORAGE_KEY) {
                _settings = load();
                Settings.apply();
                window.dispatchEvent(new CustomEvent('settings-changed', { detail: _settings }));
            }
        });

        window.addEventListener('message', (e) => {
            if (e.data?.type === 'settings-update' || e.data === 'updateCloak') {
                _settings = load();
                Settings.apply();
                window.dispatchEvent(new CustomEvent('settings-changed', { detail: _settings }));
            }
        });

        window.addEventListener('beforeunload', (e) => {
            if (document.getElementById('main-frame') && _settings.leaveConfirmation) {
                e.preventDefault();
                return e.returnValue = '';
            }
        });
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
