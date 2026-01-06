/**
 * PHANTOM AI - Core Logic
 * Fully integrated with Phantom Design System (main.css)
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

        // UI: Auto-typing placeholders
        this.placeholders = [
            "Explain point slope form",
            "Generate a cinematic phantom concept art...",
            "Explain quantum physics in simple terms...",
            "Write a dark atmospheric poem...",
            "How do I center a div using CSS?",
            "Design a futuristic UI layout..."
        ];

        this.dom = {};
        this.abortController = null;
        this.storageKey = 'phantom_ai_data';

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
                this.toggleSidebar(false);
            }
        });

        // Input Handling
        this.dom.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        this.dom.input.addEventListener('input', (e) => {
            this.updateInputHeight(e.target);
            this.dom.sendBtn.disabled = !e.target.value.trim();
        });

        // Model Change
        this.dom.modelSelect.addEventListener('change', (e) => {
            this.state.config.model = e.target.value;
            this.saveState();
            if (window.Notify) Notify.success('Model Updated', `Switched to ${this.state.config.model}`);
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
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 200) + 'px';
    }

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
            const headers = { 'Authorization': 'Bearer sk_j66iDfX2lPbTZ2Otb9MI7xje7kRZQUyE' };
            const [textRes, imgRes] = await Promise.all([
                fetch('https://text.pollinations.ai/models', { headers }),
                fetch('https://image.pollinations.ai/models', { headers })
            ]);

            this.state.models.text = await textRes.json();
            this.state.models.image = await imgRes.json();
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

        this.dom.modelSelect.innerHTML = models.map(m => {
            const name = typeof m === 'object' ? m.name : m;
            return `<option value="${name}" ${name === this.state.config.model ? 'selected' : ''}>
                ${name.charAt(0).toUpperCase() + name.slice(1)}
            </option>`;
        }).join('');
    }

    setMode(mode) {
        if (mode !== 'text' && mode !== 'image') return;
        this.state.config.mode = mode;

        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        this.state.config.model = mode === 'text' ? 'openai' : 'flux';
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

    loadConversation(id) {
        this.state.currentId = id;
        this.render();
        if (window.innerWidth <= 768) this.toggleSidebar(false);
    }

    // ============================================
    // MESSAGING ENGINE
    // ============================================

    async sendMessage() {
        const text = this.dom.input.value.trim();
        if (!text) return;

        this.dom.input.value = '';
        this.updateInputHeight(this.dom.input);
        this.dom.sendBtn.disabled = true;

        const conv = this.getCurrentConversation();
        if (!conv) return;

        // User Message
        conv.messages.push({ role: 'user', content: text, type: 'text' });
        this.appendMessage({ role: 'user', content: text });

        if (conv.messages.length === 1) this.generateTitle(text);

        // Logic based on mode
        if (this.state.config.mode === 'image') {
            await this.generateImage(text, conv);
        } else {
            await this.generateText(text, conv);
        }

        this.saveState();
    }

    async generateText(input, conv) {
        const placeholderId = 'thinking-' + Date.now();
        this.appendMessage({ role: 'ai', content: 'Processing...', id: placeholderId, isThinking: true });

        try {
            const system = "You are Phantom AI. Use Markdown. Concise, sleek tone.";
            const history = conv.messages.slice(-6).map(m => `${m.role}: ${m.content}`).join('\n');
            const prompt = `System: ${system}\n${history}`;

            const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=${this.state.config.model}`;
            const res = await fetch(url, {
                headers: { 'Authorization': 'Bearer sk_j66iDfX2lPbTZ2Otb9MI7xje7kRZQUyE' }
            });
            const data = await res.text();

            document.getElementById(placeholderId)?.remove();

            conv.messages.push({ role: 'ai', content: data, type: 'text' });
            this.appendMessage({ role: 'ai', content: data });

        } catch (e) {
            console.error(e);
            const el = document.getElementById(placeholderId);
            if (el) el.innerHTML = `<span class="text-error">Communication failed. Retry?</span>`;
        }
    }

    async generateImage(input, conv) {
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(input)}?model=${this.state.config.model}&nologo=true`;
        conv.messages.push({ role: 'ai', content: url, prompt: input, type: 'image' });
        this.appendMessage({ role: 'ai', content: url, type: 'image', prompt: input });
    }

    async generateTitle(text) {
        try {
            const res = await fetch(`https://text.pollinations.ai/Generate a 3 word title for: ${encodeURIComponent(text)}?model=openai-fast`);
            const title = await res.text();
            const conv = this.getCurrentConversation();
            if (conv && title) {
                conv.title = title.replace(/"/g, '').trim();
                this.dom.title.textContent = conv.title;
                this.renderConversationList();
            }
        } catch (e) { }
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
            <div class="conversation-item ${c.id === this.state.currentId ? 'active' : ''}" onclick="window.phantomChat.loadConversation('${c.id}')">
                <span class="conversation-title">${c.title}</span>
                <button class="delete-btn" onclick="event.stopPropagation(); window.phantomChat.deleteConversation('${c.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }

    appendMessage({ role, content, type = 'text', prompt, id, isThinking }) {
        this.dom.hero.style.display = 'none';

        const div = document.createElement('div');
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
                <img src="${content}" class="generated-image" loading="lazy" alt="${prompt}">
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
        if (!isThinking && type === 'text' && window.hljs) {
            div.querySelectorAll('pre code').forEach(block => hljs.highlightElement(block));
        }

        // Render Math
        if (!isThinking && type === 'text' && window.renderMathInElement) {
            renderMathInElement(div, {
                delimiters: [
                    { left: '$', right: '$', display: false },
                    { left: '$$', right: '$$', display: true }
                ]
            });
        }

        this.scrollToBottom();
    }

    scrollToBottom() {
        setTimeout(() => {
            this.dom.chatBody.scrollTop = this.dom.chatBody.scrollHeight;
        }, 100);
    }
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    window.phantomChat = new PhantomChat();
});