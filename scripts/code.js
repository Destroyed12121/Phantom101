// code editor

const state = {
    files: new Map(),
    activeFile: 'index.html',
    editor: null,
    activePanel: 'terminal'
};

state.files.set('index.html', {
    content: `<!DOCTYPE html>
<html>
<head>
  <title>My Page</title>
  <style>
      body {
          font-family: Arial, sans-serif;
          text-align: center;
          background-color: #f0f0f0;
      }
      h1 {
          color: #333;
      }
  </style>
</head>
<body>
  <h1>Welcome to My Page</h1>
  <p>This is a simple HTML example.</p>
</body>
</html>`,
    language: 'html'
});

if (typeof JSZip === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/jszip@3.10.1/dist/jszip.min.js';
    document.head.appendChild(script);
}

// linting
function lintCode(code, language) {
    const problems = [];
    if (language !== 'javascript' && language !== 'typescript') return problems;

    const lines = code.split('\n');
    lines.forEach((line, i) => {
        const num = i + 1;

        // Syntax issues
        if (/\bvar\s+/.test(line)) {
            problems.push({ type: 'warning', line: num, col: line.indexOf('var') + 1, msg: 'Use let/const instead of var' });
        }
        if (/[^=!]==[^=]/.test(line)) {
            problems.push({ type: 'warning', line: num, col: line.indexOf('==') + 1, msg: 'Use === instead of ==' });
        }
        if (/debugger/.test(line)) {
            problems.push({ type: 'error', line: num, col: line.indexOf('debugger') + 1, msg: 'Remove debugger' });
        }
        if (/catch\s*\([^)]*\)\s*\{\s*\}/.test(line)) {
            problems.push({ type: 'error', line: num, col: 1, msg: 'Empty catch block' });
        }

        // Check for common mistakes
        if (/\bconsole\.log\b/.test(line) && !/\/\//.test(line.split('console.log')[0])) {
            problems.push({ type: 'info', line: num, col: line.indexOf('console.log') + 1, msg: 'Consider removing console.log' });
        }
    });

    return problems;
}

function showProblems(problems) {
    const el = document.getElementById('problems-content');
    const errBadge = document.getElementById('error-count');
    const warnBadge = document.getElementById('warning-count');

    const errors = problems.filter(p => p.type === 'error').length;
    const warnings = problems.filter(p => p.type === 'warning').length;

    errBadge.textContent = errors + ' error' + (errors !== 1 ? 's' : '');
    errBadge.style.display = errors > 0 ? 'inline' : 'none';
    warnBadge.textContent = warnings + ' warning' + (warnings !== 1 ? 's' : '');
    warnBadge.style.display = warnings > 0 ? 'inline' : 'none';

    if (problems.length === 0) {
        el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted)">✓ No problems</div>';
    } else {
        el.innerHTML = problems.map(p => `
            <div class="problem-item ${p.type}" onclick="jumpToLine(${p.line})">
                <span style="color:${p.type === 'error' ? '#ef4444' : p.type === 'warning' ? '#f59e0b' : '#3b82f6'}">●</span>
                <span>${p.msg}</span>
                <span style="color:var(--text-dim);margin-left:auto">Ln ${p.line}</span>
            </div>
        `).join('');
    }

    // Set Monaco markers
    if (state.editor && window.monaco) {
        const markers = problems.map(p => ({
            severity: p.type === 'error' ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Warning,
            startLineNumber: p.line,
            startColumn: p.col,
            endLineNumber: p.line,
            endColumn: p.col + 10,
            message: p.msg
        }));
        monaco.editor.setModelMarkers(state.editor.getModel(), 'lint', markers);
    }
}

window.jumpToLine = (line) => {
    if (state.editor) {
        state.editor.revealLineInCenter(line);
        state.editor.setPosition({ lineNumber: line, column: 1 });
        state.editor.focus();
    }
};

// monaco
require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' } });

require(['vs/editor/editor.main'], function () {
    monaco.editor.defineTheme('phantom', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'comment', foreground: '6a737d', fontStyle: 'italic' },
            { token: 'keyword', foreground: 'c084fc' },
            { token: 'string', foreground: '22c55e' },
            { token: 'number', foreground: 'f59e0b' }
        ],
        colors: {
            'editor.background': '#0a0a0a',
            'editor.foreground': '#e4e4e7',
            'editor.lineHighlightBackground': '#151515',
            'editor.selectionBackground': '#3b82f640',
            'editorLineNumber.foreground': '#52525b'
        }
    });

    state.editor = monaco.editor.create(document.getElementById('monaco-container'), {
        value: state.files.get('index.html').content,
        language: 'html',
        theme: 'phantom',
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: 'on',
        lineNumbers: 'on',
        bracketPairColorization: { enabled: true }
    });

    state.editor.onDidChangeModelContent(() => {
        if (state.activeFile && state.files.has(state.activeFile)) {
            state.files.get(state.activeFile).content = state.editor.getValue();
        }
    });

    log('Editor ready', 'info');
});

// files
const fileTree = document.getElementById('file-tree');
const editorTabs = document.getElementById('editor-tabs');

function getFileIcon(name) {
    const ext = name.split('.').pop().toLowerCase();
    const icons = {
        js: 'fa-brands fa-js', ts: 'fa-brands fa-js',
        html: 'fa-solid fa-code', css: 'fa-brands fa-css3-alt',
        json: 'fa-solid fa-brackets-curly', md: 'fa-solid fa-file-lines'
    };
    return icons[ext] || 'fa-solid fa-file';
}

function getLanguage(name) {
    const ext = name.split('.').pop().toLowerCase();
    const langs = { js: 'javascript', ts: 'typescript', html: 'html', css: 'css', json: 'json', md: 'markdown', py: 'python' };
    return langs[ext] || 'plaintext';
}

function renderFiles() {
    if (state.files.size === 0) {
        fileTree.innerHTML = '<div class="file-tree-empty"><i class="fa-solid fa-folder-open"></i><span>Drop files here</span></div>';
        return;
    }

    let html = '';
    state.files.forEach((data, name) => {
        const active = name === state.activeFile ? 'active' : '';
        html += `
            <div class="tree-item ${active}" data-file="${name}">
                <i class="${getFileIcon(name)}"></i>
                <span class="tree-item-name">${name}</span>
                <div class="tree-item-actions">
                    <button class="tree-item-rename" data-rename="${name}" title="Rename file"><i class="fa-solid fa-pen"></i></button>
                    <button class="tree-item-delete" data-delete="${name}" title="Delete file">×</button>
                </div>
            </div>
        `;
    });
    fileTree.innerHTML = html;

    fileTree.querySelectorAll('.tree-item').forEach(el => {
        el.onclick = (e) => {
            if (e.target.closest('.tree-item-delete')) {
                deleteFile(e.target.closest('.tree-item-delete').dataset.delete);
            } else if (e.target.closest('.tree-item-rename')) {
                renameFile(e.target.closest('.tree-item-rename').dataset.rename);
            } else {
                openFile(el.dataset.file);
            }
        };
    });
}

function renderTabs() {
    let html = '';
    state.files.forEach((data, name) => {
        const active = name === state.activeFile ? 'active' : '';
        html += `
            <button class="editor-tab ${active}" data-file="${name}">
                <i class="${getFileIcon(name)}"></i>
                ${name}
                <span class="close-tab" data-close="${name}">×</span>
            </button>
        `;
    });
    editorTabs.innerHTML = html;

    editorTabs.querySelectorAll('.editor-tab').forEach(tab => {
        tab.onclick = (e) => {
            if (e.target.classList.contains('close-tab')) {
                deleteFile(e.target.dataset.close);
            } else {
                openFile(tab.dataset.file);
            }
        };
    });
}

function openFile(name) {
    if (!state.files.has(name)) return;
    state.activeFile = name;
    const data = state.files.get(name);

    if (state.editor && window.monaco) {
        monaco.editor.setModelLanguage(state.editor.getModel(), data.language);
        state.editor.setValue(data.content);
    }

    document.getElementById('language-select').value = data.language;
    renderFiles();
    renderTabs();
}

function deleteFile(name) {
    if (state.files.size <= 1) {
        if (window.Notify) Notify.warning('Cannot delete', 'Keep at least one file');
        return;
    }

    state.files.delete(name);
    log('Deleted: ' + name, 'warning');

    if (state.activeFile === name) {
        state.activeFile = state.files.keys().next().value;
        openFile(state.activeFile);
    } else {
        renderFiles();
        renderTabs();
    }
}

function addFile(name, content = '') {
    state.files.set(name, { content, language: getLanguage(name) });
    openFile(name);
    log('Added: ' + name, 'info');
}

function renameFile(oldName) {
    const newName = prompt('New name:', oldName);
    if (!newName || newName === oldName) return;

    if (state.files.has(newName)) {
        if (window.Notify) Notify.error('Error', 'File already exists');
        return;
    }

    const fileData = state.files.get(oldName);
    state.files.delete(oldName);
    state.files.set(newName, {
        ...fileData,
        language: getLanguage(newName)
    });

    if (state.activeFile === oldName) {
        state.activeFile = newName;
    }

    log(`Renamed ${oldName} to ${newName}`, 'info');
    renderFiles();
    renderTabs();
}

// drag n drop
fileTree.addEventListener('dragover', e => { e.preventDefault(); fileTree.classList.add('drag-over'); });
fileTree.addEventListener('dragleave', () => fileTree.classList.remove('drag-over'));
fileTree.addEventListener('drop', async e => {
    e.preventDefault();
    fileTree.classList.remove('drag-over');

    for (const item of e.dataTransfer.items) {
        if (item.kind === 'file') {
            const entry = item.webkitGetAsEntry?.();
            if (entry) await processEntry(entry);
            else {
                const file = item.getAsFile();
                if (file) addFile(file.name, await file.text());
            }
        }
    }
});

async function processEntry(entry, path = '') {
    if (entry.isFile) {
        entry.file(async file => {
            const name = path ? path + '/' + file.name : file.name;
            addFile(name, await file.text());
        });
    } else if (entry.isDirectory) {
        const reader = entry.createReader();
        const entries = await new Promise(r => reader.readEntries(r));
        for (const e of entries) {
            await processEntry(e, path ? path + '/' + entry.name : entry.name);
        }
    }
}

// terminal
const terminalPanel = document.getElementById('terminal-panel');
const terminalContent = document.getElementById('terminal-content');

function log(msg, type = '') {
    const line = document.createElement('div');
    line.className = 'terminal-line ' + type;
    line.textContent = '> ' + msg;
    terminalContent.appendChild(line);
    terminalContent.scrollTop = terminalContent.scrollHeight;
}

document.getElementById('terminal-header').onclick = (e) => {
    if (e.target.closest('.terminal-tab')) return;
    terminalPanel.classList.toggle('collapsed');
};

document.querySelectorAll('.terminal-tab').forEach(tab => {
    tab.onclick = (e) => {
        e.stopPropagation();
        document.querySelectorAll('.terminal-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const panel = tab.dataset.panel;
        document.getElementById('terminal-content').style.display = panel === 'terminal' ? 'block' : 'none';
        document.getElementById('problems-content').style.display = panel === 'problems' ? 'block' : 'none';
    };
});

// Terminal resize
let resizing = false;
document.getElementById('terminal-resize').addEventListener('mousedown', () => { resizing = true; });
document.addEventListener('mousemove', e => {
    if (!resizing) return;
    const h = document.querySelector('.editor-main').getBoundingClientRect().bottom - e.clientY;
    if (h >= 80 && h <= 400) terminalPanel.style.height = h + 'px';
});
document.addEventListener('mouseup', () => { resizing = false; });

// toolbar

document.getElementById('new-file-btn').onclick = () => {
    const name = prompt('File name:', 'new.js');
    if (name) addFile(name.trim());
};

document.getElementById('language-select').onchange = e => {
    if (state.editor && state.activeFile) {
        const lang = e.target.value;
        state.files.get(state.activeFile).language = lang;
        monaco.editor.setModelLanguage(state.editor.getModel(), lang);
    }
};

document.getElementById('fix-code-btn').onclick = async () => {
    if (!state.editor) return;

    const btn = document.getElementById('fix-code-btn');
    const original = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Fixing...';
    btn.disabled = true;

    try {
        await state.editor.getAction('editor.action.formatDocument').run();

        const lang = state.files.get(state.activeFile)?.language || 'javascript';
        let code = state.editor.getValue();
        let fixCount = 0;

        if (lang === 'javascript' || lang === 'typescript' || lang === 'html') {
            const originalCode = code;

            if (lang !== 'html') {
                // Better var -> const logic (default to const, then let if reassigned? No, just use let for simplicity or const for objects)
                const varRegex = /\bvar\s+([a-zA-Z0-9_$]+)\s*=\s*/g;
                let match;
                while ((match = varRegex.exec(code)) !== null) {
                    fixCount++;
                }
                code = code.replace(varRegex, 'let $1 = ');

                // Fix equality
                const eqRegex = /([^=!])={2}([^=])/g;
                while ((match = eqRegex.exec(code)) !== null) fixCount++;
                code = code.replace(eqRegex, '$1===$2');

                const neqRegex = /([^!])!={1}([^=])/g;
                while ((match = neqRegex.exec(code)) !== null) fixCount++;
                code = code.replace(neqRegex, '$1!==$2');

                // Improved console.log removal (handles nested calls safely)
                const logRegex = /console\.log\s*\(\s*(?:[^()]|\([^()]*\))*\s*\);?\s*\n?/g;
                while ((match = logRegex.exec(code)) !== null) fixCount++;
                code = code.replace(logRegex, '');

                // Add missing semicolons (basic check)
                const missingSemi = code.split('\n').map(l => {
                    const t = l.trim();
                    if (t.length > 3 && !t.endsWith(';') && !t.endsWith('{') && !t.endsWith('}') && !t.endsWith(',') && !t.includes('//')) {
                        fixCount++;
                        return l + ';';
                    }
                    return l;
                }).join('\n');
                code = missingSemi;
            }

            // Trim every line
            code = code.split('\n').map(l => l.trimEnd()).join('\n');

            // Ensure final newline
            if (code.length > 0 && !code.endsWith('\n')) {
                code += '\n';
                fixCount++;
            }

            // Important: Use executeEdits to preserve Undo/Redo stack (Ctrl+Z)
            if (code !== state.editor.getValue()) {
                const model = state.editor.getModel();
                state.editor.executeEdits('fix-code', [{
                    range: model.getFullModelRange(),
                    text: code,
                    forceMoveMarkers: true
                }]);

                // Format again to clean up any messes we made
                await state.editor.getAction('editor.action.formatDocument').run();
            }
        }

        log('Applied ' + fixCount + ' smart fixes (Press Ctrl+Z to undo)', 'info');
        if (window.Notify) Notify.success('Code Optimized', `${fixCount} improvements applied`);

    } catch (err) {
        log('Fix failed: ' + err.message, 'error');
    } finally {
        btn.innerHTML = original;
        btn.disabled = false;
        // Auto-refresh problems
        showProblems(lintCode(state.editor.getValue(), state.files.get(state.activeFile)?.language));
    }
};


// run it
document.getElementById('open-tab-btn').onclick = async () => {
    if (!state.activeFile || !state.files.has(state.activeFile)) return;

    const btn = document.getElementById('open-tab-btn');
    const original = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Running...';

    try {
        const data = state.files.get(state.activeFile);
        let content = data.content;
        const lang = data.language;

        const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        if (lang === 'html') {
            state.files.forEach((otherData, otherName) => {
                const ext = otherName.split('.').pop().toLowerCase();
                const escapedName = escapeRegExp(otherName);

                // Match both "name.js" and "./name.js"
                const patterns = [escapedName, `./${escapedName}`];

                patterns.forEach(p => {
                    const escapedP = escapeRegExp(p);
                    if (ext === 'css') {
                        const regex = new RegExp(`<link[^>]*href\\s*=\\s*(["']?)${escapedP}\\1[^>]*>`, 'gi');
                        content = content.replace(regex, `<style data-source="${otherName}">\n${otherData.content}\n</style>`);
                    } else if (ext === 'js') {
                        const regex = new RegExp(`<script[^>]*src\\s*=\\s*(["']?)${escapedP}\\1[^>]*><\\/script>`, 'gi');
                        content = content.replace(regex, `<script data-source="${otherName}">\n${otherData.content.replace(/<\/script>/g, '<\\/script>')}\n<\/script>`);
                    }
                });
            });
        } else if (lang === 'javascript') {
            const safeCode = content.replace(/<\/script>/g, '<\\/script>');
            content = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview: ${state.activeFile}</title>
    <style>
        body { background: #000; color: #fff; margin: 0; min-height: 100vh; font-family: system-ui, -apple-system, sans-serif; }
        #phantom-runtime-error { background: #1a0505; border: 1px solid #450a0a; color: #ef4444; padding: 20px; margin: 20px; border-radius: 8px; font-family: monospace; white-space: pre-wrap; }
    </style>
</head>
<body>
    <div id="root"></div>
    <script>
        window.onerror = function(msg, url, line, col, error) {
            const el = document.createElement('div');
            el.id = 'phantom-runtime-error';
            el.innerHTML = '<strong>Runtime Error:</strong>\\n' + (error?.stack || msg);
            document.body.appendChild(el);
            return false;
        };
        try {
            ${safeCode}
        } catch (err) {
            window.onerror(err.message, '', 0, 0, err);
        }
    <\/script>
</body>
</html>`;
        } else if (lang === 'css') {
            content = `<!DOCTYPE html><html><head><style>${content}</style></head><body style="background:#0a0a0a;color:#e4e4e7;font-family:sans-serif;padding:40px;text-align:center;">
                <h1 style="color:var(--accent, #c084fc)">CSS Live Preview</h1>
                <p style="color:#71717a">Reviewing: ${state.activeFile}</p>
                <div style="margin-top:40px;padding:30px;border:1px solid #333;border-radius:12px;background:#111;max-width:600px;margin-inline:auto;">
                    <h2>Sample Header</h2>
                    <p>This is a sample paragraph to see how your fonts and colors look.</p>
                    <button style="padding:10px 20px;border-radius:6px;background:#c084fc;color:white;border:none;cursor:pointer;margin-top:10px;">Sample Button</button>
                    <div style="margin-top:20px;display:flex;gap:10px;justify-content:center;">
                        <div style="width:40px;height:40px;background:#3b82f6;border-radius:4px;"></div>
                        <div style="width:40px;height:40px;background:#10b981;border-radius:4px;"></div>
                        <div style="width:40px;height:40px;background:#f59e0b;border-radius:4px;"></div>
                    </div>
                </div>
            </body></html>`;
        } else {
            content = `<!DOCTYPE html><html><head><title>${state.activeFile}</title><style>body{background:#0a0a0a;color:#e4e4e7;font-family:monospace;padding:24px;line-height:1.5;white-space:pre-wrap;}</style></head><body>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</body></html>`;
        }

        // Use Blob URL for the most reliable preview across all browsers/configs
        const blob = new Blob([content], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const win = window.open(url, '_blank');

        if (!win) {
            throw new Error('Popup blocked! Please allow popups to see the preview.');
        }

        log('Project preview successfully launched', 'info');
        if (window.Notify) Notify.success('Success', 'Preview opened in new tab');
    } catch (err) {
        log('Run failed: ' + err.message, 'error');
        if (window.Notify) Notify.error('Preview Failed', err.message);
    } finally {
        btn.innerHTML = original;
    }
};

document.getElementById('save-btn').onclick = () => {
    if (!state.activeFile) return;

    const content = state.files.get(state.activeFile).content;
    const blob = new Blob([content], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = state.activeFile;
    a.click();

    log('Downloaded: ' + state.activeFile, 'info');
    if (window.Notify) Notify.success('Saved', state.activeFile + ' downloaded');
};

document.getElementById('export-btn').onclick = async () => {
    if (typeof JSZip === 'undefined') {
        if (window.Notify) Notify.error('Error', 'JSZip not loaded');
        return;
    }

    const zip = new JSZip();
    state.files.forEach((data, name) => zip.file(name, data.content));

    try {
        const blob = await zip.generateAsync({ type: 'blob' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'project.zip';
        a.click();
        log('Exported project.zip', 'info');
        if (window.Notify) Notify.success('Exported', 'Project downloaded');
    } catch (err) {
        log('Export failed: ' + err.message, 'error');
    }
};

// keys
document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        document.getElementById('save-btn').click();
    }
    if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        document.getElementById('fix-code-btn').click();
    }
});

renderFiles();
renderTabs();
if (window.Settings) Settings.apply();
