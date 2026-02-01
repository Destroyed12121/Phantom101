
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const exclude = ['staticsjv2', 'node_modules', '.git', 'tmp', '.gemini'];
const skipFiles = ['singlefile.html', 'make-single.js', 'inline-site.js', 'make_single.py', 'bundle.py', 'vfs.json'];

function getMime(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimes = {
        '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
        '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
        '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
        '.ico': 'image/x-icon', '.wasm': 'application/wasm', '.woff': 'font/woff',
        '.woff2': 'font/woff2', '.ttf': 'font/ttf'
    };
    return mimes[ext] || 'application/octet-stream';
}

function inlineFile(filePath) {
    const baseDir = path.dirname(filePath);
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Inline CSS <link>
    content = content.replace(/<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi, (match, href) => {
        if (href.startsWith('http') || href.startsWith('data:')) return match;
        const fullPath = path.resolve(baseDir, href);
        if (fs.existsSync(fullPath)) {
            let css = fs.readFileSync(fullPath, 'utf8');
            css = css.replace(/url\((.*?)\)/gi, (m, url) => {
                const u = url.trim().replace(/^["']|["']$/g, '');
                if (u.startsWith('http') || u.startsWith('data:') || u.startsWith('#') || u.startsWith('blob:')) return m;
                const assetPath = path.resolve(path.dirname(fullPath), u);
                if (fs.existsSync(assetPath)) {
                    const data = fs.readFileSync(assetPath);
                    return `url("data:${getMime(assetPath)};base64,${data.toString('base64')}")`;
                }
                return m;
            });
            return `<style>\n${css}\n</style>`;
        }
        return match;
    });

    // 2. Inline Scripts <script src="...">
    content = content.replace(/<script\s+[^>]*src=["']([^"']+)["'][^>]*>\s*<\/script>/gi, (match, src) => {
        if (src.startsWith('http') || src.startsWith('data:')) return match;
        const fullPath = path.resolve(baseDir, src);
        if (fs.existsSync(fullPath)) {
            const js = fs.readFileSync(fullPath, 'utf8');
            return `<script>\n${js.replace(/<\/script>/g, '<\\/script>')}\n</script>`;
        }
        return match;
    });

    // 3. Inline Images <img src="...">
    content = content.replace(/src=["']([^"']+\.(png|jpg|jpeg|gif|svg|webp|ico))["']/gi, (match, src) => {
        if (src.startsWith('http') || src.startsWith('data:')) return match;
        const fullPath = path.resolve(baseDir, src);
        if (fs.existsSync(fullPath)) {
            const data = fs.readFileSync(fullPath);
            return `src="data:${getMime(fullPath)};base64,${data.toString('base64')}"`;
        }
        return match;
    });

    return content;
}

function walk(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const relPath = path.relative(root, fullPath).replace(/\\/g, '/');
        if (exclude.some(ex => relPath.startsWith(ex))) continue;
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath, fileList);
        } else if (file.endsWith('.html') && !skipFiles.includes(file)) {
            fileList.push(fullPath);
        }
    }
    return fileList;
}

console.log('--- Phantom Ultimate Single-File Builder v2 ---');
const htmlFiles = walk(root);
const vfs = {};

htmlFiles.forEach(fp => {
    const rel = path.relative(root, fp).replace(/\\/g, '/');
    console.log(`  > Packing: ${rel}`);
    vfs[rel] = inlineFile(fp);
});

const bootloader = `
<script id="phantom-bootloader">
(function() {
    window.VFS_DATA = window.VFS_DATA || parent.VFS_DATA || ${JSON.stringify(vfs)};
    window.CURRENT_VFS_PATH = window.CURRENT_VFS_PATH || "";

    if (window === top) {
        let p = window.location.pathname;
        window.STATICSJ_BASE_PATH = p.substring(0, p.lastIndexOf('/') + 1) + "staticsjv2/";
    } else {
        window.STATICSJ_BASE_PATH = parent.STATICSJ_BASE_PATH;
    }

    function normalize(path, base = "") {
        if (!path || path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:') || path.startsWith('#')) return path;
        let p = path.split('?')[0].split('#')[0].replace(/\\\\/g, '/');
        if (p.startsWith(window.origin)) p = p.substring(window.origin.length);
        if (p.startsWith('/')) p = p.substring(1);
        
        let bParts = base.split('/').filter(x => x);
        if (bParts.length > 0 && !base.endsWith('/')) bParts.pop();
        p.split('/').forEach(part => {
            if (part === '..') bParts.pop();
            else if (part !== '.' && part !== '') bParts.push(part);
        });
        return bParts.join('/');
    }

    const desc = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'src');
    Object.defineProperty(HTMLIFrameElement.prototype, 'src', {
        set: function(v) {
            const norm = normalize(v, window.CURRENT_VFS_PATH);
            const entry = window.VFS_DATA[norm] || window.VFS_DATA[norm + '.html'];
            if (entry) {
                const bCode = document.getElementById('phantom-bootloader').outerHTML;
                this.srcdoc = bCode + '<script>window.CURRENT_VFS_PATH="' + norm + '";<\\/script>' + entry;
                // Force a load event trigger for the parent's handlers
                setTimeout(() => { this.dispatchEvent(new Event('load')); }, 10);
            } else {
                desc.set.call(this, v);
            }
        },
        get: desc.get
    });

    window.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('iframe').forEach(el => {
            const src = el.getAttribute('src');
            if (src) el.src = src;
        });
        document.querySelectorAll('a').forEach(el => {
            const href = el.getAttribute('href');
            if (href) {
                const norm = normalize(href, window.CURRENT_VFS_PATH);
                if (window.VFS_DATA[norm] || window.VFS_DATA[norm + '.html']) {
                    el.onclick = (e) => {
                        const frame = document.getElementById('main-frame');
                        if (frame) { e.preventDefault(); frame.src = href; }
                    };
                }
            }
        });
    });
})();
</script>
`;

let indexHtml = inlineFile(path.join(root, 'index.html'));

// Safety catch: Inject bootloader and fix potential script errors
indexHtml = indexHtml.replace('<head>', '<head>' + bootloader);
indexHtml = indexHtml.replace('Settings.apply()', 'try { Settings.apply() } catch(e) { console.error("Settings failed", e) }');

fs.writeFileSync('singlefile.html', indexHtml);
console.log('\nDONE! singlefile.html is ready.');
