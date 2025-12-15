const API_KEY = '297f1c49bc6b75bc5ed06839e5bba2e6';
const IMG_BASE = 'https://image.tmdb.org/t/p/w300';

// Restore Static Featured List (Fallback for broken API)
const FEATURED = [
    { id: 693134, title: "Dune: Part Two", poster_path: "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg", release_date: "2024-02-27", vote_average: 8.3, media_type: "movie" },
    { id: 872585, title: "Oppenheimer", poster_path: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg", release_date: "2023-07-19", vote_average: 8.1, media_type: "movie" },
    { id: 569094, title: "Spider-Man: Across the Spider-Verse", poster_path: "/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg", release_date: "2023-05-31", vote_average: 8.4, media_type: "movie" },
    { id: 157336, title: "Interstellar", poster_path: "/gEU2QniL6C971PN62uvp2GMz5iH.jpg", release_date: "2014-11-05", vote_average: 8.4, media_type: "movie" },
    { id: 299534, title: "Avengers: Endgame", poster_path: "/or06FN3Dka5tukK1e9sl16pB3iy.jpg", release_date: "2019-04-24", vote_average: 8.3, media_type: "movie" },
    { id: 496243, title: "Parasite", poster_path: "/7IiTTgloJzvGI1TAYymC8urRhuB.jpg", release_date: "2019-05-30", vote_average: 8.5, media_type: "movie" },
    { id: 27205, title: "Inception", poster_path: "/oYuLEt3zVCKqJCZVPr6QqXV6An5.jpg", release_date: "2010-07-15", vote_average: 8.4, media_type: "movie" },
    { id: 155, title: "The Dark Knight", poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg", release_date: "2008-07-14", vote_average: 8.5, media_type: "movie" },
    { id: 634649, title: "Spider-Man: No Way Home", poster_path: "/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg", release_date: "2021-12-15", vote_average: 8.0, media_type: "movie" },
    { id: 763215, title: "Damsel", poster_path: "/sMp34cNKjIb18JkPriu42ShF7qO.jpg", release_date: "2024-03-08", vote_average: 7.2, media_type: "movie" },
    { id: 603, title: "The Matrix", poster_path: "/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg", release_date: "1999-03-30", vote_average: 8.2, media_type: "movie" },
    { id: 671, title: "Harry Potter and the Sorcerer's Stone", poster_path: "/wuMc08IPKEatf9rnMNXvIDxqP4W.jpg", release_date: "2001-11-16", vote_average: 7.9, media_type: "movie" }
];

let currentMedia = null;
let currentCategory = 'featured';
let currentTab = 'movies';
let currentGenreId = '';

const mediaGrid = document.getElementById('media-grid');
const searchInput = document.getElementById('search-input');
const suggestions = document.getElementById('suggestions');

// Init
document.addEventListener('DOMContentLoaded', () => {
    loadGenres();
    loadMedia();

    document.getElementById('movies-tab').onclick = () => switchTab('movies');
    document.getElementById('tv-tab').onclick = () => switchTab('tv');

    document.querySelectorAll('.category-pill').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.category-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            // Reset genre when clicking category
            const genreSelect = document.getElementById('genre-select');
            if (genreSelect) genreSelect.value = "";
            currentGenreId = "";
            currentCategory = btn.dataset.cat;
            loadMedia();
        };
    });

    // Genre select listener
    const genreSelect = document.getElementById('genre-select');
    if (genreSelect) {
        genreSelect.onchange = (e) => {
            currentGenreId = e.target.value;
            if (currentGenreId) {
                document.querySelectorAll('.category-pill').forEach(b => b.classList.remove('active'));
                currentCategory = 'genre';
            } else {
                // Default back to featured or popular if cleared
                document.querySelector('.category-pill[data-cat="featured"]').classList.add('active');
                currentCategory = 'featured';
            }
            loadMedia();
        };
    }

    // Search
    let searchTimeout;
    searchInput.oninput = () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(searchMedia, 300);
    };
    document.onclick = e => { if (!searchInput.parentElement.contains(e.target)) suggestions.classList.remove('show'); };
});

function switchTab(tab) {
    currentTab = tab;
    document.getElementById('movies-tab').classList.toggle('active', tab === 'movies');
    document.getElementById('tv-tab').classList.toggle('active', tab === 'tv');
    loadGenres();
    loadMedia();
}

async function loadGenres() {
    const type = currentTab === 'movies' ? 'movie' : 'tv';
    const select = document.getElementById('genre-select');
    if (!select) return;

    try {
        const res = await fetch(`https://api.themoviedb.org/3/genre/${type}/list?api_key=${API_KEY}`);
        const data = await res.json();
        select.innerHTML = '<option value="">All Genres</option>';
        data.genres.forEach(g => {
            const opt = document.createElement('option');
            opt.value = g.id;
            opt.textContent = g.name;
            select.appendChild(opt);
        });
    } catch (e) { console.error("Genre load failed", e); }
}

async function loadMedia() {
    mediaGrid.innerHTML = Array(12).fill('<div class="media-card"><div class="skeleton" style="width:100%;height:100%;"></div></div>').join('');

    try {
        // Handle Featured with Caching
        if (currentCategory === 'featured' && !currentGenreId) {
            const CACHE_KEY = 'phantom_featured_cache';
            const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 1 week

            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const { timestamp, data } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_DURATION) {
                    renderGrid(data);
                    return;
                }
            }

            // Fetch new data if no cache or expired
            // Expand library: Fetch Action (28) & Sci-Fi (878) movies
            const res1 = await fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=28,878&sort_by=popularity.desc&vote_count.gte=100&page=1`);
            const res2 = await fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=28,878&sort_by=popularity.desc&vote_count.gte=100&page=2`);

            const data1 = await res1.json();
            const data2 = await res2.json();

            // Combine fetched movies with static FEATURED list (prioritize static ones at top if desired, or mix)
            // Let's mix them: Static first, then API results, removing duplicates
            const allMovies = [...FEATURED];
            const seenIds = new Set(allMovies.map(m => m.id));

            [...(data1.results || []), ...(data2.results || [])].forEach(m => {
                if (!seenIds.has(m.id)) {
                    allMovies.push(m);
                    seenIds.add(m.id);
                }
            });

            // Cache 'allMovies'
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                timestamp: Date.now(),
                data: allMovies
            }));

            renderGrid(allMovies);
            return;
        }

        const type = currentTab === 'movies' ? 'movie' : 'tv';
        let url;

        if (currentGenreId) {
            // Discover by genre
            url = `https://api.themoviedb.org/3/discover/${type}?api_key=${API_KEY}&with_genres=${currentGenreId}&sort_by=popularity.desc&vote_count.gte=100`;
        } else {
            if (currentCategory === 'popular') {
                // Filter popular better
                url = `https://api.themoviedb.org/3/discover/${type}?api_key=${API_KEY}&sort_by=popularity.desc&vote_count.gte=500&vote_average.gte=5.5`;
            } else if (currentCategory === 'top_rated') {
                url = `https://api.themoviedb.org/3/${type}/top_rated?api_key=${API_KEY}&page=1`;
            } else if (currentCategory === 'now_playing' && type === 'movie') {
                url = `https://api.themoviedb.org/3/movie/now_playing?api_key=${API_KEY}&page=1`;
            } else if (currentCategory === 'upcoming' && type === 'movie') {
                url = `https://api.themoviedb.org/3/movie/upcoming?api_key=${API_KEY}&page=1`;
            } else {
                // Default fallback
                url = `https://api.themoviedb.org/3/${type}/popular?api_key=${API_KEY}&page=1`;
            }
        }

        const res = await fetch(url);
        if (!res.ok) throw new Error(`TMDB API Error: ${res.status}`);
        const data = await res.json();
        renderGrid(data.results);
    } catch (e) {
        console.error("Load media error:", e);
        // Fallback to static if everything fails
        if (currentCategory === 'featured' && !currentGenreId) {
            renderGrid(FEATURED);
            return;
        }
        mediaGrid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);"><p>Failed to load content.</p><p style="font-size:0.8rem;margin-top:8px;">Please check your connection or try again later.</p></div>';
        if (window.Notify) window.Notify.error("Error", "Failed to load movies from TMDB");
    }
}

function renderGrid(items) {
    mediaGrid.innerHTML = '';
    if (!items || !items.length) {
        mediaGrid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);">No results found</div>';
        return;
    }

    items.filter(m => m.poster_path).forEach(item => {
        const card = document.createElement('div');
        card.className = 'media-card';
        const title = item.title || item.name;
        const date = item.release_date || item.first_air_date;
        card.innerHTML = `
            <img src="${IMG_BASE}${item.poster_path}" alt="${title}">
            <div class="media-card-overlay">
                <div class="media-card-overview">${item.overview || ''}</div>
                <div class="media-card-info">
                    <div class="media-card-title">${title}</div>
                    <div class="media-card-meta">${date ? date.split('-')[0] : ''}</div>
                </div>
            </div>
            ${item.vote_average ? `<div class="media-card-rating">${item.vote_average.toFixed(1)}</div>` : ''}
        `;
        card.onclick = () => {
            if (currentTab === 'tv' && currentCategory !== 'featured') openSeasonExplorer(item);
            else if (item.media_type === 'tv') openSeasonExplorer(item);
            else playMedia(item, 'movie');
        };
        mediaGrid.appendChild(card);
    });
}

function playMedia(item, type) {
    // Navigate to player
    const title = item.title || item.name;
    let url = '';

    // Construct URL Params
    const params = new URLSearchParams();
    params.append('type', type);
    params.append('id', item.id);
    params.append('title', title);

    if (type === 'tv') {
        params.append('season', item.season || 1);
        params.append('episode', item.episode || 1);
    }

    // Store data for player
    try {
        sessionStorage.setItem('currentMovie', JSON.stringify(item));
    } catch (e) { }

    // Navigate to player
    window.location.href = `player.html?${params.toString()}`;
}

async function searchMedia() {
    const query = searchInput.value.trim();
    if (query.length < 2) { suggestions.classList.remove('show'); return; }

    try {
        const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
        const data = await res.json();

        suggestions.innerHTML = '';
        const results = data.results.filter(r => (r.media_type === 'movie' || r.media_type === 'tv') && r.poster_path).slice(0, 6);

        results.forEach(item => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.innerHTML = `
            <img src="${IMG_BASE}${item.poster_path}">
            <div class="suggestion-info">
                <div class="suggestion-title">${item.title || item.name}</div>
                <div class="suggestion-meta">${item.media_type.toUpperCase()} · ${(item.release_date || item.first_air_date || '').split('-')[0]}</div>
            </div>
        `;
            div.onclick = () => {
                suggestions.classList.remove('show');
                if (item.media_type === 'tv') openSeasonExplorer(item);
                else playMedia(item, 'movie');
            };
            suggestions.appendChild(div);
        });

        suggestions.classList.toggle('show', results.length > 0);
    } catch (e) { }
}

// Season Explorer
let currentShow = null;

async function openSeasonExplorer(show) {
    currentShow = show;
    document.getElementById('show-title').textContent = show.name;
    document.getElementById('seasons-list').innerHTML = '<span style="color:var(--text-muted)">Loading...</span>';
    document.getElementById('episodes-list').innerHTML = '';
    document.getElementById('season-explorer').classList.add('show');

    try {
        const res = await fetch(`https://api.themoviedb.org/3/tv/${show.id}?api_key=${API_KEY}`);
        const data = await res.json();

        document.getElementById('seasons-list').innerHTML = '';
        data.seasons.filter(s => s.season_number > 0).forEach((s, i) => {
            const btn = document.createElement('button');
            btn.className = 'season-btn' + (i === 0 ? ' active' : '');
            btn.textContent = `Season ${s.season_number}`;
            btn.onclick = () => {
                document.querySelectorAll('.season-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                loadEpisodes(show.id, s.season_number);
            };
            document.getElementById('seasons-list').appendChild(btn);
        });

        if (data.seasons.length) loadEpisodes(show.id, data.seasons.find(s => s.season_number > 0)?.season_number || 1);
    } catch (e) { }
}

async function loadEpisodes(showId, season) {
    document.getElementById('episodes-list').innerHTML = '<span style="color:var(--text-muted)">Loading...</span>';

    try {
        const res = await fetch(`https://api.themoviedb.org/3/tv/${showId}/season/${season}?api_key=${API_KEY}`);
        const data = await res.json();

        document.getElementById('episodes-list').innerHTML = '';
        data.episodes.forEach(ep => {
            const btn = document.createElement('button');
            btn.className = 'episode-btn';
            btn.innerHTML = `<strong>E${ep.episode_number}</strong> ${ep.name}`;
            btn.onclick = () => {
                closeSeasonExplorer();
                playMedia({ ...currentShow, season, episode: ep.episode_number, episodeName: ep.name }, 'tv');
            };
            document.getElementById('episodes-list').appendChild(btn);
        });
    } catch (e) { document.getElementById('episodes-list').innerHTML = 'Error loading episodes'; }
}

function closeSeasonExplorer() {
    document.getElementById('season-explorer').classList.remove('show');
}
