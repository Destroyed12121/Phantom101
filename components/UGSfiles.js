

window.loadUGSFiles = async () => {
    if (window.UGS_FILES) return window.UGS_FILES;
    if (window.UGS_FILES_PROMISE) return window.UGS_FILES_PROMISE;

    window.UGS_FILES_PROMISE = (async () => {
        try {
            const response = await fetch('https://cdn.jsdelivr.net/gh/bubbls/ugs-singlefile@main/games.js');
            if (!response.ok) throw new Error('CDN response not OK');

            const text = await response.text();
            // Updated regex to support 'let' and flexibility
            const match = text.match(/(?:const|let|var)\s+files\s*=\s*(\[[\s\S]*?\]);?/);

            if (match && match[1]) {
                const files = eval(match[1]);
                window.UGS_FILES = files;
                console.log(`[UGS] Successfully loaded ${files.length} games from CDN.`);
                return files;
            } else {
                throw new Error('Could not parse files array from source');
            }
        } catch (error) {
            console.error('[UGS] Failed to load games from CDN:', error);
            window.UGS_FILES = window.UGS_FILES || [];
            return window.UGS_FILES;
        }
    })();
    return window.UGS_FILES_PROMISE;
};

// Start loading immediately to avoid race conditions
window.loadUGSFiles();
