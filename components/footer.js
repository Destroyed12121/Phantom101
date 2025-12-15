// Footer Component
// Includes: Global Footer, Changelog Popup, Global Panic Key, Rotating Cloaks
(function () {
    'use strict';

    // Detect root prefix (needed for links to work from subdirectories)
    let rootPrefix = '';
    const scriptName = 'components/footer.js';
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
        const src = scripts[i].getAttribute('src');
        if (src && src.includes(scriptName)) {
            rootPrefix = src.split(scriptName)[0];
            break;
        }
    }

    // Get config and settings
    const config = window.SITE_CONFIG || { name: 'Phantom', version: '1.0.0', discord: { inviteUrl: '#' }, changelog: [], cloakPresets: [] };
    const STORAGE_KEY = 'void_settings';
    let settings = {};
    try { settings = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { }

    // ==========================================
    // 1. FOOTER UI
    // ==========================================
    const footer = document.createElement('footer');
    footer.id = 'site-footer';
    footer.innerHTML = `
        <style>
            #site-footer {
                margin-top: 40px;
                padding: 20px;
                border-top: 1px solid var(--border, #1f1f1f);
                text-align: center;
                background: transparent;
            }
            #site-footer .footer-links {
                display: flex;
                gap: 16px;
                justify-content: center;
                margin-bottom: 8px;
                flex-wrap: wrap;
            }
            #site-footer .footer-link {
                font-size: 12px;
                color: var(--text-muted, #71717a);
                text-decoration: none;
                transition: color 0.15s;
                font-family: 'Inter', sans-serif;
                cursor: pointer;
            }
            #site-footer .footer-link:hover {
                color: var(--text, #e4e4e7);
            }
            #site-footer .footer-version {
                font-size: 11px;
                color: var(--text-dim, #52525b);
                cursor: pointer;
                font-family: 'Inter', sans-serif;
            }
            #site-footer .footer-version:hover {
                color: var(--text-muted, #71717a);
            }
        </style>
        <div class="footer-links">
            <a href="${rootPrefix}pages/settings.html" class="footer-link"><i class="fa-solid fa-gear"></i> Settings</a>
            <a id="footer-changelog" class="footer-link"><i class="fa-solid fa-clock-rotate-left"></i> Changelog</a>
            <a href="${config.discord?.inviteUrl || '#'}" target="_blank" class="footer-link"><i class="fa-brands fa-discord"></i> Discord</a>
            <a href="${rootPrefix}pages/terms.html" class="footer-link">Terms</a>
            <a href="${rootPrefix}pages/disclaimer.html" class="footer-link">Disclaimer</a>
        </div>
        <span class="footer-version" id="footer-version">${config.name || 'Phantom'} v${config.version || '1.0.0'}</span>
    `;

    document.body.appendChild(footer);

    // ==========================================
    // GOOGLE TAG MANAGER INJECTION
    // ==========================================
    // Inject GTM head script if not already present
    if (!document.querySelector('script[src*="googletagmanager.com/gtm.js"]')) {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
        const gtmScript = document.createElement('script');
        gtmScript.async = true;
        gtmScript.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-5LMBC27Z';
        document.head.insertBefore(gtmScript, document.head.firstChild);
    }

    // Add GTM noscript fallback (for pages that don't have it in HTML)
    if (!document.querySelector('noscript iframe[src*="googletagmanager"]')) {
        const gtmNoscript = document.createElement('noscript');
        gtmNoscript.innerHTML = '<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-5LMBC27Z" height="0" width="0" style="display:none;visibility:hidden"></iframe>';
        document.body.insertBefore(gtmNoscript, document.body.firstChild);
    }

    // Changelog Popup Logic
    const openChangelog = (e) => {
        if (e) e.preventDefault();
        const changes = config.changelog || ['No changes listed'];

        // Use standard modal structure from main.css
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';

        overlay.innerHTML = `
            <div class="modal" style="width: 400px; max-width: 90vw;">
                <div class="modal-header">
                    <h3 class="modal-title">What's New in v${config.version}</h3>
                    <button class="modal-close"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="modal-body">
                    <ul style="margin: 0; padding-left: 20px; color: var(--text-muted); font-size: 0.875rem; line-height: 1.6;">
                        ${changes.map(c => '<li>' + c + '</li>').join('')}
                    </ul>
                </div>
                <div class="modal-footer">
                    <a href="${config.discord?.inviteUrl || '#'}" target="_blank" class="btn btn-sm btn-ghost" style="color: #5865F2;">
                        <i class="fa-brands fa-discord"></i> Join Discord
                    </a>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Trigger animation
        requestAnimationFrame(() => overlay.classList.add('show'));

        const close = () => {
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 200);
        };

        overlay.querySelector('.modal-close').onclick = close;
        overlay.onclick = (e) => { if (e.target === overlay) close(); };
    };

    // Expose openChangelog globally
    window.openChangelog = openChangelog;

    const changelogBtn = document.getElementById('footer-changelog');
    if (changelogBtn) changelogBtn.onclick = openChangelog;

    const versionBtn = document.getElementById('footer-version');
    if (versionBtn) versionBtn.onclick = openChangelog;

    // ==========================================
    // 2. GLOBAL PANIC KEY
    // ==========================================
    if (settings.panicKey) {
        document.addEventListener('keydown', (e) => {
            const keys = settings.panicModifiers || ['ctrl', 'shift'];
            const triggerKey = settings.panicKey.toLowerCase();
            const pressedKey = e.key.toLowerCase();

            // Check modifiers
            const ctrl = keys.includes('ctrl') ? e.ctrlKey : true;
            const shift = keys.includes('shift') ? e.shiftKey : true;
            const alt = keys.includes('alt') ? e.altKey : true;
            // If modifier is in list, it MUST be pressed. If not in list, it DOESNT MATTER (actually normally strict means if not in list it shouldn, but simple logic: checks required ones)
            // Let's match strict: keys.includes('ctrl') === e.ctrlKey
            const ctrlMatch = keys.includes('ctrl') === e.ctrlKey;
            const shiftMatch = keys.includes('shift') === e.shiftKey;
            const altMatch = keys.includes('alt') === e.altKey;

            if (ctrlMatch && shiftMatch && altMatch && pressedKey === triggerKey) {
                e.preventDefault();
                const url = settings.panicUrl || 'https://classroom.google.com';
                // Try to redirect top window if possible
                try { window.top.location.href = url; } catch { window.location.href = url; }
            }
        });
    }

    // ==========================================
    // 3. ROTATING CLOAKS
    // ==========================================
    // ==========================================
    // 3. ROTATING & STATIC CLOAKS
    // ==========================================
    function applyCloak() {
        // Reload settings
        try { settings = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { }

        const presets = config.cloakPresets || [];
        const customs = settings.customCloaks || [];
        const allCloaks = [...presets, ...customs];

        // Clear existing interval if any (wrapper variable needed if we fully restart logic, 
        // but for now simpler: just handle static immediate update, rotation handles itself on reload or simple check)
        // Actually, if we switch from static to rotating without reload, we need to handle interval.
        // For "instant", let's focus on Static first as that's what user usually notices.

        if (!settings.rotateCloaks) {
            if (settings.tabTitle) document.title = settings.tabTitle;
            if (settings.tabFavicon) {
                let link = document.querySelector("link[rel~='icon']");
                if (!link) {
                    link = document.createElement('link');
                    link.rel = 'icon';
                    document.head.appendChild(link);
                }
                link.href = settings.tabFavicon;
            }
        }
    }

    // Apply immediately
    applyCloak();

    // Listen for changes from other tabs
    window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) applyCloak();
    });

    // Expose for current tab settings page to call
    window.updateCloakInstant = applyCloak;

    // Rotation Logic (Separated to avoid conflict with instant static updates, 
    // real-time rotation toggle requires reload or more complex interval management)
    if (settings.rotateCloaks) {
        if (allCloaks.length > 0) {
            let index = 0;
            const interval = (settings.rotateInterval || 5) * 1000;
            setInterval(() => {
                // Check settings again inside interval in case they changed (pseudo-live)
                // But efficient way is just reload.
                const cloak = allCloaks[index];
                document.title = cloak.title;
                let link = document.querySelector("link[rel~='icon']");
                if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
                link.href = cloak.icon || 'https://www.google.com/favicon.ico';
                try { window.top.document.title = cloak.title; } catch { }
                index = (index + 1) % allCloaks.length;
            }, interval);
        }
    }

    // ==========================================
    // 4. LEAVE CONFIRMATION
    // ==========================================
    window.addEventListener('beforeunload', (e) => {
        // Reload settings to get latest value
        try { settings = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { }

        if (settings.leaveConfirmation) {
            e.preventDefault();
            e.returnValue = '';
            return '';
        }
    });

    // ==========================================
    // 5. DISCORD WIDGET (CRATE)
    // ==========================================
    if (config.defaults.discordWidget && config.discord && config.discord.widgetServer && config.discord.widgetChannel) {
        const crateScript = document.createElement('script');
        crateScript.src = 'https://cdn.jsdelivr.net/npm/@widgetbot/crate@3';
        crateScript.async = true;
        crateScript.defer = true;
        crateScript.onload = () => {
            new Crate({
                server: config.discord.widgetServer,
                channel: config.discord.widgetChannel,
                glyph: ['https://cdn.discordapp.com/embed/avatars/0.png', '100%'], // Default Discord logo or config
                location: ['bottom', 'right']
            });
        };
        document.body.appendChild(crateScript);
    }
})();
