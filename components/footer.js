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
    let storedSettings = {};
    try { storedSettings = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { }

    // Merge defaults with stored settings
    // This ensures new defaults (like showChangelogOnUpdate: true) are respected if not overwritten by user
    let settings = { ...(config.defaults || {}), ...storedSettings };

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
            <a href="${rootPrefix}pages/extra.html" class="footer-link">Extra</a>
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
    const openChangelog = (e, customTitle, customContent) => {
        if (e && e.preventDefault) e.preventDefault();
        const changes = customContent || config.changelog || ['No changes listed'];

        // Use standard modal structure from main.css
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';

        overlay.innerHTML = `
            <div class="modal" style="width: 400px; max-width: 90vw;">
                <div class="modal-header">
                    <h3 class="modal-title">${customTitle || 'What\'s New in v' + config.version}</h3>
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
    // REMOTE CHANGELOG FETCHING
    // ==========================================
    async function syncRemoteChangelog() {
        const LAST_MSG_HASH = 'phantom_changelog_hash';

        try {
            // Using a timeout for reliability
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch('https://cdn.jsdelivr.net/gh/Destroyed12121/Phantom101/message.js', { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) return;
            const content = await response.text();
            if (!content || content.trim().length === 0) return;

            // Parsing (Plaintext or Array)
            let newChangelog = [];
            const trimmed = content.trim();
            if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                try { newChangelog = JSON.parse(trimmed.replace(/'/g, '"')); } catch { }
            }
            if (!newChangelog.length) {
                newChangelog = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            }

            if (newChangelog.length === 0) return;

            // Create a simple hash/identifier for the content
            const contentId = btoa(unescape(encodeURIComponent(newChangelog.join('|')))).substring(0, 32);
            const previousId = localStorage.getItem(LAST_MSG_HASH);

            // If it's the first time seeing this specific remote message, show it
            if (previousId !== contentId) {
                setTimeout(() => {
                    openChangelog(null, "Announcement", newChangelog);
                    localStorage.setItem(LAST_MSG_HASH, contentId);
                }, 2000);
            }
        } catch (err) {
            console.warn("Changelog sync failed:", err);
        }
    }

    // Initialize Sync
    syncRemoteChangelog();

    // ==========================================
    // AUTO SHOW CHANGELOG ON VERSION UPDATE
    // ==========================================
    const currentVersion = config.version;
    const lastVersion = settings.lastVersion;

    if (settings.showChangelogOnUpdate && lastVersion && lastVersion !== currentVersion) {
        setTimeout(() => {
            openChangelog();
            settings.lastVersion = currentVersion;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        }, 1000);
    } else if (!lastVersion) {
        settings.lastVersion = currentVersion;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }

    // ==========================================
    // 2. GLOBAL PANIC KEY
    // ==========================================
    if (settings.panicKey) {
        document.addEventListener('keydown', (e) => {
            const keys = settings.panicModifiers || ['ctrl', 'shift'];
            const triggerKey = settings.panicKey.toLowerCase();
            const pressedKey = e.key.toLowerCase();

            // Check modifiers
            const ctrlMatch = keys.includes('ctrl') === e.ctrlKey;
            const shiftMatch = keys.includes('shift') === e.shiftKey;
            const altMatch = keys.includes('alt') === e.altKey;

            if (ctrlMatch && shiftMatch && altMatch && pressedKey === triggerKey) {
                e.preventDefault();
                const url = settings.panicUrl || 'https://classroom.google.com';
                try { window.top.location.href = url; } catch { window.location.href = url; }
            }
        });
    }

    // ==========================================
    // 3. CLOAKING (STATIC & ROTATING)
    // ==========================================
    function applyCloak() {
        // Reload settings
        try { settings = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { }

        const presets = config.cloakPresets || [];
        const customs = settings.customCloaks || [];
        const allCloaks = [...presets, ...customs];

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

        return allCloaks;
    }

    // Apply immediately and get cloaks
    let allCloaks = applyCloak();

    // Listen for changes
    window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) allCloaks = applyCloak();
    });

    // Expose for current tab settings page to call
    window.updateCloakInstant = () => { allCloaks = applyCloak(); };

    // Rotation Logic
    let rotationIndex = 0;
    setInterval(() => {
        // Check setting live from local var (updated by storage listener)
        if (settings.rotateCloaks && allCloaks.length > 0) {
            const cloak = allCloaks[rotationIndex];
            document.title = cloak.title || cloak.name;

            let link = document.querySelector("link[rel~='icon']");
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.head.appendChild(link);
            }
            link.href = cloak.icon || '';

            try { window.top.document.title = document.title; } catch { }

            rotationIndex = (rotationIndex + 1) % allCloaks.length;
        }
    }, (settings.rotateInterval || 5) * 1000);

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
    let crateInstance = null;

    function initDiscord() {
        if (settings.discordWidget && config.discord && config.discord.widgetServer && config.discord.widgetChannel) {
            // Check if already loaded
            if (document.querySelector('script[src*="@widgetbot/crate"]')) {
                if (crateInstance) crateInstance.show();
                return;
            }

            const crateScript = document.createElement('script');
            crateScript.src = 'https://cdn.jsdelivr.net/npm/@widgetbot/crate@3';
            crateScript.async = true;
            crateScript.defer = true;
            crateScript.onload = () => {
                crateInstance = new Crate({
                    server: config.discord.widgetServer,
                    channel: config.discord.widgetChannel,
                    glyph: ['https://cdn.discordapp.com/embed/avatars/0.png', '100%'],
                    location: ['bottom', 'right']
                });
            };
            document.body.appendChild(crateScript);
        } else {
            // Hide if disabled
            if (crateInstance) crateInstance.hide();
        }
    }

    // Initialize
    initDiscord();

    // Listen for settings change to toggle dynamically
    window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) {
            try { settings = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { }
            initDiscord();
        }
    });

    // Listen for internal event
    window.addEventListener('settings-changed', (e) => {
        settings = e.detail;
        initDiscord();
    });

    // ==========================================
    // 6. SUPERCOUNTERS WIDGET
    // ==========================================
    // Only show on home page (index2.html) checking if main-content exists
    const mainContent = document.querySelector('.main-content');
    // Ensure we are on the home page view (search bar checks etc) or just check existence
    if (mainContent && document.querySelector('.featured-section')) {
        const counterContainer = document.createElement('div');
        counterContainer.id = 'supercounters-wrapper';
        counterContainer.style.marginTop = '24px';
        counterContainer.style.textAlign = 'center';
        counterContainer.style.opacity = '0.8';

        // Use iframe to isolate document.write from the widget
        const iframe = document.createElement('iframe');
        iframe.style.border = 'none';
        iframe.style.width = '150px';
        iframe.style.height = '40px';
        iframe.style.overflow = 'hidden';

        // Widget code
        const widgetCode = `
            <html>
            <body style="margin:0;display:flex;justify-content:center;align-items:center;background:transparent;">
                <script type="text/javascript" src="//widget.supercounters.com/ssl/online_i.js"></script>
                <script type="text/javascript">sc_online_i(1726449,"ffffff","000000");</script>
            </body>
            </html>
        `;

        iframe.srcdoc = widgetCode;
        counterContainer.appendChild(iframe);
        mainContent.appendChild(counterContainer);
    }
})();
