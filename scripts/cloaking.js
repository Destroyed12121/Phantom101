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
            link.onerror = () => {
                if (href.includes('favicon.svg')) {
                    link.href = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIyLjUgMTMuNUMyMi41IDE4LjQ3NCAxOC40NzQgMjIuNSAxMy41IDIyLjVDOC41MjYgMjIuNS40NSAxOC40NzQuNDUgMTMuNUMuNDUgOC41MjYgOC41MjYuNDUgMTMuNS40NUMxOC40NzQuNDUgMjIuNS44NTI2IDIyLjUgMTMuNVoiIGZpbGw9IiM2MzY2RjEiLz4KPHBhdGggZD0iTTEzLjUgMTYuNUMxNS4xMDQgMTYuNSAxNi41IDE1LjEwNCAxNi41IDEzLjVDMTYuNSAxMS44OTYgMTUuMTA0IDEwLjUgMTMuNSAxMC41QzExLjg5NiAxMC41IDEwLjUgMTEuODk2IDEwLjUgMTMuNUMxMC41IDE1LjEwNCAxMS44OTYgMTYuNSAxMy41IDE2LjVaIiBmaWxsPSIjZmZmZmZmIi8+Cjwvc3ZnPgo=';
                }
            };
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

    // First Visit Cloak
    const initFirstVisitCloak = () => {
        const STORAGE_KEY = 'phantom_fv';
        const overlay = document.getElementById('fv-cloak');
        const iframe = document.getElementById('main-frame');
        const urlParams = new URLSearchParams(window.location.search);
        const isFakeMode = urlParams.has('fake');
        const cloakEnabled = window.SITE_CONFIG?.firstVisitCloak !== false;
        const isCloaked = cloakEnabled && !localStorage.getItem(STORAGE_KEY) && !isFakeMode;

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
                let popupOpened = false;
                if (cloakMode === 'blob') {
                    fetch(realUrl).then(r => r.text()).then(html => {
                        const blob = new Blob([html], { type: 'text/html' });
                        const win = window.open(URL.createObjectURL(blob), '_blank');
                        if (win) {
                            popupOpened = true;
                            doRedirect();
                        } else {
                            iframe.src = 'index2.html';
                        }
                    }).catch(() => {
                        iframe.src = 'index2.html';
                    });
                } else if (cloakMode === 'about:blank') {
                    const win = window.open('about:blank', '_blank');
                    if (win) {
                        popupOpened = true;
                        win.document.open();
                        win.document.write('<iframe src="' + realUrl + '" style="position:fixed;inset:0;width:100%;height:100%;border:none;"></iframe>');
                        win.document.close();
                        // Copy disguised title/icon to new window
                        if (settings.tabTitle) win.document.title = settings.tabTitle;
                        if (settings.tabFavicon) {
                            const link = win.document.createElement('link');
                            link.rel = 'icon';
                            link.href = settings.tabFavicon;
                            win.document.head.appendChild(link);
                        }
                        doRedirect();
                    } else {
                        iframe.src = 'index2.html';
                    }
                } else {
                    // No cloak, open directly
                    const win = window.open(realUrl, '_blank');
                    if (win) {
                        popupOpened = true;
                        doRedirect();
                    } else {
                        iframe.src = 'index2.html';
                    }
                }
                // If popup was opened, check if it closed
                if (popupOpened) {
                    setTimeout(() => {
                        if (win && win.closed) {
                            // Show launch screen again or something
                        }
                    }, 1000);
                }
            });
        } else if (isCloaked) {
            // Show white screen
            overlay.style.display = 'block';
            // Remove title tag to show URL/filename
            var titleTag = document.querySelector('title');
            if (titleTag) titleTag.remove();
            // Remove favicon tags to show default icon
            var iconLinks = document.querySelectorAll("link[rel*='icon']");
            iconLinks.forEach(l => l.remove());
            var link = document.createElement('link');
            link.rel = 'icon';
            link.href = 'data:image/x-icon;base64,'; // Empty
            document.getElementsByTagName('head')[0].appendChild(link);
            var onKey = function (e) {
                if (e.key.toLowerCase() === 'c') {
                    // Uncloak
                    overlay.style.display = 'none';
                    localStorage.setItem(STORAGE_KEY, '1');
                    document.removeEventListener('keydown', onKey);
                    // Restore title
                    var newTitle = document.createElement('title');
                    newTitle.innerText = 'Phantom Unblocked';
                    document.head.appendChild(newTitle);
                    // Restore favicon
                    var newLink = document.createElement('link');
                    newLink.rel = 'icon';
                    newLink.href = 'favicon.svg';
                    newLink.type = 'image/svg+xml';
                    document.head.appendChild(newLink);
                    // Load the app content NOW
                    iframe.src = 'index2.html';
                    // Analytics
                    window.dataLayer = window.dataLayer || [];
                    window.dataLayer.push({ event: 'cloak_bypass_pressed' });
                    if (typeof gtag === 'function') {
                        gtag('event', 'cloak_bypass', {
                            'event_category': 'engagement',
                            'event_label': 'first_visit_cloak'
                        });
                    }
                }
            };
            document.addEventListener('keydown', onKey);
        } else {
            // No cloak needed, load immediately if not already loaded
            if (iframe && !iframe.src) {
                iframe.src = 'index2.html';
            }
        }
    };

    // Startup cloak mode
    const initStartupCloak = () => {
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
                const win = window.open('about:blank', '_blank');
                if (win) {
                    popupOpened = true;
                    win.document.open();
                    win.document.write('<iframe src="' + currentUrl + '" style="position:fixed;inset:0;width:100%;height:100%;border:none;"></iframe>');
                    win.document.close();
                    // Copy disguised title/icon to new window
                    if (settings.tabTitle) win.document.title = settings.tabTitle;
                    if (settings.tabFavicon) {
                        const link = win.document.createElement('link');
                        link.rel = 'icon';
                        link.href = settings.tabFavicon;
                        win.document.head.appendChild(link);
                    }
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
        launchScreen.classList.remove('hidden');
        document.getElementById('launch-button').addEventListener('click', () => {
            launchScreen.classList.add('hidden');
            // Load the app content
            document.getElementById('main-frame').src = 'index2.html';
        });
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
