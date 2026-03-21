// talking to robots
class PhantomChat {
    constructor() {
        this.state = {
            conversations: [],
            currentId: null,
            models: { text: [], image: [] },
            config: {
                textModel: 'openai',
                imageModel: 'flux',
                mode: 'text',
                autoSave: true
            }
        };

        this.placeholders = [
            "Whats a good book to read?",
            "Whats the weather like today?",
            "Help me with my homework",
            "What happened in the last NBA game?",
            "What is the biggest news story today?",
            "Help me finish the worksheet in this picture",
            "Write a poem about the stars"
        ];

        this.dom = {};
        this.storageKey = 'phantom_ai_data';
        this.apiKey = 'sk_j66iDfX2lPbTZ2Otb9MI7xje7kRZQUyE';
        this.baseTextUrl = 'https://gen.pollinations.ai/v1/chat/completions';
        this.baseImageUrl = 'https://gen.pollinations.ai/image/';
        this.currentAttachments = [];

        this.init();
    }

    init() {
        this.cacheDOM();
        this.loadState();
        this.bindEvents();
        this.fetchModels();
        this.render();
        this.startPlaceholderAnimation();

        if (window.Notify) {
            Notify.success('Ready', 'Phantom AI is loaded');
        }
    }

    cacheDOM() {
        this.dom = {
            app: document.getElementById('chatApp'),
            sidebar: document.getElementById('chatSidebar'),
            sidebarOverlay: document.getElementById('sidebarOverlay'),
            chatBody: document.getElementById('chatBody'),
            input: document.getElementById('chatInput'),
            sendBtn: document.getElementById('sendBtn'),
            stopBtn: document.getElementById('stopBtn'),
            modelSelect: document.getElementById('modelSelector'),
            hero: document.getElementById('heroSection'),
            convList: document.getElementById('conversationsList'),
            title: document.getElementById('chatTitle'),
            attachBtn: document.getElementById('attachBtn'),
            attachMenu: document.getElementById('attachMenu'),
            uploadFileBtn: document.getElementById('uploadFileBtn'),
            takePhotoBtn: document.getElementById('takePhotoBtn'),
            screenshotBtn: document.getElementById('screenshotBtn'),
            fileInput: document.getElementById('fileInput'),
            cameraInput: document.getElementById('cameraInput'),
            attachmentPreview: document.getElementById('attachmentPreview'),
            inputContainer: document.getElementById('inputContainer')
        };
    }

    bindEvents() {
        document.addEventListener('click', (e) => {
            const target = e.target;

            if (target.closest('#menuToggle') || target.closest('#sidebarToggle')) {
                this.toggleSidebar();
            }
            if (target.closest('#newChatBtn')) {
                this.createConversation();
            }
            if (target.closest('.mode-btn') && !target.closest('#attachBtn')) {
                this.setMode(target.closest('.mode-btn').dataset.mode);
            }
            if (target.id === 'sidebarOverlay') {
                this.toggleSidebar(false);
            }
            
            // Close attach menu if clicking outside
            if (this.dom.attachMenu && this.dom.attachMenu.classList.contains('active')) {
                if (!target.closest('.attach-dropdown-container')) {
                    this.dom.attachMenu.classList.remove('active');
                }
            }
        });

        this.dom.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
            // Add Ctrl+Shift+S for screenshot
            if (e.ctrlKey && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                this.takeScreenshot();
            }
        });

        if (this.dom.stopBtn) {
            this.dom.stopBtn.addEventListener('click', () => {
                if (this.abortController) {
                    this.abortController.abort();
                }
            });
        }

        this.dom.input.addEventListener('input', () => {
            this.autoResizeInput();
            this.updateSendButton();
        });

        this.dom.input.addEventListener('paste', (e) => {
            const items = (e.clipboardData || e.originalEvent.clipboardData).items;
            const files = [];
            for (const item of items) {
                if (item.kind === 'file') {
                    files.push(item.getAsFile());
                }
            }
            if (files.length > 0) {
                this.handleFiles(files);
            }
        });

        if (this.dom.attachBtn) {
            this.dom.attachBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.dom.attachMenu.classList.toggle('active');
            });
        }

        if (this.dom.uploadFileBtn) {
            this.dom.uploadFileBtn.addEventListener('click', () => {
                this.dom.attachMenu.classList.remove('active');
                this.dom.fileInput.click();
            });
        }
        if (this.dom.takePhotoBtn) {
            this.dom.takePhotoBtn.addEventListener('click', () => {
                this.dom.attachMenu.classList.remove('active');
                
                // Extra check for mobile/tablet or systems with cameras
                if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
                    navigator.mediaDevices.enumerateDevices().then(devices => {
                        const hasCamera = devices.some(device => device.kind === 'videoinput');
                        if (!hasCamera) {
                            if (window.Notify) Notify.warning('No Camera Found', 'A camera is required to take a photo.');
                        }
                    });
                }
                
                this.dom.cameraInput.click();
            });
        }

        if (this.dom.screenshotBtn) {
            this.dom.screenshotBtn.addEventListener('click', () => {
                this.dom.attachMenu.classList.remove('active');
                this.takeScreenshot();
            });
        }

        if (this.dom.fileInput) {
            this.dom.fileInput.addEventListener('change', (e) => {
                const files = Array.from(e.target.files);
                this.handleFiles(files);
                e.target.value = ''; // reset
            });
        }

        if (this.dom.cameraInput) {
            this.dom.cameraInput.addEventListener('change', (e) => {
                const files = Array.from(e.target.files);
                this.handleFiles(files);
                e.target.value = ''; // reset
            });
        }

        if (this.dom.inputContainer) {
            this.dom.inputContainer.addEventListener('dragover', (e) => {
                e.preventDefault();
                this.dom.inputContainer.classList.add('dragover');
            });
            this.dom.inputContainer.addEventListener('dragleave', (e) => {
                e.preventDefault();
                this.dom.inputContainer.classList.remove('dragover');
            });
            this.dom.inputContainer.addEventListener('drop', (e) => {
                e.preventDefault();
                this.dom.inputContainer.classList.remove('dragover');
                if (e.dataTransfer.files) {
                    const files = Array.from(e.dataTransfer.files);
                    this.handleFiles(files);
                }
            });
        }

        this.dom.modelSelect.addEventListener('change', (e) => {
            const key = this.state.config.mode === 'text' ? 'textModel' : 'imageModel';
            this.state.config[key] = e.target.value;
            this.saveState();
            if (window.Notify) Notify.success('Model Changed', e.target.value);
        });

        this.dom.sendBtn.addEventListener('click', () => this.sendMessage());
    }

    updateSendButton() {
        const hasText = this.dom.input.value.trim().length > 0;
        const hasAttachments = this.currentAttachments.length > 0;
        this.dom.sendBtn.disabled = !hasText && !hasAttachments;
    }

    async handleFiles(files) {
        const remainingSpace = 3 - this.currentAttachments.length;
        if (remainingSpace <= 0) {
            if (window.Notify) Notify.error('Limit Reached', 'Maximum 3 attachments are currently allowed');
            return;
        }

        if (files.length > remainingSpace) {
            if (window.Notify) Notify.warning('Limit Reached', `Only ${remainingSpace} attachment(s) will be added to stay under the 3 file limit`);
        }

        const filesToAdd = files.slice(0, remainingSpace);

        for (const file of filesToAdd) {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.currentAttachments.push({ type: 'image', data: e.target.result });
                    this.renderAttachments();
                    this.updateSendButton();
                };
                reader.readAsDataURL(file);
            } else {
                const reader = new FileReader();
                reader.onload = (e) => {
                    let textData = e.target.result;
                    const MAX_CHARS = 15000;
                    if (textData.length > MAX_CHARS) {
                        textData = textData.substring(0, MAX_CHARS) + "\n\n... (File truncated for length) ...";
                        if (window.Notify) Notify.warning('File Truncated', `The file "${file.name}" was truncated to 15,000 characters to fit memory limits.`);
                    }
                    this.currentAttachments.push({ type: 'file', name: file.name, data: textData });
                    this.renderAttachments();
                    this.updateSendButton();
                };
                reader.readAsText(file);
            }
        }
    }

    async takeScreenshot() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
                if (window.Notify) Notify.error('Feature Unavailable', 'Screen capture is not supported in this browser.');
                return;
            }

            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { cursor: "always" },
                audio: false
            });

            // Create a hidden video element to capture the frame
            const video = document.createElement('video');
            video.srcObject = stream;
            
            // Wait for metadata to load so we know dimensions
            await new Promise((resolve) => {
                video.onloadedmetadata = () => {
                    video.play().then(resolve);
                };
            });

            // Capture the current frame
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Convert to base64
            const dataUrl = canvas.toDataURL('image/png');

            // Stop all tracks in the stream
            stream.getTracks().forEach(track => track.stop());

            // Add to attachments
            if (this.currentAttachments.length >= 3) {
                 if (window.Notify) Notify.error('Limit Reached', 'Maximum 3 attachments allowed. Please remove one first.');
                 return;
            }

            this.currentAttachments.push({ type: 'image', data: dataUrl });
            this.renderAttachments();
            this.updateSendButton();

            if (window.Notify) Notify.success('Captured', 'Screenshot added to attachments');
            
        } catch (err) {
            console.error('Screenshot error:', err);
            if (err.name !== 'NotAllowedError') { // Don't notify if user just cancelled
                if (window.Notify) Notify.error('Capture Failed', 'Could not take screenshot: ' + err.message);
            }
        }
    }

    removeAttachment(index) {
        this.currentAttachments.splice(index, 1);
        this.renderAttachments();
        this.updateSendButton();
    }

    renderAttachments() {
        if (!this.dom.attachmentPreview) return;
        
        if (this.currentAttachments.length === 0) {
            this.dom.attachmentPreview.style.display = 'none';
            this.dom.attachmentPreview.innerHTML = '';
            return;
        }

        this.dom.attachmentPreview.style.display = 'flex';
        this.dom.attachmentPreview.innerHTML = this.currentAttachments.map((item, index) => {
            if (item.type === 'image') {
                return `
                    <div class="attachment-item">
                        <img src="${item.data}" alt="attachment">
                        <button class="attachment-remove" onclick="phantomChat.removeAttachment(${index})">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
            } else {
                return `
                    <div class="attachment-item file-item" title="${item.name}">
                        <i class="fas fa-file-alt"></i>
                        <span class="file-name">${item.name}</span>
                        <button class="attachment-remove" onclick="phantomChat.removeAttachment(${index})">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
            }
        }).join('');
    }

    startPlaceholderAnimation() {
        let idx = 0, charIdx = 0, deleting = false;

        const animate = () => {
            const text = this.placeholders[idx];

            if (deleting) {
                this.dom.input.placeholder = text.substring(0, charIdx--);
                if (charIdx < 0) {
                    deleting = false;
                    idx = (idx + 1) % this.placeholders.length;
                    setTimeout(animate, 400);
                    return;
                }
            } else {
                this.dom.input.placeholder = text.substring(0, charIdx++);
                if (charIdx > text.length) {
                    deleting = true;
                    setTimeout(animate, 2500);
                    return;
                }
            }
            setTimeout(animate, deleting ? 30 : 60);
        };
        animate();
    }

    autoResizeInput() {
        const el = this.dom.input;
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 200) + 'px';
    }

    toggleSidebar(force) {
        const isDesktop = window.innerWidth > 768;
        const sidebar = this.dom.sidebar;

        if (isDesktop) {
            const isOpen = !sidebar.classList.contains('collapsed');
            const newState = force !== undefined ? force : !isOpen;
            sidebar.classList.toggle('collapsed', !newState);
            this.dom.app.classList.toggle('sidebar-collapsed', !newState);
        } else {
            const isOpen = sidebar.classList.contains('active');
            const newState = force !== undefined ? force : !isOpen;
            sidebar.classList.toggle('active', newState);
            this.dom.sidebarOverlay?.classList.toggle('active', newState);
        }
    }

    scrollToBottom() {
        requestAnimationFrame(() => {
            this.dom.chatBody.scrollTop = this.dom.chatBody.scrollHeight;
        });
    }

    async copyImage(imgElement) {
        try {
            if (!imgElement.complete) {
                await new Promise(resolve => imgElement.onload = resolve);
            }

            const canvas = document.createElement('canvas');
            canvas.width = imgElement.naturalWidth || imgElement.width;
            canvas.height = imgElement.naturalHeight || imgElement.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(imgElement, 0, 0);

            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);

            if (window.Notify) Notify.success('Copied', 'Image copied to clipboard');
        } catch (err) {
            console.error('Image copy failed:', err);
            if (window.Notify) Notify.error('Failed', 'Could not copy image');
        }
    }


    copyText(text) {
        navigator.clipboard.writeText(text).then(() => {
            if (window.Notify) Notify.success('Copied', 'Text copied to clipboard');
        }).catch(() => {
            if (window.Notify) Notify.error('Failed', 'Could not copy text');
        });
    }

    async fetchModels() {
        try {
            const res = await fetch('https://gen.pollinations.ai/models', {
                headers: { 'Authorization': `Bearer ${this.apiKey}` }
            });
            const data = await res.json();

            if (Array.isArray(data) && data.length && typeof data[0] === 'object') {
                this.state.models.text = data
                    .filter(m => m.type === 'text' || m.output_modalities?.includes('text'))
                    .map(m => m.name);
                this.state.models.image = data
                    .filter(m => m.type === 'image' || m.output_modalities?.includes('image'))
                    .map(m => m.name);
            }

            if (!this.state.models.text.length) {
                this.state.models.text = ['openai', 'mistral', 'llama'];
            }
            if (!this.state.models.image.length) {
                this.state.models.image = ['flux', 'turbo'];
            }

            this.updateModelSelect();
        } catch {
            this.state.models.text = ['openai', 'mistral', 'llama'];
            this.state.models.image = ['flux', 'turbo'];
            this.updateModelSelect();
        }
    }

    updateModelSelect() {
        const models = this.state.models[this.state.config.mode];
        const current = this.state.config.mode === 'text'
            ? this.state.config.textModel
            : this.state.config.imageModel;

        this.dom.modelSelect.innerHTML = models.map(m =>
            `<option value="${m}" ${m === current ? 'selected' : ''}>${this.capitalize(m)}</option>`
        ).join('');
    }

    setMode(mode) {
        if (mode !== 'text' && mode !== 'image') return;

        this.state.config.mode = mode;
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        this.updateModelSelect();
        this.saveState();
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    loadState() {
        try {
            const saved = JSON.parse(localStorage.getItem(this.storageKey));
            if (saved) {
                this.state.conversations = saved.conversations || [];
                this.state.currentId = saved.currentId;
                Object.assign(this.state.config, saved.config);
                this.state.config.mode = 'text'; // Always default to text on reload
            }
        } catch { }

        if (!this.state.conversations.length) {
            this.createConversation();
        } else if (!this.state.currentId) {
            this.state.currentId = this.state.conversations[0].id;
        }
    }

    saveState() {
        if (!this.state.config.autoSave) return;
        localStorage.setItem(this.storageKey, JSON.stringify({
            conversations: this.state.conversations,
            currentId: this.state.currentId,
            config: this.state.config
        }));
    }

    createConversation() {
        const conv = {
            id: Date.now().toString(),
            title: 'New Chat',
            messages: [],
            createdAt: Date.now()
        };
        this.state.conversations.unshift(conv);
        this.state.currentId = conv.id;
        this.setMode('text');
        this.render();
        this.dom.input.focus();
        this.saveState();
    }

    deleteConversation(id) {
        this.state.conversations = this.state.conversations.filter(c => c.id !== id);

        if (this.state.currentId === id) {
            this.state.currentId = this.state.conversations[0]?.id;
            if (!this.state.currentId) this.createConversation();
        }

        this.render();
        this.saveState();
    }

    get currentConversation() {
        return this.state.conversations.find(c => c.id === this.state.currentId);
    }

    loadConversation(id) {
        this.state.currentId = id;
        this.render();
        if (window.innerWidth <= 768) this.toggleSidebar(false);
    }

    async sendMessage() {
        const text = this.dom.input.value.trim();
        const hasAttachments = this.currentAttachments.length > 0;
        if (!text && !hasAttachments) return;

        const attachmentsToSend = [...this.currentAttachments];
        
        this.dom.input.value = '';
        this.currentAttachments = [];
        this.renderAttachments();
        this.autoResizeInput();
        this.updateSendButton();

        const conv = this.currentConversation;
        if (!conv) return;

        const msgObj = { role: 'user', content: text, type: 'text' };
        
        const imageAttachments = attachmentsToSend.filter(a => a.type === 'image').map(a => a.data);
        const fileAttachments = attachmentsToSend.filter(a => a.type === 'file');

        if (imageAttachments.length > 0) {
            msgObj.images = imageAttachments;
        }
        if (fileAttachments.length > 0) {
            msgObj.files = fileAttachments;
        }
        
        conv.messages.push(msgObj);
        this.appendMessage(msgObj);

        if (conv.messages.length === 1) {
            conv.title = text.length > 35 ? text.substring(0, 35) + '...' : text;
            this.dom.title.textContent = conv.title;
            this.renderConversationList();
        }

        if (this.state.config.mode === 'image') {
            await this.generateImage(text || "Random image", conv);
        } else {
            await this.generateText(text, conv, attachmentsToSend);
        }

        this.saveState();
    }

    async generateText(input, conv, currentAttachments = []) {
        const thinkingId = 'thinking-' + Date.now();
        const thinkingEl = this.appendMessage({ role: 'ai', id: thinkingId, isThinking: true });

        this.abortController = new AbortController();
        if (this.dom.stopBtn) this.dom.stopBtn.style.display = 'flex';
        if (this.dom.sendBtn) this.dom.sendBtn.style.display = 'none';

        let fullContent = '';
        let messageId = 'msg-' + Date.now();
        let messageEl = null;

        let targetModel = this.state.config.textModel;
        const isAutoSearchEnabled = (window.Settings && Settings.getAll().autoSwitchSearch !== false);
        
        if (isAutoSearchEnabled && targetModel !== 'gemini-search') {
            const searchRegex = /\b(today|tonight|weather|news|latest|current|who won|score|price of|how many|what is the|right now|currently|recent|recently)\b/i;
            if (searchRegex.test(input) || (input.includes('?') && /\b(who|what|where|when|why|how)\b/i.test(input) && /\b(is|was|did|do|does|will)\b/i.test(input))) {
                targetModel = 'gemini-search';
                if (window.Notify) Notify.info('Model Switched', 'Switched to gemini-search for real-time info. You may disable this in settings.');
                
                // Update dropdown visually if it exists
                if (this.dom.modelSelect && [...this.dom.modelSelect.options].some(o => o.value === 'gemini-search')) {
                    this.dom.modelSelect.value = 'gemini-search';
                    this.state.config.textModel = 'gemini-search'; // Save it so user sees it matched
                    this.saveState();
                }
            }
        }

        try {
            const contextLimit = (window.Settings && Settings.getAll().aiContextWindow) || 10;
            const messages = [
                { role: 'system', content: 'You are Phantom AI, a helpful and knowledgeable assistant. Use Markdown formatting. Use KaTeX for mathematical formulas (e.g., use $ for inline and $$ for block math). Be concise but thorough.' },
                ...conv.messages.slice(-contextLimit).map(m => {
                    let messageContent = m.content || "Image description request";
                    
                    if (m.files && m.files.length > 0) {
                        const filesContext = m.files.map(f => `\n\nFile: ${f.name}\n\`\`\`\n${f.data}\n\`\`\``).join('');
                        messageContent += filesContext;
                    }

                    if (m.images && m.images.length > 0) {
                        messageContent = [{ type: 'text', text: messageContent }];
                        m.images.forEach(img => {
                            messageContent.push({ type: 'image_url', image_url: { url: img } });
                        });
                    }
                    
                    return {
                        role: m.role === 'ai' ? 'assistant' : m.role,
                        content: messageContent
                    };
                })
            ];

            const res = await fetch(this.baseTextUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                signal: this.abortController.signal,
                body: JSON.stringify({
                    messages,
                    model: targetModel,
                    seed: Math.floor(Math.random() * 1000000),
                    stream: true
                })
            });

            if (!res.ok) throw new Error(`API Error: ${res.status}`);

            thinkingEl?.remove();

            // Create the real message element for streaming
            messageEl = this.appendMessage({ role: 'ai', content: '', id: messageId });
            const textContainer = messageEl.querySelector('.message-text');

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let lastRenderTime = Date.now();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.slice(6);
                        if (dataStr === '[DONE]') break;

                        try {
                            const data = JSON.parse(dataStr);
                            const content = data.choices[0]?.delta?.content || '';
                            if (content) {
                                fullContent += content;

                                // Only update UI if this conversation is still active
                                if (conv.id === this.state.currentId) {
                                    if (!messageEl.parentNode) {
                                        // If user switched back to this conv, messageEl might have been cleared from DOM
                                        // We need to re-find or re-append it, but for now just skip UI update 
                                        // until final render if it's not in DOM
                                    } else {
                                        // Periodic rendering every 5 seconds
                                        if (Date.now() - lastRenderTime > 5000) {
                                            textContainer.innerHTML = this.processMarkdown(fullContent);
                                            this.finalizeMessageRendering(messageEl, fullContent, 'text', true);
                                            lastRenderTime = Date.now();
                                        } else {
                                            textContainer.textContent = fullContent;
                                        }
                                        this.scrollToBottom();
                                    }
                                }
                            }
                        } catch (e) {
                            // Ignore partial JSON 
                        }
                    }
                }
            }

            // Final rendering
            conv.messages.push({ role: 'ai', content: fullContent, type: 'text' });
            this.saveState();

            if (conv.id === this.state.currentId) {
                if (!messageEl.parentNode) {
                    this.render(); // Full re-render if we are on this chat but messageEl was lost
                } else {
                    textContainer.innerHTML = this.processMarkdown(fullContent);
                    this.finalizeMessageRendering(messageEl, fullContent, 'text');
                    this.scrollToBottom();
                }
            }

        } catch (err) {
            if (err.name === 'AbortError') {
                const finalContent = fullContent || '*(Generation stopped)*';
                conv.messages.push({ role: 'ai', content: finalContent, type: 'text' });
                this.saveState();

                if (conv.id === this.state.currentId) {
                    const el = document.getElementById(messageId) || document.getElementById(thinkingId);
                    if (el && el.parentNode) {
                        const textContainer = el.querySelector('.message-text');
                        if (textContainer) {
                            textContainer.innerHTML = this.processMarkdown(finalContent);
                            if (fullContent) this.finalizeMessageRendering(el, finalContent, 'text');
                        }
                        this.scrollToBottom();
                        
                        // Clear thinking state if aborted early
                        if (el.id === thinkingId) {
                           el.classList.remove('thinking-dots');
                        }
                    } else {
                        this.render();
                    }
                }
            } else {
                const el = document.getElementById(thinkingId);
                if (el && el.parentNode) {
                    el.querySelector('.message-text').innerHTML =
                        `<span style="color: var(--error)">Failed to get response: ${err.message}</span>`;
                } else {
                    this.appendMessage({ role: 'ai', content: `Error: ${err.message}`, type: 'text' });
                }
            }
        } finally {
            this.abortController = null;
            if (this.dom.stopBtn) this.dom.stopBtn.style.display = 'none';
            if (this.dom.sendBtn) this.dom.sendBtn.style.display = 'flex';
        }
    }

    async generateImage(prompt, conv) {
        const seed = Math.floor(Math.random() * 1000000);
        const url = `${this.baseImageUrl}${encodeURIComponent(prompt)}?model=${this.state.config.imageModel}&nologo=true&seed=${seed}&key=${this.apiKey}`;

        conv.messages.push({ role: 'ai', content: url, prompt, type: 'image' });
        this.saveState();
        
        if (conv.id === this.state.currentId) {
            this.appendMessage({ role: 'ai', content: url, prompt, type: 'image' });
            this.scrollToBottom();
        }
    }

    retryLast(index) {
        const conv = this.currentConversation;
        if (!conv || conv.messages.length === 0) return;

        let targetIndex = -1;

        if (index !== undefined) {
            // Re-run from a specific user message
            if (conv.messages[index].role === 'user') {
                targetIndex = index;
            } else {
                // If it's an AI message, find the preceding user message
                for (let i = index - 1; i >= 0; i--) {
                    if (conv.messages[i].role === 'user') {
                        targetIndex = i;
                        break;
                    }
                }
            }
        } else {
            // Find the last user message (original behavior)
            for (let i = conv.messages.length - 1; i >= 0; i--) {
                if (conv.messages[i].role === 'user') {
                    targetIndex = i;
                    break;
                }
            }
        }

        if (targetIndex !== -1) {
            const text = conv.messages[targetIndex].content;
            conv.messages = conv.messages.slice(0, targetIndex + 1);
            this.render();
            this.dom.input.value = text;
            this.sendMessage();
        }
    }

    editMessage(index) {
        const conv = this.currentConversation;
        if (!conv || !conv.messages[index]) return;

        const text = conv.messages[index].content;
        // Just load the text and clear subsequent history to branch from here
        conv.messages = conv.messages.slice(0, index);
        this.render();
        this.dom.input.value = text;
        this.dom.input.focus();
        this.autoResizeInput();
    }

    speakText(text, btn) {
        if (!window.speechSynthesis) {
            if (window.Notify) Notify.error('Feature Unavailable', 'Speech synthesis not supported');
            return;
        }

        // Toggle: if currently speaking, stop
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            this.resetSpeechIcons();
            return;
        }

        this.resetSpeechIcons();
        const icon = btn.querySelector('i');
        if (icon) {
            icon.className = 'fas fa-times'; // Show X when speaking
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(v => v.name.includes('Google') || v.name.includes('Natural')) || voices[0];
        if (preferred) utterance.voice = preferred;

        utterance.onend = () => this.resetSpeechIcons();
        utterance.onerror = () => this.resetSpeechIcons();

        window.speechSynthesis.speak(utterance);
    }

    resetSpeechIcons() {
        document.querySelectorAll('.speak-btn i').forEach(i => {
            i.className = 'fas fa-volume-up';
        });
    }

    renderConversationList() {
        this.dom.convList.innerHTML = this.state.conversations.map(c => `
            <div class="conversation-item ${c.id === this.state.currentId ? 'active' : ''}" 
                 onclick="phantomChat.loadConversation('${c.id}')">
                <span class="conversation-title">${this.escapeHtml(c.title)}</span>
                <button class="delete-btn" onclick="event.stopPropagation(); phantomChat.deleteConversation('${c.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }

    render() {
        const conv = this.currentConversation;
        this.renderConversationList();
        this.dom.chatBody.innerHTML = '';

        if (!conv || !conv.messages.length) {
            this.dom.hero.style.display = 'block';
            this.dom.title.textContent = 'Phantom AI';
        } else {
            this.dom.hero.style.display = 'none';
            this.dom.title.textContent = conv.title;
            conv.messages.forEach((msg, idx) => this.appendMessage({ ...msg, index: idx }));
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    processMarkdown(content) {
        if (!window.marked) return this.escapeHtml(content);

        // Protect LaTeX from marked mangling
        const mathBlocks = [];
        let placeholderCount = 0;

        // 1. Protect block math $$...$$
        content = content.replace(/\$\$([\s\S]+?)\$\$/g, (match) => {
            const placeholder = `PHANTOMMATHBLOCK${placeholderCount++}X`;
            mathBlocks.push({ placeholder, content: match });
            return placeholder;
        });

        // 2. Protect environments \begin{...}...\end{...}
        content = content.replace(/\\begin\{([a-z*]+)\}[\s\S]+?\\end\{\1\}/g, (match) => {
            const placeholder = `PHANTOMMATHBLOCK${placeholderCount++}X`;
            mathBlocks.push({ placeholder, content: match });
            return placeholder;
        });

        // 3. Protect \[...\]
        content = content.replace(/\\\[([\s\S]+?)\\\]/g, (match) => {
            const placeholder = `PHANTOMMATHBLOCK${placeholderCount++}X`;
            mathBlocks.push({ placeholder, content: match });
            return placeholder;
        });

        // 4. Protect \(...\)
        content = content.replace(/\\\(([\s\S]+?)\\\)/g, (match) => {
            const placeholder = `PHANTOMMATHBLOCK${placeholderCount++}X`;
            mathBlocks.push({ placeholder, content: match });
            return placeholder;
        });

        // 5. Protect inline math $...$
        content = content.replace(/\$([^\$\n]+?)\$/g, (match) => {
            const placeholder = `PHANTOMMATHBLOCK${placeholderCount++}X`;
            mathBlocks.push({ placeholder, content: match });
            return placeholder;
        });

        // Parse markdown
        let html = marked.parse(content);

        // Restore LaTeX blocks
        // Using function replacement to avoid issues with '$' characters in content
        mathBlocks.forEach(({ placeholder, content: original }) => {
            html = html.replace(placeholder, () => original);
        });

        return html;
    }

    appendMessage({ role, content, type = 'text', prompt, id, isThinking, index, images, files, conversationId }) {
        // If conversationId is specified, only proceed if it's the current one
        if (conversationId && conversationId !== this.state.currentId) return null;
        
        this.dom.hero.style.display = 'none';

        const div = document.createElement('div');
        div.className = `message ${role}-message`;
        if (id) div.id = id;

        const icon = role === 'ai' ? 'ghost' : 'user';

        let messageHtml = '';

        if (isThinking) {
            messageHtml = '<span class="thinking-dots">Thinking</span>';
        } else if (type === 'image' && role === 'ai') {
            messageHtml = `
                <p class="image-prompt">${this.escapeHtml(prompt)}</p>
                <div class="image-container">
                    <img src="${content}" 
                         class="generated-image" 
                         alt="${this.escapeHtml(prompt)}"
                         crossorigin="anonymous"
                         loading="lazy"
                         onclick="phantomChat.copyImage(this)"
                         onload="this.classList.add('loaded')"
                         onerror="this.parentElement.innerHTML='<div class=\\'image-loader\\'><i class=\\'fas fa-exclamation-triangle\\'></i><p>Failed to load</p></div>'">
                    <div class="image-loader">
                        <i class="fas fa-spinner fa-spin"></i>
                        <span>Generating...</span>
                    </div>
                </div>
            `;
        } else {
            messageHtml = content ? this.processMarkdown(content) : '';
            if (images && images.length > 0) {
                const imgsHtml = `<div class="message-images">` + 
                    images.map(img => `<img src="${img}" class="message-image" alt="User uploaded image">`).join('') + 
                    `</div>`;
                messageHtml += imgsHtml;
            }
            if (files && files.length > 0) {
                const filesHtml = `<div class="message-files">` +
                    files.map((f, i) => {
                        const uniqueId = `file-${Date.now()}-${i}`;
                        return `
                        <div class="message-file-wrapper" id="${uniqueId}">
                            <div class="message-file-attachment" onclick="document.getElementById('${uniqueId}').classList.toggle('expanded')">
                                <i class="fas fa-file-code"></i>
                                <span class="file-name-label">${this.escapeHtml(f.name)}</span>
                                <i class="fas fa-chevron-down toggle-icon"></i>
                            </div>
                            <div class="message-file-content">
                                <pre><code>${this.escapeHtml(f.data)}</code></pre>
                            </div>
                        </div>
                    `}).join('') + `</div>`;
                messageHtml += filesHtml;
            }
        }

        const imgId = (type === 'image' && role === 'ai') ? `img-${Date.now()}` : '';

        div.innerHTML = `
            <div class="message-avatar">
                <i data-lucide="${icon}"></i>
            </div>
            <div class="message-content">
                <div class="message-text">${messageHtml.replace('class="generated-image"', `class="generated-image" id="${imgId}"`)}</div>
                ${role === 'ai' && !isThinking ? `
                    <div class="message-actions" style="${!content ? 'display: none' : ''}">
                        <button class="btn speak-btn" title="Speak">
                            <i class="fas fa-volume-up"></i>
                        </button>
                        <button class="btn copy-btn" title="Copy">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="btn redo-btn" title="Retry">
                            <i class="fas fa-redo"></i>
                        </button>
                    </div>
                ` : ''}
                ${role === 'user' && index !== undefined ? `
                    <div class="message-actions">
                         <button class="btn copy-btn" title="Copy">
                            <i class="fas fa-copy"></i>
                        </button>
                         <button class="btn edit-btn" title="Edit">
                            <i class="fas fa-pen"></i>
                        </button>
                    </div>
                ` : ''}
            </div>
        `;

        this.dom.chatBody.appendChild(div);

        // Render Lucide icons in the new message
        if (window.lucide) {
            lucide.createIcons({
                root: div
            });
        }

        if (!isThinking && content && type === 'text') {
            this.finalizeMessageRendering(div, content, type, false, index);
        } else if (role === 'ai' && !isThinking) {
            // Attach listeners even if content is empty (for streaming updates later)
            this.attachMessageActionListeners(div, content, type, index);
        }

        this.scrollToBottom();
        return div;
    }

    attachMessageActionListeners(div, content, type, index) {
        const speakBtn = div.querySelector('.speak-btn');
        if (speakBtn) speakBtn.onclick = () => this.speakText(content, speakBtn);

        const copyBtn = div.querySelector('.copy-btn');
        if (copyBtn) {
            copyBtn.onclick = () => {
                if (type === 'image') {
                    const img = div.querySelector('.generated-image');
                    if (img) this.copyImage(img);
                } else {
                    this.copyText(content);
                }

                const icon = copyBtn.querySelector('i');
                if (icon) {
                    icon.className = 'fas fa-check';
                    copyBtn.classList.add('copied');
                    setTimeout(() => {
                        icon.className = 'fas fa-copy';
                        copyBtn.classList.remove('copied');
                    }, 1500);
                }
            };
        }

        const redoBtn = div.querySelector('.redo-btn');
        if (redoBtn) {
            redoBtn.onclick = () => this.retryLast(index);
        }

        const editBtn = div.querySelector('.edit-btn');
        if (editBtn) {
            editBtn.onclick = () => this.editMessage(index);
        }
    }

    finalizeMessageRendering(div, content, type, isPartial = false, index) {
        if (type === 'text') {
            if (window.hljs) {
                div.querySelectorAll('pre code').forEach(block => hljs.highlightElement(block));
            }

            // Decorate code blocks
            div.querySelectorAll('pre:not(.code-block-wrapper pre)').forEach(pre => {
                const wrapper = document.createElement('div');
                wrapper.className = 'code-block-wrapper';
                pre.parentNode.insertBefore(wrapper, pre);
                
                const btn = document.createElement('button');
                btn.className = 'code-copy-btn';
                btn.innerHTML = '<i class="fas fa-copy"></i>';
                btn.title = 'Copy code';
                
                btn.onclick = () => {
                    const codeText = pre.innerText;
                    navigator.clipboard.writeText(codeText).then(() => {
                        btn.innerHTML = '<i class="fas fa-check"></i>';
                        btn.classList.add('copied');
                        setTimeout(() => {
                            btn.innerHTML = '<i class="fas fa-copy"></i>';
                            btn.classList.remove('copied');
                        }, 1500);
                    });
                };
                
                wrapper.appendChild(btn);
                wrapper.appendChild(pre);
            });

            if (window.renderMathInElement) {
                renderMathInElement(div, {
                    delimiters: [
                        { left: '$$', right: '$$', display: true },
                        { left: '$', right: '$', display: false },
                        { left: '\\(', right: '\\)', display: false },
                        { left: '\\begin{equation}', right: '\\end{equation}', display: true },
                        { left: '\\begin{align}', right: '\\end{align}', display: true },
                        { left: '\\begin{alignat}', right: '\\end{alignat}', display: true },
                        { left: '\\begin{gather}', right: '\\end{gather}', display: true },
                        { left: '\\begin{CD}', right: '\\end{CD}', display: true },
                        { left: '\\[', right: '\\]', display: true }
                    ],
                    throwOnError: false,
                    trust: true,
                    strict: false
                });
            }
        }

        if (!isPartial) {
            const actions = div.querySelector('.message-actions');
            if (actions) {
                actions.style.display = 'flex';
                this.attachMessageActionListeners(div, content, type, index);
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.phantomChat = new PhantomChat();
});