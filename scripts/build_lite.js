const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const indexFile = path.join(root, 'index2.html');
const outFile = path.join(root, 'phantom_lite.html');

console.log("Checking for index2.html at:", indexFile);
if (!fs.existsSync(indexFile)) {
    console.error("Error: index2.html not found!");
    process.exit(1);
}

let html = fs.readFileSync(indexFile, 'utf8');

console.log("Building Phantom Lite...");

// Inline CSS
html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (match, href) => {
    if (href.startsWith('http')) return match; // Skip CDN
    const cssPath = path.join(root, href);
    if (fs.existsSync(cssPath)) {
        console.log(`Inlining CSS: ${href}`);
        const css = fs.readFileSync(cssPath, 'utf8');
        return `<style>\n${css}\n</style>`;
    } else {
        console.warn(`Warning: CSS file not found: ${cssPath}`);
        return match;
    }
});

// Inline JS
html = html.replace(/<script src="([^"]+)"><\/script>/g, (match, src) => {
    if (src.startsWith('http')) return match; // Skip CDN

    // Check if it's the Scramjet block which we might want to keep external or handle carefully
    // But basic inlining logic:
    const jsPath = path.join(root, src);
    if (fs.existsSync(jsPath)) {
        console.log(`Inlining JS: ${src}`);
        const js = fs.readFileSync(jsPath, 'utf8');
        return `<script>\n${js}\n</script>`;
    } else {
        console.warn(`Warning: JS file not found: ${jsPath}`);
        return match;
    }
});

// Inline Images (small ones like logo)
html = html.replace(/<img src="([^"]+)"/g, (match, src) => {
    if (src.startsWith('http') || src.startsWith('data:')) return match;
    const imgPath = path.join(root, src);
    if (fs.existsSync(imgPath)) {
        console.log(`Inlining Image: ${src}`);
        const ext = path.extname(imgPath).slice(1);
        const data = fs.readFileSync(imgPath);
        const base64 = data.toString('base64');
        return `<img src="data:image/${ext};base64,${base64}"`;
    }
    return match;
});

fs.writeFileSync(outFile, html);
console.log(`\nSuccess! Phantom Lite built at: ${outFile}`);
console.log("Note: This lite version requires internet access for CDN libraries and game content.");
