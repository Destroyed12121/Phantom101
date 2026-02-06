// config source
const SITE_CONFIG = window.SITE_CONFIG || {};
const DEFAULT_WISP = SITE_CONFIG.defaultWisp || "wss://glseries.net/wisp/";
const WISP_SERVERS = SITE_CONFIG.wispServers || [];

// state
const BareMux = window.BareMux || { BareMuxConnection: class { setTransport() { } } };
let sharedScramjet = null;
let sharedConnection = null;
let sharedConnectionReady = false;
let sharedScramjetPromise = null;
let sharedConnectionPromise = null;

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

    // Ping all in parallel with a shorter timeout
    const results = await Promise.all(servers.map(s => pingWispServer(s.url, 1500)));
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
    // robustly determine path even in about:blank or blob: contexts
    try {
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
            if (script.src && script.src.includes('script.js')) {
                const url = new URL(script.src);
                const path = url.pathname.replace('script.js', '');
                return path.endsWith('/') ? path : path + '/';
            }
        }
    } catch { }

    // Fallback logic
    let path = location.pathname;
    if (location.protocol === 'about:' || location.hostname === '') {
        try {
            const url = new URL(document.baseURI);
            path = url.pathname;
        } catch {
            return './';
        }
    }

    path = path.replace(/[^/]*$/, '');
    return path.endsWith('/') ? path : path + '/';
};

async function getSharedScramjet() {
    if (sharedScramjet) return sharedScramjet;
    if (sharedScramjetPromise) return sharedScramjetPromise;

    sharedScramjetPromise = (async () => {
        const { ScramjetController } = $scramjetLoadController();
        const instance = new ScramjetController({
            prefix: getBasePath() + "scramjet/",
            files: {
                wasm: "https://cdn.jsdelivr.net/gh/Destroyed12121/Staticsj@main/JS/scramjet.wasm.wasm",
                all: "https://cdn.jsdelivr.net/gh/Destroyed12121/Staticsj@main/JS/scramjet.all.js",
                sync: "https://cdn.jsdelivr.net/gh/Destroyed12121/Staticsj@main/JS/scramjet.sync.js"
            }
        });

        try {
            await instance.init();
            sharedScramjet = instance;
            return instance;
        } catch (err) {
            sharedScramjetPromise = null; // Allow retry
            if (err.message && (err.message.includes('IDBDatabase') || err.message.includes('object stores'))) {
                console.warn('Clearing IndexedDB due to error...');
                ['scramjet-data', 'scrambase', 'ScramjetData'].forEach(db => {
                    try { indexedDB.deleteDatabase(db); } catch { }
                });
                return getSharedScramjet();
            }
            throw err;
        }
    })();

    return sharedScramjetPromise;
}

async function getSharedConnection() {
    if (sharedConnectionReady) return sharedConnection;
    if (sharedConnectionPromise) return sharedConnectionPromise;

    sharedConnectionPromise = (async () => {
        const wispUrl = localStorage.getItem("proxServer") ?? DEFAULT_WISP;
        const connection = new BareMux.BareMuxConnection(getBasePath() + "bareworker.js");
        await connection.setTransport(
            "https://cdn.jsdelivr.net/npm/@mercuryworkshop/epoxy-transport@2.1.28/dist/index.mjs",
            [{ wisp: wispUrl }]
        );
        sharedConnection = connection;
        sharedConnectionReady = true;
        return connection;
    })();

    return sharedConnectionPromise;
}

async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    try {
        const swUrl = getBasePath() + 'sw.js';
        const reg = await navigator.serviceWorker.register(swUrl, { scope: getBasePath() });

        // Race ready against timeout to prevent hanging the entire init
        const readyPromise = navigator.serviceWorker.ready;
        const timeoutPromise = new Promise(r => setTimeout(() => r('timeout'), 1000));

        const result = await Promise.race([readyPromise, timeoutPromise]);
        if (result === 'timeout') {
            console.warn("SW: Ready signal timed out, proceeding anyway.");
        } else {
            console.log("SW: Ready");
        }

        const config = {
            type: "config",
            wispurl: localStorage.getItem("proxServer") ?? DEFAULT_WISP,
            servers: getAllWispServers(),
            autoswitch: localStorage.getItem('wispAutoswitch') !== 'false'
        };

        const send = () => {
            const sw = reg.active || navigator.serviceWorker?.controller;
            if (sw) sw.postMessage(config);
        };

        send();
        setTimeout(send, 500);

        navigator.serviceWorker.addEventListener('message', (e) => {
            if (e.data.type === 'wispChanged') {
                localStorage.setItem("proxServer", e.data.url);
                notify('info', 'Proxy Auto-switched', `Switched to ${e.data.name}. ${e.data.reason || 'Connection unstable.'}`);
            } else if (e.data.type === 'wispError') {
                notify('error', 'Proxy Error', e.data.message);
            } else if (e.data.type === 'navigate') {
                const tab = getActiveTab();
                if (tab && e.data.url) {
                    tab.loading = true;
                    tab.userSkipped = false;
                    showIframeLoading(true, e.data.url);
                    updateLoadingBar(tab, 10);
                    tab.frame.go(e.data.url);
                }
            } else if (e.data.type === 'resource-loaded') {
                const tab = getActiveTab();
                if (tab && tab.loading) {
                    const isError = e.data.status >= 400;
                    const increment = isError ? 0.5 : 2.5;
                    tab.progress = Math.min(96, tab.progress + increment);
                    updateLoadingBar(tab, tab.progress);
                }
            }
        });

        reg.update();
    } catch (err) {
        console.error("SW: Registration failed", err);
        // Do not throw, allow the browser to attempt working without SW (though proxying will likely fail)
    }
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

async function createTab(makeActive = true) {
    // If scramjet isn't ready, wait for it or use a placeholder
    try {
        if (!sharedScramjet) {
            console.log("Tab: Waiting for Scramjet...");
            await getSharedScramjet();
        }
    } catch (err) {
        console.error("Tab: Failed to init Scramjet", err);
        notify('error', 'Initialization Error', 'Failed to start proxy engine. Please reload.');
        return null;
    }

    const frame = sharedScramjet.createFrame();
    const tab = {
        id: nextTabId++,
        title: "New Tab",
        url: "NT.html",
        frame,
        loading: false,
        favicon: null,
        userSkipped: false,
        progress: 0
    };

    frame.frame.src = "NT.html";


    // Cleanup reference
    tab.cleanup = () => {
        // If frame exposes a cleanup/destroy method, call it here.
        // Since we remove the DOM element in closeTab, we just need to ensure no listeners leak.
        tab.frame = null;
    };

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
    updateAddressBar();
}

function closeTab(tabId) {
    const idx = tabs.findIndex(t => t.id === tabId);
    if (idx === -1) return;

    const tab = tabs[idx];
    if (tab.cleanup) tab.cleanup();
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
        bar._cleanup = setTimeout(() => {
            bar.style.width = "0%";
            bar._cleanup = null;
        }, 200);
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
    const controller = navigator.serviceWorker?.controller;
    if (controller) {
        controller.postMessage({ type: 'config', wispurl: url });
    }
    setTimeout(() => location.reload(), 500);
}

// =====================================================
// MAIN
// =====================================================


window.addEventListener('message', (e) => {
    if (e.data?.type === 'navigate' && e.data.url) {
        handleSubmit(e.data.url);
    }
});

document.addEventListener('DOMContentLoaded', init);