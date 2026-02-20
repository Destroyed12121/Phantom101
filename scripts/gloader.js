const ZONES_1_URL = "https://cdn.jsdelivr.net/gh/gn-math/assets@latest/zones.json";
const HTML_PREFIX_1 = "https://cdn.jsdelivr.net/gh/gn-math/html@main";
const COVER_PREFIX_1 = "https://cdn.jsdelivr.net/gh/gn-math/covers@main";
const UGS_PREFIX = "https://cdn.jsdelivr.net/gh/bubbls/ugs-singlefile/UGS-Files/";

const Gloader = {
    CACHE_KEY: 'phantom_games_cache_v2',
    EXPIRY_MS: 7 * 24 * 60 * 60 * 1000,

    async load(lib = 'multi') {
        const cacheKey = `${this.CACHE_KEY}_${lib}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                const { timestamp, data } = JSON.parse(cached);
                if (Date.now() - timestamp < this.EXPIRY_MS && data.length > 0) {
                    return data;
                }
            } catch (e) {
                console.warn('Cache parse failed', e);
            }
        }

        const games = await this.fetchGames(lib);
        try {
            localStorage.setItem(cacheKey, JSON.stringify({
                timestamp: Date.now(),
                data: games
            }));
        } catch (e) {
            console.warn('Cache write failed (storage full?)', e);
        }
        return games;
    },

    async fetchGames(lib) {
        if (lib === 'lib1' || lib === 'gnmath') return this.loadGnmath();
        if (lib === 'lib2' || lib === 'ugs') return this.loadUGS();

        const [g, u] = await Promise.all([this.loadGnmath(), this.loadUGS()]);
        return [...g, ...u];
    },

    async loadGnmath() {
        try {
            const res = await fetch(ZONES_1_URL);
            const data = await res.json();
            return data.map(g => ({
                name: this.formatName((g.name || g.title).replace('-a.html', '')),
                url: (g.url || g.file)?.replace('{HTML_URL}', HTML_PREFIX_1).replace('-a.html', '.html'),
                img: (g.cover || g.img || g.image)?.replace('{COVER_URL}', COVER_PREFIX_1),
                type: 'gnmath',
                normalized: this.normalize(g.name || g.title)
            }));
        } catch (e) {
            console.error('Gnmath load failed', e);
            return [];
        }
    },

    async loadUGS() {
        if (!window.UGS_FILES && window.UGS_FILES_PROMISE) {
            await window.UGS_FILES_PROMISE;
        }
        if (!window.UGS_FILES) return [];
        return window.UGS_FILES.map(file => {
            const name = file.replace(/^cl/i, '');
            return {
                name: this.formatName(name),
                url: `${UGS_PREFIX}${encodeURIComponent(file.includes('.') ? file : file + '.html')}`,
                type: 'ugs',
                normalized: this.normalize(name)
            };
        });
    },

    formatName(name) {
        return name ? name.replace(/\.html$/i, '')
            .replace(/[-_]/g, ' ')
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/\(\d+\)$/, '')
            .replace(/\b\w/g, l => l.toUpperCase())
            .trim() : '';
    },

    normalize(name) {
        return name ? name.toLowerCase().replace(/[^a-z0-9]/g, '').trim() : '';
    }
};

window.Gloader = Gloader;
