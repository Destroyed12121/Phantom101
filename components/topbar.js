// Topbar Component - Original style with animations
(function () {
    let rootPrefix = '';
    const scriptName = 'components/topbar.js';
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
        const src = scripts[i].getAttribute('src');
        if (src && src.includes(scriptName)) {
            rootPrefix = src.split(scriptName)[0];
            break;
        }
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/lucide@latest';
    script.onload = initTopbar;
    document.head.appendChild(script);

    function initTopbar() {
        const topbarContainer = document.createElement('div');
        topbarContainer.id = 'topbar-container';

        // Logo - Lightning icon
        const logoSection = document.createElement('div');
        logoSection.className = 'logo-section';
        logoSection.innerHTML = '<div class="logo-placeholder"><i data-lucide="zap"></i></div>';
        logoSection.style.cursor = 'pointer';
        logoSection.onclick = () => window.location.href = rootPrefix + 'index.html';
        topbarContainer.appendChild(logoSection);

        // Navigation - Order: Music, Movies, Games, Search, AI Chat, Separator, Settings
        const navButtons = document.createElement('div');
        navButtons.className = 'nav-buttons';

        const buttons = [
            { name: 'Music', icon: 'music', link: 'pages/music.html', badge: 'BETA' },
            { name: 'Movies', icon: 'film', link: 'pages/movies.html' },
            { name: 'Games', icon: 'gamepad-2', link: 'pages/games.html' },
            { name: 'Search', icon: 'search', link: 'staticsjv2/index.html' },
            { name: 'AI Chat', icon: 'bot', link: 'pages/chatbot.html' },
            { separator: true },
            { name: 'Settings', icon: 'settings', link: 'pages/settings.html' }
        ];

        buttons.forEach(btn => {
            if (btn.separator) {
                const separator = document.createElement('div');
                separator.className = 'nav-separator';
                navButtons.appendChild(separator);
                return;
            }

            const link = document.createElement('a');
            link.href = rootPrefix + btn.link;
            link.className = 'nav-btn';

            const icon = document.createElement('i');
            icon.setAttribute('data-lucide', btn.icon);
            link.appendChild(icon);

            const span = document.createElement('span');
            span.textContent = btn.name;
            link.appendChild(span);

            if (btn.badge) {
                const badge = document.createElement('div');
                badge.className = 'nav-badge-beta';
                badge.textContent = btn.badge;
                link.appendChild(badge);
            }

            navButtons.appendChild(link);
        });

        topbarContainer.appendChild(navButtons);
        document.body.prepend(topbarContainer);

        if (window.lucide) lucide.createIcons();
    }
})();
