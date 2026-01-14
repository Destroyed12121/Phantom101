
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

let wispConfig = {
    wispurl: "wss://dash.goip.de/wisp/" // Default fallback
};

let bareClientReady = false;
let bareClient;

let initPromise = null;

async function ensureBareClient() {
    if (bareClientReady && bareClient) return bareClient;
    if (initPromise) return initPromise;

    initPromise = (async () => {
        try {
            const connection = new BareMux.BareMuxConnection(basePath + "bareworker.js");
            const wispUrl = wispConfig.wispurl;
            console.log("SW: Setting transport to", wispUrl);

            await connection.setTransport("https://cdn.jsdelivr.net/npm/@mercuryworkshop/epoxy-transport@2.1.28/dist/index.mjs", [{ wisp: wispUrl }]);

            bareClient = new BareMux.BareClient();
            bareClientReady = true;
            return bareClient;
        } catch (err) {
            console.error("SW: Failed to set transport:", err);
            // Fallback to a default if it failed
            if (wispConfig.wispurl !== "wss://dash.goip.de/wisp/") {
                wispConfig.wispurl = "wss://dash.goip.de/wisp/";
                return await ensureBareClient();
            }
            throw err;
        } finally {
            initPromise = null;
        }
    })();

    return initPromise;
}

self.addEventListener("fetch", (event) => {
    event.respondWith((async () => {
        await scramjet.loadConfig();
        if (scramjet.route(event)) {
            return scramjet.fetch(event);
        }
        return fetch(event.request);
    })());
});

self.addEventListener("message", ({ data }) => {
    if (data.type === "config" && data.wispurl) {
        if (wispConfig.wispurl !== data.wispurl) {
            wispConfig.wispurl = data.wispurl;
            bareClientReady = false;
            bareClient = null;
            console.log("SW: Wisp config updated", data.wispurl);
        }
    }
});

scramjet.addEventListener("request", async (e) => {
    e.response = (async () => {
        try {
            const client = await ensureBareClient();
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

                    return await client.fetch(e.url, {
                        method: e.method,
                        body: body,
                        headers: headers,
                        credentials: "include",
                        mode: e.mode === "cors" ? e.mode : "same-origin",
                        cache: e.cache,
                        redirect: "manual",
                    });
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
                        errMsg.includes("tls"); // Added TLS specific retry

                    if (!isRetryable || i === MAX_RETRIES || e.method !== 'GET') break;

                    console.warn(`Scramjet retry ${i + 1}/${MAX_RETRIES} for ${e.url} due to: ${err.message}`);
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
                            body { background: #0a0a0a; color: #fff; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
                            .card { padding: 30px; border-radius: 12px; background: #111; border: 1px solid #222; max-width: 400px; }
                            .spinner { border: 3px solid #333; border-top-color: #fff; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px; }
                            @keyframes spin { to { transform: rotate(360deg); } }
                            h1 { font-size: 1.2rem; margin-bottom: 10px; }
                            p { color: #888; font-size: 0.9rem; }
                        </style>
                        <script>
                            setTimeout(() => location.reload(), 2000);
                        </script>
                    </head>
                    <body>
                        <div class="card">
                            <div class="spinner"></div>
                            <h1>Connection Error</h1>
                            <p>${lastErr.message}</p>
                            <p style="font-size: 0.8em; margin-top: 20px;">The proxy encountered an issue. Refreshing automatically...</p>
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
