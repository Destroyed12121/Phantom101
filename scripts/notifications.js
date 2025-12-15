/**
 * NotificationManager - A clean, reusable notification system
 * Usage:
 *   Notify.success('Message here');
 *   Notify.error('Something went wrong');
 *   Notify.info('Just so you know...');
 *   Notify.warning('Be careful!');
 */

(function () {
    // Inject styles once
    const style = document.createElement('style');
    style.textContent = `
        .notify-container {
            position: fixed;
            top: 16px;
            right: 16px;
            z-index: 99999;
            display: flex;
            flex-direction: column;
            gap: 8px;
            pointer-events: none;
            font-family: 'Inter', system-ui, sans-serif;
        }

        .notify-toast {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            background: #0f0f0f;
            border: 1px solid #1f1f1f;
            border-radius: 10px;
            color: #e4e4e7;
            font-size: 13px;
            min-width: 280px;
            max-width: 380px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
            pointer-events: auto;
            transform: translateX(120%);
            opacity: 0;
            transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
        }

        .notify-toast.show {
            transform: translateX(0);
            opacity: 1;
        }

        .notify-toast.hiding {
            transform: translateX(120%);
            opacity: 0;
        }

        .notify-icon {
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .notify-icon svg {
            width: 18px;
            height: 18px;
        }

        .notify-content {
            flex: 1;
            line-height: 1.4;
        }

        .notify-title {
            font-weight: 600;
            margin-bottom: 2px;
        }

        .notify-message {
            color: #a1a1aa;
            font-size: 12px;
        }

        .notify-close {
            background: none;
            border: none;
            color: #52525b;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            transition: all 0.15s;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .notify-close:hover {
            background: #1a1a1a;
            color: #e4e4e7;
        }

        .notify-close svg {
            width: 14px;
            height: 14px;
        }

        /* Types */
        .notify-toast.success { border-left: 3px solid #22c55e; }
        .notify-toast.success .notify-icon { color: #22c55e; }

        .notify-toast.error { border-left: 3px solid #ef4444; }
        .notify-toast.error .notify-icon { color: #ef4444; }

        .notify-toast.warning { border-left: 3px solid #f59e0b; }
        .notify-toast.warning .notify-icon { color: #f59e0b; }

        .notify-toast.info { border-left: 3px solid #3b82f6; }
        .notify-toast.info .notify-icon { color: #3b82f6; }

        /* Progress bar */
        .notify-progress {
            position: absolute;
            bottom: 0;
            left: 0;
            height: 2px;
            background: rgba(255, 255, 255, 0.15);
            border-radius: 0 0 10px 10px;
            transition: width linear;
        }
    `;
    document.head.appendChild(style);

    // Create container
    let container = null;
    function getContainer() {
        if (!container) {
            container = document.createElement('div');
            container.className = 'notify-container';
            document.body.appendChild(container);
        }
        return container;
    }

    // Icons (inline SVG for no dependencies)
    const icons = {
        success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
        error: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
        warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
        info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
        close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
    };

    // Create a notification
    function createNotification(type, title, message, duration = 4000) {
        const toast = document.createElement('div');
        toast.className = `notify-toast ${type}`;
        toast.innerHTML = `
            <div class="notify-icon">${icons[type]}</div>
            <div class="notify-content">
                <div class="notify-title">${title}</div>
                ${message ? `<div class="notify-message">${message}</div>` : ''}
            </div>
            <button class="notify-close">${icons.close}</button>
            <div class="notify-progress"></div>
        `;

        const closeBtn = toast.querySelector('.notify-close');
        const progress = toast.querySelector('.notify-progress');

        const dismiss = () => {
            toast.classList.add('hiding');
            setTimeout(() => toast.remove(), 300);
        };

        closeBtn.onclick = dismiss;

        // Progress bar animation
        progress.style.width = '100%';
        setTimeout(() => {
            progress.style.transitionDuration = `${duration}ms`;
            progress.style.width = '0%';
        }, 50);

        // Auto dismiss
        const timeout = setTimeout(dismiss, duration);

        // Pause on hover
        toast.onmouseenter = () => {
            clearTimeout(timeout);
            progress.style.transitionDuration = '0ms';
        };

        toast.onmouseleave = () => {
            const remaining = (parseFloat(getComputedStyle(progress).width) / toast.offsetWidth) * duration;
            progress.style.transitionDuration = `${remaining}ms`;
            progress.style.width = '0%';
            setTimeout(dismiss, remaining);
        };

        getContainer().appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        return toast;
    }

    // Public API
    window.Notify = {
        success: (title, message, duration) => createNotification('success', title, message, duration),
        error: (title, message, duration) => createNotification('error', title, message, duration),
        warning: (title, message, duration) => createNotification('warning', title, message, duration),
        info: (title, message, duration) => createNotification('info', title, message, duration)
    };
})();
