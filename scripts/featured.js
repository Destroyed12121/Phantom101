<<<<<<< HEAD
const FeaturedGames = {
    games: [
        { name: 'Fortnite', icon: 'fa-solid fa-crosshairs', url: 'pages/player.html?type=game&title=Fortnite&url=https://nowgg.fun/apps/aptoide/5874/aptoide.html?deep_link=aptoidesearch://com.epicgames.fortnite' },
        { name: 'Games', icon: 'fa-solid fa-gamepad', url: 'pages/games.html' },
        { name: 'Movies', icon: 'fa-solid fa-film', url: 'pages/movies.html' },
        { name: 'PhantomAI', icon: 'fa-solid fa-robot', url: 'pages/chat.html' },
        { name: 'Music', icon: 'fa-solid fa-music', url: 'pages/music.html' },
        { name: 'Roblox', icon: 'fa-solid fa-cubes', url: 'pages/player.html?type=game&title=Roblox&url=https://nowgg.fun/apps/aptoide/5874/aptoide.html?deep_link=aptoidesearch://roblox.com.roblox' },
        { name: 'Settings', icon: 'fa-solid fa-cog', url: 'pages/settings.html' },
        { name: 'Retro Bowl', gameName: 'Retro Bowl' },
        { name: 'Geometry Dash', gameName: 'Geometry Dash Lite (REMAKE)' },
        { name: 'OvO', gameName: 'ovofixxed' },
        { name: 'Basket Random', gameName: 'Basket Random' },
        { name: 'Code Runner', icon: 'fa-solid fa-code', url: 'pages/code.html' }
    ],

    async load() {
        try {
            const data = await (await fetch("https://cdn.jsdelivr.net/gh/gn-math/assets@latest/zones.json")).json();
            const map = new Map(data.map(g => [
                (g.name || g.title).replace(/\.html$|-a\.html$/i, '').replace(/[-_]/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, l => l.toUpperCase()).trim(),
                (g.url || g.file)?.replace('{HTML_URL}', "https://cdn.jsdelivr.net/gh/gn-math/html@main").replace('-a.html', '.html')
            ]));

            const preloads = this.games.map(async g => {
                if (!g.gameName) return;
                const url = map.get(g.gameName);
                if (url) {
                    g.url = `pages/player.html?type=game&title=${encodeURIComponent(g.name)}&url=${encodeURIComponent(url)}`;
                    g.img = `https://cdn.jsdelivr.net/gh/gn-math/assets@latest/images/${g.gameName.toLowerCase().replace(/\s+/g, '-')}.png`;

                    // Trigger preload without blocking the map
                    const img = new Image();
                    img.src = g.img;
                } else {
                    g.url = 'pages/games.html'; g.icon = 'fa-solid fa-gamepad';
                }
            });
            await Promise.all(preloads);
        } catch (e) {
            console.error(e);
            this.games.forEach(g => g.gameName && (g.url = 'pages/games.html', g.icon = 'fa-solid fa-gamepad'));
        }
    }
};

window.FeaturedGames = FeaturedGames;
=======
const ZONES_URL = "https://cdn.jsdelivr.net/gh/gn-math/assets@latest/zones.json";
const HTML_PREFIX = "https://cdn.jsdelivr.net/gh/gn-math/html@main";

let featuredGames = [
    { name: 'Fortnite', icon: 'fa-solid fa-crosshairs', url: 'pages/player.html?type=game&title=Fortnite&url=..%2Fstaticsjv2%2Fembed.html%23https%3A%2F%2Fnowgg.fun%2Fapps%2Fepic-games%2F5349%2Ffortnite.html' },
    { name: 'All Games', icon: 'fa-solid fa-gamepad', url: 'pages/games.html' },
    { name: 'Movies', icon: 'fa-solid fa-film', url: 'pages/movies.html' },
    { name: 'PhantomAI', icon: 'fa-solid fa-robot', url: 'pages/chat.html' },
    { name: 'Music', icon: 'fa-solid fa-music', url: 'pages/music.html' },
    { name: 'Roblox', icon: 'fa-solid fa-cubes', url: 'pages/player.html?type=game&title=Roblox&url=..%2Fstaticsjv2%2Fembed.html%23https%3A%2F%2Fnowgg.fun%2Fapps%2Froblox-corporation%2F5349%2Froblox.html' },
    { name: 'Settings', icon: 'fa-solid fa-cog', url: 'pages/settings.html' },
    { name: 'Subway Surfers', img: 'i gotta simplify this code someday', gameName: 'Subway Surfers' },
    { name: 'Retro Bowl', img: 'i gotta simplify this code someday', gameName: 'Retro Bowl' },
    { name: 'Basket Random', img: 'i gotta simplify this code someday', gameName: 'Basket Random' },,
    { name: 'Geometry Dash', img: 'i gotta simplify this code someday', gameName: 'Geometry Dash Lite' },
    { name: 'Code Runner', icon: 'fa-solid fa-code', url: 'pages/code.html' },


];

async function loadFeaturedGames() {
    try {
        const res = await fetch(ZONES_URL);
        const data = await res.json();

        const gamesMap = new Map();
        data.forEach(g => {
            let name = g.name || g.title;
            if (name.endsWith('-a.html')) name = name.replace('-a.html', '');

            let url = g.url || g.file;
            if (url) {
                url = url.replace('{HTML_URL}', HTML_PREFIX);
                if (url.endsWith('-a.html')) {
                    url = url.replace('-a.html', '.html');
                }
            }

            // Format name like in games.js
            const formattedName = name
                .replace(/\.html$/i, '')
                .replace(/[-_]/g, ' ')
                .replace(/([a-z])([A-Z])/g, '$1 $2')
                .replace(/\(\d+\)$/, '')
                .replace(/\b\w/g, l => l.toUpperCase())
                .trim();

            gamesMap.set(formattedName, url);
        });

        // Update featured games with URLs
        featuredGames.forEach(game => {
            if (game.gameName) {
                const gameUrl = gamesMap.get(game.gameName);
                if (gameUrl) {
                    game.url = `pages/player.html?type=game&title=${encodeURIComponent(game.name)}&url=${encodeURIComponent(gameUrl)}`;
                } else {
                    // Fallback to games.html
                    game.url = `pages/games.html?game=${game.name.toLowerCase().replace(/ /g, '')}`;
                }
            }
        });
    } catch (e) {
        console.error("Failed to load featured games:", e);
        // Fallback URLs
        featuredGames.forEach(game => {
            if (game.gameName && !game.url) {
                game.url = `pages/games.html?game=${game.name.toLowerCase().replace(/ /g, '')}`;
            }
        });
    }
}

// Expose to global
window.FeaturedGames = {
    games: featuredGames,
    load: loadFeaturedGames
};
>>>>>>> b354220fb359bebcfd34b81e8e9fc8a9219a9bac
