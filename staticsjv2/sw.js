
const ADBLOCK = {
    blocked: [
        "*youtube.com/get_video_info?*adformat=*",
        "*googlevideo.com/videoplayback*",
        "*youtube.com/api/stats/ads/*",
        "*youtube.com/pagead/*",
        "*youtube.com/api/stats*",
        "*youtube.com/get_midroll*",
        "*youtube.com/ptracking*",
        "*.facebook.com/ads/*",
        "*youtube.com/youtubei/v1/player*",
        "*youtube.com/s/player*",
        "*youtube.com/api/timedtext*",
        "*.facebook.com/tr/*",
        "*.fbcdn.net/ads/*",
        "*graph.facebook.com/ads/*",
        "*graph.facebook.com/pixel*",
        "*ads-api.twitter.com/*",
        "*analytics.twitter.com/*",
        "*.twitter.com/i/ads/*",
        "*.ads.yahoo.com*",
        "*.advertising.com*",
        "*.adtechus.com*",
        "*.oath.com*",
        "*.verizonmedia.com*",
        "*.amazon-adsystem.com*",
        "*aax.amazon-adsystem.com/*",
        "*c.amazon-adsystem.com/*",
        "*.adnxs.com*",
        "*.adnxs-simple.com*",
        "*ab.adnxs.com/*",
        "*doubleclick.net*",
        "*googlesyndication.com*",
        "*googleadservices.com*",
        "*.rubiconproject.com*",
        "*.magnite.com*",
        "*.pubmatic.com*",
        "*ads.pubmatic.com/*",
        "*.criteo.com*",
        "*bidder.criteo.com/*",
        "*static.criteo.net/*",
        "*.openx.net*",
        "*.openx.com*",
        "*.indexexchange.com*",
        "*.casalemedia.com*",
        "*.indexexchange.com*",
        "*.adcolony.com*",
        "*.chartboost.com*",
        "*.unityads.unity3d.com*",
        "*.inmobiweb.com*",
        "*.tapjoy.com*",
        "*.applovin.com*",
        "*.vungle.com*",
        "*.ironsrc.com*",
        "*.fyber.com*",
        "*.smaato.net*",
        "*.supersoniads.com*",
        "*.startappservice.com*",
        "*.airpush.com*",
        "*.outbrain.com*",
        "*.taboola.com*",
        "*.revcontent.com*",
        "*.zedo.com*",
        "*.mgid.com*",
        "*/ads/*",
        "*/adserver/*",
        "*/adclick/*",
        "*/banner_ads/*",
        "*/sponsored/*",
        "*/promotions/*",
        "*/tracking/ads/*",
        "*/promo/*",
        "*/affiliates/*",
        "*/partnerads/*",
        "*moatads.com*",
        "*adsafeprotected.com*",
        "*chartbeat.com*",
        "*scorecardresearch.com*",
        "*quantserve.com*",
        "*krxd.net*",
        "*demdex.net*"
    ],
    regexCache: [],
    exactCache: new Set()
};

// Pre-compile regexes for performance
(function compileAdBlock() {
    for (const pattern of ADBLOCK.blocked) {
        if (!pattern.includes('*') && !pattern.includes('?')) {
            ADBLOCK.exactCache.add(pattern);
        } else {
            let regexPattern = pattern
                .replace(/\./g, '\\.')
                .replace(/\*/g, '.*')
                .replace(/\?/g, '\\?');
            ADBLOCK.regexCache.push(new RegExp('^' + regexPattern + '$', 'i'));
        }
    }
})();

function isAdBlocked(url) {
    const urlStr = url.toString();
    // 1. Fast path: Exact match
    if (ADBLOCK.exactCache.has(urlStr)) return true;

    // 2. Slow path: Regex
    for (const regex of ADBLOCK.regexCache) {
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
        wasm: "https://cdn.jsdelivr.net/gh/Destroyed12121/Staticsj@main/JS/scramjet.wasm",
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

// wisp
let wispConfig = {
    wispurl: null,
    servers: [],
    autoswitch: true
};

let serverHealth = new Map();
let currentServerStartTime = null;
const MAX_CONSECUTIVE_FAILURES = 2;
const MAX_RETRIES = 3;
const PING_TIMEOUT = 3000;

let resolveConfigReady;
const BATCH_INTERVAL = 100; // ms
let messageQueue = [];
let batchTimeout = null;

function flushMessageQueue() {
    if (messageQueue.length === 0) return;
    const queueToSend = [...messageQueue];
    messageQueue = [];

    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            // Batch messages into a single postMessage if possible, or just send array
            // To keep compatibility with existing listener, we'll send them individually but in a tight loop
            // OR change the protocol. For now, let's keep protocol but debounce the IPC call frequency
            // Actually, sending massive amount of messages is utilizing the thread.
            // Let's change the strategy: Update progress significantly less often.
            // But we need the URLs. 
            // Better: Send a "batch-resource-loaded" message
            client.postMessage({
                type: 'batch-resource-loaded',
                resources: queueToSend
            });
        });
    });
}

function queueResourceLoading(url, status) {
    messageQueue.push({ url, status });
    if (!batchTimeout) {
        batchTimeout = setTimeout(() => {
            flushMessageQueue();
            batchTimeout = null;
        }, BATCH_INTERVAL);
    }
}


const configReadyPromise = new Promise(resolve => {
    resolveConfigReady = resolve;
    // Fallback: If no config received within 3 seconds, proceed with defaults to prevent blocking
    setTimeout(() => {
        if (resolveConfigReady) {
            console.warn("SW: Config timeout, proceeding with defaults");
            resolve();
            resolveConfigReady = null;
        }
    }, 3000);
});

async function pingServer(url) {
    return new Promise((resolve) => {
        const start = Date.now();
        try {
            const ws = new WebSocket(url);
            const timeout = setTimeout(() => {
                try { ws.close(); } catch { }
                resolve({ url, success: false, latency: null });
            }, PING_TIMEOUT);

            ws.onopen = () => {
                clearTimeout(timeout);
                const latency = Date.now() - start;
                try { ws.close(); } catch { }
                resolve({ url, success: true, latency });
            };

            ws.onerror = () => {
                clearTimeout(timeout);
                try { ws.close(); } catch { }
                resolve({ url, success: false, latency: null });
            };
        } catch {
            resolve({ url, success: false, latency: null });
        }
    });
}

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

function switchToServer(url, latency = null, reason = 'Connection unstable') {
    if (url === wispConfig.wispurl) return;

    console.log(`SW: Switching from ${wispConfig.wispurl} to ${url}`);
    wispConfig.wispurl = url;
    currentServerStartTime = Date.now();

    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage({
                type: 'wispChanged',
                url: url,
                name: wispConfig.servers.find(s => s.url === url)?.name || 'Unknown Server',
                latency: latency,
                reason: reason
            });
        });
    });

    if (scramjet && scramjet.client) {
        scramjet.client = null;
    }
}

async function proactiveServerCheck() {
    if (!wispConfig.autoswitch || !wispConfig.servers || wispConfig.servers.length === 0) return;

    const currentUrl = wispConfig.wispurl;

    const results = await Promise.all(
        wispConfig.servers.map(s => pingServer(s.url))
    );

    results.forEach(r => updateServerHealth(r.url, r.success));

    const currentHealth = serverHealth.get(currentUrl);
    if (currentHealth && currentHealth.consecutiveFailures > 0) {
        // Re-check config after async operation to prevent race conditions
        if (!wispConfig.autoswitch || wispConfig.wispurl !== currentUrl) return;

        const bestWorking = results
            .filter(r => r.success && r.url !== currentUrl)
            .sort((a, b) => a.latency - b.latency)[0];

        if (bestWorking) {
            switchToServer(bestWorking.url, bestWorking.latency, "Previous server was unresponsive");
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
        if (isAdBlocked(event.request.url)) {
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
        await configReadyPromise;

        if (!wispConfig.wispurl) {
            return new Response("Wisp URL not configured", { status: 500 });
        }

        if (!scramjet.client) {
            // Use a promise lock to prevent parallel re-initialization (Thundering Herd)
            if (!self.clientInitPromise) {
                self.clientInitPromise = (async () => {
                    if (!self.sharedConnection) {
                        self.sharedConnection = new BareMux.BareMuxConnection(basePath + "bareworker.js");
                    }
                    await self.sharedConnection.setTransport("https://cdn.jsdelivr.net/npm/@mercuryworkshop/epoxy-transport@2.1.28/dist/index.mjs", [{ wisp: wispConfig.wispurl }]);
                    scramjet.client = new BareMux.BareClient();
                    self.clientInitPromise = null;
                })();
            }
            await self.clientInitPromise;
        }

        let lastErr;

        for (let i = 0; i <= MAX_RETRIES; i++) {
            try {
                const response = await scramjet.client.fetch(e.url, {
                    method: e.method,
                    body: e.body,
                    headers: e.requestHeaders,
                    credentials: "include",
                    mode: e.mode === "cors" ? e.mode : "same-origin",
                    cache: e.cache,
                    redirect: "manual",
                    duplex: "half",
                });

                // Real resource tracking for loading bar - Batched
                queueResourceLoading(e.url, response.status);

                // CRITICAL FIX: Mark server as healthy on success
                updateServerHealth(wispConfig.wispurl, true);

                return response;
            } catch (err) {
                lastErr = err;
                const errMsg = err.message.toLowerCase();
                const isRetryable = errMsg.includes("connect") ||
                    errMsg.includes("eof") ||
                    errMsg.includes("handshake") ||
                    errMsg.includes("reset");

                if (!isRetryable || i === MAX_RETRIES) break;
                // Allow non-GET retries ONLY for connection handshake/reset errors
                if (e.method !== 'GET' && !errMsg.includes("handshake") && !errMsg.includes("reset") && !errMsg.includes("eof")) break;

                console.warn(`Scramjet retry ${i + 1}/${MAX_RETRIES} for ${e.url} due to: ${err.message}`);
                await new Promise(r => setTimeout(r, 500 * (i + 1)));
            }
        }

        updateServerHealth(wispConfig.wispurl, false);

        if (wispConfig.autoswitch && wispConfig.servers && wispConfig.servers.length > 1) {
            const currentHealth = serverHealth.get(wispConfig.wispurl);

            // Only switch if server has been unstable for a while
            if (currentHealth && currentHealth.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
                // Use parallel pings to find the best server efficiently
                const otherServers = wispConfig.servers.filter(s => s.url !== wispConfig.wispurl);
                try {
                    const pingResults = await Promise.all(otherServers.map(s => pingServer(s.url)));
                    const best = pingResults.filter(r => r.success).sort((a, b) => a.latency - b.latency)[0];

                    if (best) {
                        console.log(`SW: Auto-switching to ${best.url} due to failures on current server`);
                        switchToServer(best.url, best.latency);
                    }
                } catch (err) {
                    console.error("SW: Failed to fallback", err);
                }
            }
        }

        console.error("Scramjet Final Fetch Error:", lastErr);
        return new Response("Scramjet Fetch Error: " + lastErr.message, { status: 502 });
    })();
});
