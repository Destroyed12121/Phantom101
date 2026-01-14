/**
 * PhantomSearch - Intelligent Autocomplete Module
 * Provides search suggestions for games, pages, and web search
 */

const PhantomSearch = {
    inputEl: null,
    dropdownEl: null,
    suggestions: [],
    selectedIndex: 0,
    isOpen: false,
    allGames: [],
    gamesLoaded: false,
    domainsLoaded: false,
    rootPrefix: '',

    // Caching and Debouncing
    searchTimeout: null,
    movieCache: {},
    lastQuery: '',

    // Static configuration
    pages: [
        { name: 'Games', url: 'pages/games.html', icon: 'fa-gamepad', type: 'page', keywords: ['all games', 'play games', 'unblocked games', 'game library'] },
        { name: 'Movies & TV', url: 'pages/movies.html', icon: 'fa-film', type: 'page', keywords: ['netflix', 'streaming', 'shows', 'tv', 'watch'] },
        { name: 'AI Chatbot', url: 'pages/chatbot.html', icon: 'fa-robot', type: 'page', keywords: ['chat', 'gpt', 'phantomai', 'bot', 'ai'] },
        { name: 'Code Editor', url: 'pages/code.html', icon: 'fa-code', type: 'page', keywords: ['coding', 'ide', 'editor', 'html', 'js', 'javascript'] },
        { name: 'Music', url: 'pages/music.html', icon: 'fa-music', type: 'page', keywords: ['songs', 'spotify', 'audio', 'beats', 'listen'] },
        { name: 'Settings', url: 'pages/settings.html', icon: 'fa-gear', type: 'page', keywords: ['preferences', 'cloak', 'panic', 'theme', 'options'] },
        { name: 'Disclaimer', url: 'pages/disclaimer.html', icon: 'fa-scale-balanced', type: 'page', keywords: ['legal', 'notice'] },
        { name: 'Terms of Service', url: 'pages/terms.html', icon: 'fa-file-contract', type: 'page', keywords: ['tos', 'rules'] }
    ],

    // Websites that also exist as games (priority goes to games)
    gameConflictDomains: ['roblox', 'minecraft', 'fortnite', 'chess', 'tetris', 'poki', 'crazygames', 'coolmathgames'],

    popularDomains: [
        { domain: 'google.com', name: 'Google' },
        { domain: 'youtube.com', name: 'YouTube' },
        { domain: 'tiktok.com', name: 'TikTok' },
        { domain: 'character.ai', name: 'Character.AI' },
        { domain: 'chatgpt.com', name: 'ChatGPT' },
        { domain: 'roblox.com', name: 'Roblox', isGame: true },
        { domain: 'discord.com', name: 'Discord' },
        { domain: 'spotify.com', name: 'Spotify' },
        { domain: 'twitch.tv', name: 'Twitch' },
        { domain: 'poki.com', name: 'Poki', isGame: true },
        { domain: 'crazygames.com', name: 'CrazyGames', isGame: true },
        { domain: 'coolmathgames.com', name: 'CoolMathGames', isGame: true },
        { domain: 'chess.com', name: 'Chess.com', isGame: true },
        { domain: 'geoguessr.com', name: 'GeoGuessr' },
        { domain: 'amazon.com', name: 'Amazon' },
        { domain: 'github.com', name: 'GitHub' },
        { domain: 'x.com', name: 'X (Twitter)' },
        { domain: 'instagram.com', name: 'Instagram' },
        { domain: 'wikipedia.org', name: 'Wikipedia' },
        { domain: 'steamcommunity.com', name: 'Steam' },
        { domain: 'facebook.com', name: 'Facebook' },
        { domain: 'snapchat.com', name: 'Snapchat' },
        { domain: 'tumblr.com', name: 'Tumblr' },
        { domain: 'pinterest.com', name: 'Pinterest' },
        { domain: 'linkedin.com', name: 'LinkedIn' },
        { domain: 'ebay.com', name: 'eBay' },
        { domain: 'soundcloud.com', name: 'SoundCloud' }
    ],

    /**
     * Initialize the search autocomplete
     * @param {string} inputId - ID of the search input element
     */
    init(inputId) {
        this.inputEl = document.getElementById(inputId);
        if (!this.inputEl) return;

        // Detect root prefix
        const script = document.currentScript || Array.from(document.querySelectorAll('script')).find(s => s.src.includes('scripts/search.js'));
        if (script) {
            const src = script.getAttribute('src');
            if (src && src.includes('scripts/search.js')) {
                this.rootPrefix = src.split('scripts/search.js')[0];
            }
        }

        // Create dropdown
        this.createDropdown();

        // Event listeners
        this.inputEl.addEventListener('input', (e) => this.onInput(e));
        this.inputEl.addEventListener('keydown', (e) => this.onKeydown(e));
        this.inputEl.addEventListener('focus', () => this.onFocus());
        document.addEventListener('click', (e) => this.onClickOutside(e));

        // Load games and domains in background
        this.loadGames();
        this.loadDomains();
    },

    /**
     * Create the dropdown element
     */
    createDropdown() {
        this.dropdownEl = document.createElement('div');
        this.dropdownEl.className = 'search-autocomplete';
        this.dropdownEl.setAttribute('role', 'listbox');
        this.dropdownEl.setAttribute('aria-label', 'Search suggestions');

        // Insert after search container
        const container = this.inputEl.closest('.search-container') || this.inputEl.parentElement;
        container.style.position = 'relative';
        container.appendChild(this.dropdownEl);
    },

    /**
     * Normalize a game name for deduplication
     */
    normalizeForDedup(name) {
        if (!name) return '';
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .trim();
    },

    /**
     * Load games from sources
     */
    async loadGames() {
        if (this.gamesLoaded) return;
        const seenNormalized = new Set();
        try {
            if (window.FeaturedGames?.games) {
                window.FeaturedGames.games.forEach(g => {
                    if (g.name && g.url) this.addGame(g.name, g.url, g.img, seenNormalized);
                });
            }
            const res = await fetch("https://cdn.jsdelivr.net/gh/gn-math/assets@latest/zones.json");
            const data = await res.json();
            data.forEach(g => {
                const name = (g.name || g.title).replace('-a.html', '');
                const url = (g.url || g.file)?.replace('{HTML_URL}', "https://cdn.jsdelivr.net/gh/gn-math/html@main");
                if (name && url) this.addGame(name, url, null, seenNormalized);
            });
            if (window.UGS_FILES) {
                const prefix = "https://cdn.jsdelivr.net/gh/bubbls/ugs-singlefile/UGS-Files/";
                window.UGS_FILES.forEach(file => {
                    const name = file.replace(/^cl/i, '');
                    const url = `${prefix}${encodeURIComponent(file.includes('.') ? file : file + '.html')}`;
                    this.addGame(name, url, null, seenNormalized);
                });
            }
            this.gamesLoaded = true;
        } catch (e) {
            console.warn('PhantomSearch: Failed to load games', e);
        }
    },

    addGame(name, url, img, seenNormalized = null) {
        const formattedName = this.formatName(name);
        const normalized = this.normalizeForDedup(formattedName);
        if (seenNormalized) {
            if (seenNormalized.has(normalized)) return;
            seenNormalized.add(normalized);
        } else {
            const exists = this.allGames.some(g => this.normalizeForDedup(g.name) === normalized);
            if (exists) return;
        }
        this.allGames.push({
            name: formattedName,
            url: `pages/player.html?type=game&title=${encodeURIComponent(formattedName)}&url=${encodeURIComponent(url)}`,
            img: img,
            type: 'game',
            normalized: normalized
        });
    },

    async loadDomains() {
        if (this.domainsLoaded) return;
        this.domainsLoaded = true;
    },

    formatName(name) {
        return name ? name
            .replace(/\.html$/i, '')
            .replace(/[-_]/g, ' ')
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/\(\d+\)$/, '')
            .replace(/\b\w/g, l => l.toUpperCase())
            .trim() : '';
    },

    onInput(e) {
        const query = e.target.value.trim();
        if (query.length === 0) {
            this.hide();
            return;
        }

        // Immediate local search
        this.search(query);

        // Debounced external search (movies)
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            if (query.length >= 2) {
                this.fetchExternalResults(query);
            }
        }, 300);
    },

    onFocus() {
        const query = this.inputEl.value.trim();
        if (query.length > 0 && this.suggestions.length > 0) {
            this.show();
        }
    },

    onKeydown(e) {
        if (!this.isOpen) return;
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, this.suggestions.length - 1);
                this.updateSelection();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
                this.updateSelection();
                break;
            case 'Enter':
                e.preventDefault();
                if (this.suggestions.length > 0) {
                    this.selectItem(this.suggestions[this.selectedIndex]);
                }
                break;
            case 'Escape':
                this.hide();
                break;
        }
    },

    onClickOutside(e) {
        if (!this.dropdownEl.contains(e.target) && e.target !== this.inputEl) {
            this.hide();
        }
    },

    /**
     * Smart search with deduplication and prioritization
     */
    search(query, externalResults = null) {
        const q = query.toLowerCase();
        const qNormalized = this.normalizeForDedup(query);
        const MAX_RESULTS = 7;
        const results = [];
        const addedIds = new Set(); // Using ID or URL for stronger uniqueness

        const addResult = (item) => {
            const id = item.url || item.id || item.name;
            if (addedIds.has(id)) return false;
            addedIds.add(id);
            results.push(item);
            return true;
        };

        const queryMatchesGameDomain = this.gameConflictDomains.some(d => q.includes(d));

        // 1. GAMES (High Priority)
        const scoredGames = this.allGames
            .map(g => {
                const nameLower = g.name.toLowerCase();
                let score = 0;
                if (nameLower === q) score = 100;
                else if (g.normalized === qNormalized) score = 95;
                else if (nameLower.startsWith(q)) score = 80;
                else if (g.normalized.startsWith(qNormalized)) score = 75;
                else if (nameLower.includes(q)) score = 50;
                else if (g.normalized.includes(qNormalized)) score = 45;
                return { ...g, score };
            })
            .filter(g => g.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 4);

        scoredGames.forEach(g => addResult({ ...g, url: this.rootPrefix + g.url }));

        // 2. PAGES
        this.pages
            .filter(p => p.name.toLowerCase().includes(q) || (p.keywords && p.keywords.some(k => k.includes(q))))
            .slice(0, 2)
            .forEach(p => addResult({ ...p, url: this.rootPrefix + p.url }));

        // 3. MOVIES (Combo of FEATURED and External)
        const movieResults = [];
        const IMG_URL = 'https://image.tmdb.org/t/p/w92'; // Small but clear

        // First, check FEATURED if available
        if (window.FEATURED) {
            window.FEATURED.filter(m => (m.title || m.name).toLowerCase().includes(q))
                .forEach(m => movieResults.push({
                    name: m.title || m.name,
                    url: `${this.rootPrefix}pages/player.html?type=${m.media_type || 'movie'}&id=${m.id}&title=${encodeURIComponent(m.title || m.name)}`,
                    type: 'movie',
                    score: 70,
                    img: m.poster_path ? IMG_URL + m.poster_path : null
                }));
        }

        // Add external results if provided
        if (externalResults) {
            externalResults.forEach(m => movieResults.push({
                name: m.title || m.name,
                url: `${this.rootPrefix}pages/player.html?type=${m.media_type || 'movie'}&id=${m.id}&title=${encodeURIComponent(m.title || m.name)}`,
                type: 'movie',
                score: 60,
                img: m.poster_path ? IMG_URL + m.poster_path : null
            }));
        }

        movieResults.sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .forEach(m => addResult(m));

        // 4. DOMAINS
        this.popularDomains
            .filter(d => {
                const matches = d.domain.includes(q) || d.name.toLowerCase().includes(q);
                if (!matches) return false;
                if (d.isGame && queryMatchesGameDomain && scoredGames.length > 0) return false;
                return true;
            })
            .slice(0, 2)
            .forEach(d => addResult({
                name: d.name,
                domain: d.domain,
                type: 'domain',
                icon: 'fa-globe',
                url: `${this.rootPrefix}staticsjv2/index.html#${encodeURIComponent('https://' + d.domain)}`,
                displayName: d.name
            }));

        // 5. Special keyword: "all games"
        if (q === "all games" || q === "play games") {
            addResult({ name: 'Browse all games', url: this.rootPrefix + 'pages/games.html', type: 'page', icon: 'fa-gamepad' });
        }

        // 6. Web search fallback
        results.push({
            name: `Search the web for "${query}"`,
            query: query,
            type: 'web',
            icon: 'fa-search'
        });

        this.suggestions = results.slice(0, MAX_RESULTS);
        this.render();
        this.show();
    },

    /**
     * Fetch external results with a cache
     */
    async fetchExternalResults(query) {
        if (this.movieCache[query]) {
            this.search(query, this.movieCache[query]);
            return;
        }

        const API_KEY = window.API_KEY || '2713804610e1e236b1cf44bfac3a7776';
        const url = `https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}&include_adult=false`;

        try {
            const res = await fetch(url);
            const data = await res.json();
            const movies = data.results.filter(r => (r.media_type === 'movie' || r.media_type === 'tv') && r.poster_path).slice(0, 5);

            this.movieCache[query] = movies;
            this.search(query, movies);
        } catch (e) {
            console.warn('PhantomSearch: External search failed', e);
        }
    },

    render() {
        if (this.suggestions.length === 0) {
            this.dropdownEl.innerHTML = '';
            return;
        }

        this.dropdownEl.innerHTML = this.suggestions.map((item, index) => {
            const icons = {
                game: 'fa-gamepad',
                page: item.icon || 'fa-link',
                movie: 'fa-film',
                domain: 'fa-globe',
                web: 'fa-search'
            };

            const labels = {
                game: 'Game',
                page: 'Page',
                movie: 'Movie',
                domain: 'Website',
                web: 'Search'
            };

            const iconHtml = item.img ?
                `<img src="${item.img}" class="search-autocomplete-thumb" alt="">` :
                `<i class="fa-solid ${icons[item.type]}"></i>`;

            return `
                <div class="search-autocomplete-item${index === this.selectedIndex ? ' selected' : ''}"
                     data-index="${index}" role="option" aria-selected="${index === this.selectedIndex}">
                    <span class="search-autocomplete-icon">${iconHtml}</span>
                    <span class="search-autocomplete-text">${this.escapeHtml(item.displayName || item.name)}</span>
                    <span class="search-autocomplete-type">${labels[item.type]}</span>
                </div>
            `;
        }).join('');

        this.dropdownEl.querySelectorAll('.search-autocomplete-item').forEach((el, index) => {
            el.addEventListener('click', () => this.selectItem(this.suggestions[index]));
            el.addEventListener('mouseenter', () => {
                this.selectedIndex = index;
                this.updateSelection();
            });
        });
    },

    updateSelection() {
        const items = this.dropdownEl.querySelectorAll('.search-autocomplete-item');
        items.forEach((el, i) => {
            el.classList.toggle('selected', i === this.selectedIndex);
            el.setAttribute('aria-selected', i === this.selectedIndex);
        });
    },

    selectItem(item) {
        this.hide();
        if (item.type === 'web') {
            this.doWebSearch(item.query);
        } else if (item.url) {
            window.location.href = item.url;
        }
    },

    doWebSearch(query) {
        const isDomain = query.includes('.') && !query.includes(' ');
        const url = isDomain ?
            (query.startsWith('http') ? query : 'https://' + query) :
            'https://search.brave.com/search?q=' + encodeURIComponent(query);

        window.location.href = this.rootPrefix + 'staticsjv2/index.html#' + encodeURIComponent(url);
    },

    show() {
        this.isOpen = true;
        this.dropdownEl.classList.add('open');
    },

    hide() {
        this.isOpen = false;
        this.selectedIndex = 0;
        this.dropdownEl.classList.remove('open');
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('search-input')) {
        PhantomSearch.init('search-input');
    }
});

window.PhantomSearch = PhantomSearch;
