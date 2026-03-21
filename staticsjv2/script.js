const SITE_CONFIG = window.SITE_CONFIG || {};
const DEFAULT_WISP = SITE_CONFIG.defaultWisp || "wss://glseries.net/wisp/";
const WISP_SERVERS = SITE_CONFIG.wispServers || [];

const BareMux = window.BareMux || { BareMuxConnection: class { setTransport() { } } };
let sharedScramjet = null;
let sharedConnection = null;
let sharedConnectionReady = false;

let tabs = [];
let activeTabId = null;
let nextTabId = 1;

function getStoredWisps() {
    return window.Settings?.get('customWisps') || [];
}

function getAllWispServers() {
    return [...WISP_SERVERS, ...getStoredWisps()];
}

async function pingWispServer(url, timeout = 1000) {
    return new Promise(resolve => {
        const start = Date.now();
        try {
            const ws = new WebSocket(url);
            const timer = setTimeout(() => {
                try { ws.close(); } catch { }
                resolve({ url, success: false, latency: null });
            }, timeout);

            ws.onopen = () => {
                clearTimeout(timer);
                const latency = Date.now() - start;
                try { ws.close(); } catch { }
                resolve({ url, success: true, latency });
            };

            ws.onerror = () => {
                clearTimeout(timer);
                try { ws.close(); } catch { }
                resolve({ url, success: false, latency: null });
            };
        } catch {
            resolve({ url, success: false, latency: null });
        }
    });
}

async function findBestWispServer() {
    const servers = getAllWispServers();
    const currentUrl = window.Settings?.get('proxServer') || DEFAULT_WISP;

    const results = await Promise.all(servers.map(s => pingWispServer(s.url, 1500)));
    const best = results.filter(r => r.success).sort((a, b) => a.latency - b.latency)[0];

    return best ? best.url : currentUrl;
}

async function initWispAutoswitch() {
    if (window.Settings?.get('wispAutoswitch') === false) return;

    const currentUrl = window.Settings?.get('proxServer') || DEFAULT_WISP;
    const currentHealth = await pingWispServer(currentUrl, 800);

    if (currentHealth.success) {
        console.log("Wisp: Current server OK", currentUrl);
        return;
    }

    console.log("Wisp: Current server offline or slow, finding faster server...");
    const bestUrl = await findBestWispServer();

    if (bestUrl && bestUrl !== currentUrl) {
        console.log("Wisp: Auto-switched to", bestUrl);
        window.Settings?.set("proxServer", bestUrl);

        const servers = getAllWispServers();
        const serverObj = servers.find(s => s.url === bestUrl);
        const name = serverObj ? serverObj.name : "New Server";

        notify('info', 'Auto-switched', `Switched to ${name} for better performance.`);
    }
}

const getBasePath = () => {
    const path = location.pathname.replace(/[^/]*$/, '');
    return path.endsWith('/') ? path : path + '/';
};

let scramjetRetries = 0;
async function getSharedScramjet() {
    if (sharedScramjet) return sharedScramjet;

    const { ScramjetController } = $scramjetLoadController();
    sharedScramjet = new ScramjetController({
        prefix: getBasePath() + "scramjet/",
        files: {
            wasm: "https://cdn.jsdelivr.net/gh/Destroyed12121/Staticsj@main/JS/scramjet.wasm.wasm",
            all: "https://cdn.jsdelivr.net/gh/Destroyed12121/Staticsj@main/JS/scramjet.all.js",
            sync: "https://cdn.jsdelivr.net/gh/Destroyed12121/Staticsj@main/JS/scramjet.sync.js"
        }
    });

    try {
        await sharedScramjet.init();
    } catch (err) {
        if (scramjetRetries < 3 && err.message && (err.message.includes('IDBDatabase') || err.message.includes('object stores'))) {
            scramjetRetries++;
            console.warn(`Clearing IndexedDB due to error (attempt ${scramjetRetries}/3)...`);
            ['scramjet-data', 'scrambase', 'ScramjetData'].forEach(db => {
                try { indexedDB.deleteDatabase(db); } catch { }
            });
            sharedScramjet = null;
            return getSharedScramjet();
        }
        throw err;
    }
    return sharedScramjet;
}

async function getSharedConnection() {
    if (sharedConnectionReady) return sharedConnection;

    const wispUrl = window.Settings?.get("proxServer") ?? DEFAULT_WISP;
    const transport = window.Settings?.get("transport") || "epoxy";

    const EPOXY_URL = "https://cdn.jsdelivr.net/npm/@mercuryworkshop/epoxy-transport@2.1.28/dist/index.mjs";
    const LIBCURL_URL = "https://cdn.jsdelivr.net/gh/Destroyed12121/Staticsj@main/libcurl.mjs";

    let transportUrl = EPOXY_URL;
    if (transport === "libcurl") {
        transportUrl = LIBCURL_URL;
    }

    sharedConnection = new BareMux.BareMuxConnection(getBasePath() + "bareworker.js");
    let usedFallback = false; // Track if we've already fallen back to prevent loops
    try {
        await sharedConnection.setTransport(
            transportUrl,
            [{ wisp: wispUrl }]
        );
    } catch (e) {
        console.error("Transport failed:", e);
        // If libcurl failed, retry once then fall back to epoxy
        if (transport === "libcurl") {
            try {
                console.log("Retrying libcurl transport...");
                await sharedConnection.setTransport(LIBCURL_URL, [{ wisp: wispUrl }]);
            } catch (retryErr) {
                console.error("Libcurl retry failed, falling back to epoxy:", retryErr);
                await sharedConnection.setTransport(EPOXY_URL, [{ wisp: wispUrl }]);
                notify('warning', 'Transport Fallback', 'Libcurl failed to initialize. Falling back to Epoxy.');
            }
        } else if (transport === "epoxy" && !usedFallback) {
            // Epoxy failed  try libcurl as fallback (only once to prevent loops)
            usedFallback = true;
            try {
                console.log("Epoxy failed, falling back to libcurl...");
                await sharedConnection.setTransport(LIBCURL_URL, [{ wisp: wispUrl }]);
                notify('warning', 'Transport Fallback', 'Epoxy failed. Using Libcurl for this session.');
            } catch (fallbackErr) {
                console.error("Libcurl fallback also failed:", fallbackErr);
                throw new Error('Both transports failed. Please check your proxy settings.');
            }
        } else {
            throw e;
        }
    }
    sharedConnectionReady = true;
    return sharedConnection;
}

async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    const reg = await navigator.serviceWorker.register(getBasePath() + 'sw.js', { scope: getBasePath() });
    await navigator.serviceWorker.ready;

    const config = {
        type: "config",
        wispurl: window.Settings?.get("proxServer") ?? DEFAULT_WISP,
        servers: getAllWispServers(),
        autoswitch: window.Settings?.get('wispAutoswitch') !== false,
        transport: window.Settings?.get('transport') || 'epoxy'
    };

    const send = () => {
        const sw = reg.active || navigator.serviceWorker?.controller;
        if (sw) sw.postMessage(config);
    };

    send();
    setTimeout(send, 500);

    navigator.serviceWorker.addEventListener('message', (e) => {
        if (e.data.type === 'wispChanged') {
            window.Settings?.set("proxServer", e.data.url);
        } else if (e.data.type === 'wispError') {
            notify('error', 'Proxy Error', e.data.message);
        } else if (e.data.type === 'transportFallback') {
            notify('warning', 'Compatibility Mode', `Libcurl failed. Automatically switched to ${e.data.fallback} for this session.`);
        } else if (e.data.type === 'navigate') {
            handleSubmit(e.data.url);
        } else if (e.data.type === 'resource-loaded') {
            tabs.forEach(tab => {
                if (tab.loading) {
                    tab.lastProgressUpdate = Date.now();
                    const isError = e.data.status >= 400 || e.data.status === 0;
                    // Batch logic: only update UI if progress changed significantly or it's been a while
                    const increment = isError ? 5 : 12;
                    const oldProgress = tab.progress;
                    tab.progress = Math.min(94, tab.progress + increment);

                    if (tab.id === activeTabId && (Math.floor(tab.progress / 5) > Math.floor(oldProgress / 5) || tab.progress >= 90)) {
                        updateLoadingBar(tab, tab.progress);
                    }

                    if (tab.progress >= 80 && (e.data.status === 200 || e.data.status === 304)) {
                        if (tab.finishTimer) clearTimeout(tab.finishTimer);
                        tab.finishTimer = setTimeout(() => completeLoading(tab), 200);
                    }
                }
            });
        }
    });

    reg.update();
}

const getActiveTab = () => tabs.find(t => t.id === activeTabId);
const notify = (type, title, msg) => window.Notify?.[type](title, msg);
async function init() {
    try {
        initializeBrowserUI();

        // Start non-blocking initializations
        const swPromise = registerServiceWorker();
        const wispPromise = initWispAutoswitch();
        
        // Connection and Scramjet are needed but can be started in parallel
        const connPromise = getSharedConnection();
        const scramjetPromise = getSharedScramjet();

        // Create the first tab as soon as Scramjet is ready
        // We don't await sw/wisp/conn here because NT.html doesn't need them immediately
        await scramjetPromise;
        await createTab(true);

        // Let the rest finish in the background
        Promise.all([swPromise, wispPromise, connPromise]).catch(err => {
            console.warn("Background init task failed (non-critical):", err);
        });

        if (window.location.hash) {
            handleSubmit(decodeURIComponent(window.location.hash.substring(1)));
            history.replaceState(null, null, location.pathname);
        }

        console.log("Browser: UI Ready. Backend finishing in background...");
    } catch (err) {
        console.error("Init Error:", err);
    }
}

function handleSubmit(url) {
    const tab = getActiveTab();
    if (!tab) return;

    let input = url ?? document.getElementById("address-bar").value.trim();
    if (!input) return;

    if (!input.startsWith('http') && !input.startsWith('about:')) {
        const engine = window.Settings?.get('searchEngine') || "https://www.bing.com/search?q=";
        input = input.includes('.') && !input.includes(' ') ? `https://${input}` : engine + encodeURIComponent(input);
    }

    tab.loading = true;
    showIframeLoading(true, input);
    tab.frame.go(input);
}

function initializeBrowserUI() {
    const root = document.getElementById("app");
    if (!root || root.innerHTML.trim() !== "") return;

    root.innerHTML = `
        <div class="browser-container">
            <div class="flex tabs" id="tabs-container"></div>
            <div class="flex nav">
                <button id="back-btn" title="Back"><i class="fa-solid fa-chevron-left"></i></button>
                <button id="fwd-btn" title="Forward"><i class="fa-solid fa-chevron-right"></i></button>
                <button id="reload-btn" title="Reload"><i class="fa-solid fa-rotate-right"></i></button>
                <div class="address-wrapper">
                    <input class="bar" id="address-bar" autocomplete="off" placeholder="Search or enter URL">
                    <div id="address-suggestions" class="suggestions-dropdown"></div>
                    <button id="home-btn-nav" title="Home"><i class="fa-solid fa-house"></i></button>
                </div>
                <button id="devtools-btn" title="DevTools"><i class="fa-solid fa-code"></i></button>
                <button id="wisp-settings-btn" title="Proxy Settings"><i class="fa-solid fa-gear"></i></button>
            </div>
            <div class="loading-bar-container"><div class="loading-bar" id="loading-bar"></div></div>
            <div class="iframe-container" id="iframe-container">
                <div id="loading" class="message-container" style="display: none;">
                    <div class="message-content">
                        <div class="spinner"></div><h1 id="loading-title">Connecting</h1><p id="loading-url">Initializing proxy...</p><button id="skip-btn">Skip</button>
                    </div>
                </div>
            </div>
        </div>`;

    document.getElementById('back-btn').onclick = () => {
        const tab = getActiveTab();
        if (tab?.frame?.frame?.contentWindow) {
            try {
                tab.frame.frame.contentWindow.history.back();
            } catch (e) {
                tab.frame.frame.contentWindow.postMessage({ type: 'history-back' }, '*');
            }
        }
    };
    document.getElementById('fwd-btn').onclick = () => {
        const tab = getActiveTab();
        if (tab?.frame?.frame?.contentWindow) {
            try {
                tab.frame.frame.contentWindow.history.forward();
            } catch (e) {
                tab.frame.frame.contentWindow.postMessage({ type: 'history-forward' }, '*');
            }
        }
    };
    document.getElementById('reload-btn').onclick = () => {
        const tab = getActiveTab();
        if (tab?.frame) {
            tab.loading = true;
            showIframeLoading(true, tab.url);
            tab.frame.reload();
        }
    };
    document.getElementById('home-btn-nav').onclick = () => window.location.href = '../index2.html';
    document.getElementById('devtools-btn').onclick = () => {
        const win = getActiveTab()?.frame?.frame?.contentWindow;
        if (!win) return;
        if (win.eruda) win.eruda.show();
        else {
            const s = win.document.createElement('script');
            s.src = "https://cdn.jsdelivr.net/npm/eruda";
            s.onload = () => { win.eruda.init(); win.eruda.show(); };
            win.document.body.appendChild(s);
        }
    };
    document.getElementById('wisp-settings-btn').onclick = openSettings;

    const skipBtn = document.getElementById('skip-btn');
    if (skipBtn) skipBtn.onclick = () => {
        const t = getActiveTab();
        if (t && t.loading) {
            t.userSkipped = true;
            completeLoading(t);
        }
    };

    const addrBar = document.getElementById('address-bar');
    const suggestionsBox = document.getElementById('address-suggestions');

    if (window.SuggestionsHelper && addrBar && suggestionsBox) {
        SuggestionsHelper.init(addrBar, suggestionsBox, () => handleSubmit());
    }

    updateTabsUI();
}

async function createTab(makeActive = true) {
    if (!sharedScramjet) {
        await getSharedScramjet();
    }

    const frame = sharedScramjet.createFrame();
    const tab = {
        id: nextTabId++,
        title: "New Tab",
        url: "NT.html",
        frame,
        loading: true,
        favicon: null,
        userSkipped: false,
        progress: 15
    };

    if (makeActive) updateLoadingBar(tab, tab.progress);

    frame.frame.src = "NT.html";
    frame.addEventListener("urlchange", (e) => {
        tab.url = e.url;
        tab.loading = true;
        try {
            const urlObj = new URL(e.url);
            tab.title = urlObj.hostname;
            tab.favicon = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
        } catch {
            tab.title = "Browsing";
            tab.favicon = null;
        }

        if (tab.id === activeTabId) showIframeLoading(true, tab.url);
        updateTabsUI();
        updateAddressBar();

        tab.progress = 8;
        tab.lastProgressUpdate = Date.now();
        updateLoadingBar(tab, tab.progress);

        if (tab.progressTimer) clearInterval(tab.progressTimer);
        tab.progressTimer = setInterval(() => {
            if (!tab.loading) {
                clearInterval(tab.progressTimer);
                return;
            }
            const timeSinceUpdate = Date.now() - (tab.lastProgressUpdate || 0);
            const increment = timeSinceUpdate < 500 ? 4 : 2;
            tab.progress = Math.min(92, tab.progress + increment);
            if (tab.id === activeTabId) updateLoadingBar(tab, tab.progress);
        }, 200);

        if (tab.skipTimeout) clearTimeout(tab.skipTimeout);
        tab.skipTimeout = setTimeout(() => {
            if (tab.loading && tab.id === activeTabId) document.getElementById('skip-btn')?.style.setProperty('display', 'inline-block');
        }, 1200);

        if (tab.safetyTimeout) clearTimeout(tab.safetyTimeout);
        tab.safetyTimeout = setTimeout(() => completeLoading(tab), 5000);
    });

    frame.frame.addEventListener('load', () => {
        completeLoading(tab);
        try {
            const win = frame.frame.contentWindow;
            if (win?.document?.title) tab.title = win.document.title;
        } catch { }

        if (frame.frame.contentWindow.location.href.includes('NT.html')) {
            tab.title = "New Tab";
            tab.url = "";
            tab.favicon = null;
        }
        updateTabsUI();
        updateAddressBar();
    });

    tabs.push(tab);
    const container = document.getElementById("iframe-container");
    if (container) container.appendChild(frame.frame);
    if (makeActive) switchTab(tab.id);
    return tab;
}

function showIframeLoading(show, url = '') {
    const loader = document.getElementById("loading");
    if (!loader) return;

    const tab = getActiveTab();
    if (show && tab && tab.userSkipped) return;

    loader.style.display = show ? "flex" : "none";
    if (show) {
        document.getElementById("loading-title").textContent = "Connecting";
        document.getElementById("loading-url").textContent = url || "Loading content...";
        document.getElementById("skip-btn").style.display = 'none';
    }
}

function completeLoading(tab) {
    if (!tab) return;
    if (!tab.loading) return;

    tab.loading = false;
    tab.progress = 100;

    if (tab.skipTimeout) clearTimeout(tab.skipTimeout);
    if (tab.finishTimer) clearTimeout(tab.finishTimer);
    if (tab.safetyTimeout) clearTimeout(tab.safetyTimeout);
    if (tab.progressTimer) clearInterval(tab.progressTimer);

    if (tab.id === activeTabId) {
        showIframeLoading(false);
        updateLoadingBar(tab, 100);
    }
    updateTabsUI();
}

function switchTab(tabId) {
    activeTabId = tabId;
    const tab = getActiveTab();

    tabs.forEach(t => t.frame.frame.classList.toggle("hidden", t.id !== tabId));
    if (tab) {
        showIframeLoading(tab.loading, tab.url);
        updateLoadingBar(tab, tab.loading ? tab.progress : 100);
    }

    updateTabsUI();
    updateAddressBar();
}

function closeTab(tabId) {
    const idx = tabs.findIndex(t => t.id === tabId);
    if (idx === -1) return;

    const tab = tabs[idx];

    if (tab.skipTimeout) clearTimeout(tab.skipTimeout);
    if (tab.finishTimer) clearTimeout(tab.finishTimer);
    if (tab.safetyTimeout) clearTimeout(tab.safetyTimeout);
    if (tab.progressTimer) clearInterval(tab.progressTimer);

    if (tab.frame?.frame) tab.frame.frame.remove();
    tabs.splice(idx, 1);

    if (activeTabId === tabId) {
        if (tabs.length > 0) switchTab(tabs[Math.max(0, idx - 1)].id);
        else window.location.reload();
    } else {
        updateTabsUI();
    }
}

function updateTabsUI() {
    const container = document.getElementById("tabs-container");
    container.innerHTML = "";
    tabs.forEach(tab => {
        const el = document.createElement("div");
        el.className = `tab ${tab.id === activeTabId ? "active" : ""}`;
        const iconHtml = (tab.loading && !tab.userSkipped) ? `<div class="tab-spinner"></div>` : (tab.favicon ? `<img src="${tab.favicon}" class="tab-favicon">` : '');
        el.innerHTML = `${iconHtml}<span class="tab-title">${tab.title}</span><span class="tab-close">&times;</span>`;
        el.onclick = () => switchTab(tab.id);
        el.querySelector(".tab-close").onclick = (e) => { e.stopPropagation(); closeTab(tab.id); };
        container.appendChild(el);
    });
    const newBtn = document.createElement("button");
    newBtn.className = "new-tab";
    newBtn.innerHTML = "<i class='fa-solid fa-plus'></i>";
    newBtn.onclick = () => createTab(true);
    container.appendChild(newBtn);
}

function updateAddressBar() {
    const bar = document.getElementById("address-bar");
    const tab = getActiveTab();
    if (bar && tab) bar.value = (tab.url && !tab.url.includes("NT.html")) ? tab.url : "";
}

function updateLoadingBar(tab, percent) {
    if (tab.id !== activeTabId) return;
    const bar = document.getElementById("loading-bar");
    if (!bar) return;

    const container = bar.parentElement;

    if (tab.userSkipped) {
        bar.style.width = "0%";
        bar.style.display = 'none';
        container?.classList.remove('active');
        return;
    }

    if (percent < 100 && bar._cleanup) {
        clearTimeout(bar._cleanup);
        bar._cleanup = null;
    }

    if (percent > 0 && percent < 100) {
        bar.style.display = 'block';
    }

    bar.style.width = percent + "%";
    bar.style.opacity = percent === 100 ? "0" : "1";

    if (percent < 100) {
        container?.classList.add('active');
    }

    if (percent === 100) {
        container?.classList.remove('active');
        bar._cleanup = setTimeout(() => {
            bar.style.width = "0%";
            bar.style.display = 'none';
            bar._cleanup = null;
        }, 200);
    }
}

function openSettings() {
    const modal = document.getElementById('wisp-settings-modal');
    if (!modal) return;

    modal.classList.remove('hidden');
    document.getElementById('close-wisp-modal').onclick = () => modal.classList.add('hidden');
    document.getElementById('save-custom-wisp').onclick = saveCustomWisp;

    const transportSelect = document.getElementById('internal-transport-select');
    if (transportSelect) {
        transportSelect.value = window.Settings?.get('transport') || "epoxy";
        transportSelect.onchange = (e) => {
            window.Settings?.set('transport', e.target.value);
            const transportName = e.target.value === 'libcurl' ? 'Libcurl' : 'Epoxy';
            notify('success', 'Transport Updated', `${transportName} selected. Reloading...`);
            setTimeout(() => location.reload(), 1000);
        };
    }

    const searchEngineSelect = document.getElementById('search-engine-select');
    if (searchEngineSelect) {
        searchEngineSelect.value = window.Settings?.get('searchEngine') || "https://www.bing.com/search?q=";
        searchEngineSelect.onchange = (e) => {
            window.Settings?.set('searchEngine', e.target.value);
            notify('success', 'Settings Updated', `Search Engine changed.`);
        };
    }

    renderServerList();
}

function renderServerList() {
    const list = document.getElementById('server-list');
    list.innerHTML = '';
    const currentUrl = window.Settings?.get('proxServer') ?? DEFAULT_WISP;
    const allWisps = getAllWispServers();

    allWisps.forEach((server, index) => {
        const isActive = server.url === currentUrl;
        const isCustom = index >= WISP_SERVERS.length;

        const item = document.createElement('div');
        item.className = `wisp-option ${isActive ? 'active' : ''}`;
        item.innerHTML = `
            <div class="wisp-option-header">
                <div class="wisp-option-name">${server.name}${isActive ? ' <i class="fa-solid fa-check"></i>' : ''}</div>
                <div class="server-status"><span class="ping-text">...</span><div class="status-indicator"></div>${isCustom ? `<button class="delete-wisp-btn" onclick="deleteCustomWisp('${server.url}')"><i class="fa-solid fa-trash"></i></button>` : ''}</div>
            </div>
            <div class="wisp-option-url">${server.url}</div>`;

        item.onclick = () => setWisp(server.url);
        list.appendChild(item);
        checkServerHealth(server.url, item);
    });

    const isAutoswitch = window.Settings?.get('wispAutoswitch') !== false;
    const toggle = document.createElement('div');
    toggle.className = 'wisp-option';
    toggle.innerHTML = `<div class="wisp-option-header"><div class="wisp-option-name">Auto-switch</div><div class="toggle ${isAutoswitch ? 'active' : ''}"></div></div>`;
    toggle.onclick = () => {
        window.Settings?.set('wispAutoswitch', !isAutoswitch);
        navigator.serviceWorker?.controller?.postMessage({ type: 'config', autoswitch: !isAutoswitch });
        location.reload();
    };
    list.appendChild(toggle);
}

function saveCustomWisp() {
    const url = document.getElementById('custom-wisp-input').value.trim();
    if (!url || (!url.startsWith('ws://') && !url.startsWith('wss://'))) return notify('error', 'Invalid URL', 'Must start with ws:// or wss://');

    const customWisps = getStoredWisps();
    if ([...WISP_SERVERS, ...customWisps].some(w => w.url === url)) return notify('warning', 'Exists', 'Server already exists');

    customWisps.push({ name: `Custom ${customWisps.length + 1}`, url });
    window.Settings?.set('customWisps', customWisps);
    setWisp(url);
}

window.deleteCustomWisp = (url) => {
    if (!confirm("Remove server?")) return;
    const custom = getStoredWisps().filter(w => w.url !== url);
    window.Settings?.set('customWisps', custom);
    if (window.Settings?.get('proxServer') === url) setWisp(DEFAULT_WISP);
    else renderServerList();
};

async function checkServerHealth(url, el) {
    const dot = el.querySelector('.status-indicator');
    const txt = el.querySelector('.ping-text');

    const result = await pingWispServer(url, 2500);

    if (result.success) {
        dot.classList.add('status-success');
        txt.textContent = `${result.latency}ms`;
    } else {
        dot.classList.add('status-error');
        txt.textContent = 'Offline';
    }
}

function setWisp(url) {
    window.Settings?.set('proxServer', url);
    const controller = navigator.serviceWorker?.controller;
    if (controller) {
        controller.postMessage({ type: 'config', wispurl: url });
    }
    setTimeout(() => location.reload(), 500);
}

window.addEventListener('message', (e) => {
    if (e.data?.type === 'navigate' && e.data.url) {
        handleSubmit(e.data.url);
    }
});




document.addEventListener('DOMContentLoaded', init);