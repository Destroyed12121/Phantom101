

const YT_KEYS = [
    "AIzaSyBMhadsGk2S2B9bP46EycgI2y8yCWLLdAs",
    "AIzaSyCOeLUcSlLDWAbKDUc-LUx8hdsenY-97rU",
    "AIzaSyC3Z3jpYx5bw9M_Hih4sxF8iuiYZ4m3Qis",
    "AIzaSyCWl9hmr-a0dVHKeUmUP5P7boAWJ3h48fs"
];
const LRC_LYRIC_EP = "https://lrclib.net/api/get";
const PLAIN_LYRIC_EP = "https://api.lyrics.ovh/v1/";
const SEARCH_EP = "https://itunes.apple.com/search?term=";
const PROXY_BASE = "../staticsjv2/embed.html?skip#"; // proxy fsallback

//  state Management 
let player;
let playerReady = false;
let commandQueue = [];
let isPlaying = false;
let keyIndex = 0;
let currentTrack = null;
let currentPlaylist = [];
let originalPlaylist = [];
let currentIndex = -1;
let isShuffled = false;
let isRadioMode = false;
let isProxyMode = false;
let isRepeat = false;
let activeSource = 'youtube'; // 'youtube' or 'itunes'
let audioPlayer = null; // Current active 30s preview player
let audio1, audio2; // DOM Audio elements for fading
let playlists = JSON.parse(localStorage.getItem('arcora_playlists')) || [{ name: 'Favorites', songs: [] }];
let searchTimeout;
let searchAutoHideTimeout;
let isMuted = false;
let lastVolume = parseInt(localStorage.getItem('arcora_last_volume')) || 100;

// --- DOM Elements ---
const $ = id => document.getElementById(id);
const searchInput = $('searchInput');
const searchResults = $('searchResults');
const trackTitle = $('trackTitle');
const trackArtist = $('trackArtist');
const albumCover = $('albumCover');
const albumPlaceholder = $('albumPlaceholder');
const playPauseBtn = $('playPauseBtn');
const progressBar = $('progressBar');
const progressFill = $('progressFill');
const currentTimeEl = $('currentTime');
const totalTimeEl = $('totalTime');
const volumeBar = $('volumeBar');
const volumeFill = $('volumeFill');
const volumeBtn = $('volumeBtn');
const shuffleBtn = $('shuffleBtn');
const repeatBtn = $('repeatBtn');
const likeBtn = $('likeBtn');
const radioBtn = $('radioBtn');
const radioBadge = $('radioBadge');
const proxyBtn = $('proxyBtn');
const lyricsContent = $('lyricsContent');
const sidebar = $('sidebar');
const mobileMenuBtn = $('mobileMenuBtn');
const closeSidebar = $('closeSidebar');
const fallbackContainer = $('fallbackContainer');
const fallbackFrame = $('fallbackFrame');
const likedCount = $('likedCount');
const recentCount = $('recentCount');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Load Persisted State
    isRadioMode = localStorage.getItem('arcora_radio_mode') === 'true';
    isProxyMode = localStorage.getItem('arcora_proxy_mode') === 'true';

    // UI Init
    updateRadioUI();
    updateProxyUI();
    loadPlaylists();
    renderLibrarySongs();

    // Event Listeners
    searchInput.addEventListener('input', handleSearchInput);
    playPauseBtn.addEventListener('click', togglePlayback);
    $('nextBtn').addEventListener('click', playNext);
    $('prevBtn').addEventListener('click', playPrev);
    shuffleBtn.addEventListener('click', toggleShuffle);
    repeatBtn.addEventListener('click', toggleRepeat);
    radioBtn.addEventListener('click', toggleRadioMode);
    proxyBtn.addEventListener('click', toggleProxyMode);
    likeBtn.addEventListener('click', () => { if (currentTrack) toggleFavorite(currentTrack); });

    volumeBar.addEventListener('click', handleVolumeClick);
    volumeBtn.addEventListener('click', toggleMute);
    progressBar.addEventListener('click', handleSeek);

    // Source Tabs
    document.querySelectorAll('.source-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.source-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeSource = tab.dataset.source;
            notify('info', 'Source Switched', `Now using ${activeSource === 'youtube' ? 'YouTube' : 'iTunes previews'}`);
        });
    });

    // Audio elements for iTunes
    audio1 = $('audio1');
    audio2 = $('audio2');

    // Add to Playlist (Player Control)
    $('addToPlaylistBtn').addEventListener('click', (e) => {
        if (currentTrack) {
            const data = {
                trackName: currentTrack.title,
                artistName: currentTrack.artist,
                artworkUrl100: currentTrack.artwork,
                genre: currentTrack.genre || '',
                previewUrl: currentTrack.previewUrl || ''
            };
            addToPlaylistMenu(e.currentTarget, JSON.stringify(data));
        }
    });

    // Mobile Menu
    mobileMenuBtn.addEventListener('click', () => sidebar.classList.add('mobile-open'));
    closeSidebar.addEventListener('click', () => sidebar.classList.remove('mobile-open'));


    setVolumeUI(lastVolume);

    // Add Playlist
    $('addPlaylistBtn').addEventListener('click', () => $('playlistModal').classList.add('show'));
    $('cancelPlaylist').addEventListener('click', () => $('playlistModal').classList.remove('show'));
    $('confirmPlaylist').addEventListener('click', createNewPlaylist);

    // Load YouTube API
    if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
});

// --- Search Logic (iTunes) ---
function handleSearchInput() {
    clearTimeout(searchTimeout);
    clearTimeout(searchAutoHideTimeout);
    const query = searchInput.value.trim();

    if (query.length < 2) {
        searchResults.classList.remove('show');
        return;
    }

    searchResults.innerHTML = '<div class="loading-text"><i class="fa-solid fa-spinner fa-spin"></i> Searching...</div>';
    searchResults.classList.add('show');

    searchTimeout = setTimeout(() => {
        const url = `${SEARCH_EP}${encodeURIComponent(query)}&media=music&limit=20`;
        fetch(url)
            .then(res => res.json())
            .then(data => displayResults(data.results || []))
            .catch(err => {
                console.error("Search failed:", err);
                searchResults.innerHTML = '<div class="loading-text">Search failed.</div>';
            });
    }, 500);
}

function displayResults(results) {
    if (!results.length) {
        searchResults.innerHTML = '<div class="loading-text">No results found.</div>';
        return;
    }

    const favs = getPlaylist('Favorites')?.songs || [];
    const isFav = (item) => favs.some(f => f.trackName === item.trackName && f.artistName === item.artistName);

    searchResults.innerHTML = results.map(item => {
        const art = item.artworkUrl100?.replace('100x100', '300x300') || '';
        const liked = isFav(item);

        // Encode data for click handling
        const songData = JSON.stringify({
            trackName: item.trackName,
            artistName: item.artistName,
            artworkUrl100: item.artworkUrl100,
            genre: item.primaryGenreName,
            previewUrl: item.previewUrl
        }).replace(/"/g, '&quot;');

        return `
            <div class="result-item" onclick="handleResultClick(this)" data-song="${songData}">
                <img class="result-img" src="${art}" onerror="this.style.display='none'">
                <div class="result-info">
                    <div class="result-title">${esc(item.trackName)}</div>
                    <div class="result-artist">${esc(item.artistName)}</div>
                </div>
                <div class="result-actions">
                    <button class="result-action" onclick="event.stopPropagation(); addToPlaylistMenu(this, '${songData}')"><i class="fa-solid fa-plus"></i></button>
                    <button class="result-action" onclick="event.stopPropagation(); toggleFavoriteFromSearch(this, '${songData}')">
                        <i class="fa-${liked ? 'solid' : 'regular'} fa-heart ${liked ? 'liked' : ''}"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

window.handleResultClick = (el) => {
    const data = JSON.parse(el.dataset.song);
    playSongWithContext(data, [data], 0);
    searchResults.classList.remove('show');
    searchInput.value = '';
};

// --- Playback Logic ---
function playSongWithContext(song, playlist, index) {
    currentPlaylist = [...playlist];
    originalPlaylist = [...playlist];
    // Ensure we capture genre and previewUrl if available
    playSong(song.trackName, song.artistName, song.artworkUrl100, song.genre, song.previewUrl, index);
}

function playSong(title, artist, artwork, genre = '', previewUrl = '', index = -1) {
    // Stop existing players
    if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.src = '';
    }
    if (player && typeof player.stopVideo === 'function') {
        player.stopVideo();
    }

    // Update UI
    trackTitle.textContent = title;
    trackArtist.textContent = artist;

    if (artwork) {
        albumCover.src = artwork.replace('100x100', '600x600');
        albumCover.style.display = 'block';
        albumPlaceholder.style.display = 'none';
    } else {
        albumCover.style.display = 'none';
        albumPlaceholder.style.display = 'block';
    }

    currentTrack = { title, artist, artwork, genre, previewUrl };
    updateLikeBtn();
    fetchLyrics(artist, title);

    if (index !== -1) currentIndex = index;

    isPlaying = true;
    updatePlayBtn();

    if (activeSource === 'itunes' && previewUrl) {
        // Play iTunes Preview
        console.log("Playing iTunes preview:", previewUrl);
        audioPlayer = audio1;
        audioPlayer.src = previewUrl;
        audioPlayer.volume = isMuted ? 0 : lastVolume / 100;

        const playPromise = audioPlayer.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log("iTunes audio playing");
                isPlaying = true;
                updatePlayBtn();
            }).catch(e => {
                console.warn("iTunes audio failed, falling back to YT:", e);
                const searchQuery = `${title} ${artist} audio`;
                getYT(searchQuery);
            });
        }

        audioPlayer.onended = () => playNext();
        hideFallback();
    } else {
        // Play YouTube
        const searchQuery = `${title} ${artist} audio`;
        getYT(searchQuery);
    }
}

// Global cache for video IDs to prevent easy quota limits
const videoCache = JSON.parse(localStorage.getItem('arcora_video_cache')) || {};

function getYT(query, retryCount = 0) {
    if (videoCache[query]) {
        console.log(`CACHE HIT: ${query} -> ${videoCache[query]}`);
        loadVid(videoCache[query]);
        return;
    }

    // If we've exhausted all keys, stop.
    if (retryCount >= YT_KEYS.length) {
        console.error("All YouTube API keys exhausted or failed.");
        notify('error', 'Limit Reached', 'Music service currently unavailable.');
        // Try next song if in radio/playlist
        if (isRadioMode || currentPlaylist.length > 1) {
            setTimeout(playNext, 2000);
        }
        return;
    }

    const currentKey = YT_KEYS[keyIndex];
    // Rotate key for next time immediately to spread load
    keyIndex = (keyIndex + 1) % YT_KEYS.length;

    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&key=${currentKey}&maxResults=1&videoEmbeddable=true`;

    fetch(url)
        .then(res => {
            if (!res.ok) throw new Error(res.status); // Will catch 403/429
            return res.json();
        })
        .then(data => {
            if (data.items?.[0]?.id?.videoId) {
                const id = data.items[0].id.videoId;
                videoCache[query] = id;
                localStorage.setItem('arcora_video_cache', JSON.stringify(videoCache));
                loadVid(id);
            } else {
                console.warn("No video found for:", query);
                // If strict search failed, try looser search
                if (!query.includes('official audio')) {
                    // actually we query with 'audio', maybe try just title-artist
                    // Avoiding infinite loop by checking query format
                    notify('error', 'Not Found', 'Song not found on YouTube');
                }
            }
        })
        .catch(err => {
            console.warn(`Key failed (Attempt ${retryCount + 1}):`, err);
            // Recursive retry with next key
            getYT(query, retryCount + 1);
        });
}

function loadVid(videoId) {
    lastAttemptedVideoId = videoId;

    if (isProxyMode) {
        useFallbackPlayer(videoId);
        return;
    }

    // Command pattern for robust player loading
    const startAction = () => {
        if (player && typeof player.loadVideoById === 'function') {
            player.loadVideoById(videoId);
            player.playVideo();
            hideFallback();
        }
    };

    if (playerReady && player) {
        startAction();
    } else {
        // Queue the command, replacing any pending load commands
        // We filter out old load commands to avoid playing multiple things
        commandQueue = commandQueue.filter(cmd => !cmd.isLoadCmd);
        startAction.isLoadCmd = true;
        commandQueue.push(startAction);

        // Ensure fallback container is ready for the API to inject into if not already
        if (!player) {
            // YT API might be loading
        }
    }
}

// --- Player Implementation ---
window.onYouTubeIframeAPIReady = () => {
    player = new YT.Player('fallbackContainer', { // We use fallbackContainer as a holder first, but mapped to a specific div usually
        height: '100%',
        width: '100%',
        videoId: '',
        playerVars: {
            'autoplay': 1,
            'controls': 0,
            'disablekb': 1,
            'fs': 0,
            'rel': 0,
            'origin': window.location.origin
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError
        }
    });
};

function onPlayerReady(event) {
    console.log("Player Ready");
    playerReady = true;
    player.setVolume(lastVolume);

    // Execute queued commands
    while (commandQueue.length > 0) {
        const cmd = commandQueue.shift();
        try { cmd(); } catch (e) { console.error("Queue exec error", e); }
    }

    startSyncTimer();
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
        isPlaying = true;
    } else if (event.data === YT.PlayerState.PAUSED) {
        isPlaying = false;
    } else if (event.data === YT.PlayerState.ENDED) {
        playNext();
    }
    updatePlayBtn();
}

function onPlayerError(event) {
    console.warn("YouTube Player Error:", event.data);
    if (lastAttemptedVideoId) useFallbackPlayer(lastAttemptedVideoId);
}

// --- Fallback / Proxy Player ---
function useFallbackPlayer(videoId) {
    // Destroy YT Player if exists to free up container
    if (player && player.destroy) {
        try { player.destroy(); player = null; } catch (e) { }
    }

    fallbackContainer.innerHTML = '';
    const frame = document.createElement('iframe');
    frame.id = 'fallbackFrame';
    frame.style.width = '100%';
    frame.style.height = '100%';
    frame.allow = "autoplay; encrypted-media; picture-in-picture";
    frame.src = PROXY_BASE + videoId;

    fallbackContainer.appendChild(frame);
    fallbackContainer.classList.add('show');

    // We lose direct control via API, but we gain proxy capability
}

function hideFallback() {
    // If not in proxy mode, we might want to ensure standard player is visible
    // But since we are reusing the container for standard player (via API), we manage visibility via CSS classes if needed
    // In this specific implementation, standard YT player replaces the innerHTML of fallbackContainer anyway?
    // Wait, onYouTubeIframeAPIReady targets 'fallbackContainer'.
    // So 'fallbackContainer' IS the player container.
    // The CSS .fallback-container might have .show .audio-only rules.
    fallbackContainer.classList.add('show'); // Make sure it's visible so standard player shows
    if (!isProxyMode) fallbackContainer.classList.add('audio-only'); // Hide video by default unless proxy or toggled?
    else fallbackContainer.classList.remove('audio-only');

    // Wait, music.html has videoToggleBtn? User removed it.
    // So default behavior: Audio Only (hidden) unless Proxy or Fallback.
}

function togglePlayback() {
    if (!currentTrack) return;

    if (isProxyMode) {
        notify('info', 'Proxy Mode', 'Use player controls');
        return;
    }

    if (activeSource === 'itunes' && audioPlayer) {
        if (isPlaying) audioPlayer.pause();
        else audioPlayer.play();
        isPlaying = !isPlaying;
    } else if (player && typeof player.pauseVideo === 'function') {
        if (isPlaying) player.pauseVideo();
        else player.playVideo();
        // we don't set isPlaying here, we wait for onPlayerStateChange
    }
    updatePlayBtn();
}

function playNext() {
    if (currentPlaylist.length === 0) return;

    // Handle single track
    if (currentPlaylist.length === 1) {
        if (isRepeat || isShuffled) {
            const next = currentPlaylist[0];
            playSong(next.trackName, next.artistName, next.artworkUrl100, next.genre || '', next.previewUrl || '', 0);
        }
        return;
    }

    // End of playlist logic (ignored if shuffled)
    if (!isShuffled && currentIndex >= currentPlaylist.length - 1) {
        if (isRadioMode) {
            startRadio();
        } else if (isRepeat) {
            currentIndex = 0;
            const next = currentPlaylist[0];
            playSong(next.trackName, next.artistName, next.artworkUrl100, next.genre || '', next.previewUrl || '', 0);
        }
        return;
    }

    let nextIndex;
    if (isShuffled) {
        do { nextIndex = Math.floor(Math.random() * currentPlaylist.length); }
        while (nextIndex === currentIndex);
    } else {
        nextIndex = currentIndex + 1;
    }

    const next = currentPlaylist[nextIndex];
    playSong(next.trackName, next.artistName, next.artworkUrl100, next.genre || '', next.previewUrl || '', nextIndex);
}

function playPrev() {
    if (currentIndex > 0) {
        const prevIndex = currentIndex - 1;
        const prev = currentPlaylist[prevIndex];
        playSong(prev.trackName, prev.artistName, prev.artworkUrl100, prev.genre || '', prev.previewUrl || '', prevIndex);
    } else {
        if (activeSource === 'itunes' && audioPlayer) audioPlayer.currentTime = 0;
        else if (player && player.seekTo) player.seekTo(0);
    }
}

// --- Radio Mode ---
async function startRadio() {
    if (!currentTrack) { toggleRadioMode(); return; }

    notify('info', 'Radio', `Tuning station...`);

    // We'll search for the Artist AND the Genre to get a mix
    const queries = [];
    queries.push(`${SEARCH_EP}${encodeURIComponent(currentTrack.artist)}&media=music&entity=song&limit=30`);

    if (currentTrack.genre) {
        queries.push(`${SEARCH_EP}${encodeURIComponent(currentTrack.genre)}&media=music&entity=song&limit=30`);
    }

    try {
        const responses = await Promise.all(queries.map(q => fetch(q).then(r => r.json()).catch(e => ({ results: [] }))));

        let pool = [];
        responses.forEach(data => {
            if (data.results) pool = pool.concat(data.results);
        });

        // Dedup and Filter
        const unique = new Map();
        pool.forEach(s => {
            // Avoid duplicates by track name (simple fuzzy check)
            const key = s.trackName.toLowerCase().trim();
            // Don't add if already in playlist
            if (!currentPlaylist.some(existing => existing.trackName.toLowerCase() === key)) {
                unique.set(key, s);
            }
        });

        let newSongs = Array.from(unique.values()).map(s => ({
            trackName: s.trackName,
            artistName: s.artistName,
            artworkUrl100: s.artworkUrl100,
            genre: s.primaryGenreName,
            previewUrl: s.previewUrl
        }));

        // Shuffle the pool
        for (let i = newSongs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newSongs[i], newSongs[j]] = [newSongs[j], newSongs[i]];
        }

        // Take top 10
        newSongs = newSongs.slice(0, 10);

        if (newSongs.length > 0) {
            currentPlaylist.push(...newSongs);
            // We don't necessarily need to add to originalPlaylist if radio creates a temporary queue, 
            // but for UI consistency let's add it.
            originalPlaylist.push(...newSongs);
            notify('success', 'Radio', `Added ${newSongs.length} tracks`);
            playNext();
        } else {
            notify('warning', 'Radio', 'Station offline (No songs found)');
            toggleRadioMode();
        }
    } catch (e) {
        console.error("Radio Error", e);
        toggleRadioMode();
    }
}

function toggleRadioMode() {
    isRadioMode = !isRadioMode;
    localStorage.setItem('arcora_radio_mode', isRadioMode);
    updateRadioUI();
}

function updateRadioUI() {
    radioBtn.classList.toggle('active', isRadioMode);
    radioBadge.classList.toggle('show', isRadioMode);
}

// --- Proxy Mode ---
function toggleProxyMode() {
    isProxyMode = !isProxyMode;
    localStorage.setItem('arcora_proxy_mode', isProxyMode);
    updateProxyUI();
    // If playing, reload
    if (currentTrack) {
        loadVid(lastAttemptedVideoId);
    }
}

function updateProxyUI() {
    proxyBtn.classList.toggle('active', isProxyMode);
    if (isProxyMode) notify('info', 'Proxy Mode', 'Enabled');
}

// --- Lyrics ---
function fetchLyrics(artist, title) {
    lyricsContent.innerHTML = '<div class="lyrics-line">Loading...</div>';

    // Check Cache first
    const cacheKey = `lyrics_v1_${artist}_${title}`.toLowerCase();
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        try {
            renderLyrics(JSON.parse(cached));
            return;
        } catch (e) { localStorage.removeItem(cacheKey); }
    }

    const url = `${LRC_LYRIC_EP}?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    fetch(url, { signal: controller.signal })
        .then(r => r.json())
        .then(data => {
            clearTimeout(timeoutId);
            if (data.syncedLyrics) {
                const parsed = parseLRC(data.syncedLyrics);
                localStorage.setItem(cacheKey, JSON.stringify(parsed));
                renderLyrics(parsed);
            }
            else if (data.plainLyrics) {
                // We can't easily sync plain lyrics to time, so we just show text. 
                // Wrapper to match structure or just HTML.
                // For consistenty with cache, we might want to store it special, but for now:
                lyricsContent.innerHTML = data.plainLyrics.replace(/\n/g, '<br>');
            }
            else throw new Error("No lyrics");
        })
        .catch((err) => {
            clearTimeout(timeoutId);
            // Second Attempt: OVH
            // Note: OVH is often down or slow, but worth a shot if logic requires perfection.
            // Simplified fallback for now
            lyricsContent.innerHTML = '<div class="lyrics-line" style="opacity:0.5; font-style:italic">Lyrics not found</div>';
        });
}

function parseLRC(lrc) {
    const lines = [];
    const rx = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/g;
    let m;
    while ((m = rx.exec(lrc)) !== null) {
        const time = parseInt(m[1]) * 60 + parseInt(m[2]) + parseInt(m[3].padEnd(3, '0')) / 1000;
        lines.push({ time, text: m[4].trim() });
    }
    return lines;
}

function renderLyrics(lines) {
    lyricsContent.innerHTML = lines.map((l, i) =>
        `<div class="lyrics-line" data-time="${l.time}" onclick="seekTo(${l.time})">${esc(l.text)}</div>`
    ).join('');
}

window.seekTo = (time) => {
    if (player && player.seekTo) player.seekTo(time, true);
};

// --- Sync Timer (Progress & Lyrics) ---
function startSyncTimer() {
    if (syncTimer) clearInterval(syncTimer);
    syncTimer = setInterval(updateProgress, 250);
}

function updateProgress() {
    let curr = 0;
    let dur = 0;

    if (activeSource === 'itunes' && audioPlayer) {
        curr = audioPlayer.currentTime;
        dur = audioPlayer.duration;
    } else if (player && player.getCurrentTime) {
        curr = player.getCurrentTime();
        dur = player.getDuration();
    }

    if (dur > 0) {
        const pct = (curr / dur) * 100;
        progressFill.style.width = `${pct}%`;
        currentTimeEl.textContent = formatTime(curr);
        totalTimeEl.textContent = formatTime(dur);

        // Sync Lyrics
        const lines = document.querySelectorAll('.lyrics-line[data-time]');
        let activeIdx = -1;
        lines.forEach((l, i) => {
            const t = parseFloat(l.dataset.time);
            if (curr >= t) activeIdx = i;
            l.classList.remove('active');
        });

        if (activeIdx !== -1) {
            lines[activeIdx].classList.add('active');
            lines[activeIdx].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

// --- Controls ---
function toggleShuffle() {
    isShuffled = !isShuffled;
    shuffleBtn.classList.toggle('active', isShuffled);
    notify('info', 'Shuffle', isShuffled ? 'On' : 'Off');
}

function toggleRepeat() {
    isRepeat = !isRepeat;
    repeatBtn.classList.toggle('active', isRepeat);
    notify('info', 'Repeat', isRepeat ? 'On' : 'Off');
}

function handleSeek(e) {
    const rect = progressBar.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;

    if (activeSource === 'itunes' && audioPlayer) {
        audioPlayer.currentTime = pct * audioPlayer.duration;
    } else if (player && player.getDuration) {
        player.seekTo(pct * player.getDuration(), true);
    }
}

function toggleMute() {
    isMuted = !isMuted;
    const volToSet = isMuted ? 0 : lastVolume;

    // Apply to YouTube
    if (player && typeof player.setVolume === 'function') {
        if (isMuted) player.mute();
        else { player.unMute(); player.setVolume(volToSet); }
    }

    // Apply to Audio
    if (audioPlayer) {
        audioPlayer.volume = volToSet / 100;
    }

    setVolumeUI(volToSet);
}

function handleVolumeClick(e) {
    const rect = volumeBar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const vol = Math.round(pct * 100);

    if (vol > 0) {
        lastVolume = vol;
        isMuted = false;
    } else {
        isMuted = true;
    }

    localStorage.setItem('arcora_last_volume', lastVolume);
    setVolumeUI(vol);

    if (player && typeof player.setVolume === 'function') {
        player.setVolume(vol);
        if (vol > 0) player.unMute();
        else player.mute();
    }

    if (audioPlayer) {
        audioPlayer.volume = vol / 100;
    }
}

function setVolumeUI(vol) {
    volumeFill.style.width = `${vol}%`;
    volumeBtn.querySelector('i').className = vol === 0 ? 'fa-solid fa-volume-xmark' : vol < 50 ? 'fa-solid fa-volume-low' : 'fa-solid fa-volume-high';
}

function updatePlayBtn() {
    playPauseBtn.querySelector('i').className = isPlaying ? 'fa-solid fa-pause' : 'fa-solid fa-play';
}

// --- Playlist Management ---
function getPlaylist(name) {
    return playlists.find(p => p.name === name);
}

function loadPlaylists() {
    const fav = getPlaylist('Favorites');

    // Render Liked (Favorites)
    if (fav) {
        $('likedSongs').innerHTML = fav.songs.slice(0, 50).map((s, i) => renderMiniSong(s, 'Favorites', i)).join('');
        likedCount.textContent = `${fav.songs.length} songs`;
    }

    // Render Custom
    const customHTML = playlists.filter(p => p.name !== 'Favorites').map((p, pIdx) => `
        <div class="playlist-item" onclick="toggleCustomPlaylist('${p.name}')">
            <div class="playlist-icon"><i class="fa-solid fa-list"></i></div>
            <div class="playlist-info">
                <div class="playlist-name">${esc(p.name)}</div>
                <div class="playlist-count">${p.songs.length} songs</div>
            </div>
            <i class="fa-solid fa-trash" style="margin-left:auto; opacity:0.5; cursor:pointer" onclick="deletePlaylist('${p.name}', event)"></i>
        </div>
        <div class="playlist-songs" id="pl-${esc(p.name)}" style="display:none">
            ${p.songs.map((s, i) => renderMiniSong(s, p.name, i)).join('')}
        </div>
    `).join('');
    $('customPlaylists').innerHTML = customHTML;
}

window.toggleCustomPlaylist = (name) => {
    const el = document.getElementById(`pl-${name}`);
    if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
};

window.deletePlaylist = (name, e) => {
    e.stopPropagation();
    if (confirm(`Delete ${name}?`)) {
        playlists = playlists.filter(p => p.name !== name);
        savePlaylists();
        loadPlaylists();
    }
};

function renderMiniSong(s, playlistName, index) {
    const data = JSON.stringify({
        trackName: s.trackName,
        artistName: s.artistName,
        artworkUrl100: s.artworkUrl100,
        genre: s.genre || '',
        previewUrl: s.previewUrl || ''
    }).replace(/"/g, '&quot;');

    return `
        <div class="playlist-song" onclick='playPlaylistSong("${playlistName}", ${index})'>
             <img src="${s.artworkUrl100}" onerror="this.style.display='none'">
             <div class="playlist-song-info">
                <div class="playlist-song-title">${esc(s.trackName)}</div>
                <div class="playlist-song-artist">${esc(s.artistName)}</div>
             </div>
        </div>
    `;
}

window.playPlaylistSong = (plName, index) => {
    const pl = getPlaylist(plName);
    if (pl) playSongWithContext(pl.songs[index], pl.songs, index);
};

function toggleFavorite(song) {
    const fav = getPlaylist('Favorites');
    const idx = fav.songs.findIndex(s => s.trackName === song.trackName && s.artistName === song.artistName);

    if (idx >= 0) {
        fav.songs.splice(idx, 1);
        notify('info', 'Favorites', 'Removed');
    } else {
        fav.songs.push({
            trackName: song.trackName || song.title,
            artistName: song.artistName || song.artist,
            artworkUrl100: song.artworkUrl100 || song.artwork,
            genre: song.genre || '',
            previewUrl: song.previewUrl || ''
        });
        notify('success', 'Favorites', 'Added');
    }
    savePlaylists();
    loadPlaylists();
    updateLikeBtn();
}

window.toggleFavoriteFromSearch = (btn, json) => {
    const data = JSON.parse(json);
    toggleFavorite(data);
    const fav = getPlaylist('Favorites');
    const isNowFav = fav.songs.some(s => s.trackName.toLowerCase() === data.trackName.toLowerCase() && s.artistName.toLowerCase() === data.artistName.toLowerCase());
    btn.innerHTML = `<i class="fa-${isNowFav ? 'solid' : 'regular'} fa-heart ${isNowFav ? 'liked' : ''}"></i>`;
};

window.addToPlaylistMenu = (btn, json) => {
    const data = JSON.parse(json);
    const menu = $('addMenu');
    menu.innerHTML = playlists.filter(p => p.name !== 'Favorites').map(p => `
        <button class="add-menu-item" onclick="addSongToPlaylist('${p.name}', '${json.replace(/'/g, "\\'")}')">
            <i class="fa-solid fa-list"></i> ${esc(p.name)}
        </button>
    `).join('');

    // Position menu
    const rect = btn.getBoundingClientRect();
    menu.style.top = `${rect.bottom}px`;
    menu.style.left = `${rect.left - 100}px`;
    menu.classList.add('show');

    // Close on click outside
    const close = (e) => {
        if (!menu.contains(e.target)) {
            menu.classList.remove('show');
            document.removeEventListener('click', close);
        }
    };
    setTimeout(() => document.addEventListener('click', close), 0);
};

window.addSongToPlaylist = (plName, json) => {
    const data = JSON.parse(json);
    const pl = getPlaylist(plName);
    if (pl && !pl.songs.some(s => s.trackName === data.trackName)) {
        pl.songs.push(data);
        savePlaylists();
        loadPlaylists();
        notify('success', 'Added', `Added to ${plName}`);
    } else {
        notify('warning', 'Exists', 'Song already in playlist');
    }
    $('addMenu').classList.remove('show');
};

function savePlaylists() {
    localStorage.setItem('arcora_playlists', JSON.stringify(playlists));
}

function createNewPlaylist() {
    const name = $('playlistNameInput').value.trim();
    if (name && !getPlaylist(name)) {
        playlists.push({ name, songs: [] });
        savePlaylists();
        loadPlaylists();
        notify('success', 'Created', name);
    }
    $('playlistModal').classList.remove('show');
    $('playlistNameInput').value = '';
}

function updateLikeBtn() {
    if (!currentTrack) return;
    const fav = getPlaylist('Favorites');
    const isFav = fav.songs.some(s =>
        s.trackName.toLowerCase() === currentTrack.title.toLowerCase() &&
        s.artistName.toLowerCase() === currentTrack.artist.toLowerCase()
    );
    likeBtn.querySelector('i').className = `fa-${isFav ? 'solid' : 'regular'} fa-heart`;
    likeBtn.classList.toggle('active', isFav);
}

function renderLibrarySongs() {
    // Already handled by loadPlaylists for the most part
    // The original music.js had separate renderLibrarySongs for recent/liked
    // We integrated it into loadPlaylists which renders sidebar
}

function renderResults(results) { displayResults(results); }

// Helper
const esc = s => (s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const formatTime = s => isNaN(s) ? '0:00' : `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
const notify = (type, title, msg) => typeof Notify !== 'undefined' ? Notify[type](title, msg) : console.log(title, msg);
