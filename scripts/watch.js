const YT_KEY = '2c202bc3d7msh4897b5b2a7d3f0cp15a754jsn568117aaec11';
const TWITCH_PROXY = 'https://twitch.leelive2021.workers.dev/';

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
        'Clix', 'Jynxzi', 'Lacy', 'Flight23White', 'Caseoh_',
        'Kaicenat', 'Stableronaldo', 'Marlon', 'PlaqueboyMax',
        'Adinross', 'IshowSpeed', 'Skeepy', 'AsianGuyStream',
        'Mongraal', 'SypherPK', 'NickEh30', 'Tfue', 'Ninja',
        'Speedrun', 'XQc'
    ];

    streamers.forEach(channel => {
        const title = `${channel}`;
        const thumb = `https://static-cdn.jtvnw.net/previews-ttv/live_user_${channel.toLowerCase()}-440x248.jpg?t=${Date.now()}`;
        const card = createMediaCard(thumb, title, "Twitch", () => {
            const streamUrl = `${TWITCH_PROXY}?channel=${channel}`;
            playMedia(title, streamUrl);
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
                playMedia(title, embedUrl);
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
            const streamUrl = `${TWITCH_PROXY}?channel=${channel}`;
            playMedia(title, streamUrl);
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

function playMedia(title, url) {
    const params = new URLSearchParams({
        type: 'game', // Use game type to just load the URL
        title: title,
        url: url
    });
    // Store empty overview or video info if needed
    sessionStorage.setItem('currentMovie', JSON.stringify({ overview: 'Platform Stream' }));
    window.location.href = `player.html?${params.toString()}`;
}

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    // Automatically search for Fortnite to populate the grid
    searchYouTube('Fortnite');
});

// Add event listener for Enter key
if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') startSearch();
    });
}
