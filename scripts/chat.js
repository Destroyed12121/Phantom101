/**
 * PHANTOM AI - Core Logic
 * Handles local chat state, Pollinations.ai integration, and UI updates.
 */

class PhantomChat {
    constructor() {
        this.state = {
            conversations: [],
            currentId: null,
            models: { text: [], image: [] },
            config: {
                model: 'openai',
                mode: 'text', // 'text' | 'image'
                temperature: 0.7,
                autoSave: true
            }
        };

        this.dom = {};
        this.abortController = null;
        this.storageKey = 'phantom_ai_data';

        this.cacheDOM();
        this.loadState();
        this.init();
    }

    init() {
        this.bindEvents();
        this.fetchModels();
        this.render();

        // Check for Markdown/HLJS presence
        if (!window.marked) console.warn('Marked.js not loaded');
        if (!window.hljs) console.warn('Highlight.js not loaded');

        // System ready notification
        Notify.success('System Ready', 'Phantom AI initialized successfully');
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
        // Global events
        document.addEventListener('click', (e) => {
            if (e.target.closest('#sidebarToggle') || e.target.closest('#menuToggle')) {
                this.toggleSidebar();
            }
            if (e.target.closest('#newChatBtn')) {
                this.createConversation();
            }
            if (e.target.closest('.delete-btn')) {
                // Handled in render loop or delegation
            }
            if (e.target.closest('.mode-btn')) {
                const btn = e.target.closest('.mode-btn');
                this.setMode(btn.dataset.mode);
            }
            if (e.target.id === 'sidebarOverlay') {
                this.toggleSidebar(false);
            }
        });

        // Input events
        document.addEventListener('keydown', (e) => {
            if (e.target.id === 'chatInput' && e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        document.addEventListener('input', (e) => {
            if (e.target.id === 'chatInput') {
                this.updateInputHeight(e.target);
                this.dom.sendBtn.disabled = !e.target.value.trim();
            }
        });

        // Model change
        document.addEventListener('change', (e) => {
            if (e.target.id === 'modelSelector') {
                this.state.config.model = e.target.value;
                this.saveState();
                Notify.success('AI Model Updated', `Switched to ${this.state.config.model}`);
            }
        });

        // Send Button
        document.addEventListener('click', (e) => {
            if (e.target.closest('#sendBtn')) {
                this.sendMessage();
            }
        });
    }

    updateInputHeight(el) {
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 200) + 'px';
    }

    toggleSidebar(forceState) {
        const isDesktop = window.innerWidth > 768;
        const isActive = isDesktop ? !this.dom.sidebar.classList.contains('collapsed') : this.dom.sidebar.classList.contains('active');
        const newState = forceState !== undefined ? forceState : !isActive;

        // Desktop uses 'collapsed' class logic, Mobile uses 'active' class logic
        if (isDesktop) {
            this.dom.sidebar.classList.toggle('collapsed', !newState);
            this.dom.app.classList.toggle('sidebar-collapsed', !newState);
        } else {
            this.dom.sidebar.classList.toggle('active', newState);
            this.dom.sidebarOverlay.classList.toggle('active', newState);
        }
    }

    async fetchModels() {
        try {
            // Fetch Text Models
            const textRes = await fetch('https://text.pollinations.ai/models');
            const textData = await textRes.json();
            this.state.models.text = textData.map(m => typeof m === 'object' ? m.name : m);

            // Fetch Image Models
            const imgRes = await fetch('https://image.pollinations.ai/models');
            const imgData = await imgRes.json();
            this.state.models.image = imgData.map(m => typeof m === 'object' ? m.name : m);

            this.populateModelSelect();
        } catch (e) {
            console.error('Failed to fetch models', e);
            // Fallbacks
            this.state.models.text = ['openai', 'mistral', 'llama', 'searchgpt'];
            this.state.models.image = ['flux', 'turbo'];
            this.populateModelSelect();
        }
    }

    populateModelSelect() {
        if (!this.dom.modelSelect) return;

        const mode = this.state.config.mode;
        const models = this.state.models[mode] || [];

        // Priority sorting
        const priority = ['openai', 'gpt4', 'p1', 'flux'];
        models.sort((a, b) => {
            const pA = priority.indexOf(a);
            const pB = priority.indexOf(b);
            if (pA !== -1 && pB !== -1) return pA - pB;
            if (pA !== -1) return -1;
            if (pB !== -1) return 1;
            return a.localeCompare(b);
        });

        this.dom.modelSelect.innerHTML = models.map(m =>
            `<option value="${m}" ${m === this.state.config.model ? 'selected' : ''}>
                ${m.charAt(0).toUpperCase() + m.slice(1).replace('gpt', 'GPT')}
            </option>`
        ).join('');
    }

    setMode(mode) {
        if (mode !== 'text' && mode !== 'image') return;
        this.state.config.mode = mode;

        // Update UI
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        // Reset model to default for that mode
        this.state.config.model = mode === 'text' ? 'openai' : 'flux';
        this.populateModelSelect();
        this.saveState();
    }

    // ============================================
    // CONVERSATIONS
    // ============================================
    loadState() {
        const raw = localStorage.getItem(this.storageKey);
        if (raw) {
            try {
                const data = JSON.parse(raw);
                this.state.conversations = data.conversations || [];
                this.state.currentId = data.currentId;
                this.state.config = { ...this.state.config, ...data.config };
            } catch (e) {
                console.error('State load error', e);
            }
        }

        if (this.state.conversations.length === 0) {
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
        const newConv = {
            id: Date.now().toString(),
            title: 'New Chat',
            messages: [],
            updatedAt: Date.now()
        };
        this.state.conversations.unshift(newConv);
        this.state.currentId = newConv.id;
        this.render();
        this.dom.input.focus();
        this.saveState();
    }

    deleteConversation(id) {
        if (!confirm('Are you sure you want to delete this chat?')) return;

        this.state.conversations = this.state.conversations.filter(c => c.id !== id);
        if (this.state.currentId === id) {
            this.state.currentId = this.state.conversations[0]?.id || null;
            if (!this.state.currentId) this.createConversation();
        }
        this.render();
        this.saveState();
    }

    getCurrentConversation() {
        return this.state.conversations.find(c => c.id === this.state.currentId);
    }

    // ============================================
    // MESSAGING
    // ============================================
    async sendMessage() {
        const text = this.dom.input.value.trim();
        if (!text) return;

        // Reset Input
        this.dom.input.value = '';
        this.updateInputHeight(this.dom.input);
        this.dom.sendBtn.disabled = true;

        const conv = this.getCurrentConversation();
        if (!conv) return;

        // Add User Message
        conv.messages.push({ role: 'user', content: text, type: 'text' });
        this.appendMessage({ role: 'user', content: text });
        this.scrollToBottom();

        // Title Generation (First Msg)
        if (conv.messages.length === 1) {
            this.generateTitle(text);
        }

        // Logic based on mode
        if (this.state.config.mode === 'image') {
            await this.generateImage(text, conv);
        } else {
            await this.generateText(text, conv);
        }

        this.saveState();
    }

    async generateText(input, conv) {
        // Create Placeholder
        const placeholderId = 'thinking-' + Date.now();
        this.appendMessage({ role: 'ai', content: 'Thinking...', id: placeholderId, isThinking: true });
        this.scrollToBottom();

        try {
            const systemPrompt = "You are Phantom AI. Use Markdown. For Math, use $...$ for inline and $$...$$ for block. Respond concisely and with a simple tone";
            const history = conv.messages.filter(m => m.type !== 'image').map(m => `${m.role}: ${m.content}`).join('\n');
            const fullPrompt = `System: ${systemPrompt}\n\n${history}`;

            const url = `https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}?model=${this.state.config.model}`;

            const res = await fetch(url);
            if (!res.ok) throw new Error('API Error');
            const data = await res.text();

            // Replace placeholder
            const thinkingEl = document.getElementById(placeholderId);
            if (thinkingEl) thinkingEl.remove();

            conv.messages.push({ role: 'ai', content: data, type: 'text' });
            this.appendMessage({ role: 'ai', content: data });

        } catch (e) {
            console.error(e);
            Notify.error('AI Error', 'Failed to generate response');
            const thinkingEl = document.getElementById(placeholderId);
            if (thinkingEl) thinkingEl.innerHTML = '<span style="color:var(--error)">Error generating response.</span>';
        }
    }

    async generateImage(input, conv) {
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(input)}?model=${this.state.config.model}&nologo=true`;

        conv.messages.push({ role: 'ai', content: url, prompt: input, type: 'image' });
        this.appendMessage({ role: 'ai', content: url, type: 'image', prompt: input });
    }

    async generateTitle(firstMsg) {
        try {
            const prompt = `Generate a 3-word title for: "${firstMsg}"`;
            const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai`);
            const title = await res.text();

            const conv = this.getCurrentConversation();
            if (conv && title) {
                conv.title = title.replace(/"/g, '').trim();
                this.renderConversationList();
                this.dom.title.textContent = conv.title;
            }
        } catch (e) { }
    }

    // ============================================
    // RENDERING
    // ============================================
    render() {
        const conv = this.getCurrentConversation();

        // Render List
        this.renderConversationList();

        // Render Chat Body
        this.dom.chatBody.innerHTML = ''; // efficient enough for now

        if (!conv || conv.messages.length === 0) {
            this.dom.hero.style.display = 'block';
        } else {
            this.dom.hero.style.display = 'none';
            this.dom.title.textContent = conv.title;

            conv.messages.forEach(msg => this.appendMessage(msg));
            this.scrollToBottom();
        }
    }

    renderConversationList() {
        this.dom.convList.innerHTML = this.state.conversations.map(c => `
            <div class="conversation-item ${c.id === this.state.currentId ? 'active' : ''}" onclick="window.phantomChat.loadConversation('${c.id}')">
                <span class="conversation-title">${c.title}</span>
                <button class="delete-btn" onclick="event.stopPropagation(); window.phantomChat.deleteConversation('${c.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }

    loadConversation(id) {
        this.state.currentId = id;
        this.render();
    }

    appendMessage({ role, content, type = 'text', prompt, id, isThinking }) {
        this.dom.hero.style.display = 'none';

        const div = document.createElement('div');
        div.className = `message ${role}-message`;
        if (id) div.id = id;

        let innerHTML = '';

        // Avatar
        innerHTML += `
            <div class="message-avatar">
                <i class="fas ${role === 'ai' ? 'fa-robot' : 'fa-user'}"></i>
            </div>
        `;

        // Content
        innerHTML += `<div class="message-content"><div class="message-text">`;

        if (isThinking) {
            innerHTML += `<span class="thinking-dots">Thinking...</span>`;
        } else if (type === 'image') {
            innerHTML += `
                <p>Generating: <em>${prompt}</em></p>
                <img src="${content}" class="generated-image" loading="lazy" alt="${prompt}">
            `;
        } else {
            // Markdown Parse
            const parsed = window.marked ? marked.parse(content) : content;
            innerHTML += parsed;
        }

        innerHTML += `</div></div>`;
        div.innerHTML = innerHTML;

        this.dom.chatBody.appendChild(div);

        // Hydrate Math / Syntax
        if (!isThinking && type === 'text') {
            if (window.renderMathInElement) {
                renderMathInElement(div, {
                    delimiters: [
                        { left: '$$', right: '$$', display: true },
                        { left: '$', right: '$', display: false }
                    ]
                });
            }
            div.querySelectorAll('pre code').forEach(block => {
                if (window.hljs) hljs.highlightElement(block);
            });
        }
    }

    scrollToBottom() {
        setTimeout(() => {
            this.dom.chatBody.scrollTop = this.dom.chatBody.scrollHeight;
        }, 50);
    }
}

// Init on Load
window.addEventListener('DOMContentLoaded', () => {
    window.phantomChat = new PhantomChat();
});
