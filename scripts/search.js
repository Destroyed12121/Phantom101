const PhantomSearch = {
    inputEl: null,
    dropdownEl: null,
    suggestions: [],
    selectedIndex: 0,
    isOpen: false,
    allGames: [],
    rootPrefix: '',
    searchTimeout: null,
    movieCache: {},

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

    popularDomains: [
        { domain: 'google.com', name: 'Google' }, { domain: 'youtube.com', name: 'YouTube' },
        { domain: 'tiktok.com', name: 'TikTok' }, { domain: 'chatgpt.com', name: 'ChatGPT' },
        { domain: 'roblox.com', name: 'Roblox', isGame: true }, { domain: 'discord.com', name: 'Discord' },
        { domain: 'spotify.com', name: 'Spotify' }, { domain: 'twitch.tv', name: 'Twitch' },
        { domain: 'poki.com', name: 'Poki' }, { domain: 'crazygames.com', name: 'CrazyGames' },
        { domain: 'coolmathgames.com', name: 'CoolMathGames' }, { domain: 'chess.com', name: 'Chess.com' },
        { domain: 'geoguessr.com', name: 'GeoGuessr' }, { domain: 'amazon.com', name: 'Amazon' },
        { domain: 'github.com', name: 'GitHub' }, { domain: 'x.com', name: 'X (Twitter)' },
        { domain: 'instagram.com', name: 'Instagram' }, { domain: 'wikipedia.org', name: 'Wikipedia' }
    ],

    async init(inputId) {
        this.inputEl = document.getElementById(inputId);
        if (!this.inputEl) return;

        const script = document.currentScript || Array.from(document.querySelectorAll('script')).find(s => s.src.includes('scripts/search.js'));
        if (script && script.src.includes('scripts/search.js')) {
            this.rootPrefix = script.src.split('scripts/search.js')[0];
        }

        this.createDropdown();
        this.inputEl.addEventListener('input', (e) => this.onInput(e));
        this.inputEl.addEventListener('keydown', (e) => this.onKeydown(e));
        this.inputEl.addEventListener('focus', () => this.onFocus());
        document.addEventListener('click', (e) => this.onClickOutside(e));

        // Use Gloader for data
        if (window.Gloader) {
            this.allGames = await window.Gloader.load();
        } else {
            console.warn('Gloader not found');
        }
    },

    createDropdown() {
        this.dropdownEl = document.createElement('div');
        this.dropdownEl.className = 'search-autocomplete';
        this.dropdownEl.role = 'listbox';
        const container = this.inputEl.closest('.search-container') || this.inputEl.parentElement;
        container.style.position = 'relative';
        container.appendChild(this.dropdownEl);
    },

    onInput(e) {
        const query = e.target.value.trim();
        if (!query) { this.hide(); return; }
        this.search(query);
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            if (query.length >= 2) this.fetchExternalResults(query);
        }, 300);
    },

    onFocus() {
        if (this.inputEl.value.trim().length > 0 && this.suggestions.length > 0) this.show();
    },

    onKeydown(e) {
        if (!this.isOpen) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.selectedIndex = Math.min(this.selectedIndex + 1, this.suggestions.length - 1);
            this.updateSelection();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
            this.updateSelection();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (this.suggestions.length) this.selectItem(this.suggestions[this.selectedIndex]);
        } else if (e.key === 'Escape') this.hide();
    },

    onClickOutside(e) {
        if (!this.dropdownEl.contains(e.target) && e.target !== this.inputEl) this.hide();
    },

    fuzzyMatch(query, text) {
        const q = query.toLowerCase();
        const t = text.toLowerCase();
        if (t === q) return 1000;
        if (t.startsWith(q)) return 500 - t.length;
        if (t.includes(q)) return 200 - t.length;

        // subsequence match
        let nIdx = 0;
        let hIdx = 0;
        let score = 0;
        while (nIdx < q.length && hIdx < t.length) {
            if (q[nIdx] === t[hIdx]) {
                nIdx++;
                score += 10;
            } else {
                score -= 1;
            }
            hIdx++;
        }
        if (nIdx === q.length) return score;
        return -1;
    },

    search(query, externalResults = null) {
        const q = query.toLowerCase();
        const results = [];
        const seen = new Set();

        const add = (item, score = 0) => {
            if (seen.has(item.name)) {
                // update score if better?
                const existing = results.find(r => r.name === item.name);
                if (existing && score > existing.score) existing.score = score;
                return;
            }
            seen.add(item.name);
            results.push({ ...item, score });
        };

        // games n pages get first dibs
        this.allGames.forEach(g => {
            const nameScore = this.fuzzyMatch(q, g.name);
            const normScore = g.normalized ? this.fuzzyMatch(q, g.normalized) : -1;
            const score = Math.max(nameScore, normScore);

            if (score > 0) {
                const normalized = g.normalized || g.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                const finalUrl = `${this.rootPrefix}pages/games.html?gamename=${normalized}`;
                // gnmath is usually better than ugs
                const sourceBonus = g.source === 'gnmath' ? 50 : 0;
                add({ ...g, url: finalUrl, type: 'game' }, score + sourceBonus);
            }
        });

        this.pages.forEach(p => {
            const nameScore = this.fuzzyMatch(q, p.name);
            let keywordScore = -1;
            if (p.keywords) {
                p.keywords.forEach(k => {
                    keywordScore = Math.max(keywordScore, this.fuzzyMatch(q, k));
                });
            }
            const score = Math.max(nameScore, keywordScore);
            if (score > 0) {
                add({ ...p, url: this.rootPrefix + p.url }, score);
            }
        });

        // give tv shows a little nudge
        if (externalResults) {
            const tv = externalResults.find(m => m.media_type === 'tv');
            if (tv) {
                add({
                    name: tv.name,
                    id: tv.id,
                    overview: tv.overview,
                    media_type: 'tv',
                    type: 'tv',
                    img: tv.poster_path ? 'https://image.tmdb.org/t/p/w92' + tv.poster_path : null,
                    url: `${this.rootPrefix}pages/player.html?type=tv&id=${tv.id}&title=${encodeURIComponent(tv.name)}`
                }, 400); // TVs get a decent fixed score if they match TMDB
            }
        }

        // handy domains
        this.popularDomains.forEach(d => {
            const domainScore = this.fuzzyMatch(q, d.domain);
            const nameScore = this.fuzzyMatch(q, d.name);
            const score = Math.max(domainScore, nameScore);
            if (score > 0) {
                add({
                    name: d.name, type: 'domain', icon: 'fa-globe',
                    url: d.url || `${this.rootPrefix}staticsjv2/index.html#${encodeURIComponent('https://' + d.domain)}`
                }, score);
            }
        });

        // add a few movies if we have space
        if (externalResults) {
            externalResults
                .filter(m => m.media_type !== 'tv')
                .slice(0, 2)
                .forEach(m => {
                    add({
                        name: m.title || m.name,
                        id: m.id,
                        overview: m.overview,
                        media_type: 'movie',
                        type: 'movie',
                        img: m.poster_path ? 'https://image.tmdb.org/t/p/w92' + m.poster_path : null,
                        url: `${this.rootPrefix}pages/player.html?type=movie&id=${m.id}&title=${encodeURIComponent(m.title || m.name)}`
                    }, 300);
                });
        }

        results.sort((a, b) => b.score - a.score);

        const MAX_TOTAL = 6;
        let finalSuggestions = results.slice(0, MAX_TOTAL);

        finalSuggestions.push({
            name: `Search the web for "${query}"`,
            query: query,
            type: 'web',
            icon: 'fa-search'
        });

        this.suggestions = finalSuggestions;
        this.render();
        this.show();
    },

    async fetchExternalResults(query) {
        if (this.movieCache[query]) {
            this.search(query, this.movieCache[query]);
            return;
        }

        const API_KEY = window.API_KEY || '2713804610e1e236b1cf44bfac3a7776';
        try {
            const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}&include_adult=false`);
            const data = await res.json();
            const valid = data.results.filter(r => (r.media_type === 'movie' || r.media_type === 'tv') && r.poster_path);
            this.movieCache[query] = valid;
            this.search(query, valid);
        } catch (e) {
            console.warn('External search failed', e);
        }
    },

    render() {
        if (!this.suggestions.length) { this.dropdownEl.innerHTML = ''; return; }
        const labels = { game: 'Game', page: 'Page', movie: 'Movie', tv: 'TV Show', domain: 'Website', web: 'Search' };

        this.dropdownEl.innerHTML = this.suggestions.map((item, i) => {
            const icon = item.img ?
                `<img src="${item.img}" class="search-autocomplete-thumb" alt="">` :
                `<i class="fa-solid ${item.icon || 'fa-gamepad'}"></i>`;

            return `
                <div class="search-autocomplete-item${i === this.selectedIndex ? ' selected' : ''}" data-index="${i}">
                    <span class="search-autocomplete-icon">${icon}</span>
                    <span class="search-autocomplete-text">${this.escapeHtml(item.name)}</span>
                    <span class="search-autocomplete-type">${labels[item.type] || 'Result'}</span>
                </div>`;
        }).join('');

        this.dropdownEl.querySelectorAll('.search-autocomplete-item').forEach((el, i) => {
            el.onclick = () => this.selectItem(this.suggestions[i]);
            el.onmouseenter = () => { this.selectedIndex = i; this.updateSelection(); };
        });
    },

    updateSelection() {
        this.dropdownEl.querySelectorAll('.search-autocomplete-item').forEach((el, i) =>
            el.classList.toggle('selected', i === this.selectedIndex));
    },

    selectItem(item) {
        this.hide();
        if (item.type === 'web') {
            const query = item.query;
            const isUrl = query.includes('.') && !query.includes(' ');
            let url;
            if (isUrl) {
                url = query.startsWith('http') ? query : 'https://' + query;
            } else {
                const engine = window.Settings?.get('searchEngine') || "https://www.bing.com/search?q=";
                url = engine + encodeURIComponent(query);
            }
            window.location.href = this.rootPrefix + 'staticsjv2/index.html#' + encodeURIComponent(url);
        } else if (item.url) {
            if (item.type === 'movie' || item.type === 'tv') {
                const mediaData = {
                    id: item.id, title: item.name, overview: item.overview,
                    media_type: item.media_type
                };
                sessionStorage.setItem('currentMovie', JSON.stringify(mediaData));
                if (item.type === 'tv' && !item.url.includes('season=')) item.url += '&season=1&episode=1';
            }
            window.location.href = item.url;
        }
    },

    show() { this.isOpen = true; this.dropdownEl.classList.add('open'); },
    hide() { this.isOpen = false; this.selectedIndex = 0; this.dropdownEl.classList.remove('open'); },
    escapeHtml(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
};

function handleSearch(e) {
    if (e) e.preventDefault();
    const input = document.getElementById('search-input');
    if (!input) return;
    const query = input.value.trim();
    if (!query) return;

    // Check if it's a URL
    const isUrl = query.includes('.') && !query.includes(' ');
    let finalUrl;
    if (isUrl) {
        finalUrl = query.startsWith('http') ? query : 'https://' + query;
    } else {
        const engine = window.Settings?.get('searchEngine') || "https://www.bing.com/search?q=";
        finalUrl = engine + encodeURIComponent(query);
    }
    
    const prefix = window.PhantomSearch?.rootPrefix || '';
    window.location.href = prefix + 'staticsjv2/index.html#' + encodeURIComponent(finalUrl);
}

window.handleSearch = handleSearch;

document.addEventListener('DOMContentLoaded', () => PhantomSearch.init('search-input'));
window.PhantomSearch = PhantomSearch;
