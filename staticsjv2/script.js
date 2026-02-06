// config source
const SITE_CONFIG = window.SITE_CONFIG || {};
const DEFAULT_WISP = SITE_CONFIG.defaultWisp || "wss://glseries.net/wisp/";
const WISP_SERVERS = SITE_CONFIG.wispServers || [];

// state
const BareMux = window.BareMux || { BareMuxConnection: class { setTransport() { } } };
let sharedScramjet = null;
let sharedConnection = null;
let sharedConnectionReady = false;

let tabs = [];
let activeTabId = null;
let nextTabId = 1;

// =====================================================
// WISP SERVER MANAGEMENT
// =====================================================

function getStoredWisps() {
    try { return JSON.parse(localStorage.getItem('customWisps') ?? '[]'); }
    catch { return []; }
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
    const currentUrl = localStorage.getItem("proxServer") || DEFAULT_WISP;

    // Ping in chunks to avoid browser connection limits
    const CHUNK_SIZE = 5;
    let results = [];

    for (let i = 0; i < servers.length; i += CHUNK_SIZE) {
        const chunk = servers.slice(i, i + CHUNK_SIZE);
        const chunkResults = await Promise.all(chunk.map(s => pingWispServer(s.url, 1500)));
        results = results.concat(chunkResults);
    }

    const best = results.filter(r => r.success).sort((a, b) => a.latency - b.latency)[0];

    return best ? best.url : currentUrl;
}

async function initWispAutoswitch() {
    if (localStorage.getItem('wispAutoswitch') === 'false') return;

    const currentUrl = localStorage.getItem("proxServer") || DEFAULT_WISP;

    // Use a very short timeout for the initial check to see if we're good
    const currentHealth = await pingWispServer(currentUrl, 800);

    if (currentHealth.success) {
        console.log("Wisp: Current server OK", currentUrl);
        return;
    }

    console.log("Wisp: Current server offline or slow, finding faster server...");
    const bestUrl = await findBestWispServer();

    if (bestUrl && bestUrl !== currentUrl) {
        console.log("Wisp: Auto-switched to", bestUrl);
        localStorage.setItem("proxServer", bestUrl);

        const servers = getAllWispServers();
        const serverObj = servers.find(s => s.url === bestUrl);
        const name = serverObj ? serverObj.name : "New Server";

        notify('info', 'Auto-switched', `Switched to ${name} for better performance.`);
    }
}

// =====================================================
// PROXY INITIALIZATION
// =====================================================

const getBasePath = () => {
    const path = location.pathname.replace(/[^/]*$/, '');
    return path.endsWith('/') ? path : path + '/';
};

let scramjetRetries = 0;
let scramjetInitPromise = null;

async function getSharedScramjet() {
    if (sharedScramjet) return sharedScramjet;
    if (scramjetInitPromise) return scramjetInitPromise;

    scramjetInitPromise = (async () => {
        const { ScramjetController } = $scramjetLoadController();
        const controller = new ScramjetController({
            prefix: getBasePath() + "scramjet/",
            files: {
                wasm: "https://cdn.jsdelivr.net/gh/Destroyed12121/Staticsj@main/JS/scramjet.wasm",
                all: "https://cdn.jsdelivr.net/gh/Destroyed12121/Staticsj@main/JS/scramjet.all.js",
                sync: "https://cdn.jsdelivr.net/gh/Destroyed12121/Staticsj@main/JS/scramjet.sync.js"
            }
        });

        try {
            await controller.init();
            sharedScramjet = controller;
            scramjetInitPromise = null;
            return controller;
        } catch (err) {
            scramjetInitPromise = null;
            if (scramjetRetries < 3 && err.message && (err.message.includes('IDBDatabase') || err.message.includes('object stores'))) {
                scramjetRetries++;
                console.warn(`Clearing IndexedDB due to error (Retry ${scramjetRetries}/3)...`);
                ['scramjet-data', 'scrambase', 'ScramjetData'].forEach(db => {
                    try { indexedDB.deleteDatabase(db); } catch { }
                });
                return getSharedScramjet();
            }
            throw err;
        }
    })();

    return scramjetInitPromise;
}

let connectionInitPromise = null;

async function getSharedConnection() {
    if (sharedConnectionReady) return sharedConnection;
    if (connectionInitPromise) return connectionInitPromise;

    connectionInitPromise = (async () => {
        const wispUrl = localStorage.getItem("proxServer") ?? DEFAULT_WISP;
        sharedConnection = new BareMux.BareMuxConnection(getBasePath() + "bareworker.js");
        await sharedConnection.setTransport(
            "https://cdn.jsdelivr.net/npm/@mercuryworkshop/epoxy-transport@2.1.28/dist/index.mjs",
            [{ wisp: wispUrl }]
        );
        sharedConnectionReady = true;
        connectionInitPromise = null;
        return sharedConnection;
    })();

    return connectionInitPromise;
}

async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    const reg = await navigator.serviceWorker.register(getBasePath() + 'sw.js', { scope: getBasePath() });
    await navigator.serviceWorker.ready;

    const config = {
        type: "config",
        wispurl: localStorage.getItem("proxServer") ?? DEFAULT_WISP,
        servers: getAllWispServers(),
        autoswitch: localStorage.getItem('wispAutoswitch') !== 'false'
    };

    const send = () => {
        const sw = reg.active || navigator.serviceWorker?.controller;
        if (sw) {
            sw.postMessage(config);
        } else {
            // Wait for controller if not ready
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                navigator.serviceWorker.controller?.postMessage(config);
            }, { once: true });
        }
    };

    send();
    // Backup send
    setTimeout(send, 1000);

    navigator.serviceWorker.addEventListener('message', (e) => {
        if (e.data.type === 'wispChanged') {
            localStorage.setItem("proxServer", e.data.url);
            notify('info', 'Proxy Auto-switched', `Switched to ${e.data.name}. ${e.data.reason || 'Connection unstable.'}`);
        } else if (e.data.type === 'wispError') {
            notify('error', 'Proxy Error', e.data.message);
        } else if (e.data.type === 'resource-loaded' || e.data.type === 'batch-resource-loaded') {
            const tab = getActiveTab();
            if (tab && tab.loading) {
                // Handle both single and batched messages
                const resources = e.data.type === 'batch-resource-loaded' ? e.data.resources : [{ status: e.data.status }];

                let totalIncrement = 0;
                resources.forEach(res => {
                    const isError = res.status >= 400;
                    totalIncrement += isError ? 0.5 : 2.5;
                });

                // Cap increment per batch to avoid jumpiness
                totalIncrement = Math.min(totalIncrement, 20);

                tab.progress = Math.min(96, tab.progress + totalIncrement);
                updateLoadingBar(tab, tab.progress);
            }
        }
    });

    reg.update();
}

// =====================================================
// UI & BROWSER LOGIC
// =====================================================

const getActiveTab = () => tabs.find(t => t.id === activeTabId);
const notify = (type, title, msg) => window.Notify?.[type](title, msg);

// =====================================================
// MAIN & INITIALIZATION
// =====================================================

async function init() {
    try {
        initializeBrowserUI();

        // Start parallel setup
        const swPromise = registerServiceWorker();
        const connectionPromise = getSharedConnection();
        const wispPromise = initWispAutoswitch();

        // Wait for essential systems
        await Promise.all([swPromise, connectionPromise, wispPromise]);

        // Final steps
        // Final steps
        await getSharedScramjet();

        // Restore session or create new tab
        if (!await restoreSession()) {
            await createTab(true);
        }

        if (window.location.hash) {
            handleSubmit(decodeURIComponent(window.location.hash.substring(1)));
            history.replaceState(null, null, location.pathname);
        }

        console.log("Browser: All backend systems ready.");
    } catch (err) {
        console.error("Init Error:", err);
    }
}
async function restoreSession() {
    try {
        const saved = JSON.parse(localStorage.getItem('browser_tabs') || '[]');
        if (saved.length === 0) return false;

        // Sequential restore to avoid overwhelming the proxy
        for (const t of saved) {
            await createTab(false, t.url, t.title, t.favicon);
        }

        // Restore active tab by index, not ID (IDs are regenerated)
        const activeIndex = parseInt(localStorage.getItem('browser_active_tab_index') || '0');
        if (tabs[activeIndex]) {
            switchTab(tabs[activeIndex].id);
        } else if (tabs.length > 0) {
            switchTab(tabs[0].id);
        }
        return true;
    } catch (e) {
        console.error("Session restore failed:", e);
        return false;
    }
}

function saveSession() {
    try {
        const state = tabs.map(t => ({
            url: t.url,
            title: t.title,
            favicon: t.favicon
        }));
        localStorage.setItem('browser_tabs', JSON.stringify(state));

        // Save index, as IDs are not persistent across reloads
        const activeIndex = tabs.findIndex(t => t.id === activeTabId);
        localStorage.setItem('browser_active_tab_index', activeIndex >= 0 ? activeIndex : 0);
    } catch (e) {
        if (e.name === 'QuotaExceededError') {
            console.warn("Session save failed: Storage quota exceeded");
            // Optional: Try to clear old data or just fail silently
        } else {
            console.error("Session save error:", e);
        }
    }
}

function initializeBrowserUI() {
    const root = document.getElementById("app");
    if (!root || root.innerHTML.trim() !== "") return; // Avoid double init

    root.innerHTML = `
        <div class="browser-container">
            <div class="flex tabs" id="tabs-container"></div>
            <div class="flex nav">
                <button id="back-btn" title="Back"><i class="fa-solid fa-chevron-left"></i></button>
                <button id="fwd-btn" title="Forward"><i class="fa-solid fa-chevron-right"></i></button>
                <button id="reload-btn" title="Reload"><i class="fa-solid fa-rotate-right"></i></button>
                <div class="address-wrapper">
                    <input class="bar" id="address-bar" autocomplete="off" placeholder="Search or enter URL">
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

    // Re-attach UI listeners
    document.getElementById('back-btn').onclick = () => getActiveTab()?.frame?.back();
    document.getElementById('fwd-btn').onclick = () => getActiveTab()?.frame?.forward();
    document.getElementById('reload-btn').onclick = () => getActiveTab()?.frame?.reload();
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
        if (t) {
            t.loading = false;
            t.userSkipped = true;
            showIframeLoading(false);
        }
    };

    const addrBar = document.getElementById('address-bar');
    if (addrBar) {
        addrBar.onkeyup = (e) => e.key === 'Enter' && handleSubmit();
        addrBar.onfocus = () => addrBar.select();
    }

    updateTabsUI();
}

async function createTab(makeActive = true, url = "NT.html", title = "New Tab", favicon = null) {
    // If scramjet isn't ready, wait for it or use a placeholder
    if (!sharedScramjet) {
        console.log("Tab: Waiting for Scramjet...");
        await getSharedScramjet();
    }

    const frame = sharedScramjet.createFrame();
    const tab = {
        id: nextTabId++,
        title: title,
        url: url,
        frame,
        loading: false,
        loading: false,
        favicon: favicon,
        userSkipped: false,
        progress: 0
    };

    frame.frame.src = url;
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

        saveSession(); // Persist on nav

        if (tab.id === activeTabId) showIframeLoading(true, tab.url);
        updateTabsUI();
        updateAddressBar();

        tab.progress = 10;
        updateLoadingBar(tab, tab.progress);

        if (tab.skipTimeout) clearTimeout(tab.skipTimeout);
        tab.skipTimeout = setTimeout(() => {
            if (tab.loading && tab.id === activeTabId) document.getElementById('skip-btn')?.style.setProperty('display', 'inline-block');
        }, 500);
    });

    frame.frame.addEventListener('load', () => {
        tab.loading = false;
        clearTimeout(tab.skipTimeout);
        if (tab.id === activeTabId) {
            showIframeLoading(false);
            tab.userSkipped = false;
        }
        try { if (frame.frame.contentWindow.document.title) tab.title = frame.frame.contentWindow.document.title; } catch { }
        try { if (frame.frame.contentWindow.location.href.includes('NT.html')) { tab.title = "New Tab"; tab.url = ""; tab.favicon = null; } } catch { }
        updateTabsUI();
        updateAddressBar();
        updateLoadingBar(tab, 100);
    });

    tabs.push(tab);
    saveSession();

    const container = document.getElementById("iframe-container");
    if (container) container.appendChild(frame.frame);
    if (makeActive) switchTab(tab.id);
    return tab;
}

function showIframeLoading(show, url = '') {
    const loader = document.getElementById("loading");
    if (!loader) return;

    const tab = getActiveTab();
    // Persistent Skip: If user skipped once on this tab, never show loading again
    if (show && tab && tab.userSkipped) return;

    loader.style.display = show ? "flex" : "none";
    if (show) {
        document.getElementById("loading-title").textContent = "Connecting";
        document.getElementById("loading-url").textContent = url || "Loading content...";
        document.getElementById("skip-btn").style.display = 'none';
    }
}

function switchTab(tabId) {
    activeTabId = tabId;
    const tab = getActiveTab();

    tabs.forEach(t => t.frame.frame.classList.toggle("hidden", t.id !== tabId));
    if (tab) showIframeLoading(tab.loading, tab.url);

    updateTabsUI();
    updateTabsUI();
    updateAddressBar();
    saveSession();
}

function closeTab(tabId) {
    const idx = tabs.findIndex(t => t.id === tabId);
    if (idx === -1) return;

    const tab = tabs[idx];
    if (tab.frame) {
        // Try to properly destroy frame if method exists, otherwise remove element
        if (tab.frame.destroy) tab.frame.destroy();
        else if (tab.frame.frame) tab.frame.frame.remove();
        tab.frame = null; // Clear reference
    }
    tabs.splice(idx, 1);

    if (activeTabId === tabId) {
        if (tabs.length > 0) {
            switchTab(tabs[Math.max(0, idx - 1)].id);
        } else {
            // Don't reload, just make a new tab
            createTab(true);
        }
    } else {
        updateTabsUI();
    }
    saveSession();
}

function updateTabsUI() {
    const container = document.getElementById("tabs-container");
    container.innerHTML = "";
    tabs.forEach(tab => {
        const el = document.createElement("div");
        el.className = `tab ${tab.id === activeTabId ? "active" : ""}`;
        const iconHtml = tab.loading ? `<div class="tab-spinner"></div>` : (tab.favicon ? `<img src="${tab.favicon}" class="tab-favicon">` : '');
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

function handleSubmit(url) {
    const tab = getActiveTab();
    let input = url ?? document.getElementById("address-bar").value.trim();
    if (!input) return;

    if (!input.startsWith('http')) {
        input = input.includes('.') && !input.includes(' ') ? `https://${input}` : `https://www.google.com/search?q=${encodeURIComponent(input)}`;
    }
    tab.loading = true;
    updateLoadingBar(tab, 0); // Reset bar correctly on start
    // Removed userSkipped reset to keep skip persistent for the tab
    showIframeLoading(true, input);
    // Let urlchange listener handle the progress logic
    tab.frame.go(input);
}

function updateLoadingBar(tab, percent) {
    if (tab.id !== activeTabId) return;
    const bar = document.getElementById("loading-bar");
    if (!bar) return;

    if (percent < 100 && bar._cleanup) {
        clearTimeout(bar._cleanup);
        bar._cleanup = null;
    }

    const container = bar.parentElement;
    bar.style.width = percent + "%";
    bar.style.opacity = percent === 100 ? "0" : "1";

    if (percent < 100) {
        container?.classList.add('active');
    }

    if (percent === 100) {
        container?.classList.remove('active');
        // No auto-reset to 0 here to prevent flickering. 
        // We reset to 0 when a new load starts.
    }
}

//settings
// settings
function openSettings() {
    const modal = document.getElementById('wisp-settings-modal');
    modal.classList.remove('hidden');
    document.getElementById('close-wisp-modal').onclick = () => modal.classList.add('hidden');
    document.getElementById('save-custom-wisp').onclick = saveCustomWisp;


    // Tab switching
    const tabs = modal.querySelectorAll('.nav-tab');
    const panels = modal.querySelectorAll('.settings-panel');
    const title = document.getElementById('modal-title');
    const footer = document.getElementById('settings-footer');

    tabs.forEach(tab => {
        tab.onclick = () => {
            // Only Proxy tab remains relevant for now (or if we keep tabs but remove Appearance content)
            // If the user wants to remove the selector, we assume checking if "Appearance" tab should be hidden or removed
            // But the HTML might still have the tab button. 
            // Let's just hide the appearance tab functionality or keep it as a stub if needed?
            // The prompt said "delete the backgrounds selector".
            // I will remove the logic that switches to it if I can, or just empty the appearance panel logic.

            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            const target = tab.dataset.tab;
            document.getElementById(`${target}-panel`).classList.add('active');

            if (target === 'proxy') {
                title.innerHTML = '<i class="fa-solid fa-server"></i> Proxy Settings';
                footer.textContent = 'Lower ping = faster browsing';
            }
        };
    });

    // Force switch to proxy tab and hide appearance tab if possible (via CSS or removal)
    // For now, removing the logic that sets Appearance title/footer.

    renderServerList();
    renderServerList();
}

function renderServerList() {
    const list = document.getElementById('server-list');
    list.innerHTML = '';
    const currentUrl = localStorage.getItem('proxServer') ?? DEFAULT_WISP;
    const allWisps = getAllWispServers();

    allWisps.forEach((server, index) => {
        const isActive = server.url === currentUrl;
        const isCustom = index >= WISP_SERVERS.length;

        const item = document.createElement('div');
        item.className = `wisp-option ${isActive ? 'active' : ''}`;
        item.innerHTML = `
            <div class="wisp-option-header">
                <div class="wisp-option-name">${server.name}${isActive ? ' <i class="fa-solid fa-check"></i>' : ''}</div>
                <div class="server-status"><span class="ping-text">...</span><div class="status-indicator"></div>${isCustom ? `<button class="delete-wisp-btn"><i class="fa-solid fa-trash"></i></button>` : ''}</div>
            </div>
            <div class="wisp-option-url">${server.url}</div>`;



        item.onclick = (e) => {
            // Avoid triggering if delete button was clicked
            if (e.target.closest('.delete-wisp-btn')) return;
            setWisp(server.url);
        };

        // Secure event listener attachment
        if (isCustom) {
            const delBtn = item.querySelector('.delete-wisp-btn');
            if (delBtn) delBtn.onclick = (e) => {
                e.stopPropagation();
                deleteCustomWisp(server.url);
            };
        }

        list.appendChild(item);
        checkServerHealth(server.url, item);
    });

    // Toggle
    const isAutoswitch = localStorage.getItem('wispAutoswitch') !== 'false';
    const toggle = document.createElement('div');
    toggle.className = 'wisp-option';
    toggle.innerHTML = `<div class="wisp-option-header"><div class="wisp-option-name">Auto-switch</div><div class="toggle ${isAutoswitch ? 'active' : ''}"></div></div>`;
    toggle.onclick = () => {
        localStorage.setItem('wispAutoswitch', !isAutoswitch);
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

    customWisps.push({ name: `Custom ${customWisps.length + 1} `, url });
    localStorage.setItem('customWisps', JSON.stringify(customWisps));
    setWisp(url);
}

window.deleteCustomWisp = (url) => {
    if (!confirm("Remove server?")) return;
    const custom = getStoredWisps().filter(w => w.url !== url);
    localStorage.setItem('customWisps', JSON.stringify(custom));
    if (localStorage.getItem('proxServer') === url) setWisp(DEFAULT_WISP);
    else renderServerList();
};

async function checkServerHealth(url, el) {
    const dot = el.querySelector('.status-indicator');
    const txt = el.querySelector('.ping-text');
    const start = Date.now();
    try {
        await fetch(url.replace('wss://', 'https://').replace('/wisp/', '/health'), { method: 'HEAD', mode: 'no-cors' });
        dot.classList.add('status-success');
        txt.textContent = `${Date.now() - start} ms`;
    } catch {
        dot.classList.add('status-error');
        txt.textContent = 'Offline';
    }
}

async function setWisp(url) {
    localStorage.setItem('proxServer', url);

    // 1. Update Service Worker
    const controller = navigator.serviceWorker?.controller;
    if (controller) {
        controller.postMessage({ type: 'config', wispurl: url });
    }

    // 2. Update Main Thread Transport
    if (sharedConnection) {
        try {
            await sharedConnection.setTransport(
                "https://cdn.jsdelivr.net/npm/@mercuryworkshop/epoxy-transport@2.1.28/dist/index.mjs",
                [{ wisp: url }]
            );
            notify('success', 'Proxy Updated', 'Switched server without reload.');
        } catch (e) {
            console.error("Transport update failed:", e);
            notify('error', 'Update Failed', 'Could not switch transport.');
        }
    }

    renderServerList();
}

// =====================================================
// MAIN
// =====================================================


window.addEventListener('message', (e) => {
    if (e.data?.type === 'navigate' && e.data.url) {
        handleSubmit(e.data.url);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Check if we are in the main browser context (have #app) 
    // to avoid conflict with embed.html or other partial views
    if (document.getElementById('app')) {
        init();
    }
});