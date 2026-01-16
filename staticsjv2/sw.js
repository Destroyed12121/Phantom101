
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
self.addEventListener('activate', (e) => e.waitUntil(Promise.all([
    self.clients.claim(),
    cleanupImageCache()
])));

const IMAGE_CACHE_NAME = 'phantom-images-cache-v1';
const IMAGE_CACHE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

let wispConfig = {
    wispurl: "wss://wisp.rhw.one/wisp/", // Default
    servers: [
        { name: "Rhw's Wisp", url: "wss://wisp.rhw.one/wisp/" },
        { name: "DaydreamX's Wisp", url: "wss://dash.goip.de/wisp/" },
        { name: "Space's Wisp", url: "wss://register.goip.it/wisp/" }
    ],
    autoswitch: true
};

// Check if URL is an image
function isImageRequest(url) {
    try {
        const extension = url.split('?')[0].split('#')[0].split('.').pop().toLowerCase();
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico', 'avif', 'apng'];
        return imageExtensions.includes(extension) || url.includes('image') || url.includes('img');
    } catch (e) {
        return false;
    }
}

// Clean up old/invalid cache entries
async function cleanupImageCache() {
    try {
        const cache = await caches.open(IMAGE_CACHE_NAME);
        const requests = await cache.keys();
        const now = new Date();
        
        let removedCount = 0;
        for (const request of requests) {
            try {
                const response = await cache.match(request);
                if (!response) continue;
                
                const cacheDate = new Date(response.headers.get('date') || Date.now());
                if (now - cacheDate > IMAGE_CACHE_MAX_AGE) {
                    await cache.delete(request);
                    removedCount++;
                }
            } catch (e) {
                // Invalid entry, remove it
                await cache.delete(request);
                removedCount++;
            }
        }
        
        if (removedCount > 0) {
            console.log(`Cache cleanup: ${removedCount} old entries removed from image cache`);
        }
    } catch (e) {
        console.error('Cache cleanup error:', e);
    }
}

// Run cache cleanup periodically and on activate
setInterval(cleanupImageCache, 24 * 60 * 60 * 1000); // Daily cleanup

// Get cached image response if valid
async function getCachedImage(url) {
    try {
        const cache = await caches.open(IMAGE_CACHE_NAME);
        const cached = await cache.match(url);
        
        if (cached) {
            const cacheDate = new Date(cached.headers.get('date') || Date.now());
            const now = new Date();
            
            // Check if cache is still valid
            if (now - cacheDate < IMAGE_CACHE_MAX_AGE) {
                return cached;
            } else {
                // Cache expired, delete it
                await cache.delete(url);
                console.log('Image cache expired, removing:', url);
            }
        }
    } catch (e) {
        console.warn('Error checking image cache:', e);
    }
    return null;
}

// Cache image response
async function cacheImage(url, response) {
    try {
        if (!response || !response.ok) return;
        
        const cache = await caches.open(IMAGE_CACHE_NAME);
        // Add current date as a custom header for cache age tracking
        const headers = new Headers(response.headers);
        headers.set('date', new Date().toUTCString());
        
        const responseToCache = new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: headers
        });
        
        await cache.put(url, responseToCache.clone());
        console.log('Image cached successfully:', url);
    } catch (e) {
        console.warn('Error caching image:', e);
    }
}

const ADBLOCK = {
    blocked: [
        "*.googlevideo.com/videoplayback*ctier=*",
        "youtube.com/get_video_info*adformat=*",
        "youtube.com/api/stats/ads*",
        "youtube.com/pagead/*",
        "youtube.com/api/stats/*ad*",
        "*.youtube.com/get_midroll_*",
        "*.youtube.com/ptracking*",

        "*.facebook.com/ads/*",
        "*.facebook.com/tr/*",
        "*.fbcdn.net/ads/*",
        "graph.facebook.com/ads/*",

        "ads-api.twitter.com/*",
        "analytics.twitter.com/*",
        "*.twitter.com/i/ads/*",

        "*.ads.yahoo.com",
        "*.advertising.com",
        "*.adtechus.com",
        "*.amazon-adsystem.com",
        "*.adnxs.com",
        "*.doubleclick.net/*",
        "*.googlesyndication.com/*",

        "*.rubiconproject.com",
        "*.pubmatic.com",
        "*.criteo.com",
        "*.openx.net",
        "*.taboola.com",
        "*.outbrain.com",
        "*.moatads.com",

        "*.unityads.unity3d.com",
        "*.unityads.unity3d.com/*",

        "*/ads/*",
        "*/adserver/*",
        "*/banner_ads/*",
        "*/promo/*"
    ]
};

function shouldBlock(url) {
    return ADBLOCK.blocked.some(pattern => {
        try {
            const regexStr = pattern
                .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape regex chars
                .replace(/\*/g, '.*'); // Convert * to .*
            return new RegExp(regexStr, 'i').test(url);
        } catch (e) { return false; }
    });
}

let bareClientReady = false;
let bareClient;
let initPromise = null;

async function notifyClients(type, data) {
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
        // Skip notifications if the client is the embed page
        if (client.url.includes('embed.html') && (type === 'wispChanged' || type === 'wispError')) {
            return;
        }
        client.postMessage({ type, ...data });
    });
}
//...
self.addEventListener("message", ({ data }) => {
    if (data.type === "config") {
        if (data.wispurl && wispConfig.wispurl !== data.wispurl) {
            wispConfig.wispurl = data.wispurl;
            bareClientReady = false;
            bareClient = null;
            console.log("SW: Wisp config updated", data.wispurl);
        }
        if (data.servers) {
            wispConfig.servers = data.servers;
        }
        if (typeof data.autoswitch !== 'undefined') {
            wispConfig.autoswitch = data.autoswitch;
        }
    }
});

const deadServerCache = new Map();
const DEAD_SERVER_TTL = 30000; // 30 seconds

async function ensureBareClient(forceSwitch = false) {
    if (bareClientReady && bareClient && !forceSwitch) return bareClient;
    if (initPromise && !forceSwitch) return initPromise;

    if (forceSwitch) {
        bareClientReady = false;
        bareClient = null;
    }

    initPromise = (async () => {
        const now = Date.now();

        let candidates = [...wispConfig.servers];

        // Rotate candidates based on current wispurl to ensure A->B->C->A rotation
        const currentIdx = candidates.findIndex(s => s.url === wispConfig.wispurl);
        if (currentIdx > -1) {
            const before = candidates.slice(0, currentIdx);
            const after = candidates.slice(currentIdx + 1);
            const current = candidates[currentIdx];

            if (forceSwitch) {
                // If we are forcing a switch (failed), put current at the end, start with next
                candidates = [...after, ...before, current];
            } else {
                // If initializing, start with current
                candidates = [current, ...after, ...before];
            }
        } else if (wispConfig.wispurl) {
            const custom = { name: "Custom", url: wispConfig.wispurl };
            if (forceSwitch) candidates.push(custom);
            else candidates.unshift(custom);
        }

        // Filter out dead servers (unless we have no other choice)
        let tryServers = candidates.filter(s => {
            if (s.url === wispConfig.wispurl && !forceSwitch) return true;
            const deadUntil = deadServerCache.get(s.url) || 0;
            return now > deadUntil;
        });

        if (tryServers.length === 0) {
            deadServerCache.clear();
            tryServers = [...candidates];
        }

        // If autoswitch is disabled, only try the first one (which is the selected one)
        if (!wispConfig.autoswitch && tryServers.length > 0) {
            tryServers = [tryServers[0]];
        }

        let lastErr;
        for (const server of tryServers) {
            try {
                const connection = new BareMux.BareMuxConnection(basePath + "bareworker.js");
                console.log(`SW: Attempting transport to ${server.name} (${server.url})`);

                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Transport Init Timeout")), 2000)
                );

                await Promise.race([
                    connection.setTransport("https://cdn.jsdelivr.net/npm/@mercuryworkshop/epoxy-transport@2.1.28/dist/index.mjs", [{ wisp: server.url }]),
                    timeoutPromise
                ]);

                // Test connection
                const testClient = new BareMux.BareClient();

                if (server.url !== wispConfig.wispurl) {
                    console.log(`SW: Autoswitched from ${wispConfig.wispurl} to ${server.url}`);
                    wispConfig.wispurl = server.url;
                    notifyClients("wispChanged", { url: server.url, name: server.name });
                }

                bareClient = testClient;
                bareClientReady = true;
                return bareClient;
            } catch (err) {
                console.error(`SW: Failed to set transport to ${server.url}:`, err);
                deadServerCache.set(server.url, Date.now() + DEAD_SERVER_TTL);
                lastErr = err;

                // If autoswitch is off, break loop
                if (!wispConfig.autoswitch) break;
            }
        }

        console.error("SW: All wisp servers failed.");
        notifyClients("wispError", { message: "All proxy servers are offline." });
        throw lastErr || new Error("All Wisp servers failed");
    })();

    try {
        const result = await initPromise;
        return result;
    } finally {
        initPromise = null;
    }
}

self.addEventListener("fetch", (event) => {
    event.respondWith((async () => {
        const url = event.request.url;

        // Check image cache for direct image requests
        if (isImageRequest(url) && event.request.method === 'GET') {
            const cachedResponse = await getCachedImage(url);
            if (cachedResponse) {
                console.log('Serving image from cache (fetch handler):', url);
                return cachedResponse;
            }
        }

        if (shouldBlock(url)) {
            console.log("ADBLOCK: Blocked", url);
            return new Response(null, { status: 403, statusText: "Blocked by AdBlock" });
        }

        await scramjet.loadConfig();
        if (scramjet.route(event)) {
            return scramjet.fetch(event);
        }
        return fetch(event.request);
    })());
});

self.addEventListener("message", ({ data }) => {
    if (data.type === "config") {
        if (data.wispurl && wispConfig.wispurl !== data.wispurl) {
            wispConfig.wispurl = data.wispurl;
            bareClientReady = false;
            bareClient = null;
            console.log("SW: Wisp config updated", data.wispurl);
        }
        if (data.servers) {
            wispConfig.servers = data.servers;
        }
    }
});

scramjet.addEventListener("request", async (e) => {
    e.response = (async () => {
        try {
            // Check cache for image requests first
            if (isImageRequest(e.url) && e.method === 'GET') {
                const cachedResponse = await getCachedImage(e.url);
                if (cachedResponse) {
                    console.log('Serving image from cache:', e.url);
                    return cachedResponse;
                }
            }

            let client = await ensureBareClient();
            const MAX_RETRIES = 3; // Increased retries
            let lastErr;

            // BareClient expects headers as an iterable or plain object.
            // If Scramjet provides a plain object, some versions of bare-mux might fail iteration.
            // We'll normalize it to a plain object just for safety, or a Map if needed.
            const headers = (e.requestHeaders instanceof Headers)
                ? Object.fromEntries(e.requestHeaders.entries())
                : (e.requestHeaders || {});

            for (let i = 0; i <= MAX_RETRIES; i++) {
                try {
                    let body = e.body;
                    if (body && body instanceof ReadableStream && i > 0) {
                        if (e.method !== 'GET') break;
                    }

                    const response = await client.fetch(e.url, {
                        method: e.method,
                        body: body,
                        headers: headers,
                        credentials: "include",
                        mode: e.mode === "cors" ? e.mode : "same-origin",
                        cache: e.cache,
                        redirect: "manual",
                    });

                    // Cache successful image responses
                    if (isImageRequest(e.url) && e.method === 'GET' && response.ok) {
                        cacheImage(e.url, response);
                    }

                    return response;
                } catch (err) {
                    lastErr = err;
                    const errMsg = err.message.toLowerCase();
                    const isRetryable =
                        errMsg.includes("connect") ||
                        errMsg.includes("eof") ||
                        errMsg.includes("handshake") ||
                        errMsg.includes("reset") ||
                        errMsg.includes("aborted") ||
                        errMsg.includes("timeout") ||
                        errMsg.includes("tls");

                    if (!isRetryable || i === MAX_RETRIES || e.method !== 'GET') break;

                    console.warn(`Scramjet retry ${i + 1}/${MAX_RETRIES} for ${e.url} due to: ${err.message}`);

                    // If it's a connection error, try switching wisp server
                    if (errMsg.includes("connect") || errMsg.includes("handshake") || errMsg.includes("timeout")) {
                        console.log("SW: Connection error detected, attempting autoswitch...");
                        try {
                            const newClient = await ensureBareClient(true);
                            if (newClient) {
                                client = newClient;
                            }
                        } catch (switchErr) {
                            console.error("SW: Autoswitch during retry failed:", switchErr);
                        }
                    }

                    await new Promise(r => setTimeout(r, 800 * (i + 1)));
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


// Implement WebSocket proxying for Scramjet
scramjet.addEventListener("websocket", async (e) => {
    const client = await ensureBareClient();
    const { remote, protocols, onopen, onmessage, onclose, onerror } = e;

    try {
        const [send, close] = client.connect(
            remote,
            protocols,
            (protocol) => onopen(protocol),
            (data) => onmessage(data),
            (code, reason) => onclose(code, reason),
            (error) => onerror(error)
        );
        e.respond(
            (data) => send(data),
            (code, reason) => close(code, reason)
        );
    } catch (err) {
        console.error("Scramjet WebSocket Error:", err);
        onerror(err);
    }
});
