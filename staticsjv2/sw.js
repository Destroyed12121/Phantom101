
const ADBLOCK = {
    blocked: [
<<<<<<< HEAD
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
        "*.indexexchange.com*", // Spread out
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
    ]
=======
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
>>>>>>> b354220fb359bebcfd34b81e8e9fc8a9219a9bac
};

function isAdBlocked(url) {
    const urlStr = url.toString();
    for (const pattern of ADBLOCK.blocked) {
        let regexPattern = pattern
            .replace(/\*/g, '.*')
            .replace(/\./g, '\\.')
            .replace(/\?/g, '\\?');
        const regex = new RegExp('^' + regexPattern + '$', 'i');
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

<<<<<<< HEAD
// wisp
=======
// Wisp configuration - receives from script.js via postMessage
>>>>>>> b354220fb359bebcfd34b81e8e9fc8a9219a9bac
let wispConfig = {
    wispurl: null,
    servers: [],
    autoswitch: true
};

<<<<<<< HEAD
let serverHealth = new Map();
let currentServerStartTime = null;
const MAX_CONSECUTIVE_FAILURES = 2;
const MAX_RETRIES = 3;
=======
// Server health tracking for autoswitching
let serverHealth = new Map();
let currentServerStartTime = null;
const MAX_CONSECUTIVE_FAILURES = 2;
>>>>>>> b354220fb359bebcfd34b81e8e9fc8a9219a9bac
const PING_TIMEOUT = 3000;

let resolveConfigReady;
const configReadyPromise = new Promise(resolve => resolveConfigReady = resolve);

<<<<<<< HEAD
=======
// Ping a wisp server to check if it's responsive
>>>>>>> b354220fb359bebcfd34b81e8e9fc8a9219a9bac
async function pingServer(url) {
    return new Promise((resolve) => {
        const start = Date.now();
        try {
            const ws = new WebSocket(url);
            const timeout = setTimeout(() => {
<<<<<<< HEAD
                try { ws.close(); } catch { }
=======
                try { ws.close(); } catch {}
>>>>>>> b354220fb359bebcfd34b81e8e9fc8a9219a9bac
                resolve({ url, success: false, latency: null });
            }, PING_TIMEOUT);

            ws.onopen = () => {
                clearTimeout(timeout);
                const latency = Date.now() - start;
<<<<<<< HEAD
                try { ws.close(); } catch { }
=======
                try { ws.close(); } catch {}
>>>>>>> b354220fb359bebcfd34b81e8e9fc8a9219a9bac
                resolve({ url, success: true, latency });
            };

            ws.onerror = () => {
                clearTimeout(timeout);
<<<<<<< HEAD
                try { ws.close(); } catch { }
=======
                try { ws.close(); } catch {}
>>>>>>> b354220fb359bebcfd34b81e8e9fc8a9219a9bac
                resolve({ url, success: false, latency: null });
            };
        } catch {
            resolve({ url, success: false, latency: null });
        }
    });
}

<<<<<<< HEAD
function updateServerHealth(url, success) {
    const health = serverHealth.get(url) || { consecutiveFailures: 0, successes: 0, lastSuccess: 0 };

=======
// Update server health status
function updateServerHealth(url, success) {
    const health = serverHealth.get(url) || { consecutiveFailures: 0, successes: 0, lastSuccess: 0 };
    
>>>>>>> b354220fb359bebcfd34b81e8e9fc8a9219a9bac
    if (success) {
        health.consecutiveFailures = 0;
        health.successes++;
        health.lastSuccess = Date.now();
    } else {
        health.consecutiveFailures++;
    }
<<<<<<< HEAD

=======
    
>>>>>>> b354220fb359bebcfd34b81e8e9fc8a9219a9bac
    serverHealth.set(url, health);
    return health;
}

<<<<<<< HEAD
function switchToServer(url, latency = null, reason = 'Connection unstable') {
    if (url === wispConfig.wispurl) return;

    console.log(`SW: Switching from ${wispConfig.wispurl} to ${url}`);
    wispConfig.wispurl = url;
    currentServerStartTime = Date.now();

=======
function switchToServer(url, latency = null) {
    if (url === wispConfig.wispurl) return;
    
    console.log(`SW: Switching from ${wispConfig.wispurl} to ${url}`);
    wispConfig.wispurl = url;
    currentServerStartTime = Date.now();
    
    // Notify all clients
>>>>>>> b354220fb359bebcfd34b81e8e9fc8a9219a9bac
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage({
                type: 'wispChanged',
                url: url,
                name: wispConfig.servers.find(s => s.url === url)?.name || 'Unknown Server',
<<<<<<< HEAD
                latency: latency,
                reason: reason
=======
                latency: latency
>>>>>>> b354220fb359bebcfd34b81e8e9fc8a9219a9bac
            });
        });
    });

<<<<<<< HEAD
=======
    // Reset connection to force reconnection with new server
>>>>>>> b354220fb359bebcfd34b81e8e9fc8a9219a9bac
    if (scramjet && scramjet.client) {
        scramjet.client = null;
    }
}

<<<<<<< HEAD
=======
// Proactively check server health and switch if needed
>>>>>>> b354220fb359bebcfd34b81e8e9fc8a9219a9bac
async function proactiveServerCheck() {
    if (!wispConfig.autoswitch || !wispConfig.servers || wispConfig.servers.length === 0) return;

    const currentUrl = wispConfig.wispurl;
<<<<<<< HEAD

=======
    
    // Ping all servers to get current health status
>>>>>>> b354220fb359bebcfd34b81e8e9fc8a9219a9bac
    const results = await Promise.all(
        wispConfig.servers.map(s => pingServer(s.url))
    );

<<<<<<< HEAD
    results.forEach(r => updateServerHealth(r.url, r.success));

=======
    // Update health tracking
    results.forEach(r => updateServerHealth(r.url, r.success));

    // If current server is bad and we have a better option, switch
>>>>>>> b354220fb359bebcfd34b81e8e9fc8a9219a9bac
    const currentHealth = serverHealth.get(currentUrl);
    if (currentHealth && currentHealth.consecutiveFailures > 0) {
        const bestWorking = results
            .filter(r => r.success && r.url !== currentUrl)
            .sort((a, b) => a.latency - b.latency)[0];

        if (bestWorking) {
<<<<<<< HEAD
            switchToServer(bestWorking.url, bestWorking.latency, "Previous server was unresponsive");
=======
            switchToServer(bestWorking.url, bestWorking.latency);
>>>>>>> b354220fb359bebcfd34b81e8e9fc8a9219a9bac
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
<<<<<<< HEAD
=======
        // Resolve config ready when we have at least wispurl
>>>>>>> b354220fb359bebcfd34b81e8e9fc8a9219a9bac
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
<<<<<<< HEAD
=======
        // Check if request URL matches ad blocking patterns
>>>>>>> b354220fb359bebcfd34b81e8e9fc8a9219a9bac
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
        await configReadyPromise;
<<<<<<< HEAD

=======
        
>>>>>>> b354220fb359bebcfd34b81e8e9fc8a9219a9bac
        if (!wispConfig.wispurl) {
            return new Response("Wisp URL not configured", { status: 500 });
        }

        if (!scramjet.client) {
            const connection = new BareMux.BareMuxConnection(basePath + "bareworker.js");
            await connection.setTransport("https://cdn.jsdelivr.net/npm/@mercuryworkshop/epoxy-transport@2.1.28/dist/index.mjs", [{ wisp: wispConfig.wispurl }]);
<<<<<<< HEAD
            scramjet.client = new BareMux.BareClient();
        }

=======
            scramjet.client = connection;
        }

        const MAX_RETRIES = 2;
>>>>>>> b354220fb359bebcfd34b81e8e9fc8a9219a9bac
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

<<<<<<< HEAD
        updateServerHealth(wispConfig.wispurl, false);

        if (wispConfig.autoswitch && wispConfig.servers && wispConfig.servers.length > 1) {
            const currentHealth = serverHealth.get(wispConfig.wispurl);

            // Only switch if server has been unstable for a while
            if (currentHealth && currentHealth.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
                for (const server of wispConfig.servers) {
                    if (server.url === wispConfig.wispurl) continue;
                    const serverH = serverHealth.get(server.url);
                    if (!serverH || serverH.consecutiveFailures < MAX_CONSECUTIVE_FAILURES) {
=======
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
>>>>>>> b354220fb359bebcfd34b81e8e9fc8a9219a9bac
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
        return new Response("Scramjet Fetch Error: " + lastErr.message, { status: 502 });
    })();
<<<<<<< HEAD
});
=======
});
>>>>>>> b354220fb359bebcfd34b81e8e9fc8a9219a9bac
