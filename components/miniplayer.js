class MiniPlayer {
    constructor() {
        this.DOM = {};
        this.state = {
            isPlaying: false,
            currentTrack: null,
            radioMode: false,
            shuffleMode: false,
            isVisible: false,
            isSeeking: false,
            isReady: false,
            dismissed: sessionStorage.getItem('mp_dismissed') === 'true'
        };

        // Reset dismissal if on music page
        if (window.location.pathname.includes('music.html')) {
            this.state.dismissed = false;
            sessionStorage.removeItem('mp_dismissed');
        }

        // Settings Integration
        if (window.Settings) {
            window.Settings.onChange((s) => {
                if (s.miniplayer === false) this.close(true);
                else this.syncVisibility();
            });
            if (window.Settings.get('miniplayer') !== false) {
                this.init();
            }
        } else {
            // Fallback
            this.init();
        }
    }

    async init() {
        await this.injectStyles();
        this.render();
        this.bindEvents();

        // Listen for AudioEngine updates
        window.addEventListener('phantom-audio-update', (e) => {
            const data = e.detail;

            // If the track changed, reset the dismissed flag so it shows for the new song
            if (JSON.stringify(data.currentTrack) !== JSON.stringify(this.state.currentTrack)) {
                this.state.dismissed = false;
            }

            this.state.isPlaying = data.isPlaying;
            this.state.currentTrack = data.currentTrack;
            this.state.radioMode = data.radioMode;
            this.state.shuffleMode = data.shuffleMode;
            this.state.isReady = data.isReady;

            this.syncVisibility();
            this.updateUI();
            if (!this.state.isSeeking) {
                this.updateProgress(data.currentTime, data.duration);
            }
        });

        // Initial check and ready listener
        const sync = () => {
            if (window.AudioEngine) {
                const ae = window.AudioEngine.state;
                if (ae && ae.currentTrack) {
                    this.state.currentTrack = ae.currentTrack;
                    this.state.isPlaying = ae.isPlaying;
                    this.state.radioMode = ae.radioMode;
                    this.state.shuffleMode = ae.shuffleMode;
                    this.state.isReady = ae.isReady || false;
                    this.syncVisibility();
                    this.updateUI();
                    // Sync progress immediately
                    if (ae.currentTime !== undefined && ae.duration !== undefined) {
                        this.updateProgress(ae.currentTime, ae.duration);
                    }
                }
            }
        };

        window.addEventListener('phantom-audio-ready', sync);
        sync();
    }

    syncVisibility() {
        const isMusicPage = window.location.pathname.includes('music.html');
        const settingsEnabled = window.Settings ? window.Settings.get('miniplayer') !== false : true;

        if (this.state.currentTrack && !this.state.dismissed && settingsEnabled) {
            this.state.isVisible = true;
            if (this.DOM.container) {
                this.DOM.container.style.display = 'flex';
                this.DOM.container.classList.toggle('mp-disabled', isMusicPage);
                this.DOM.container.style.pointerEvents = isMusicPage ? 'none' : 'all';
            }
        } else {
            this.state.isVisible = false;
            if (this.DOM.container) this.DOM.container.style.display = 'none';
        }
    }

    async injectStyles() {
        if (document.querySelector('link[href*="miniplayer.css"]')) return;

        let prefix = '';
        const scripts = document.getElementsByTagName('script');
        for (let s of scripts) {
            const src = s.getAttribute('src');
            if (src && src.includes('components/miniplayer.js')) {
                prefix = src.split('components/miniplayer.js')[0];
                break;
            }
        }

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = prefix + 'styles/miniplayer.css';
        document.head.appendChild(link);
    }

    render() {
        if (document.getElementById('phantom-miniplayer')) return;

        const div = document.createElement('div');
        div.id = 'phantom-miniplayer';
        div.className = 'miniplayer box-style';
        div.style.display = 'none';

        // Load saved position
        const savedPos = JSON.parse(localStorage.getItem('mp_position') || 'null');
        if (savedPos) {
            div.style.bottom = 'auto';
            div.style.right = 'auto';
            div.style.top = savedPos.top + 'px';
            div.style.left = savedPos.left + 'px';
        }

        div.innerHTML = `
            <div class="mp-drag-handle"></div>
            <div class="mp-box-art">
                <img src="" class="mp-art" onerror="this.src='https://placehold.co/60'">
            </div>
            <div class="mp-box-content">
                <button class="mp-close-btn" id="mp-close" title="Close Player"><i class="fa-solid fa-xmark"></i></button>
                <div class="mp-box-info">
                    <span class="mp-title">No Track</span>
                    <span class="mp-artist">Unknown</span>
                </div>
                <div class="mp-box-controls">
                    <button id="mp-prev" title="Previous"><i class="fa-solid fa-backward"></i></button>
                    <button id="mp-play" class="mp-play-btn" title="Play/Pause"><i class="fa-solid fa-play"></i></button>
                    <button id="mp-next" title="Next"><i class="fa-solid fa-forward"></i></button>
                    <button id="mp-shuffle" class="mp-shuffle-btn" title="Shuffle"><i class="fa-solid fa-shuffle"></i></button>
                    <button id="mp-radio" class="mp-radio-btn" title="Radio Mode"><i class="fa-solid fa-tower-broadcast"></i></button>
                </div>
            </div>
            <div class="mp-box-progress">
                <div class="mp-progress-fill"></div>
            </div>
        `;

        document.body.appendChild(div);
        this.DOM.container = div;
        this.DOM.handle = div.querySelector('.mp-drag-handle');
        this.DOM.playBtn = div.querySelector('#mp-play');
        this.DOM.radioBtn = div.querySelector('#mp-radio');
        this.DOM.shuffleBtn = div.querySelector('#mp-shuffle');
        this.DOM.title = div.querySelector('.mp-title');
        this.DOM.artist = div.querySelector('.mp-artist');
        this.DOM.art = div.querySelector('.mp-art');
        this.DOM.progress = div.querySelector('.mp-progress-fill');

        this.syncVisibility();
    }

    bindEvents() {
        // Dragging Logic
        let isDragging = false;
        let startX, startY, startLeft, startTop;

        this.DOM.handle.addEventListener('mousedown', (e) => {
            isDragging = true;
            const rect = this.DOM.container.getBoundingClientRect();
            startX = e.clientX;
            startY = e.clientY;
            startLeft = rect.left;
            startTop = rect.top;

            this.DOM.container.style.transition = 'none';
            e.preventDefault();
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            let newLeft = startLeft + dx;
            let newTop = startTop + dy;

            // Constrain to screen
            newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - this.DOM.container.offsetWidth));
            newTop = Math.max(0, Math.min(newTop, window.innerHeight - this.DOM.container.offsetHeight));

            this.DOM.container.style.bottom = 'auto';
            this.DOM.container.style.right = 'auto';
            this.DOM.container.style.left = newLeft + 'px';
            this.DOM.container.style.top = newTop + 'px';
        });

        window.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false;
            this.DOM.container.style.transition = '';

            // Save position
            const rect = this.DOM.container.getBoundingClientRect();
            localStorage.setItem('mp_position', JSON.stringify({
                left: rect.left,
                top: rect.top
            }));
        });

        this.DOM.playBtn.onclick = (e) => {
            e.stopPropagation();
            if (this.state.isPlaying) window.AudioEngine.pause();
            else window.AudioEngine.play();
        };

        this.DOM.radioBtn.onclick = (e) => {
            e.stopPropagation();
            window.AudioEngine.toggleRadio();
        };

        this.DOM.shuffleBtn.onclick = (e) => {
            e.stopPropagation();
            window.AudioEngine.toggleShuffle();
        };

        const nextBtn = document.getElementById('mp-next');
        const prevBtn = document.getElementById('mp-prev');

        if (nextBtn) nextBtn.onclick = (e) => { e.stopPropagation(); window.AudioEngine.next(); };
        if (prevBtn) prevBtn.onclick = (e) => { e.stopPropagation(); window.AudioEngine.prev(); };

        this.DOM.art.onclick = (e) => {
            e.stopPropagation();
            window.location.href = '../pages/music.html';
        };

        const closeBtn = document.getElementById('mp-close');
        if (closeBtn) closeBtn.onclick = (e) => {
            e.stopPropagation();
            this.close();
        };

        // Progress Seeking
        const progContainer = this.DOM.progress.parentElement;

        const handleSeek = (e) => {
            if (!this.state.currentTrack || !window.AudioEngine) return;
            const rect = progContainer.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const pct = Math.max(0, Math.min(1, x / rect.width));

            // Visual feedback while seeking
            this.DOM.progress.style.width = (pct * 100) + '%';

            const ae = window.AudioEngine.state;
            if (ae.duration) {
                window.AudioEngine.seek(ae.duration * pct);
            }
        };

        progContainer.addEventListener('mousedown', (e) => {
            this.state.isSeeking = true;
            handleSeek(e);
        });

        window.addEventListener('mousemove', (e) => {
            if (this.state.isSeeking) handleSeek(e);
        });

        window.addEventListener('mouseup', () => {
            this.state.isSeeking = false;
        });
    }

    close(force = false) {
        if (!force) {
            this.state.dismissed = true;
            sessionStorage.setItem('mp_dismissed', 'true');
        }
        this.syncVisibility();
    }

    updateUI() {
        if (!this.DOM.playBtn) return;

        // Handle loading state
        const isReady = this.state.isReady !== false;
        this.DOM.container.classList.toggle('mp-loading', !isReady);
        this.DOM.container.style.pointerEvents = isReady ? 'all' : 'none';

        const playIcon = this.DOM.playBtn.querySelector('i');
        if (playIcon) playIcon.className = `fa-solid ${this.state.isPlaying ? 'fa-pause' : 'fa-play'}`;

        // Gray out play button if not ready or no track
        const canPlay = isReady && this.state.currentTrack;
        this.DOM.playBtn.style.opacity = canPlay ? '1' : '0.3';
        this.DOM.playBtn.style.pointerEvents = canPlay ? 'all' : 'none';
        this.DOM.playBtn.style.filter = canPlay ? 'none' : 'grayscale(1)';

        if (this.DOM.radioBtn) this.DOM.radioBtn.classList.toggle('active', this.state.radioMode);
        if (this.DOM.shuffleBtn) this.DOM.shuffleBtn.classList.toggle('active', this.state.shuffleMode);

        if (this.state.currentTrack) {
            if (this.DOM.title) this.DOM.title.textContent = this.state.currentTrack.trackName;
            if (this.DOM.artist) this.DOM.artist.textContent = this.state.currentTrack.artistName || 'Unknown';
            const artUrl = this.state.currentTrack.artworkUrl100?.replace('100x100', '300x300') || 'https://placehold.co/60';
            if (this.DOM.art && this.DOM.art.src !== artUrl) this.DOM.art.src = artUrl;
        }
    }

    updateProgress(current, total) {
        if (!this.DOM.progress || !total) return;
        const pct = (current / total) * 100;
        this.DOM.progress.style.width = `${pct}%`;
    }
}

new MiniPlayer();
