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

    const openInBlank = (url) => {
        const win = window.open('about:blank', '_blank');
        if (!win) return null;
        const s = window.Settings?.getAll() || {};
        const title = s.tabTitle || window.SITE_CONFIG?.defaults?.tabTitle || 'Google';
        const icon = s.tabFavicon || window.SITE_CONFIG?.defaults?.tabFavicon || 'https://www.google.com/favicon.ico';
        win.document.write(`<!DOCTYPE html><html><head><title>${title}</title><link rel="icon" href="${icon}"><style>* {margin:0;padding:0;height:100%;overflow:hidden;} iframe{width:100%;height:100%;border:none;}</style></head><body><iframe src="${url}"></iframe></body></html>`);
        win.document.close();
        redirectOriginal();
        return win;
    };

    const init = () => {
        const s = window.Settings?.getAll() || {};
        const fvKey = 'phantom_fv';
        const urlParams = new URLSearchParams(window.location.search);

        if (urlParams.has('fake')) {
            const ls = document.getElementById('launch-screen');
            if (ls) {
                ls.classList.remove('hidden');
                document.getElementById('launch-button').onclick = () => {
                    ls.classList.add('hidden');
                    if (s.cloakMode === 'about:blank' && openInBlank(window.location.href.split('?')[0])) return;
                    document.getElementById('main-frame').src = 'index2.html';
                };
            }
        } else if (window.SITE_CONFIG?.firstVisitCloak && !localStorage.getItem(fvKey)) {
            const overlay = document.getElementById('fv-cloak');
            if (overlay) {
                overlay.style.display = 'block';
                document.title = window.location.hostname;
                document.querySelectorAll("link[rel*='icon']").forEach(l => l.remove());
                const link = document.createElement('link');
                link.rel = 'icon';
                link.href = 'data:,';
                document.head.appendChild(link);
                const onKey = (e) => {
                    if (e.key.toLowerCase() === 'c') {
                        localStorage.setItem(fvKey, '1');
                        document.removeEventListener('keydown', onKey);
                        if (s.cloakMode === 'about:blank' && openInBlank(window.location.href)) return;
                        overlay.style.display = 'none';
                        apply();
                        document.getElementById('main-frame').src = 'index2.html';
                    }
                };
                document.addEventListener('keydown', onKey);
            }
        } else {
            if (window.top === window.self && s.cloakMode === 'about:blank' && openInBlank(window.location.href)) return;
            const iframe = document.getElementById('main-frame');
            if (iframe && !iframe.src) iframe.src = 'index2.html';
            apply();
            if (s.rotateCloaks) startRotation((s.rotateInterval || 5) * 1000);
        }
    };

    window.Cloaking = { init, apply, startRotation, stopRotation, openInBlank };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(init, 100));
    else setTimeout(init, 100);

    window.addEventListener('settings-changed', (e) => {
        apply();
        if (e.detail.rotateCloaks) startRotation((e.detail.rotateInterval || 5) * 1000);
        else stopRotation();
    });
})();
