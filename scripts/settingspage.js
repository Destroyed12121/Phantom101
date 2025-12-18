// Use centralized Settings API
const config = window.SITE_CONFIG || { cloakPresets: [] };
let settings = Settings.getAll();
const saveSettings = (s) => {
    Settings.update(s);
    // Update local ref just in case
    settings = Settings.getAll();
};

// Tabs
document.querySelectorAll('.settings-tab').forEach(tab => {
    tab.onclick = () => {
        document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
    };
});

// Render cloaks
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
            // Instant update via postMessage is handled by Settings.update()
            document.title = settings.tabTitle;
        };
    });
}
renderCloaks();

// Add custom cloak
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

// Load values
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

document.getElementById('max-rating').value = settings.maxMovieRating || 'R';
document.getElementById('game-library').value = settings.gameLibrary || 'lib1';

// Theme Presets - use from config.js
const presets = window.SITE_CONFIG?.themePresets || {};

const presetsContainer = document.querySelector('.presets-grid');
Object.entries(presets).forEach(([key, theme]) => {
    const btn = document.createElement('button');
    btn.className = 'cloak-btn'; /* Reuse styling */
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
        saveSettings(settings); // This triggers Settings.apply() automatically

        // Update inputs
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


const mods = settings.panicModifiers || ['ctrl', 'shift'];
const key = settings.panicKey || 'Escape';
document.getElementById('panic-key').textContent = mods.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(' + ') + ' + ' + key;

if (settings.discordWidget !== false) document.getElementById('discord-toggle').classList.add('active');
else document.getElementById('discord-toggle').classList.remove('active');
if (settings.miniplayer !== false) document.getElementById('miniplayer-toggle').classList.add('active');
else document.getElementById('miniplayer-toggle').classList.remove('active');
if (settings.leaveConfirmation) document.getElementById('leave-confirm-toggle').classList.add('active');
if (settings.showChangelogOnUpdate !== false) document.getElementById('changelog-toggle').classList.add('active');
else document.getElementById('changelog-toggle').classList.remove('active');

// Rotating Cloaks
if (settings.rotateCloaks) {
    document.getElementById('rotate-toggle').classList.add('active');
    document.getElementById('rotate-interval-row').style.display = 'flex';
}
document.getElementById('rotate-interval').value = settings.rotateInterval || 5;

// Save handlers
document.getElementById('cloak-mode').onchange = e => { settings.cloakMode = e.target.value; saveSettings(settings); };

document.getElementById('panic-url').onchange = e => { settings.panicUrl = e.target.value; saveSettings(settings); };
document.getElementById('accent-color').onchange = e => { settings.accentColor = e.target.value; saveSettings(settings); };
document.getElementById('surface-color').onchange = e => { settings.surfaceColor = e.target.value; saveSettings(settings); };
document.getElementById('secondary-color').onchange = e => { settings.secondaryColor = e.target.value; saveSettings(settings); };
document.getElementById('text-color').onchange = e => { settings.textColor = e.target.value; saveSettings(settings); };
document.getElementById('text-secondary-color').onchange = e => { settings.textSecondaryColor = e.target.value; saveSettings(settings); };
document.getElementById('text-dim-color').onchange = e => { settings.textDimColor = e.target.value; saveSettings(settings); };
document.getElementById('surface-hover-color').onchange = e => { settings.surfaceHoverColor = e.target.value; saveSettings(settings); };
document.getElementById('surface-active-color').onchange = e => { settings.surfaceActiveColor = e.target.value; saveSettings(settings); };
document.getElementById('border-color').onchange = e => { settings.borderColor = e.target.value; saveSettings(settings); };
document.getElementById('border-light-color').onchange = e => { settings.borderLightColor = e.target.value; saveSettings(settings); };
document.getElementById('max-rating').onchange = e => { settings.maxMovieRating = e.target.value; saveSettings(settings); };
document.getElementById('game-library').onchange = e => { settings.gameLibrary = e.target.value; saveSettings(settings); };
document.getElementById('discord-toggle').onclick = function () { this.classList.toggle('active'); settings.discordWidget = this.classList.contains('active'); saveSettings(settings); };
document.getElementById('miniplayer-toggle').onclick = function () { this.classList.toggle('active'); settings.miniplayer = this.classList.contains('active'); saveSettings(settings); };
document.getElementById('leave-confirm-toggle').onclick = function () { this.classList.toggle('active'); settings.leaveConfirmation = this.classList.contains('active'); saveSettings(settings); };
document.getElementById('changelog-toggle').onclick = function () { this.classList.toggle('active'); settings.showChangelogOnUpdate = this.classList.contains('active'); saveSettings(settings); };

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

// Panic key
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
    if (!confirm('Clear all cached data?')) return;
    if ('caches' in window) { const keys = await caches.keys(); await Promise.all(keys.map(k => caches.delete(k))); }
    if (window.Notify) Notify.success('Success', 'Cache cleared successfully!');
    else alert('Cache cleared!');
};
document.getElementById('reset-settings').onclick = () => {
    if (!confirm('Reset all settings?')) return;
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
};
