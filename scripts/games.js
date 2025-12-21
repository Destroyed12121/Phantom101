const ZONES_1_URL = "https://cdn.jsdelivr.net/gh/gn-math/assets@latest/zones.json";
const HTML_PREFIX_1 = "https://cdn.jsdelivr.net/gh/gn-math/html@main";
const COVER_PREFIX_1 = "https://cdn.jsdelivr.net/gh/gn-math/covers@main";
const UGS_PREFIX = "https://cdn.jsdelivr.net/gh/bubbls/ugs-singlefile/UGS-Files/";

const Games = {
    lib: 'gnmath', // 'gnmath' or 'ugs'
    allGames: [], // Complete list of loaded games
    filteredGames: [], // Currently filtered list (search results)
    renderedCount: 0, // Number of games currently in the DOM
    BATCH_SIZE: 50, // Number of games to render at once
    liked: JSON.parse(localStorage.getItem('liked_games') || '[]'),
    isLoading: false,

    async init() {
        // Load settings preference
        const settings = JSON.parse(localStorage.getItem('void_settings') || '{}');
        this.lib = settings.gameLibrary || 'multi';

        // Normalize legacy values
        if (this.lib === 'lib1') this.lib = 'gnmath';
        if (this.lib === 'lib2') this.lib = 'ugs';

        // Setup scroll listener for lazy loading
        window.addEventListener('scroll', () => {
            if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
                this.renderMore();
            }
        });

        await this.loadGames();
        this.setupListeners();
    },

    async loadGames() {
        if (window.Notify) window.Notify.info('Games', 'Loading game library...');
        this.isLoading = true;

        this.allGames = [];
        try {
            if (this.lib === 'multi') {
                const gnmath = await this.loadGnmath();
                const ugs = await this.loadUGS();
                this.allGames = [...gnmath, ...ugs];
            } else if (this.lib === 'gnmath') {
                this.allGames = await this.loadGnmath();
            } else if (this.lib === 'ugs') {
                this.allGames = await this.loadUGS();
            }
        } catch (e) {
            console.error(e);
            if (window.Notify) window.Notify.error('Error', 'Failed to load games');
        }

        // Initial render
        this.filteredGames = [...this.allGames];
        this.resetRender();

        if (window.Notify) window.Notify.success('Games', `${this.allGames.length} games loaded`);
        this.isLoading = false;
    },

    async loadGnmath() {
        try {
            const res = await fetch(ZONES_1_URL);
            const data = await res.json();

            return data.map(g => {
                let name = g.name || g.title;
                if (name.endsWith('-a.html')) name = name.replace('-a.html', '');

                let url = g.url || g.file;
                if (url) {
                    url = url.replace('{HTML_URL}', HTML_PREFIX_1);
                    if (url.endsWith('-a.html')) {
                        url = url.replace('-a.html', '.html');
                    }
                }

                let img = g.cover || g.img || g.image;
                if (img) {
                    img = img.replace('{COVER_URL}', COVER_PREFIX_1);
                }

                return {
                    name: this.formatName(name),
                    originalName: name,
                    url: url,
                    img: img,
                    type: 'gnmath'
                };
            });
        } catch (e) {
            console.error("Failed to load Gnmath:", e);
            throw e;
        }
    },

    async loadUGS() {
        // Use the global window.UGS_FILES array from components/UGSfiles.js
        const files = window.UGS_FILES || [];

        return files.map(file => {
            // Remove 'cl' prefix if present
            let name = file;
            if (name.toLowerCase().startsWith('cl')) {
                name = name.substring(2);
            }

            // Format URL
            let fileName = file;
            if (!fileName.includes('.')) fileName += '.html';
            const url = `${UGS_PREFIX}${encodeURIComponent(fileName)}`;

            return {
                name: this.formatName(name), // Prettify
                originalName: file,
                url: url,
                img: null, // No images for UGS
                type: 'ugs'
            };
        });
    },

    formatName(name) {
        // Advanced formatting
        return name
            // Remove file extensions if somehow present in name
            .replace(/\.html$/i, '')
            // Replace hyphens, underscores with spaces
            .replace(/[-_]/g, ' ')
            // Insert space before capital letters (camelCase -> camel Case)
            // But verify it's not all caps commonly (e.g. FNAF)
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            // Remove common junk suffixes/prefixes specific to scraped lists
            .replace(/\(\d+\)$/, '') // Remove (1), (2) etc at end
            // Capitalize Words
            .replace(/\b\w/g, l => l.toUpperCase())
            .trim();
    },

    sort(method) {
        if (method === 'name') {
            this.filteredGames.sort((a, b) => a.name.localeCompare(b.name));
        } else if (method === 'newest') {
            // If original list was chronological (often is), reverse
            // Otherwise we don't have date. We'll reverse the current list.
            this.filteredGames.reverse();
        } else {
            // Popularity/Default - Shuffle or Reset to original order found in allGames
            // Actually, "Popularity" usually implies a specific order. 
            // Without metrics, we can't sort by popularity real-time.
            // We'll just shuffle for variety or keep original index order.
            // Let's reset to original order if it exists in allGames
            // This is tricky if filtered. Let's just do nothing or shuffle.
            // For consistency with typical expectations, let's just re-align with allGames order
            const orderMap = new Map(this.allGames.map((g, i) => [g.url, i]));
            this.filteredGames.sort((a, b) => (orderMap.get(a.url) || 0) - (orderMap.get(b.url) || 0));
        }
        this.resetRender();
    },

    resetRender() {
        const grid = document.getElementById('games-grid');
        const likedGrid = document.getElementById('liked-grid');
        const likedSection = document.getElementById('liked-section');
        const countDisplay = document.getElementById('game-count');

        if (!grid) return;

        grid.innerHTML = '';
        this.renderedCount = 0;

        // Handle Liked Games
        if (likedGrid && likedSection) {
            likedGrid.innerHTML = '';
            const likedGames = this.allGames.filter(g => this.isLiked(g));
            if (likedGames.length > 0) {
                likedSection.style.display = 'block';
                likedGames.forEach(g => likedGrid.appendChild(this.createCard(g)));
            } else {
                likedSection.style.display = 'none';
            }
        }

        if (countDisplay) {
            countDisplay.innerText = `${this.filteredGames.length} Games`;
        }

        this.renderMore();
    },

    renderMore() {
        if (this.renderedCount >= this.filteredGames.length) return;

        const grid = document.getElementById('games-grid');
        const fragment = document.createDocumentFragment();

        const nextBatch = this.filteredGames.slice(this.renderedCount, this.renderedCount + this.BATCH_SIZE);

        nextBatch.forEach(game => {
            fragment.appendChild(this.createCard(game));
        });

        grid.appendChild(fragment);
        this.renderedCount += nextBatch.length;
    },

    createCard(game) {
        const div = document.createElement('div');
        div.className = 'game-card';

        // Use a colorful gradient placeholder if no image

        const imgHTML = game.img
            ? `<img src="${game.img}" loading="lazy" alt="${game.name}" onerror="this.parentElement.innerHTML='<div style=\\'width:100%;height:100%;background:var(--surface-hover);display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:2rem;\\'><i class=\\'fa-solid fa-gamepad\\'></i></div>'">`
            : `<div style="width:100%;height:100%;background:var(--surface-hover);display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:2rem;"><i class="fa-solid fa-gamepad"></i></div>`;

        div.innerHTML = `
            <div class="game-img-wrapper">
                ${imgHTML}
                <button class="like-btn ${this.isLiked(game) ? 'active' : ''}"><i class="fa-solid fa-heart"></i></button>
            </div>
            <div class="game-info">
                <div class="game-title">${game.name}</div>
            </div>
        `;

        // Click
        const openFn = () => this.openGame(game);
        div.querySelector('.game-img-wrapper').onclick = openFn;
        div.querySelector('.game-info').onclick = openFn;

        // Like
        const likeBtn = div.querySelector('.like-btn');
        likeBtn.onclick = (e) => {
            e.stopPropagation();
            this.toggleLike(game);
            // Toggle UI immediately without full re-render
            const isLiked = this.isLiked(game);
            likeBtn.classList.toggle('active', isLiked);
            this.updateLikedSection();
        };

        return div;
    },

    updateLikedSection() {
        // Quick update for liked section without full reload
        const likedGrid = document.getElementById('liked-grid');
        const likedSection = document.getElementById('liked-section');
        if (!likedGrid || !likedSection) return;

        // For simplicity, just re-render liked section
        likedGrid.innerHTML = '';
        const likedGames = this.allGames.filter(g => this.isLiked(g));

        if (likedGames.length > 0) {
            likedSection.style.display = 'block';
            likedGames.forEach(g => likedGrid.appendChild(this.createCard(g)));
        } else {
            likedSection.style.display = 'none';
        }
    },

    openGame(game) {
        const url = `player.html?type=game&title=${encodeURIComponent(game.name)}&url=${encodeURIComponent(game.url)}`;
        window.location.href = url;
        if (window.Notify) window.Notify.success('Game Opened', `Playing ${game.name}`);
    },

    isLiked(game) {
        // Match by name + originalName to be safe (since URLs differ between libraries)
        return this.liked.some(g => g.name === game.name);
    },

    toggleLike(game) {
        if (this.isLiked(game)) {
            this.liked = this.liked.filter(g => g.name !== game.name);
        } else {
            this.liked.push({
                name: game.name,
                url: game.url,
                img: game.img,
                type: game.type
            }); // Store minimal data
        }
        localStorage.setItem('liked_games', JSON.stringify(this.liked));
    },

    setupListeners() {
        // Search with Debounce
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            let debounceTimer;
            searchInput.oninput = (e) => {
                const term = e.target.value.toLowerCase().trim();

                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    this.performSearch(term);
                }, 300); // 300ms debounce
            };
        }

        // Library Select
        const libSelect = document.getElementById('lib-select');
        if (libSelect) {
            // Re-populate options to include Multi
            libSelect.innerHTML = `
                <option value="multi">Multi (Default)</option>
                <option value="gnmath">Gnmath</option>
                <option value="ugs">UGS</option>
            `;
            libSelect.value = this.lib; // Set current selection

            libSelect.onchange = (e) => {
                this.lib = e.target.value;
                this.loadGames();
                // Update settings
                const s = JSON.parse(localStorage.getItem('void_settings') || '{}');
                s.gameLibrary = this.lib;
                localStorage.setItem('void_settings', JSON.stringify(s));
            };
        }

        // Sorting
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.onchange = (e) => this.sort(e.target.value);
        }
    },

    performSearch(term) {
        if (!term) {
            this.filteredGames = [...this.allGames];
        } else {
            this.filteredGames = this.allGames.filter(g =>
                g.name.toLowerCase().includes(term)
            );
        }
        this.resetRender();
    }
};

document.addEventListener('DOMContentLoaded', () => Games.init());
