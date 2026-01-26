window.Quotes = {
    // Use data from config, fallback to empty array if not found
    getData() {
        return (window.SITE_CONFIG && window.SITE_CONFIG.quotes) || [];
    },

    getRandom() {
        const data = this.getData();
        if (!data.length) return null; // Return null if no quotes
        return data[Math.floor(Math.random() * data.length)];
    },
    init(force = false) {
        const quote = this.getRandom();
        if (!quote) return; // Do nothing if no quotes

        const targets = [
            '#quote',
            '#quote-display',
            '#subtitle',
            '.page-subtitle',
            '.extra-hero p',
            '.loading-text'
        ];

        targets.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                // Only update if force is true, or it's empty, or has placeholder text
                const text = el.textContent.trim();
                if (force || !text || text === 'Loading...' || text.includes('Stream movies') || text.includes('Customize your')) {
                    el.textContent = quote;
                }
            });
        });
    }
};

window.QUOTES = window.Quotes.getData();

// Run automatically on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.Quotes.init());
} else {
    window.Quotes.init();
}
