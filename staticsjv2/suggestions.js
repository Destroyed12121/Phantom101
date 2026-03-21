window.SuggestionsHelper = {
    init(i, b, s) {
        let x = -1,
            d = [];
        const f = q => {
            if (!q || q.includes('://')) return b.classList.remove('active');
            const c = 'gcb_' + Date.now();
            window[c] = r => {
                d = (r[1] || []).slice(0, 5);
                b.innerHTML = '';
                d.forEach((v, j) => {
                    const item = document.createElement('div');
                    item.className = 'suggestion-item';
                    item.dataset.i = j;
                    const icon = document.createElement('i');
                    icon.className = 'fa-solid fa-magnifying-glass';
                    const span = document.createElement('span');
                    span.textContent = v;
                    item.appendChild(icon);
                    item.appendChild(span);
                    b.appendChild(item);
                });
                b.classList.toggle('active', d.length > 0);
                x = -1;
                delete window[c];
                t.remove()
            };
            const t = document.createElement('script');
            t.src = `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(q)}&callback=${c}`;
            document.head.appendChild(t)
        };
        i.oninput = () => f(i.value.trim());
        i.onfocus = () => i.value.trim() && f(i.value.trim());
        i.onblur = () => setTimeout(() => b.classList.remove('active'), 150);
        i.onkeydown = e => {
            const l = b.querySelectorAll('.suggestion-item');
            if (e.key == 'Enter') {
                if (x >= 0 && d[x]) i.value = d[x];
                b.classList.remove('active');
                s();
                return;
            }
            if (e.key == 'Escape') {
                b.classList.remove('active');
                return;
            }
            if (!l.length) return;
            if (e.key == 'ArrowDown' || e.key == 'ArrowUp') {
                e.preventDefault();
                x = e.key == 'ArrowDown' ? (x + 1) % l.length : (x - 1 + l.length) % l.length;
                l.forEach((el, j) => {
                    el.classList.toggle('selected', j == x);
                    if (j == x) i.value = d[x]
                })
            }
        };
        b.onclick = e => {
            const m = e.target.closest('.suggestion-item');
            if (m) {
                i.value = d[m.dataset.i];
                b.classList.remove('active');
                s()
            }
        }
    }
};