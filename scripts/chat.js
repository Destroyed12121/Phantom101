<<<<<<< HEAD
// talking to robots
=======
/*
 * PHANTOM AI - Core Logic
 */

>>>>>>> b354220fb359bebcfd34b81e8e9fc8a9219a9bac
class PhantomChat {
    constructor() {
        this.state = {
            conversations: [],
            currentId: null,
            models: { text: [], image: [] },
            config: {
                textModel: 'openai',
                imageModel: 'flux',
<<<<<<< HEAD
                mode: 'text',
=======
                mode: 'text', // 'text' | 'image'
                temperature: 0.7,
>>>>>>> b354220fb359bebcfd34b81e8e9fc8a9219a9bac
                autoSave: true
            }
        };

<<<<<<< HEAD
        this.placeholders = [
            "Ask me anything...",
            "Explain quantum physics simply",
            "Write a poem about the stars",
            "Help me with my homework"
        ];

        this.dom = {};
=======
        // UI: Auto-typing placeholders
        this.placeholders = [
            "Explain physics in simple terms...",
            "Explain point slope form in simple terms",
            "How do I time travel!?",
            "How to cheat in math class 101"
        ];

        this.dom = {};
        this.abortController = null;
>>>>>>> b354220fb359bebcfd34b81e8e9fc8a9219a9bac
        this.storageKey = 'phantom_ai_data';
        this.apiKey = 'sk_j66iDfX2lPbTZ2Otb9MI7xje7kRZQUyE';
        this.baseTextUrl = 'https://gen.pollinations.ai/v1/chat/completions';
        this.baseImageUrl = 'https://gen.pollinations.ai/image/';

<<<<<<< HEAD
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
=======
        this.cacheDOM();
        this.loadState();
        this.init();
        this.initPlaceholderAnimation();
    }

    init() {
        this.bindEvents();
        this.fetchModels();
        this.render();

        // Check for Markdown/HLJS presence
        if (!window.marked) console.warn('Marked.js not loaded');
        if (!window.hljs) console.warn('Highlight.js not loaded');

        // System ready notification
        if (window.Notify) {
            Notify.success('System Ready', 'Phantom AI initialized successfully');
>>>>>>> b354220fb359bebcfd34b81e8e9fc8a9219a9bac
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
            modelSelect: document.getElementById('modelSelector'),
            hero: document.getElementById('heroSection'),
            convList: document.getElementById('conversationsList'),
            title: document.getElementById('chatTitle')
        };
    }

    bindEvents() {
<<<<<<< HEAD
        document.addEventListener('click', (e) => {
            const target = e.target;

            if (target.closest('#menuToggle') || target.closest('#sidebarToggle')) {
                this.toggleSidebar();
            }
            if (target.closest('#newChatBtn')) {
                this.createConversation();
            }
            if (target.closest('.mode-btn')) {
                this.setMode(target.closest('.mode-btn').dataset.mode);
            }
            if (target.id === 'sidebarOverlay') {
=======
        // Global Delegation
        document.addEventListener('click', (e) => {
            if (e.target.closest('#sidebarToggle') || e.target.closest('#menuToggle')) {
                this.toggleSidebar();
            }
            if (e.target.closest('#newChatBtn')) {
                this.createConversation();
            }
            if (e.target.closest('.mode-btn')) {
                const btn = e.target.closest('.mode-btn');
                this.setMode(btn.dataset.mode);
            }
            if (e.target.id === 'sidebarOverlay') {
>>>>>>> b354220fb359bebcfd34b81e8e9fc8a9219a9bac
                this.toggleSidebar(false);
            }
        });

<<<<<<< HEAD
=======
        // Input Handling
>>>>>>> b354220fb359bebcfd34b81e8e9fc8a9219a9bac
        this.dom.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

<<<<<<< HEAD
        this.dom.input.addEventListener('input', () => {
            this.autoResizeInput();
            this.dom.sendBtn.disabled = !this.dom.input.value.trim();
        });

        this.dom.modelSelect.addEventListener('change', (e) => {
            const key = this.state.config.mode === 'text' ? 'textModel' : 'imageModel';
            this.state.config[key] = e.target.value;
            this.saveState();
            if (window.Notify) Notify.success('Model Changed', e.target.value);
        });

        this.dom.sendBtn.addEventListener('click', () => this.sendMessage());
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
=======
        this.dom.input.addEventListener('input', (e) => {
            this.updateInputHeight(e.target);
            this.dom.sendBtn.disabled = !e.target.value.trim();
        });

        // Model Change
        this.dom.modelSelect.addEventListener('change', (e) => {
            const mode = this.state.config.mode;
            if (mode === 'text') {
                this.state.config.textModel = e.target.value;
            } else {
                this.state.config.imageModel = e.target.value;
            }
            this.saveState();
            if (window.Notify) Notify.success('Model Updated', `Switched to ${e.target.value}`);
        });

        // Send Click
        this.dom.sendBtn.addEventListener('click', () => this.sendMessage());
    }

    // ============================================
    // UI ANIMATIONS & UTILS
    // ============================================

    initPlaceholderAnimation() {
        let pIndex = 0;
        let charIndex = 0;
        let isDeleting = false;

        const type = () => {
            const current = this.placeholders[pIndex];
            const input = this.dom.input;
            if (!input) return;

            if (isDeleting) {
                input.placeholder = current.substring(0, charIndex--);
            } else {
                input.placeholder = current.substring(0, charIndex++);
            }

            if (!isDeleting && charIndex > current.length) {
                isDeleting = true;
                setTimeout(type, 2000); // Pause at end
            } else if (isDeleting && charIndex < 0) {
                isDeleting = false;
                pIndex = (pIndex + 1) % this.placeholders.length;
                setTimeout(type, 500); // Pause before next word
            } else {
                setTimeout(type, isDeleting ? 40 : 80);
            }
        };
        type();
    }

    updateInputHeight(el) {
>>>>>>> b354220fb359bebcfd34b81e8e9fc8a9219a9bac
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 200) + 'px';
    }

<<<<<<< HEAD
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
=======
    toggleSidebar(forceState) {
        const isDesktop = window.innerWidth > 768;
        const isActive = isDesktop ? !this.dom.sidebar.classList.contains('collapsed') : this.dom.sidebar.classList.contains('active');
        const newState = forceState !== undefined ? forceState : !isActive;

        if (isDesktop) {
            this.dom.sidebar.classList.toggle('collapsed', !newState);
            this.dom.app.classList.toggle('sidebar-collapsed', !newState);
        } else {
            this.dom.sidebar.classList.toggle('active', newState);
            this.dom.sidebarOverlay.classList.toggle('active', newState);
        }
    }

    // ============================================
    // AI & DATA LOGIC
    // ============================================

    async fetchModels() {
        try {
            const headers = { 'Authorization': `Bearer ${this.apiKey}` };
            const res = await fetch('https://gen.pollinations.ai/models', { headers });
            const data = await res.json();

            // Filter models if data is an array of objects
            if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
                this.state.models.text = data.filter(m => m.type === 'text' || (m.output_modalities && m.output_modalities.includes('text'))).map(m => m.name);
                this.state.models.image = data.filter(m => m.type === 'image' || (m.output_modalities && m.output_modalities.includes('image'))).map(m => m.name);
            } else {
                // Fallback for simple string array or unexpected format
                this.state.models.text = data || ['openai', 'mistral', 'llama'];
                this.state.models.image = ['flux', 'turbo'];
            }

            // Final fallback if empty
            if (this.state.models.text.length === 0) this.state.models.text = ['openai', 'mistral', 'llama'];
            if (this.state.models.image.length === 0) this.state.models.image = ['flux', 'turbo'];

            this.populateModelSelect();
        } catch (e) {
            console.error('Failed to fetch models', e);
            this.state.models.text = ['openai', 'mistral', 'llama'];
            this.state.models.image = ['flux', 'turbo'];
            this.populateModelSelect();
        }
    }

    populateModelSelect() {
        if (!this.dom.modelSelect) return;
        const mode = this.state.config.mode;
        const models = this.state.models[mode] || [];
        const currentModel = mode === 'text' ? this.state.config.textModel : this.state.config.imageModel;

        this.dom.modelSelect.innerHTML = models.map(m => {
            const name = typeof m === 'object' ? m.name : m;
            return `<option value="${name}" ${name === currentModel ? 'selected' : ''}>
                ${name.charAt(0).toUpperCase() + name.slice(1)}
            </option>`;
        }).join('');
>>>>>>> b354220fb359bebcfd34b81e8e9fc8a9219a9bac
    }

    setMode(mode) {
        if (mode !== 'text' && mode !== 'image') return;
<<<<<<< HEAD

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
            }
        } catch { }

        if (!this.state.conversations.length) {
=======
        this.state.config.mode = mode;

        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        this.populateModelSelect();
        this.saveState();
    }

    // ============================================
    // CONVERSATION MANAGEMENT
    // ============================================

    loadState() {
        const raw = localStorage.getItem(this.storageKey);
        if (raw) {
            try {
                const data = JSON.parse(raw);
                this.state.conversations = data.conversations || [];
                this.state.currentId = data.currentId;
                this.state.config = { ...this.state.config, ...data.config };
            } catch (e) { console.error(e); }
        }

        if (this.state.conversations.length === 0) {
>>>>>>> b354220fb359bebcfd34b81e8e9fc8a9219a9bac
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
<<<<<<< HEAD
        const conv = {
            id: Date.now().toString(),
            title: 'New Chat',
            messages: [],
            createdAt: Date.now()
        };
        this.state.conversations.unshift(conv);
        this.state.currentId = conv.id;
        this.setMode('text');
=======
        const newConv = {
            id: Date.now().toString(),
            title: 'New Chat',
            messages: [],
            updatedAt: Date.now()
        };
        this.state.conversations.unshift(newConv);
        this.state.currentId = newConv.id;

        // Default to text mode on new chat as requested
        this.setMode('text');

>>>>>>> b354220fb359bebcfd34b81e8e9fc8a9219a9bac
        this.render();
        this.dom.input.focus();
        this.saveState();
    }

    deleteConversation(id) {
        this.state.conversations = this.state.conversations.filter(c => c.id !== id);
<<<<<<< HEAD

        if (this.state.currentId === id) {
            this.state.currentId = this.state.conversations[0]?.id;
            if (!this.state.currentId) this.createConversation();
        }

=======
        if (this.state.currentId === id) {
            this.state.currentId = this.state.conversations[0]?.id || null;
            if (!this.state.currentId) this.createConversation();
        }
>>>>>>> b354220fb359bebcfd34b81e8e9fc8a9219a9bac
        this.render();
        this.saveState();
    }

<<<<<<< HEAD
    get currentConversation() {
=======
    getCurrentConversation() {
>>>>>>> b354220fb359bebcfd34b81e8e9fc8a9219a9bac
        return this.state.conversations.find(c => c.id === this.state.currentId);
    }

    loadConversation(id) {
        this.state.currentId = id;
        this.render();
        if (window.innerWidth <= 768) this.toggleSidebar(false);
    }

<<<<<<< HEAD
=======
    // ============================================
    // MESSAGING ENGINE
    // ============================================

>>>>>>> b354220fb359bebcfd34b81e8e9fc8a9219a9bac
    async sendMessage() {
        const text = this.dom.input.value.trim();
        if (!text) return;

        this.dom.input.value = '';
<<<<<<< HEAD
        this.autoResizeInput();
        this.dom.sendBtn.disabled = true;

        const conv = this.currentConversation;
        if (!conv) return;

        conv.messages.push({ role: 'user', content: text, type: 'text' });
        this.appendMessage({ role: 'user', content: text });

        if (conv.messages.length === 1) {
            conv.title = text.length > 35 ? text.substring(0, 35) + '...' : text;
            this.dom.title.textContent = conv.title;
            this.renderConversationList();
        }

=======
        this.updateInputHeight(this.dom.input);
        this.dom.sendBtn.disabled = true;

        const conv = this.getCurrentConversation();
        if (!conv) return;

        // User Message
        conv.messages.push({ role: 'user', content: text, type: 'text' });
        this.appendMessage({ role: 'user', content: text });

        // Update Title logic:
        // Text mode: use the request as the title
        // Image mode: use AI summarize (text mode) for the title
        if (conv.messages.length <= 2) {
            if (this.state.config.mode === 'text') {
                const truncatedTitle = text.length > 30 ? text.substring(0, 30) + '...' : text;
                conv.title = truncatedTitle;
                this.dom.title.textContent = conv.title;
                this.renderConversationList();
            } else {
                this.generateTitle(text);
            }
        }

        // Logic based on mode
>>>>>>> b354220fb359bebcfd34b81e8e9fc8a9219a9bac
        if (this.state.config.mode === 'image') {
            await this.generateImage(text, conv);
        } else {
            await this.generateText(text, conv);
        }

        this.saveState();
    }

    async generateText(input, conv) {
<<<<<<< HEAD
        const thinkingId = 'thinking-' + Date.now();
        this.appendMessage({ role: 'ai', id: thinkingId, isThinking: true });

        try {
            const messages = [
                { role: 'system', content: 'You are Phantom AI, a helpful and knowledgeable assistant. Use Markdown formatting. Be concise but thorough.' },
                ...conv.messages.slice(-10).map(m => ({
=======
        const placeholderId = 'thinking-' + Date.now();
        this.appendMessage({ role: 'ai', content: 'Processing...', id: placeholderId, isThinking: true });

        try {
            const system = "You are Phantom AI. Use Markdown. Concise, sleek tone.";
            const messages = [
                { role: 'system', content: system },
                ...conv.messages.slice(-8).map(m => ({
>>>>>>> b354220fb359bebcfd34b81e8e9fc8a9219a9bac
                    role: m.role === 'ai' ? 'assistant' : m.role,
                    content: m.content
                }))
            ];

<<<<<<< HEAD
=======
            const response = await fetch(this.baseTextUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    messages: messages,
                    model: this.state.config.textModel,
                    seed: Math.floor(Math.random() * 1000000)
                })
            });

            if (!response.ok) throw new Error('API request failed');

            const result = await response.json();
            const data = result.choices[0].message.content;

            document.getElementById(placeholderId)?.remove();

            conv.messages.push({ role: 'ai', content: data, type: 'text' });
            this.appendMessage({ role: 'ai', content: data });

        } catch (e) {
            console.error(e);
            const el = document.getElementById(placeholderId);
            if (el) el.innerHTML = `<span class="text-error">Communication failed. ${e.message}</span>`;
        }
    }

    async generateImage(input, conv) {
        const model = this.state.config.imageModel;
        const url = `${this.baseImageUrl}${encodeURIComponent(input)}?model=${model}&nologo=true&seed=${Math.floor(Math.random() * 1000000)}&key=${this.apiKey}`;
        conv.messages.push({ role: 'ai', content: url, prompt: input, type: 'image' });
        this.appendMessage({ role: 'ai', content: url, type: 'image', prompt: input });
    }

    async generateTitle(text) {
        try {
>>>>>>> b354220fb359bebcfd34b81e8e9fc8a9219a9bac
            const res = await fetch(this.baseTextUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
<<<<<<< HEAD
                    messages,
                    model: this.state.config.textModel,
                    seed: Math.floor(Math.random() * 1000000)
                })
            });

            if (!res.ok) throw new Error(`API Error: ${res.status}`);

            const data = await res.json();
            const reply = data.choices[0].message.content;

            document.getElementById(thinkingId)?.remove();

            conv.messages.push({ role: 'ai', content: reply, type: 'text' });
            this.appendMessage({ role: 'ai', content: reply, type: 'text' });

        } catch (err) {
            const el = document.getElementById(thinkingId);
            if (el) {
                el.querySelector('.message-text').innerHTML =
                    `<span style="color: var(--error)">Failed to get response: ${err.message}</span>`;
            }
        }
    }

    async generateImage(prompt, conv) {
        const seed = Math.floor(Math.random() * 1000000);
        const url = `${this.baseImageUrl}${encodeURIComponent(prompt)}?model=${this.state.config.imageModel}&nologo=true&seed=${seed}&key=${this.apiKey}`;

        conv.messages.push({ role: 'ai', content: url, prompt, type: 'image' });
        this.appendMessage({ role: 'ai', content: url, prompt, type: 'image' });
    }

    retryLast() {
        const conv = this.currentConversation;
        if (!conv || conv.messages.length < 2) return;

        for (let i = conv.messages.length - 1; i >= 0; i--) {
            if (conv.messages[i].role === 'user') {
                const text = conv.messages[i].content;
                conv.messages = conv.messages.slice(0, i + 1);
                this.render();
                this.dom.input.value = text;
                this.sendMessage();
                break;
            }
        }
    }

    // draws stuff
    render() {
        const conv = this.currentConversation;
        this.renderConversationList();
        this.dom.chatBody.innerHTML = '';

        if (!conv || !conv.messages.length) {
=======
                    messages: [
                        { role: 'system', content: 'You are a title generator. Create a short 3-5 word title for the following prompt. Return ONLY the title.' },
                        { role: 'user', content: text }
                    ],
                    model: 'openai-fast'
                })
            });
            const result = await res.json();
            const title = result.choices[0].message.content;
            const conv = this.getCurrentConversation();
            if (conv && title) {
                conv.title = title.replace(/"/g, '').trim();
                if (this.state.currentId === conv.id) {
                    this.dom.title.textContent = conv.title;
                }
                this.renderConversationList();
                this.saveState();
            }
        } catch (e) {
            console.error('Title generation failed', e);
        }
    }

    retryLast() {
        const conv = this.getCurrentConversation();
        if (!conv || conv.messages.length < 2) return;

        // Find last user message
        const lastUserMsgIndex = [...conv.messages].reverse().findIndex(m => m.role === 'user');
        if (lastUserMsgIndex === -1) return;

        // Remove everything after that user message
        const actualIndex = conv.messages.length - 1 - lastUserMsgIndex;
        const lastInput = conv.messages[actualIndex].content;

        conv.messages = conv.messages.slice(0, actualIndex + 1);

        // Re-render and trigger send
        this.render();
        this.dom.input.value = lastInput;
        this.sendMessage();
    }

    // ============================================
    // RENDERING ENGINE
    // ============================================

    render() {
        const conv = this.getCurrentConversation();
        this.renderConversationList();
        this.dom.chatBody.innerHTML = '';

        if (!conv || conv.messages.length === 0) {
>>>>>>> b354220fb359bebcfd34b81e8e9fc8a9219a9bac
            this.dom.hero.style.display = 'block';
            this.dom.title.textContent = 'Phantom AI';
        } else {
            this.dom.hero.style.display = 'none';
            this.dom.title.textContent = conv.title;
            conv.messages.forEach(msg => this.appendMessage(msg));
        }
    }

    renderConversationList() {
        this.dom.convList.innerHTML = this.state.conversations.map(c => `
<<<<<<< HEAD
            <div class="conversation-item ${c.id === this.state.currentId ? 'active' : ''}" 
                 onclick="phantomChat.loadConversation('${c.id}')">
                <span class="conversation-title">${this.escapeHtml(c.title)}</span>
                <button class="delete-btn" onclick="event.stopPropagation(); phantomChat.deleteConversation('${c.id}')">
=======
            <div class="conversation-item ${c.id === this.state.currentId ? 'active' : ''}" onclick="window.phantomChat.loadConversation('${c.id}')">
                <span class="conversation-title">${c.title}</span>
                <button class="delete-btn" onclick="event.stopPropagation(); window.phantomChat.deleteConversation('${c.id}')">
>>>>>>> b354220fb359bebcfd34b81e8e9fc8a9219a9bac
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }

<<<<<<< HEAD
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

=======
>>>>>>> b354220fb359bebcfd34b81e8e9fc8a9219a9bac
    appendMessage({ role, content, type = 'text', prompt, id, isThinking }) {
        this.dom.hero.style.display = 'none';

        const div = document.createElement('div');
<<<<<<< HEAD
        div.className = `message ${role}-message`;
        if (id) div.id = id;

        const icon = role === 'ai' ? 'ghost' : 'user';

        let messageHtml = '';

        if (isThinking) {
            messageHtml = '<span class="thinking-dots">Thinking</span>';
        } else if (type === 'image') {
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
            messageHtml = window.marked ? marked.parse(content) : this.escapeHtml(content);
        }

        const imgId = type === 'image' ? `img-${Date.now()}` : '';

        div.innerHTML = `
            <div class="message-avatar">
                <i data-lucide="${icon}"></i>
            </div>
            <div class="message-content">
                <div class="message-text">${messageHtml.replace('class="generated-image"', `class="generated-image" id="${imgId}"`)}</div>
                ${role === 'ai' && !isThinking ? `
                    <div class="message-actions">
                        <button class="btn" title="Copy" onclick="${type === 'image' ? `phantomChat.copyImage(document.getElementById('${imgId}'))` : `phantomChat.copyText(\`${content.replace(/`/g, '\\`').replace(/\\/g, '\\\\')}\`)`}">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="btn" title="Retry" onclick="phantomChat.retryLast()">
                            <i class="fas fa-redo"></i>
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

=======
        div.className = `message ${role}-message animate-fadeIn`;
        if (id) div.id = id;

        let innerHTML = `
            <div class="message-avatar">
                <i data-lucide="${role === 'ai' ? 'ghost' : 'user'}"></i>
            </div>
            <div class="message-content">
                <div class="message-text">
        `;

        if (isThinking) {
            innerHTML += `<span class="thinking-dots">Thinking...</span>`;
        } else if (type === 'image') {
            innerHTML += `
                <p class="text-xs text-dim mb-sm">Generated: ${prompt}</p>
                <div class="image-container">
                    <img src="${content}" class="generated-image" loading="lazy" alt="${prompt}" onload="this.classList.add('loaded')" onerror="this.parentElement.innerHTML='<div class=\\'image-loader\\'><i class=\\'fas fa-exclamation-triangle\\'></i><p>Failed to load image</p></div>'">
                    <div class="image-loader"><i class="fas fa-spinner fa-spin"></i></div>
                </div>
            `;
        } else {
            const parsed = window.marked ? marked.parse(content) : content;
            innerHTML += parsed;
        }

        innerHTML += `</div>`; // Close message-text

        // Actions for AI
        if (role === 'ai' && !isThinking) {
            innerHTML += `
                <div class="message-actions">
                    <button class="btn btn-sm" title="Copy" onclick="navigator.clipboard.writeText(\`${content.replace(/`/g, '\\`')}\`); if(window.Notify) Notify.success('Copied','Message saved to clipboard')">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="btn btn-sm" title="Retry" onclick="window.phantomChat.retryLast()">
                        <i class="fas fa-redo"></i>
                    </button>
                </div>
            `;
        }

        innerHTML += `</div>`; // Close message-content
        div.innerHTML = innerHTML;

        this.dom.chatBody.appendChild(div);

        // Create Lucide icons
        if (window.lucide) {
            lucide.createIcons(div);
        }

        // Highlight Code
>>>>>>> b354220fb359bebcfd34b81e8e9fc8a9219a9bac
        if (!isThinking && type === 'text' && window.hljs) {
            div.querySelectorAll('pre code').forEach(block => hljs.highlightElement(block));
        }

<<<<<<< HEAD
        if (!isThinking && type === 'text' && window.renderMathInElement) {
            renderMathInElement(div, {
                delimiters: [
                    { left: '$$', right: '$$', display: true },
                    { left: '$', right: '$', display: false }
=======
        // Render Math
        if (!isThinking && type === 'text' && window.renderMathInElement) {
            renderMathInElement(div, {
                delimiters: [
                    { left: '$', right: '$', display: false },
                    { left: '$$', right: '$$', display: true }
>>>>>>> b354220fb359bebcfd34b81e8e9fc8a9219a9bac
                ]
            });
        }

        this.scrollToBottom();
    }
<<<<<<< HEAD
}

document.addEventListener('DOMContentLoaded', () => {
=======

    scrollToBottom() {
        setTimeout(() => {
            this.dom.chatBody.scrollTop = this.dom.chatBody.scrollHeight;
        }, 100);
    }
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
>>>>>>> b354220fb359bebcfd34b81e8e9fc8a9219a9bac
    window.phantomChat = new PhantomChat();
});