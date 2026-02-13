const params = new URLSearchParams(window.location.search);
const type = params.get('type'), id = params.get('id'), title = params.get('title'), urlParam = params.get('url'), season = params.get('season'), episode = params.get('episode'), source = params.get('source');

const PROVIDERS = [
    { id: 'vidify', name: 'Vidify', urls: { movie: 'https://player.vidify.top/embed/movie/{id}', tv: 'https://player.vidify.top/embed/tv/{id}/{season}/{episode}' } },
    { id: 'vidfast', name: 'Vidfast', urls: { movie: 'https://vidfast.to/embed/movie/{id}', tv: 'https://vidfast.to/embed/tv/{id}/{season}/{episode}' } },
    { id: 'vidsrc_su', name: 'VidSrc', urls: { movie: 'https://vidsrc-embed.su/embed/movie?tmdb={id}', tv: 'https://vidsrc-embed.su/embed/tv?tmdb={id}&s={season}&e={episode}' } },
    ];

if (typeof window.PROVIDERS === 'undefined') {
    window.PROVIDERS = PROVIDERS;
}

const isPlayerPage = document.getElementById('game-frame') !== null;

if (isPlayerPage) {
    const frame = document.getElementById('game-frame'), titleEl = document.getElementById('player-title'), descEl = document.getElementById('player-desc'), quoteEl = document.getElementById('player-quote'), proxyToggle = document.getElementById('proxy-toggle');
    const chatContainer = document.getElementById('chat-container'), chatFrame = document.getElementById('chat-frame'), btnChat = document.getElementById('btn-chat');

    let currentUrl = '', curProvIdx = 0;

    class SmartSwitcher {
        constructor() { this.retry = 0; if (frame) frame.onload = () => (this.clear(), console.log('Loaded')); }
        clear() { clearTimeout(this.tm); this.tm = null; }
        start() { this.clear(); this.tm = setTimeout(() => this.fail(), 15000); }
        fail() {
            const isYT = currentUrl && (currentUrl.includes('youtube.com') || currentUrl.includes('youtube-nocookie.com'));
            if (type === 'video' || isYT) return; // Don't check search results/youtube
            if (++this.retry >= 3) return window.Notify?.error('Error', 'All providers failed');
            window.Notify?.info('Switching', 'Slow source, trying next...');
            if (type === 'game') this.toggleProxy(); else this.next();
        }
        next() {
            curProvIdx = (curProvIdx + 1) % PROVIDERS.length;
            const s = document.getElementById('provider-select');
            if (s) s.value = PROVIDERS[curProvIdx].id;
            loadProvider(PROVIDERS[curProvIdx].id, true);
        }
        toggleProxy() { if (proxyToggle) { proxyToggle.classList.toggle('active'); source === 'twitch' ? loadTwitch(id) : (type === 'game' ? loadGame(currentUrl, true) : loadProvider(PROVIDERS[curProvIdx].id, true)); } }
    }
    const switcher = new SmartSwitcher();

function init() {
    titleEl.textContent = title || (type === 'tv' ? `S${season} E${episode}` : (type === 'game' ? 'Game' : 'Movie'));
    if (source === 'twitch') {
        document.getElementById('movie-controls').style.display = 'flex';
        btnChat.style.display = 'flex';
        const provGroup = document.querySelector('.player-control-group');
        if (provGroup) provGroup.style.display = 'none';

        btnChat.onclick = () => toggleChat();

        chatContainer.style.display = 'block';
        btnChat.classList.add('active');

        if (proxyToggle) {
            proxyToggle.classList.add('active');
            const proxyParam = params.get('proxy');
            if (proxyParam === 'false') proxyToggle.classList.remove('active');
            proxyToggle.onclick = () => {
                proxyToggle.classList.toggle('active');
                switcher.retry = 0;
                loadTwitch(id);
            };
        }
        loadTwitch(id);
    } else if (type === 'game' || type === 'video') {
        if (type === 'game') document.getElementById('btn-download').style.display = 'flex';
        if (urlParam) loadGame(urlParam);
    } else {
        document.getElementById('movie-controls').style.display = 'flex';
        const sel = document.getElementById('provider-select');
        PROVIDERS.forEach(p => sel.add(new Option(p.name, p.id)));
        sel.onchange = () => {
            const idx = PROVIDERS.findIndex(p => p.id === sel.value);
            if (idx !== -1) curProvIdx = idx;
            switcher.retry = 0;
            window.Notify?.info('Source Changed', `Now using ${PROVIDERS[idx].name}`);
            loadProvider(sel.value);
        };
        if (proxyToggle) {
            proxyToggle.onclick = () => {
                proxyToggle.classList.toggle('active');
                switcher.retry = 0;
                loadProvider(PROVIDERS[curProvIdx].id);
            };
        }
        // Load default provider from settings or use first provider
        const userDefaultProvider = window.Settings?.get('defaultProvider');
        const defaultProvider = userDefaultProvider && PROVIDERS.find(p => p.id === userDefaultProvider) ? userDefaultProvider : PROVIDERS[0].id;
        const defaultIdx = PROVIDERS.findIndex(p => p.id === defaultProvider);
        if (defaultIdx !== -1) curProvIdx = defaultIdx;
        if (sel) sel.value = defaultProvider;
        loadProvider(defaultProvider);
    }
    const q = window.Quotes ? window.Quotes.getRandom() : '';
    descEl.textContent = (type !== 'game' ? (JSON.parse(sessionStorage.getItem('currentMovie') || '{}').overview || 'No description') : '');
    if (quoteEl) quoteEl.textContent = q;

    // Ambiance Toggle Support
    const ambianceBtn = document.getElementById('btn-ambiance');
    if (ambianceBtn) {
        ambianceBtn.onclick = () => {
            const isActive = window.Ambiance?.toggle();
            ambianceBtn.classList.toggle('active', isActive);
        };
        // Set initial state visual
        if (localStorage.getItem('phantom_ambiance_enabled') !== 'false') {
            ambianceBtn.classList.add('active');
        }
    }

    saveWatchProgress();
}

const videoFrame = document.getElementById('video-frame');
let hlsPlayer = null;
let ytPlayer = null;
let ytInterval = null;

// YouTube API Loading
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// Cooperative YouTube API Loading
const oldYTReady = window.onYouTubeIframeAPIReady;
window.onYouTubeIframeAPIReady = () => {
    if (oldYTReady) oldYTReady();
    console.log('Player YouTube API Ready');
};

function getSavedProgress() {
    const key = (type === 'game' || type === 'video') ? urlParam : id;
    if (key) {
        const data = localStorage.getItem(`progress_${key}`);
        return data ? JSON.parse(data) : null;
    }
    return null;
}

async function loadGame(url, silent = false) {
    currentUrl = url;
    if (!silent) switcher.retry = 0;
    switcher.start();

    const gameImg = params.get('img');
    if (gameImg) window.Ambiance?.setSource(gameImg);

    // Reset visibility
    frame.style.display = 'block';
    frame.width = "100%";
    frame.height = "100%";
    videoFrame.style.display = 'none';
    if (hlsPlayer) { hlsPlayer.destroy(); hlsPlayer = null; }

    // Clear YouTube player trackers
    if (ytInterval) { clearInterval(ytInterval); ytInterval = null; }
    ytPlayer = null;

    const saved = getSavedProgress();
    const startOffset = saved ? saved.currentTime : 0;

    // Check if it's an HLS stream (m3u8)
    const isHLS = url.includes('.m3u8') || url.includes('twitch.leelive2021.workers.dev');

    if (isHLS) {
        frame.style.display = 'none';
        videoFrame.style.display = 'block';

        const initVideo = () => {
            if (startOffset > 0) videoFrame.currentTime = startOffset;
            videoFrame.play();
        };

        if (Hls.isSupported()) {
            hlsPlayer = new Hls();
            hlsPlayer.loadSource(url);
            hlsPlayer.attachMedia(videoFrame);
            hlsPlayer.on(Hls.Events.MANIFEST_PARSED, initVideo);
        } else if (videoFrame.canPlayType('application/vnd.apple.mpegurl')) {
            videoFrame.src = url;
            videoFrame.addEventListener('loadedmetadata', initVideo);
        }

        // Track progress for native video
        videoFrame.ontimeupdate = () => {
            updateHistoryProgress(videoFrame.currentTime, videoFrame.duration);
        };
        // Use native video for ambiance if available
        window.Ambiance?.setSource(videoFrame);
    } else if (url.includes('#') || url.includes('staticsjv2/') || url.includes('youtube.com') || url.includes('youtube-nocookie.com') || url.includes('workers.dev')) {
        let finalUrl = url;
        const isYT = url.includes('youtube.com') || url.includes('youtube-nocookie.com');

        if (isYT) {
            const separator = finalUrl.includes('?') ? '&' : '?';
            finalUrl += `${separator}enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`;
        }

        if (startOffset > 0) {
            const separator = finalUrl.includes('?') ? '&' : '?';
            const param = isYT ? 'start' : 't';
            finalUrl = `${finalUrl}${separator}${param}=${Math.floor(startOffset)}`;
        }

        frame.src = finalUrl;

        // For iframes, use thumbnail as source
        window.Ambiance?.setSource(params.get('img'));

        if (isYT) {
            // Wait for API and frame to be ready
            frame.onload = () => {
                if (window.YT && YT.Player) {
                    ytPlayer = new YT.Player(frame, {
                        events: {
                            'onStateChange': (event) => {
                                if (event.data === YT.PlayerState.PLAYING) {
                                    if (!ytInterval) {
                                        ytInterval = setInterval(() => {
                                            if (ytPlayer && ytPlayer.getCurrentTime) {
                                                const cur = ytPlayer.getCurrentTime();
                                                const dur = ytPlayer.getDuration();
                                                if (dur > 0) updateHistoryProgress(cur, dur);
                                            }
                                        }, 2000);
                                    }
                                } else {
                                    clearInterval(ytInterval);
                                    ytInterval = null;
                                }
                            }
                        }
                    });
                }
            };
        }
    } else {
        try {
            const h = await (await fetch(url)).text();
            const d = frame.contentDocument || frame.contentWindow.document;
            d.open(); d.write(h); d.close();
        } catch (e) { frame.src = url; }
    }
}

function loadTwitch(channel) {
    const url = proxyToggle?.classList.contains('active')
        ? `https://twitch.leelive2021.workers.dev/?channel=${encodeURIComponent(channel)}`
        : `https://player.twitch.tv/?channel=${encodeURIComponent(channel)}&parent=${window.location.hostname}`;

    // Always update chat src if it's twitch
    chatFrame.src = `https://www.twitch.tv/embed/${encodeURIComponent(channel)}/chat?parent=${window.location.hostname}&darkpopout`;

    loadGame(url);
}

function toggleChat() {
    const isVisible = chatContainer.style.display !== 'none';
    chatContainer.style.display = isVisible ? 'none' : 'block';
    btnChat.classList.toggle('active', !isVisible);
}

function loadProvider(pid, silent = false) {
    const p = PROVIDERS.find(x => x.id === pid);
    if (!p) return;
    if (!silent) switcher.retry = 0;
    switcher.start();
    let u = (type === 'movie' ? p.urls.movie : p.urls.tv).replace('{id}', id).replace('{tmdb_id}', id).replace('{season}', season).replace('{episode}', episode);

    const saved = getSavedProgress();
    if (saved && saved.currentTime > 0) {
        const separator = u.includes('?') ? '&' : '?';
        const param = pid === 'vidify' ? 't' : 'start';
        u += `${separator}${param}=${Math.floor(saved.currentTime)}`;
    }

    if (proxyToggle?.classList.contains('active')) u = `../staticsjv2/embed.html#${u}`;

    // Proper reload: clear src first, then set new URL
    currentUrl = u;
    const oldSrc = frame.src;
    frame.src = 'about:blank';
    setTimeout(() => { frame.src = u; }, 10);

    const imgVal = params.get('img');
    if (imgVal) window.Ambiance?.setSource(imgVal);
}

function updateHistoryProgress(currentTime, duration, mediaIdOverride = null) {
    if (source === 'twitch' || type === 'twitch') return;
    if (window.Settings && window.Settings.get('historyEnabled') === false) return;
    const history = JSON.parse(localStorage.getItem('continue_watching') || '[]');
    if (history.length > 0) {
        const progress = {
            currentTime,
            duration,
            percentage: (currentTime / duration) * 100
        };
        history[0].progress = progress;
        history[0].timestamp = Date.now(); // Keep timestamp update for history
        localStorage.setItem('continue_watching', JSON.stringify(history));

        // Also save to individual key for getSavedProgress
        const key = (type === 'game' || type === 'video') ? urlParam : id;
        if (key) {
            localStorage.setItem(`progress_${key}`, JSON.stringify({
                currentTime,
                duration,
                lastWatched: Date.now() // Include lastWatched for individual progress
            }));
        }
    }
}

document.getElementById('btn-reload').onclick = () => {
    window.Notify?.info('Reloading', 'Refreshing content...');
    switcher.retry = 0;
    if (type === 'game' || type === 'video' || source === 'twitch') {
        loadGame(currentUrl);
    } else {
        const oldSrc = frame.src;
        frame.src = 'about:blank';
        setTimeout(() => { frame.src = oldSrc; }, 10);
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
// Theater Mode Logic
let idleTimer;
const resetIdleTimer = () => {
    if (!document.body.classList.contains('theater-active')) return;
    document.body.classList.remove('user-idle');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
        if (document.body.classList.contains('theater-active')) {
            document.body.classList.add('user-idle');
        }
    }, 3000);
};

['mousemove', 'mousedown', 'keydown', 'touchstart'].forEach(e => {
    document.addEventListener(e, resetIdleTimer, { passive: true });
});

document.getElementById('btn-theater').onclick = () => {
    const b = document.body;
    const isTheater = b.classList.toggle('theater-active');
    const btn = document.getElementById('btn-theater');
    btn.innerHTML = isTheater ? '<i class="fa-solid fa-compress"></i> Exit Theater' : '<i class="fa-solid fa-masks-theater"></i> Theater Mode';

    window.scrollTo(0, 0);

    if (isTheater) {
        window.Notify?.success('Theater Mode', 'Enjoy your movie!');
        resetIdleTimer();
    } else {
        b.classList.remove('user-idle');
        clearTimeout(idleTimer);
    }
};

// Vidify Progress-Tracking
window.addEventListener('message', (event) => {
    if (event.origin !== 'https://player.vidify.top') return;

    if (event.data?.type === 'WATCH_PROGRESS') {
        const { mediaId, eventType, currentTime, duration } = event.data.data;

        if (eventType === 'timeupdate' || eventType === 'pause' || eventType === 'play') {
            updateHistoryProgress(currentTime, duration, mediaId);
        }
    }
});

    init();
}
