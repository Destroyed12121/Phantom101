class AudioEngine {
    constructor() {
        this.player = null;
        this.audio = null;
        this.playerReady = false;
        this.queue = [];
        this.state = {
            isPlaying: false,
            currentTime: 0,
            duration: 0,
            volume: parseInt(localStorage.getItem('arcora_last_volume') || '100'),
            source: 'youtube',
            currentTrack: null,
            playlist: [],
            originalPlaylist: [],
            index: -1,
            radioMode: true,
            shuffleMode: false,
            isReady: false,
            timestamp: Date.now()
        };

        this.storageKey = 'arcora_player_state';
    }

    async init() {
        console.log('[AudioEngine] Initializing...');
        this._loadState();

        if (!window.YT && !document.querySelector('script[src*="youtube.com/iframe_api"]')) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            document.head.appendChild(tag);
        }

        if (!document.getElementById('audio-engine-container')) {
            const div = document.createElement('div');
            div.id = 'audio-engine-container';
            div.style.cssText = 'position:fixed; top:-9999px; left:-9999px; width:1px; height:1px; opacity:0; pointer-events:none;';
            document.body.appendChild(div);
        }

        this._bindEvents();
        await this._waitForYT();
        this._initPlayer();


        if (!this.state.currentTrack) {
            this.state.currentTrack = {
                trackName: "lebron lebron lebron james",
                artistName: "LeBron",
                artworkUrl100: "https://i.ytimg.com/vi/r2zAt2amp-8/hqdefault.jpg",
                previewUrl: null,
                videoId: "r2zAt2amp-8"
            };
            this.state.source = 'youtube';
        }

        this._checkAutoResume();


        this._notifyUI();
        window.dispatchEvent(new CustomEvent('phantom-audio-ready'));
    }

    _bindEvents() {

        const oldYTReady = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
            if (oldYTReady) oldYTReady();
            this._initPlayer();
        };

        window.addEventListener('beforeunload', () => this.saveState());
        setInterval(() => this.saveState(), 2000);


        window.addEventListener('phantom-music-control', (e) => {
            const { action, track, playlist } = e.detail || {};
            if (action === 'play') this.play(track, playlist);
            if (action === 'pause') this.pause();
            if (action === 'next') this.next();
            if (action === 'prev') this.prev();
            if (action === 'toggle-radio') this.toggleRadio();
            if (action === 'toggle-shuffle') this.toggleShuffle();
        });
    }

    _waitForYT() {
        return new Promise(resolve => {
            if (window.YT && window.YT.Player) return resolve();
            let attempts = 0;
            const interval = setInterval(() => {
                attempts++;
                if ((window.YT && window.YT.Player) || attempts > 100) {
                    clearInterval(interval);
                    resolve();
                }
            }, 100);
        });
    }

    _initPlayer() {
        if (this.player || !window.YT || !window.YT.Player || !document.getElementById('audio-engine-container')) return;
        try {
            this.player = new YT.Player('audio-engine-container', {
                height: '1', width: '1', videoId: '',
                playerVars: { 'autoplay': 1, 'controls': 0, 'disablekb': 1, 'origin': window.location.origin },
                events: {
                    'onReady': (e) => {
                        this.playerReady = true;
                        this.state.isReady = true;
                        this.player.setVolume(this.state.volume);
                        this._processQueue();
                        this._notifyUI();
                    },
                    'onStateChange': (e) => this._onYTStateChange(e),
                    'onError': (e) => console.warn('[AudioEngine] YT Error', e.data)
                }
            });
        } catch (e) { console.error('[AudioEngine] Player init failed', e); }
    }

    _processQueue() {
        while (this.queue.length > 0) {
            (this.queue.shift())();
        }
    }

    _onYTStateChange(event) {
        if (event.data === YT.PlayerState.PLAYING) {
            this.state.isPlaying = true;
            this.state.source = 'youtube';
            this.state.isReady = true;
            if (this.audio) this.audio.pause();
            this._startTimer();
        } else if (event.data === YT.PlayerState.PAUSED) {
            this.state.isPlaying = false;
        } else if (event.data === YT.PlayerState.ENDED) {
            this.state.isPlaying = false;
            this._onTrackEnd();
        }
        this._notifyUI();
    }

    _startTimer() {
        if (this._timer) clearInterval(this._timer);
        this._timer = setInterval(() => {
            try {
                if (this.state.source === 'youtube' && this.player && typeof this.player.getCurrentTime === 'function') {
                    this.state.currentTime = this.player.getCurrentTime() || 0;
                    this.state.duration = this.player.getDuration() || 0;
                } else if (this.state.source === 'itunes' && this.audio) {
                    this.state.currentTime = this.audio.currentTime || 0;
                    this.state.duration = this.audio.duration || 0;
                }
            } catch (e) {

            }
            this._notifyUI();
        }, 100);
    }

    _onTrackEnd() {
        if (this.state.radioMode && this.state.index >= this.state.playlist.length - 1) {
            this._startRadio();
        } else if (this.state.playlist.length > 0) {
            this.next();
        }
    }

    play(track, playlist = []) {
        if (!track) {
            if (this.state.currentTrack) {
                if (this.state.source === 'itunes') {
                    if (this.audio) this.audio.play();
                } else if (this.player) {
                    const reload = () => {
                        if (this.state.currentTrack.videoId) {
                            this._loadVideo(this.state.currentTrack.videoId);
                        } else {
                            const query = `${this.state.currentTrack.trackName} ${this.state.currentTrack.artistName} audio`;
                            this._searchAndPlay(query);
                        }

                        if (this.state.currentTime > 0) {
                            this.queue.push(() => {
                                if (this.player && this.player.seekTo) {
                                    this.player.seekTo(this.state.currentTime);
                                }
                            });
                        }
                    };

                    if (!this.playerReady || !this.player.getPlayerState) {
                        this.queue.push(reload);
                    } else {
                        const ytState = this.player.getPlayerState();
                        // -1 (unstarted), 5 (cued), 0 (ended), undefined (fresh)
                        if (ytState === -1 || ytState === 5 || ytState === 0 || ytState === undefined) {
                            reload();
                        } else {
                            this.player.playVideo();
                        }
                    }
                }
                this.state.isPlaying = true;
                this._notifyUI();
            }
            return;
        }

        const isSameTrack = this.state.currentTrack &&
            this.state.currentTrack.trackName === track.trackName &&
            this.state.currentTrack.artistName === track.artistName;

        if (isSameTrack) {
            this.play();
            return;
        }

        if (playlist.length > 0) {
            this.state.originalPlaylist = [...playlist];
            if (this.state.shuffleMode) {
                this.state.playlist = this._shuffleArray([...playlist]);
            } else {
                this.state.playlist = [...playlist];
            }
            this.state.index = this.state.playlist.findIndex(t => t.trackName === track.trackName);
        } else if (this.state.playlist.length <= 1) {
            this.state.playlist = [track];
            this.state.originalPlaylist = [track];
            this.state.index = 0;
        }

        this.state.currentTrack = track;
        this._startTimer();


        if (track.previewUrl) {
            this.state.source = 'itunes';
            this._playAudio(track.previewUrl);
        } else {
            this.state.source = 'youtube';
            this.state.isReady = this.playerReady;
            if (track.videoId) {
                this._loadVideo(track.videoId);
            } else {
                const query = `${track.trackName} ${track.artistName} audio`;
                this._searchAndPlay(query);
            }
        }
        this.saveState();
    }

    _playAudio(url) {
        if (this.player) try { this.player.pauseVideo(); } catch (e) { }
        this.state.isReady = true;
        if (!this.audio) {
            this.audio = new Audio();
            this.audio.addEventListener('ended', () => this._onTrackEnd());
            this.audio.addEventListener('timeupdate', () => {
                this.state.currentTime = this.audio.currentTime;
                this.state.duration = this.audio.duration;
                this._notifyUI();
            });
            this.audio.addEventListener('play', () => { this.state.isPlaying = true; this._notifyUI(); });
            this.audio.addEventListener('pause', () => { this.state.isPlaying = false; this._notifyUI(); });
        }
        this.audio.src = url;
        this.audio.volume = this.state.volume / 100;
        this.audio.play().catch(e => console.warn('[AudioEngine] Audio play failed', e));
    }

    pause() {
        this.state.isPlaying = false;
        if (this.state.source === 'itunes' && this.audio) this.audio.pause();
        else if (this.player && this.player.pauseVideo) this.player.pauseVideo();
        this.saveState();
        this._notifyUI();
    }

    next() {
        if (this.state.playlist.length > 0) {
            this.state.index = (this.state.index + 1) % this.state.playlist.length;
            this.play(this.state.playlist[this.state.index]);
        }
    }

    prev() {
        if (this.state.playlist.length > 0) {
            this.state.index = (this.state.index - 1 + this.state.playlist.length) % this.state.playlist.length;
            this.play(this.state.playlist[this.state.index]);
        }
    }

    seek(time) {
        this.state.currentTime = time;
        if (this.state.source === 'itunes' && this.audio) {
            this.audio.currentTime = time;
        } else if (this.player && this.player.seekTo) {
            this.player.seekTo(time, true);
        }
        this._notifyUI();
    }

    toggleRadio() {
        this.state.radioMode = !this.state.radioMode;
        if (this.state.radioMode) {
            window.Notify?.info('Radio Mode', 'Radio mode enabled');
            if (this.state.playlist.length <= 1 && this.state.currentTrack) {
                this._startRadio();
            }
        } else {
            window.Notify?.info('Radio Mode', 'Radio mode disabled');

        }
        this.saveState();
        this._notifyUI();
    }

    toggleShuffle() {
        this.state.shuffleMode = !this.state.shuffleMode;
        if (this.state.shuffleMode) {
            window.Notify?.info('Shuffle', 'Shuffle enabled');
            if (this.state.playlist.length > 1) {
                const current = this.state.playlist[this.state.index];
                this.state.playlist = this._shuffleArray([...this.state.playlist]);
                this.state.index = this.state.playlist.findIndex(t => t.trackName === current.trackName);
            }
        } else {
            window.Notify?.info('Shuffle', 'Shuffle disabled');
            if (this.state.originalPlaylist.length > 0) {
                const current = this.state.playlist[this.state.index];
                this.state.playlist = [...this.state.originalPlaylist];
                this.state.index = this.state.playlist.findIndex(t => t.trackName === current.trackName);
            }
        }
        this.saveState();
        this._notifyUI();
    }

    _shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    async _startRadio() {
        if (!this.state.currentTrack) return;
        const track = this.state.currentTrack;
        const url = `https://itunes.apple.com/search?term=${encodeURIComponent(track.artistName)}&media=music&limit=10`;
        try {
            const res = await fetch(url);
            const data = await res.json();
            if (data.results?.length > 0) {
                const newTracks = data.results
                    .filter(t => t.trackName.toLowerCase() !== track.trackName.toLowerCase())
                    .map(t => ({
                        trackName: t.trackName, artistName: t.artistName,
                        artworkUrl100: t.artworkUrl100, previewUrl: t.previewUrl
                    }));
                this.state.playlist.push(...newTracks);
                if (this.state.index === -1) this.state.index = 0;
                if (!this.state.isPlaying) this.next();
                this._notifyUI();
            }
        } catch (e) { console.error('Radio failed', e); }
    }

    async _searchAndPlay(query) {
        const cache = JSON.parse(localStorage.getItem('arcora_video_cache') || '{}');
        if (cache[query]) return this._loadVideo(cache[query]);
        const keys = [
            "AIzaSyBMhadsGk2S2B9bP46EycgI2y8yCWLLdAs",
            "AIzaSyCOeLUcSlLDWAbKDUc-LUx8hdsenY-97rU",
            "AIzaSyC3Z3jpYx5bw9M_Hih4sxF8iuiYZ4m3Qis",
            "AIzaSyCWl9hmr-a0dVHKeUmUP5P7boAWJ3h48fs"
        ];
        const key = keys[Math.floor(Math.random() * keys.length)];
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&key=${key}&maxResults=1`;
        try {
            const res = await fetch(url);
            const data = await res.json();
            if (data.items?.[0]?.id?.videoId) {
                const id = data.items[0].id.videoId;
                cache[query] = id;
                localStorage.setItem('arcora_video_cache', JSON.stringify(cache));
                this._loadVideo(id);
            }
        } catch (e) { console.error('Search failed', e); }
    }

    _loadVideo(id) {
        if (this.state.currentTrack) {
            this.state.currentTrack.videoId = id;
            this.saveState();
        }

        if (this.playerReady && this.player.loadVideoById) {
            this.player.loadVideoById(id);
        } else {
            this.queue.push(() => this.player.loadVideoById(id));
        }
    }

    _loadState() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const now = Date.now();
                if (now - (parsed.timestamp || 0) > 2 * 60 * 60 * 1000) {
                    console.log('[AudioEngine] Stale state ignored');
                    return;
                }
                Object.assign(this.state, parsed);
            } catch (e) { }
        }
    }

    saveState() {
        const save = {
            currentTrack: this.state.currentTrack,
            currentTime: this.state.currentTime,
            duration: this.state.duration,
            isPlaying: this.state.isPlaying,
            source: this.state.source,
            playlist: this.state.playlist,
            originalPlaylist: this.state.originalPlaylist,
            index: this.state.index,
            radioMode: this.state.radioMode,
            shuffleMode: this.state.shuffleMode,
            timestamp: Date.now()
        };
        localStorage.setItem(this.storageKey, JSON.stringify(save));
    }

    _checkAutoResume() {
        const now = Date.now();
        const wasPlaying = this.state.isPlaying;
        this.state.isPlaying = false;

        if (wasPlaying && (now - (this.state.timestamp || 0) < 15000)) {
            if (this.state.currentTrack) {
                console.log('[AudioEngine] Resuming playback...');
                this.play(this.state.currentTrack);
                if (this.state.currentTime > 0) {
                    this.queue.push(() => {
                        if (this.state.source === 'itunes' && this.audio) {
                            this.audio.currentTime = this.state.currentTime;
                        } else if (this.player && this.player.seekTo) {
                            this.player.seekTo(this.state.currentTime);
                        }
                    });
                }
            }
        }
    }

    _notifyUI() {
        window.dispatchEvent(new CustomEvent('phantom-audio-update', { detail: this.state }));
    }

}
window.AudioEngine = new AudioEngine();
window.AudioEngine.init();
