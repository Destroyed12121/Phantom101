/**
 * Proxy Initialization Script
 * This file initializes Scramjet, BareMux, and service worker for proxy functionality.
 * Load this script in any page that needs proxy capabilities.
 */

(async function initProxy() {
    try {
        if (window.Notify) {
            window.Notify.info("Initializing", "Starting proxy service...");
        }

        const DEFAULT_WISP = SITE_CONFIG.defaultWisp;
        if (!localStorage.getItem("proxServer")) {
            localStorage.setItem("proxServer", DEFAULT_WISP);
        }

        // 1. Check for BareMux (Module scripts take time)
        let attempts = 0;
        while (!window.BareMux && attempts < 60) {
            await new Promise(r => setTimeout(r, 100));
            attempts++;
        }

        if (!window.BareMux) {
            throw new Error("BareMux library failed to load (Timeout)");
        }

        // 2. Check Scramjet
        if (typeof $scramjetLoadController === 'undefined') {
            throw new Error("Scramjet library failed to load");
        }

        const { ScramjetController } = $scramjetLoadController();
        
        // Determine base path dynamically
        let basePath = window.STATICSJ_BASE_PATH || "/staticsjv2/";
        if (!basePath.endsWith('/')) basePath += '/';
        
        const scramjetPrefix = basePath + "scramjet/";
        const swPath = basePath + "sw.js";
        const scope = basePath;
        const bareWorkerPath = basePath + "bareworker.js";

        const scramjet = new ScramjetController({
            prefix: scramjetPrefix,
            files: {
                wasm: "https://cdn.jsdelivr.net/gh/Destroyed12121/Staticsj@main/JS/scramjet.wasm.wasm",
                all: "https://cdn.jsdelivr.net/gh/Destroyed12121/Staticsj@main/JS/scramjet.all.js",
                sync: "https://cdn.jsdelivr.net/gh/Destroyed12121/Staticsj@main/JS/scramjet.sync.js"
            }
        });

        await scramjet.init();

        if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.register(swPath, { scope: scope });

            // Wait for active
            if (!reg.active) {
                await new Promise(resolve => {
                    const check = () => {
                        if (reg.active) resolve();
                        else setTimeout(check, 100);
                    };
                    check();
                });
            }

            const wispUrl = localStorage.getItem("proxServer") || DEFAULT_WISP;

            const customWisps = JSON.parse(localStorage.getItem('customWisps') || '[]');
            const allServers = [
                ...SITE_CONFIG.wispServers,
                ...customWisps
            ];
            const autoswitch = localStorage.getItem('wispAutoswitch') !== 'false';

            // Reliable initialization check
            const configReady = new Promise(resolve => {
                const timeout = setTimeout(() => {
                    navigator.serviceWorker.removeEventListener('message', handler);
                    resolve(false);
                }, 5000);

                const handler = (e) => {
                    if (e.data.type === 'config_ready') {
                        clearTimeout(timeout);
                        navigator.serviceWorker.removeEventListener('message', handler);
                        resolve(true);
                    }
                };
                navigator.serviceWorker.addEventListener('message', handler);
            });

            // Listen for Wisp status updates to cache the working server (Silent)
            navigator.serviceWorker.addEventListener('message', (e) => {
                if (e.data.type === 'wispChanged') {
                    console.log("Updating cached proxy server to:", e.data.url);
                    localStorage.setItem("proxServer", e.data.url);
                }
            });

            reg.active.postMessage({ type: "config", wispurl: wispUrl, servers: allServers, autoswitch: autoswitch });
            const isReady = await configReady;

            const connection = new BareMux.BareMuxConnection(bareWorkerPath);
            await connection.setTransport("https://cdn.jsdelivr.net/npm/@mercuryworkshop/epoxy-transport/dist/index.mjs", [{ wisp: wispUrl }]);

            if (window.Notify) {
                if (isReady) {
                    window.Notify.success("Ready", "Proxy service initialized");
                } else {
                    window.Notify.warning("Partial Ready", "Proxy initialized with possible connection delay");
                }
            }
        } else {
            throw new Error("Service Worker not supported");
        }
    } catch (error) {
        console.error("Scramjet Init Error:", error);
        if (window.Notify) {
            window.Notify.error("Initialization Failed", error.message);
        }
    }
})();

// Handle proxy-fetch requests from background iframe
window.addEventListener('message', async (e) => {
    if (e.data?.type === 'proxy-fetch' && e.data.url) {
        try {
            const response = await fetch(e.data.url);
            if (!response.ok) throw new Error('Fetch failed');
            const blob = await response.blob();
            e.source.postMessage({
                type: 'proxy-fetch-result',
                url: e.data.url,
                blob: blob
            }, e.data.targetOrigin || '*');
        } catch (err) {
            e.source.postMessage({
                type: 'proxy-fetch-result',
                url: e.data.url,
                error: err.message
            }, e.data.targetOrigin || '*');
        }
    }
});
