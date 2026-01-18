
const params = new URLSearchParams(window.location.search);
const type = params.get('type'); // 'game' or 'movie'
const id = params.get('id');
const title = params.get('title');
const urlParam = params.get('url');

// Movie specific params
const season = params.get('season');
const episode = params.get('episode');

const frame = document.getElementById('game-frame');
const titleEl = document.getElementById('player-title');
const descEl = document.getElementById('player-desc');
const proxyToggle = document.getElementById('proxy-toggle');

// Providers
const PROVIDERS = [
    { id: 'vidify', name: 'Vidify', urls: { movie: 'https://player.vidify.top/embed/movie/{id}', tv: 'https://player.vidify.top/embed/tv/{id}&s={season}&e={episode}' }, isActive: true },
    { id: 'vidfast', name: 'Vidfast', urls: { movie: 'https://vidfast.to/embed/movie/{id}', tv: 'https://vidfast.to/embed/tv/{id}&s={season}&e={episode}' }, isActive: true },
    { id: 'vidsrc', name: 'VidSrc', urls: { movie: 'https://vidsrc-embed.su/embed/movie?tmdb={id}', tv: 'https://vidsrc-embed.su/embed/tv?tmdb={id}&s={season}&e={episode}' }, isActive: true },
    { id: '2embed', name: '2Embed', urls: { movie: 'https://www.2embed.cc/embed/{tmdb_id}', tv: 'https://www.2embed.cc/embedtv/{tmdb_id}&s={season}&e={episode}' }, isActive: true },
];

let currentUrl = '';
let currentProviderIndex = 0;

/**
 * SmartSwitcher: Monitors iframe loading and handles failures
 */
class SmartSwitcher {
    constructor() {
        this.timeout = null;
        this.duration = 15000; // 15 seconds
        this.isLoading = false;
        this.retryCount = 0;
        this.maxRetries = 5;

        // Note: frame.onload is notoriously unreliable for cross-origin iframes 
        // that fail to load (e.g. connection refused). The timeout is our primary defense.
        frame.addEventListener('load', () => {
            console.log("SmartSwitcher: Content process signal received");
            this.stop();
        });
    }

    start() {
        this.stop();
        this.isLoading = true;
        this.timeout = setTimeout(() => this.onTimeout(), this.duration);
    }

    stop() {
        if (this.timeout) clearTimeout(this.timeout);
        this.timeout = null;
        this.isLoading = false;
    }

    async onTimeout() {
        if (!this.isLoading) return;

        this.retryCount++;
        console.warn('SmartSwitcher: Loading timeout reached. Attempt:', this.retryCount);

        const settings = window.Settings ? window.Settings.getAll() : {};
        const autoSwitch = settings.autoSwitchProviders !== false;

        if (this.retryCount >= this.maxRetries) {
            if (window.Notify) window.Notify.error('Load Error', 'All automatic attempts failed. Please try a different source manually.');
            this.stop();
            return;
        }

        if (autoSwitch) {
            if (window.Notify) window.Notify.info('Switching', 'Source is slow or down. Trying next...', null, 3000);
            this.handleSwitch();
        } else {
            if (window.Notify) {
                window.Notify.info('Slow Source', 'This source is taking longer than expected.', [
                    { text: 'Switch Provider', action: () => { this.reset(); this.handleSwitch(); } },
                    { text: 'Try Proxy', action: () => { this.reset(); this.toggleProxyAndReload(); } }
                ]);
            }
            this.stop(); // Don't keep timing if we asked the user
        }
    }

    handleSwitch() {
        if (type === 'game') {
            this.toggleProxyAndReload();
        } else {
            currentProviderIndex = (currentProviderIndex + 1) % PROVIDERS.length;
            const select = document.getElementById('provider-select');
            if (select) {
                select.value = PROVIDERS[currentProviderIndex].id;
                loadProvider(select.value, true);
            } else {
                // Fallback if select is missing
                loadProvider(PROVIDERS[currentProviderIndex].id, true);
            }
        }
    }

    toggleProxyAndReload() {
        if (proxyToggle) {
            proxyToggle.checked = !proxyToggle.checked;
            if (type === 'game') {
                loadGame(currentUrl, true);
            } else {
                loadProvider(PROVIDERS[currentProviderIndex].id, true);
            }
        }
    }

    reset() {
        this.stop();
        this.retryCount = 0;
    }
}

const switcher = new SmartSwitcher();

function init() {
    if (type === 'game') {
        document.getElementById('btn-download').style.display = 'flex';
        currentUrl = urlParam || '';
        titleEl.textContent = title || 'Game';

        if (window.QUOTES) {
            descEl.textContent = window.QUOTES[Math.floor(Math.random() * window.QUOTES.length)];
        }

        if (currentUrl) {
            loadGame(currentUrl);
        }

    } else if (type === 'movie' || type === 'tv') {
        document.getElementById('movie-controls').style.display = 'flex';
        titleEl.textContent = title || (type === 'tv' ? `S${season} E${episode}` : 'Movie');

        const select = document.getElementById('provider-select');
        PROVIDERS.filter(p => p.isActive).forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.name;
            select.appendChild(opt);
        });

        select.onchange = () => {
            currentProviderIndex = PROVIDERS.findIndex(p => p.id === select.value);
            switcher.reset();
            loadProvider(select.value);
        };

        if (proxyToggle) {
            proxyToggle.onchange = () => {
                switcher.reset();
                loadProvider(PROVIDERS[currentProviderIndex].id);
            };
        }

        loadProvider(PROVIDERS[0].id);

        let descText = 'No description available.';
        try {
            const stored = sessionStorage.getItem('currentMovie');
            if (stored) {
                const data = JSON.parse(stored);
                if (data.id == id && data.overview) {
                    descText = data.overview;
                }
            }
        } catch (e) { }

        if (window.QUOTES) {
            const randomQuote = window.QUOTES[Math.floor(Math.random() * window.QUOTES.length)];
            descText += '\n\n' + randomQuote;
        }
        descEl.style.whiteSpace = 'pre-line';
        descEl.textContent = descText;
    }
}

// Global Key Listeners
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('theater-active')) {
        toggleTheater(false);
    }
});

// Theater Mode Logic
let theaterIdleTimer;

function resetTheaterIdle() {
    if (!document.body.classList.contains('theater-active')) return;

    document.body.classList.remove('user-idle');
    clearTimeout(theaterIdleTimer);

    theaterIdleTimer = setTimeout(() => {
        if (document.body.classList.contains('theater-active')) {
            document.body.classList.add('user-idle');
        }
    }, 1500);
}

window.addEventListener('mousemove', resetTheaterIdle);
window.addEventListener('keydown', resetTheaterIdle);
window.addEventListener('click', resetTheaterIdle);

function toggleTheater(force) {
    const btn = document.getElementById('btn-theater');
    const isActive = force !== undefined ? force : !document.body.classList.contains('theater-active');

    if (isActive) {
        window.scrollTo(0, 0); // Reset scroll position
        document.body.classList.add('theater-active');
        if (btn) {
            btn.classList.add('active');
            btn.innerHTML = '<i class="fa-solid fa-compress"></i> Exit Theater';
        }
        if (window.Notify) window.Notify.info('Theater Mode', 'Enjoy Your Movie!');
        resetTheaterIdle();
    } else {
        document.body.classList.remove('theater-active');
        document.body.classList.remove('user-idle');
        clearTimeout(theaterIdleTimer);

        if (btn) {
            btn.classList.remove('active');
            btn.innerHTML = '<i class="fa-solid fa-masks-theater"></i> Theater Mode';
        }
    }
}

async function loadGame(url, silent = false) {
    try {
        if (!silent) {
            if (window.Notify) window.Notify.info('Game', 'Loading game...');
            switcher.reset();
        }
        switcher.start();

        if (url.includes('#') || url.includes('staticsjv2/')) {
            frame.src = url;
            currentUrl = url;
            return;
        }

        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch game');
        const html = await res.text();

        const doc = frame.contentDocument || frame.contentWindow.document;
        doc.open();
        doc.write(html);
        doc.close();

        currentUrl = url;
    } catch (e) {
        console.error("Game load error", e);
        if (url.startsWith('http') || url.includes('#')) {
            frame.src = url;
        } else if (window.Notify) {
            window.Notify.error('Error', 'Failed to load game');
        }
    }
}

function loadProvider(providerId, silent = false) {
    const provider = PROVIDERS.find(p => p.id === providerId);
    if (!provider) return;

    if (!silent) {
        if (window.Notify) window.Notify.info('Source', `Loading from ${provider.name}...`);
        switcher.reset();
    }

    switcher.start();

    let u = '';
    if (type === 'movie') {
        u = provider.urls.movie.replace('{id}', id).replace('{tmdb_id}', id);
    } else {
        u = provider.urls.tv.replace('{id}', id).replace('{tmdb_id}', id).replace('{season}', season).replace('{episode}', episode);
    }

    if (proxyToggle && proxyToggle.checked) {
        const proxyPath = new URL('../staticsjv2/embed.html', window.location.href).href;
        u = proxyPath + '#' + u;
    }

    currentUrl = u;
    frame.src = u;
}

document.getElementById('btn-reload').onclick = () => {
    switcher.reset();
    if (type === 'game') {
        loadGame(currentUrl);
    } else {
        loadProvider(PROVIDERS[currentProviderIndex].id);
    }
};

document.getElementById('btn-theater').onclick = () => toggleTheater();

document.getElementById('btn-fullscreen').onclick = () => {
    if (frame.requestFullscreen) frame.requestFullscreen();
    else if (frame.webkitRequestFullscreen) frame.webkitRequestFullscreen();
    else if (frame.mozRequestFullScreen) frame.mozRequestFullScreen();
    else document.getElementById('frame-wrapper').requestFullscreen();
};

document.getElementById('btn-newtab').onclick = async () => {
    const btn = document.getElementById('btn-newtab');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading...';
    btn.disabled = true;

    try {
        const settings = tryGetSettings();
        let openMethod = settings.openIn || 'about:blank';
        let finalUrl = new URL(currentUrl, window.location.href).href;

        const win = window.open('about:blank', '_blank');
        if (!win) throw new Error('Popup blocked');

        let htmlContent = '';
        if (type === 'game' && !finalUrl.includes('staticsjv2/')) {
            const res = await fetch(finalUrl);
            if (!res.ok) throw new Error('Failed to fetch game');
            htmlContent = await res.text();
        } else {
            const iframeStyle = "position:fixed; top:0; left:0; bottom:0; right:0; width:100%; height:100%; border:none; margin:0; padding:0; overflow:hidden; z-index:999999;";
            htmlContent = [
                '<!DOCTYPE html>',
                '<html>',
                '<head><title>' + (title || 'Phantom') + '</title><style>body{margin:0;background:#000;}</style></head>',
                '<body>',
                '<iframe src="' + finalUrl + '" style="' + iframeStyle + '" allowfullscreen></iframe>',
                '</body>',
                '</html>'
            ].join('\n');
        }

        if (openMethod === 'blob') {
            const blob = new Blob([htmlContent], { type: 'text/html' });
            win.location.href = URL.createObjectURL(blob);
        } else {
            win.document.write(htmlContent);
            win.document.close();
        }
    } catch (e) {
        console.error(e);
        if (window.Notify) window.Notify.error('Error', 'Failed to open in new tab');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
};

document.getElementById('btn-download').onclick = async () => {
    const btn = document.getElementById('btn-download');
    const originalText = btn.innerHTML;

    try {
        if (type !== 'game') return;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Downloading...';

        const res = await fetch(currentUrl);
        if (!res.ok) throw new Error('Failed to fetch game code');
        const code = await res.text();

        const blob = new Blob([code], { type: 'text/html' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = (title || 'game').replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        if (window.Notify) window.Notify.success('Success', 'Download started');
    } catch (e) {
        console.error(e);
        if (window.Notify) window.Notify.error('Error', 'Failed to download game');
    } finally {
        btn.innerHTML = originalText;
    }
};

function tryGetSettings() {
    try {
        return {
            cloak: window.Settings ? window.Settings.get('cloak') : 'default',
            openIn: window.Settings ? window.Settings.get('openIn') : 'about:blank'
        };
    } catch { return { cloak: 'default', openIn: 'about:blank' }; }
}

init();
