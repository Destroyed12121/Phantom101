const config = window.SITE_CONFIG || { cloakPresets: [] };
let settings = Settings.getAll();
const saveSettings = (s) => {
    Settings.update(s);
    settings = Settings.getAll();
};

document.querySelectorAll('.settings-tab').forEach(tab => {
    tab.onclick = () => {
        document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
    };
});

function renderCloaks() {
    const grid = document.getElementById('cloaks-grid');
    const allCloaks = [...(config.cloakPresets || []), ...(settings.customCloaks || [])];
    const activeCloak = settings.tabTitle || '';
    grid.innerHTML = allCloaks.map(c => {
        const isActive = c.title === activeCloak;
        return '<button class="cloak-btn ' + (isActive ? 'active' : '') + '" data-title="' + c.title + '" data-icon="' + (c.icon || '') + '">' +
            (c.icon ? '<img src="' + c.icon + '" onerror="this.style.display=\'none\'">' : '<i class="fa-solid fa-globe"></i>') +
            '<span>' + c.name + '</span></button>';
    }).join('');
    grid.querySelectorAll('.cloak-btn').forEach(btn => {
        btn.onclick = () => {
            settings.tabTitle = btn.dataset.title;
            settings.tabFavicon = btn.dataset.icon;
            saveSettings(settings);
            renderCloaks();
            document.title = settings.tabTitle;
        };
    });
}
renderCloaks();

document.getElementById('add-cloak-btn').onclick = () => document.getElementById('add-cloak-form').classList.toggle('show');
document.getElementById('cancel-cloak').onclick = () => document.getElementById('add-cloak-form').classList.remove('show');
document.getElementById('save-cloak').onclick = () => {
    const name = document.getElementById('new-cloak-name').value.trim();
    const title = document.getElementById('new-cloak-title').value.trim();
    const icon = document.getElementById('new-cloak-icon').value.trim();
    if (name && title) {
        settings.customCloaks = settings.customCloaks || [];
        settings.customCloaks.push({ name, title, icon });
        saveSettings(settings);
        renderCloaks();
        document.getElementById('add-cloak-form').classList.remove('show');
        document.getElementById('new-cloak-name').value = '';
        document.getElementById('new-cloak-title').value = '';
        document.getElementById('new-cloak-icon').value = '';
    }
};

document.getElementById('bg-color').value = settings.background?.value || '#0a0a0a';
document.getElementById('cloak-mode').value = settings.cloakMode || 'about:blank';
document.getElementById('panic-url').value = settings.panicUrl || 'https://classroom.google.com';
document.getElementById('accent-color').value = settings.accentColor || '#ffffff';
document.getElementById('surface-color').value = settings.surfaceColor || '#0f0f0f';
document.getElementById('secondary-color').value = settings.secondaryColor || '#2e2e33';
document.getElementById('text-color').value = settings.textColor || '#e4e4e7';
document.getElementById('text-secondary-color').value = settings.textSecondaryColor || '#71717a';
document.getElementById('text-dim-color').value = settings.textDimColor || '#52525b';
document.getElementById('surface-hover-color').value = settings.surfaceHoverColor || '#1a1a1a';
document.getElementById('surface-active-color').value = settings.surfaceActiveColor || '#252525';
document.getElementById('border-color').value = settings.borderColor || '#1f1f1f';
document.getElementById('border-light-color').value = settings.borderLightColor || '#2a2a2a';

document.getElementById('search-engine-select').value = settings.searchEngine || "https://www.bing.com/search?q=";
document.getElementById('search-engine-select').onchange = (e) => {
    settings.searchEngine = e.target.value;
    saveSettings(settings);
    if (window.Notify) Notify.success('Saved', 'Search engine updated');
};

document.getElementById('proxy-transport-select').value = settings.transport || "epoxy";
document.getElementById('proxy-transport-select').onchange = (e) => {
    settings.transport = e.target.value;
    saveSettings(settings);
    const transportName = e.target.value === 'libcurl' ? 'Libcurl' : 'Epoxy';
    if (window.Notify) Notify.success('Transport Updated', `${transportName} selected. Reloading...`);
    setTimeout(() => location.reload(), 1000);
};

const isWispAutoswitch = settings.wispAutoswitch !== false;
if (isWispAutoswitch) document.getElementById('wisp-autoswitch-toggle').classList.add('active');

document.getElementById('wisp-autoswitch-toggle').onclick = function () {
    this.classList.toggle('active');
    const enabled = this.classList.contains('active');
    settings.wispAutoswitch = enabled;
    saveSettings(settings);
    if (window.Notify) Notify.success('Saved', 'Auto-switch ' + (enabled ? 'enabled' : 'disabled'));
};

async function pingWispServer(url) {
    const start = Date.now();
    try {
        return new Promise((resolve) => {
            const socket = new WebSocket(url);
            const timeout = setTimeout(() => {
                socket.close();
                resolve({ success: false, latency: null });
            }, 2500);

            socket.onopen = () => {
                const latency = Date.now() - start;
                clearTimeout(timeout);
                socket.close();
                resolve({ success: true, latency });
            };

            socket.onerror = () => {
                clearTimeout(timeout);
                socket.close();
                resolve({ success: false, latency: null });
            };
        });
    } catch (e) {
        return { success: false, latency: null };
    }
}

function renderWispServers() {
    const list = document.getElementById('wisp-server-list');
    if (!list) return;
    list.innerHTML = '';

    const currentWisp = settings.proxServer || (window.SITE_CONFIG?.defaultWisp || "wss://glseries.net/wisp/");
    const customWisps = settings.customWisps || [];
    const allWisps = [...(window.SITE_CONFIG?.wispServers || []), ...customWisps];

    allWisps.forEach((server, index) => {
        const isActive = server.url === currentWisp;
        const card = document.createElement('div');
        card.className = `wisp-option ${isActive ? 'active' : ''}`;

        Object.assign(card.style, {
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            padding: '12px',
            background: isActive ? 'var(--surface-active)' : 'var(--bg)',
            border: isActive ? '1px solid var(--accent)' : '1px solid var(--border)',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.15s',
            position: 'relative',
            textAlign: 'left',
            marginBottom: '8px'
        });

        const isCustom = customWisps.some(w => w.url === server.url);

        card.innerHTML = `
            <div class="wisp-option-header" style="display: flex; justify-content: space-between; align-items: center;">
                <div class="wisp-option-name" style="font-size: 13px; font-weight: 600; color: var(--text); display: flex; align-items: center;">
                    ${server.name}
                </div>
                <div class="server-status" style="display: flex; align-items: center; gap: 6px;">
                    <span class="ping-text" style="font-family: 'Consolas', monospace; font-size: 11px; color: var(--text-muted);">...</span>
                    <div class="status-indicator" style="width: 6px; height: 6px; border-radius: 50%; background: var(--text-muted);"></div>
                    ${isCustom ? `<button class="delete-wisp-btn" style="background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; margin-left: 6px; transition: color 0.15s;"><i class="fa-solid fa-trash"></i></button>` : ''}
                </div>
            </div>
            <div class="wisp-option-url" style="font-family: 'Consolas', monospace; font-size: 11px; color: var(--text-muted); opacity: 0.7; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${server.url}</div>
        `;

        pingWispServer(server.url).then(result => {
            const dot = card.querySelector('.status-indicator');
            const txt = card.querySelector('.ping-text');
            if (!dot || !txt) return;

            if (result.success) {
                dot.style.background = '#22c55e';
                txt.textContent = `${result.latency}ms`;
                txt.style.color = result.latency < 150 ? '#22c55e' : (result.latency < 300 ? '#f59e0b' : '#ef4444');
            } else {
                dot.style.background = '#ef4444';
                txt.textContent = 'Offline';
                txt.style.color = '#ef4444';
            }
        });

        card.onclick = (e) => {
            if (e.target.closest('.delete-wisp-btn')) {
                settings.customWisps = (settings.customWisps || []).filter(w => w.url !== server.url);
                if (settings.proxServer === server.url) settings.proxServer = window.SITE_CONFIG.defaultWisp;
                saveSettings(settings);
                renderWispServers();
                return;
            }
            settings.proxServer = server.url;
            saveSettings(settings);
            renderWispServers();
            if (window.Notify) Notify.success('Switching Proxy', 'Wisp server updated');
        };

        list.appendChild(card);
    });
}
renderWispServers();

document.getElementById('add-custom-wisp').onclick = () => {
    const urlInput = document.getElementById('custom-wisp-url');
    const url = urlInput.value.trim();
    if (url && (url.startsWith('ws://') || url.startsWith('wss://'))) {
        settings.customWisps = settings.customWisps || [];
        if (!settings.customWisps.some(w => w.url === url)) {
            settings.customWisps.push({ name: 'Custom Server', url: url });
            saveSettings(settings);
            renderWispServers();
            urlInput.value = '';
            if (window.Notify) Notify.success('Success', 'Custom Wisp server added');
        }
    } else {
        if (window.Notify) Notify.error('Invalid URL', 'Must start with ws:// or wss://');
    }
};

document.getElementById('max-rating').value = settings.maxMovieRating || 'R';

function renderBackgrounds() {
    const grid = document.getElementById('backgrounds-grid');
    if (!grid) return;

    const bgPresets = window.SITE_CONFIG?.backgroundPresets || [];
    const currentBg = settings.customBackground;
    const currentBgId = currentBg?.id || (currentBg?.url ? 'custom' : 'none');

    const customBgs = settings.customBackgrounds || [];
    const allBgs = [...bgPresets, ...customBgs];

    grid.innerHTML = allBgs.map(bg => {
        const isActive = bg.id === currentBgId || (bg.id === 'custom' && bg.url === currentBg?.url);
        let preview = '';
        if (bg.type === 'youtube') {
            const ytId = bg.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)?.[1];
            preview = ytId ? `<img src="https://img.youtube.com/vi/${ytId}/hqdefault.jpg" style="width:100%; height:100%; object-fit:cover;">` : '';
        } else if (bg.type === 'video') {
            preview = `<video src="${bg.url}" muted loop playsinline volume="0" style="width:100%; height:100%; object-fit:cover;"></video>`;
        } else if (bg.type === 'image') {
            preview = `<img src="${bg.url}" style="width:100%; height:100%; object-fit:cover;">`;
        } else {
            preview = `<div style="width:100%; height:100%; background:linear-gradient(45deg, var(--surface), var(--surface-hover)); display:flex; align-items:center; justify-content:center; color:var(--text-dim);"><i class="fa-solid fa-ban" style="font-size: 2.5rem; opacity: 0.5;"></i></div>`;
        }

        const isDeletable = customBgs.some(cb => cb.url === bg.url);

        return `
            <button class="bg-preset-btn ${isActive ? 'active' : ''}" data-id="${bg.id}" data-url="${bg.url || ''}">
                <div class="bg-preset-preview">${preview}</div>
                <div class="bg-preset-name">${bg.name}</div>
                ${(bg.type === 'video' || bg.type === 'youtube') ? '<div class="bg-preset-badge"><i class="fa-solid fa-play"></i></div>' : ''}
                ${isDeletable ? `<div class="bg-preset-delete" data-url="${bg.url}"><i class="fa-solid fa-trash"></i></div>` : ''}
            </button>
        `;
    }).join('');

    grid.querySelectorAll('.bg-preset-btn').forEach(btn => {
        btn.onclick = (e) => {
            if (e.target.closest('.bg-preset-delete')) return;

            const bgId = btn.dataset.id;
            const bgUrl = btn.dataset.url;

            if (bgId === 'none') {
                settings.customBackground = { id: 'none', type: 'none' };
                if (window.Notify) Notify.success('Background Removed', 'Reverted to theme default');
            } else {
                const bg = allBgs.find(b => (bgId !== 'custom' && b.id === bgId) || (bgId === 'custom' && b.url === bgUrl));
                settings.customBackground = bg;
                if (window.Notify) Notify.success('Background Applied', `Switched to ${bg.name}`);
            }

            saveSettings(settings);
            renderBackgrounds();

            const urlInput = document.getElementById('custom-bg-url');
            if (urlInput) urlInput.value = '';
        };

        const deleteBtn = btn.querySelector('.bg-preset-delete');
        if (deleteBtn) {
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                const url = deleteBtn.dataset.url;
                settings.customBackgrounds = (settings.customBackgrounds || []).filter(bg => bg.url !== url);

                if (settings.customBackground?.url === url) {
                    settings.customBackground = { id: 'none', type: 'none' };
                }

                saveSettings(settings);
                renderBackgrounds();
                if (window.Notify) Notify.success('Deleted', 'Custom background removed');
            };
        }

        const video = btn.querySelector('video');
        if (video) {
            btn.onmouseenter = () => {
                video.muted = true;
                video.volume = 0;
                video.play().catch(() => { });
            };
            btn.onmouseleave = () => {
                video.pause();
                video.currentTime = 0;
            };
        }
    });
}
renderBackgrounds();

const applyCustomBgBtn = document.getElementById('apply-custom-bg');
if (applyCustomBgBtn) {
    applyCustomBgBtn.onclick = () => {
        const urlInput = document.getElementById('custom-bg-url');
        const url = urlInput?.value?.trim();

        if (!url) {
            if (window.Notify) Notify.error('Error', 'Please enter a URL');
            return;
        }

        let type = 'image';
        const urlLower = url.toLowerCase();
        if (urlLower.match(/\.(mp4|webm|ogg|mov|m4v)$/)) {
            type = 'video';
        } else if (urlLower.match(/(youtube\.com|youtu\.be)/)) {
            type = 'youtube';
        } else if (urlLower.includes('video') || urlLower.includes('stream')) {
            type = 'video';
        }

        const objectPositionInput = document.getElementById('custom-bg-position');
        const objectPosition = objectPositionInput?.value?.trim() || null;

        const newBg = {
            id: 'custom',
            name: 'Custom',
            type: type,
            url: url,
            overlay: 0.3,
            objectPosition: objectPosition
        };

        settings.customBackgrounds = settings.customBackgrounds || [];
        if (!settings.customBackgrounds.some(b => b.url === url)) {
            settings.customBackgrounds.push(newBg);
        }

        settings.customBackground = newBg;
        saveSettings(settings);
        renderBackgrounds();
        if (window.Notify) Notify.success('Custom Background Added', 'Background saved to your library');
        urlInput.value = '';
    };
}

const presets = window.SITE_CONFIG?.themePresets || {};
const presetsContainer = document.getElementById('themes-grid');
if (presetsContainer) {
    Object.entries(presets).forEach(([key, theme]) => {
        const btn = document.createElement('button');
        btn.className = 'cloak-btn';
        btn.style.alignItems = 'flex-start';
        btn.style.padding = '12px';
        btn.innerHTML = `
            <div style="width:100%; height:24px; background:${theme.bg.value}; border-radius:4px; margin-bottom:8px; border:1px solid var(--border)"></div>
            <span style="font-weight:600">${theme.name}</span>
        `;
        btn.onclick = () => {
            settings.background = theme.bg;
            settings.surfaceColor = theme.surface;
            settings.surfaceHoverColor = theme.surfaceHover;
            settings.surfaceActiveColor = theme.surfaceActive;
            settings.secondaryColor = theme.secondary;
            settings.borderColor = theme.border;
            settings.borderLightColor = theme.borderLight;
            settings.textColor = theme.text;
            settings.textSecondaryColor = theme.textSec;
            settings.textDimColor = theme.textDim;
            settings.accentColor = theme.accent;
            saveSettings(settings);

            document.getElementById('bg-color').value = theme.bg.value;
            document.getElementById('accent-color').value = theme.accent;
            document.getElementById('surface-color').value = theme.surface;
            document.getElementById('secondary-color').value = theme.secondary;
            document.getElementById('text-color').value = theme.text;
            document.getElementById('text-secondary-color').value = theme.textSec;
            document.getElementById('text-dim-color').value = theme.textDim;
            document.getElementById('surface-hover-color').value = theme.surfaceHover;
            document.getElementById('surface-active-color').value = theme.surfaceActive;
            document.getElementById('border-color').value = theme.border;
            document.getElementById('border-light-color').value = theme.borderLight;
            if (window.Notify) {
                Notify.success('Theme Applied', `Switched to ${theme.name} theme`);
            } else {
                alert('Theme "' + theme.name + '" applied!');
            }
        };
        presetsContainer.appendChild(btn);
    });
}

const mods = settings.panicModifiers || window.SITE_CONFIG?.defaults?.panicModifiers || ['ctrl', 'shift'];
const key = settings.panicKey || window.SITE_CONFIG?.defaults?.panicKey || 'x';
document.getElementById('panic-key').textContent = mods.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(' + ') + ' + ' + key;

if (settings.discordWidget !== false) document.getElementById('discord-toggle').classList.add('active');
else document.getElementById('discord-toggle').classList.remove('active');
if (settings.miniplayer !== false) document.getElementById('miniplayer-toggle').classList.add('active');
else document.getElementById('miniplayer-toggle').classList.remove('active');
if (settings.leaveConfirmation) document.getElementById('leave-confirm-toggle').classList.add('active');
if (settings.showChangelogOnUpdate !== false) document.getElementById('changelog-toggle').classList.add('active');
else document.getElementById('changelog-toggle').classList.remove('active');
if (settings.themeRotation) document.getElementById('theme-rotation-toggle').classList.add('active');
else document.getElementById('theme-rotation-toggle').classList.remove('active');
if (settings.autoSwitchProviders !== false) document.getElementById('autoswitch-toggle').classList.add('active');
else document.getElementById('autoswitch-toggle').classList.remove('active');
if (settings.historyEnabled !== false) document.getElementById('history-toggle').classList.add('active');
else document.getElementById('history-toggle').classList.remove('active');
if (settings.backgroundRotation) document.getElementById('background-rotation-toggle').classList.add('active');
else document.getElementById('background-rotation-toggle').classList.remove('active');

if (settings.rotateCloaks) {
    document.getElementById('rotate-toggle').classList.add('active');
    document.getElementById('rotate-interval-row').style.display = 'flex';
}
document.getElementById('rotate-interval').value = settings.rotateInterval || 5;

document.getElementById('cloak-mode').onchange = e => { settings.cloakMode = e.target.value; saveSettings(settings); };

document.getElementById('bg-color').oninput = e => {
    settings.background = { type: 'color', value: e.target.value };
    saveSettings(settings);
};
document.getElementById('panic-url').oninput = e => { settings.panicUrl = e.target.value; saveSettings(settings); };
document.getElementById('accent-color').oninput = e => { settings.accentColor = e.target.value; saveSettings(settings); };
document.getElementById('surface-color').oninput = e => { settings.surfaceColor = e.target.value; saveSettings(settings); };
document.getElementById('secondary-color').oninput = e => { settings.secondaryColor = e.target.value; saveSettings(settings); };
document.getElementById('text-color').oninput = e => { settings.textColor = e.target.value; saveSettings(settings); };
document.getElementById('text-secondary-color').oninput = e => { settings.textSecondaryColor = e.target.value; saveSettings(settings); };
document.getElementById('text-dim-color').oninput = e => { settings.textDimColor = e.target.value; saveSettings(settings); };
document.getElementById('surface-hover-color').oninput = e => { settings.surfaceHoverColor = e.target.value; saveSettings(settings); };
document.getElementById('surface-active-color').oninput = e => { settings.surfaceActiveColor = e.target.value; saveSettings(settings); };
document.getElementById('border-color').oninput = e => { settings.borderColor = e.target.value; saveSettings(settings); };
document.getElementById('border-light-color').oninput = e => { settings.borderLightColor = e.target.value; saveSettings(settings); };
document.getElementById('max-rating').onchange = e => { settings.maxMovieRating = e.target.value; saveSettings(settings); };
document.getElementById('discord-toggle').onclick = function () { this.classList.toggle('active'); settings.discordWidget = this.classList.contains('active'); saveSettings(settings); };
document.getElementById('miniplayer-toggle').onclick = function () { this.classList.toggle('active'); settings.miniplayer = this.classList.contains('active'); saveSettings(settings); };
document.getElementById('leave-confirm-toggle').onclick = function () { this.classList.toggle('active'); settings.leaveConfirmation = this.classList.contains('active'); saveSettings(settings); };
document.getElementById('changelog-toggle').onclick = function () { this.classList.toggle('active'); settings.showChangelogOnUpdate = this.classList.contains('active'); saveSettings(settings); };
document.getElementById('theme-rotation-toggle').onclick = function () { this.classList.toggle('active'); settings.themeRotation = this.classList.contains('active'); saveSettings(settings); };
document.getElementById('autoswitch-toggle').onclick = function () { this.classList.toggle('active'); settings.autoSwitchProviders = this.classList.contains('active'); saveSettings(settings); };
document.getElementById('history-toggle').onclick = function () { this.classList.toggle('active'); settings.historyEnabled = this.classList.contains('active'); saveSettings(settings); };
document.getElementById('background-rotation-toggle').onclick = function () { this.classList.toggle('active'); settings.backgroundRotation = this.classList.contains('active'); saveSettings(settings); };

document.getElementById('rotate-toggle').onclick = function () {
    this.classList.toggle('active');
    settings.rotateCloaks = this.classList.contains('active');
    document.getElementById('rotate-interval-row').style.display = settings.rotateCloaks ? 'flex' : 'none';
    saveSettings(settings);
};
document.getElementById('rotate-interval').onchange = e => {
    let val = parseFloat(e.target.value);
    if (val < 0.1) val = 0.1;
    if (val > 30) val = 30;
    settings.rotateInterval = val;
    saveSettings(settings);
};

let capturing = false;
const panicKeyBtn = document.getElementById('panic-key');
panicKeyBtn.onclick = () => { capturing = true; panicKeyBtn.classList.add('capturing'); panicKeyBtn.textContent = 'Press keys...'; };
document.addEventListener('keydown', e => {
    if (!capturing) return;
    e.preventDefault();
    const m = [];
    if (e.ctrlKey) m.push('ctrl');
    if (e.shiftKey) m.push('shift');
    if (e.altKey) m.push('alt');
    const k = e.key;
    if (!['Control', 'Shift', 'Alt', 'Meta'].includes(k)) {
        capturing = false;
        panicKeyBtn.classList.remove('capturing');
        panicKeyBtn.textContent = m.map(x => x.charAt(0).toUpperCase() + x.slice(1)).join(' + ') + (m.length ? ' + ' : '') + k;
        settings.panicKey = k;
        settings.panicModifiers = m;
        saveSettings(settings);
    }
});

document.getElementById('clear-cache').onclick = async () => {
    if (!confirm('Clear all cached data? This will unregister service workers and clear secondary storage.')) return;

    if ('caches' in window) {
        try {
            const keys = await caches.keys();
            await Promise.all(keys.map(k => caches.delete(k)));
        } catch (e) { console.error('Cache clear error:', e); }
    }

    if ('indexedDB' in window) {
        try {
            if (indexedDB.databases) {
                const dbs = await indexedDB.databases();
                for (const db of dbs) {
                    if (db.name) indexedDB.deleteDatabase(db.name);
                }
            } else {
                ['scramjet-data', 'scrambase', 'ScramjetData', 'uv-data'].forEach(name => indexedDB.deleteDatabase(name));
            }
        } catch (e) { console.error('IDB clear error:', e); }
    }

    if ('serviceWorker' in navigator) {
        try {
            const regs = await navigator.serviceWorker.getRegistrations();
            for (const reg of regs) {
                await reg.unregister();
            }
        } catch (e) { console.error('SW unregister error:', e); }
    }

    if (window.Notify) Notify.success('Success', 'Cache cleared! Reloading...');
    else alert('Cache cleared successfully! Reloading...');

    setTimeout(() => location.reload(), 1000);
};
document.getElementById('reset-settings').onclick = () => {
    if (!confirm('Reset all settings?')) return;
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
};
