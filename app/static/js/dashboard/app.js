import {
    renderAnalyticsView,
    renderBudgetView,
    renderDashboardView,
    renderSavingsView,
    renderSettingsView,
    renderTransactionsView,
} from './views/index.js';
import { CATEGORY_OPTIONS, CHART_COLORS } from './constants.js';
import { bindDatabaseSync } from './sync.js';
import { filterByPeriod, monthLabel, toISODate } from './time-utils.js';
import { escapeHtml, formatCurrency, formatDate, loading, toast } from './utils.js';

const GOAL_COLOR_PROFILES = {
    'bg-blue-500': { solid: '#2563eb', soft: 'rgba(37,  99, 235, 0.14)' },
    'bg-teal-600': { solid: '#0d9488', soft: 'rgba(13, 148, 136, 0.14)' },
    'bg-violet-600': { solid: '#7c3aed', soft: 'rgba(124, 58, 237, 0.14)' },
    'bg-rose-600': { solid: '#e11d48', soft: 'rgba(225, 29,  72, 0.14)' },
    'bg-amber-700': { solid: '#d97706', soft: 'rgba(217,119,   6, 0.14)' },
    'bg-indigo-600': { solid: '#4f46e5', soft: 'rgba(79,  70, 229, 0.14)' },
};

export class ExpenseApp {
    constructor() {
        const requestedTab = (window.APP_CONFIG && window.APP_CONFIG.initialTab) || 'dashboard';
        const allowedTabs = new Set(['dashboard', 'budget', 'transactions', 'savings', 'analytics', 'settings']);
        const initialTab = allowedTabs.has(requestedTab) ? requestedTab : 'dashboard';
        const savedThemeMode = localStorage.getItem('themeMode') || localStorage.getItem('theme') || 'light';
        const initialMode = savedThemeMode === 'dark' ? 'dark' : 'light';
        const currencyPreferenceSet = localStorage.getItem('currencyPreferenceSet') === '1';

        this.state = {
            activeTab: initialTab,
            transactions: [],
            savingsGoals: [],
            budgets: [],
            user: null,
            themeMode: initialMode,
            theme: initialMode,
            budgetMonth: new Date().toISOString().slice(0, 7),
            filterType: 'all',
            filterSearch: '',
            pagination: { page: 1, limit: 8 },
            dashboardTrendPeriod: 'week',
            dashboardBreakdownPeriod: 'month',
            analyticsPeriod: '6m',
            initialized: false
        };
        this.hasUserCurrencyPreference = currencyPreferenceSet;
        this.charts = {};
        this.isFetchingData = false;
        this.lastSyncAt = 0;
        this.pendingTransactionUndo = null;
        this.pendingTransactionUndoToken = 0;
        this.pendingTransactionUndoTimer = null;
        this.isUndoingTransaction = false;
        this.goalCelebrationId = null;
    }

    async requestJson(url, options = {}, fallbackMessage = 'Request failed', _hasRetried = false) {
        let response;
        try {
            response = await fetch(url, options);
        } catch (error) {
            throw new Error(`Network error: ${error.message}`);
        }

        let rawBody = '';
        try {
            rawBody = await response.text();
        } catch {
            rawBody = '';
        }

        let payload = null;
        try {
            payload = rawBody ? JSON.parse(rawBody) : null;
        } catch {
            payload = null;
        }

        if (!response.ok) {
            // If the app is deployed under a subpath, absolute `/api/...` calls may 404.
            // Retry once with a relative api path so it resolves under the current base path.
            if (
                !_hasRetried &&
                response.status === 404 &&
                typeof url === 'string' &&
                url.startsWith('/api/')
            ) {
                const relativeUrl = url.replace(/^\/+/, '');
                return this.requestJson(relativeUrl, options, fallbackMessage, true);
            }

            const plainText = rawBody ? rawBody.replace(/\s+/g, ' ').trim() : '';
            const httpFallback = plainText
                ? `HTTP ${response.status}: ${plainText.slice(0, 160)}`
                : `${fallbackMessage} (HTTP ${response.status})`;
            const message = payload?.error || payload?.message || httpFallback;
            throw new Error(message);
        }

        return payload ?? {};
    }

    async init() {
        this.applyTheme();
        this.updateDate();
        this.closeSidebar();
        await this.fetchData();
        bindDatabaseSync(this);
    }

    async fetchData() {
        if (this.isFetchingData) return;
        this.isFetchingData = true;

        // Show loading state if it takes more than 300ms
        const loadingTimer = setTimeout(() => {
            document.getElementById('loadingOverlay').style.display = 'flex';
        }, 300);

        try {
            const data = await this.requestJson('/api/data', {}, 'Failed to fetch data');

            this.state.transactions = data.transactions;
            this.state.savingsGoals = data.savingsGoals;
            this.state.budgets = data.budgets || [];
            this.state.user = data.user;

            // INR-first behavior: until user explicitly chooses another currency,
            // keep UI on INR and backfill server value.
            if (this.state.user && !this.hasUserCurrencyPreference) {
                const previousCurrency = this.state.user.currency;
                this.state.user.currency = 'INR';

                if (previousCurrency && previousCurrency !== 'INR') {
                    this.requestJson(
                        '/api/settings',
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ currency: 'INR' })
                        },
                        'Failed to normalize currency'
                    ).catch(() => { });
                }
            }
            this.lastSyncAt = Date.now();

            this.updateUserProfileUI();
            this.navigate(this.state.activeTab);
            this.state.initialized = true;
        } catch (error) {
            toast.error(error.message);
            console.error(error);
            // If data fetch fails, we might want to check connectivity
            this.runConnectivityCheck();
        } finally {
            clearTimeout(loadingTimer);
            document.getElementById('loadingOverlay').style.display = 'none';
            this.isFetchingData = false;
        }
    }

    async syncFromDatabase(force = false) {
        const now = Date.now();
        if (!force && now - this.lastSyncAt < 10000) return;
        await this.fetchData();
    }

    toggleTheme() {
        const nextMode = this.state.theme === 'dark' ? 'light' : 'dark';
        this.setThemeMode(nextMode);
    }

    setThemeMode(mode) {
        const normalized = mode === 'dark' ? 'dark' : 'light';
        this.state.themeMode = normalized;
        this.state.theme = normalized;
        localStorage.setItem('themeMode', normalized);
        localStorage.setItem('theme', normalized);

        this.applyTheme();
        if (this.state.activeTab === 'settings') this.render();
    }

    applyTheme() {
        const html = document.documentElement;
        const icon = document.getElementById('themeIcon');
        if (this.state.theme === 'dark') {
            html.classList.add('dark');
            if (icon) icon.className = 'fas fa-sun';
        } else {
            html.classList.remove('dark');
            if (icon) icon.className = 'fas fa-moon';
        }

        const rootStyles = getComputedStyle(document.documentElement);
        Chart.defaults.color = rootStyles.getPropertyValue('--chart-text').trim() || '#64748b';
        Chart.defaults.borderColor = rootStyles.getPropertyValue('--chart-grid').trim() || '#e2e8f0';
        this.refreshCharts();
    }

    async logout() {
        const confirmed = await this.showConfirmDialog({
            title: 'Sign out',
            message: 'Do you want to sign out of your account?',
            confirmText: 'Sign out',
            cancelText: 'Stay signed in',
            danger: true,
        });

        if (!confirmed) return;
        window.location.href = (window.APP_CONFIG && window.APP_CONFIG.logoutUrl) || '/logout';
    }

    showConfirmDialog({
        title = 'Please confirm',
        message = 'Are you sure?',
        confirmText = 'Confirm',
        cancelText = 'Cancel',
        danger = false,
    } = {}) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.style.display = 'flex';
            overlay.innerHTML = `
                <div class="modal-container">
                    <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
                        <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                            <h3 class="text-lg font-bold text-slate-900 dark:text-white">${title}</h3>
                        </div>
                        <div class="px-6 py-5">
                            <p class="text-sm text-slate-600 dark:text-slate-300">${message}</p>
                        </div>
                        <div class="px-6 pb-6 flex justify-end gap-3">
                            <button type="button" class="btn-secondary" data-confirm-cancel>${cancelText}</button>
                            <button type="button" class="${danger ? 'btn-danger' : 'btn-primary'}" data-confirm-ok>${confirmText}</button>
                        </div>
                    </div>
                </div>
            `;

            const cleanup = (value) => {
                document.removeEventListener('keydown', onKeydown);
                overlay.remove();
                resolve(value);
            };

            const onKeydown = (event) => {
                if (event.key === 'Escape') cleanup(false);
            };

            overlay.addEventListener('click', (event) => {
                if (event.target === overlay) cleanup(false);
            });

            overlay.querySelector('[data-confirm-cancel]')?.addEventListener('click', () => cleanup(false));
            overlay.querySelector('[data-confirm-ok]')?.addEventListener('click', () => cleanup(true));

            document.addEventListener('keydown', onKeydown);
            document.body.appendChild(overlay);
        });
    }

    navigate(tab) {
        this.state.activeTab = tab;
        this.state.pagination.page = 1;
        document.querySelectorAll('.nav-item').forEach((el) => {
            const isActive = el.id === `nav-${tab}`;
            el.classList.toggle('active', isActive);
            el.classList.toggle('text-white', isActive);
            el.classList.toggle('text-blue-200/80', !isActive);
        });

        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) pageTitle.textContent = tab.charAt(0).toUpperCase() + tab.slice(1);

        this.closeSidebar();
        this.render();
    }

    toggleSidebar() {
        const root = document.getElementById('appContainer');
        if (!root) return;
        root.classList.toggle('sidebar-open');
    }

    closeSidebar() {
        const root = document.getElementById('appContainer');
        if (!root) return;
        root.classList.remove('sidebar-open');
    }

    render() {
        const content = document.getElementById('appContent');
        if (!content) return;

        const renderer = {
            dashboard: renderDashboardView,
            budget: renderBudgetView,
            transactions: renderTransactionsView,
            savings: renderSavingsView,
            analytics: renderAnalyticsView,
            settings: renderSettingsView,
        }[this.state.activeTab];

        if (renderer) renderer(this, content);
    }

    setDashboardTrendPeriod(period) {
        this.state.dashboardTrendPeriod = period;
        if (this.state.activeTab === 'dashboard') this.setupDashboardCharts();
    }

    setDashboardBreakdownPeriod(period) {
        this.state.dashboardBreakdownPeriod = period;
        if (this.state.activeTab === 'dashboard') this.setupDashboardCharts();
    }

    setTransactionSearch(search, caretPosition = null) {
        this.state.filterSearch = (search || '').toLowerCase();
        this.state.pagination.page = 1;
        if (this.state.activeTab === 'transactions') {
            this.render();

            // Preserve focus/caret because the transactions view is fully re-rendered.
            requestAnimationFrame(() => {
                const input = document.getElementById('transactionSearchInput');
                if (!input) return;
                input.focus();
                if (Number.isInteger(caretPosition)) {
                    input.setSelectionRange(caretPosition, caretPosition);
                }
            });
        }
    }

    setTransactionType(type) {
        this.state.filterType = type;
        this.state.pagination.page = 1;
        if (this.state.activeTab === 'transactions') this.render();
    }

    changeTransactionPage(direction) {
        const { totalPages } = this.getPaginatedTransactions();
        const nextPage = this.state.pagination.page + direction;
        if (nextPage < 1 || nextPage > totalPages) return;
        this.state.pagination.page = nextPage;
        if (this.state.activeTab === 'transactions') this.render();
    }

    getFilteredTransactions() {
        const search = this.state.filterSearch;
        const type = this.state.filterType;

        return this.state.transactions.filter((t) => {
            const matchesType = type === 'all' || t.type === type;
            const haystack = `${t.description || ''} ${t.category || ''}`.toLowerCase();
            const matchesSearch = !search || haystack.includes(search);
            return matchesType && matchesSearch;
        });
    }

    getPaginatedTransactions() {
        const items = this.getFilteredTransactions();
        const limit = this.state.pagination.limit;
        const totalPages = Math.max(1, Math.ceil(items.length / limit));
        const page = Math.min(this.state.pagination.page, totalPages);
        const start = (page - 1) * limit;
        const paged = items.slice(start, start + limit);
        return { items: paged, total: items.length, page, totalPages };
    }

    renderStatCard(title, value, icon, color) {
        const displayValue = (typeof value === 'number' && Number.isFinite(value))
            ? formatCurrency(value, this.state.user?.currency)
            : escapeHtml(String(value ?? '-'));
        return `<div class="stat-card glass rounded-2xl p-6"><div class="flex justify-between"><div><p class="text-sm text-slate-500">${title}</p><h3 class="text-2xl font-bold">${displayValue}</h3></div><div class="w-12 h-12 rounded-xl ${color} bg-opacity-20 flex items-center justify-center"><i class="fas ${icon} ${color.replace('bg-', 'text-')}"></i></div></div></div>`;
    }

    renderTransactionRow(t, clickable = false) {
        const click = clickable ? `onclick="app.editTransaction(${t.id})" class="cursor-pointer hover:bg-blue-50/30 dark:hover:bg-slate-800/30"` : '';
        return `<tr ${click}><td>${escapeHtml(t.description)}</td><td><span class="badge ${t.type === 'income' ? 'badge-income' : 'badge-expense'}">${escapeHtml(t.category)}</span></td><td class="text-right ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}">${formatCurrency(t.amount, this.state.user?.currency)}</td></tr>`;
    }

    renderFullTransactionRow(t) {
        return `<tr>
            <td>${formatDate(t.date)}</td>
            <td>${escapeHtml(t.description)}</td>
            <td>${escapeHtml(t.category)}</td>
            <td><span class="badge ${t.type === 'income' ? 'badge-income' : 'badge-expense'}">${t.type}</span></td>
            <td>${escapeHtml(t.method || '-')}</td>
            <td class="text-right ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}">${formatCurrency(t.amount, this.state.user?.currency)}</td>
            <td class="text-right">
                <button onclick="app.editTransaction(${t.id})" class="text-blue-500 mr-2"><i class="fas fa-edit"></i></button>
                <button onclick="app.deleteTransaction(${t.id})" class="text-rose-500"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    }

    renderGoalCard(g) {
        const current = parseFloat(g.current_amount || 0);
        const target = parseFloat(g.target_amount || 0);
        const left = Math.max(0, target - current);
        const pctRaw = target > 0 ? Math.round((current / target) * 100) : 0;
        const pct = Math.max(0, Math.min(100, pctRaw));
        const tone = this.getGoalTone(pct);
        const status = this.getGoalStatus(pct);
        const deadline = this.getGoalDeadlineText(g.deadline);
        const isCelebrating = this.goalCelebrationId === g.id;
        const icon = this.getGoalIcon(g.name);
        const colorProfile = this.getGoalColorProfile(g.color);

        // Monthly contribution insight
        let contributionHint = '';
        if (pct < 100 && left > 0) {
            if (deadline.daysLeft > 0) {
                const monthsLeft = Math.max(1, Math.ceil(deadline.daysLeft / 30));
                const needed = Math.ceil(left / monthsLeft);
                contributionHint = `<span class="goal-contribution-hint"><i class="fas fa-calendar-check"></i>${formatCurrency(needed, this.state.user?.currency)}/mo needed</span>`;
            } else if (!g.deadline) {
                contributionHint = `<span class="goal-contribution-hint"><i class="fas fa-piggy-bank"></i>${formatCurrency(left, this.state.user?.currency)} remaining</span>`;
            }
        }

        const subtitleText = pct === 0 ? 'Start with your first contribution' : (deadline.text && deadline.daysLeft > 0 ? 'Keep building - deadline approaching' : 'Keep building this goal steadily');

        return `
            <article class="goal-card ${isCelebrating ? 'goal-card-celebrate' : ''}" style="--goal-accent:${colorProfile.solid};--goal-accent-soft:${colorProfile.soft};" data-goal-id="${g.id}" data-goal-progress="${pct}" data-tone="${tone.dataTone}">
                <div class="goal-card-head">
                    <div class="goal-icon goal-icon-custom">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="goal-head-meta">
                        <span class="goal-status ${status.className}">${status.label}</span>
                    </div>
                </div>
                <h4 class="goal-title">${escapeHtml(g.name)}</h4>
                <p class="goal-subtitle">${escapeHtml(subtitleText)}</p>
                <div class="goal-money-row">
                    <p class="goal-money-main">
                        <span class="goal-amount-saved ${tone.amountClass}">${formatCurrency(current, this.state.user?.currency)}</span>
                        <span class="goal-amount-divider"> / </span>
                        <span class="goal-amount-target">${formatCurrency(target, this.state.user?.currency)}</span>
                    </p>
                    <p class="goal-percent ${tone.percentClass}">${pct}% saved</p>
                </div>
                <div class="goal-progress-meta">
                    <span>${formatCurrency(current, this.state.user?.currency)} saved</span>
                    <span>${formatCurrency(target, this.state.user?.currency)} target</span>
                </div>
                <div class="goal-progress-track" aria-label="${pct}% progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}">
                    <div class="goal-progress-fill ${tone.fillClass}" style="width:${pct}%"></div>
                </div>
                <div class="goal-progress-row">
                    <span class="goal-left ${tone.leftClass}">${formatCurrency(left, this.state.user?.currency)} to go</span>
                    <div class="goal-progress-row-right">
                        ${contributionHint}
                        ${deadline.text ? `<span class="goal-deadline goal-deadline-${deadline.urgency}">${deadline.icon} ${deadline.text}</span>` : ''}
                    </div>
                </div>
                <div class="goal-actions">
                    <button onclick="app.addFundsToGoal(${g.id})" class="goal-add-money-btn" aria-label="Add funds to ${escapeHtml(g.name)}"><i class="fas fa-plus"></i> Add Money</button>
                    <button onclick="app.editGoal(${g.id})" class="goal-icon-btn text-blue-600 dark:text-blue-300" aria-label="Edit ${escapeHtml(g.name)}">
                        <i class="fas fa-pen"></i>
                    </button>
                    <button onclick="app.deleteGoal(${g.id})" class="goal-icon-btn goal-delete-btn" aria-label="Delete ${escapeHtml(g.name)}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </article>
        `;
    }

    getGoalIcon(name) {
        const n = (name || '').toLowerCase();
        if (/trip|travel|vacation|holiday|tour|abroad/.test(n)) return 'fa-plane';
        if (/car|vehicle|bike|motor|auto/.test(n)) return 'fa-car';
        if (/house|home|flat|apartment|plot|property/.test(n)) return 'fa-house';
        if (/laptop|phone|gadget|mobile|device|computer|iphone|android/.test(n)) return 'fa-laptop';
        if (/emergency|safety|fund|reserve|backup/.test(n)) return 'fa-shield-halved';
        if (/education|course|study|school|college|degree|learn/.test(n)) return 'fa-graduation-cap';
        if (/wedding|marriage|ring|bride/.test(n)) return 'fa-ring';
        if (/baby|child|kid|family/.test(n)) return 'fa-baby';
        if (/medical|health|hospital|doctor/.test(n)) return 'fa-heart-pulse';
        if (/business|startup|invest/.test(n)) return 'fa-briefcase';
        if (/gift|present|birthday/.test(n)) return 'fa-gift';
        if (/food|restaurant|dine/.test(n)) return 'fa-utensils';
        if (/retire|pension|future/.test(n)) return 'fa-umbrella-beach';
        return 'fa-bullseye';
    }

    getGoalTone(progressPercent) {
        if (progressPercent >= 100) {
            return {
                fillClass: 'goal-progress-gold',
                iconClass: 'goal-icon-gold',
                amountClass: 'goal-amount-gold',
                percentClass: 'goal-pct-gold',
                leftClass: 'goal-left-gold',
                dataTone: 'gold',
            };
        }
        if (progressPercent >= 30) {
            return {
                fillClass: 'goal-progress-green',
                iconClass: 'goal-icon-green',
                amountClass: 'goal-amount-green',
                percentClass: 'goal-pct-green',
                leftClass: 'goal-left-green',
                dataTone: 'green',
            };
        }
        return {
            fillClass: 'goal-progress-blue',
            iconClass: 'goal-icon-blue',
            amountClass: 'goal-amount-blue',
            percentClass: 'goal-pct-blue',
            leftClass: 'goal-left-blue',
            dataTone: 'blue',
        };
    }

    normalizeGoalColor(color) {
        const aliases = {
            'bg-sky-500': 'bg-blue-500',
            'bg-cyan-500': 'bg-teal-600',
            'bg-blue-700': 'bg-indigo-600',
            'bg-indigo-500': 'bg-indigo-600',
            'bg-emerald-500': 'bg-teal-600',
        };
        return aliases[color] || color || 'bg-blue-500';
    }

    getGoalColorProfile(color) {
        const normalized = this.normalizeGoalColor(color);
        return GOAL_COLOR_PROFILES[normalized] || GOAL_COLOR_PROFILES['bg-blue-500'];
    }

    getGoalStatus(progressPercent) {
        if (progressPercent >= 100) {
            return { label: 'Achieved', className: 'goal-status-achieved' };
        }
        if (progressPercent <= 0) {
            return { label: 'Not Started', className: 'goal-status-not-started' };
        }
        return { label: 'In Progress', className: 'goal-status-in-progress' };
    }

    getGoalDeadlineText(deadline) {
        if (!deadline) return { text: '', urgency: 'normal', icon: '', daysLeft: null };
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const due = new Date(deadline);
        due.setHours(0, 0, 0, 0);
        if (Number.isNaN(due.getTime())) return { text: '', urgency: 'normal', icon: '', daysLeft: null };

        const daysLeft = Math.ceil((due.getTime() - today.getTime()) / 86400000);

        if (daysLeft < 0) return { text: 'Deadline passed', urgency: 'overdue', icon: '<i class="fas fa-calendar-xmark"></i>', daysLeft };
        if (daysLeft === 0) return { text: 'Due today', urgency: 'critical', icon: '<i class="fas fa-fire"></i>', daysLeft };
        if (daysLeft === 1) return { text: '1 day left', urgency: 'critical', icon: '<i class="fas fa-fire"></i>', daysLeft };
        if (daysLeft <= 30) return { text: `${daysLeft} days left`, urgency: 'urgent', icon: '<i class="fas fa-clock"></i>', daysLeft };
        if (daysLeft <= 60) return { text: `${daysLeft} days left`, urgency: 'warn', icon: '<i class="fas fa-hourglass-half"></i>', daysLeft };
        return { text: `${daysLeft} days left`, urgency: 'normal', icon: '<i class="fas fa-calendar-days"></i>', daysLeft };
    }

    calculateStats() {
        const income = this.state.transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const expense = this.state.transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);

        return {
            totalIncome: income,
            totalExpense: expense,
            balance: income - expense,
            savingsRate: income ? Math.round(((income - expense) / income) * 100) : 0
        };
    }

    getAnalyticsSummary() {
        const expenseTx = this.state.transactions.filter((t) => t.type === 'expense');
        const incomeTx = this.state.transactions.filter((t) => t.type === 'income');
        const totalExpense = expenseTx.reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const totalIncome = incomeTx.reduce((sum, t) => sum + parseFloat(t.amount), 0);

        const days = new Set(this.state.transactions.map((t) => t.date)).size || 1;
        const avgDailyExpense = totalExpense / days;

        const byCategory = {};
        expenseTx.forEach((t) => {
            byCategory[t.category] = (byCategory[t.category] || 0) + parseFloat(t.amount);
        });
        const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

        return {
            avgDailyExpense,
            topCategory,
            netCashFlow: totalIncome - totalExpense,
        };
    }

    getMonthlySummary() {
        const grouped = {};
        this.state.transactions.forEach((t) => {
            const month = t.date.slice(0, 7);
            if (!grouped[month]) grouped[month] = { income: 0, expense: 0 };
            grouped[month][t.type] += parseFloat(t.amount);
        });

        return Object.keys(grouped)
            .sort()
            .map((month) => {
                const income = grouped[month].income;
                const expense = grouped[month].expense;
                const savings = income - expense;
                return {
                    month,
                    label: monthLabel(`${month}-01`),
                    income,
                    expense,
                    savings,
                    savingsRate: income ? Math.round((savings / income) * 100) : 0,
                };
            });
    }

    async addTransaction(formData) {
        await loading.with(async () => {
            try {
                const data = Object.fromEntries(formData);
                data.amount = parseFloat(data.amount);

                if (!data.category || !(data.amount > 0)) {
                    toast.error('Please complete transaction details');
                    return;
                }

                const url = data.txId ? `/api/transactions/${data.txId}` : '/api/transactions';
                const method = data.txId ? 'PUT' : 'POST';

                await this.requestJson(
                    url,
                    {
                        method,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    },
                    'Transaction failed'
                );
                toast.success('Transaction saved');
                window.modal.close();
                await this.fetchData();
            } catch (error) {
                toast.error(error.message || 'Transaction failed');
                console.error(error);
            }
        });
    }

    async deleteTransaction(id) {
        const tx = this.state.transactions.find((t) => t.id === id);
        if (!tx) return;

        await loading.with(async () => {
            try {
                await this.requestJson(`/api/transactions/${id}`, { method: 'DELETE' }, 'Failed to delete transaction');
                await this.fetchData();
                this.queueTransactionUndo(tx);
            } catch (error) {
                toast.error(error.message || 'Failed to delete transaction');
                console.error(error);
            }
        });
    }

    queueTransactionUndo(tx) {
        const undoToken = ++this.pendingTransactionUndoToken;
        const expiresAt = Date.now() + 8000;
        this.pendingTransactionUndo = { tx, expiresAt, token: undoToken };

        if (this.pendingTransactionUndoTimer) {
            clearTimeout(this.pendingTransactionUndoTimer);
            this.pendingTransactionUndoTimer = null;
        }

        toast.show('Transaction deleted', 'warning', 8000, {
            key: 'transaction-undo',
            variant: 'undo',
            badge: 'Deleted',
            title: 'Transaction removed',
            subtitle: `${tx.category || 'Uncategorized'} • ${formatCurrency(tx.amount, this.state.user?.currency)} • Undo in 8s`,
            actionLabel: 'Undo',
            onAction: () => this.undoDeletedTransaction(undoToken)
        });

        this.pendingTransactionUndoTimer = setTimeout(() => {
            if (this.pendingTransactionUndo?.token === undoToken) {
                this.pendingTransactionUndo = null;
            }
            this.pendingTransactionUndoTimer = null;
        }, 8100);
    }

    async undoDeletedTransaction(undoToken) {
        if (this.isUndoingTransaction) return;
        const pending = this.pendingTransactionUndo;
        if (!pending || pending.token !== undoToken || Date.now() > pending.expiresAt) {
            this.pendingTransactionUndo = null;
            toast.warning('Undo window expired');
            return;
        }

        const tx = pending.tx;
        const restorePayload = {
            type: tx.type,
            amount: parseFloat(tx.amount),
            category: tx.category,
            description: tx.description || '',
            date: tx.date,
            method: tx.method || 'Cash'
        };

        await loading.with(async () => {
            try {
                this.isUndoingTransaction = true;
                await this.requestJson(
                    '/api/transactions',
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(restorePayload)
                    },
                    'Failed to undo delete'
                );
                this.pendingTransactionUndo = null;
                if (this.pendingTransactionUndoTimer) {
                    clearTimeout(this.pendingTransactionUndoTimer);
                    this.pendingTransactionUndoTimer = null;
                }
                toast.success('Transaction restored');
                await this.fetchData();
            } catch (error) {
                toast.error(error.message || 'Failed to undo delete');
                console.error(error);
            } finally {
                this.isUndoingTransaction = false;
            }
        });
    }

    async deleteGoal(id) {
        const goal = this.state.savingsGoals.find((g) => g.id === id);
        if (!goal) return;

        const confirmed = await this.showConfirmDialog({
            title: 'Delete savings goal?',
            message: `"${goal.name}" will be permanently removed. Transactions linked to this goal will remain.`,
            confirmText: 'Delete',
            cancelText: 'Keep it',
            danger: true,
        });
        if (!confirmed) return;

        await loading.with(async () => {
            try {
                await this.requestJson(`/api/goals/${id}`, { method: 'DELETE' }, 'Failed to delete goal');
                await this.fetchData();
                toast.show('Goal deleted', 'warning', 8000, {
                    key: 'goal-delete',
                    variant: 'undo',
                    badge: 'Deleted',
                    title: 'Goal removed',
                    subtitle: `${goal.name} • ₹${parseFloat(goal.current_amount || 0).toLocaleString('en-IN')} saved`,
                });
            } catch (error) {
                toast.error(error.message || 'Failed to delete goal');
                console.error(error);
            }
        });
    }

    async clearAllData() {
        const confirmed = await this.showConfirmDialog({
            title: 'Clear all data?',
            message: 'This permanently deletes all transactions and savings goals. This action cannot be undone.',
            confirmText: 'Clear data',
            cancelText: 'Cancel',
            danger: true,
        });

        if (!confirmed) {
            return;
        }

        await loading.with(async () => {
            try {
                await this.requestJson('/api/data/reset', { method: 'POST' }, 'Failed to clear data');
                toast.success('All data cleared');
                await this.fetchData();
            } catch (error) {
                toast.error(error.message || 'Failed to clear data');
                console.error(error);
            }
        });
    }

    changeBudgetMonth(month) {
        if (!month) return;
        this.state.budgetMonth = month;
        if (this.state.activeTab === 'budget') this.render();
    }

    getPreviousMonth(monthValue) {
        const [year, month] = String(monthValue || '').split('-').map((part) => parseInt(part, 10));
        if (!year || !month) return '';
        const date = new Date(year, month - 1, 1);
        date.setMonth(date.getMonth() - 1);
        return date.toISOString().slice(0, 7);
    }

    openBudgetModal(prefill = {}) {
        const categories = CATEGORY_OPTIONS.expense || [];
        const defaultMonth = prefill.month || this.state.budgetMonth || new Date().toISOString().slice(0, 7);
        const selectedCategory = prefill.category || categories[0] || '';
        const selectedAmount = prefill.amount || '';
        const currencySymbol = formatCurrency(0, this.state.user?.currency).replace(/[0.,\s]/g, '') || '$';

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay animate-fade-in';
        overlay.style.display = 'flex';
        overlay.innerHTML = `
            <div class="modal-container max-w-sm">
                <div class="bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl overflow-hidden border border-slate-200/50 dark:border-slate-800/50">
                    <div class="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
                        <div>
                            <h3 class="text-xl font-black text-slate-900 dark:text-white tracking-tight">Set Limit</h3>
                            <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Monthly Parameter</p>
                        </div>
                        <button type="button" class="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 rounded-full transition-all shadow-sm" data-budget-close>
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <form class="p-8 space-y-6" data-budget-form>
                        <div class="space-y-2">
                            <label class="text-[11px] font-black uppercase tracking-wider text-slate-500 pl-1">Category</label>
                            <div class="relative">
                                <select class="form-input appearance-none pl-4 pr-10 font-bold" name="category" required>
                                    ${categories.map((c) => `<option value="${c}" ${c === selectedCategory ? 'selected' : ''}>${c}</option>`).join('')}
                                </select>
                                <i class="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs"></i>
                            </div>
                        </div>

                        <div class="space-y-2">
                            <label class="text-[11px] font-black uppercase tracking-wider text-slate-500 pl-1">Amount</label>
                            <div class="relative group">
                                <div class="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-black transition-colors group-focus-within:bg-blue-500 group-focus-within:text-white">
                                    ${currencySymbol}
                                </div>
                                <input type="number" name="amount" required min="0.01" step="0.01" class="form-input pl-14 text-xl font-black tracking-tight" value="${selectedAmount}" placeholder="0.00">
                            </div>
                        </div>

                        <div class="space-y-2">
                            <label class="text-[11px] font-black uppercase tracking-wider text-slate-500 pl-1">Target Month</label>
                            <div class="relative">
                                <input type="month" class="form-input font-bold pl-4" name="month" required value="${defaultMonth}">
                                <i class="far fa-calendar absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></i>
                            </div>
                        </div>

                        <div id="suggest-field" class="hidden">
                            <div class="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 group cursor-pointer hover:bg-blue-500/10 transition-all" data-budget-suggestion>
                                <div class="flex items-center gap-3">
                                    <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                                        <i class="fas fa-magic"></i>
                                    </div>
                                    <div class="flex-1">
                                        <p class="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Smart Suggestion</p>
                                        <p class="text-xs font-bold text-slate-600 dark:text-slate-300" id="suggest-text"></p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 hidden animate-shake" data-budget-duplicate>
                            <div class="flex items-center gap-3">
                                <i class="fas fa-circle-exclamation text-amber-500"></i>
                                <p class="text-[11px] font-bold text-amber-700 dark:text-amber-400" id="duplicate-text"></p>
                            </div>
                        </div>

                        <div class="flex gap-4 pt-2">
                            <button type="button" class="flex-1 h-14 rounded-2xl border border-slate-200 dark:border-slate-800 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all" data-budget-cancel>Dismiss</button>
                            <button type="submit" class="flex-2 btn-primary h-14 rounded-2xl font-black text-white shadow-xl shadow-blue-500/20" data-budget-submit>Set Limit</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        const form = overlay.querySelector('[data-budget-form]');
        const categoryInput = form?.elements.category;
        const monthInput = form?.elements.month;
        const amountInput = form?.elements.amount;
        const suggestionBox = overlay.querySelector('#suggest-field');
        const suggestionBtn = overlay.querySelector('[data-budget-suggestion]');
        const suggestText = overlay.querySelector('#suggest-text');
        const duplicateBox = overlay.querySelector('[data-budget-duplicate]');
        const duplicateText = overlay.querySelector('#duplicate-text');
        const submitBtn = overlay.querySelector('[data-budget-submit]');

        const close = () => {
            document.removeEventListener('keydown', onKeydown);
            overlay.remove();
        };

        let activeSuggestion = null;

        const syncBudgetHints = () => {
            const category = categoryInput?.value;
            const month = monthInput?.value;
            const previousMonth = this.getPreviousMonth(month);
            const previous = this.state.budgets.find((b) => b.category === category && b.month === previousMonth);

            if (previous) {
                suggestionBox?.classList.remove('hidden');
                activeSuggestion = previous.amount;
                if (suggestText) suggestText.textContent = `Applied last month: ${formatCurrency(previous.amount, this.state.user?.currency)}`;
            } else {
                suggestionBox?.classList.add('hidden');
                activeSuggestion = null;
            }

            const existingCurrent = this.state.budgets.find((b) => b.category === category && b.month === month);
            if (existingCurrent) {
                duplicateBox?.classList.remove('hidden');
                if (duplicateText) duplicateText.textContent = `${category} already has a limit for ${month}. Updating existing record.`;
                if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-arrows-rotate mr-2"></i>Adjust';
            } else {
                duplicateBox?.classList.add('hidden');
                if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-check mr-2"></i>Set Limit';
            }
        };

        suggestionBtn?.addEventListener('click', () => {
            if (activeSuggestion && amountInput) {
                amountInput.value = activeSuggestion;
                amountInput.focus();
                syncBudgetHints();
            }
        });

        const onKeydown = (event) => {
            if (event.key === 'Escape') close();
        };

        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) close();
        });
        overlay.querySelector('[data-budget-close]')?.addEventListener('click', close);
        overlay.querySelector('[data-budget-cancel]')?.addEventListener('click', close);
        categoryInput?.addEventListener('change', syncBudgetHints);
        monthInput?.addEventListener('change', syncBudgetHints);

        form?.addEventListener('submit', async (event) => {
            event.preventDefault();
            const category = categoryInput?.value;
            const amount = parseFloat(amountInput?.value || '0');
            const month = monthInput?.value;

            if (!category || !month || !Number.isFinite(amount) || amount <= 0) {
                toast.error('Configure valid parameters');
                return;
            }

            await loading.with(async () => {
                try {
                    await this.requestJson(
                        '/api/budgets',
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ category, amount, month })
                        },
                        'Failed to persist record'
                    );
                    this.state.budgetMonth = month;
                    toast.success('Financial limit synchronized');
                    close();
                    await this.fetchData();
                } catch (error) {
                    toast.error(error.message || 'Operation failed');
                    console.error(error);
                }
            });
        });

        document.addEventListener('keydown', onKeydown);
        document.body.appendChild(overlay);
        syncBudgetHints();
    }

    async saveSettings() {
        const currency = document.getElementById('settingsCurrency').value;

        await loading.with(async () => {
            try {
                await this.requestJson(
                    '/api/settings',
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ currency })
                    },
                    'Failed to save settings'
                );
                localStorage.setItem('currencyPreferenceSet', '1');
                this.hasUserCurrencyPreference = true;
                toast.success('Settings saved');
                await this.fetchData();
            } catch (error) {
                toast.error(error.message || 'Failed to save settings');
                console.error(error);
            }
        });
    }

    async runConnectivityCheck() {
        await loading.with(async () => {
            try {
                const health = await this.requestJson('/api/health', {}, 'Failed to check connectivity');
                if (health.db) {
                    toast.success('Connection OK: frontend, API, and database are connected');
                    return;
                }

                toast.error(`API is reachable, but database failed: ${health.error || 'unknown DB error'}`);
            } catch (error) {
                toast.error(`Frontend cannot reach API: ${error.message}`);
                console.error(error);
            }
        });
    }

    openAddTransactionModal() {
        const title = document.getElementById('txModalTitle');
        if (title) title.textContent = 'Add Transaction';
        window.modal.open();
        this.updateCategoryOptions('expense');
    }

    editTransaction(id) {
        const tx = this.state.transactions.find((t) => t.id === id);
        if (!tx) return;
        const title = document.getElementById('txModalTitle');
        if (title) title.textContent = 'Edit Transaction';
        window.modal.openForEdit(tx);
        this.updateCategoryOptions(tx.type);
    }

    showAmountPromptDialog({
        title = 'Add Amount',
        placeholder = '0.00',
        confirmText = 'Add',
        cancelText = 'Cancel',
    } = {}) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.style.display = 'flex';
            overlay.innerHTML = `
                <div class="modal-container" style="max-width:420px;">
                    <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
                        <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                            <h3 class="text-lg font-bold text-slate-900 dark:text-white">${title}</h3>
                        </div>
                        <div class="px-6 py-5">
                            <label class="block text-sm text-slate-500 dark:text-slate-400 mb-2">Amount</label>
                            <div class="relative">
                                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">${formatCurrency(0, this.state.user?.currency).replace(/[0.,\s]/g, '') || '₹'}</span>
                                <input id="amountPromptInput" type="number" min="0.01" step="0.01" class="form-input pl-8" placeholder="${placeholder}">
                            </div>
                        </div>
                        <div class="px-6 pb-6 flex justify-end gap-3">
                            <button type="button" class="btn-secondary" data-prompt-cancel>${cancelText}</button>
                            <button type="button" class="btn-primary" data-prompt-ok>${confirmText}</button>
                        </div>
                    </div>
                </div>
            `;

            const input = overlay.querySelector('#amountPromptInput');
            const cleanup = (value) => {
                document.removeEventListener('keydown', onKeydown);
                overlay.remove();
                resolve(value);
            };

            const submit = () => {
                const amount = parseFloat(input?.value || '0');
                if (!Number.isFinite(amount) || amount <= 0) {
                    toast.warning('Enter a valid amount');
                    return;
                }
                cleanup(amount);
            };

            const onKeydown = (event) => {
                if (event.key === 'Escape') cleanup(null);
                if (event.key === 'Enter') submit();
            };

            overlay.addEventListener('click', (event) => {
                if (event.target === overlay) cleanup(null);
            });

            overlay.querySelector('[data-prompt-cancel]')?.addEventListener('click', () => cleanup(null));
            overlay.querySelector('[data-prompt-ok]')?.addEventListener('click', submit);
            document.addEventListener('keydown', onKeydown);
            document.body.appendChild(overlay);
            requestAnimationFrame(() => input?.focus());
        });
    }

    async addFundsToGoal(goalId) {
        const goal = this.state.savingsGoals.find((item) => item.id === goalId);
        if (!goal) return;

        const amount = await this.showAmountPromptDialog({
            title: `Add Money - ${escapeHtml(goal.name)}`,
            confirmText: 'Add',
            cancelText: 'Cancel',
        });
        if (!amount) return;

        const previousCurrent = parseFloat(goal.current_amount || 0);
        const target = parseFloat(goal.target_amount || 0);
        const previousPct = target > 0 ? Math.round((previousCurrent / target) * 100) : 0;
        const nextPct = target > 0 ? Math.round((Math.min(target, previousCurrent + amount) / target) * 100) : 0;

        const nextCurrent = Math.min(target, previousCurrent + amount);
        const payload = {
            name: goal.name,
            target: target,
            current: nextCurrent,
            color: goal.color || 'bg-blue-500',
            deadline: goal.deadline || null
        };

        await loading.with(async () => {
            try {
                await this.requestJson(
                    `/api/goals/${goalId}`,
                    {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    },
                    'Failed to add money'
                );

                this.goalCelebrationId = goalId;
                toast.success('Money added to goal');
                await this.fetchData();
                if (previousPct < 100 && nextPct >= 100) {
                    this.launchConfettiBurst();
                }
                setTimeout(() => {
                    if (this.goalCelebrationId === goalId) this.goalCelebrationId = null;
                    if (this.state.activeTab === 'savings') this.render();
                }, 1200);
            } catch (error) {
                toast.error(error.message || 'Failed to add money');
                console.error(error);
            }
        });
    }

    launchConfettiBurst() {
        const root = document.body;
        if (!root) return;
        const container = document.createElement('div');
        container.className = 'goal-confetti';
        const colors = ['#16a34a', '#0891b2', '#1d4ed8', '#f59e0b', '#eab308'];
        for (let i = 0; i < 18; i += 1) {
            const piece = document.createElement('span');
            piece.style.setProperty('--confetti-x', `${(Math.random() * 160) - 80}px`);
            piece.style.setProperty('--confetti-y', `${80 + (Math.random() * 120)}px`);
            piece.style.background = colors[i % colors.length];
            piece.style.left = `${45 + (Math.random() * 10)}%`;
            container.appendChild(piece);
        }
        root.appendChild(container);
        setTimeout(() => container.remove(), 1500);
    }

    editGoal(goalId) {
        const goal = this.state.savingsGoals.find((g) => g.id === goalId);
        if (!goal) return;
        window.goalModal.openForEdit(goal);
    }

    updateCategoryOptions(type) {
        const select = document.getElementById('txCategory');
        if (!select) return;

        const prev = select.value;
        const options = CATEGORY_OPTIONS[type] || [];
        select.innerHTML = '<option value="">Select a category</option>' + options.map((opt) => `<option value="${opt}">${opt}</option>`).join('');

        if (options.includes(prev)) select.value = prev;
    }

    setupDashboardCharts() {
        const ctxTrend = document.getElementById('trendChart');
        const ctxBreakdown = document.getElementById('breakdownChart');
        if (!ctxTrend || !ctxBreakdown) return;

        const trendPeriod = this.state.dashboardTrendPeriod;
        const trendTx = filterByPeriod(this.state.transactions, trendPeriod);

        let labels = [];
        let incomeData = [];
        let expenseData = [];

        if (trendPeriod === 'year') {
            const months = [...Array(12)].map((_, i) => {
                const d = new Date();
                d.setMonth(d.getMonth() - (11 - i));
                return d.toISOString().slice(0, 7);
            });
            labels = months.map((m) => monthLabel(`${m}-01`));
            incomeData = months.map((m) => trendTx.filter((t) => t.type === 'income' && t.date.startsWith(m)).reduce((s, t) => s + parseFloat(t.amount), 0));
            expenseData = months.map((m) => trendTx.filter((t) => t.type === 'expense' && t.date.startsWith(m)).reduce((s, t) => s + parseFloat(t.amount), 0));
        } else {
            const days = trendPeriod === 'month' ? 30 : 7;
            const dayKeys = [...Array(days)].map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (days - 1 - i));
                return toISODate(d);
            });
            labels = dayKeys.map((d) => formatDate(d));
            incomeData = dayKeys.map((d) => trendTx.filter((t) => t.type === 'income' && t.date === d).reduce((s, t) => s + parseFloat(t.amount), 0));
            expenseData = dayKeys.map((d) => trendTx.filter((t) => t.type === 'expense' && t.date === d).reduce((s, t) => s + parseFloat(t.amount), 0));
        }

        if (this.charts.trend) this.charts.trend.destroy();
        if (this.charts.breakdown) this.charts.breakdown.destroy();

        this.charts.trend = new Chart(ctxTrend, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    { label: 'Income', data: incomeData, borderColor: CHART_COLORS.trend.income.border, backgroundColor: CHART_COLORS.trend.income.background, tension: 0.35, fill: true },
                    { label: 'Expenses', data: expenseData, borderColor: CHART_COLORS.trend.expense.border, backgroundColor: CHART_COLORS.trend.expense.background, tension: 0.35, fill: true }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { intersect: false, mode: 'index' },
                plugins: { legend: { position: 'top' } },
                scales: {
                    y: { beginAtZero: true, grid: { color: Chart.defaults.borderColor } },
                    x: { grid: { display: false } }
                }
            }
        });

        const breakdownTx = filterByPeriod(this.state.transactions.filter((t) => t.type === 'expense'), this.state.dashboardBreakdownPeriod);
        const categories = {};
        breakdownTx.forEach((t) => {
            categories[t.category] = (categories[t.category] || 0) + parseFloat(t.amount);
        });

        this.charts.breakdown = new Chart(ctxBreakdown, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categories),
                datasets: [{
                    data: Object.values(categories),
                    backgroundColor: CHART_COLORS.palette,
                    borderColor: '#ffffff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'right' } },
                cutout: '70%'
            }
        });
    }

    setupAnalyticsCharts() {
        const ctxAnalytics = document.getElementById('analyticsTrendChart');
        const ctxCategory = document.getElementById('categoryChart');
        if (!ctxAnalytics || !ctxCategory) return;

        const months = [...Array(6)].map((_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            return d.toISOString().slice(0, 7);
        }).reverse();

        const monthlyIncome = months.map((m) => this.state.transactions
            .filter((t) => t.type === 'income' && t.date.startsWith(m))
            .reduce((sum, t) => sum + parseFloat(t.amount), 0));

        const monthlyExpense = months.map((m) => this.state.transactions
            .filter((t) => t.type === 'expense' && t.date.startsWith(m))
            .reduce((sum, t) => sum + parseFloat(t.amount), 0));

        if (this.charts.analytics) this.charts.analytics.destroy();
        if (this.charts.categoryAnalytics) this.charts.categoryAnalytics.destroy();

        this.charts.analytics = new Chart(ctxAnalytics, {
            type: 'bar',
            data: {
                labels: months.map((m) => monthLabel(`${m}-01`)),
                datasets: [
                    { label: 'Income', data: monthlyIncome, backgroundColor: CHART_COLORS.analytics.income },
                    { label: 'Expense', data: monthlyExpense, backgroundColor: CHART_COLORS.analytics.expense }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } }
            }
        });

        const categories = {};
        this.state.transactions.filter((t) => t.type === 'expense').forEach((t) => {
            categories[t.category] = (categories[t.category] || 0) + parseFloat(t.amount);
        });

        this.charts.categoryAnalytics = new Chart(ctxCategory, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categories),
                datasets: [{
                    data: Object.values(categories),
                    backgroundColor: CHART_COLORS.palette,
                    borderColor: '#ffffff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'right' } }
            }
        });
    }

    refreshCharts() {
        if (this.state.activeTab === 'dashboard') this.setupDashboardCharts();
        else if (this.state.activeTab === 'analytics') this.setupAnalyticsCharts();
    }

    updateDate() {
        const dateEl = document.getElementById('currentDate');
        if (!dateEl) return;
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateEl.textContent = new Date().toLocaleDateString('en-US', options);
    }

    updateUserProfileUI() {
        if (!this.state.user) return;
        document.getElementById('sidebarName').textContent = this.state.user.name || 'User';
        document.getElementById('sidebarEmail').textContent = this.state.user.email || '';
        document.getElementById('sidebarAvatar').textContent = (this.state.user.name || 'U').charAt(0).toUpperCase();
        document.getElementById('greeting').textContent = `Welcome back, ${(this.state.user.name || 'User').split(' ')[0]}!`;
        this.updateCurrencyUI();
    }

    updateCurrencyUI() {
        const currency = this.state.user?.currency || 'INR';
        const symbol = (0).toLocaleString('en-US', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).replace(/\d/g, '').trim();

        const modalSymbol = document.getElementById('modalCurrencySymbol');
        if (modalSymbol) modalSymbol.textContent = symbol;

        document.querySelectorAll('.modal-currency-symbol').forEach(el => {
            el.textContent = symbol;
        });
    }
}

export { loading, toast, formatCurrency };
