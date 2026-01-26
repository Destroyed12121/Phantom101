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

async function pingWispServer(url, timeout = 2000) {
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

    const results = await Promise.all(servers.map(s => pingWispServer(s.url, 2000)));
    const best = results.filter(r => r.success).sort((a, b) => a.latency - b.latency)[0];

    return best ? best.url : currentUrl;
}

async function initWispAutoswitch() {
    if (localStorage.getItem('wispAutoswitch') === 'false') return;

    const currentUrl = localStorage.getItem("proxServer") || DEFAULT_WISP;
    const currentHealth = await pingWispServer(currentUrl);

    if (currentHealth.success) {
        console.log("Wisp: Current server OK", currentUrl);
        return;
    }

    console.log("Wisp: Finding faster server...");
    const bestUrl = await findBestWispServer();

    if (bestUrl && bestUrl !== currentUrl) {
        console.log("Wisp: Auto-switched to", bestUrl);
        localStorage.setItem("proxServer", bestUrl);
        notify('info', 'Auto-switched', `Switched to a faster server`);
    }
}

// =====================================================
// PROXY INITIALIZATION
// =====================================================

const getBasePath = () => {
    const path = location.pathname.replace(/[^/]*$/, '');
    return path.endsWith('/') ? path : path + '/';
};

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
        if (err.message && (err.message.includes('IDBDatabase') || err.message.includes('object stores'))) {
            console.warn('Clearing IndexedDB due to error...');
            ['scramjet-data', 'scrambase', 'ScramjetData'].forEach(db => {
                try { indexedDB.deleteDatabase(db); } catch { }
            });
            sharedScramjet = null; // Retry once
            return getSharedScramjet();
        }
        throw err;
    }
    return sharedScramjet;
}

async function getSharedConnection() {
    if (sharedConnectionReady) return sharedConnection;

    const wispUrl = localStorage.getItem("proxServer") ?? DEFAULT_WISP;
    sharedConnection = new BareMux.BareMuxConnection(getBasePath() + "bareworker.js");
    await sharedConnection.setTransport(
        "https://cdn.jsdelivr.net/npm/@mercuryworkshop/epoxy-transport@2.1.28/dist/index.mjs",
        [{ wisp: wispUrl }]
    );
    sharedConnectionReady = true;
    return sharedConnection;
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
        const sw = reg.active || navigator.serviceWorker.controller;
        if (sw) sw.postMessage(config);
    };

    send();
    setTimeout(send, 500);

    navigator.serviceWorker.addEventListener('message', (e) => {
        if (e.data.type === 'wispChanged') {
            localStorage.setItem("proxServer", e.data.url);
            notify('info', 'Proxy Auto-switched', `Now using ${e.data.name}`);
        } else if (e.data.type === 'wispError') {
            notify('error', 'Proxy Error', e.data.message);
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
        await registerServiceWorker();
        await initWispAutoswitch();
        await getSharedConnection();
        await getSharedScramjet();
        await createTab(true);

        if (window.location.hash) {
            handleSubmit(decodeURIComponent(window.location.hash.substring(1)));
            history.replaceState(null, null, location.pathname);
        }

        console.log("Browser: All backend systems ready.");
    } catch (err) {
        console.error("Init Error:", err);
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
        if (t) { t.loading = false; showIframeLoading(false); }
    };

    const addrBar = document.getElementById('address-bar');
    if (addrBar) {
        addrBar.onkeyup = (e) => e.key === 'Enter' && handleSubmit();
        addrBar.onfocus = () => addrBar.select();
    }

    updateTabsUI();
}

async function createTab(makeActive = true) {
    // If scramjet isn't ready, wait for it or use a placeholder
    if (!sharedScramjet) {
        console.log("Tab: Waiting for Scramjet...");
        await getSharedScramjet();
    }

    const frame = sharedScramjet.createFrame();
    const tab = {
        id: nextTabId++,
        title: "New Tab",
        url: "NT.html",
        frame,
        loading: false,
        favicon: null,
        skipTimeout: null
    };

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
        updateLoadingBar(tab, 10);

        if (tab.skipTimeout) clearTimeout(tab.skipTimeout);
        tab.skipTimeout = setTimeout(() => {
            if (tab.loading && tab.id === activeTabId) document.getElementById('skip-btn')?.style.setProperty('display', 'inline-block');
        }, 2000);
    });

    frame.frame.addEventListener('load', () => {
        tab.loading = false;
        clearTimeout(tab.skipTimeout);
        if (tab.id === activeTabId) showIframeLoading(false);
        try { if (frame.frame.contentWindow.document.title) tab.title = frame.frame.contentWindow.document.title; } catch { }
        if (frame.frame.contentWindow.location.href.includes('NT.html')) { tab.title = "New Tab"; tab.url = ""; tab.favicon = null; }
        updateTabsUI();
        updateAddressBar();
        updateLoadingBar(tab, 100);
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
    updateAddressBar();
}

function closeTab(tabId) {
    const idx = tabs.findIndex(t => t.id === tabId);
    if (idx === -1) return;

    const tab = tabs[idx];
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
        input = input.includes('.') && !input.includes(' ') ? `https://${input}` : `https://search.brave.com/search?q=${encodeURIComponent(input)}`;
    }
    tab.loading = true;
    showIframeLoading(true, input);
    updateLoadingBar(tab, 10);
    tab.frame.go(input);
}

function updateLoadingBar(tab, percent) {
    if (tab.id !== activeTabId) return;
    const bar = document.getElementById("loading-bar");
    bar.style.width = percent + "%";
    bar.style.opacity = percent === 100 ? "0" : "1";
    if (percent === 100) setTimeout(() => { bar.style.width = "0%"; }, 200);
}

//settings
// settings
function openSettings() {
    const modal = document.getElementById('wisp-settings-modal');
    modal.classList.remove('hidden');
    document.getElementById('close-wisp-modal').onclick = () => modal.classList.add('hidden');
    document.getElementById('save-custom-wisp').onclick = saveCustomWisp;
    document.getElementById('apply-custom-bg').onclick = applyCustomBackground;

    // Tab switching
    const tabs = modal.querySelectorAll('.nav-tab');
    const panels = modal.querySelectorAll('.settings-panel');
    const title = document.getElementById('modal-title');
    const footer = document.getElementById('settings-footer');

    tabs.forEach(tab => {
        tab.onclick = () => {
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            const target = tab.dataset.tab;
            document.getElementById(`${target}-panel`).classList.add('active');

            if (target === 'proxy') {
                title.innerHTML = '<i class="fa-solid fa-server"></i> Proxy Settings';
                footer.textContent = 'Lower ping = faster browsing';
            } else {
                title.innerHTML = '<i class="fa-solid fa-palette"></i> Appearance';
                footer.textContent = 'Changes apply globally';
            }
        };
    });

    renderServerList();
    renderBackgroundPresets();
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
                <div class="server-status"><span class="ping-text">...</span><div class="status-indicator"></div>${isCustom ? `<button class="delete-wisp-btn" onclick="deleteCustomWisp('${server.url}')"><i class="fa-solid fa-trash"></i></button>` : ''}</div>
            </div>
            <div class="wisp-option-url">${server.url}</div>`;

        item.onclick = () => setWisp(server.url);
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
        navigator.serviceWorker.controller?.postMessage({ type: 'config', autoswitch: !isAutoswitch });
        location.reload();
    };
    list.appendChild(toggle);
}

function renderBackgroundPresets() {
    const grid = document.getElementById('bg-presets-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const presets = SITE_CONFIG.backgroundPresets || [];
    const settings = window.Settings?.getAll() || {};
    const currentBg = settings.customBackground || { id: 'none' };

    presets.forEach(bg => {
        const card = document.createElement('div');
        card.className = `preset-card ${currentBg.id === bg.id ? 'active' : ''}`;

        let previewHtml = '';
        if (bg.type === 'none') {
            previewHtml = `<div style="width:100%;height:100%;background:var(--bg);display:flex;align-items:center;justify-content:center;"><i class="fa-solid fa-ban"></i></div>`;
        } else if (bg.type === 'image') {
            previewHtml = `<img src="${bg.url}" loading="lazy">`;
        } else {
            previewHtml = `<div style="width:100%;height:100%;background:#111;display:flex;align-items:center;justify-content:center;"><i class="fa-solid fa-video"></i></div>`;
        }

        card.innerHTML = `
            ${previewHtml}
            <div class="preset-info">${bg.name}</div>
        `;

        card.onclick = () => {
            window.Settings?.set('customBackground', bg);
            // background.js listens for storage/settings-changed events
            renderBackgroundPresets();
        };

        grid.appendChild(card);
    });
}

function applyCustomBackground() {
    const url = document.getElementById('custom-bg-input').value.trim();
    if (!url) return;

    window.Settings?.set('customBackground', { id: 'custom', type: 'image', url: url, overlay: 0.4 });
    notify('success', 'Background Applied', 'Custom background set');
    renderBackgroundPresets();
}


function saveCustomWisp() {
    const url = document.getElementById('custom-wisp-input').value.trim();
    if (!url || (!url.startsWith('ws://') && !url.startsWith('wss://'))) return notify('error', 'Invalid URL', 'Must start with ws:// or wss://');

    const customWisps = getStoredWisps();
    if ([...WISP_SERVERS, ...customWisps].some(w => w.url === url)) return notify('warning', 'Exists', 'Server already exists');

    customWisps.push({ name: `Custom ${customWisps.length + 1}`, url });
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
        txt.textContent = `${Date.now() - start}ms`;
    } catch {
        dot.classList.add('status-error');
        txt.textContent = 'Offline';
    }
}

function setWisp(url) {
    localStorage.setItem('proxServer', url);
    navigator.serviceWorker.controller?.postMessage({ type: 'config', wispurl: url });
    setTimeout(() => location.reload(), 500);
}

// =====================================================
// MAIN
// =====================================================

document.addEventListener('DOMContentLoaded', init);