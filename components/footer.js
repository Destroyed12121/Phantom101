// footer
(function () {
    'use strict';

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

    const config = window.SITE_CONFIG || { name: 'Phantom', version: '1.0.0', discord: { inviteUrl: '#' }, changelog: [], cloakPresets: [] };
    const STORAGE_KEY = 'void_settings';
    let storedSettings = {};
    try { storedSettings = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { }

    // settings
    let settings = { ...(config.defaults || {}), ...storedSettings };

    // Inject modals.css 
    if (!document.querySelector('link[href*="styles/modals.css"]')) {
        const modalLink = document.createElement('link');
        modalLink.rel = 'stylesheet';
        modalLink.href = `${rootPrefix}styles/modals.css`;
        document.head.appendChild(modalLink);
    }

    const footer = document.createElement('footer');
    footer.id = 'site-footer';
    footer.innerHTML = `
        <style>
            #site-footer {
                margin-top: 0px;
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
            <a href="${rootPrefix}pages/extra.html" class="footer-link">Credits</a>
        </div>
        <span class="footer-version" id="footer-version">${config.name || 'Phantom'} v${config.version || '1.0.0'}</span>
    `;

    document.body.appendChild(footer);



    // Inject GTM head script 
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
                    <a href="${config.discord?.inviteUrl || '#'}" target="_blank" style="color: #5865F2; text-decoration: none; font-size: 13px; display: inline-flex; align-items: center; gap: 6px;">
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

    // sync
    // syncRemoteChangelog removed - using local config


    // Initialize Sync
    // syncRemoteChangelog();

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

    // panic
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
                const url = settings.panicUrl || 'https://classroom.google.com';
                try { window.top.location.href = url; } catch { window.location.href = url; }
            }
        }, true); // Use capture phase for faster response
    }

    // Cloaking logic has been moved to scripts/cloaking.js for better synchronization.
    // If you need cloaking on a specific page, include that script.


    window.addEventListener('beforeunload', (e) => {
        // Reload settings to get latest value
        try { settings = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { }

        if (window.top === window.self && settings.leaveConfirmation) {
            e.preventDefault();
            e.returnValue = '';
            return '';
        }
    });

    // discord
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

    // counters
    // Only show on home page (index2.html) checking if main-content exists
    const mainContent = document.querySelector('.main-content');
    // Ensure we are on the home page view (search bar checks etc) or just check existence
    if (mainContent && document.querySelector('.featured-section')) {
        const counterContainer = document.createElement('div');
        counterContainer.id = 'supercounters-wrapper';
        counterContainer.style.position = 'absolute';
        counterContainer.style.width = '0';
        counterContainer.style.height = '0';
        counterContainer.style.overflow = 'hidden';
        counterContainer.style.opacity = '0';
        counterContainer.style.pointerEvents = 'none';

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
