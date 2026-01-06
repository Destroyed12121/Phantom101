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
    domainsLoaded: false,

    // Static configuration
    pages: [
        { name: 'Games', url: 'pages/games.html', icon: 'fa-gamepad', type: 'page' },
        { name: 'Movies & TV', url: 'pages/movies.html', icon: 'fa-film', type: 'page' },
        { name: 'AI Chatbot', url: 'pages/chatbot.html', icon: 'fa-robot', type: 'page' },
        { name: 'Code Editor', url: 'pages/code.html', icon: 'fa-code', type: 'page' },
        { name: 'Music', url: 'pages/music.html', icon: 'fa-music', type: 'page' },
        { name: 'Settings', url: 'pages/settings.html', icon: 'fa-gear', type: 'page' }
    ],

    popularMovies: [
        { name: 'Avengers: Endgame', id: 299534 },
        { name: 'Spider-Man: No Way Home', id: 634649 },
        { name: 'The Dark Knight', id: 155 },
        { name: 'Fnaf', id: 950779 },
        { name: 'Interstellar', id: 157336 },
        { name: 'Breaking Bad', id: 1396 },
        { name: 'Stranger Things', id: 66732 }
    ],

    popularDomains: [
        { domain: 'google.com', name: 'Google' },
        { domain: 'youtube.com', name: 'YouTube' },
        { domain: 'tiktok.com', name: 'TikTok' },
        { domain: 'imdb.com', name: 'IMDB' },
        { domain: 'x.com', name: 'X' },
        { domain: 'fandom.com', name: 'Fandom' },
        { domain: 'instagram.com', name: 'Instagram' },
        { domain: 'discord.com', name: 'Discord' },
        { domain: 'spotify.com', name: 'Spotify' },
        { domain: 'twitch.tv', name: 'Twitch' },
        { domain: 'netflix.com', name: 'Netflix' },
        { domain: 'facebook.com', name: 'Facebook' },
        { domain: 'reddit.com', name: 'Reddit' },
        { domain: 'wikipedia.org', name: 'Wikipedia' },
        { domain: 'amazon.com', name: 'Amazon' },
        { domain: 'github.com', name: 'GitHub' },
        { domain: 'stackoverflow.com', name: 'Stack Overflow' },
        { domain: 'linkedin.com', name: 'LinkedIn' },
        { domain: 'pinterest.com', name: 'Pinterest' },
        { domain: 'steampowered.com', name: 'Steam' },
        { domain: 'zoom.us', name: 'Zoom' },
        { domain: 'paypal.com', name: 'PayPal' }
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
     * Load games from sources
     */
    async loadGames() {
        if (this.gamesLoaded) return;

        try {
            // Load from FeaturedGames
            if (window.FeaturedGames?.games) {
                window.FeaturedGames.games.forEach(g => {
                    if (g.name && g.url) {
                        this.addGame(g.name, g.url, g.img);
                    }
                });
            }

            // Load from zones.json CDN
            const res = await fetch("https://cdn.jsdelivr.net/gh/gn-math/assets@latest/zones.json");
            const data = await res.json();

            data.forEach(g => {
                const name = (g.name || g.title).replace('-a.html', '');
                const url = (g.url || g.file)?.replace('{HTML_URL}', "https://cdn.jsdelivr.net/gh/gn-math/html@main");
                if (name && url) this.addGame(name, url);
            });

            // Load UGS files
            if (window.UGS_FILES) {
                const prefix = "https://cdn.jsdelivr.net/gh/bubbls/ugs-singlefile/UGS-Files/";
                window.UGS_FILES.forEach(file => {
                    const name = file.replace(/^cl/i, '');
                    const url = `${prefix}${encodeURIComponent(file.includes('.') ? file : file + '.html')}`;
                    this.addGame(name, url);
                });
            }

            this.gamesLoaded = true;
        } catch (e) {
            console.warn('PhantomSearch: Failed to load games', e);
        }
    },

    addGame(name, url, img) {
        const formattedName = this.formatName(name);
        const exists = this.allGames.some(g => g.name.toLowerCase() === formattedName.toLowerCase());
        
        if (!exists) {
            this.allGames.push({
                name: formattedName,
                url: `pages/player.html?type=game&title=${encodeURIComponent(formattedName)}&url=${encodeURIComponent(url)}`,
                img: img,
                type: 'game'
            });
        }
    },

    /**
     * Load domains
     */
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

    search(query) {
        const q = query.toLowerCase();
        const MAX_RESULTS = 7;
        const results = [];

        // Add matching games (max 4)
        this.allGames
            .filter(g => g.name.toLowerCase().includes(q))
            .slice(0, 4)
            .forEach(g => results.push(g));

        // Add matching pages (max 2)
        this.pages
            .filter(p => p.name.toLowerCase().includes(q))
            .slice(0, 2)
            .forEach(p => results.push(p));

        // Add matching movies (max 2)
        this.popularMovies
            .filter(movie => movie.name.toLowerCase().includes(q))
            .slice(0, 2)
            .forEach(movie => results.push({
                name: movie.name,
                url: `pages/player.html?type=movie&id=${movie.id}&title=${encodeURIComponent(movie.name)}`,
                type: 'movie'
            }));

        // Add matching domains (max 3)
        this.popularDomains
            .filter(d => d.domain.includes(q) || d.name.toLowerCase().includes(q))
            .slice(0, 3)
            .forEach(d => results.push({
                name: d.name,
                domain: d.domain,
                type: 'domain',
                icon: 'fa-globe',
                url: `staticsjv2/index.html#https://${d.domain}`,
                displayName: d.name
            }));

        // Add web search option
        results.push({
            name: `Search web for "${query}"`,
            query: query,
            type: 'web',
            icon: 'fa-globe'
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
            const icons = {
                game: 'fa-gamepad',
                page: item.icon,
                movie: 'fa-film',
                domain: 'fa-globe',
                web: 'fa-globe'
            };
            
            const labels = {
                game: 'Game',
                page: 'Page',
                movie: 'Movie',
                domain: 'Website',
                web: 'Web'
            };

            return `
                <div class="search-autocomplete-item${index === this.selectedIndex ? ' selected' : ''}"
                     data-index="${index}" role="option" aria-selected="${index === this.selectedIndex}">
                    <span class="search-autocomplete-icon"><i class="fa-solid ${icons[item.type]}"></i></span>
                    <span class="search-autocomplete-text">${this.escapeHtml(item.displayName || item.name)}</span>
                    <span class="search-autocomplete-type">${labels[item.type]}</span>
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
        const isDomain = query.includes('.') && !query.includes(' ');
        const url = isDomain ?
            (query.startsWith('http') ? query : 'https://' + query) :
            'https://search.brave.com/search?q=' + encodeURIComponent(query);
            
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
