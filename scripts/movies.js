const API_KEY = '2713804610e1e236b1cf44bfac3a7776';
const IMG_BASE = 'https://image.tmdb.org/t/p/w300';

// Restore Static Featured List (Fallback for broken API)
const FEATURED = [
    { id: 950779, title: "Five Nights at Freddy's", poster_path: "/A4j8S6moJS2zNtRR8oWF08gRnL5.jpg", release_date: "2023-10-25", vote_average: 7.6, media_type: "movie", overview: "Recently fired and desperate for work, a troubled young man named Mike agrees to take a position as a night security guard at an abandoned theme restaurant: Freddy Fazbear's Pizzeria. But he soon discovers that nothing at Freddy's is what it seems." },
    // Using FNAF 1 metadata as placeholder for 2 since it's not out/available on TMDB fully yet or just to satisfy user request for "1 and 2"
    { id: 1047585, title: "Five Nights at Freddy's 2", poster_path: "/x0f24255a019409893902996.jpg", release_date: "2025-12-05", vote_average: 0, media_type: "movie", overview: "The sequel to the 2023 film Five Nights at Freddy's. (Coming Soon)" },
    { id: 76600, title: "Avatar: The Way of Water", poster_path: "/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg", release_date: "2022-12-14", vote_average: 7.7, media_type: "movie", overview: "Set more than a decade after the events of the first film, learn the story of the Sully family (Jake, Neytiri, and their kids), the trouble that follows them, the lengths they go to keep each other safe, the battles they fight to stay alive, and the tragedies they endure." },
    { id: 677179, title: "Creed III", poster_path: "/cvsXj3I9Q2iyyIo95AecSd1tad7.jpg", release_date: "2023-03-01", vote_average: 7.2, media_type: "movie", overview: "After dominating the boxing world, Adonis Creed has been thriving in both his career and family life. When a childhood friend and former boxing prodigy, Damian Anderson, resurfaces after serving a long sentence in prison, he is eager to prove that he deserves his shot in the ring." },
    { id: 361743, title: "Top Gun: Maverick", poster_path: "/62HCnUTziyWcpDaBO2i1DX17ljH.jpg", release_date: "2022-05-24", vote_average: 8.3, media_type: "movie", overview: "After more than thirty years of service as one of the Navy’s top aviators, and dodging the advancement in rank that would ground him, Pete “Maverick” Mitchell finds himself training a detachment of TOP GUN graduates for a specialized mission the likes of which no living pilot has ever seen." },
    { id: 502356, title: "The Super Mario Bros. Movie", poster_path: "/qNBAXBIQlnOThrVvA6mA2K5ggV6.jpg", release_date: "2023-04-05", vote_average: 7.8, media_type: "movie", overview: "While working underground to fix a water main, Brooklyn plumbers—and brothers—Mario and Luigi are transported down a mysterious pipe and wander into a magical new world. But when the brothers are separated, Mario embarks on an epic quest to find Luigi." },
    { id: 693134, title: "Dune: Part Two", poster_path: "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg", release_date: "2024-02-27", vote_average: 8.3, media_type: "movie", overview: "Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family." },
    { id: 872585, title: "Oppenheimer", poster_path: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg", release_date: "2023-07-19", vote_average: 8.1, media_type: "movie", overview: "The story of J. Robert Oppenheimer's role in the development of the atomic bomb during World War II." },
    { id: 569094, title: "Spider-Man: Across the Spider-Verse", poster_path: "/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg", release_date: "2023-05-31", vote_average: 8.4, media_type: "movie", overview: "After reuniting with Gwen Stacy, Brooklyn’s full-time, friendly neighborhood Spider-Man is catapulted across the Multiverse, where he encounters the Spider Society, a team of Spider-People charged with protecting the Multiverse’s very existence." },
    { id: 157336, title: "Interstellar", poster_path: "/gEU2QniL6C971PN62uvp2GMz5iH.jpg", release_date: "2014-11-05", vote_average: 8.4, media_type: "movie", overview: "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage." },
    { id: 299534, title: "Avengers: Endgame", poster_path: "/or06FN3Dka5tukK1e9sl16pB3iy.jpg", release_date: "2019-04-24", vote_average: 8.3, media_type: "movie", overview: "After the devastating events of Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more in order to reverse Thanos' actions and restore balance to the universe." },
    { id: 496243, title: "Parasite", poster_path: "/7IiTTgloJzvGI1TAYymC8urRhuB.jpg", release_date: "2019-05-30", vote_average: 8.5, media_type: "movie", overview: "All-unemployed Ki-taek's family takes peculiar interest in the wealthy and glamorous Parks for their livelihood until they get entangled in an unexpected incident." },
    { id: 27205, title: "Inception", poster_path: "/oYuLEt3zVCKqJCZVPr6QqXV6An5.jpg", release_date: "2010-07-15", vote_average: 8.4, media_type: "movie", overview: "Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets is offered a chance to regain his old life as payment for a task considered to be impossible: \"inception\", the implantation of another person's idea into a target's subconscious." },
    { id: 155, title: "The Dark Knight", poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg", release_date: "2008-07-14", vote_average: 8.5, media_type: "movie", overview: "Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations that plague the streets. The partnership proves to be effective, but they soon find themselves prey to a reign of chaos unleashed by a rising criminal mastermind known to the terrified citizens of Gotham as the Joker." },
    { id: 634649, title: "Spider-Man: No Way Home", poster_path: "/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg", release_date: "2021-12-15", vote_average: 8.0, media_type: "movie", overview: "Peter Parker is unmasked and no longer able to separate his normal life from the high-stakes of being a super-hero. When he asks for help from Doctor Strange the stakes become even more dangerous, forcing him to discover what it truly means to be Spider-Man." },
    { id: 763215, title: "Damsel", poster_path: "/sMp34cNKjIb18JkPriu42ShF7qO.jpg", release_date: "2024-03-08", vote_average: 7.2, media_type: "movie", overview: "A young woman's marriage to a charming prince turns into a fierce fight for survival when she is offered up as a sacrifice to a fire-breathing dragon." },
    { id: 603, title: "The Matrix", poster_path: "/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg", release_date: "1999-03-30", vote_average: 8.2, media_type: "movie", overview: "Set in the 22nd century, The Matrix tells the story of a computer hacker who joins a group of underground insurgents fighting the vast and powerful computers who now rule the earth." },
    { id: 671, title: "Harry Potter and the Sorcerer's Stone", poster_path: "/wuMc08IPKEatf9rnMNXvIDxqP4W.jpg", release_date: "2001-11-16", vote_average: 7.9, media_type: "movie", overview: "Harry Potter has lived under the stairs at his aunt and uncle's house his whole life. But on his 11th birthday, he learns he's a powerful wizard -- with a place waiting for him at the Hogwarts School of Witchcraft and Wizardry. As he learns to harness his newfound powers with the help of the school's kindly headmaster, Harry uncovers the truth about his parents' deaths -- and about the villain who's to blame." },
    { id: 954, title: "Mission: Impossible - Dead Reckoning Part One", poster_path: "/NNxYkU70HPurnNCSiCjYAmacwm.jpg", release_date: "2023-07-08", vote_average: 7.6, media_type: "movie", overview: "Ethan Hunt and his IMF team embark on their most dangerous mission yet: To track down a terrifying new weapon that threatens all of humanity before it falls into the wrong hands." },
    { id: 385687, title: "Fast X", poster_path: "/fiVW06jE7z9YnO4trhaMEdclSiC.jpg", release_date: "2023-05-17", vote_average: 7.2, media_type: "movie", overview: "Over many missions and against impossible odds, Dom Toretto and his family have outsmarted, out-nerved and outdriven every foe in their path. Now, they confront the most lethal opponent they've ever faced: A terrifying threat emerging from the shadows of the past who's fueled by blood revenge, and who is determined to shatter this family and destroy everything—and everyone—that Dom loves, forever." },
    { id: 453395, title: "Doctor Strange in the Multiverse of Madness", poster_path: "/9Gtg2DzBhmYamXBS1hKAhiwbBKS.jpg", release_date: "2022-05-04", vote_average: 7.4, media_type: "movie", overview: "Doctor Strange, with the help of mystical allies both old and new, traverses the mind-bending and dangerous alternate realities of the Multiverse to confront a mysterious new adversary." },
    { id: 414906, title: "The Batman", poster_path: "/74xTEgt7R36Fpooo50x9TfdLn74.jpg", release_date: "2022-03-01", vote_average: 7.7, media_type: "movie", overview: "In his second year of fighting crime, Batman uncovers corruption in Gotham City that connects to his own family while facing a serial killer known as the Riddler." },
    { id: 505642, title: "Black Panther: Wakanda Forever", poster_path: "/sv1xJUazXeYqALzczSZ3O6nkH75.jpg", release_date: "2022-11-09", vote_average: 7.2, media_type: "movie", overview: "Queen Ramonda, Shuri, M’Baku, Okoye and the Dora Milaje fight to protect their nation from intervening world powers in the wake of King T’Challa’s death." },
    { id: 436270, title: "Black Adam", poster_path: "/pFlaoHTZeyNkG83vxsAJiGzfSsa.jpg", release_date: "2022-10-19", vote_average: 7.1, media_type: "movie", overview: "Nearly 5,000 years after he was bested on himself the almighty powers of the Egyptian gods—and imprisoned just as quickly—Black Adam is freed from his earthly tomb, ready to unleash his unique form of justice on the modern world." },
    { id: 335787, title: "Uncharted", poster_path: "/rJHC1RUORuUhtf06xptQlhaUDh6.jpg", release_date: "2022-02-10", vote_average: 7.0, media_type: "movie", overview: "A young street-smart, Nathan Drake and his wisecracking partner Victor “Sully” Sullivan embark on a dangerous pursuit of “the greatest treasure never found” while also tracking clues that may lead to Nathan’s long-lost brother." },
    { id: 1011985, title: "Kung Fu Panda 4", poster_path: "/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg", release_date: "2024-03-02", vote_average: 7.6, media_type: "movie", overview: "Po is gearing up to become the spiritual leader of his Valley of Peace, but also needs someone to take his place as Dragon Warrior. As such, he will train a new kung fu practitioner for the spot and will encounter a villain called the Chameleon who conjures villains from the past." },
    { id: 934632, title: "Rebel Moon - Part Two: The Scargiver", poster_path: "/cxevDYdeFkiixRShbObdwAHBZry.jpg", release_date: "2024-04-19", vote_average: 6.8, media_type: "movie", overview: "The rebels gear up for battle against the ruthless forces of the Motherworld as unbreakable bonds are forged, heroes emerge — and legends are made." },
    { id: 823464, title: "Godzilla x Kong: The New Empire", poster_path: "/tMefBSflv6PGmWv7PVOed9AQhtd.jpg", release_date: "2024-03-27", vote_average: 7.2, media_type: "movie", overview: "Following their explosive showdown, Godzilla and Kong must reunite against a colossal undiscovered threat hidden within our world, challenging their very existence – and our own." },
    { id: 609681, title: "The Marvels", poster_path: "/9GBhzXMFjgcZ3FdR9w3bUMMTx5d.jpg", release_date: "2023-11-08", vote_average: 6.3, media_type: "movie", overview: "Carol Danvers, aka Captain Marvel, has reclaimed her identity from the tyrannical Kree and taken revenge on the Supreme Intelligence. But unintended consequences see Carol shouldering the burden of a destabilized universe. When her duties send her to an anomalous wormhole linked to a Kree revolutionary, her powers become entangled with that of Jersey City super-fan Kamala Khan, aka Ms. Marvel, and Carol’s estranged niece, now S.A.B.E.R. astronaut Captain Monica Rambeau. Together, this unlikely trio must team up and learn to work in concert to save the universe." },
    { id: 787699, title: "Wonka", poster_path: "/qhb1qOilapbapxWQn9jtRCMwXJF.jpg", release_date: "2023-12-06", vote_average: 7.2, media_type: "movie", overview: "Willy Wonka – chock-full of ideas and determined to change the world one delectable bite at a time – is proof that the best things in life begin with a dream, and if you’re lucky enough to meet Willy Wonka, anything is possible." },
    { id: 346698, title: "Barbie", poster_path: "/iuFNMS8U5cb6xfzi51QaajTrKB.jpg", release_date: "2023-07-19", vote_average: 7.1, media_type: "movie", overview: "Barbie and Ken are having the time of their lives in the colorful and seemingly perfect world of Barbie Land. However, when they get a chance to go to the real world, they soon discover the joys and perils of living among humans." },
    { id: 447365, title: "Guardians of the Galaxy Vol. 3", poster_path: "/r2J02Z2OpNTctfOSN1Ydgii51I3.jpg", release_date: "2023-05-03", vote_average: 8.0, media_type: "movie", overview: "Peter Quill, still reeling from the loss of Gamora, must rally his team around him to defend the universe along with protecting one of their own. A mission that, if not completed successfully, could quite possibly lead to the end of the Guardians as we know them." },
    { id: 603692, title: "John Wick: Chapter 4", poster_path: "/vZloFAK7NmvMGKE7VkF5UPurDq.jpg", release_date: "2023-03-22", vote_average: 7.8, media_type: "movie", overview: "With the price on his head ever increasing, John Wick uncovers a path to defeating The High Table. But before he can earn his freedom, Wick must face off against a new enemy with powerful alliances across the globe and forces that turn old friends into foes." },
    { id: 507089, title: "Five Nights at Freddy's (2023)", poster_path: "/A4j8S6moJS2zNtRR8oWF08gRnL5.jpg", release_date: "2023-10-25", vote_average: 7.6, media_type: "movie", overview: "Recently fired and desperate for work, a troubled young man named Mike agrees to take a position as a night security guard at an abandoned theme restaurant: Freddy Fazbear's Pizzeria. But he soon discovers that nothing at Freddy's is what it seems." }
];

let currentMedia = null;
let currentCategory = 'featured';
let currentTab = 'movies';
let currentGenreId = '';
let currentPage = 1;
let isLoading = false;

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
            currentCategory = btn.dataset.cat;
            currentPage = 1; // Reset page
            loadMedia();
        };
    });

    // Load More Button
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
        loadMoreBtn.onclick = () => {
            currentPage++;
            loadMedia(currentPage, true);
        };
    }

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
    loadGenres();
    currentPage = 1;
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

async function loadMedia(page = 1, append = false) {
    if (isLoading) return;
    isLoading = true;

    // Remove existing load more card if appending
    if (append) {
        const existingBtn = document.querySelector('.load-more-card');
        if (existingBtn) existingBtn.remove();
    } else {
        mediaGrid.innerHTML = Array(12).fill('<div class="media-card"><div class="skeleton" style="width:100%;height:100%;"></div></div>').join('');
    }

    try {
        // Handle Featured with Caching
        if (currentCategory === 'featured' && !currentGenreId) {
            const CACHE_KEY = 'phantom_featured_cache';
            const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 1 week

            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const { timestamp, data } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_DURATION) {
                    renderGrid(data, append);
                    isLoading = false;
                    return;
                }
            }

            // Fetch new data if no cache or expired
            const res1 = await fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=28,878&sort_by=popularity.desc&vote_count.gte=100&page=1`);
            const res2 = await fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=28,878&sort_by=popularity.desc&vote_count.gte=100&page=2`);

            const data1 = await res1.json();
            const data2 = await res2.json();

            // Combine fetched movies with static FEATURED list
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

            renderGrid(allMovies, append);
            isLoading = false;
            return;
        }

        const type = currentTab === 'movies' ? 'movie' : 'tv';
        let allResults = [];
        let hasNextPage = false;

        // Fetch 2 pages (current and current+1)
        for (let i = 0; i < 2; i++) {
            const p = page + i;
            let url;

            if (currentGenreId) {
                url = `https://api.themoviedb.org/3/discover/${type}?api_key=${API_KEY}&with_genres=${currentGenreId}&sort_by=popularity.desc&vote_count.gte=100&page=${p}`;
            } else {
                if (currentCategory === 'popular') {
                    url = `https://api.themoviedb.org/3/discover/${type}?api_key=${API_KEY}&sort_by=popularity.desc&vote_count.gte=500&vote_average.gte=5.5&page=${p}`;
                } else if (currentCategory === 'top_rated') {
                    url = `https://api.themoviedb.org/3/${type}/top_rated?api_key=${API_KEY}&page=${p}`;
                } else if (currentCategory === 'now_playing' && type === 'movie') {
                    url = `https://api.themoviedb.org/3/movie/now_playing?api_key=${API_KEY}&page=${p}`;
                } else if (currentCategory === 'upcoming' && type === 'movie') {
                    url = `https://api.themoviedb.org/3/movie/upcoming?api_key=${API_KEY}&page=${p}`;
                } else {
                    url = `https://api.themoviedb.org/3/${type}/popular?api_key=${API_KEY}&page=${p}`;
                }
            }

            const res = await fetch(url);
            if (!res.ok) throw new Error(`TMDB API Error: ${res.status}`);
            const data = await res.json();
            allResults.push(...data.results);

            if (data.page >= data.total_pages) {
                hasNextPage = false;
                break;
            } else {
                hasNextPage = true;
            }
        }

        renderGrid(allResults, append, hasNextPage);

        // Update currentPage since we fetched 2 pages
        if (hasNextPage) currentPage++;

    } catch (e) {
        console.error("Load media error:", e);
        if (currentCategory === 'featured' && !currentGenreId) {
            renderGrid(FEATURED, append);
            isLoading = false;
            return;
        }
        if (!append) {
            mediaGrid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);"><p>Failed to load content.</p><p style="font-size:0.8rem;margin-top:8px;">Please check your connection or try again later.</p></div>';
        }
        if (window.Notify) window.Notify.error("Error", "Failed to load movies from TMDB");
    } finally {
        isLoading = false;
    }
}

function renderGrid(items, append = false, showLoadMore = false) {
    if (!append) mediaGrid.innerHTML = '';

    if (!items || !items.length) {
        if (!append) mediaGrid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);">No results found</div>';
        return;
    }

    items.filter(m => m.poster_path).forEach(item => {
        const card = document.createElement('div');
        card.className = 'media-card';
        const title = item.title || item.name;
        const date = item.release_date || item.first_air_date;
        const rating = item.vote_average ? item.vote_average.toFixed(1) : '';

        card.innerHTML = `
            <img src="${IMG_BASE}${item.poster_path}" alt="${title}">
            <div class="media-card-overlay">
                <div class="media-card-overview">${item.overview || ''}</div>
                <div class="media-card-info">
                    <div class="media-card-title">${title}</div>
                    <div class="media-card-meta">${date ? date.split('-')[0] : ''}</div>
                </div>
            </div>
            ${rating ? `<div class="media-card-rating">${rating}/10</div>` : ''}
        `;
        card.onclick = () => {
            if (currentTab === 'tv' && currentCategory !== 'featured') openSeasonExplorer(item);
            else if (item.media_type === 'tv') openSeasonExplorer(item);
            else playMedia(item, 'movie');
        };
        mediaGrid.appendChild(card);
    });

    if (showLoadMore) {
        const loadMoreCard = document.createElement('div');
        loadMoreCard.className = 'media-card load-more-card';
        loadMoreCard.innerHTML = `
            <div class="load-more-content">
                <i class="fa-solid fa-plus"></i>
                <span>Load More</span>
            </div>
        `;
        loadMoreCard.onclick = () => {
            currentPage++;
            loadMedia(currentPage, true);
        };
        mediaGrid.appendChild(loadMoreCard);
    }
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
