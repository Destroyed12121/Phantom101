// ============================================
// TAB CLOAKING SYSTEM
// ============================================
// Handles tab title/favicon disguise, rotation,
// and panic key functionality.
// ============================================

(function () {
    'use strict';

    let rotationInterval = null;
    let currentPresetIndex = 0;

    // Get cloak presets from config
    const getPresets = () => {
        return window.SITE_CONFIG?.cloakPresets || [
            { name: 'Google', title: 'Google', favicon: 'https://www.google.com/favicon.ico' }
        ];
    };

    // Original page state (to restore if needed)
    const originalState = {
        title: document.title,
        favicon: document.querySelector('link[rel="icon"]')?.href
    };

    // Set tab title
    const setTitle = (title) => {
        document.title = title;
        try {
            if (window.top !== window.self) {
                window.top.document.title = title;
            }
        } catch (e) { }
    };

    // Set favicon
    const setFavicon = (url) => {
        const updateLink = (doc, href) => {
            let link = doc.querySelector('link[rel="icon"]');
            if (!link) {
                link = doc.createElement('link');
                link.rel = 'icon';
                doc.head.appendChild(link);
            }
            link.href = href;
        };

        updateLink(document, url);
        try {
            if (window.top !== window.self) {
                updateLink(window.top.document, url);
            }
        } catch (e) { }
    };

    // Apply cloak
    const applyCloak = (title, favicon) => {
        if (title) setTitle(title);
        if (favicon) setFavicon(favicon);
    };

    // Start rotation
    const startRotation = (interval) => {
        stopRotation();
        const presets = getPresets();
        if (presets.length === 0) return;

        rotationInterval = setInterval(() => {
            currentPresetIndex = (currentPresetIndex + 1) % presets.length;
            const preset = presets[currentPresetIndex];
            applyCloak(preset.title, preset.favicon);
        }, interval);
    };

    // Stop rotation
    const stopRotation = () => {
        if (rotationInterval) {
            clearInterval(rotationInterval);
            rotationInterval = null;
        }
    };

    // Restore original
    const restore = () => {
        stopRotation();
        setTitle(originalState.title);
        if (originalState.favicon) {
            setFavicon(originalState.favicon);
        }
    };

    // Panic - redirect to safe URL
    const panic = () => {
        const safeUrl = window.Settings?.get('panicUrl') ||
            window.SITE_CONFIG?.defaults?.panicUrl ||
            'https://classroom.google.com';
        window.location.replace(safeUrl);
    };

    // Parse keyboard shortcut
    const parseShortcut = (key, modifiers = []) => {
        return {
            key: key.toLowerCase(),
            ctrl: modifiers.includes('ctrl'),
            shift: modifiers.includes('shift'),
            alt: modifiers.includes('alt'),
            meta: modifiers.includes('meta')
        };
    };

    // Check if event matches shortcut
    const matchesShortcut = (event, shortcut) => {
        const eventKey = event.key.toLowerCase();

        // Handle special keys
        let keyMatch = false;
        if (shortcut.key === 'escape') keyMatch = event.key === 'Escape';
        else if (shortcut.key === '`') keyMatch = event.key === '`' || event.key === '~';
        else keyMatch = eventKey === shortcut.key;

        return keyMatch &&
            event.ctrlKey === shortcut.ctrl &&
            event.shiftKey === shortcut.shift &&
            event.altKey === shortcut.alt &&
            event.metaKey === shortcut.meta;
    };

    // Listen for panic key
    let panicShortcut = null;

    const setupPanicKey = () => {
        const key = window.Settings?.get('panicKey') ||
            window.SITE_CONFIG?.defaults?.panicKey || 'Escape';
        const modifiers = window.Settings?.get('panicModifiers') ||
            window.SITE_CONFIG?.defaults?.panicModifiers || ['ctrl', 'shift'];

        panicShortcut = parseShortcut(key, modifiers);
    };

    // Key listener for panic (hiding)
    document.addEventListener('keydown', (e) => {
        if (!panicShortcut) return;

        if (matchesShortcut(e, panicShortcut)) {
            e.preventDefault();
            panic();
        }
    });

    // Key listener for spawning cloaked instance (c key)
    document.addEventListener('keydown', (e) => {
        // Ignore if user is typing in an input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;

        if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.altKey && !e.metaKey) {
            const mode = window.Settings?.get('cloakMode');
            if (mode === 'about:blank') {
                e.preventDefault();
                window.Cloaking.openInBlank(window.location.href);
            } else if (mode === 'blob') {
                e.preventDefault();
                window.Cloaking.openInBlob(window.location.href);
            }
        }
    });

    // Initialize cloaking system
    const init = () => {
        setupPanicKey();

        // Check for first visit cloak
        const fvKey = 'phantom_fv';
        if (window.SITE_CONFIG?.firstVisitCloak && !localStorage.getItem(fvKey)) {
            return;
        }

        // Always apply cloak regardless of mode (visuals vs behavior)
        // const mode = window.Settings?.get('cloakMode') || 'none';
        // if (mode === 'none') { restore(); return; }

        // Apply initial cloak
        const title = window.Settings?.get('tabTitle') || 'Google';
        const favicon = window.Settings?.get('tabFavicon') || 'https://www.google.com/favicon.ico';
        applyCloak(title, favicon);

        // Start rotation if enabled
        const rotationEnabled = window.Settings?.get('rotateCloaks');
        if (rotationEnabled) {
            const interval = (window.Settings?.get('rotateInterval') || 5) * 1000;
            startRotation(interval);
        } else {
            stopRotation();
        }
    };

    // Cloaking API
    window.Cloaking = {
        init,
        applyCloak,
        startRotation,
        stopRotation,
        restore,
        panic,
        setTitle,
        setFavicon,

        // Open page in about:blank (for cloak mode)
        openInBlank(url) {
            const win = window.open('about:blank', '_blank');
            if (win) {
                // Determine title/icon to use for the new window
                const title = window.Settings?.get('tabTitle') || 'Google';
                const icon = window.Settings?.get('tabFavicon') || 'https://www.google.com/favicon.ico';

                win.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>${title}</title>
                        <link rel="icon" href="${icon}">
                        <style>
                            * { margin: 0; padding: 0; }
                            body, html { width: 100%; height: 100%; overflow: hidden; }
                            iframe { width: 100%; height: 100%; border: none; }
                        </style>
                    </head>
                    <body>
                        <iframe src="${url}"></iframe>
                    </body>
                    </html>
                `);
                win.document.close();
            }

            // Handle redirect of original tab
            const redirect = window.Settings?.get('redirectTarget');
            if (redirect === 'youtube') window.location.replace('https://www.youtube.com');
            else if (redirect === 'edpuzzle') window.location.replace('https://edpuzzle.com');
            else {
                const targets = ['https://www.youtube.com', 'https://edpuzzle.com'];
                const randomTarget = targets[Math.floor(Math.random() * targets.length)];
                window.location.replace(randomTarget);
            }

            return win;
        },

        // Open page in blob URL
        openInBlob(url) {
            const title = window.Settings?.get('tabTitle') || 'Google';
            const icon = window.Settings?.get('tabFavicon') || 'https://www.google.com/favicon.ico';

            const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>${title}</title>
                    <link rel="icon" href="${icon}">
                    <style>
                        * { margin: 0; padding: 0; }
                        body, html { width: 100%; height: 100%; overflow: hidden; }
                        iframe { width: 100%; height: 100%; border: none; }
                    </style>
                </head>
                <body>
                    <iframe src="${url}"></iframe>
                </body>
                </html>
            `;
            const blob = new Blob([html], { type: 'text/html' });
            const blobUrl = URL.createObjectURL(blob);
            window.open(blobUrl, '_blank');

            // Handle redirect of original tab
            const redirect = window.Settings?.get('redirectTarget');
            if (redirect === 'youtube') window.location.replace('https://www.youtube.com');
            else if (redirect === 'edpuzzle') window.location.replace('https://edpuzzle.com');
            else {
                const targets = ['https://www.youtube.com', 'https://edpuzzle.com'];
                const randomTarget = targets[Math.floor(Math.random() * targets.length)];
                window.location.replace(randomTarget);
            }
        },

        // Smart open - uses current cloak mode setting
        openCloaked(url) {
            const mode = window.Settings?.get('cloakMode') || 'none';

            if (mode === 'about:blank') {
                this.openInBlank(url);
            } else if (mode === 'blob') {
                this.openInBlob(url);
            } else {
                window.open(url, '_blank');
            }
        }
    };

    // Listen for settings changes
    if (window.Settings) {
        window.Settings.onChange((settings) => {
            init();
        });
    }

    // Initialize when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // Wait for settings to be available
        setTimeout(init, 100);
    }
})();
