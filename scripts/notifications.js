(function () {
    const style = document.createElement('style');
    style.textContent = `
        .notify-container { position: fixed; top: 16px; right: 16px; z-index: 99999; display: flex; flex-direction: column; gap: 8px; pointer-events: none; font-family: 'Inter', sans-serif; }
        .notify-toast { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: rgba(15, 15, 15, 0.9); backdrop-filter: blur(10px); border: 1px solid var(--border, #1f1f1f); border-radius: 10px; color: #e4e4e7; font-size: 13px; min-width: 280px; max-width: 380px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4); pointer-events: auto; transform: translateX(120%); opacity: 0; transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease; position: relative; overflow: hidden; }
        .notify-toast.show { transform: translateX(0); opacity: 1; }
        .notify-toast.hiding { transform: translateX(120%); opacity: 0; }
        .notify-icon { width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .notify-icon svg { width: 18px; height: 18px; }
        .notify-content { flex: 1; line-height: 1.4; }
        .notify-title { font-weight: 600; margin-bottom: 2px; }
        .notify-message { color: #a1a1aa; font-size: 12px; }
        .notify-close { background: none; border: none; color: #52525b; cursor: pointer; padding: 4px; border-radius: 4px; display: flex; align-items: center; justify-content: center; }
        .notify-close:hover { background: rgba(255,255,255,0.1); color: #fff; }
        .notify-close svg { width: 14px; height: 14px; }
        .notify-toast.success { border-left: 3px solid #22c55e; } .notify-toast.success .notify-icon { color: #22c55e; }
        .notify-toast.error { border-left: 3px solid #ef4444; } .notify-toast.error .notify-icon { color: #ef4444; }
        .notify-toast.warning { border-left: 3px solid #f59e0b; } .notify-toast.warning .notify-icon { color: #f59e0b; }
        .notify-toast.info { border-left: 3px solid #3b82f6; } .notify-toast.info .notify-icon { color: #3b82f6; }
        .notify-progress { position: absolute; bottom: 0; left: 0; height: 2px; background: rgba(255, 255, 255, 0.2); transition: width linear; }
    `;
    document.head.appendChild(style);

    let container = null;
    const getContainer = () => container || (container = document.body.appendChild(Object.assign(document.createElement('div'), { className: 'notify-container' })));

    const icons = {
        success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
        error: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
        warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
        info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
        close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
    };

    function notify(type, title, msg = '', dur = 4000) {
        const t = document.createElement('div');
        t.className = `notify-toast ${type}`;
        t.innerHTML = `<div class="notify-icon">${icons[type]}</div><div class="notify-content"><div class="notify-title">${title}</div><div class="notify-message">${msg}</div></div><button class="notify-close">${icons.close}</button><div class="notify-progress"></div>`;
        const p = t.querySelector('.notify-progress');
        const dismiss = () => { t.classList.add('hiding'); setTimeout(() => t.remove(), 300); };
        t.querySelector('.notify-close').onclick = dismiss;
        p.style.width = '100%';
        setTimeout(() => { p.style.transition = `width ${dur}ms linear`; p.style.width = '0%'; }, 50);
        let timer = setTimeout(dismiss, dur);
        t.onmouseenter = () => { clearTimeout(timer); p.style.transition = 'none'; };
        t.onmouseleave = () => {
            const rem = (parseFloat(getComputedStyle(p).width) / t.offsetWidth) * dur;
            p.style.transition = `width ${rem}ms linear`; p.style.width = '0%';
            timer = setTimeout(dismiss, rem);
        };
        getContainer().appendChild(t);
        requestAnimationFrame(() => t.classList.add('show'));
    }

    window.Notify = {
        success: (a, b, c) => notify('success', a, b, c),
        error: (a, b, c) => notify('error', a, b, c),
        warning: (a, b, c) => notify('warning', a, b, c),
        info: (a, b, c) => notify('info', a, b, c)
    };
})();
