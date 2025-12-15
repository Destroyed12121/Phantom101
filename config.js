// ============================================
// SITE CONFIGURATION - PHANTOM UNBLOCKED
// ============================================

window.SITE_CONFIG = {
    name: "Phantom",
    fullName: "Phantom Unblocked",
    version: "1.0.3",

    // Changelog
    changelog: [
        "most things are fixxed, i cannot fix movies",
        "added first visit white screen + aboutblank auto cloaking",
        "JOIN THE DISCORD"
    ],

    // Discord
    discord: {
        inviteUrl: "https://discord.gg/tHWx9NXp5p",
        widgetServer: "1334648765679800442",
        widgetChannel: "1334648766292164731"
    },
    firstVisitCloak: true,

    // Default settings
    defaults: {
        cloakMode: "about:blank",
        tabTitle: "New tab",
        tabFavicon: "https://www.google.com/chrome/static/images/chrome-logo-m100.svg",
        cloakRotation: false,
        cloakInterval: 5000,
        panicKey: "Escape",
        panicModifiers: ["ctrl", "shift"],
        panicUrl: "https://classroom.google.com",
        maxMovieRating: "R",
        gameLibrary: "lib1",
        discordWidget: true,
        miniplayer: true,
        leaveConfirmation: false,
        autoAboutBlank: true,
        showChangelogOnUpdate: true,

        // Theme colors
        accentColor: "#ffffff",
        surfaceColor: "#0f0f0f",
        surfaceHoverColor: "#1a1a1a",
        surfaceActiveColor: "#252525",
        secondaryColor: "#2e2e33",
        borderColor: "#1f1f1f",
        borderLightColor: "#2a2a2a",
        textColor: "#e4e4e7",
        textSecondaryColor: "#71717a",
        textDimColor: "#52525b",
        background: { type: "color", value: "#0a0a0a" }
    },

    // Tab Cloaks
    cloakPresets: [
        { name: "Google", icon: "https://www.google.com/chrome/static/images/chrome-logo-m100.svg", title: "New Tab" },
        { name: "Edpuzzle", icon: "https://edpuzzle.imgix.net/favicons/favicon-32.png", title: "Edpuzzle" },
        { name: "Google Docs", icon: "https://ssl.gstatic.com/docs/documents/images/kix-favicon7.ico", title: "Untitled document - Google Docs" },
        { name: "Canvas", icon: "https://du11hjcvx0uqb.cloudfront.net/dist/images/favicon-e10d657a73.ico", title: "Dashboard" },
        { name: "Desmos", icon: "https://www.desmos.com/favicon.ico", title: "Desmos | Graphing Calculator" },
        { name: "Khan Academy", icon: "https://cdn.kastatic.org/images/favicon.ico", title: "Khan Academy" },
        { name: "Wikipedia", icon: "https://en.wikipedia.org/favicon.ico", title: "World War II - Wikipedia" },
        { name: "Classroom", icon: "https://ssl.gstatic.com/classroom/favicon.png", title: "Home" },
        { name: "Canva", icon: "https://static.canva.com/static/images/android-192x192-2.png", title: "Home - Canva" },
        { name: "Quiz", icon: "https://ssl.gstatic.com/docs/spreadsheets/forms/forms_icon_2023q4.ico", title: "You've already responded" },
        { name: "Blooket", icon: "https://play.blooket.com/favicon.ico", title: "Play Blooket | Blooket" },
        { name: "Gmail", icon: "https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico", title: "Gmail" },
        { name: "YouTube", icon: "https://www.youtube.com/favicon.ico", title: "YouTube" },
        { name: "Powerschool", icon: "https://waverlyk12.powerschool.com/favicon.ico", title: "Grades and Attendance" }
    ],

    // Wisp servers
    wispServers: [
        { name: "Primary", url: "wss://dash.goip.de/wisp/" },
        { name: "Backup 1", url: "wss://register.goip.it/wisp/" },
        { name: "Backup 2", url: "wss://wisp.rhw.one/wisp/" }
    ]
};

// ============================================
// THEME APPLICATION
// ============================================
// Apply user theme settings from localStorage, falling back to defaults
(function () {
    'use strict';

    const STORAGE_KEY = 'void_settings';

    const getThemeSettings = () => {
        const defaults = window.SITE_CONFIG?.defaults || {};
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                return {
                    accentColor: parsed.accentColor || defaults.accentColor,
                    surfaceColor: parsed.surfaceColor || defaults.surfaceColor,
                    surfaceHoverColor: parsed.surfaceHoverColor || defaults.surfaceHoverColor,
                    surfaceActiveColor: parsed.surfaceActiveColor || defaults.surfaceActiveColor,
                    secondaryColor: parsed.secondaryColor || defaults.secondaryColor,
                    borderColor: parsed.borderColor || defaults.borderColor,
                    borderLightColor: parsed.borderLightColor || defaults.borderLightColor,
                    textColor: parsed.textColor || defaults.textColor,
                    textSecondaryColor: parsed.textSecondaryColor || defaults.textSecondaryColor,
                    textDimColor: parsed.textDimColor || defaults.textDimColor,
                    background: parsed.background || defaults.background
                };
            }
        } catch (e) {
            console.warn('Failed to load theme settings:', e);
        }
        return {
            accentColor: defaults.accentColor,
            surfaceColor: defaults.surfaceColor,
            surfaceHoverColor: defaults.surfaceHoverColor,
            surfaceActiveColor: defaults.surfaceActiveColor,
            secondaryColor: defaults.secondaryColor,
            borderColor: defaults.borderColor,
            borderLightColor: defaults.borderLightColor,
            textColor: defaults.textColor,
            textSecondaryColor: defaults.textSecondaryColor,
            textDimColor: defaults.textDimColor,
            background: defaults.background
        };
    };

    const applyTheme = () => {
        const theme = getThemeSettings();
        const root = document.documentElement;

        // Reset to defaults first to clear old theme variables
        const defaults = window.SITE_CONFIG?.defaults || {};
        root.style.setProperty('--accent', defaults.accentColor || '#ffffff');
        root.style.setProperty('--surface', defaults.surfaceColor || '#0f0f0f');
        root.style.setProperty('--surface-hover', defaults.surfaceHoverColor || '#1a1a1a');
        root.style.setProperty('--surface-active', defaults.surfaceActiveColor || '#252525');
        root.style.setProperty('--secondary', defaults.secondaryColor || '#2e2e33');
        root.style.setProperty('--border', defaults.borderColor || '#1f1f1f');
        root.style.setProperty('--border-light', defaults.borderLightColor || '#2a2a2a');
        root.style.setProperty('--text', defaults.textColor || '#e4e4e7');
        root.style.setProperty('--text-muted', defaults.textSecondaryColor || '#71717a');
        root.style.setProperty('--text-dim', defaults.textDimColor || '#52525b');
        root.style.setProperty('--bg', defaults.background?.value || '#0a0a0a');
        root.style.setProperty('--bg-image', 'none');

        // Apply user theme overrides
        if (theme.accentColor) root.style.setProperty('--accent', theme.accentColor);
        if (theme.surfaceColor) root.style.setProperty('--surface', theme.surfaceColor);
        if (theme.surfaceHoverColor) root.style.setProperty('--surface-hover', theme.surfaceHoverColor);
        if (theme.surfaceActiveColor) root.style.setProperty('--surface-active', theme.surfaceActiveColor);
        if (theme.secondaryColor) root.style.setProperty('--secondary', theme.secondaryColor);
        if (theme.borderColor) root.style.setProperty('--border', theme.borderColor);
        if (theme.borderLightColor) root.style.setProperty('--border-light', theme.borderLightColor);
        if (theme.textColor) root.style.setProperty('--text', theme.textColor);
        if (theme.textSecondaryColor) root.style.setProperty('--text-muted', theme.textSecondaryColor);
        if (theme.textDimColor) root.style.setProperty('--text-dim', theme.textDimColor);

        // Apply background
        if (theme.background) {
            const bg = theme.background;
            if (bg.type === 'color') {
                root.style.setProperty('--bg', bg.value);
                root.style.setProperty('--bg-image', 'none');
            } else if (bg.type === 'gradient') {
                root.style.setProperty('--bg', 'transparent');
                root.style.setProperty('--bg-image', bg.value);
            } else if (bg.type === 'image' || bg.type === 'video') {
                root.style.setProperty('--bg-image', `url(${bg.value})`);
            }
        }
    };

    // Apply on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyTheme);
    } else {
        applyTheme();
    }

    // Listen for theme updates
    window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) {
            applyTheme();
        }
    });

    window.addEventListener('message', (e) => {
        if (e.data?.type === 'settings-update' || e.data === 'updateCloak') {
            applyTheme();
        }
    });
})();

// ============================================
// SETTINGS API
// ============================================
(function () {
    const STORAGE_KEY = 'void_settings';

    const getDefaults = () => {
        return window.SITE_CONFIG?.defaults || {};
    };

    const load = () => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                const settings = { ...getDefaults(), ...parsed };
                if (settings.autoAboutBlank) {
                    settings.cloakMode = "about:blank";
                }
                return settings;
            }
        } catch (e) {
            console.warn('Failed to load settings:', e);
        }
        const defaults = getDefaults();
        if (defaults.autoAboutBlank) {
            defaults.cloakMode = "about:blank";
        }
        return defaults;
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
        set(key, value) {
            _settings[key] = value;
            if (key === 'autoAboutBlank' && value) {
                _settings.cloakMode = 'about:blank';
            }
            save(_settings);
            return value;
        },
        getAll() { return { ..._settings }; },
        update(partial) {
            _settings = { ..._settings, ...partial };
            save(_settings);
        },
        reset() {
            _settings = getDefaults();
            save(_settings);
        },
        onChange(callback) {
            window.addEventListener('settings-changed', (e) => callback(e.detail));
        },
        isRatingAllowed(rating) {
            if (!rating || rating === 'NR' || rating === 'NC-17') return false;
            const ratingOrder = ['G', 'PG', 'PG-13', 'R'];
            const maxIndex = ratingOrder.indexOf(_settings.maxMovieRating);
            const ratingIndex = ratingOrder.indexOf(rating);
            if (maxIndex === -1 || ratingIndex === -1) return false;
            return ratingIndex <= maxIndex;
        }
    };

    // Panic Key Handler
    document.addEventListener('keydown', (e) => {
        const mods = _settings.panicModifiers || [];
        const key = _settings.panicKey || 'Escape';
        const ctrl = mods.includes('ctrl') === e.ctrlKey;
        const shift = mods.includes('shift') === e.shiftKey;
        const alt = mods.includes('alt') === e.altKey;
        if (ctrl && shift && alt && e.key.toLowerCase() === key.toLowerCase()) {
            e.preventDefault();
            const url = _settings.panicUrl || 'https://classroom.google.com';
            try {
                window.location.replace(url);
            } catch (err) {
                window.location.href = url;
            }
        }
    });


    // Listen for storage changes
    window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) {
            const newSettings = load();
            _settings = newSettings;
            window.dispatchEvent(new CustomEvent('settings-changed', { detail: newSettings }));
        }
    });

    // Listen for postMessage
    window.addEventListener('message', (e) => {
        if (e.data?.type === 'settings-update' || e.data === 'updateCloak') {
            const newSettings = load();
            _settings = newSettings;
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
})();
