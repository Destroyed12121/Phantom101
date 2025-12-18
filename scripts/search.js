/**
 * PhantomSearch - Intelligent Autocomplete Module
 * Provides search suggestions for games, pages, and web search
 */

const PhantomSearch = {
    inputEl: null,
    dropdownEl: null,
    suggestions: [],
    selectedIndex: -1,
    isOpen: false,
    allGames: [],
    gamesLoaded: false,

    // Static pages configuration
    pages: [
        { name: 'Games', url: 'pages/games.html', icon: 'fa-solid fa-gamepad', type: 'page' },
        { name: 'Movies & TV', url: 'pages/movies.html', icon: 'fa-solid fa-film', type: 'page' },
        { name: 'AI Chatbot', url: 'pages/chatbot.html', icon: 'fa-solid fa-robot', type: 'page' },
        { name: 'Code Editor', url: 'pages/code.html', icon: 'fa-solid fa-code', type: 'page' },
        { name: 'Music', url: 'pages/music.html', icon: 'fa-solid fa-music', type: 'page' },
        { name: 'Settings', url: 'pages/settings.html', icon: 'fa-solid fa-gear', type: 'page' }
    ],

    // Popular movies (hardcoded for quick suggestions)
    popularMovies: [
        { name: 'Avengers: Endgame', type: 'movie' },
        { name: 'Spider-Man: No Way Home', type: 'movie' },
        { name: 'The Dark Knight', type: 'movie' },
        { name: 'Fnaf', type: 'movie' },
        { name: 'Interstellar', type: 'movie' },
        { name: 'Breaking Bad', type: 'movie' },
        { name: 'Stranger Things', type: 'movie' }
    ],

    /**
     * Initialize the search autocomplete
     * @param {string} inputId - ID of the search input element
     */
    init(inputId) {
        this.inputEl = document.getElementById(inputId);
        if (!this.inputEl) return;

        // Create dropdown
        this.createDropdown();

        // Event listeners
        this.inputEl.addEventListener('input', (e) => this.onInput(e));
        this.inputEl.addEventListener('keydown', (e) => this.onKeydown(e));
        this.inputEl.addEventListener('focus', () => this.onFocus());
        document.addEventListener('click', (e) => this.onClickOutside(e));

        // Load games in background
        this.loadGames();
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
     * Load all games from sources
     */
    async loadGames() {
        if (this.gamesLoaded) return;

        try {
            // Load from FeaturedGames if available
            if (window.FeaturedGames?.games) {
                window.FeaturedGames.games.forEach(g => {
                    if (g.name && g.url) {
                        this.allGames.push({
                            name: g.name,
                            url: g.url,
                            img: g.img,
                            type: 'game'
                        });
                    }
                });
            }

            // Load from zones.json CDN
            const ZONES_URL = "https://cdn.jsdelivr.net/gh/gn-math/assets@latest/zones.json";
            const HTML_PREFIX = "https://cdn.jsdelivr.net/gh/gn-math/html@main";

            const res = await fetch(ZONES_URL);
            const data = await res.json();

            data.forEach(g => {
                let name = g.name || g.title;
                if (name?.endsWith('-a.html')) name = name.replace('-a.html', '');

                let url = g.url || g.file;
                if (url) {
                    url = url.replace('{HTML_URL}', HTML_PREFIX);
                    if (url.endsWith('-a.html')) {
                        url = url.replace('-a.html', '.html');
                    }
                }

                const formattedName = this.formatName(name);

                // Avoid duplicates
                if (!this.allGames.some(x => x.name.toLowerCase() === formattedName.toLowerCase())) {
                    this.allGames.push({
                        name: formattedName,
                        url: `pages/player.html?type=game&title=${encodeURIComponent(formattedName)}&url=${encodeURIComponent(url)}`,
                        type: 'game'
                    });
                }
            });

            // Load UGS files if available
            if (window.UGS_FILES) {
                const UGS_PREFIX = "../components/UGSfiles.js";
                window.UGS_FILES.forEach(file => {
                    let name = file;
                    if (name.toLowerCase().startsWith('cl')) {
                        name = name.substring(2);
                    }

                    let fileName = file;
                    if (!fileName.includes('.')) fileName += '.html';
                    const url = `${UGS_PREFIX}${encodeURIComponent(fileName)}`;

                    const formattedName = this.formatName(name);

                    // Avoid duplicates
                    if (!this.allGames.some(x => x.name.toLowerCase() === formattedName.toLowerCase())) {
                        this.allGames.push({
                            name: formattedName,
                            url: `pages/player.html?type=game&title=${encodeURIComponent(formattedName)}&url=${encodeURIComponent(url)}`,
                            type: 'game'
                        });
                    }
                });
            }

            this.gamesLoaded = true;
        } catch (e) {
            console.warn('PhantomSearch: Failed to load games', e);
        }
    },

    /**
     * Format game name to be human readable
     */
    formatName(name) {
        if (!name) return '';
        return name
            .replace(/\.html$/i, '')
            .replace(/[-_]/g, ' ')
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/\(\d+\)$/, '')
            .replace(/\b\w/g, l => l.toUpperCase())
            .trim();
    },

    /**
     * Handle input changes
     */
    onInput(e) {
        const query = e.target.value.trim();
        if (query.length === 0) {
            this.hide();
            return;
        }
        this.search(query);
    },

    /**
     * Handle focus event
     */
    onFocus() {
        const query = this.inputEl.value.trim();
        if (query.length > 0 && this.suggestions.length > 0) {
            this.show();
        }
    },

    /**
     * Handle keyboard navigation
     */
    onKeydown(e) {
        if (!this.isOpen) {
            if (e.key === 'Enter') {
                // No dropdown open, do default search
                return;
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, this.suggestions.length - 1);
                this.updateSelection();
                break;

            case 'ArrowUp':
                e.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
                this.updateSelection();
                break;

            case 'Enter':
                e.preventDefault();
                if (this.selectedIndex >= 0) {
                    this.selectItem(this.suggestions[this.selectedIndex]);
                } else if (this.suggestions.length > 0) {
                    // Select first item
                    this.selectItem(this.suggestions[0]);
                }
                break;

            case 'Escape':
                this.hide();
                break;
        }
    },

    /**
     * Handle click outside dropdown
     */
    onClickOutside(e) {
        if (!this.dropdownEl.contains(e.target) && e.target !== this.inputEl) {
            this.hide();
        }
    },

    /**
     * Search and generate suggestions
     */
    search(query) {
        const q = query.toLowerCase();
        const results = [];
        const MAX_RESULTS = 7;

        // Search games (priority)
        const gameMatches = this.allGames
            .filter(g => g.name.toLowerCase().includes(q))
            .slice(0, 4)
            .map(g => ({ ...g, matchScore: g.name.toLowerCase().startsWith(q) ? 2 : 1 }));

        // Sort by match score (prefix matches first)
        gameMatches.sort((a, b) => b.matchScore - a.matchScore);
        results.push(...gameMatches);

        // Search pages
        const pageMatches = this.pages
            .filter(p => p.name.toLowerCase().includes(q))
            .slice(0, 2);
        results.push(...pageMatches);

        // Search popular movies
        const movieMatches = this.popularMovies
            .filter(m => m.name.toLowerCase().includes(q))
            .slice(0, 2)
            .map(m => ({ ...m, url: `pages/movies.html?search=${encodeURIComponent(m.name)}` }));
        results.push(...movieMatches);

        // Always add web search as last option
        results.push({
            name: `Search web for "${query}"`,
            query: query,
            type: 'web',
            icon: 'fa-solid fa-globe'
        });

        this.suggestions = results.slice(0, MAX_RESULTS);
        this.selectedIndex = -1;
        this.render();
        this.show();
    },

    /**
     * Render the dropdown
     */
    render() {
        if (this.suggestions.length === 0) {
            this.dropdownEl.innerHTML = '';
            return;
        }

        this.dropdownEl.innerHTML = this.suggestions.map((item, index) => {
            let icon = '';
            let typeLabel = '';

            switch (item.type) {
                case 'game':
                    icon = '<i class="fa-solid fa-gamepad"></i>';
                    typeLabel = 'Game';
                    break;
                case 'page':
                    icon = `<i class="${item.icon}"></i>`;
                    typeLabel = 'Page';
                    break;
                case 'movie':
                    icon = '<i class="fa-solid fa-film"></i>';
                    typeLabel = 'Movie';
                    break;
                case 'web':
                    icon = '<i class="fa-solid fa-globe"></i>';
                    typeLabel = 'Web';
                    break;
            }

            return `
                <div class="search-autocomplete-item${index === this.selectedIndex ? ' selected' : ''}" 
                     data-index="${index}"
                     role="option"
                     aria-selected="${index === this.selectedIndex}">
                    <span class="search-autocomplete-icon">${icon}</span>
                    <span class="search-autocomplete-text">${this.escapeHtml(item.name)}</span>
                    <span class="search-autocomplete-type">${typeLabel}</span>
                </div>
            `;
        }).join('');

        // Add click handlers
        this.dropdownEl.querySelectorAll('.search-autocomplete-item').forEach((el, index) => {
            el.addEventListener('click', () => this.selectItem(this.suggestions[index]));
            el.addEventListener('mouseenter', () => {
                this.selectedIndex = index;
                this.updateSelection();
            });
        });
    },

    /**
     * Update visual selection
     */
    updateSelection() {
        const items = this.dropdownEl.querySelectorAll('.search-autocomplete-item');
        items.forEach((el, i) => {
            el.classList.toggle('selected', i === this.selectedIndex);
            el.setAttribute('aria-selected', i === this.selectedIndex);
        });
    },

    /**
     * Select an item and navigate
     */
    selectItem(item) {
        this.hide();

        if (item.type === 'web') {
            // Web search
            this.doWebSearch(item.query);
        } else if (item.url) {
            // Navigate to page/game
            window.location.href = item.url;
        }
    },

    /**
     * Perform web search
     */
    doWebSearch(query) {
        let url;
        if (query.includes('.') && !query.includes(' ')) {
            url = query.startsWith('http') ? query : 'https://' + query;
        } else {
            url = 'https://search.brave.com/search?q=' + encodeURIComponent(query);
        }
        window.location.href = 'staticsjv2/index.html#' + encodeURIComponent(url);
    },

    /**
     * Show dropdown
     */
    show() {
        this.isOpen = true;
        this.dropdownEl.classList.add('open');
    },

    /**
     * Hide dropdown
     */
    hide() {
        this.isOpen = false;
        this.selectedIndex = -1;
        this.dropdownEl.classList.remove('open');
    },

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize on the search input if it exists
    if (document.getElementById('search-input')) {
        PhantomSearch.init('search-input');
    }
});

// Expose globally
window.PhantomSearch = PhantomSearch;
