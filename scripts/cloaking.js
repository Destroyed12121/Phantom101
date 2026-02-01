// stealth mode
(function () {
    'use strict';

    let rotationInterval = null;
    let currentPresetIndex = 0;
    const original = { title: document.title, favicon: document.querySelector('link[rel="icon"]')?.href };

    const getPresets = () => [...(window.SITE_CONFIG?.cloakPresets || []), ...(window.Settings?.get('customCloaks') || [])];

    const setTitle = (title) => {
        if (!title) return;
        document.title = title;
        try { if (window.top !== window.self) window.top.document.title = title; } catch { }
    };

    const setFavicon = (href) => {
        if (!href) return;
        [document, window.top?.document].filter(d => { try { return d; } catch { return false; } }).forEach(doc => {
            doc.querySelectorAll('link[rel*="icon"]').forEach(l => l.remove());
            const link = doc.createElement('link');
            link.rel = 'icon';
            link.href = href;
            doc.head.appendChild(link);
        });
    };

    const apply = (p) => {
        if (p) {
            setTitle(p.title);
            setFavicon(p.icon || p.favicon);
        } else {
            const s = window.Settings?.getAll() || {};
            setTitle(s.tabTitle || window.SITE_CONFIG?.defaults?.tabTitle);
            setFavicon(s.tabFavicon || window.SITE_CONFIG?.defaults?.tabFavicon);
        }
    };

    const startRotation = (ms) => {
        stopRotation();
        const presets = getPresets();
        if (presets.length < 2) return apply(presets[0]);
        rotationInterval = setInterval(() => {
            currentPresetIndex = (currentPresetIndex + 1) % presets.length;
            apply(presets[currentPresetIndex]);
        }, ms);
    };

    const stopRotation = () => { if (rotationInterval) { clearInterval(rotationInterval); rotationInterval = null; } };

    const redirectOriginal = () => {
        const targets = ["https://classroom.google.com", "https://drive.google.com", "https://google.com", "https://kahoot.it", "https://edpuzzle.com"];
        window.location.replace(targets[Math.floor(Math.random() * targets.length)]);
    };

    const getPopupContent = (url) => {
        const s = window.Settings?.getAll() || {};
        const title = s.tabTitle || window.SITE_CONFIG?.defaults?.tabTitle || 'Google';
        const icon = s.tabFavicon || window.SITE_CONFIG?.defaults?.tabFavicon || 'https://www.google.com/favicon.ico';
        return `<!DOCTYPE html><html><head><title>${title}</title><link rel="icon" href="${icon}"><style>* {margin:0;padding:0;height:100%;overflow:hidden;} iframe{width:100%;height:100%;border:none;}</style></head><body><iframe src="${url}"></iframe></body></html>`;
    };

    // Try to open popup and monitor if it survives for 500ms
    // Returns: { success: true } if popup works and stays open
    // Returns: { success: false, reason: 'blocked' } if window.open returned null
    // Returns: { success: false, reason: 'killed' } if popup was closed by extension (like Securly)
    const tryPopup = (url) => {
        return new Promise((resolve) => {
            const win = window.open('about:blank', '_blank');

            // Popup completely blocked by browser
            if (!win) {
                resolve({ success: false, reason: 'blocked' });
                return;
            }

            // Write the actual content to popup
            try {
                win.document.write(getPopupContent(url));
                win.document.close();
            } catch (e) {
                try { win.close(); } catch { }
                resolve({ success: false, reason: 'killed' });
                return;
            }

            // Use a single timeout to avoid background throttling (which causes a 5s delay).
            // When the original tab loses focus, browsers throttle timers to ~1s minimum.
            // If the timer runs, we check once and redirect immediately.
            const timeoutMs = 200;

            setTimeout(() => {
                if (win.closed) {
                    resolve({ success: false, reason: 'killed' });
                } else {
                    resolve({ success: true });
                    redirectOriginal(); // Instant redirect
                }
            }, timeoutMs);
        });
    };

    // Load content in-tab (fallback)
    const loadInTab = () => {
        const iframe = document.getElementById('main-frame');
        if (iframe && !iframe.src) iframe.src = 'index2.html';
        apply();
    };

    // Show launch screen with callback for when button is clicked
    const showLaunchScreen = (onLaunch) => {
        const ls = document.getElementById('launch-screen');
        if (ls) {
            ls.classList.remove('hidden');
            document.getElementById('launch-button').onclick = onLaunch;
        }
    };

    // Attempt popup with fallback:
    // 1. Try real popup -> if works (survives 500ms), redirect original tab
    // 2. If blocked (null) -> show click-to-launch (user gesture might help)
    // 3. If killed (closed by Securly) -> load in-tab directly
    // 4. If click-to-launch popup also fails -> load in-tab
    const attemptCloakedLaunch = async (url, hideOverlay = null) => {
        const result = await tryPopup(url);

        if (result.success) {
            // Popup worked and is still open! redirectOriginal() was already called
            return true;
        }

        if (result.reason === 'blocked') {
            // Popup was blocked (window.open returned null)
            // Show click-to-launch - user gesture might bypass popup blocker
            if (hideOverlay) hideOverlay();

            showLaunchScreen(async () => {
                document.getElementById('launch-screen').classList.add('hidden');

                // Try popup again with user gesture
                const retryResult = await tryPopup(url);
                if (!retryResult.success) {
                    // Even with user click, popup failed - load in-tab
                    loadInTab();
                }
                // If success, redirectOriginal() was called inside tryPopup
            });
            return true; // Handled (showing launch screen)
        }

        // reason === 'killed' - Securly/extension killed the popup, go straight to in-tab
        if (hideOverlay) hideOverlay();
        loadInTab();
        return false;
    };

    const init = async () => {
        const s = window.Settings?.getAll() || {};
        const fvKey = 'phantom_fv';
        const urlParams = new URLSearchParams(window.location.search);

        // Handle fake mode (legacy)
        if (urlParams.has('fake')) {
            showLaunchScreen(async () => {
                document.getElementById('launch-screen').classList.add('hidden');
                if (s.cloakMode === 'about:blank') {
                    const result = await tryPopup(window.location.href.split('?')[0]);
                    if (result.success) return; // redirectOriginal was called
                }
                loadInTab();
            });
            return;
        }

        // Handle first visit cloak (fake error page)
        if (window.SITE_CONFIG?.firstVisitCloak && !localStorage.getItem(fvKey)) {
            const overlay = document.getElementById('fv-cloak');
            if (overlay) {
                overlay.style.display = 'block';
                document.title = window.location.hostname;
                document.querySelectorAll("link[rel*='icon']").forEach(l => l.remove());
                const link = document.createElement('link');
                link.rel = 'icon';
                link.href = 'data:,';
                document.head.appendChild(link);

                const onKey = async (e) => {
                    if (e.key.toLowerCase() === 'c') {
                        localStorage.setItem(fvKey, '1');
                        document.removeEventListener('keydown', onKey);

                        if (s.cloakMode === 'about:blank') {
                            await attemptCloakedLaunch(window.location.href, () => {
                                overlay.style.display = 'none';
                            });
                        } else {
                            overlay.style.display = 'none';
                            apply();
                            loadInTab();
                        }
                    }
                };
                document.addEventListener('keydown', onKey);
            }
            return;
        }

        // Normal visit - not first time, no fake mode
        if (window.top === window.self && s.cloakMode === 'about:blank') {
            await attemptCloakedLaunch(window.location.href);
            return;
        }

        loadInTab();
        if (s.rotateCloaks) startRotation((s.rotateInterval || 5) * 1000);
    };

    window.Cloaking = { init, apply, startRotation, stopRotation, tryPopup, loadInTab };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(init, 100));
    else setTimeout(init, 100);

    window.addEventListener('settings-changed', (e) => {
        apply();
        if (e.detail.rotateCloaks) startRotation((e.detail.rotateInterval || 5) * 1000);
        else stopRotation();
    });
})();
