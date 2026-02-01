const params = new URLSearchParams(window.location.search);
const type = params.get('type'), id = params.get('id'), title = params.get('title'), urlParam = params.get('url'), season = params.get('season'), episode = params.get('episode');
const frame = document.getElementById('game-frame'), titleEl = document.getElementById('player-title'), descEl = document.getElementById('player-desc'), quoteEl = document.getElementById('player-quote'), proxyToggle = document.getElementById('proxy-toggle');

const PROVIDERS = [
    { id: 'vidify', name: 'Vidify', urls: { movie: 'https://player.vidify.top/embed/movie/{id}', tv: 'https://player.vidify.top/embed/tv/{id}&s={season}&e={episode}' } },
    { id: 'vidfast', name: 'Vidfast', urls: { movie: 'https://vidfast.to/embed/movie/{id}', tv: 'https://vidfast.to/embed/tv/{id}&s={season}&e={episode}' } },
    { id: 'vidsrc', name: 'VidSrc', urls: { movie: 'https://vidsrc-embed.su/embed/movie?tmdb={id}', tv: 'https://vidsrc-embed.su/embed/tv?tmdb={id}&s={season}&e={episode}' } }
];

let currentUrl = '', curProvIdx = 0;

class SmartSwitcher {
    constructor() { this.retry = 0; frame.onload = () => (this.clear(), console.log('Loaded')); }
    clear() { clearTimeout(this.tm); this.tm = null; }
    start() { this.clear(); this.tm = setTimeout(() => this.fail(), 15000); }
    fail() {
        if (++this.retry >= 3) return window.Notify?.error('Error', 'All providers failed');
        window.Notify?.info('Switching', 'Slow source, trying next...');
        if (type === 'game') this.toggleProxy(); else this.next();
    }
    next() { curProvIdx = (curProvIdx + 1) % PROVIDERS.length; const s = document.getElementById('provider-select'); if (s) s.value = PROVIDERS[curProvIdx].id; loadProvider(PROVIDERS[curProvIdx].id, true); }
    toggleProxy() { if (proxyToggle) { proxyToggle.checked = !proxyToggle.checked; type === 'game' ? loadGame(currentUrl, true) : loadProvider(PROVIDERS[curProvIdx].id, true); } }
}
const switcher = new SmartSwitcher();

function init() {
    titleEl.textContent = title || (type === 'tv' ? `S${season} E${episode}` : (type === 'game' ? 'Game' : 'Movie'));
    if (type === 'game') {
        document.getElementById('btn-download').style.display = 'flex';
        if (urlParam) loadGame(urlParam);
    } else {
        document.getElementById('movie-controls').style.display = 'flex';
        const sel = document.getElementById('provider-select');
        PROVIDERS.forEach(p => sel.add(new Option(p.name, p.id)));
        sel.onchange = () => (switcher.retry = 0, loadProvider(sel.value));
        if (proxyToggle) proxyToggle.onchange = () => (switcher.retry = 0, loadProvider(PROVIDERS[curProvIdx].id));
        loadProvider(PROVIDERS[0].id);
    }
    const q = window.Quotes ? window.Quotes.getRandom() : '';
    descEl.textContent = (type !== 'game' ? (JSON.parse(sessionStorage.getItem('currentMovie') || '{}').overview || 'No description') : '');
    if (quoteEl) quoteEl.textContent = q;
}

const videoFrame = document.getElementById('video-frame');
let hlsPlayer = null;

async function loadGame(url, silent = false) {
    currentUrl = url;
    if (!silent) switcher.retry = 0;
    switcher.start();

    // Reset visibility
    frame.style.display = 'block';
    videoFrame.style.display = 'none';
    if (hlsPlayer) { hlsPlayer.destroy(); hlsPlayer = null; }

    // Check if it's an HLS stream (m3u8 or Twitch proxy)
    const isHLS = url.includes('.m3u8') || url.includes('twitch.leelive2021.workers.dev');

    if (isHLS) {
        frame.style.display = 'none';
        videoFrame.style.display = 'block';
        if (Hls.isSupported()) {
            hlsPlayer = new Hls();
            hlsPlayer.loadSource(url);
            hlsPlayer.attachMedia(videoFrame);
            hlsPlayer.on(Hls.Events.MANIFEST_PARSED, () => videoFrame.play());
        } else if (videoFrame.canPlayType('application/vnd.apple.mpegurl')) {
            videoFrame.src = url;
            videoFrame.addEventListener('loadedmetadata', () => videoFrame.play());
        }
    } else if (url.includes('#') || url.includes('staticsjv2/') || url.includes('youtube.com') || url.includes('youtube-nocookie.com')) {
        frame.src = url;
    } else {
        try {
            const h = await (await fetch(url)).text();
            const d = frame.contentDocument || frame.contentWindow.document;
            d.open(); d.write(h); d.close();
        } catch (e) { frame.src = url; }
    }
}

function loadProvider(pid, silent = false) {
    const p = PROVIDERS.find(x => x.id === pid);
    if (!p) return;
    if (!silent) switcher.retry = 0;
    switcher.start();
    let u = (type === 'movie' ? p.urls.movie : p.urls.tv).replace('{id}', id).replace('{tmdb_id}', id).replace('{season}', season).replace('{episode}', episode);
    if (proxyToggle?.checked) u = `../staticsjv2/embed.html#${u}`;
    currentUrl = u; frame.src = u;
}

document.getElementById('btn-reload').onclick = () => {
    window.Notify?.info('Reloading', 'Refreshing content...');
    switcher.retry = 0;
    type === 'game' ? loadGame(currentUrl) : loadProvider(PROVIDERS[curProvIdx].id);
};
document.getElementById('btn-theater').onclick = () => {
    const b = document.body;
    const isTheater = b.classList.toggle('theater-active');
    const btn = document.getElementById('btn-theater');
    btn.innerHTML = isTheater ? '<i class="fa-solid fa-compress"></i> Exit Theater' : '<i class="fa-solid fa-masks-theater"></i> Theater Mode';

    // Scroll to top to prevent footer from showing
    window.scrollTo(0, 0);

    if (isTheater) {
        window.Notify?.success('Theater Mode', 'Enjoy your movie!');
    }
};
document.getElementById('btn-fullscreen').onclick = () => {
    window.Notify?.info('Fullscreen', 'Entering fullscreen mode...');
    const target = (videoFrame.style.display === 'block') ? videoFrame : frame;
    target.requestFullscreen?.() || target.webkitRequestFullscreen?.() || document.getElementById('frame-wrapper').requestFullscreen();
};
document.getElementById('btn-newtab').onclick = async () => {
    window.Notify?.info('Opening', 'Opening in new tab...');
    const win = window.open('about:blank', '_blank');
    if (!win) return;
    let html = type === 'game' && !currentUrl.includes('staticsjv2/') ? await (await fetch(currentUrl)).text() : `<!DOCTYPE html><html><head><title>${title || 'Phantom'}</title><style>body{margin:0;background:#000;}</style></head><body><iframe src="${currentUrl}" style="position:fixed;top:0;left:0;width:100%;height:100%;border:none;" allowfullscreen></iframe></body></html>`;
    if (window.Settings?.get('openIn') === 'blob') win.location.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    else { win.document.write(html); win.document.close(); }
};
document.getElementById('btn-download').onclick = async () => {
    window.Notify?.info('Downloading', 'Preparing download...');
    const b = new Blob([await (await fetch(currentUrl)).text()], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b); a.download = `${title || 'game'}.html`.replace(/\s+/g, '_');
    a.click();
    window.Notify?.success('Download Started', `${title || 'game'}.html`);
};

init();
