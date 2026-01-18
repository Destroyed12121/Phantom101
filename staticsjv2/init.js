/**
 * Proxy Initialization Script for ../index2.html
 * Initializes Scramjet, BareMux, and service worker for proxy functionality.
 */

// Ping a wisp server to check if it's responsive
async function pingWispServer(url, timeout = 3000) {
    return new Promise((resolve) => {
        const start = Date.now();
        try {
            const ws = new WebSocket(url);
            const timer = setTimeout(() => {
                try { ws.close(); } catch {}
                resolve({ url, success: false, latency: null });
            }, timeout);

            ws.onopen = () => {
                clearTimeout(timer);
                const latency = Date.now() - start;
                try { ws.close(); } catch {}
                resolve({ url, success: true, latency });
            };

            ws.onerror = () => {
                clearTimeout(timer);
                try { ws.close(); } catch {}
                resolve({ url, success: false, latency: null });
            };
        } catch {
            resolve({ url, success: false, latency: null });
        }
    });
}

// Find the best (fastest working) server from the list
async function findBestWispServer(servers, currentUrl) {
    if (!servers || servers.length === 0) return currentUrl;

    // Ping all servers in parallel
    const results = await Promise.all(
        servers.map(s => pingWispServer(s.url, 2000))
    );

    // Filter to only working servers and sort by latency
    const working = results
        .filter(r => r.success)
        .sort((a, b) => a.latency - b.latency);

    if (working.length > 0) {
        return working[0].url;
    }

    // If none working, return current or first
    return currentUrl || servers[0]?.url;
}

// Proactively check and switch to best server on init
async function initializeWithBestServer() {
    const DEFAULT_WISP = window.SITE_CONFIG?.defaultWisp || "wss://glseries.net/wisp/";
    const WISP_SERVERS = window.SITE_CONFIG?.wispServers || [];
    const autoswitch = localStorage.getItem('wispAutoswitch') !== 'false';

    if (!autoswitch || WISP_SERVERS.length <= 1) {
        return DEFAULT_WISP;
    }

    const currentUrl = localStorage.getItem("proxServer") || DEFAULT_WISP;
    
    // Check if current server is working, if not find a better one
    const currentCheck = await pingWispServer(currentUrl, 2000);
    
    if (currentCheck.success) {
        console.log("Init: Current server is working:", currentUrl, currentCheck.latency + "ms");
        return currentUrl;
    }

    // Current server is bad, find the best working server
    console.log("Init: Current server not responding, finding better server...");
    const best = await findBestWispServer(WISP_SERVERS, currentUrl);
    
    if (best && best !== currentUrl) {
        console.log("Init: Switching to better server:", best);
        localStorage.setItem("proxServer", best);
        return best;
    }

    return currentUrl;
}

(async function initProxy() {
    try {
        if (window.Notify) window.Notify.info("Initializing", "Starting proxy service...");

        const DEFAULT_WISP = window.SITE_CONFIG?.defaultWisp || "wss://glseries.net/wisp/";
        const WISP_SERVERS = window.SITE_CONFIG?.wispServers || [];
        
        // Proactively find the best server on init
        const bestServer = await initializeWithBestServer();
        if (bestServer !== (localStorage.getItem("proxServer") || DEFAULT_WISP)) {
            localStorage.setItem("proxServer", bestServer);
            if (window.Notify) {
                const serverName = WISP_SERVERS.find(s => s.url === bestServer)?.name || 'Fastest Server';
                window.Notify.info("Auto-switched", `Using ${serverName} for best performance`);
            }
        }

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
            const autoswitch = localStorage.getItem('wispAutoswitch') !== 'false';

            // Listen for Wisp status updates
            navigator.serviceWorker.addEventListener('message', (e) => {
                if (e.data.type === 'wispChanged') {
                    console.log("Updating cached proxy server to:", e.data.url);
                    localStorage.setItem("proxServer", e.data.url);
                    if (window.Notify) {
                        window.Notify.info('Proxy Switched', `Now using ${e.data.name}`);
                    }
                }
            });

            const allServers = [...WISP_SERVERS, ...customWisps];
            const swConfig = { type: "config", wispurl: wispUrl, servers: allServers, autoswitch: autoswitch };
            
            // Send config with retries
            const sendConfig = () => reg.active?.postMessage(swConfig);
            sendConfig();
            setTimeout(sendConfig, 500);
            setTimeout(sendConfig, 1500);

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