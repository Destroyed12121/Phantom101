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
            "Ask me anything...",
            "Explain quantum physics simply",
            "Write a poem about the stars",
            "Help me with my homework"
        ];

        this.dom = {};
        this.storageKey = 'phantom_ai_data';
        this.apiKey = 'sk_j66iDfX2lPbTZ2Otb9MI7xje7kRZQUyE';
        this.baseTextUrl = 'https://gen.pollinations.ai/v1/chat/completions';
        this.baseImageUrl = 'https://gen.pollinations.ai/image/';

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
            modelSelect: document.getElementById('modelSelector'),
            hero: document.getElementById('heroSection'),
            convList: document.getElementById('conversationsList'),
            title: document.getElementById('chatTitle')
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
            if (target.closest('.mode-btn')) {
                this.setMode(target.closest('.mode-btn').dataset.mode);
            }
            if (target.id === 'sidebarOverlay') {
                this.toggleSidebar(false);
            }
        });

        this.dom.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

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
        if (!text) return;

        this.dom.input.value = '';
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

        if (this.state.config.mode === 'image') {
            await this.generateImage(text, conv);
        } else {
            await this.generateText(text, conv);
        }

        this.saveState();
    }

    async generateText(input, conv) {
        const thinkingId = 'thinking-' + Date.now();
        this.appendMessage({ role: 'ai', id: thinkingId, isThinking: true });

        try {
            const messages = [
                { role: 'system', content: 'You are Phantom AI, a helpful and knowledgeable assistant. Use Markdown formatting. Be concise but thorough.' },
                ...conv.messages.slice(-10).map(m => ({
                    role: m.role === 'ai' ? 'assistant' : m.role,
                    content: m.content
                }))
            ];

            const res = await fetch(this.baseTextUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
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
            <div class="conversation-item ${c.id === this.state.currentId ? 'active' : ''}" 
                 onclick="phantomChat.loadConversation('${c.id}')">
                <span class="conversation-title">${this.escapeHtml(c.title)}</span>
                <button class="delete-btn" onclick="event.stopPropagation(); phantomChat.deleteConversation('${c.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    appendMessage({ role, content, type = 'text', prompt, id, isThinking }) {
        this.dom.hero.style.display = 'none';

        const div = document.createElement('div');
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

        if (window.lucide) lucide.createIcons({ icons: { ghost: lucide.icons.ghost, user: lucide.icons.user }, nameAttr: 'data-lucide' });

        if (!isThinking && type === 'text' && window.hljs) {
            div.querySelectorAll('pre code').forEach(block => hljs.highlightElement(block));
        }

        if (!isThinking && type === 'text' && window.renderMathInElement) {
            renderMathInElement(div, {
                delimiters: [
                    { left: '$$', right: '$$', display: true },
                    { left: '$', right: '$', display: false }
                ]
            });
        }

        this.scrollToBottom();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.phantomChat = new PhantomChat();
});