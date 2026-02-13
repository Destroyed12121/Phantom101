class AmbianceManager {
    constructor() {
        this.enabled = localStorage.getItem('phantom_ambiance_enabled') !== 'false';
        this.container = null;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { alpha: false });
        this.canvas.width = 160;
        this.canvas.height = 90;
        this.canvas.className = 'ambiance-canvas';

        this.currentSource = null;
        this.animationFrame = null;
        this.isVideo = false;
        this.time = 0;

        this.update = this.update.bind(this);

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        this.container = document.getElementById('player-ambiance');
        if (!this.container) return;

        this.container.appendChild(this.canvas);

        // Ensure source is applied if it was set before DOM was ready
        if (this.currentSource) {
            this.setSource(this.currentSource);
        }

        if (this.enabled) {
            this.container.classList.add('active');
            this.startSampling();
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        localStorage.setItem('phantom_ambiance_enabled', this.enabled);

        if (!this.container) this.container = document.getElementById('player-ambiance');

        if (this.enabled) {
            this.container?.classList.add('active');
            // Re-apply current source to restore visuals immediately
            if (this.currentSource) this.setSource(this.currentSource);
            this.startSampling();
        } else {
            this.container?.classList.remove('active');
            this.stopSampling();
            this.clear();
        }
        return this.enabled;
    }

    setSource(source) {
        if (!source) return;

        this.currentSource = source;

        if (source instanceof HTMLVideoElement) {
            this.isVideo = true;
            if (this.container) {
                this.container.style.backgroundImage = 'none';
                this.canvas.style.display = 'block';
            }
        } else if (typeof source === 'string' && source.length > 0) {
            this.isVideo = false;
            if (this.container) {
                this.container.style.backgroundImage = `url(${source})`;
                this.container.style.backgroundSize = 'cover';
                this.container.style.backgroundPosition = 'center';
                this.canvas.style.display = 'none';
            }
        }

        if (this.enabled) this.startSampling();
    }

    startSampling() {
        this.stopSampling();
        if (!this.enabled || !this.currentSource) return;
        this.animationFrame = requestAnimationFrame(this.update);
    }

    stopSampling() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    clear() {
        if (this.container) {
            this.container.style.backgroundImage = 'none';
            this.container.style.transform = 'none';
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    update() {
        if (!this.enabled || !this.currentSource || !this.container) {
            this.stopSampling();
            return;
        }

        this.time += 0.003;
        const driftX = Math.sin(this.time) * 8;
        const driftY = Math.cos(this.time * 0.7) * 8;
        const scale = 1.1 + Math.sin(this.time * 0.4) * 0.02;

        const transform = `translate(${driftX}px, ${driftY}px) scale(${scale})`;

        if (this.isVideo) {
            const video = this.currentSource;
            if (video.readyState >= 2) {
                try {
                    this.ctx.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);
                } catch (e) {
                    this.stopSampling();
                    return;
                }
            }
            this.canvas.style.transform = transform;
        } else {
            this.container.style.transform = transform;
        }

        this.animationFrame = requestAnimationFrame(this.update);
    }
}

window.Ambiance = new AmbianceManager();
