/**
 * Proxy Initialization Script
 * Initializes Scramjet, BareMux, and service worker for proxy functionality.
 */

(async function initProxy() {
    try {
        if (window.Notify) window.Notify.info("Initializing", "Starting proxy service...");

        const DEFAULT_WISP = SITE_CONFIG.defaultWisp;
        if (!localStorage.getItem("proxServer")) localStorage.setItem("proxServer", DEFAULT_WISP);

        // Wait for BareMux (module scripts take time)
        let attempts = 0;
        while (!window.BareMux && attempts < 60) {
            await new Promise(r => setTimeout(r, 100));
            attempts++;
        }
        if (!window.BareMux) throw new Error("BareMux library failed to load (Timeout)");
        if (typeof $scramjetLoadController === 'undefined') throw new Error("Scramjet library failed to load");

        const { ScramjetController } = $scramjetLoadController();
        let basePath = window.STATICSJ_BASE_PATH || "/staticsjv2/";
        if (!basePath.endsWith('/')) basePath += '/';

        const scramjet = new ScramjetController({
            prefix: basePath + "scramjet/",
            files: {
                wasm: "https://cdn.jsdelivr.net/gh/Destroyed12121/Staticsj@main/JS/scramjet.wasm.wasm",
                all: "https://cdn.jsdelivr.net/gh/Destroyed12121/Staticsj@main/JS/scramjet.all.js",
                sync: "https://cdn.jsdelivr.net/gh/Destroyed12121/Staticsj@main/JS/scramjet.sync.js"
            }
        });

        await scramjet.init();

        if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.register(basePath + "sw.js", { scope: basePath });
            if (!reg.active) await new Promise(r => setTimeout(r, 100));

            const wispUrl = localStorage.getItem("proxServer") || DEFAULT_WISP;
            const customWisps = JSON.parse(localStorage.getItem('customWisps') || '[]');
            const allServers = [...SITE_CONFIG.wispServers, ...customWisps];
            const autoswitch = localStorage.getItem('wispAutoswitch') !== 'false';

            // Listen for Wisp status updates
            navigator.serviceWorker.addEventListener('message', (e) => {
                if (e.data.type === 'wispChanged') {
                    console.log("Updating cached proxy server to:", e.data.url);
                    localStorage.setItem("proxServer", e.data.url);
                }
            });

            reg.active?.postMessage({ type: "config", wispurl: wispUrl, servers: allServers, autoswitch: autoswitch });

            const connection = new BareMux.BareMuxConnection(basePath + "bareworker.js");
            await connection.setTransport("https://cdn.jsdelivr.net/npm/@mercuryworkshop/epoxy-transport/dist/index.mjs", [{ wisp: wispUrl }]);

            if (window.Notify) window.Notify.success("Ready", "Proxy service initialized");
        } else {
            throw new Error("Service Worker not supported");
        }
    } catch (error) {
        console.error("Scramjet Init Error:", error);
        if (window.Notify) window.Notify.error("Initialization Failed", error.message);
    }
})();

// Handle proxy-fetch requests from background iframe
window.addEventListener('message', async (e) => {
    if (e.data?.type === 'proxy-fetch' && e.data.url) {
        try {
            const response = await fetch(e.data.url);
            if (!response.ok) throw new Error('Fetch failed');
            e.source.postMessage({ type: 'proxy-fetch-result', url: e.data.url, blob: await response.blob() }, e.data.targetOrigin || '*');
        } catch (err) {
            e.source.postMessage({ type: 'proxy-fetch-result', url: e.data.url, error: err.message }, e.data.targetOrigin || '*');
        }
    }
});
