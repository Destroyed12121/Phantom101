
        // ============================================
        // STATE MANAGEMENT
        // ============================================
        const state = {
            files: new Map(),
            activeFile: 'untitled.js',
            editor: null,
            markers: [],
            activePanel: 'terminal'
        };

        // Default starter file
        state.files.set('untitled.js', {
            content: `// Welcome to Phantom Code Editor!
// Start coding or drag files here.

function greet(name) {
    console.log(\`Hello, \${name}!\`);
}

greet('World');
`,
            language: 'javascript'
        });

        // ============================================
        // VERIFY JSZIP LOADED
        // ============================================
        if (typeof JSZip === 'undefined') {
            console.warn('JSZip not loaded from head, attempting backup load...');
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/jszip@3.10.1/dist/jszip.min.js';
            document.head.appendChild(script);
        }

        // ============================================
        // SIMPLE LINTER (JavaScript/TypeScript)
        // ============================================
        function lintCode(code, language) {
            const problems = [];
            const lines = code.split('\n');

            if (language === 'javascript' || language === 'typescript') {
                lines.forEach((line, i) => {
                    const lineNum = i + 1;
                    const trimmed = line.trim();

                    // Check for console.log (warning)
                    if (trimmed.includes('console.log')) {
                        problems.push({
                            type: 'warning',
                            line: lineNum,
                            column: line.indexOf('console.log') + 1,
                            message: 'Avoid using console.log in production code'
                        });
                    }

                    // Check for var usage (warning)
                    if (/\bvar\s+/.test(line)) {
                        problems.push({
                            type: 'warning',
                            line: lineNum,
                            column: line.indexOf('var') + 1,
                            message: 'Use "let" or "const" instead of "var"'
                        });
                    }

                    // Check for == instead of === (warning)
                    if (/[^=!]==[^=]/.test(line)) {
                        problems.push({
                            type: 'warning',
                            line: lineNum,
                            column: line.indexOf('==') + 1,
                            message: 'Use "===" instead of "==" for strict equality'
                        });
                    }

                    // Check for != instead of !== (warning)
                    if (/[^!]!=[^=]/.test(line)) {
                        problems.push({
                            type: 'warning',
                            line: lineNum,
                            column: line.indexOf('!=') + 1,
                            message: 'Use "!==" instead of "!=" for strict inequality'
                        });
                    }

                    // Check for debugger statement (error)
                    if (trimmed.includes('debugger')) {
                        problems.push({
                            type: 'error',
                            line: lineNum,
                            column: line.indexOf('debugger') + 1,
                            message: 'Remove debugger statement'
                        });
                    }

                    // Check for trailing whitespace (info)
                    if (line.endsWith(' ') || line.endsWith('\t')) {
                        problems.push({
                            type: 'warning',
                            line: lineNum,
                            column: line.length,
                            message: 'Trailing whitespace'
                        });
                    }

                    // Check for TODO/FIXME comments
                    if (/\/\/\s*(TODO|FIXME|HACK|XXX)/i.test(line)) {
                        problems.push({
                            type: 'warning',
                            line: lineNum,
                            column: 1,
                            message: 'Found TODO/FIXME comment'
                        });
                    }

                    // Check for empty catch blocks
                    if (/catch\s*\([^)]*\)\s*\{\s*\}/.test(line)) {
                        problems.push({
                            type: 'error',
                            line: lineNum,
                            column: line.indexOf('catch') + 1,
                            message: 'Empty catch block - handle or log the error'
                        });
                    }
                });
            }

            return problems;
        }

        function updateProblemsPanel(problems) {
            const content = document.getElementById('problems-content');
            const errorCount = document.getElementById('error-count');
            const warningCount = document.getElementById('warning-count');

            const errors = problems.filter(p => p.type === 'error').length;
            const warnings = problems.filter(p => p.type === 'warning').length;

            errorCount.textContent = `${errors} error${errors !== 1 ? 's' : ''}`;
            errorCount.style.display = errors > 0 ? 'inline' : 'none';

            warningCount.textContent = `${warnings} warning${warnings !== 1 ? 's' : ''}`;
            warningCount.style.display = warnings > 0 ? 'inline' : 'none';

            if (problems.length === 0) {
                content.innerHTML = `
                    <div style="color: var(--text-muted); text-align: center; padding: 20px;">
                        <i class="fa-solid fa-check-circle" style="color: #22c55e; font-size: 1.5rem; display: block; margin-bottom: 8px;"></i>
                        No problems found!
                    </div>
                `;
            } else {
                content.innerHTML = problems.map(p => `
                    <div class="problem-item ${p.type}" data-line="${p.line}">
                        <i class="fa-solid fa-${p.type === 'error' ? 'circle-xmark' : 'triangle-exclamation'}"></i>
                        <span class="problem-text">${p.message}</span>
                        <span class="problem-location">Ln ${p.line}, Col ${p.column}</span>
                    </div>
                `).join('');

                // Click to jump to line
                content.querySelectorAll('.problem-item').forEach(item => {
                    item.onclick = () => {
                        const line = parseInt(item.dataset.line);
                        if (state.editor) {
                            state.editor.revealLineInCenter(line);
                            state.editor.setPosition({ lineNumber: line, column: 1 });
                            state.editor.focus();
                        }
                    };
                });
            }

            // Update Monaco markers
            if (state.editor && window.monaco) {
                const model = state.editor.getModel();
                const markers = problems.map(p => ({
                    severity: p.type === 'error' ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Warning,
                    startLineNumber: p.line,
                    startColumn: p.column,
                    endLineNumber: p.line,
                    endColumn: p.column + 10,
                    message: p.message,
                    source: 'Phantom Lint'
                }));
                monaco.editor.setModelMarkers(model, 'phantom-lint', markers);
            }
        }

        // ============================================
        // MONACO EDITOR SETUP
        // ============================================
        require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' } });

        require(['vs/editor/editor.main'], function () {
            // Define Phantom dark theme
            monaco.editor.defineTheme('phantom-dark', {
                base: 'vs-dark',
                inherit: true,
                rules: [
                    { token: 'comment', foreground: '6a737d', fontStyle: 'italic' },
                    { token: 'keyword', foreground: 'c084fc' },
                    { token: 'string', foreground: '22c55e' },
                    { token: 'number', foreground: 'f59e0b' },
                    { token: 'function', foreground: '60a5fa' }
                ],
                colors: {
                    'editor.background': '#0a0a0a',
                    'editor.foreground': '#e4e4e7',
                    'editor.lineHighlightBackground': '#1a1a1a',
                    'editor.selectionBackground': '#3b82f640',
                    'editorCursor.foreground': '#ffffff',
                    'editorLineNumber.foreground': '#52525b',
                    'editorLineNumber.activeForeground': '#a1a1aa'
                }
            });

            // Create editor
            state.editor = monaco.editor.create(document.getElementById('monaco-container'), {
                value: state.files.get('untitled.js').content,
                language: 'javascript',
                theme: 'phantom-dark',
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                insertSpaces: true,
                wordWrap: 'on',
                lineNumbers: 'on',
                renderWhitespace: 'selection',
                bracketPairColorization: { enabled: true },
                formatOnPaste: true,
                formatOnType: true
            });

            // Save content on change
            state.editor.onDidChangeModelContent(() => {
                if (state.activeFile && state.files.has(state.activeFile)) {
                    state.files.get(state.activeFile).content = state.editor.getValue();
                }
            });

            // Show welcome notification
            if (window.Notify) {
                Notify.info('Code Editor', 'Welcome! Drag files or start coding.');
            }

            logTerminal('Monaco Editor initialized', 'info');
            logTerminal('JSZip ' + (typeof JSZip !== 'undefined' ? 'loaded ✓' : 'not loaded ✗'), typeof JSZip !== 'undefined' ? 'info' : 'error');
        });

        // ============================================
        // TERMINAL TAB SWITCHING
        // ============================================
        document.querySelectorAll('.terminal-tab').forEach(tab => {
            tab.onclick = (e) => {
                e.stopPropagation();
                document.querySelectorAll('.terminal-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const panel = tab.dataset.panel;
                state.activePanel = panel;

                document.getElementById('terminal-content').style.display = panel === 'terminal' ? 'block' : 'none';
                document.getElementById('problems-content').style.display = panel === 'problems' ? 'block' : 'none';
            };
        });

        // ============================================
        // FILE TREE MANAGEMENT
        // ============================================
        const fileTree = document.getElementById('file-tree');
        const editorTabs = document.getElementById('editor-tabs');

        function getFileIcon(filename) {
            const ext = filename.split('.').pop().toLowerCase();
            const icons = {
                'js': { icon: 'fa-brands fa-js', class: 'js-icon' },
                'ts': { icon: 'fa-brands fa-js', class: 'js-icon' },
                'html': { icon: 'fa-solid fa-code', class: 'html-icon' },
                'css': { icon: 'fa-brands fa-css3-alt', class: 'css-icon' },
                'json': { icon: 'fa-solid fa-brackets-curly', class: 'json-icon' },
                'md': { icon: 'fa-solid fa-file-lines', class: 'file-icon' },
                'txt': { icon: 'fa-solid fa-file-lines', class: 'file-icon' }
            };
            return icons[ext] || { icon: 'fa-solid fa-file', class: 'file-icon' };
        }

        function getLanguage(filename) {
            const ext = filename.split('.').pop().toLowerCase();
            const languages = {
                'js': 'javascript',
                'ts': 'typescript',
                'html': 'html',
                'css': 'css',
                'json': 'json',
                'md': 'markdown',
                'py': 'python',
                'txt': 'plaintext'
            };
            return languages[ext] || 'plaintext';
        }

        function renderFileTree() {
            if (state.files.size === 0) {
                fileTree.innerHTML = `
                    <div class="file-tree-empty">
                        <i class="fa-solid fa-folder-open"></i>
                        <span>Drag & drop files or folders here<br>or click + to create new</span>
                    </div>
                `;
                return;
            }

            let html = '';
            state.files.forEach((data, filename) => {
                const iconData = getFileIcon(filename);
                const isActive = filename === state.activeFile;
                html += `
                    <div class="tree-item ${isActive ? 'active' : ''}" data-file="${filename}">
                        <i class="${iconData.icon} ${iconData.class}"></i>
                        <span>${filename}</span>
                    </div>
                `;
            });
            fileTree.innerHTML = html;

            fileTree.querySelectorAll('.tree-item').forEach(item => {
                item.onclick = () => openFile(item.dataset.file);
            });
        }

        function renderTabs() {
            let html = '';
            state.files.forEach((data, filename) => {
                const iconData = getFileIcon(filename);
                const isActive = filename === state.activeFile;
                html += `
                    <button class="editor-tab ${isActive ? 'active' : ''}" data-file="${filename}">
                        <i class="${iconData.icon} ${iconData.class}"></i>
                        ${filename}
                        <span class="close-tab" data-close="${filename}"><i class="fa-solid fa-xmark"></i></span>
                    </button>
                `;
            });
            editorTabs.innerHTML = html;

            editorTabs.querySelectorAll('.editor-tab').forEach(tab => {
                tab.onclick = (e) => {
                    if (e.target.closest('.close-tab')) {
                        closeFile(e.target.closest('.close-tab').dataset.close);
                    } else {
                        openFile(tab.dataset.file);
                    }
                };
            });
        }

        function openFile(filename) {
            if (!state.files.has(filename)) return;

            state.activeFile = filename;
            const fileData = state.files.get(filename);

            if (state.editor) {
                monaco.editor.setModelLanguage(state.editor.getModel(), fileData.language);
                state.editor.setValue(fileData.content);
            }

            // Update language selector
            document.getElementById('language-select').value = fileData.language;
            renderFileTree();
            renderTabs();
        }

        function closeFile(filename) {
            if (state.files.size <= 1) {
                if (window.Notify) Notify.warning('Cannot close', 'At least one file must remain open');
                return;
            }

            state.files.delete(filename);

            if (state.activeFile === filename) {
                state.activeFile = state.files.keys().next().value;
                openFile(state.activeFile);
            }

            renderFileTree();
            renderTabs();
            logTerminal(`Closed: ${filename}`);
        }

        function addFile(filename, content = '') {
            const language = getLanguage(filename);
            state.files.set(filename, { content, language });
            renderFileTree();
            renderTabs();
            openFile(filename);
            logTerminal(`Added: ${filename}`, 'info');
        }

        // ============================================
        // DRAG AND DROP
        // ============================================
        fileTree.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileTree.classList.add('drag-over');
        });

        fileTree.addEventListener('dragleave', () => {
            fileTree.classList.remove('drag-over');
        });

        fileTree.addEventListener('drop', async (e) => {
            e.preventDefault();
            fileTree.classList.remove('drag-over');

            const items = e.dataTransfer.items;

            for (const item of items) {
                if (item.kind === 'file') {
                    const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;

                    if (entry) {
                        await processEntry(entry);
                    } else {
                        const file = item.getAsFile();
                        if (file) {
                            await readFile(file);
                        }
                    }
                }
            }

            if (window.Notify) Notify.success('Files added', 'Files have been loaded into the editor');
        });

        async function processEntry(entry, path = '') {
            if (entry.isFile) {
                entry.file(async (file) => {
                    const filename = path ? `${path}/${file.name}` : file.name;
                    await readFileWithName(file, filename);
                });
            } else if (entry.isDirectory) {
                const reader = entry.createReader();
                const entries = await new Promise((resolve) => {
                    reader.readEntries(resolve);
                });

                for (const subEntry of entries) {
                    await processEntry(subEntry, path ? `${path}/${entry.name}` : entry.name);
                }
            }
        }

        async function readFile(file) {
            await readFileWithName(file, file.name);
        }

        async function readFileWithName(file, filename) {
            try {
                const content = await file.text();
                addFile(filename, content);
            } catch (err) {
                logTerminal(`Error reading ${filename}: ${err.message}`, 'error');
            }
        }

        // ============================================
        // NEW FILE / FOLDER
        // ============================================
        document.getElementById('new-file-btn').onclick = () => {
            const filename = prompt('Enter filename:', 'newfile.js');
            if (filename) {
                addFile(filename, '');
            }
        };

        document.getElementById('new-folder-btn').onclick = () => {
            if (window.Notify) {
                Notify.info('Folders', 'Drag and drop a folder to add it, or create files with paths like "folder/file.js"');
            }
        };

        // ============================================
        // LANGUAGE SELECTOR
        // ============================================
        document.getElementById('language-select').onchange = (e) => {
            const newLanguage = e.target.value;
            if (state.editor && state.activeFile && state.files.has(state.activeFile)) {
                // Update the file's language
                state.files.get(state.activeFile).language = newLanguage;
                // Update Monaco editor language
                monaco.editor.setModelLanguage(state.editor.getModel(), newLanguage);
                logTerminal(`Language changed to ${newLanguage}`, 'info');
            }
        };

        // ============================================
        // OPEN IN NEW TAB
        // ============================================
        document.getElementById('open-tab-btn').onclick = () => {
            if (!state.activeFile || !state.files.has(state.activeFile)) return;

            const fileData = state.files.get(state.activeFile);
            const content = fileData.content;
            const language = fileData.language;

            // Determine MIME type
            const mimeTypes = {
                'html': 'text/html',
                'css': 'text/css',
                'javascript': 'text/javascript',
                'json': 'application/json',
                'markdown': 'text/markdown',
                'plaintext': 'text/plain'
            };
            const mimeType = mimeTypes[language] || 'text/plain';

            // Create blob and open in new tab
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);

            // For HTML, open directly. For others, wrap in a simple HTML viewer
            if (language === 'html') {
                window.open(url, '_blank');
            } else {
                // Create a simple viewer for non-HTML files
                const viewerHtml = `<!DOCTYPE html>
<html>
<head>
    <title>${state.activeFile}</title>
    <style>
        body { margin: 0; background: #0a0a0a; color: #e4e4e7; font-family: 'JetBrains Mono', monospace; }
        pre { margin: 0; padding: 20px; white-space: pre-wrap; word-wrap: break-word; }
    </style>
</head>
<body>
    <pre>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
</body>
</html>`;
                const viewerBlob = new Blob([viewerHtml], { type: 'text/html' });
                const viewerUrl = URL.createObjectURL(viewerBlob);
                window.open(viewerUrl, '_blank');
            }

            logTerminal(`Opened ${state.activeFile} in new tab`, 'info');
            if (window.Notify) Notify.success('Opened', `${state.activeFile} opened in new tab`);
        };

        // ============================================
        // FIX CODE (Format + AutoFix basic issues)
        // ============================================
        document.getElementById('fix-code-btn').onclick = async () => {
            if (!state.editor) return;

            try {
                // Format using Monaco
                await state.editor.getAction('editor.action.formatDocument').run();

                // Get current code and apply simple fixes
                let code = state.editor.getValue();
                const language = state.files.get(state.activeFile)?.language || 'javascript';

                if (language === 'javascript' || language === 'typescript') {
                    // Fix var -> let
                    code = code.replace(/\bvar\s+/g, 'let ');

                    // Fix == to === (be careful with existing ===)
                    code = code.replace(/([^=!])={2}([^=])/g, '$1===$2');
                    code = code.replace(/([^!])!={1}([^=])/g, '$1!==$2');

                    // Remove trailing whitespace
                    code = code.split('\n').map(line => line.trimEnd()).join('\n');

                    state.editor.setValue(code);
                }

                logTerminal('Code formatted and fixed!', 'info');
                if (window.Notify) Notify.success('Fixed', 'Code has been formatted and auto-fixed');

                // Re-run lint to show remaining issues
                const problems = lintCode(code, language);
                updateProblemsPanel(problems);

            } catch (err) {
                logTerminal(`Format error: ${err.message}`, 'error');
                if (window.Notify) Notify.error('Format failed', err.message);
            }
        };

        // ============================================
        // LINT CODE
        // ============================================
        document.getElementById('lint-btn').onclick = () => {
            if (!state.editor) return;

            const code = state.editor.getValue();
            const language = state.files.get(state.activeFile)?.language || 'javascript';

            const problems = lintCode(code, language);
            updateProblemsPanel(problems);

            // Switch to problems panel
            document.querySelectorAll('.terminal-tab').forEach(t => t.classList.remove('active'));
            document.querySelector('.terminal-tab[data-panel="problems"]').classList.add('active');
            document.getElementById('terminal-content').style.display = 'none';
            document.getElementById('problems-content').style.display = 'block';

            const errorCount = problems.filter(p => p.type === 'error').length;
            const warningCount = problems.filter(p => p.type === 'warning').length;

            logTerminal(`Lint complete: ${errorCount} errors, ${warningCount} warnings`, errorCount > 0 ? 'error' : (warningCount > 0 ? 'warning' : 'info'));

            if (window.Notify) {
                if (errorCount > 0) {
                    Notify.error('Lint Results', `Found ${errorCount} error(s) and ${warningCount} warning(s)`);
                } else if (warningCount > 0) {
                    Notify.warning('Lint Results', `Found ${warningCount} warning(s)`);
                } else {
                    Notify.success('Lint Results', 'No problems found!');
                }
            }
        };

        // ============================================
        // SAVE FILE
        // ============================================
        document.getElementById('save-btn').onclick = () => {
            if (!state.activeFile || !state.files.has(state.activeFile)) return;

            const content = state.files.get(state.activeFile).content;
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = state.activeFile;
            a.click();

            URL.revokeObjectURL(url);
            logTerminal(`Saved: ${state.activeFile}`, 'info');
            if (window.Notify) Notify.success('Saved', `Downloaded ${state.activeFile}`);
        };

        // ============================================
        // EXPORT PROJECT (ZIP)
        // ============================================
        document.getElementById('export-btn').onclick = async () => {
            if (typeof JSZip === 'undefined') {
                logTerminal('JSZip not available, attempting reload...', 'warning');
                if (window.Notify) Notify.warning('Loading...', 'Loading JSZip library...');

                // Try to load JSZip dynamically
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://unpkg.com/jszip@3.10.1/dist/jszip.min.js';
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });

                // Wait a bit for it to initialize
                await new Promise(r => setTimeout(r, 500));

                if (typeof JSZip === 'undefined') {
                    logTerminal('Failed to load JSZip', 'error');
                    if (window.Notify) Notify.error('Error', 'Could not load JSZip library');
                    return;
                }
            }

            logTerminal('Creating ZIP archive...', 'info');

            const zip = new JSZip();

            state.files.forEach((data, filename) => {
                zip.file(filename, data.content);
            });

            try {
                const blob = await zip.generateAsync({ type: 'blob' });
                const url = URL.createObjectURL(blob);

                const a = document.createElement('a');
                a.href = url;
                a.download = 'project.zip';
                a.click();

                URL.revokeObjectURL(url);
                logTerminal('Project exported as project.zip', 'info');
                if (window.Notify) Notify.success('Exported', 'Project downloaded as project.zip');
            } catch (err) {
                logTerminal(`Export error: ${err.message}`, 'error');
                if (window.Notify) Notify.error('Export failed', err.message);
            }
        };

        // ============================================
        // TERMINAL
        // ============================================
        const terminalPanel = document.getElementById('terminal-panel');
        const terminalContent = document.getElementById('terminal-content');
        const terminalToggle = document.getElementById('terminal-toggle');

        document.getElementById('terminal-header').onclick = (e) => {
            if (e.target.closest('.terminal-tab')) return; // Don't toggle when clicking tabs
            terminalPanel.classList.toggle('collapsed');
            const icon = terminalToggle.querySelector('i');
            icon.className = terminalPanel.classList.contains('collapsed')
                ? 'fa-solid fa-chevron-up'
                : 'fa-solid fa-chevron-down';
        };

        function logTerminal(message, type = '') {
            const line = document.createElement('div');
            line.className = `terminal-line ${type}`;
            line.textContent = `> ${message}`;
            terminalContent.appendChild(line);
            terminalContent.scrollTop = terminalContent.scrollHeight;
        }

        // Terminal resize
        let isResizing = false;
        document.getElementById('terminal-resize').addEventListener('mousedown', (e) => {
            isResizing = true;
            document.body.style.cursor = 'ns-resize';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            const container = document.querySelector('.editor-main');
            const newHeight = container.getBoundingClientRect().bottom - e.clientY;
            if (newHeight >= 100 && newHeight <= 500) {
                terminalPanel.style.height = newHeight + 'px';
            }
        });

        document.addEventListener('mouseup', () => {
            isResizing = false;
            document.body.style.cursor = '';
        });

        // ============================================
        // KEYBOARD SHORTCUTS
        // ============================================
        document.addEventListener('keydown', (e) => {
            // Ctrl+S = Save
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                document.getElementById('save-btn').click();
            }
            // Ctrl+Shift+F = Format
            if (e.ctrlKey && e.shiftKey && e.key === 'F') {
                e.preventDefault();
                document.getElementById('fix-code-btn').click();
            }
            // Ctrl+Shift+L = Lint
            if (e.ctrlKey && e.shiftKey && e.key === 'L') {
                e.preventDefault();
                document.getElementById('lint-btn').click();
            }
        });

        // Initial render
        renderFileTree();
        renderTabs();

        // Apply settings
        if (window.Settings) {
            Settings.apply();
        }
