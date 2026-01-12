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
        const presets = [...(window.SITE_CONFIG?.cloakPresets || [])];
        const custom = window.Settings?.get('customCloaks') || [];
        return [...presets, ...custom];
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
        if (!url) return;

        const updateLink = (doc, href) => {
            // Force browser to refresh favicon by re-creating it OR updating existing one
            const links = doc.querySelectorAll('link[rel*="icon"]');

            // Remove all existing icons to ensure the browser strictly notices the change
            links.forEach(l => l.remove());

            // Create new standard icon
            const newLink = doc.createElement('link');
            newLink.rel = 'icon';
            newLink.href = href;
            doc.head.appendChild(newLink);

            // Create shortcut icon for older/stricter browsers
            const shortcutLink = doc.createElement('link');
            shortcutLink.rel = 'shortcut icon';
            shortcutLink.href = href;
            doc.head.appendChild(shortcutLink);

            // Experimental trick: toggle visibility of one link or re-append to force refresh
            setTimeout(() => {
                if (newLink) {
                    newLink.href = href;
                }
            }, 10);

            newLink.onerror = () => {
                if (href.includes('favicon.svg')) {
                    newLink.href = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIyLjUgMTMuNUMyMi41IDE4LjQ3NCAxOC40NzQgMjIuNSAxMy41IDIyLjVDOC41MjYgMjIuNS40NSAxOC40NzQuNDUgMTMuNUMuNDUgOC41MjYgOC41MjYuNDUgMTMuNS40NUMxOC40NzQuNDUgMjIuNS44NTI2IDIyLjUgMTMuNVoiIGZpbGw9IiM2MzY2RjEiLz4KPHBhdGggZD0iTTEzLjUgMTYuNUMxNS4xMDQgMTYuNSAxNi41IDE1LjEwNCAxNi41IDEzLjVDMTYuNSAxMS44OTYgMTUuMTA0IDEwLjUgMTMuNSAxMC41QzExLjg5NiAxMC41IDEwLjUgMTEuODk2IDEwLjUgMTMuNUMxMC41IDE1LjEwNCAxMS44OTYgMTYuNSAxMy41IDE2LjVaIiBmaWxsPSIjZmZmZmZmIi8+Cjwvc3ZnPgo=';
                }
            };
        };

        updateLink(document, url);
        try {
            if (window.top !== window.self) {
                updateLink(window.top.document, url);
            }
        } catch (e) {
            console.debug('Failed to update top favicon:', e);
        }
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
            applyCloak(preset.title, preset.icon || preset.favicon);
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

    // First Visit Cloak
    const initFirstVisitCloak = () => {
        const STORAGE_KEY = 'phantom_fv';
        const overlay = document.getElementById('fv-cloak');
        const iframe = document.getElementById('main-frame');
        const urlParams = new URLSearchParams(window.location.search);
        const isFakeMode = urlParams.has('fake');
        const cloakEnabled = window.SITE_CONFIG?.firstVisitCloak !== false;
        const hasBypassed = localStorage.getItem(STORAGE_KEY);
        const isCloaked = cloakEnabled && !hasBypassed && !isFakeMode;

        if (isFakeMode) {
            // Show launch screen
            const launchScreen = document.getElementById('launch-screen');
            launchScreen.classList.remove('hidden');
            document.getElementById('loading-screen').classList.add('hidden');
            document.getElementById('launch-button').addEventListener('click', () => {
                launchScreen.classList.add('hidden');
                // Load settings
                let settings = {};
                try { settings = JSON.parse(localStorage.getItem('void_settings') || '{}'); } catch { }
                const cloakMode = settings.cloakMode || 'none';
                const realUrl = window.location.href.replace(/\?fake/, '');
                const doRedirect = () => {
                    const targets = ['https://www.youtube.com', 'https://edpuzzle.com'];
                    const randomTarget = targets[Math.floor(Math.random() * targets.length)];
                    window.location.replace(randomTarget);
                };
                if (cloakMode === 'blob') {
                    fetch(realUrl).then(r => r.text()).then(html => {
                        const blob = new Blob([html], { type: 'text/html' });
                        const win = window.open(URL.createObjectURL(blob), '_blank');
                        if (win) {
                            doRedirect();
                        } else {
                            iframe.src = 'index2.html';
                        }
                    }).catch(() => {
                        iframe.src = 'index2.html';
                    });
                } else if (cloakMode === 'about:blank') {
                    const title = settings.tabTitle || window.SITE_CONFIG?.defaults?.tabTitle || 'Google';
                    const icon = settings.tabFavicon || window.SITE_CONFIG?.defaults?.tabFavicon || 'https://www.google.com/favicon.ico';

                    const win = window.open('about:blank', '_blank');
                    if (win) {
                        win.document.open();
                        win.document.write(`<!DOCTYPE html>
<html>
<head>
    <title>${title}</title>
    <link rel="icon" href="${icon}">
</head>
<body style="margin:0;padding:0;overflow:hidden;">
    <iframe src="${realUrl}" style="position:fixed;inset:0;width:100%;height:100%;border:none;"></iframe>
</body>
</html>`);
                        win.document.close();
                        doRedirect();
                    } else {
                        iframe.src = 'index2.html';
                    }
                } else {
                    const win = window.open(realUrl, '_blank');
                    if (win) {
                        doRedirect();
                    } else {
                        iframe.src = 'index2.html';
                    }
                }
            });
        } else if (isCloaked) {
            // Show cloak immediately
            overlay.style.display = 'block';

            // Hide loading screen
            const ls = document.getElementById('loading-screen');
            if (ls) ls.style.display = 'none';

            // Set title to hostname to mimic URL
            const originalTitle = document.title;
            document.title = window.location.hostname;

            // Remove favicon
            const iconLinks = document.querySelectorAll("link[rel*='icon']");
            iconLinks.forEach(l => l.remove());

            const onKey = function (e) {
                if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.altKey && !e.metaKey) {
                    e.preventDefault();

                    // Uncloak persistently
                    localStorage.setItem(STORAGE_KEY, '1');
                    document.removeEventListener('keydown', onKey);

                    // Reveal logic
                    let settings = {};
                    try { settings = JSON.parse(localStorage.getItem('void_settings') || '{}'); } catch { }
                    const cloakMode = settings.cloakMode || 'none';

                    if (cloakMode === 'about:blank' || cloakMode === 'blob') {
                        // Use the built-in cloaking API to open in a new tab and redirect this one
                        if (cloakMode === 'about:blank') window.Cloaking.openInBlank(window.location.href.split('?')[0]);
                        else window.Cloaking.openInBlob(window.location.href.split('?')[0]);
                    } else {
                        // Just reveal on current tab
                        overlay.style.display = 'none';
                        document.title = originalTitle;

                        // Restore favicon
                        const newLink = document.createElement('link');
                        newLink.rel = 'icon';
                        newLink.href = 'favicon.svg';
                        document.head.appendChild(newLink);

                        // Load app
                        iframe.src = 'index2.html';
                    }
                }
            };
            document.addEventListener('keydown', onKey);
        } else {
            // No cloak needed, load immediately
            if (iframe && !iframe.src) {
                iframe.src = 'index2.html';
            }
        }
    };

    // Startup cloak mode
    const initStartupCloak = () => {
        const STORAGE_KEY = 'phantom_fv';
        if (window.SITE_CONFIG?.firstVisitCloak !== false && !localStorage.getItem(STORAGE_KEY)) return;

        let settings = {};
        try { settings = JSON.parse(localStorage.getItem('void_settings') || '{}'); } catch { }
        const cloakMode = settings.cloakMode || 'none';
        const urlParams = new URLSearchParams(window.location.search);
        const isFakeMode = urlParams.has('fake');
        if (isFakeMode) return; // Already handled
        if (window.top === window.self && cloakMode !== 'none') {
            const currentUrl = window.location.href;
            const doRedirect = () => {
                const targets = ['https://www.youtube.com', 'https://edpuzzle.com'];
                const randomTarget = targets[Math.floor(Math.random() * targets.length)];
                window.location.replace(randomTarget);
            };
            let popupOpened = false;
            if (cloakMode === 'blob') {
                fetch(currentUrl).then(r => r.text()).then(html => {
                    const blob = new Blob([html], { type: 'text/html' });
                    const win = window.open(URL.createObjectURL(blob), '_blank');
                    if (win) {
                        popupOpened = true;
                        doRedirect();
                    } else {
                        showLaunchScreen();
                    }
                }).catch(() => {
                    showLaunchScreen();
                });
            } else if (cloakMode === 'about:blank') {
                // Get cloak values with fallbacks BEFORE opening window
                const title = settings.tabTitle || window.SITE_CONFIG?.defaults?.tabTitle || 'Google';
                const icon = settings.tabFavicon || window.SITE_CONFIG?.defaults?.tabFavicon || 'https://www.google.com/favicon.ico';

                const win = window.open('about:blank', '_blank');
                if (win) {
                    popupOpened = true;
                    // Write complete HTML including title and favicon in one go
                    win.document.open();
                    win.document.write(`<!DOCTYPE html>
<html>
<head>
    <title>${title}</title>
    <link rel="icon" href="${icon}">
</head>
<body style="margin:0;padding:0;overflow:hidden;">
    <iframe src="${currentUrl}" style="position:fixed;inset:0;width:100%;height:100%;border:none;"></iframe>
</body>
</html>`);
                    win.document.close();

                    doRedirect();
                } else {
                    showLaunchScreen();
                }
            }
            // If popup was opened, check if it closed
            if (popupOpened) {
                setTimeout(() => {
                    if (win && win.closed) {
                        showLaunchScreen();
                    }
                }, 1000);
            }
        }
    };

    const showLaunchScreen = () => {
        const launchScreen = document.getElementById('launch-screen');
        if (!launchScreen) return;

        launchScreen.classList.remove('hidden');
        document.getElementById('launch-button').onclick = () => {
            launchScreen.classList.add('hidden');

            // Try to open cloaked instance
            const win = window.Cloaking.openCloaked(window.location.href);

            // If popup failed, stay on current tab and load content
            if (!win) {
                console.warn("Popup blocked, falling back to current tab");
                const frame = document.getElementById('main-frame');
                if (frame) frame.src = 'index2.html';

                // Reset title and icon just in case they were partially changed
                document.title = 'Phantom Unblocked';
                const link = document.createElement('link');
                link.rel = 'icon';
                link.href = 'favicon.svg';
                document.head.appendChild(link);
            }
        };
    };

    // Key listener for panic (hiding) - Fast white screen redirect
    document.addEventListener('keydown', (e) => {
        if (!panicShortcut) return;

        // Ignore if user is typing in an input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;

        if (matchesShortcut(e, panicShortcut)) {
            e.preventDefault();

            // Show white screen instantly (if panic-overlay exists)
            const overlay = document.getElementById('panic-overlay');
            if (overlay) overlay.style.display = 'block';

            // Redirect immediately
            panic();
        }
    }, true); // Use capture phase for faster response

    // Key listener for spawning cloaked instance (c key)
    document.addEventListener('keydown', (e) => {
        // Ignore if user is typing in an input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;

        // Ignore if first visit cloak is active
        const STORAGE_KEY = 'phantom_fv';
        if (window.SITE_CONFIG?.firstVisitCloak !== false && !localStorage.getItem(STORAGE_KEY)) return;

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

    let initialized = false;

    // Initialize cloaking system
    const init = () => {
        if (!initialized) {
            initFirstVisitCloak();
            initStartupCloak();
            initialized = true;
        }

        setupPanicKey();

        // Check for first visit cloak
        const fvKey = 'phantom_fv';
        if (window.SITE_CONFIG?.firstVisitCloak && !localStorage.getItem(fvKey)) {
            return; // Already handled
        }

        // Apply initial cloak
        const title = window.Settings?.get('tabTitle') || window.SITE_CONFIG?.defaults?.tabTitle || 'Google';
        const favicon = window.Settings?.get('tabFavicon') || window.SITE_CONFIG?.defaults?.tabFavicon || 'https://www.google.com/favicon.ico';
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
            if (win && !win.closed) {
                // Determine title/icon to use for the new window (with proper fallbacks)
                const title = window.Settings?.get('tabTitle') || window.SITE_CONFIG?.defaults?.tabTitle || 'Google';
                const icon = window.Settings?.get('tabFavicon') || window.SITE_CONFIG?.defaults?.tabFavicon || 'https://www.google.com/favicon.ico';

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

                // Handle redirect of original tab ONLY if win was successful
                const redirect = window.Settings?.get('redirectTarget');
                if (redirect === 'youtube') window.location.replace('https://www.youtube.com');
                else if (redirect === 'edpuzzle') window.location.replace('https://edpuzzle.com');
                else {
                    const targets = ['https://www.youtube.com', 'https://edpuzzle.com'];
                    const randomTarget = targets[Math.floor(Math.random() * targets.length)];
                    window.location.replace(randomTarget);
                }
            }

            return win;
        },

        // Open page in blob URL
        openInBlob(url) {
            const title = window.Settings?.get('tabTitle') || window.SITE_CONFIG?.defaults?.tabTitle || 'Google';
            const icon = window.Settings?.get('tabFavicon') || window.SITE_CONFIG?.defaults?.tabFavicon || 'https://www.google.com/favicon.ico';

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
            const win = window.open(blobUrl, '_blank');

            if (win && !win.closed) {
                // Handle redirect of original tab ONLY if win was successful
                const redirect = window.Settings?.get('redirectTarget');
                if (redirect === 'youtube') window.location.replace('https://www.youtube.com');
                else if (redirect === 'edpuzzle') window.location.replace('https://edpuzzle.com');
                else {
                    const targets = ['https://www.youtube.com', 'https://edpuzzle.com'];
                    const randomTarget = targets[Math.floor(Math.random() * targets.length)];
                    window.location.replace(randomTarget);
                }
            }

            return win;
        },

        // Smart open - uses current cloak mode setting
        openCloaked(url) {
            const mode = window.Settings?.get('cloakMode') || 'none';

            if (mode === 'about:blank') {
                return this.openInBlank(url);
            } else if (mode === 'blob') {
                return this.openInBlob(url);
            } else {
                return window.open(url, '_blank');
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
