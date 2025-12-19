
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
    { id: 'vidfast', name: 'Vidfast', urls: { movie: 'https://vidfast.to/embed/movie/{id}', tv: 'https://vidfast.to/embed/tv/{id}&s={season}&e={episode}' }, isActive: true },
    { id: 'vidsrc', name: 'VidSrc', urls: { movie: 'https://vidsrc-embed.su/embed/movie?tmdb={id}', tv: 'https://vidsrc-embed.su/embed/tv?tmdb={id}&s={season}&e={episode}' }, isActive: true },
    { id: '2embed', name: '2Embed', urls: { movie: 'https://www.2embed.cc/embed/{tmdb_id}', tv: 'https://www.2embed.cc/embedtv/{tmdb_id}&s={season}&e={episode}' }, isActive: true },

];

let currentUrl = '';

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

        select.onchange = () => loadProvider(select.value);

        if (proxyToggle) {
            proxyToggle.onchange = () => loadProvider(select.value);
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
            descText += '\n\n' + randomQuote + '';
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

function toggleTheater(force) {
    const btn = document.getElementById('btn-theater');
    const isActive = force !== undefined ? force : !document.body.classList.contains('theater-active');

    if (isActive) {
        document.body.classList.add('theater-active');
        if (btn) {
            btn.classList.add('active');
            btn.innerHTML = '<i class="fa-solid fa-compress"></i> Exit Theater';
        }
        if (window.Notify) window.Notify.info('Theater Mode', 'Enjoy your movie!');
    } else {
        document.body.classList.remove('theater-active');
        if (btn) {
            btn.classList.remove('active');
            btn.innerHTML = '<i class="fa-solid fa-masks-theater"></i> Theater Mode';
        }
    }
}

async function loadGame(url) {
    try {
        if (window.Notify) window.Notify.info('Game', 'Loading game...');

        // If the URL has a hash (proxy games) or is a local proxy page, use src directly
        // This is necessary because doc.write() won't preserve the hash for the script inside
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
        if (url.startsWith('http') || url.includes('#')) frame.src = url;
        else if (window.Notify) window.Notify.error('Error', 'Failed to load game');
    }
}

function loadProvider(providerId) {
    const provider = PROVIDERS.find(p => p.id === providerId);
    if (!provider) return;

    let u = '';
    if (type === 'movie') {
        u = provider.urls.movie.replace('{id}', id).replace('{tmdb_id}', id);
    } else {
        u = provider.urls.tv.replace('{id}', id).replace('{tmdb_id}', id).replace('{season}', season).replace('{episode}', episode);
    }

    if (proxyToggle && proxyToggle.checked) {
        // Resolve proxy path to absolute URL
        const proxyPath = new URL('../staticsjv2/embed.html', window.location.href).href;
        u = proxyPath + '#' + u;
    }

    currentUrl = u;
    frame.src = u;
}

document.getElementById('btn-reload').onclick = () => {
    if (type === 'game') {
        loadGame(currentUrl);
    } else {
        frame.src = frame.src;
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
        if (type === 'game') {
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
        else alert('Failed to open');
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
        else alert('Download failed');
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
