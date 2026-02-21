import {
    renderAnalyticsView,
    renderDashboardView,
    renderSavingsView,
    renderSettingsView,
    renderTransactionsView,
} from './views/index.js';
import { CATEGORY_OPTIONS, CHART_COLORS } from './constants.js';
import { bindDatabaseSync } from './sync.js';
import { filterByPeriod, monthLabel, toISODate } from './time-utils.js';
import { escapeHtml, formatCurrency, formatDate, loading, toast } from './utils.js';

export class ExpenseApp {
    constructor() {
        const requestedTab = (window.APP_CONFIG && window.APP_CONFIG.initialTab) || 'dashboard';
        const allowedTabs = new Set(['dashboard', 'transactions', 'savings', 'analytics', 'settings']);
        const initialTab = allowedTabs.has(requestedTab) ? requestedTab : 'dashboard';
        const savedThemeMode = localStorage.getItem('themeMode') || localStorage.getItem('theme') || 'light';
        const initialMode = savedThemeMode === 'dark' ? 'dark' : 'light';
        const currencyPreferenceSet = localStorage.getItem('currencyPreferenceSet') === '1';

        this.state = {
            activeTab: initialTab,
            transactions: [],
            savingsGoals: [],
            user: null,
            themeMode: initialMode,
            theme: initialMode,
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
    }

    async requestJson(url, options = {}, fallbackMessage = 'Request failed') {
        let response;
        try {
            response = await fetch(url, options);
        } catch (error) {
            throw new Error(`Network error: ${error.message}`);
        }

        let payload = null;
        try {
            payload = await response.json();
        } catch {
            payload = null;
        }

        if (!response.ok) {
            const message = payload?.error || payload?.message || fallbackMessage;
            throw new Error(message);
        }

        return payload;
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
                    ).catch(() => {});
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
                            <button type="button" class="btn-primary" ${danger ? 'style="background: linear-gradient(135deg, #e11d48, #be123c);"' : ''} data-confirm-ok>${confirmText}</button>
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
        const pct = Math.min(100, Math.round((g.current_amount / g.target_amount) * 100));
        return `<div class="goal-card"><div class="flex justify-between mb-4"><div class="w-10 h-10 rounded ${g.color} bg-opacity-20 flex items-center justify-center"><i class="fas fa-bullseye ${g.color.replace('bg-', 'text-')}"></i></div><span class="badge badge-income">${pct}%</span></div><h4 class="font-bold">${escapeHtml(g.name)}</h4><p class="text-sm text-slate-500 mb-4">${formatCurrency(g.current_amount)} / ${formatCurrency(g.target_amount)}</p><div class="progress-bar"><div class="progress-fill ${g.color}" style="width: ${pct}%"></div></div><div class="mt-4 flex gap-2"><button onclick="app.addFundsToGoal(${g.id})" class="btn-secondary text-xs flex-1">Add Funds</button><button onclick="app.editGoal(${g.id})" class="text-blue-500 p-2"><i class="fas fa-pen"></i></button><button onclick="app.deleteGoal(${g.id})" class="text-rose-500 p-2"><i class="fas fa-trash"></i></button></div></div>`;
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
            method: tx.method || 'Cash',
            goalId: tx.goal_id || null
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
        if (!confirm('Delete goal?')) return;
        await loading.with(async () => {
            try {
                await this.requestJson(`/api/goals/${id}`, { method: 'DELETE' }, 'Failed to delete goal');
                toast.success('Goal deleted');
                await this.fetchData();
            } catch (error) {
                toast.error(error.message || 'Failed to delete goal');
                console.error(error);
            }
        });
    }

    async clearAllData() {
        const first = confirm('This will permanently delete all your transactions and savings goals. Continue?');
        if (!first) return;

        const code = prompt('Type CLEAR to confirm data wipe.');
        if (code !== 'CLEAR') {
            toast.warning?.('Data wipe cancelled');
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

    addFundsToGoal(goalId) {
        this.openAddTransactionModal();
        const goalInput = document.getElementById('txGoalId');
        if (goalInput) goalInput.value = goalId;

        const txTypeIncome = document.querySelector('input[name="type"][value="income"]');
        if (txTypeIncome) {
            txTypeIncome.checked = true;
            this.updateCategoryOptions('income');
        }

        const desc = document.getElementById('txDescription');
        if (desc && !desc.value) desc.value = 'Goal contribution';
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
