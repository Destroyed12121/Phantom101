
const YT_KEYS = [
    "AIzaSyBMhadsGk2S2B9bP46EycgI2y8yCWLLdAs",
    "AIzaSyCOeLUcSlLDWAbKDUc-LUx8hdsenY-97rU",
    "AIzaSyC3Z3jpYx5bw9M_Hih4sxF8iuiYZ4m3Qis",
    "AIzaSyCWl9hmr-a0dVHKeUmUP5P7boAWJ3h48fs"
];
const LRC_LYRIC_EP = "https://lrclib.net/api/get";
const SEARCH_EP = "https://itunes.apple.com/search?term=";
const PROXY_BASE = "../staticsjv2/embed.html?skip#";

// State Management
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
let activeSource = 'youtube';
let audioPlayer = null;
let audio1, audio2;
let playlists = JSON.parse(localStorage.getItem('arcora_playlists')) || [];
if (!playlists.some(p => p.name === 'Favorites')) {
    playlists.unshift({ name: 'Favorites', songs: [] });
}
let forceYTShow = false; // Persistence for manual video toggle
let searchTimeout;
let isMuted = false;
let lastVolume = parseInt(localStorage.getItem('arcora_last_volume')) || 100;
let syncTimer = null;
let lastAttemptedVideoId = null;
let recentlyPlayed = JSON.parse(localStorage.getItem('arcora_recent')) || [];
let lastLyricInteraction = 0;

// DOM Elements
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
const likedCount = $('likedCount');
const recentCount = $('recentCount');

// Helper functions
const esc = s => (s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const formatTime = s => isNaN(s) ? '0:00' : `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
const notify = (type, title, msg) => {
    if (typeof Notify !== 'undefined' && Notify[type]) {
        Notify[type](title, msg);
    } else {
        console.log(`[${type}] ${title}: ${msg}`);
    }
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Load persisted state
    isRadioMode = localStorage.getItem('arcora_radio_mode') === 'true';
    isProxyMode = localStorage.getItem('arcora_proxy_mode') === 'true';

    // UI Init
    updateRadioUI();
    updateProxyUI();
    loadPlaylists();
    renderRecentSongs();

    // Search
    searchInput.addEventListener('input', handleSearchInput);
    searchInput.addEventListener('blur', () => {
        setTimeout(() => searchResults.classList.remove('show'), 250);
    });
    searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim().length >= 2) {
            searchResults.classList.add('show');
        }
    });

    // Player controls
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

    // Toggle YT Visibility (hidden button listener)
    $('toggleYTBtn')?.addEventListener('click', () => {
        forceYTShow = !forceYTShow;
        if (forceYTShow) {
            fallbackContainer.classList.remove('audio-only');
            fallbackContainer.classList.add('show');
            notify('info', 'Video Player', 'Forced Show');
        } else {
            hideFallback();
            notify('info', 'Video Player', 'Auto Hide');
        }
    });

    // Sidebar playlist expand/collapse
    $('likedPlaylist')?.addEventListener('click', () => {
        const songs = $('likedSongs');
        if (songs) {
            songs.classList.toggle('show');
            const icon = $('likedPlaylist').querySelector('.playlist-expand');
            if (icon) icon.classList.toggle('expanded', songs.classList.contains('show'));
        }
    });
    $('recentPlaylist')?.addEventListener('click', () => {
        const songs = $('recentSongs');
        if (songs) {
            songs.classList.toggle('show');
            const icon = $('recentPlaylist').querySelector('.playlist-expand');
            if (icon) icon.classList.toggle('expanded', songs.classList.contains('show'));
        }
    });

    // Source Tabs
    document.querySelectorAll('.source-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.source-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeSource = tab.dataset.source;
            notify('info', 'Source', `Using ${activeSource === 'youtube' ? 'YouTube' : 'iTunes previews'}`);
        });
    });

    // Audio elements for iTunes
    audio1 = $('audio1');
    audio2 = $('audio2');

    if (audio1) {
        audio1.addEventListener('timeupdate', updateProgress);
        audio1.addEventListener('ended', () => {
            console.log('Audio ended, playing next...');
            playNext();
        });
        audio1.addEventListener('play', () => { isPlaying = true; updatePlayBtn(); });
        audio1.addEventListener('pause', () => { isPlaying = false; updatePlayBtn(); });
        audio1.addEventListener('error', (e) => {
            console.warn('Audio error:', e);
            // On iTunes error, try YouTube instead
            if (currentTrack && activeSource === 'itunes') {
                notify('warning', 'Audio', 'Preview unavailable, trying YouTube');
                activeSource = 'youtube';
                getYT(`${currentTrack.title} ${currentTrack.artist} audio`);
            }
        });
    }

    // Add to Playlist button
    $('addToPlaylistBtn')?.addEventListener('click', (e) => {
        if (currentTrack) {
            showAddToPlaylistMenu(e.currentTarget);
        }
    });

    // Mobile Menu
    mobileMenuBtn?.addEventListener('click', () => sidebar.classList.add('mobile-open'));
    closeSidebar?.addEventListener('click', () => sidebar.classList.remove('mobile-open'));

    setVolumeUI(lastVolume);

    // Lyrics interaction
    lyricsContent?.addEventListener('wheel', () => lastLyricInteraction = Date.now(), { passive: true });
    lyricsContent?.addEventListener('touchstart', () => lastLyricInteraction = Date.now(), { passive: true });
    lyricsContent?.addEventListener('mousedown', () => lastLyricInteraction = Date.now());

    // New Playlist - simplified inline approach
    $('addPlaylistBtn')?.addEventListener('click', showNewPlaylistPrompt);
    $('cancelPlaylist')?.addEventListener('click', () => $('playlistModal')?.classList.remove('show'));
    $('cancelPlaylistIcon')?.addEventListener('click', () => $('playlistModal')?.classList.remove('show'));
    $('confirmPlaylist')?.addEventListener('click', createNewPlaylist);


    // Start sync timer
    startSyncTimer();

    // Initial Sync with Global AudioEngine
    const syncWithAE = () => {
        if (window.AudioEngine) {
            const data = window.AudioEngine.state;
            if (data) {
                isPlaying = data.isPlaying;
                if (data.currentTrack) {
                    currentTrack = {
                        title: data.currentTrack.trackName,
                        artist: data.currentTrack.artistName,
                        artwork: data.currentTrack.artworkUrl100,
                        genre: data.currentTrack.genre,
                        previewUrl: data.currentTrack.previewUrl
                    };
                    updateTrackUI();
                }
                updatePlayBtn();
                updateProgressLocal(data.currentTime, data.duration);
            }
        }
    };

    // Sync with Global AudioEngine
    window.addEventListener('phantom-audio-update', (e) => {
        const data = e.detail;
        if (!data) return;

        // Sync local state
        isPlaying = data.isPlaying;
        if (data.currentTrack) {
            if (!currentTrack || currentTrack.title !== data.currentTrack.trackName) {
                // New track from elsewhere (maybe mini-player controlled)
                currentTrack = {
                    title: data.currentTrack.trackName,
                    artist: data.currentTrack.artistName,
                    artwork: data.currentTrack.artworkUrl100,
                    genre: data.currentTrack.genre,
                    previewUrl: data.currentTrack.previewUrl
                };
                updateTrackUI();
            }
        }

        updatePlayBtn();
        updateProgressLocal(data.currentTime, data.duration);
    });

    window.addEventListener('phantom-audio-ready', syncWithAE);
    syncWithAE();

    // Load YouTube API
    if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
});

// New Playlist prompt (simple)
function showNewPlaylistPrompt() {
    const modal = $('playlistModal');
    if (modal) {
        modal.classList.add('show');
        const input = $('playlistNameInput');
        if (input) {
            input.value = '';
            input.focus();
        }
    } else {
        // Fallback to prompt if modal missing
        const name = prompt('Enter playlist name:');
        if (name && name.trim()) {
            if (!getPlaylist(name.trim())) {
                playlists.push({ name: name.trim(), songs: [] });
                savePlaylists();
                loadPlaylists();
                notify('success', 'Playlist', `Created "${name.trim()}"`);
            } else {
                notify('warning', 'Playlist', 'Already exists');
            }
        }
    }
}


// Search Logic
function handleSearchInput() {
    clearTimeout(searchTimeout);
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
    }, 400);
}

function displayResults(results) {
    if (!results.length) {
        searchResults.innerHTML = '<div class="loading-text">No results found.</div>';
        return;
    }

    const favs = getPlaylist('Favorites')?.songs || [];
    const isFav = (item) => favs.some(f =>
        f.trackName?.toLowerCase() === item.trackName?.toLowerCase() &&
        f.artistName?.toLowerCase() === item.artistName?.toLowerCase()
    );

    searchResults.innerHTML = results.map((item, idx) => {
        const art = item.artworkUrl100?.replace('100x100', '300x300') || '';
        const liked = isFav(item);

        return `
            <div class="result-item" data-idx="${idx}">
                <img class="result-img" src="${art}" onerror="this.style.display='none'">
                <div class="result-info" onclick="handleResultClick(${idx})">
                    <div class="result-title">${esc(item.trackName)}</div>
                    <div class="result-artist">${esc(item.artistName)}</div>
                </div>
                <div class="result-actions">
                    <button class="result-action" onclick="event.stopPropagation(); addSearchResultToPlaylist(${idx})"><i class="fa-solid fa-plus"></i></button>
                    <button class="result-action" onclick="event.stopPropagation(); toggleSearchFavorite(${idx})">
                        <i class="fa-${liked ? 'solid' : 'regular'} fa-heart ${liked ? 'liked' : ''}"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Store results globally for access
    window._searchResults = results;
}

window.handleResultClick = (idx) => {
    const results = window._searchResults || [];
    if (results[idx]) {
        const item = results[idx];
        const song = {
            trackName: item.trackName,
            artistName: item.artistName,
            artworkUrl100: item.artworkUrl100,
            genre: item.primaryGenreName || '',
            previewUrl: item.previewUrl || ''
        };
        playSongWithContext(song, [song], 0);
        searchResults.classList.remove('show');
        searchInput.value = '';
    }
};

window.toggleSearchFavorite = (idx) => {
    const results = window._searchResults || [];
    if (results[idx]) {
        const item = results[idx];
        toggleFavorite({
            trackName: item.trackName,
            artistName: item.artistName,
            artworkUrl100: item.artworkUrl100,
            genre: item.primaryGenreName || '',
            previewUrl: item.previewUrl || ''
        });
        // Refresh results display
        displayResults(results);
    }
};

window.addSearchResultToPlaylist = (idx) => {
    const results = window._searchResults || [];
    if (results[idx]) {
        const item = results[idx];
        const song = {
            trackName: item.trackName,
            artistName: item.artistName,
            artworkUrl100: item.artworkUrl100,
            genre: item.primaryGenreName || '',
            previewUrl: item.previewUrl || ''
        };

        // Get custom playlists
        const customPlaylists = playlists.filter(p => p.name !== 'Favorites');
        if (customPlaylists.length === 0) {
            notify('info', 'Playlists', 'Create a playlist first');
            return;
        }

        const names = customPlaylists.map(p => p.name).join(', ');
        const plName = prompt(`Add to which playlist?\nAvailable: ${names}`);
        if (plName) {
            const pl = getPlaylist(plName);
            if (pl) {
                if (!pl.songs.some(s => s.trackName?.toLowerCase() === song.trackName?.toLowerCase())) {
                    pl.songs.push(song);
                    savePlaylists();
                    loadPlaylists();
                    notify('success', 'Added', `Added to ${plName}`);
                } else {
                    notify('warning', 'Exists', 'Song already in playlist');
                }
            } else {
                notify('error', 'Not Found', 'Playlist not found');
            }
        }
    }
};

// Playback Logic
function playSongWithContext(song, playlist, index) {
    currentPlaylist = [...playlist];
    originalPlaylist = [...playlist];
    playSong(song.trackName, song.artistName, song.artworkUrl100, song.genre, song.previewUrl, index);
}

function playSong(title, artist, artwork, genre = '', previewUrl = '', index = -1) {
    console.log('Playing:', title, 'by', artist, 'source:', activeSource);

    // Stop existing players
    if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.src = '';
        audioPlayer = null;
    }
    if (player && typeof player.stopVideo === 'function') {
        try { player.stopVideo(); } catch (e) { }
    }

    currentTrack = { title, artist, artwork, genre, previewUrl };
    updateTrackUI();
    addToRecentlyPlayed({ trackName: title, artistName: artist, artworkUrl100: artwork, genre, previewUrl });

    if (index !== -1) currentIndex = index;

    isPlaying = true;
    updatePlayBtn();

    if (window.AudioEngine) {
        window.AudioEngine.play({
            trackName: title,
            artistName: artist,
            artworkUrl100: artwork,
            genre: genre,
            previewUrl: activeSource === 'itunes' ? previewUrl : null
        }, currentPlaylist);
        return; // Let AudioEngine handle the actual sound and persistence
    }

    if (activeSource === 'itunes' && previewUrl) {
        // iTunes Preview
        console.log("Playing iTunes preview:", previewUrl);
        audioPlayer = audio1;
        audioPlayer.src = previewUrl;
        audioPlayer.volume = isMuted ? 0 : lastVolume / 100;

        audioPlayer.play().then(() => {
            console.log("iTunes playing");
            hideFallback();
        }).catch(e => {
            console.warn("iTunes failed, trying YouTube:", e);
            activeSource = 'youtube';
            getYT(`${title} ${artist} audio`);
        });
    } else {
        // YouTube
        const searchQuery = `${title} ${artist} audio`;
        getYT(searchQuery);
    }
}

function updateTrackUI() {
    if (!currentTrack) return;
    const { title, artist, artwork } = currentTrack;
    trackTitle.textContent = title;
    trackArtist.textContent = artist;

    // Reset image first to avoid showing old thumbnail
    albumCover.src = '';

    if (artwork) {
        albumCover.src = artwork.replace('100x100', '600x600');
        albumCover.style.display = 'block';
        albumPlaceholder.style.display = 'none';
    } else {
        albumCover.style.display = 'none';
        albumPlaceholder.style.display = 'block';
    }

    updateLikeBtn();
    fetchLyrics(artist, title);
}

// Video cache
const videoCache = JSON.parse(localStorage.getItem('arcora_video_cache')) || {};

function getYT(query, retryCount = 0) {
    if (videoCache[query]) {
        console.log(`CACHE HIT: ${query}`);
        loadVid(videoCache[query]);
        return;
    }

    if (retryCount >= YT_KEYS.length) {
        console.error("All YouTube API keys exhausted.");
        notify('error', 'Error', 'Music service unavailable');
        return;
    }

    const currentKey = YT_KEYS[keyIndex];
    keyIndex = (keyIndex + 1) % YT_KEYS.length;

    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&key=${currentKey}&maxResults=1&videoEmbeddable=true`;

    fetch(url)
        .then(res => {
            if (!res.ok) throw new Error(res.status);
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
                notify('warning', 'Not Found', 'Song not on YouTube');
            }
        })
        .catch(err => {
            console.warn(`API key ${retryCount + 1} failed:`, err);
            getYT(query, retryCount + 1);
        });
}

function loadVid(videoId) {
    lastAttemptedVideoId = videoId;

    // ONLY use proxy if user explicitly enabled it
    if (isProxyMode) {
        useProxyPlayer(videoId);
        return;
    }

    // Standard YouTube player
    const startAction = () => {
        if (player && typeof player.loadVideoById === 'function') {
            player.loadVideoById(videoId);
            hideFallback();
        }
    };

    if (playerReady && player) {
        startAction();
    } else {
        commandQueue = commandQueue.filter(cmd => !cmd.isLoadCmd);
        startAction.isLoadCmd = true;
        commandQueue.push(startAction);
    }
}

// YouTube Player
const oldYTReady = window.onYouTubeIframeAPIReady;
window.onYouTubeIframeAPIReady = () => {
    if (oldYTReady) oldYTReady();
    player = new YT.Player('fallbackContainer', {
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
    console.log("YT Player Ready");
    playerReady = true;
    player.setVolume(lastVolume);

    while (commandQueue.length > 0) {
        const cmd = commandQueue.shift();
        try { cmd(); } catch (e) { console.error("Queue exec error", e); }
    }
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
        isPlaying = true;
    } else if (event.data === YT.PlayerState.PAUSED) {
        isPlaying = false;
    } else if (event.data === YT.PlayerState.ENDED) {
        console.log('YT ended, playing next...');
        playNext();
    }
    updatePlayBtn();
}

function onPlayerError(event) {
    console.warn("YouTube Player Error Code:", event.data);

    // Only notify if it's a real obstruction/block error
    if (event.data === 101 || event.data === 150) {
        notify('warning', 'Playback', 'Video blocked. Try enabling Proxy mode.');
    }
}

// Proxy Player (only when user enables it)
function useProxyPlayer(videoId) {
    if (player && player.destroy) {
        try { player.destroy(); player = null; playerReady = false; } catch (e) { }
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
    fallbackContainer.classList.remove('audio-only');
}

function hideFallback() {
    if (forceYTShow) {
        fallbackContainer.classList.add('show');
        fallbackContainer.classList.remove('audio-only');
        return;
    }
    if (isProxyMode) {
        fallbackContainer.classList.add('show');
        fallbackContainer.classList.remove('audio-only');
    } else if (activeSource === 'youtube') {
        fallbackContainer.classList.add('show');
        fallbackContainer.classList.add('audio-only');
    } else {
        fallbackContainer.classList.remove('show');
    }
}

function togglePlayback() {
    console.log('[Music] Toggle Playback. Current track:', currentTrack?.title);
    if (!currentTrack) return;

    if (window.AudioEngine) {
        const aeIsPlaying = window.AudioEngine.state.isPlaying;
        console.log('[Music] Using AudioEngine. isPlaying:', aeIsPlaying);
        if (aeIsPlaying) window.AudioEngine.pause();
        else window.AudioEngine.play();
        return;
    }

    console.log('[Music] Falling back to local playback. isPlaying:', isPlaying);
    if (isProxyMode) {
        notify('info', 'Proxy', 'Use player controls');
        return;
    }

    if (activeSource === 'itunes' && audioPlayer) {
        if (isPlaying) {
            audioPlayer.pause();
        } else {
            audioPlayer.play().catch(e => console.warn('Play failed:', e));
        }
    } else if (player && typeof player.pauseVideo === 'function') {
        try {
            if (isPlaying) player.pauseVideo();
            else player.playVideo();
        } catch (e) {
            console.warn('YT control failed:', e);
        }
    }
}

function playNext() {
    console.log('playNext called. Playlist length:', currentPlaylist.length, 'Current index:', currentIndex);

    if (currentPlaylist.length === 0) {
        console.log('Empty playlist');
        return;
    }

    // Single track handling
    if (currentPlaylist.length === 1) {
        if (isRepeat) {
            const next = currentPlaylist[0];
            playSong(next.trackName, next.artistName, next.artworkUrl100, next.genre || '', next.previewUrl || '', 0);
        } else if (isRadioMode) {
            startRadio();
        }
        return;
    }

    // End of playlist
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

    // Normal next
    let nextIndex;
    if (isShuffled) {
        do { nextIndex = Math.floor(Math.random() * currentPlaylist.length); }
        while (nextIndex === currentIndex && currentPlaylist.length > 1);
    } else {
        nextIndex = currentIndex + 1;
    }

    console.log('Playing next index:', nextIndex);
    const next = currentPlaylist[nextIndex];
    if (next) {
        playSong(next.trackName, next.artistName, next.artworkUrl100, next.genre || '', next.previewUrl || '', nextIndex);
    }
}

function playPrev() {
    if (currentIndex > 0) {
        const prevIndex = currentIndex - 1;
        const prev = currentPlaylist[prevIndex];
        playSong(prev.trackName, prev.artistName, prev.artworkUrl100, prev.genre || '', prev.previewUrl || '', prevIndex);
    } else {
        // Restart current track
        if (activeSource === 'itunes' && audioPlayer) audioPlayer.currentTime = 0;
        else if (player && player.seekTo) player.seekTo(0);
    }
}

// Radio Mode - Smarter and limited to 4 songs
async function startRadio() {
    if (!currentTrack) {
        toggleRadioMode();
        return;
    }

    notify('info', 'Radio', 'Finding similar tracks...');

    try {
        // Search by artist (primary) - more relevant
        const artistQuery = `${SEARCH_EP}${encodeURIComponent(currentTrack.artist)}&media=music&entity=song&limit=25`;
        const artistRes = await fetch(artistQuery).then(r => r.json()).catch(() => ({ results: [] }));

        let pool = artistRes.results || [];

        // Also search by current song title for similar vibes
        if (currentTrack.title) {
            const titleWords = currentTrack.title.split(' ').slice(0, 2).join(' ');
            const titleQuery = `${SEARCH_EP}${encodeURIComponent(titleWords)}&media=music&entity=song&limit=15`;
            const titleRes = await fetch(titleQuery).then(r => r.json()).catch(() => ({ results: [] }));
            pool = pool.concat(titleRes.results || []);
        }

        // Filter and dedupe
        const seen = new Set();
        const currentTitle = currentTrack.title.toLowerCase();

        let candidates = pool.filter(s => {
            if (!s.trackName || !s.artistName) return false;
            const key = `${s.trackName.toLowerCase()}-${s.artistName.toLowerCase()}`;
            if (seen.has(key)) return false;
            seen.add(key);

            // Don't add the current song
            if (s.trackName.toLowerCase() === currentTitle) return false;

            // Don't add songs already in playlist
            if (currentPlaylist.some(p => p.trackName?.toLowerCase() === s.trackName.toLowerCase())) return false;

            return true;
        });

        // Prioritize same artist
        const sameArtist = candidates.filter(s =>
            s.artistName.toLowerCase() === currentTrack.artist.toLowerCase()
        );
        const otherArtists = candidates.filter(s =>
            s.artistName.toLowerCase() !== currentTrack.artist.toLowerCase()
        );

        // Mix: 2 from same artist, 2 from similar
        let selected = [];

        // Shuffle arrays
        for (let i = sameArtist.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [sameArtist[i], sameArtist[j]] = [sameArtist[j], sameArtist[i]];
        }
        for (let i = otherArtists.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [otherArtists[i], otherArtists[j]] = [otherArtists[j], otherArtists[i]];
        }

        selected = selected.concat(sameArtist.slice(0, 2));
        selected = selected.concat(otherArtists.slice(0, 2));

        // Take max 4 songs
        selected = selected.slice(0, 4);

        if (selected.length > 0) {
            const newSongs = selected.map(s => ({
                trackName: s.trackName,
                artistName: s.artistName,
                artworkUrl100: s.artworkUrl100,
                genre: s.primaryGenreName || '',
                previewUrl: s.previewUrl || ''
            }));

            currentPlaylist.push(...newSongs);
            originalPlaylist.push(...newSongs);

            notify('success', 'Radio', `Added ${newSongs.length} track${newSongs.length > 1 ? 's' : ''} to queue`);

            // Play next song
            const nextIdx = currentIndex + 1;
            if (currentPlaylist[nextIdx]) {
                const next = currentPlaylist[nextIdx];
                // Update currentIndex BEFORE playing
                currentIndex = nextIdx;
                playSong(next.trackName, next.artistName, next.artworkUrl100, next.genre || '', next.previewUrl || '', nextIdx);
            }
        } else {
            notify('warning', 'Radio', 'No similar tracks found');
        }
    } catch (e) {
        console.error("Radio Error", e);
        notify('error', 'Radio', 'Failed to find tracks');
    }
}

function toggleRadioMode() {
    isRadioMode = !isRadioMode;
    localStorage.setItem('arcora_radio_mode', isRadioMode);
    updateRadioUI();
    notify('info', 'Radio', isRadioMode ? 'Enabled' : 'Disabled');
}

function updateRadioUI() {
    radioBtn?.classList.toggle('active', isRadioMode);
    radioBadge?.classList.toggle('show', isRadioMode);
}

function toggleProxyMode() {
    isProxyMode = !isProxyMode;
    localStorage.setItem('arcora_proxy_mode', isProxyMode);
    updateProxyUI();

    if (currentTrack && lastAttemptedVideoId) {
        // Reload with new mode
        if (isProxyMode) {
            useProxyPlayer(lastAttemptedVideoId);
        } else {
            // Reinitialize YT player
            location.reload(); // Simplest way to reset player
        }
    }
}

function updateProxyUI() {
    proxyBtn?.classList.toggle('active', isProxyMode);
}

// Lyrics
function fetchLyrics(artist, title) {
    lyricsContent.innerHTML = '<div class="lyrics-line">Loading...</div>';

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
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    fetch(url, { signal: controller.signal })
        .then(r => r.json())
        .then(data => {
            clearTimeout(timeoutId);
            if (data.syncedLyrics) {
                const parsed = parseLRC(data.syncedLyrics);
                localStorage.setItem(cacheKey, JSON.stringify(parsed));
                renderLyrics(parsed);
            } else if (data.plainLyrics) {
                lyricsContent.innerHTML = data.plainLyrics.replace(/\n/g, '<br>');
            } else {
                lyricsContent.innerHTML = '<div class="lyrics-line">Lyrics not found</div>';
            }
        })
        .catch(() => {
            clearTimeout(timeoutId);
            lyricsContent.innerHTML = '<div class="lyrics-line">Lyrics not found</div>';
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
    lastActiveLine = null;
    lyricsContent.scrollTo({ top: 0 });
}

window.seekTo = (time) => {
    try {
        // Try AudioEngine first
        if (window.AudioEngine) {
            window.AudioEngine.seek(time);
            return;
        }

        if (activeSource === 'itunes' && audioPlayer) {
            audioPlayer.currentTime = time;
        } else if (player && player.seekTo) {
            player.seekTo(time, true);
        }
    } catch (e) { }
};

// Sync Timer
function startSyncTimer() {
    if (syncTimer) clearInterval(syncTimer);
    syncTimer = setInterval(updateProgress, 100);
}

function updateProgress() {
    // If AudioEngine is active, we rely on the event listener for updates
    if (window.AudioEngine && window.AudioEngine.state.currentTrack) {
        return;
    }

    let curr = 0;
    let dur = 0;

    try {
        if (activeSource === 'itunes' && audioPlayer && audioPlayer.src) {
            curr = audioPlayer.currentTime || 0;
            dur = audioPlayer.duration || 0;
        } else if (player && typeof player.getCurrentTime === 'function') {
            // Try to get time even if playerReady isn't set - the player may still work
            curr = player.getCurrentTime() || 0;
            dur = player.getDuration() || 0;
        }
    } catch (e) {
        // Silent fail - player may not be ready yet
        return;
    }

    updateProgressLocal(curr, dur);
}

let lastActiveLine = null;

function updateProgressLocal(curr, dur) {
    if (dur > 0 && !isNaN(dur)) {
        progressFill.style.width = `${(curr / dur) * 100}%`;
        currentTimeEl.textContent = formatTime(curr);
        totalTimeEl.textContent = formatTime(dur);

        // Sync Lyrics
        const lines = document.querySelectorAll('.lyrics-line[data-time]');
        let activeIdx = -1;

        // Find the current active line index
        for (let i = 0; i < lines.length; i++) {
            const t = parseFloat(lines[i].dataset.time);
            if (curr >= t) {
                activeIdx = i;
            } else {
                break;
            }
        }

                if (activeIdx !== -1) {
                    const activeLine = lines[activeIdx];

                    // Only update classes and scroll if the active line changed
                    if (activeLine !== lastActiveLine) {
                        // Update previous lines to 'past' and clear 'active'
                        lines.forEach((l, i) => {
                            l.classList.remove('active');
                            if (i < activeIdx) {
                                l.classList.add('past');
                            } else {
                                l.classList.remove('past');
                            }
                        });

                        activeLine.classList.add('active');
                        activeLine.classList.remove('past');
                        lastActiveLine = activeLine;

                        // Check if user has manually scrolled recently (within 3 seconds)
                        const now = Date.now();
                        const allowAutoScroll = (now - lastLyricInteraction > 3000);

                        if (allowAutoScroll) {
                            // Scroll to center the active line in the container
                            // offsetTop is relative to the parent, so we need to subtract the container's scroll position
                            const containerRect = lyricsContent.getBoundingClientRect();
                            const lineRect = activeLine.getBoundingClientRect();
                            const relativeTop = lineRect.top - containerRect.top;
                            const containerMidpoint = lyricsContent.offsetHeight / 2;
                            const lineMidpoint = activeLine.offsetHeight / 2;

                            // Calculate how much to scroll to center the line
                            const currentScroll = lyricsContent.scrollTop;
                            const targetScroll = currentScroll + relativeTop - containerMidpoint + lineMidpoint;

                            lyricsContent.scrollTo({ top: targetScroll, behavior: 'smooth' });
                        }
                    }
                } else if (lastActiveLine !== null) {
                    // Reset if we go back to start
                    lines.forEach(l => l.classList.remove('active', 'past'));
                    lastActiveLine = null;
                    const now = Date.now();
                    if (curr < 1 && (now - lastLyricInteraction > 10000)) {
                        lyricsContent.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                }
            }
        }

        // Controls
        function toggleShuffle() {
            isShuffled = !isShuffled;
            shuffleBtn?.classList.toggle('active', isShuffled);
            notify('info', 'Shuffle', isShuffled ? 'On' : 'Off');
        }

        function toggleRepeat() {
            isRepeat = !isRepeat;
            repeatBtn?.classList.toggle('active', isRepeat);
            notify('info', 'Repeat', isRepeat ? 'On' : 'Off');
        }

        function handleSeek(e) {
            const rect = progressBar.getBoundingClientRect();
            const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));

            try {
                // Try AudioEngine first
                if (window.AudioEngine && window.AudioEngine.state.duration > 0) {
                    const seekTime = pct * window.AudioEngine.state.duration;
                    window.AudioEngine.seek(seekTime);
                    return;
                }

                if (activeSource === 'itunes' && audioPlayer && audioPlayer.duration) {
                    audioPlayer.currentTime = pct * audioPlayer.duration;
                } else if (player && typeof player.getDuration === 'function') {
                    const duration = player.getDuration();
                    if (duration > 0) player.seekTo(pct * duration, true);
                }
            } catch (e) { }
        }

        function toggleMute() {
            isMuted = !isMuted;
            const vol = isMuted ? 0 : lastVolume;

            if (player && typeof player.setVolume === 'function') {
                if (isMuted) player.mute();
                else { player.unMute(); player.setVolume(vol); }
            }

            if (audioPlayer) {
                audioPlayer.volume = vol / 100;
            }

            setVolumeUI(vol);
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
            const icon = vol === 0 ? 'fa-volume-xmark' : vol < 50 ? 'fa-volume-low' : 'fa-volume-high';
            volumeBtn.querySelector('i').className = `fa-solid ${icon}`;
        }

        function updatePlayBtn() {
            playPauseBtn.querySelector('i').className = isPlaying ? 'fa-solid fa-pause' : 'fa-solid fa-play';
        }

        // Playlist Management
        function getPlaylist(name) {
            return playlists.find(p => p.name === name);
        }

        function loadPlaylists() {
            const fav = getPlaylist('Favorites');

            // Liked Songs
            if (fav && $('likedSongs')) {
                $('likedSongs').innerHTML = fav.songs.slice(0, 50).map((s, i) => renderMiniSong(s, 'Favorites', i)).join('');
                if (likedCount) likedCount.textContent = `${fav.songs.length} songs`;
            }

            // Custom Playlists
            const customContainer = $('customPlaylists');
            if (customContainer) {
                const custom = playlists.filter(p => p.name !== 'Favorites');
                customContainer.innerHTML = custom.map(p => `
            <div class="playlist-item" onclick="toggleCustomPlaylist('${esc(p.name)}')">
                <div class="playlist-icon"><i class="fa-solid fa-list"></i></div>
                <div class="playlist-info">
                    <div class="playlist-name">${esc(p.name)} <i class="fa-solid fa-chevron-down playlist-expand"></i></div>
                    <div class="playlist-count">${p.songs.length} songs</div>
                </div>
                <i class="fa-solid fa-trash" style="margin-left:auto; opacity:0.5; cursor:pointer; font-size:12px;" onclick="event.stopPropagation(); deletePlaylist('${esc(p.name)}')"></i>
            </div>
            <div class="playlist-songs" id="pl-${esc(p.name)}">
                ${p.songs.map((s, i) => renderMiniSong(s, p.name, i)).join('')}
            </div>
        `).join('');
            }
        }

        window.toggleCustomPlaylist = (name) => {
            const el = document.getElementById(`pl-${name}`);
            if (el) {
                el.classList.toggle('show');
            }
        };

        window.deletePlaylist = (name) => {
            if (confirm(`Delete "${name}"?`)) {
                playlists = playlists.filter(p => p.name !== name);
                savePlaylists();
                loadPlaylists();
                notify('info', 'Deleted', name);
            }
        };

        function renderMiniSong(s, playlistName, index) {
            return `
        <div class="playlist-song" onclick='playPlaylistSong("${esc(playlistName)}", ${index})'>
            <img src="${s.artworkUrl100 || ''}" onerror="this.style.display='none'">
            <div class="playlist-song-info">
                <div class="playlist-song-title">${esc(s.trackName || '')}</div>
                <div class="playlist-song-artist">${esc(s.artistName || '')}</div>
            </div>
        </div>
    `;
        }

        window.playPlaylistSong = (plName, index) => {
            const pl = getPlaylist(plName);
            if (pl && pl.songs[index]) {
                playSongWithContext(pl.songs[index], pl.songs, index);
            }
        };

        function toggleFavorite(song) {
            const fav = getPlaylist('Favorites');
            if (!fav) return;

            const trackName = song.trackName || song.title;
            const artistName = song.artistName || song.artist;

            const idx = fav.songs.findIndex(s =>
                s.trackName?.toLowerCase() === trackName?.toLowerCase() &&
                s.artistName?.toLowerCase() === artistName?.toLowerCase()
            );

            if (idx >= 0) {
                fav.songs.splice(idx, 1);
                notify('info', 'Favorites', 'Removed');
            } else {
                fav.songs.push({
                    trackName: trackName,
                    artistName: artistName,
                    artworkUrl100: song.artworkUrl100 || song.artwork || '',
                    genre: song.genre || '',
                    previewUrl: song.previewUrl || ''
                });
                notify('success', 'Favorites', 'Added');
            }
            savePlaylists();
            loadPlaylists();
            updateLikeBtn();
        }

        function showAddToPlaylistMenu(btn) {
            if (!currentTrack) return;

            const custom = playlists.filter(p => p.name !== 'Favorites');
            if (custom.length === 0) {
                notify('info', 'Playlists', 'Create a playlist first');
                return;
            }

            const names = custom.map(p => p.name).join(', ');
            const plName = prompt(`Add to which playlist?\nAvailable: ${names}`);

            if (plName) {
                const pl = getPlaylist(plName);
                if (pl) {
                    const song = {
                        trackName: currentTrack.title,
                        artistName: currentTrack.artist,
                        artworkUrl100: currentTrack.artwork || '',
                        genre: currentTrack.genre || '',
                        previewUrl: currentTrack.previewUrl || ''
                    };

                    if (!pl.songs.some(s => s.trackName?.toLowerCase() === song.trackName?.toLowerCase())) {
                        pl.songs.push(song);
                        savePlaylists();
                        loadPlaylists();
                        notify('success', 'Added', `Added to ${plName}`);
                    } else {
                        notify('warning', 'Exists', 'Song already in playlist');
                    }
                } else {
                    notify('error', 'Not Found', 'Playlist not found');
                }
            }
        }

        function savePlaylists() {
            localStorage.setItem('arcora_playlists', JSON.stringify(playlists));
        }

        function createNewPlaylist() {
            const input = $('playlistNameInput');
            const name = input?.value?.trim();
            if (name && !getPlaylist(name)) {
                playlists.push({ name, songs: [] });
                savePlaylists();
                loadPlaylists();
                notify('success', 'Created', name);
            }
            $('playlistModal')?.classList.remove('show');
            if (input) input.value = '';
        }

        function updateLikeBtn() {
            if (!currentTrack) return;
            const fav = getPlaylist('Favorites');
            if (!fav) return;

            const isFav = fav.songs.some(s =>
                s.trackName?.toLowerCase() === currentTrack.title?.toLowerCase() &&
                s.artistName?.toLowerCase() === currentTrack.artist?.toLowerCase()
            );
            likeBtn.querySelector('i').className = `fa-${isFav ? 'solid' : 'regular'} fa-heart`;
            likeBtn.classList.toggle('active', isFav);
        }

        // Recently Played
        function addToRecentlyPlayed(song) {
            if (!song || !song.trackName) return;

            recentlyPlayed = recentlyPlayed.filter(s =>
                !(s.trackName?.toLowerCase() === song.trackName?.toLowerCase() &&
                    s.artistName?.toLowerCase() === song.artistName?.toLowerCase())
            );

            recentlyPlayed.unshift({
                trackName: song.trackName,
                artistName: song.artistName,
                artworkUrl100: song.artworkUrl100 || '',
                genre: song.genre || '',
                previewUrl: song.previewUrl || ''
            });

            if (recentlyPlayed.length > 50) {
                recentlyPlayed = recentlyPlayed.slice(0, 50);
            }

            localStorage.setItem('arcora_recent', JSON.stringify(recentlyPlayed));
            renderRecentSongs();
        }

        function renderRecentSongs() {
            const container = $('recentSongs');
            if (!container) return;

            if (recentlyPlayed.length === 0) {
                container.innerHTML = '<div class="playlist-song empty" style="opacity:0.5; padding:8px 12px;">No recent tracks</div>';
                if (recentCount) recentCount.textContent = '0 songs';
                return;
            }

            container.innerHTML = recentlyPlayed.slice(0, 20).map((s, i) => `
        <div class="playlist-song" onclick='playRecentSong(${i})'>
            <img src="${s.artworkUrl100 || ''}" onerror="this.style.display='none'">
            <div class="playlist-song-info">
                <div class="playlist-song-title">${esc(s.trackName || '')}</div>
                <div class="playlist-song-artist">${esc(s.artistName || '')}</div>
            </div>
        </div>
    `).join('');

            if (recentCount) recentCount.textContent = `${recentlyPlayed.length} song${recentlyPlayed.length !== 1 ? 's' : ''}`;
        }

        window.playRecentSong = (index) => {
            if (recentlyPlayed[index]) {
                playSongWithContext(recentlyPlayed[index], recentlyPlayed, index);
            }
        };
