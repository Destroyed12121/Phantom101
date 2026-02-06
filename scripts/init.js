// proxy

const ProxyInit = {
    DEFAULT_WISP: window.SITE_CONFIG?.defaultWisp || "wss://glseries.net/wisp/",
    WISP_SERVERS: window.SITE_CONFIG?.wispServers || [],
    BASE_PATH: (window.STATICSJ_BASE_PATH || "/staticsjv2/").replace(/\/?$/, '/'),

    async ping(url, timeout = 1000) {
        return new Promise(res => {
            const start = Date.now();
            try {
                const ws = new WebSocket(url);
                const timer = setTimeout(() => { try { ws.close(); } catch { } res({ url, success: false }); }, timeout);
                ws.onopen = () => { clearTimeout(timer); const latency = Date.now() - start; try { ws.close(); } catch { } res({ url, success: true, latency }); };
                ws.onerror = () => { clearTimeout(timer); res({ url, success: false }); };
            } catch { res({ url, success: false }); }
        });
    },

    async findBest() {
        const current = localStorage.getItem("proxServer") || this.DEFAULT_WISP;

        // Fast check current server first
        const check = await this.ping(current, 800);
        if (check.success) return current;

        // Only search for best if current is dead
        if (localStorage.getItem('wispAutoswitch') === 'false' || !this.WISP_SERVERS.length) return current;

        const results = await Promise.all(this.WISP_SERVERS.map(s => this.ping(s.url, 1500)));
        const working = results.filter(r => r.success).sort((a, b) => a.latency - b.latency);
        return working[0]?.url || this.DEFAULT_WISP;
    },

    async init() {
        try {
            // Delay initialization slightly to prioritize core UI
            if (document.readyState !== 'complete') {
                await new Promise(r => window.addEventListener('load', r, { once: true }));
                // wait another 500ms for animations/etc
                await new Promise(r => setTimeout(r, 500));
            }

            if (window.Notify) {
                window.Notify.info("Initializing", "Starting proxy service...");
            }

            // Lazy wait for libraries if they're coming from broad scripts
            if (!window.BareMux) {
                let attempts = 0;
                while (!window.BareMux && attempts < 20) {
                    await new Promise(r => setTimeout(r, 100));
                    attempts++;
                }
            }
            if (!window.BareMux || typeof $scramjetLoadController === 'undefined') {
                console.warn("Proxy: Base libraries not found, retrying...");
                // Allow one more grace period
                await new Promise(r => setTimeout(r, 1000));
                if (!window.BareMux) throw new Error("Proxy dependencies missing");
            }

            // 1. Start Independent Tasks in Parallel

            // Task A: Wisp Selection
            const wispTask = this.findBest();

            // Task B: Scramjet Initialization
            const { ScramjetController } = $scramjetLoadController();
            const scramjet = new ScramjetController({
                prefix: this.BASE_PATH + "scramjet/",
                files: {
                    wasm: "https://cdn.jsdelivr.net/gh/Destroyed12121/Staticsj@main/JS/scramjet.wasm.wasm",
                    all: "https://cdn.jsdelivr.net/gh/Destroyed12121/Staticsj@main/JS/scramjet.all.js",
                    sync: "https://cdn.jsdelivr.net/gh/Destroyed12121/Staticsj@main/JS/scramjet.sync.js"
                }
            });
            const scramjetTask = scramjet.init();

            // Task C: Service Worker Registration
            const swTask = (async () => {
                if ('serviceWorker' in navigator) {
                    const reg = await navigator.serviceWorker.register(this.BASE_PATH + "sw.js", { scope: this.BASE_PATH });
                    await navigator.serviceWorker.ready;
                    return reg;
                }
                return null;
            })();

            // 2. Await Critical Data (Wisp)
            const best = await wispTask;
            localStorage.setItem("proxServer", best);
            console.log("Proxy: Using Wisp Server", best);

            // 3. Configure SW (needs Wisp)
            const reg = await swTask;
            if (reg && reg.active) {
                const config = {
                    type: "config",
                    wispurl: best,
                    servers: [...this.WISP_SERVERS, ...JSON.parse(localStorage.getItem('customWisps') || '[]')],
                    autoswitch: localStorage.getItem('wispAutoswitch') !== 'false'
                };
                reg.active.postMessage(config);
            }

            // 4. Setup Transport (needs Wisp)
            const conn = new BareMux.BareMuxConnection(this.BASE_PATH + "bareworker.js");
            const transportTask = conn.setTransport("https://cdn.jsdelivr.net/npm/@mercuryworkshop/epoxy-transport/dist/index.mjs", [{ wisp: best }]);

            // 5. Complete Final Waits
            await Promise.all([scramjetTask, transportTask]);

            if (window.Notify) window.Notify.success("Ready", "Proxy service initialized");
            console.log("Proxy: Init complete");

        } catch (e) {
            console.error("Proxy Init Error:", e);
            if (window.Notify) window.Notify.error("Failed", "Proxy error: " + (e.message || "Unknown error"));
        }
    }
};

ProxyInit.init();

// Register Offline Service Worker (Root)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then(reg => console.log('Offline SW registered'))
        .catch(err => console.error('Offline SW failed', err));
}

// Offline Banner Logic
window.addEventListener('load', () => {
    const banner = document.getElementById('offline-banner');
    if (!banner) return;

    function updateOnlineStatus() {
        if (navigator.onLine) {
            banner.classList.remove('show');
        } else {
            banner.classList.add('show');
            setTimeout(() => banner.classList.remove('show'), 5000); // Auto-hide after 5s
        }
    }

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
});

// Global link interceptor for loading screen
(function () {
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link || !link.href) return;

        try {
            const url = new URL(link.href, window.location.href);
            const isInternal = url.origin === window.location.origin &&
                !url.pathname.includes('staticsjv2/') &&
                !link.hasAttribute('download') &&
                link.target !== '_blank';

            if (isInternal && window.parent && window.parent.showLoading) {
                window.parent.showLoading();
            }
        } catch (e) { }
    });
})();

window.addEventListener('message', async (e) => {
    if (e.data?.type === 'proxy-fetch' && e.data.url) {
        try {
            const res = await fetch(e.data.url);
            e.source.postMessage({ type: 'proxy-fetch-result', url: e.data.url, blob: await res.blob() }, '*');
        } catch (err) { }
    }
});