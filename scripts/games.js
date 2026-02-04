const Games = {
    lib: 'multi',
    allGames: [],
    filteredGames: [],
    renderedCount: 0,
    BATCH_SIZE: 50,
    liked: JSON.parse(localStorage.getItem('liked_games') || '[]'),
    recent: JSON.parse(localStorage.getItem('recent_games') || '[]'),
    isLoading: false,
    firstLoad: true,

    async init() {
        this.lib = window.Settings?.get('gameLibrary') || 'multi';
        // legacy
        if (this.lib === 'lib1') this.lib = 'gnmath';
        if (this.lib === 'lib2') this.lib = 'ugs';

        window.addEventListener('scroll', () => {
            if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
                this.renderMore();
            }
        });

        await this.loadGames();
        this.checkRedirect(); //  ?gamename=
        this.setupListeners();
    },

    async loadGames() {
        if (this.isLoading) return;
        this.isLoading = true;

        if (this.firstLoad && window.Notify) {
            window.Notify.info('Games', 'Loading game library...');
        }

        try {
            if (!window.Gloader) {
                console.error('Gloader missing');
                return;
            }
            // Use centralized loader
            this.allGames = await window.Gloader.load(this.lib);
            this.filteredGames = [...this.allGames];
            this.applyLikedSort();
            this.resetRender();

            if (window.Notify) window.Notify.success('Games', `${this.allGames.length} games loaded`);
        } catch (e) {
            console.error(e);
            if (window.Notify) window.Notify.error('Error', 'Failed to load games');
        } finally {
            this.isLoading = false;
            this.firstLoad = false;
        }
    },

    checkRedirect() {
        const params = new URLSearchParams(window.location.search);
        const target = params.get('gamename');
        if (!target) return;

        const targetNormalized = target.toLowerCase().replace(/[^a-z0-9]/g, '');
        const game = this.allGames.find(g =>
            (g.normalized && g.normalized === targetNormalized) ||
            g.name.toLowerCase().replace(/[^a-z0-9]/g, '') === targetNormalized
        );

        if (game) {
            console.log('Redirecting to game:', game.name);
            this.openGame(game);
        } else {
            console.warn('Game not found for redirect:', target);
        }
    },

    sort(method) {
        if (method === 'name') {
            this.filteredGames.sort((a, b) => a.name.localeCompare(b.name));
        } else if (method === 'newest') {
            this.filteredGames.reverse();
        } else {
            // Default order preservation if possible, or just index based
            // Since we don't have original index easily, we might rely on load order
        }
        this.applyLikedSort();
        this.resetRender();
    },

    resetRender() {
        const grid = document.getElementById('games-grid');
        if (!grid) return;
        grid.innerHTML = '';
        this.renderedCount = 0;
        this.updateRecentSection();
        const countDisplay = document.getElementById('game-count');
        if (countDisplay) countDisplay.innerText = `${this.filteredGames.length} Games`;
        this.renderMore();
    },

    renderMore() {
        if (this.renderedCount >= this.filteredGames.length) return;
        const grid = document.getElementById('games-grid');
        const batch = this.filteredGames.slice(this.renderedCount, this.renderedCount + this.BATCH_SIZE);
        batch.forEach(game => grid.appendChild(this.createCard(game)));
        this.renderedCount += batch.length;
    },

    createCard(game) {
        const div = document.createElement('div');
        div.className = 'game-card';
        const isLiked = this.isLiked(game);

        let imgHTML;
        if (game.img) {
            imgHTML = `<img src="${game.img}" loading="lazy" alt="${game.name}" onerror="this.parentElement.innerHTML='<div class=\\'game-placeholder\\' style=\\'${this.getGradient(game.name)}\\'><i class=\\'fa-solid fa-gamepad\\'></i></div>'">`;
        } else {
            imgHTML = `<div class="game-placeholder" style="${this.getGradient(game.name)}"><i class="fa-solid fa-gamepad"></i></div>`;
        }

        div.innerHTML = `
            <div class="game-img-wrapper">
                ${imgHTML}
                <button class="like-btn ${isLiked ? 'active' : ''}"><i class="fa-solid fa-heart"></i></button>
            </div>
            <div class="game-info"><div class="game-title">${game.name}</div></div>
        `;

        const open = () => this.openGame(game);
        div.querySelector('.game-img-wrapper').onclick = open;
        div.querySelector('.game-info').onclick = open;

        const likeBtn = div.querySelector('.like-btn');
        likeBtn.onclick = (e) => {
            e.stopPropagation();
            this.toggleLike(game);
            likeBtn.classList.toggle('active', this.isLiked(game));
        };
        return div;
    },

    applyLikedSort() {
        this.filteredGames.sort((a, b) => {
            return (this.isLiked(b) ? 1 : 0) - (this.isLiked(a) ? 1 : 0);
        });
    },

    openGame(game) {
        this.addToRecent(game);
        window.location.href = `player.html?type=game&title=${encodeURIComponent(game.name)}&url=${encodeURIComponent(game.url)}`;
    },

    addToRecent(game) {
        if (window.Settings && window.Settings.get('historyEnabled') === false) return;
        // Remove if exists
        this.recent = this.recent.filter(g => g.url !== game.url);
        // Add to front
        this.recent.unshift({ name: game.name, url: game.url, img: game.img, type: game.type });
        // Cap at 12
        if (this.recent.length > 12) this.recent.pop();
        localStorage.setItem('recent_games', JSON.stringify(this.recent));
    },

    updateRecentSection() {
        const recentGrid = document.getElementById('recent-grid');
        const recentSection = document.getElementById('recent-section');
        if (!recentGrid) return;

        if (window.Settings && window.Settings.get('historyEnabled') === false) {
            recentSection.style.display = 'none';
            return;
        }

        // Filter valid recent games (sanity check against allGames isn't strictly necessary but good if data corrupted)
        // But users might have played games from other libraries, so we just show what's in history
        recentGrid.innerHTML = '';
        if (this.recent.length > 0) {
            recentSection.style.display = 'block';
            this.recent.forEach(g => recentGrid.appendChild(this.createCard(g)));
        } else {
            recentSection.style.display = 'none';
        }
    },

    getGradient(name) {
        const colors = [
            ['#f43f5e', '#e11d48'], ['#3b82f6', '#2563eb'], ['#10b981', '#059669'],
            ['#8b5cf6', '#7c3aed'], ['#f59e0b', '#d97706'], ['#ec4899', '#db2777'],
            ['#6366f1', '#4f46e5'], ['#14b8a6', '#0d9488']
        ];
        const index = name.length % colors.length;
        const [c1, c2] = colors[index];
        return `background: linear-gradient(135deg, ${c1}, ${c2}); display:flex; align-items:center; justify-content:center; width:100%; height:100%; color:rgba(255,255,255,0.8); font-size:2rem;`;
    },

    isLiked(game) { return this.liked.some(g => g.url === game.url); },

    toggleLike(game) {
        if (this.isLiked(game)) {
            this.liked = this.liked.filter(g => g.url !== game.url);
        } else {
            this.liked.push({ name: game.name, url: game.url, img: game.img, type: game.type });
        }
        localStorage.setItem('liked_games', JSON.stringify(this.liked));
    },

    setupListeners() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            let timer;
            searchInput.oninput = (e) => {
                clearTimeout(timer);
                timer = setTimeout(() => this.performSearch(e.target.value.toLowerCase().trim()), 300);
            };
        }
        const libSelect = document.getElementById('lib-select');
        if (libSelect) {
            libSelect.value = this.lib;
            libSelect.onchange = (e) => {
                const newLib = e.target.value;
                if (newLib === this.lib) return;

                // Just set the setting; the 'settings-changed' listener below handles the loadGames call
                window.Settings?.set('gameLibrary', newLib);
            };
        }
        window.addEventListener('settings-changed', (e) => {
            if (e.detail.gameLibrary && e.detail.gameLibrary !== this.lib) {
                this.lib = e.detail.gameLibrary;
                if (libSelect) libSelect.value = this.lib;
                this.loadGames();
            }
        });
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) sortSelect.onchange = (e) => this.sort(e.target.value);
    },

    performSearch(term) {
        this.filteredGames = term ? this.allGames.filter(g => g.name.toLowerCase().includes(term)) : [...this.allGames];
        this.applyLikedSort();
        this.resetRender();
    }
};

document.addEventListener('DOMContentLoaded', () => Games.init());
