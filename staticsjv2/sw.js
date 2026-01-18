
const ADBLOCK = {
    blocked: [
  "googlevideo.com/videoplayback",
  "youtube.com/get_video_info",
  "youtube.com/api/stats/ads",
  "youtube.com/pagead",
  "youtube.com/api/stats",
  "youtube.com/get_midroll",
  "youtube.com/ptracking",
  "youtube.com/youtubei/v1/player",
  "youtube.com/s/player",
  "youtube.com/api/timedtext",
  "facebook.com/ads",
  "facebook.com/tr",
  "fbcdn.net/ads",
  "graph.facebook.com/ads",
  "graph.facebook.com/pixel",
  "ads-api.twitter.com",
  "analytics.twitter.com",
  "twitter.com/i/ads",
  "ads.yahoo.com",
  "advertising.com",
  "adtechus.com",
  "amazon-adsystem.com",
  "adnxs.com",
  "doubleclick.net",
  "googlesyndication.com",
  "googleadservices.com",
  "rubiconproject.com",
  "pubmatic.com",
  "criteo.com",
  "openx.net",
  "taboola.com",
  "outbrain.com",
  "moatads.com",
  "casalemedia.com",
  "unityads.unity3d.com",
  "/ads/",
  "/adserver/",
  "/banner/",
  "/promo/",
  "/tracking/",
  "/beacon/",
  "/metrics/",
  "adsafeprotected.com",
  "chartbeat.com",
  "scorecardresearch.com",
  "quantserve.com",
  "krxd.net",
  "demdex.net"
]   
};

function isAdBlocked(url) {
    const urlStr = url.toString();
    for (const pattern of ADBLOCK.blocked) {
        let regexPattern = pattern
            .replace(/\*/g, '.*')
            .replace(/\./g, '\\.')
            .replace(/\?/g, '\\?');
        const regex = new RegExp(regexPattern, 'i');
        if (regex.test(urlStr)) {
            return true;
        }
    }
    return false;
}

const swPath = self.location.pathname;
const basePath = swPath.substring(0, swPath.lastIndexOf('/') + 1);
self.basePath = self.basePath || basePath;

self.$scramjet = {
    files: {
        wasm: "https://cdn.jsdelivr.net/gh/Destroyed12121/Staticsj@main/JS/scramjet.wasm.wasm",
        sync: "https://cdn.jsdelivr.net/gh/Destroyed12121/Staticsj@main/JS/scramjet.sync.js",
    }
};

importScripts("https://cdn.jsdelivr.net/gh/Destroyed12121/Staticsj@main/JS/scramjet.all.js");
importScripts("https://cdn.jsdelivr.net/npm/@mercuryworkshop/bare-mux/dist/index.js");

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker({
    prefix: basePath + "scramjet/"
});

self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// Wisp configuration - receives from script.js via postMessage
let wispConfig = {
    wispurl: null,
    servers: [],
    autoswitch: true
};

// Server health tracking for autoswitching
let serverHealth = new Map();
let currentServerStartTime = null;
const MAX_CONSECUTIVE_FAILURES = 2;
const PING_TIMEOUT = 3000;

let resolveConfigReady;
const configReadyPromise = new Promise(resolve => resolveConfigReady = resolve);

// Ping a wisp server to check if it's responsive
async function pingServer(url) {
    return new Promise((resolve) => {
        const start = Date.now();
        try {
            const ws = new WebSocket(url);
            const timeout = setTimeout(() => {
                try { ws.close(); } catch {}
                resolve({ url, success: false, latency: null });
            }, PING_TIMEOUT);

            ws.onopen = () => {
                clearTimeout(timeout);
                const latency = Date.now() - start;
                try { ws.close(); } catch {}
                resolve({ url, success: true, latency });
            };

            ws.onerror = () => {
                clearTimeout(timeout);
                try { ws.close(); } catch {}
                resolve({ url, success: false, latency: null });
            };
        } catch {
            resolve({ url, success: false, latency: null });
        }
    });
}

// Update server health status
function updateServerHealth(url, success) {
    const health = serverHealth.get(url) || { consecutiveFailures: 0, successes: 0, lastSuccess: 0 };
    
    if (success) {
        health.consecutiveFailures = 0;
        health.successes++;
        health.lastSuccess = Date.now();
    } else {
        health.consecutiveFailures++;
    }
    
    serverHealth.set(url, health);
    return health;
}

function switchToServer(url, latency = null) {
    if (url === wispConfig.wispurl) return;
    
    console.log(`SW: Switching from ${wispConfig.wispurl} to ${url}`);
    wispConfig.wispurl = url;
    currentServerStartTime = Date.now();
    
    // Notify all clients
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage({
                type: 'wispChanged',
                url: url,
                name: wispConfig.servers.find(s => s.url === url)?.name || 'Unknown Server',
                latency: latency
            });
        });
    });

    // Reset connection to force reconnection with new server
    if (scramjet && scramjet.client) {
        scramjet.client = null;
    }
}

// Proactively check server health and switch if needed
async function proactiveServerCheck() {
    if (!wispConfig.autoswitch || !wispConfig.servers || wispConfig.servers.length === 0) return;

    const currentUrl = wispConfig.wispurl;
    
    // Ping all servers to get current health status
    const results = await Promise.all(
        wispConfig.servers.map(s => pingServer(s.url))
    );

    // Update health tracking
    results.forEach(r => updateServerHealth(r.url, r.success));

    // If current server is bad and we have a better option, switch
    const currentHealth = serverHealth.get(currentUrl);
    if (currentHealth && currentHealth.consecutiveFailures > 0) {
        const bestWorking = results
            .filter(r => r.success && r.url !== currentUrl)
            .sort((a, b) => a.latency - b.latency)[0];

        if (bestWorking) {
            switchToServer(bestWorking.url, bestWorking.latency);
        }
    }
}

self.addEventListener("message", ({ data }) => {
    if (data.type === "config") {
        if (data.wispurl) {
            wispConfig.wispurl = data.wispurl;
            console.log("SW: Received wispurl", data.wispurl);
            currentServerStartTime = Date.now();
        }
        if (data.servers && data.servers.length > 0) {
            wispConfig.servers = data.servers;
            console.log("SW: Received servers", data.servers.length);
            if (wispConfig.autoswitch) {
                setTimeout(proactiveServerCheck, 500);
            }
        }
        if (typeof data.autoswitch !== 'undefined') {
            wispConfig.autoswitch = data.autoswitch;
            if (wispConfig.autoswitch && wispConfig.servers?.length > 0) {
                setTimeout(proactiveServerCheck, 500);
            }
        }
        // Resolve config ready when we have at least wispurl
        if (wispConfig.wispurl && resolveConfigReady) {
            resolveConfigReady();
            resolveConfigReady = null;
        }
    } else if (data.type === "ping") {
        pingServer(wispConfig.wispurl).then(result => {
            self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({ type: 'pingResult', ...result });
                });
            });
        });
    }
});

self.addEventListener("fetch", (event) => {
    event.respondWith((async () => {
        // Check if request URL matches ad blocking patterns
        if (isAdBlocked(event.request.url)) {
            console.log("SW: Blocked ad request:", event.request.url);
            return new Response(new ArrayBuffer(0), { status: 204 });
        }

        await scramjet.loadConfig();
        if (scramjet.route(event)) {
            return scramjet.fetch(event);
        }
        return fetch(event.request);
    })());
});

scramjet.addEventListener("request", async (e) => {
    e.response = (async () => {
        try {
            await configReadyPromise;
        
        if (!wispConfig.wispurl) {
            return new Response("Wisp URL not configured", { status: 500 });
        }

        if (!scramjet.client) {
            const connection = new BareMux.BareMuxConnection(basePath + "bareworker.js");
            await connection.setTransport("https://cdn.jsdelivr.net/npm/@mercuryworkshop/epoxy-transport@2.1.28/dist/index.mjs", [{ wisp: wispConfig.wispurl }]);
            scramjet.client = connection;
        }

        const MAX_RETRIES = 2;
        let lastErr;

        for (let i = 0; i <= MAX_RETRIES; i++) {
            try {
                return await scramjet.client.fetch(e.url, {
                    method: e.method,
                    body: e.body,
                    headers: e.requestHeaders,
                    credentials: "include",
                    mode: e.mode === "cors" ? e.mode : "same-origin",
                    cache: e.cache,
                    redirect: "manual",
                    duplex: "half",
                });
            } catch (err) {
                lastErr = err;
                const errMsg = err.message.toLowerCase();
                const isRetryable = errMsg.includes("connect") ||
                    errMsg.includes("eof") ||
                    errMsg.includes("handshake") ||
                    errMsg.includes("reset");

                    if (!isRetryable || i === MAX_RETRIES || e.method !== 'GET') break;

                console.warn(`Scramjet retry ${i + 1}/${MAX_RETRIES} for ${e.url} due to: ${err.message}`);
                await new Promise(r => setTimeout(r, 500 * (i + 1)));
            }
        }

        // Update server health on failure
        updateServerHealth(wispConfig.wispurl, false);

        // Check if we should switch to a different server
        if (wispConfig.autoswitch && wispConfig.servers && wispConfig.servers.length > 1) {
            const currentHealth = serverHealth.get(wispConfig.wispurl);
            
            // Only switch if server has been unstable for a while
            if (currentHealth && currentHealth.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
                // Find a working server that isn't the current one
                for (const server of wispConfig.servers) {
                    if (server.url === wispConfig.wispurl) continue;
                    const serverH = serverHealth.get(server.url);
                    // Prefer servers with no failures or fewer failures
                    if (!serverH || serverH.consecutiveFailures < MAX_CONSECUTIVE_FAILURES) {
                        // Ping to verify it's actually working
                        const pingResult = await pingServer(server.url);
                        if (pingResult.success) {
                            console.log(`SW: Auto-switching to ${server.url} due to failures on current server`);
                            switchToServer(server.url, pingResult.latency);
                            break;
                        }
                    }
                }
            }
        }

            console.error("Scramjet Final Fetch Error:", lastErr);

            // Auto-refreshing error page for main document requests
            const isHtml = e.url.split('?')[0].split('#')[0].match(/\.(html|php|asp|aspx)$/i) || !e.url.split('?')[0].split('#')[0].includes('.');

            if (isHtml && e.method === 'GET') {
                return new Response(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Proxy Error - Auto Refreshing...</title>
                        <style>
                            body { background: #0a0a0a; color: #fff; font-family: 'Inter', sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
                            .card { padding: 40px; border-radius: 16px; background: #111; border: 1px solid #222; max-width: 450px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
                            .spinner { border: 3px solid rgba(255,255,255,0.1); border-top-color: #3b82f6; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px; }
                            @keyframes spin { to { transform: rotate(360deg); } }
                            h1 { font-size: 1.5rem; margin-bottom: 12px; font-weight: 600; color: #ef4444; }
                            p { color: #9ca3af; font-size: 0.95rem; line-height: 1.5; }
                            .error-code { font-family: monospace; background: #1a1a1a; padding: 4px 8px; border-radius: 4px; color: #f87171; font-size: 0.8rem; margin: 15px 0; display: inline-block; }
                        </style>
                        <script>
                            setTimeout(() => location.reload(), 3000);
                        </script>
                    </head>
                    <body>
                        <div class="card">
                            <div class="spinner"></div>
                            <h1>Site Unavailable</h1>
                            <p>We're having trouble connecting to the destination. This could be due to a server issue or an offline proxy.</p>
                            <div class="error-code">${lastErr.message}</div>
                            <p style="font-size: 0.85em; opacity: 0.7;">StaticsJ is automatically attempting to reconnect and find a working server...</p>
                        </div>
                    </body>
                    </html>
                `, { status: 502, headers: { 'Content-Type': 'text/html' } });
            }

            return new Response("Proxy Fetch Error: " + lastErr.message, { status: 502 });
        } catch (fatalErr) {
            console.error("SW: Fatal fetch error:", fatalErr);
            return new Response("Fatal Proxy Error: " + fatalErr.message, { status: 500 });
        }
    })();
});
