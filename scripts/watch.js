const YT_KEY = '2c202bc3d7msh4897b5b2a7d3f0cp15a754jsn568117aaec11';

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
        if (p === 'youtube') searchYouTube('Fortnite');
        else showDefaultStreamers();
    }
}

function showDefaultStreamers() {
    if (!grid) return;
    grid.innerHTML = "";
    const streamers = [
        'Clix', 'Jynxzi', 'Lacy', 'Flight23White', 'peterbot247official', 'CaseOh_',
        'KaiCenat', 'StableRonaldo', 'Marlon', 'PlaqueboyMax',
        'AdinRoss', 'IShowSpeed', 'Skeppy', 'AsianGuyStream',
        'Mongraal', 'SypherPK', 'NickEh30', 'Tfue', 'Ninja',
        'xQc', 'Sketch', 'DukeDennis',
        'Fanum', 'Agent00', 'ImDavisss', 'Silky',
        'Ray', 'Fousey', 'Vitaly', 'Sneako',
        'Shroud', 'Tarik', 'TenZ', 'Asmongold', 'HasanAbi',
        'Mizkif', 'Pokimane', 'Ludwig', 'Summit1g',
        'TypicalGamer', 'Bugha', 'FaZeRug'
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

    const url = `https://youtube-api-full.p.rapidapi.com/api/search/videos?query=${encodeURIComponent(query)}&maxResults=20`;

    try {
        const response = await fetch(url, {
            headers: { 'X-RapidAPI-Key': YT_KEY, 'X-RapidAPI-Host': 'youtube-api-full.p.rapidapi.com' }
        });
        const result = await response.json();
        const videos = result.data?.items || [];

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
    } catch (e) {
        if (statusText) statusText.textContent = "Search Error";
        grid.innerHTML = '<div class="error-msg">Failed to load content.</div>';
    }
}

function searchTwitch(query) {
    if (!grid) return;
    grid.innerHTML = "";
    const input = query.toLowerCase().trim();
    if (!input) { showDefaultStreamers(); return; }

    const channels = input.split(',').map(s => s.trim()).filter(s => s.length > 0);

    channels.forEach(channel => {
        const title = `${channel}`;
        const thumb = `https://static-cdn.jtvnw.net/previews-ttv/live_user_${channel}-440x248.jpg?t=${Date.now()}`;
        const card = createMediaCard(thumb, title, "Twitch.tv", () => {
            playMedia(title, channel, 'twitch', thumb);
        }, true);
        grid.appendChild(card);
    });

    if (statusText) statusText.textContent = channels.length > 0 ? "Channels ready." : "";
}

function createMediaCard(thumb, title, meta, onClick, isLive = false) {
    const card = document.createElement('div');
    card.className = 'media-card';
    if (isLive) card.classList.add('is-live');

    card.innerHTML = `
        <img src="${thumb}" loading="lazy" alt="${title}" onerror="this.src='https://via.placeholder.com/440x248?text=Offline/Locked'">
        ${isLive ? '<div class="live-badge">LIVE</div>' : ''}
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

    sessionStorage.setItem('currentMovie', JSON.stringify({ overview: source === 'twitch' ? 'Twitch Stream' : 'Platform Stream' }));
    window.location.href = `player.html?${params.toString()}`;
}

function loadContinueWatching() {
    const history = JSON.parse(localStorage.getItem('continue_watching') || '[]');
    const container = document.getElementById('continue-watching-section');
    const grid = document.getElementById('continue-watching-grid');

    if (!history.length || !container || !grid || (window.Settings && window.Settings.get('historyEnabled') === false)) {
        if (container) container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    grid.innerHTML = '';

    history.forEach(item => {
        // Exclude movies and tv shows from the watch page
        if (item.type === 'movie' || item.type === 'tv') return;
        // Exclude twitch
        if (item.type === 'twitch' || item.url.includes('source=twitch')) return;

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
    // Automatically search for Fortnite to populate the grid
    searchYouTube('Fortnite');
});

// Add event listener for Enter key
if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') startSearch();
    });
}
