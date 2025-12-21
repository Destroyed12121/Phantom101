
// --- Config ---
// Invidious instances for YouTube fallback
const INVIDIOUS_INSTANCES = [
    'https://invidious.fdn.fr',
    'https://vid.puffyan.us',
    'https://invidious.nerdvpn.de',
    'https://y.com.sb'
];
let invidiousIdx = 0;
const getInvidiousInstance = () => INVIDIOUS_INSTANCES[invidiousIdx % INVIDIOUS_INSTANCES.length];
const rotateInvidiousInstance = () => { invidiousIdx++; console.warn(`Rotated to Invidious instance ${invidiousIdx % INVIDIOUS_INSTANCES.length}`); };


const YT_KEYS = ["AIzaSyBMhadsGk2S2B9bP46EycgI2y8yCWLLdAs", "AIzaSyCOeLUcSlLDWAbKDUc-LUx8hdsenY-97rU"];
let ytKeyIdx = 0;
const getYTKey = () => YT_KEYS[ytKeyIdx % YT_KEYS.length];
const rotateYTKey = () => { ytKeyIdx++; console.warn(`Rotated to YT Key ${ytKeyIdx % YT_KEYS.length}`); };


const PROXY_BASE = '../staticsjv2/embed.html#';


const trackCache = {};


const safeParse = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; }
    catch { return fallback; }
};

const state = {
    playbackSource: localStorage.getItem('music_playback_source') || 'youtube',
    radioMode: localStorage.getItem('music_radio') === 'true',
    proxyMode: localStorage.getItem('music_proxy') === 'true',
    liked: safeParse('music_liked', []),
    recent: safeParse('music_recent', []),
    playlists: safeParse('music_playlists', []),
    currentTrack: null, queue: [], queueIdx: -1,
    volume: parseFloat(localStorage.getItem('music_volume')) || 1.0,
    isPlaying: false, isShuffle: false, isRepeat: false,
    lyrics: [], lyricIdx: -1, addMenuTrackId: null,
    useInvidiousFallback: false,
    radioLoading: false,
    iframePaused: false
};

// --- DOM Elements ---
const $ = id => document.getElementById(id);
const audio1 = $('audio1'), audio2 = $('audio2');
let currentAudio = audio1;
let crossfadeTimer = null;

const searchInput = $('searchInput'), searchResults = $('searchResults');
const trackTitle = $('trackTitle'), trackArtist = $('trackArtist');
const albumCover = $('albumCover'), albumPlaceholder = $('albumPlaceholder');
const playPauseBtn = $('playPauseBtn'), progressBar = $('progressBar'), progressFill = $('progressFill');
const currentTimeEl = $('currentTime'), totalTimeEl = $('totalTime');
const volumeBar = $('volumeBar'), volumeFill = $('volumeFill'), volumeBtn = $('volumeBtn');
const shuffleBtn = $('shuffleBtn'), repeatBtn = $('repeatBtn'), likeBtn = $('likeBtn');
const radioBtn = $('radioBtn'), radioBadge = $('radioBadge'), proxyBtn = $('proxyBtn');
const lyricsContent = $('lyricsContent'), addMenu = $('addMenu');
const fallbackContainer = $('fallbackContainer'), fallbackFrame = $('fallbackFrame');

// Mobile menu
const sidebar = $('sidebar'), mobileMenuBtn = $('mobileMenuBtn'), closeSidebar = $('closeSidebar');
mobileMenuBtn.addEventListener('click', () => sidebar.classList.add('mobile-open'));
closeSidebar.addEventListener('click', () => sidebar.classList.remove('mobile-open'));
if (window.innerWidth <= 768) closeSidebar.style.display = 'block';

// Helpers
const esc = s => (s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const formatTime = s => isNaN(s) ? '0:00' : `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
const getEmbedUrl = (url) => state.proxyMode ? PROXY_BASE + encodeURIComponent(url) : url;
const notify = (type, title, msg) => typeof Notify !== 'undefined' ? Notify[type](title, msg) : console.log(title, msg);

// --- Tabs ---
document.querySelectorAll('.source-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.source-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        state.playbackSource = tab.dataset.source;
        localStorage.setItem('music_playback_source', state.playbackSource);
        if (searchInput.value.trim()) doSearch(searchInput.value.trim());
    });
});
const activeTab = document.querySelector(`.source-tab[data-source="${state.playbackSource}"]`);
if (activeTab) {
    document.querySelectorAll('.source-tab').forEach(t => t.classList.remove('active'));
    activeTab.classList.add('active');
}

// --- Search ---
let searchTimer;
let searchController = null;

searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    const q = searchInput.value.trim();
    if (q.length < 2) { searchResults.classList.remove('show'); return; }
    searchTimer = setTimeout(() => doSearch(q), 400);
});

// Handle direct URL paste
searchInput.addEventListener('paste', async (e) => {
    setTimeout(() => {
        const val = searchInput.value.trim();
        if (isValidMusicUrl(val)) {
            handleDirectUrl(val);
        }
    }, 100);
});

function isValidMusicUrl(url) {
    try {
        const u = new URL(url);
        return u.hostname.includes('youtube.com') ||
            u.hostname.includes('youtu.be') ||
            u.hostname.includes('soundcloud.com');
    } catch { return false; }
}

async function handleDirectUrl(url) {
    searchResults.innerHTML = '<div class="loading-text"><i class="fa-solid fa-spinner fa-spin"></i> Loading...</div>';
    searchResults.classList.add('show');

    try {
        let track = null;
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const videoId = extractYouTubeId(url);
            if (videoId) {
                track = await getYouTubeVideoDetailsInvidious(videoId);
            }
        } else if (url.includes('soundcloud.com')) {
            track = {
                id: 'sc_' + btoa(url).slice(0, 10),
                title: 'SoundCloud Track',
                artist: 'Loading...',
                artwork: '',
                url: url,
                source: 'soundcloud'
            };
        }

        if (track) {
            trackCache[track.id] = track;
            state.queue = [track]; state.queueIdx = 0;
            playTrack(track);
            searchResults.classList.remove('show');
            searchInput.value = '';
            notify('success', 'Playing', track.title);
        } else {
            searchResults.innerHTML = '<div class="loading-text">Could not load URL</div>';
        }
    } catch (e) {
        searchResults.innerHTML = `<div class="loading-text">Error: ${esc(e.message)}</div>`;
    }
}

function extractYouTubeId(url) {
    const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

async function getYouTubeVideoDetailsInvidious(videoId) {
    for (let i = 0; i < INVIDIOUS_INSTANCES.length; i++) {
        try {
            const instance = INVIDIOUS_INSTANCES[(invidiousIdx + i) % INVIDIOUS_INSTANCES.length];
            const res = await fetch(`${instance}/api/v1/videos/${videoId}`, {
                signal: AbortSignal.timeout(5000)
            });
            if (res.ok) {
                const data = await res.json();
                return {
                    id: 'yt_' + videoId,
                    title: data.title,
                    artist: data.author,
                    artwork: data.videoThumbnails?.[0]?.url || '',
                    url: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`,
                    source: 'youtube'
                };
            }
        } catch { continue; }
    }
    return null;
}

async function doSearch(query) {
    if (searchController) searchController.abort();
    searchController = new AbortController();

    searchResults.innerHTML = '<div class="loading-text"><i class="fa-solid fa-spinner fa-spin"></i> Searching...</div>';
    searchResults.classList.add('show');

    try {
        let results = [];

        if (state.playbackSource === 'soundcloud') {
            // SoundCloud API is closed, use iTunes as fallback for search
            notify('info', 'Note', 'Searching iTunes (paste SoundCloud URL to play directly)');
            results = await searchiTunes(query, searchController.signal);
        } else if (state.playbackSource === 'youtube') {
            // Try Invidious first (no API key needed), fallback to YouTube Data API
            results = await searchYouTubeWithFallback(query, searchController.signal);
        } else {
            results = await searchiTunes(query, searchController.signal);
        }

        results.forEach(t => trackCache[t.id] = t);
        renderResults(results);
    } catch (e) {
        if (e.name === 'AbortError') return;
        searchResults.innerHTML = `<div class="loading-text">Error: ${esc(e.message)}</div>`;
    }
}

async function searchiTunes(q, signal) {
    try {
        const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&limit=20`, { signal });
        if (!res.ok) throw new Error('iTunes API Error');
        const data = await res.json();
        return (data.results || []).map(t => ({
            id: 'it_' + t.trackId,
            title: t.trackName,
            artist: t.artistName,
            artwork: t.artworkUrl100?.replace('100x100', '300x300') || '',
            preview: t.previewUrl,
            source: 'itunes'
        }));
    } catch (e) {
        if (signal.aborted) throw e;
        console.error('iTunes search error:', e);
        return [];
    }
}

async function searchYouTubeWithFallback(q, signal) {
    // Try Invidious first (no quota issues)
    const invidiousResults = await searchInvidious(q, signal);
    if (invidiousResults.length > 0) {
        return invidiousResults;
    }

    // Fallback to YouTube Data API
    console.warn('Invidious failed, trying YouTube Data API');
    const ytResults = await searchYouTubeAPI(q, signal);
    if (ytResults.length > 0) {
        return ytResults;
    }

    // All YouTube searches failed, notify user
    notify('warning', 'YouTube', 'Search unavailable. Try pasting a direct YouTube URL.');
    return [];
}

async function searchInvidious(q, signal) {
    for (let i = 0; i < INVIDIOUS_INSTANCES.length; i++) {
        try {
            const instance = INVIDIOUS_INSTANCES[(invidiousIdx + i) % INVIDIOUS_INSTANCES.length];
            const res = await fetch(
                `${instance}/api/v1/search?q=${encodeURIComponent(q)}&type=video&sort_by=relevance`,
                { signal, headers: { 'Accept': 'application/json' } }
            );

            if (res.ok) {
                const data = await res.json();
                // Update to working instance
                invidiousIdx = (invidiousIdx + i) % INVIDIOUS_INSTANCES.length;

                return data.slice(0, 15).map(t => ({
                    id: 'yt_' + t.videoId,
                    title: t.title,
                    artist: t.author,
                    artwork: t.videoThumbnails?.[0]?.url || `https://i.ytimg.com/vi/${t.videoId}/hqdefault.jpg`,
                    url: `https://www.youtube-nocookie.com/embed/${t.videoId}?autoplay=1`,
                    source: 'youtube'
                }));
            }
        } catch (e) {
            if (signal.aborted) throw e;
            console.warn(`Invidious instance ${i} failed:`, e.message);
            continue;
        }
    }
    return [];
}

async function searchYouTubeAPI(q, signal, retry = true) {
    try {
        const res = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&videoCategoryId=10&maxResults=15&q=${encodeURIComponent(q)}&key=${getYTKey()}`,
            { signal }
        );
        if (!res.ok) {
            if (retry && res.status === 403) {
                rotateYTKey();
                return searchYouTubeAPI(q, signal, false);
            }
            throw new Error('YouTube API Quota/Error');
        }
        const data = await res.json();
        return (data.items || []).map(t => ({
            id: 'yt_' + t.id.videoId,
            title: t.snippet.title,
            artist: t.snippet.channelTitle,
            artwork: t.snippet.thumbnails.high?.url || '',
            url: `https://www.youtube-nocookie.com/embed/${t.id.videoId}?autoplay=1`,
            source: 'youtube'
        }));
    } catch (e) {
        if (signal.aborted) throw e;
        console.error('YouTube API error:', e);
        return [];
    }
}

function renderResults(results) {
    if (!results.length) {
        searchResults.innerHTML = '<div class="loading-text">No results found. Try pasting a direct URL.</div>';
        return;
    }
    searchResults.innerHTML = results.map(t => `
        <div class="result-item" data-track-id="${t.id}">
            <img class="result-img" src="${t.artwork || ''}" alt="" onerror="this.style.display='none'">
            <div class="result-info">
                <div class="result-title">${esc(t.title)}</div>
                <div class="result-artist">${esc(t.artist)}${t.source === 'itunes' ? ' <span style="opacity:0.5">(30s preview)</span>' : ''}</div>
            </div>
            <div class="result-actions">
                <button class="result-action add-action" title="Add to Playlist"><i class="fa-solid fa-plus"></i></button>
                <button class="result-action like-action ${isLiked(t.id) ? 'liked' : ''}" title="Like"><i class="fa-${isLiked(t.id) ? 'solid' : 'regular'} fa-heart"></i></button>
            </div>
        </div>
    `).join('');

    searchResults.querySelectorAll('.result-item').forEach(el => {
        const id = el.dataset.trackId;
        el.addEventListener('click', e => {
            if (e.target.closest('.result-action')) return;
            const t = trackCache[id];
            state.queue = [t]; state.queueIdx = 0;
            playTrack(t);
            searchResults.classList.remove('show');
            if (window.innerWidth <= 768) sidebar.classList.remove('mobile-open');
            // If radio mode is on, queue similar tracks
            if (state.radioMode) {
                queueRadioTracks(t, 10);
            }
        });

        el.querySelector('.like-action')?.addEventListener('click', e => {
            e.stopPropagation(); toggleLike(trackCache[id]);
            e.currentTarget.classList.toggle('liked', isLiked(id));
            e.currentTarget.innerHTML = `<i class="fa-${isLiked(id) ? 'solid' : 'regular'} fa-heart"></i>`;
        });

        el.querySelector('.add-action')?.addEventListener('click', e => {
            e.stopPropagation(); showAddMenu(trackCache[id], e.currentTarget);
        });
    });
}

// --- Playback Logic ---

async function playTrack(track) {
    state.currentTrack = track;

    trackTitle.textContent = track.title;
    trackArtist.textContent = track.artist;
    if (track.artwork) {
        albumCover.src = track.artwork; albumCover.style.display = 'block'; albumPlaceholder.style.display = 'none';
    } else {
        albumCover.style.display = 'none'; albumPlaceholder.style.display = 'block';
    }

    addToRecent(track);
    updateLikeBtn();
    fetchLyrics(track.artist, track.title);
    updatePlayBtn(true);

    if (crossfadeTimer) clearInterval(crossfadeTimer);

    if (track.source === 'itunes') {
        closeFallback();
        if (track.preview) {
            await crossfadeAudio(track.preview);
        } else {
            notify('error', 'Unavailable', 'Preview not available');
            playNext();
        }
    } else if (track.source === 'youtube') {
        stopNativeAudio();
        playIframe(track.url, true);
    } else if (track.source === 'soundcloud') {
        stopNativeAudio();
        const embed = `https://w.soundcloud.com/player/?url=${encodeURIComponent(track.url)}&auto_play=true`;
        playIframe(embed, false);
    }
}

async function crossfadeAudio(url) {
    state.isPlaying = true;
    const active = currentAudio;
    const next = (currentAudio === audio1) ? audio2 : audio1;

    // Don't proxy iTunes previews - they work without it
    next.src = url;
    next.volume = 0;

    try {
        await next.play();
    } catch (e) {
        if (e.name !== 'AbortError') {
            console.warn("Playback interrupted", e);
            if (state.currentTrack && state.currentTrack.source === 'itunes') {
                state.isPlaying = false;
                updatePlayBtn();
                notify('error', 'Playback Error', 'Could not play audio');
            }
        }
        return;
    }

    const FADE_TIME = 3000;
    const STEPS = 20;
    const stepTime = FADE_TIME / STEPS;
    const volStep = state.volume / STEPS;

    let step = 0;
    if (crossfadeTimer) clearInterval(crossfadeTimer);

    crossfadeTimer = setInterval(() => {
        step++;
        next.volume = Math.min(state.volume, next.volume + volStep);
        if (!active.paused) {
            active.volume = Math.max(0, active.volume - volStep);
        }

        if (step >= STEPS) {
            clearInterval(crossfadeTimer);
            active.pause();
            active.currentTime = 0;
            next.volume = state.volume;
            currentAudio = next;
        }
    }, stepTime);
}

function stopNativeAudio() {
    audio1.pause(); audio1.currentTime = 0;
    audio2.pause(); audio2.currentTime = 0;
    if (crossfadeTimer) clearInterval(crossfadeTimer);
}

function playIframe(url, isVideo) {
    state.isPlaying = true;
    // Proxy mode applies here for playback
    const finalSrc = state.proxyMode ? PROXY_BASE + encodeURIComponent(url) : url;

    fallbackFrame.src = finalSrc;

    // Reset UI for non-trackable sources
    if (crossfadeTimer) clearInterval(crossfadeTimer);
    currentTimeEl.textContent = "--:--";
    totalTimeEl.textContent = "--:--";
    progressFill.style.width = "0%";

    if (state.proxyMode || isVideo) {
        fallbackContainer.className = 'fallback-container show';
    } else {
        fallbackContainer.className = 'fallback-container show audio-only';
    }
}

function closeFallback() {
    fallbackContainer.className = 'fallback-container';
    fallbackFrame.src = '';
}

$('fallbackClose').addEventListener('click', () => {
    closeFallback();
    state.isPlaying = false;
    updatePlayBtn();
});

playPauseBtn.addEventListener('click', () => {
    if (!state.currentTrack) return;

    if (fallbackFrame.src && fallbackFrame.src !== 'about:blank') {
        // For iframe content (YouTube/SoundCloud), we toggle visibility
        // and store the src to resume
        if (state.isPlaying && !state.iframePaused) {
            state._pausedIframeSrc = fallbackFrame.src;
            fallbackFrame.src = 'about:blank';
            state.iframePaused = true;
            state.isPlaying = false;
        } else if (state.iframePaused && state._pausedIframeSrc) {
            fallbackFrame.src = state._pausedIframeSrc;
            state.iframePaused = false;
            state.isPlaying = true;
        } else {
            playTrack(state.currentTrack);
        }
    } else if (state.iframePaused && state._pausedIframeSrc) {
        // Resume paused iframe
        fallbackFrame.src = state._pausedIframeSrc;
        state.iframePaused = false;
        state.isPlaying = true;
        if (state.currentTrack.source === 'youtube') {
            fallbackContainer.className = 'fallback-container show';
        } else {
            fallbackContainer.className = 'fallback-container show audio-only';
        }
    } else {
        if (currentAudio.paused) {
            currentAudio.play();
            state.isPlaying = true;
        } else {
            currentAudio.pause();
            state.isPlaying = false;
        }
    }
    updatePlayBtn();
});

function updatePlayBtn(forcePlay) {
    if (forcePlay !== undefined) state.isPlaying = forcePlay;
    playPauseBtn.querySelector('i').className = state.isPlaying ? 'fa-solid fa-pause' : 'fa-solid fa-play';
}

[audio1, audio2].forEach(audio => {
    audio.addEventListener('timeupdate', () => {
        if (audio !== currentAudio && audio.volume < currentAudio.volume) return;
        const pct = (audio.currentTime / audio.duration) * 100 || 0;
        progressFill.style.width = `${pct}%`;
        currentTimeEl.textContent = formatTime(audio.currentTime);
        totalTimeEl.textContent = formatTime(audio.duration);
        updateLyric(audio.currentTime);
    });
    audio.addEventListener('ended', () => {
        if (audio === currentAudio) {
            if (state.isRepeat) { audio.currentTime = 0; audio.play(); }
            else playNext();
        }
    });
    audio.addEventListener('error', () => {
        if (audio === currentAudio) {
            notify('error', 'Audio Error', 'Could not play track');
            state.isPlaying = false;
            updatePlayBtn();
        }
    });
});

function playNext() {
    // Clear paused state
    state.iframePaused = false;
    state._pausedIframeSrc = null;

    if (state.isShuffle && state.queue.length > 1) {
        let newIdx;
        do { newIdx = Math.floor(Math.random() * state.queue.length); }
        while (newIdx === state.queueIdx && state.queue.length > 1);
        state.queueIdx = newIdx;
        playTrack(state.queue[state.queueIdx]);
    } else if (state.queueIdx < state.queue.length - 1) {
        state.queueIdx++;
        playTrack(state.queue[state.queueIdx]);
        // Radio mode: auto-refill queue when running low
        if (state.radioMode && state.queue.length - state.queueIdx <= 3) {
            const lastTrack = state.queue[state.queue.length - 1];
            queueRadioTracks(lastTrack, 10);
        }
    } else if (state.radioMode) {
        // End of queue in radio mode, fetch more
        const lastTrack = state.currentTrack || state.queue[state.queue.length - 1];
        queueRadioTracks(lastTrack, 10, true);
    } else {
        state.isPlaying = false; updatePlayBtn();
    }
    updateRadioBadge();
}

function playPrev() {
    // Clear paused state
    state.iframePaused = false;
    state._pausedIframeSrc = null;

    if (state.queueIdx > 0) {
        state.queueIdx--;
        playTrack(state.queue[state.queueIdx]);
        updateRadioBadge();
    } else if (currentAudio.duration && currentAudio.currentTime > 3) {
        currentAudio.currentTime = 0;
    } else if (state.currentTrack) {
        // Restart current track
        playTrack(state.currentTrack);
    }
}

$('nextBtn').addEventListener('click', playNext);
$('prevBtn').addEventListener('click', playPrev);

progressBar.addEventListener('click', e => {
    if (currentAudio.duration && !fallbackFrame.src) {
        const rect = progressBar.getBoundingClientRect();
        const pct = (e.clientX - rect.left) / rect.width;
        currentAudio.currentTime = pct * currentAudio.duration;
    }
});

function setVolume(v) {
    state.volume = v;
    localStorage.setItem('music_volume', v.toString());
    currentAudio.volume = v;
    if (audio1 !== currentAudio) audio1.volume = 0;
    if (audio2 !== currentAudio) audio2.volume = 0;

    volumeFill.style.width = `${v * 100}%`;
    volumeBtn.querySelector('i').className = v === 0 ? 'fa-solid fa-volume-xmark' : v < 0.5 ? 'fa-solid fa-volume-low' : 'fa-solid fa-volume-high';
}

volumeBar.addEventListener('click', e => {
    const rect = volumeBar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setVolume(pct);
});

volumeBtn.addEventListener('click', () => {
    if (state.volume > 0) {
        state._prevVolume = state.volume;
        setVolume(0);
    } else {
        setVolume(state._prevVolume || 1);
    }
});

// --- Control Buttons ---
shuffleBtn.addEventListener('click', () => {
    state.isShuffle = !state.isShuffle;
    shuffleBtn.classList.toggle('active');
    notify('info', 'Shuffle', state.isShuffle ? 'On' : 'Off');
});

repeatBtn.addEventListener('click', () => {
    state.isRepeat = !state.isRepeat;
    repeatBtn.classList.toggle('active');
    notify('info', 'Repeat', state.isRepeat ? 'On' : 'Off');
});

radioBtn.addEventListener('click', () => {
    state.radioMode = !state.radioMode;
    localStorage.setItem('music_radio', state.radioMode);
    radioBtn.classList.toggle('active');
    radioBadge.classList.toggle('show');
    notify('info', 'Radio', state.radioMode ? 'On - queuing similar tracks' : 'Off');

    // If turning on radio mode with a current track, queue similar tracks
    if (state.radioMode && state.currentTrack) {
        queueRadioTracks(state.currentTrack, 10);
    }
    updateRadioBadge();
});

proxyBtn.addEventListener('click', () => {
    state.proxyMode = !state.proxyMode;
    localStorage.setItem('music_proxy', state.proxyMode);
    proxyBtn.classList.toggle('active');
    notify('info', 'Proxy Mode', state.proxyMode ? 'Enabled' : 'Disabled');
    // Reload current track with new proxy setting if playing
    if (state.currentTrack && (state.currentTrack.source === 'youtube' || state.currentTrack.source === 'soundcloud')) {
        playTrack(state.currentTrack);
    }
});

// Queue multiple radio tracks at once
async function queueRadioTracks(basedOnTrack, count = 10, playFirst = false) {
    if (!basedOnTrack || state.radioLoading) return;
    state.radioLoading = true;

    try {
        // Search for similar tracks based on artist and title
        const artistQuery = basedOnTrack.artist.split(/[&,\-]/)[0].trim();
        const titleWords = basedOnTrack.title.split(/[\s\-()\[\]]+/).slice(0, 2).join(' ');

        // Try multiple search strategies
        const searches = [
            `${artistQuery}`,
            `${titleWords}`,
            `${artistQuery} ${titleWords.split(' ')[0] || ''}`
        ];

        let allTracks = [];
        const existingIds = new Set(state.queue.map(t => t.id));

        for (const query of searches) {
            if (allTracks.length >= count) break;

            try {
                const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=25`);
                if (res.ok) {
                    const data = await res.json();
                    const tracks = (data.results || [])
                        .filter(t => t.previewUrl && !existingIds.has('it_' + t.trackId))
                        .map(t => ({
                            id: 'it_' + t.trackId,
                            title: t.trackName,
                            artist: t.artistName,
                            artwork: t.artworkUrl100?.replace('100x100', '300x300') || '',
                            preview: t.previewUrl,
                            source: 'itunes'
                        }));

                    for (const t of tracks) {
                        if (!existingIds.has(t.id)) {
                            existingIds.add(t.id);
                            allTracks.push(t);
                        }
                    }
                }
            } catch (e) { console.warn('Search failed:', query, e); }
        }

        // Shuffle and take requested count
        allTracks = allTracks.sort(() => Math.random() - 0.5).slice(0, count);

        if (allTracks.length > 0) {
            // Add to queue
            for (const t of allTracks) {
                trackCache[t.id] = t;
                state.queue.push(t);
            }

            notify('success', 'Radio', `Added ${allTracks.length} similar tracks to queue`);
            updateRadioBadge();

            // If playFirst is true, start playing the next track
            if (playFirst && state.queueIdx < state.queue.length - 1) {
                state.queueIdx++;
                playTrack(state.queue[state.queueIdx]);
            }
        } else {
            notify('warning', 'Radio', 'No more similar tracks found');
        }
    } catch (e) {
        console.error('Radio queue error:', e);
        notify('error', 'Radio', 'Failed to find similar tracks');
    } finally {
        state.radioLoading = false;
    }
}

// Update radio badge to show queue count
function updateRadioBadge() {
    if (state.radioMode && state.queue.length > 1) {
        const remaining = state.queue.length - state.queueIdx - 1;
        radioBadge.innerHTML = `<i class="fa-solid fa-radio"></i> Radio (${remaining} in queue)`;
    } else {
        radioBadge.innerHTML = `<i class="fa-solid fa-radio"></i> Radio`;
    }
}

// Legacy function for compatibility
async function playRadioNext() {
    await queueRadioTracks(state.currentTrack, 10, true);
}

// --- Library & Playlists ---
const isLiked = (id) => state.liked.some(x => x.id === id);

function toggleLike(t) {
    if (!t) return;
    const i = state.liked.findIndex(x => x.id === t.id);
    if (i >= 0) { state.liked.splice(i, 1); notify('info', 'Removed', 'Removed from Liked'); }
    else { state.liked.unshift(t); notify('success', 'Liked', 'Added to Liked'); }
    localStorage.setItem('music_liked', JSON.stringify(state.liked));
    updateCounts(); updateLikeBtn(); renderLibrarySongs();
}

likeBtn.addEventListener('click', () => { if (state.currentTrack) toggleLike(state.currentTrack); });

function updateLikeBtn() {
    if (!state.currentTrack) return;
    const liked = isLiked(state.currentTrack.id);
    likeBtn.querySelector('i').className = liked ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
    likeBtn.classList.toggle('active', liked);
}

function addToRecent(t) {
    state.recent = state.recent.filter(x => x.id !== t.id);
    state.recent.unshift(t);
    if (state.recent.length > 50) state.recent.pop();
    localStorage.setItem('music_recent', JSON.stringify(state.recent));
    updateCounts(); renderLibrarySongs();
}

function updateCounts() {
    $('likedCount').textContent = `${state.liked.length} songs`;
    $('recentCount').textContent = `${state.recent.length} songs`;
}

function renderLibrarySongs() {
    const html = (arr) => arr.slice(0, 20).map(t => {
        trackCache[t.id] = t;
        return `
        <div class="playlist-song" data-track-id="${t.id}">
            <img src="${t.artwork || ''}" alt="" onerror="this.style.display='none'">
            <div class="playlist-song-info">
                <div class="playlist-song-title">${esc(t.title)}</div>
                <div class="playlist-song-artist">${esc(t.artist)}</div>
            </div>
        </div>`;
    }).join('') || '<div class="playlist-song" style="color:var(--text-muted)">Empty</div>';

    $('likedSongs').innerHTML = html(state.liked);
    $('recentSongs').innerHTML = html(state.recent);

    document.querySelectorAll('.playlist-song[data-track-id]').forEach(el => {
        el.addEventListener('click', () => {
            const t = trackCache[el.dataset.trackId];
            if (t) {
                state.queue = [t]; state.queueIdx = 0;
                playTrack(t);
                if (window.innerWidth <= 768) sidebar.classList.remove('mobile-open');
            }
        });
    });
}

$('likedPlaylist').addEventListener('click', () => { $('likedPlaylist').classList.toggle('expanded'); $('likedSongs').classList.toggle('show'); });
$('recentPlaylist').addEventListener('click', () => { $('recentPlaylist').classList.toggle('expanded'); $('recentSongs').classList.toggle('show'); });

function renderPlaylists() {
    $('customPlaylists').innerHTML = state.playlists.map((p, idx) => `
        <div class="playlist-item" data-custom="${idx}">
            <div class="playlist-icon"><i class="fa-solid fa-list"></i></div>
            <div class="playlist-info">
                <div class="playlist-name">${esc(p.name)} <i class="fa-solid fa-chevron-down playlist-expand"></i></div>
                <div class="playlist-count">${p.tracks.length} songs</div>
            </div>
        </div>
        <div class="playlist-songs" id="playlist-songs-${idx}">
            ${p.tracks.slice(0, 20).map((t, ti) => {
        trackCache[t.id] = t;
        return `
                <div class="playlist-song" data-track-id="${t.id}" data-playlist-idx="${idx}" data-track-idx="${ti}">
                    <img src="${t.artwork || ''}" alt="" onerror="this.style.display='none'">
                    <div class="playlist-song-info">
                        <div class="playlist-song-title">${esc(t.title)}</div>
                        <div class="playlist-song-artist">${esc(t.artist)}</div>
                    </div>
                    <button class="playlist-song-remove" title="Remove"><i class="fa-solid fa-xmark"></i></button>
                </div>`;
    }).join('') || '<div class="playlist-song" style="color:var(--text-muted)">Empty</div>'}
        </div>
    `).join('');

    document.querySelectorAll('[data-custom]').forEach(el => {
        el.addEventListener('click', () => { el.classList.toggle('expanded'); $(`playlist-songs-${el.dataset.custom}`).classList.toggle('show'); });
    });

    document.querySelectorAll('#customPlaylists .playlist-song').forEach(el => {
        el.addEventListener('click', e => {
            if (e.target.closest('.playlist-song-remove')) return;
            if (el.dataset.trackId) {
                const t = trackCache[el.dataset.trackId];
                if (t) {
                    state.queue = [t]; state.queueIdx = 0;
                    playTrack(t);
                    if (window.innerWidth <= 768) sidebar.classList.remove('mobile-open');
                }
            }
        });
    });

    document.querySelectorAll('.playlist-song-remove').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            const s = btn.closest('.playlist-song');
            if (!s) return;
            const pIdx = parseInt(s.dataset.playlistIdx);
            const tIdx = parseInt(s.dataset.trackIdx);

            state.playlists[pIdx].tracks.splice(tIdx, 1);
            localStorage.setItem('music_playlists', JSON.stringify(state.playlists));
            renderPlaylists();
            notify('info', 'Removed', 'Removed from playlist');
        });
    });
}

function showAddMenu(track, anchor) {
    state.addMenuTrackId = track.id;
    trackCache[track.id] = track;

    addMenu.innerHTML = state.playlists.map((p, i) =>
        `<button class="add-menu-item" data-playlist-idx="${i}"><i class="fa-solid fa-list"></i> ${esc(p.name)}</button>`
    ).join('') || '<div class="add-menu-item" style="color:var(--text-muted)">No playlists yet</div>';

    const rect = anchor.getBoundingClientRect();
    addMenu.style.top = `${rect.bottom + 4}px`;
    addMenu.style.left = `${Math.min(rect.left, window.innerWidth - 180)}px`;
    addMenu.classList.add('show');

    addMenu.querySelectorAll('[data-playlist-idx]').forEach(btn => {
        btn.addEventListener('click', () => {
            addToPlaylist(parseInt(btn.dataset.playlistIdx), trackCache[state.addMenuTrackId]);
            addMenu.classList.remove('show');
        });
    });
}

function addToPlaylist(idx, track) {
    if (!state.playlists[idx]) return;
    const exists = state.playlists[idx].tracks.some(t => t.id === track.id);
    if (!exists) {
        state.playlists[idx].tracks.push(track);
        localStorage.setItem('music_playlists', JSON.stringify(state.playlists));
        renderPlaylists();
        notify('success', 'Added', `Added to ${state.playlists[idx].name}`);
    } else { notify('info', 'Exists', 'Already in playlist'); }
}

$('addToPlaylistBtn').addEventListener('click', e => {
    if (state.currentTrack) showAddMenu(state.currentTrack, e.currentTarget);
});

document.addEventListener('click', e => {
    if (!e.target.closest('.add-menu') && !e.target.closest('.add-action') && !e.target.closest('#addToPlaylistBtn'))
        addMenu.classList.remove('show');
    if (!e.target.closest('.search-wrapper')) searchResults.classList.remove('show');
});

$('addPlaylistBtn').addEventListener('click', () => $('playlistModal').classList.add('show'));
$('cancelPlaylist').addEventListener('click', () => { $('playlistModal').classList.remove('show'); $('playlistNameInput').value = ''; });
$('confirmPlaylist').addEventListener('click', () => {
    const name = $('playlistNameInput').value.trim();
    if (name) {
        state.playlists.push({ name, tracks: [] });
        localStorage.setItem('music_playlists', JSON.stringify(state.playlists));
        renderPlaylists(); notify('success', 'Created', `"${name}" created`);
    }
    $('playlistNameInput').value = ''; $('playlistModal').classList.remove('show');
});

// --- Lyrics ---
async function fetchLyrics(artist, title) {
    state.lyrics = []; state.lyricIdx = -1;
    lyricsContent.innerHTML = '<div class="lyrics-line">Loading...</div>';
    lyricsContent.scrollTop = 0;
    try {
        const res = await fetch(`https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`);
        if (res.ok) {
            const data = await res.json();
            if (data.syncedLyrics) { state.lyrics = parseLRC(data.syncedLyrics); renderLyrics(); return; }
            if (data.plainLyrics) {
                lyricsContent.innerHTML = data.plainLyrics.split('\n').map(l => `<div class="lyrics-line">${esc(l) || '&nbsp;'}</div>`).join('');
                return;
            }
        }
        // Fallback removed - lyrics.ovh is often blocked
        lyricsContent.innerHTML = '<div class="lyrics-line">No lyrics found</div>';
    } catch { lyricsContent.innerHTML = '<div class="lyrics-line">Could not load lyrics</div>'; }
}

function parseLRC(lrc) {
    const lines = [], rx = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/g;
    let m;
    while ((m = rx.exec(lrc)) !== null) {
        const t = parseInt(m[1]) * 60 + parseInt(m[2]) + parseInt(m[3].padEnd(3, '0')) / 1000;
        if (m[4].trim()) lines.push({ time: t, text: m[4].trim() });
    }
    return lines.sort((a, b) => a.time - b.time);
}

function renderLyrics() {
    lyricsContent.innerHTML = state.lyrics.map((l, i) => `<div class="lyrics-line" data-idx="${i}">${esc(l.text)}</div>`).join('');
    lyricsContent.querySelectorAll('.lyrics-line').forEach(el => {
        el.addEventListener('click', () => {
            const idx = parseInt(el.dataset.idx);
            if (state.lyrics[idx] && currentAudio.duration) currentAudio.currentTime = state.lyrics[idx].time;
        });
    });
}

function updateLyric(time) {
    if (!state.lyrics.length) return;
    let idx = -1;
    for (let i = 0; i < state.lyrics.length; i++) {
        if (state.lyrics[i].time <= time) idx = i; else break;
    }
    if (idx !== state.lyricIdx) {
        state.lyricIdx = idx;
        const lines = lyricsContent.querySelectorAll('.lyrics-line');
        lines.forEach((el, i) => {
            el.classList.remove('active', 'past');
            if (i === idx) {
                el.classList.add('active');
                el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
            else if (i < idx) el.classList.add('past');
        });
    }
}

// --- Keyboard Shortcuts ---
document.addEventListener('keydown', e => {
    // Skip if typing in input
    if (e.target.tagName === 'INPUT') return;

    switch (e.code) {
        case 'Space':
            e.preventDefault();
            playPauseBtn.click();
            break;
        case 'ArrowRight':
            if (e.shiftKey) $('nextBtn').click();
            else if (currentAudio.duration) currentAudio.currentTime = Math.min(currentAudio.duration, currentAudio.currentTime + 10);
            break;
        case 'ArrowLeft':
            if (e.shiftKey) $('prevBtn').click();
            else if (currentAudio.duration) currentAudio.currentTime = Math.max(0, currentAudio.currentTime - 10);
            break;
        case 'ArrowUp':
            e.preventDefault();
            setVolume(Math.min(1, state.volume + 0.1));
            break;
        case 'ArrowDown':
            e.preventDefault();
            setVolume(Math.max(0, state.volume - 0.1));
            break;
        case 'KeyM':
            volumeBtn.click();
            break;
        case 'KeyL':
            likeBtn.click();
            break;
        case 'KeyS':
            shuffleBtn.click();
            break;
        case 'KeyR':
            repeatBtn.click();
            break;
    }
});

// --- Init ---
setVolume(state.volume);
updateCounts();
renderPlaylists();
renderLibrarySongs();
radioBtn.classList.toggle('active', state.radioMode);
radioBadge.classList.toggle('show', state.radioMode);
proxyBtn.classList.toggle('active', state.proxyMode);
updateRadioBadge();

// Show welcome tip
setTimeout(() => {
    if (!state.recent.length) {
        notify('info', 'Radio', 'Search for music or enable Radio mode for auto-play!');
    }
}, 1000);

