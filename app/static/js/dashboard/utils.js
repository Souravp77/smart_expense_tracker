export const escapeHtml = (unsafe) => {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe.replace(/[&<>"'`=\/]/g, (char) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;', '/': '&#x2F;', '`': '&#x60;', '=': '&#x3D;'
    })[char]);
};

export const formatDate = (dateString, options = {}) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        
        const defaultOptions = options.long 
            ? { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
            : { year: 'numeric', month: 'short', day: 'numeric' };
            
        return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
    } catch {
        return dateString;
    }
};

export const formatCurrency = (amount, currencyCode = 'INR') => {
    const currency = currencyCode || 'INR';
    try {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
    } catch {
        return `${currency} ${parseFloat(amount).toFixed(2)}`;
    }
};

export const toast = {
    show(message, type = 'info', duration = 3000, options = {}) {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        if (options?.key) {
            container.querySelectorAll(`[data-toast-key="${options.key}"]`).forEach((el) => el.remove());
        }
        const toastEl = document.createElement('div');
        if (options?.key) {
            toastEl.dataset.toastKey = options.key;
        }
        const icons = {
            success: 'fa-circle-check',
            error: 'fa-circle-xmark',
            warning: 'fa-triangle-exclamation',
            info: 'fa-circle-info'
        };

        toastEl.className = `toast toast-${type} ${options.variant === 'undo' ? 'toast-undo' : ''} animate-slide-in`;
        toastEl.setAttribute('role', type === 'error' ? 'alert' : 'status');
        toastEl.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
        toastEl.setAttribute('aria-atomic', 'true');

        const icon = document.createElement('i');
        icon.className = `fas ${icons[type] || icons.info} toast-icon`;

        const body = document.createElement('div');
        body.className = 'toast-body';

        if (options?.badge) {
            const badgeEl = document.createElement('span');
            badgeEl.className = 'toast-badge';
            badgeEl.textContent = options.badge;
            body.appendChild(badgeEl);
        }

        const titleEl = document.createElement('div');
        titleEl.className = 'toast-title';
        titleEl.textContent = options?.title || message;
        body.appendChild(titleEl);

        if (options?.title) {
            const messageEl = document.createElement('div');
            messageEl.className = 'toast-message';
            messageEl.textContent = message;
            body.appendChild(messageEl);
        }

        if (options?.subtitle) {
            const subtitleEl = document.createElement('div');
            subtitleEl.className = 'toast-subtitle';
            subtitleEl.textContent = options.subtitle;
            body.appendChild(subtitleEl);
        }

        const actions = document.createElement('div');
        actions.className = 'toast-actions';

        if (options?.actionLabel && typeof options?.onAction === 'function') {
            const actionBtn = document.createElement('button');
            actionBtn.type = 'button';
            actionBtn.className = 'toast-action-btn';
            actionBtn.textContent = options.actionLabel;
            actionBtn.addEventListener('click', () => {
                options.onAction();
                toastEl.remove();
            });
            actions.appendChild(actionBtn);
        }

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'toast-close-btn';
        closeBtn.setAttribute('aria-label', 'Dismiss notification');
        closeBtn.innerHTML = '<i class="fas fa-xmark"></i>';
        closeBtn.addEventListener('click', () => toastEl.remove());
        actions.appendChild(closeBtn);

        const timer = document.createElement('div');
        timer.className = 'toast-timer';
        timer.style.animationDuration = `${duration}ms`;

        toastEl.appendChild(icon);
        toastEl.appendChild(body);
        toastEl.appendChild(actions);
        toastEl.appendChild(timer);

        container.appendChild(toastEl);

        setTimeout(() => {
            toastEl.style.opacity = '0';
            setTimeout(() => toastEl.remove(), 300);
        }, duration);
    },
    success(message) { this.show(message, 'success'); },
    error(message) { this.show(message, 'error'); },
    warning(message) { this.show(message, 'warning'); },
    info(message) { this.show(message, 'info'); }
};

export const loading = {
    show() {
        const el = document.getElementById('loadingOverlay');
        if (el) el.style.display = 'flex';
    },
    hide() {
        const el = document.getElementById('loadingOverlay');
        if (el) el.style.display = 'none';
    },
    async with(fn) {
        try {
            this.show();
            return await fn();
        } finally {
            this.hide();
        }
    }
};
