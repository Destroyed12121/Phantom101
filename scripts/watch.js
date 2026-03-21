// Cloudflare Worker URL for YouTube Search (free, no quota limits)
const YT_SEARCH_URL = 'https://ytsearch.leelive2021.workers.dev/';

let currentPlatform = 'youtube';
const grid = document.getElementById('media-grid');
const searchInput = document.getElementById('search-input');
const statusText = document.getElementById('status');

function setPlatform(p) {
    currentPlatform = p;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(p + '-tab').classList.add('active');
    searchInput.placeholder = `Search ${p === 'youtube' ? 'YouTube' : 'Twitch Channel'}...`;
    grid.innerHTML = '';
    if (statusText) statusText.textContent = '';

    // On platform switch, if search is empty, show defaults
    if (!searchInput.value.trim()) {
        if (p === 'youtube') searchYouTube('nba 2k26');
        else showDefaultStreamers();
    }
}

function showDefaultStreamers() {
    if (!grid) return;
    grid.innerHTML = "";
    const streamers = [
        'Clix', 'Jynxzi', 'Lacy', 'Flight23White', 'CaseOh_', 'KaiCenat',
        'Agent00', 'ChrisSmoove', 'Tyceno', 'TYCooN', 'PowerDF', 'itsshakedown',
        'PlaqueboyMax', 'AdinRoss', 'IShowSpeed', 'DukeDennis', 'Fanum', 'StableRonaldo',
        'Mongraal', 'SypherPK', 'NickEh30', 'Tfue', 'Ninja', 'xQc',
        'Sketch', 'TenZ', 'TypicalGamer', 'Bugha', 'FaZeRug', 'YourRAGE'
    ];

    streamers.forEach(channel => {
        const title = `${channel}`;
        const thumb = `https://static-cdn.jtvnw.net/previews-ttv/live_user_${channel.toLowerCase()}-440x248.jpg?t=${Date.now()}`;
        const card = createMediaCard(thumb, title, "Twitch", () => {
            playMedia(title, channel, 'twitch', thumb);
        }, true);
        grid.appendChild(card);
    });
}

async function startSearch() {
    const query = searchInput.value;
    if (!query) return;
    currentPlatform === 'youtube' ? searchYouTube(query) : searchTwitch(query);
}

async function searchYouTube(query) {
    if (!grid) return;
    if (statusText) statusText.textContent = "Querying YouTube API...";

    // Show skeletons
    grid.innerHTML = Array(12).fill('<div class="media-card"><div class="skeleton" style="width:100%;height:100%;"></div></div>').join('');

    let videos = [];
    let fromCache = false;

    // Check cache for default nba 2k26 query
    if (query.toLowerCase() === 'nba 2k26') {
        const cached = localStorage.getItem('nba2k26_default_cache');
        if (cached) {
            try {
                const data = JSON.parse(cached);
                // 2 days = 172800000 ms
                if (Date.now() - data.timestamp < 172800000) {
                    videos = data.items;
                    fromCache = true;
                    if (statusText) statusText.textContent = "";
                }
            } catch (e) {
                console.warn("Invalid cache", e);
            }
        }
    }

    if (!fromCache) {
        const url = `${YT_SEARCH_URL}?q=${encodeURIComponent(query)}`;

        try {
            const response = await fetch(url);
            const result = await response.json();
            videos = result.data?.items || [];

            // Save to cache if this was the default nba 2k26 query
            if (query.toLowerCase() === 'nba 2k26' && videos.length > 0) {
                localStorage.setItem('nba2k26_default_cache', JSON.stringify({
                    timestamp: Date.now(),
                    items: videos
                }));
            }
        } catch (e) {
            if (statusText) statusText.textContent = "Search Error";
            grid.innerHTML = '<div class="error-msg">Failed to load content.</div>';
            return;
        }
    }

    grid.innerHTML = "";
    videos.forEach(item => {
        const vId = item.id.videoId || item.id;
        const title = item.snippet.title;
        const channel = item.snippet.channelTitle;
        const thumb = item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium.url;

        const card = createMediaCard(thumb, title, channel, () => {
            const embedUrl = `https://www.youtube-nocookie.com/embed/${vId}?autoplay=1`;
            playMedia(title, embedUrl, null, thumb);
        });
        grid.appendChild(card);
    });

    if (statusText) statusText.textContent = "";
}

function fuzzyMatch(query, text) {
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
}

function searchTwitch(query) {
    if (!grid) return;
    grid.innerHTML = "";
    const input = query.toLowerCase().trim();
    if (!input) { showDefaultStreamers(); return; }

    const streamers = [
        'Clix', 'Jynxzi', 'Lacy', 'Flight23White', 'CaseOh_', 'KaiCenat',
        'Agent00', 'ChrisSmoove', 'Tyceno', 'TYCooN', 'PowerDF', 'itsshakedown',
        'PlaqueboyMax', 'AdinRoss', 'IShowSpeed', 'DukeDennis', 'Fanum', 'StableRonaldo',
        'Mongraal', 'SypherPK', 'NickEh30', 'Tfue', 'Ninja', 'xQc',
        'Sketch', 'TenZ', 'TypicalGamer', 'Bugha', 'FaZeRug', 'YourRAGE'
    ];

    // Fuzzy search from default list
    const scoredStreamers = streamers.map(s => ({ name: s, score: fuzzyMatch(input, s) }))
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score);

    const matchNames = scoredStreamers.map(s => s.name);
    
    // Also allow manual channelEntry (comma separated or single)
    let manualChannels = input.split(',').map(s => s.trim()).filter(s => s.length > 0);
    
    // Merge results, avoiding duplicates
    const finalChannels = [...matchNames];
    manualChannels.forEach(c => {
        if (!finalChannels.some(f => f.toLowerCase() === c.toLowerCase())) {
            finalChannels.push(c);
        }
    });

    finalChannels.slice(0, 30).forEach(channel => {
        const title = `${channel}`;
        const thumb = `https://static-cdn.jtvnw.net/previews-ttv/live_user_${channel.toLowerCase()}-440x248.jpg?t=${Date.now()}`;
        const card = createMediaCard(thumb, title, "Twitch.tv", () => {
            playMedia(title, channel, 'twitch', thumb);
        }, true);
        grid.appendChild(card);
    });

    if (statusText) statusText.textContent = finalChannels.length > 0 ? "Channels ready." : "No channels found.";
}

function createMediaCard(thumb, title, meta, onClick, isLive = false) {
    const card = document.createElement('div');
    card.className = 'media-card';
    if (isLive) card.classList.add('is-live');

    card.innerHTML = `
        <img src="${thumb}" loading="lazy" alt="${title}" onerror="this.src='https://via.placeholder.com/440x248?text=Offline/Locked'">
        <div class="media-card-overlay">
            <div class="media-card-info">
                <div class="media-card-title">${title}</div>
                <div class="media-card-meta">${meta}</div>
            </div>
        </div>
    `;
    card.onclick = onClick;
    return card;
}

function playMedia(title, identifier, source = null, thumb = null) {
    const params = new URLSearchParams({
        type: 'video',
        title: title
    });

    if (source === 'twitch') {
        params.append('source', 'twitch');
        params.append('id', identifier);
    } else {
        params.append('url', identifier);
    }

    if (thumb) {
        params.append('img', thumb);
    }

    const isYT = identifier.includes('youtube.com') || identifier.includes('youtube-nocookie.com') || identifier.includes('youtu.be');
    const overview = isYT ? 'YouTube Video' : 'Live Stream';
    
    sessionStorage.setItem('currentMovie', JSON.stringify({ overview: overview }));
    window.location.href = `player.html?${params.toString()}`;
}

function loadContinueWatching() {
    const history = JSON.parse(localStorage.getItem('continue_watching') || '[]');
    const container = document.getElementById('continue-watching-section');
    const grid = document.getElementById('continue-watching-grid');

    const validHistory = history.filter(item => {
        if (item.type === 'movie' || item.type === 'tv' || item.type === 'game') return false;
        if (item.type === 'twitch' || (item.url && item.url.includes('source=twitch'))) return false;
        return true;
    });

    if (!validHistory.length || !container || !grid || (window.Settings && window.Settings.get('historyEnabled') === false)) {
        if (container) container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    grid.innerHTML = '';

    validHistory.forEach(item => {
        const thumb = item.img || 'https://via.placeholder.com/440x248?text=No+Preview';

        const card = document.createElement('div');
        card.className = 'media-card';
        card.style.position = 'relative';

        card.innerHTML = `
            <img src="${thumb}" loading="lazy" alt="${item.title}" onerror="this.src='https://via.placeholder.com/440x248?text=Offline/Locked'">
            <div class="media-card-overlay">
                <div class="media-card-info">
                    <div class="media-card-title">${item.title}</div>
                    <div class="media-card-meta">${item.type === 'game' ? 'Stream' : item.type}</div>
                    ${item.progress ? `<div class="progress-bar-container" style="width:100%;height:3px;background:rgba(255,255,255,0.3);margin-top:4px;border-radius:2px;overflow:hidden;"><div class="progress-bar" style="width:${item.progress.percentage}%;height:100%;background:var(--accent, #3b82f6);display:block;"></div></div>` : ''}
                </div>
            </div>
        `;

        card.onclick = () => {
            window.location.href = item.url;
        };

        // Add remove button
        const removeBtn = document.createElement('button');
        removeBtn.innerHTML = '<i class="fa-solid fa-times"></i>';
        removeBtn.className = 'remove-btn';
        removeBtn.style.cssText = 'position:absolute;top:5px;right:5px;background:rgba(0,0,0,0.7);color:#fff;border:none;border-radius:50%;width:24px;height:24px;cursor:pointer;z-index:10;display:flex;align-items:center;justify-content:center;';
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            const newHistory = history.filter(h => h.url !== item.url);
            localStorage.setItem('continue_watching', JSON.stringify(newHistory));
            loadContinueWatching();
        };
        card.appendChild(removeBtn);

        grid.appendChild(card);
    });
}

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    loadContinueWatching();
    // Automatically search for nba 2k26 to populate the grid
    searchYouTube('nba 2k26');

    // Random functionality
    const randomBtn = document.getElementById('random-btn');
    if (randomBtn) {
        randomBtn.onclick = () => {
            const cards = grid.querySelectorAll('.media-card');
            if (cards.length > 0) {
                const randomCard = cards[Math.floor(Math.random() * cards.length)];
                randomCard.click();
            }
        };
    }


});

// Add event listener for Enter key
if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') startSearch();
    });
}
