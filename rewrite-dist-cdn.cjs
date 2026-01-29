const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

const srcIndex = path.join(__dirname, 'index.html');
const destIndex = path.join(distDir, 'index.html');

fs.copyFileSync(srcIndex, destIndex);

let html = fs.readFileSync(destIndex, 'utf8');

const cdnPrefix = 'https://cdn.jsdelivr.net/gh/Destroyed12121/Phantom101@main/';

// Inline critical scripts to ensure bootstrapper works even if CDN is slow/broken
function inlineScript(fileName) {
    const filePath = path.join(__dirname, fileName);
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        // Replace the script tag with inline content
        // We look for src="fileName" or src=".../fileName"
        const regex = new RegExp(`<script[^>]+src="[^"]*${fileName.replace(/\./g, '\\.')}"[^>]*><\/script>`, 'g');
        console.log(`Inlining ${fileName}...`);
        html = html.replace(regex, `<script>\n// Inlined ${fileName}\n${content}\n</script>`);
    } else {
        console.warn(`Could not find ${fileName} to inline.`);
    }
}

inlineScript('config.js');
inlineScript('scripts/settings.js');
inlineScript('scripts/background.js'); // Also inline background as it's used early
inlineScript('index2.html');
inlineScript('scripts/rotation.js');
inlineScript('styles/main.css');

// Helper to replace links for remaining assets
function replaceUrl(attr, content) {
    const regex = new RegExp(`(${attr}=")(?!http|https|//|data:|#)([^"]+)(")`, 'g');
    return content.replace(regex, (match, prefix, path, suffix) => {
        const cleanPath = path.replace(/^\.?\//, '');
        return `${prefix}${cdnPrefix}${cleanPath}${suffix}`;
    });
}

html = replaceUrl('src', html);
html = replaceUrl('href', html);

// Specific fix for JS dynamic iframe replacement
// This handles single quotes often used in JS
html = html.replace(/src\s*=\s*'index2\.html'/g, `src = '${cdnPrefix}index2.html'`);
html = html.replace(/src\s*=\s*"index2\.html"/g, `src = "${cdnPrefix}index2.html"`);
html = html.replace(/'index2\.html'/g, `'${cdnPrefix}index2.html'`); // Backup catch-all

fs.writeFileSync(destIndex, html, 'utf8');
console.log('Created single file distribution in dist/index.html with critical scripts inlined and assets on CDN.');