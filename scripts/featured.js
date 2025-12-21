const ZONES_URL = "https://cdn.jsdelivr.net/gh/gn-math/assets@latest/zones.json";
const HTML_PREFIX = "https://cdn.jsdelivr.net/gh/gn-math/html@main";

let featuredGames = [
    { name: 'Fortnite', icon: 'fa-solid fa-crosshairs', url: 'pages/player.html?type=game&title=Fortnite&url=..%2Fstaticsjv2%2Fembed.html%23https%3A%2F%2Fnow.gg%2Fapps%2Fepic-games%2F5349%2Ffortnite.html' },
    { name: 'Roblox', icon: 'fa-solid fa-cubes', url: 'pages/player.html?type=game&title=Roblox&url=..%2Fstaticsjv2%2Fembed.html%23https%3A%2F%2Fnow.gg%2Fapps%2Froblox-corporation%2F5349%2Froblox.html' },
    { name: 'Movies', icon: 'fa-solid fa-film', url: 'pages/player.html?type=game&title=Movies&url=..%2Fstaticsjv2%2Fembed.html%23https%3A%2F%2Fprimeshows.live' },
    { name: 'Retro Bowl', img: 'https://cdn.jsdelivr.net/gh/gn-math/covers@main/retro-bowl.png', gameName: 'Retro Bowl' },
    { name: 'Slope', img: 'https://cdn.jsdelivr.net/gh/gn-math/covers@main/slope.png', gameName: 'Slope' },
    { name: 'Subway Surfers', img: 'https://cdn.jsdelivr.net/gh/gn-math/covers@main/subway-surfers.png', gameName: 'Subway Surfers' },
    { name: 'Run 3', img: 'https://cdn.jsdelivr.net/gh/gn-math/covers@main/run-3.png', gameName: 'Run 3' },
    { name: 'Basket Random', img: 'https://cdn.jsdelivr.net/gh/gn-math/covers@main/basket-random.png', gameName: 'Basket Random' },
    { name: 'Drift Hunters', img: 'https://cdn.jsdelivr.net/gh/gn-math/covers@main/drift-hunters.png', gameName: 'Drift Hunters' },
    { name: 'Moto X3M', img: 'https://cdn.jsdelivr.net/gh/gn-math/covers@main/moto-x3m.png', gameName: 'Moto X3M' },
    { name: 'Code Runner', icon: 'fa-solid fa-code', url: 'pages/code.html' },
    { name: 'All Games', icon: 'fa-solid fa-layer-group', url: 'pages/games.html' }
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