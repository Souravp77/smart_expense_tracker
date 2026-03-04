import { escapeHtml, formatDate } from './utils.js';

export class NotificationManager {
    constructor(app) {
        this.app = app;
        this.unreadCount = 0;
        this.notifications = [];
        this.isDropdownOpen = false;

        this.setupUI();
    }

    setupUI() {
        this.bellBtn = document.getElementById('notificationBellBtn');
        this.badge = document.getElementById('notificationBadge');
        this.countEl = document.getElementById('notificationCount');
        this.dropdown = document.getElementById('notificationDropdown');
        this.listEl = document.getElementById('notificationList');

        if (this.bellBtn) {
            this.bellBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown();
            });
        }

        document.addEventListener('click', (e) => {
            if (this.isDropdownOpen && !e.target.closest('#notificationDropdownContainer')) {
                this.closeDropdown();
            }
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isDropdownOpen) {
                this.closeDropdown();
                this.bellBtn?.focus();
            }
        });
    }

    async fetchNotifications() {
        try {
            const data = await this.app.requestJson('/api/notifications', {}, 'Failed to fetch notifications');
            this.notifications = data.data.notifications || [];
            this.unreadCount = data.data.unread_count || 0;
            this.updateUI();
        } catch (err) {
            console.error(err);
        }
    }

    updateUI() {
        if (!this.badge || !this.countEl || !this.listEl) return;

        if (this.unreadCount > 0) {
            this.badge.classList.remove('hidden');
            this.countEl.textContent = this.unreadCount > 9 ? '9+' : this.unreadCount;
        } else {
            this.badge.classList.add('hidden');
        }

        if (this.notifications.length === 0) {
            this.listEl.innerHTML = '<div class="p-4 text-center text-slate-500 dark:text-slate-400 text-sm">No new notifications</div>';
            return;
        }

        const today = [];
        const earlier = [];
        this.notifications.forEach((n) => {
            if (this.isToday(n.created_at)) today.push(n);
            else earlier.push(n);
        });

        const renderGroup = (title, rows) => {
            if (!rows.length) return '';
            return `
                <div class="border-b border-slate-100 dark:border-slate-800 last:border-b-0">
                    <p class="px-4 py-2 text-[10px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500">${title}</p>
                    ${rows.map((n) => {
                        const icon = this.getIcon(n.type);
                        return `
                        <div class="px-4 py-3 border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <div class="flex gap-3 items-start">
                                <div class="mt-1 text-xl">${icon}</div>
                                <button type="button" class="flex-1 min-w-0 text-left cursor-pointer" data-notification-id="${n.notification_id}" data-notification-action="open">
                                    <p class="text-sm font-semibold text-slate-800 dark:text-slate-200">${escapeHtml(n.title)}</p>
                                    <p class="text-xs text-slate-600 dark:text-slate-400 mt-0.5">${escapeHtml(n.message)}</p>
                                    <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-1">${formatDate(n.created_at)}</p>
                                </button>
                                <button type="button" class="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline shrink-0" data-notification-id="${n.notification_id}" data-notification-action="read">Mark read</button>
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>
            `;
        };

        this.listEl.innerHTML = `${renderGroup('Today', today)}${renderGroup('Earlier', earlier)}`;

        this.listEl.querySelectorAll('[data-notification-id][data-notification-action]').forEach((node) => {
            node.addEventListener('click', () => {
                const id = parseInt(node.getAttribute('data-notification-id') || '', 10);
                if (!Number.isFinite(id)) return;
                const notification = this.notifications.find((item) => item.notification_id === id);
                const action = node.getAttribute('data-notification-action');
                if (action === 'read') {
                    this.handleNotificationClick(id, '');
                    return;
                }
                this.handleNotificationClick(id, notification?.action_url || '');
            });
        });
    }

    isToday(value) {
        if (!value) return false;
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return false;
        const now = new Date();
        return d.getFullYear() === now.getFullYear()
            && d.getMonth() === now.getMonth()
            && d.getDate() === now.getDate();
    }

    getIcon(type) {
        if (type === 'budget_alert') return '<i class="fas fa-exclamation-triangle text-amber-500"></i>';
        if (type === 'goal_milestone') return '<i class="fas fa-trophy text-yellow-500"></i>';
        if (type === 'reminder') return '<i class="fas fa-clock text-blue-500"></i>';
        return '<i class="fas fa-bell text-slate-500"></i>';
    }

    toggleDropdown() {
        if (!this.dropdown) return;
        this.isDropdownOpen = !this.isDropdownOpen;
        this.dropdown.classList.toggle('hidden', !this.isDropdownOpen);
        if (this.bellBtn) this.bellBtn.setAttribute('aria-expanded', this.isDropdownOpen ? 'true' : 'false');
        if (this.isDropdownOpen) {
            this.fetchNotifications();
        }
    }

    closeDropdown() {
        if (!this.dropdown) return;
        this.isDropdownOpen = false;
        this.dropdown.classList.add('hidden');
        if (this.bellBtn) this.bellBtn.setAttribute('aria-expanded', 'false');
    }

    async handleNotificationClick(id, actionUrl) {
        try {
            await this.app.requestJson(`/api/notifications/read/${id}`, { method: 'POST' });
            this.unreadCount = Math.max(0, this.unreadCount - 1);
            this.notifications = this.notifications.filter(n => n.notification_id !== id);
            this.updateUI();

            this.closeDropdown();

            if (actionUrl) {
                const tab = actionUrl.replace('/', '');
                if (tab) {
                    this.app.navigate(tab);
                }
            }
        } catch (err) {
            console.error('Failed to mark read', err);
        }
    }

    async markAllRead() {
        try {
            await this.app.requestJson('/api/notifications/read-all', { method: 'POST' });
            this.unreadCount = 0;
            this.notifications = [];
            this.updateUI();
            this.closeDropdown();
        } catch (err) {
            console.error('Failed to mark all read', err);
        }
    }
}
