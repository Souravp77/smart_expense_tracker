import { escapeHtml, formatCurrency } from '../utils.js';

const CATEGORY_ICONS = {
    'Food & Dining': { icon: 'fa-utensils', color: '#f59e0b' },
    Shopping: { icon: 'fa-bag-shopping', color: '#ec4899' },
    Entertainment: { icon: 'fa-film', color: '#8b5cf6' },
    'Travel / Outings': { icon: 'fa-plane-departure', color: '#0ea5e9' },
    'Personal Care': { icon: 'fa-spa', color: '#14b8a6' },
    Parties: { icon: 'fa-champagne-glasses', color: '#f43f5e' },
    Subscriptions: { icon: 'fa-repeat', color: '#6366f1' },
    'Other Expense': { icon: 'fa-layer-group', color: '#64748b' },
};


const toInlineJsString = (value) => JSON.stringify(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

function monthLabel(month) {
    if (!month) return '';
    const [y, m] = month.split('-').map((v) => parseInt(v, 10));
    const date = new Date(y, (m || 1) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function getUsageTone(usage) {
    if (usage > 100) return 'tone-over';
    if (usage >= 90) return 'tone-danger';
    if (usage >= 70) return 'tone-warn';
    return 'tone-safe';
}

function getBadgeClass(usage) {
    if (usage > 100) return 'badge-over';
    if (usage >= 90) return 'badge-danger';
    if (usage >= 70) return 'badge-warn';
    return 'badge-safe';
}

function toNumber(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const normalized = String(value ?? '')
        .replace(/[^0-9.,-]/g, '')
        .replace(/,/g, '');
    const parsed = parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
}

export function renderBudgetView(app, container) {
    const currentMonth = app.state.budgetMonth || new Date().toISOString().slice(0, 7);
    if (!app.state.budgetMonth) app.state.budgetMonth = currentMonth;

    const categories = typeof app.getBudgetCategories === 'function'
        ? app.getBudgetCategories()
        : (app.state.categories?.expense || []);
    const allowedCategorySet = new Set(categories);
    const monthBudgets = app.state.budgets.filter(
        (b) => b.month === currentMonth && allowedCategorySet.has(b.category)
    );
    const budgetMap = new Map(monthBudgets.map((b) => [b.category, toNumber(b.amount)]));

    const spentMap = new Map();
    app.state.transactions
        .filter((tx) =>
            tx.type === 'expense' &&
            String(tx.date || '').startsWith(currentMonth) &&
            allowedCategorySet.has(tx.category)
        )
        .forEach((tx) => {
            const key = tx.category;
            spentMap.set(key, (spentMap.get(key) || 0) + toNumber(tx.amount));
        });

    const totalBudget = [...budgetMap.values()].reduce((sum, value) => sum + value, 0);
    const totalSpent = [...spentMap.values()].reduce((sum, value) => sum + value, 0);
    const totalRemaining = totalBudget - totalSpent;
    const totalUsage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
    const globalTone = getUsageTone(totalUsage);

    // Temporal Context Logic
    const realNow = new Date();
    const realMonth = realNow.toISOString().slice(0, 7);
    const [viewYear, viewMonth] = currentMonth.split('-').map(Number);
    const lastDayOfMonth = new Date(viewYear, viewMonth, 0).getDate();

    let effectiveToday = realNow.getDate();
    let isPastMonth = false;
    let isFutureMonth = false;

    if (currentMonth < realMonth) {
        effectiveToday = lastDayOfMonth;
        isPastMonth = true;
    } else if (currentMonth > realMonth) {
        effectiveToday = 0;
        isFutureMonth = true;
    }

    const warningItems = [];

    const cards = categories.map((category) => {
        const budget = budgetMap.get(category) || 0;
        const spent = spentMap.get(category) || 0;
        const remaining = budget - spent;
        const categoryUsage = budget > 0 ? Math.round((spent / budget) * 100) : 0;
        const tone = getUsageTone(categoryUsage);
        const badge = getBadgeClass(categoryUsage);
        const iconConfig = CATEGORY_ICONS[category] || { icon: 'fa-receipt', color: '#64748b' };

        if (budget > 0) {
            if (categoryUsage > 100) {
                warningItems.push({
                    type: 'danger',
                    icon: 'fa-circle-exclamation',
                    text: `${category} is over budget by ${formatCurrency(Math.abs(remaining), app.state.user?.currency)}. Consider adjusting next month or reducing spend this month.`,
                });
            } else if (categoryUsage >= 80) {
                warningItems.push({
                    type: 'warning',
                    icon: 'fa-triangle-exclamation',
                    text: `You've used ${categoryUsage}% of your ${category} budget.`,
                });
                warningItems.push({
                    type: 'info',
                    icon: 'fa-wallet',
                    text: `Only ${formatCurrency(remaining, app.state.user?.currency)} left in ${category}.`,
                });
            }
        }


        return `
            <article class="budget-card">
                <div class="budget-card-header">
                    <div class="budget-card-category">
                        <div class="budget-card-icon" style="color: ${iconConfig.color}; background: ${iconConfig.color}15">
                            <i class="fas ${iconConfig.icon}"></i>
                        </div>
                        <div class="budget-card-info">
                            <h4>${escapeHtml(category)}</h4>
                            <span>${budget > 0 ? `${categoryUsage}% used` : 'No budget set'}</span>
                        </div>
                    </div>
                    ${budget > 0 ? `<span class="budget-card-badge ${badge}">${categoryUsage > 100 ? 'Over' : categoryUsage >= 90 ? 'Danger' : categoryUsage >= 70 ? 'Warning' : 'Safe'}</span>` : ''}
                </div>

                ${budget > 0 ? `
                <div class="budget-card-amounts">
                    <div class="budget-amount-box">
                        <p>Budget</p>
                        <h5>${formatCurrency(budget, app.state.user?.currency)}</h5>
                    </div>
                    <div class="budget-amount-box text-right">
                        <p>Spent</p>
                        <h5>${formatCurrency(spent, app.state.user?.currency)}</h5>
                    </div>
                </div>

                <div class="budget-progress-track">
                    <div class="budget-progress-fill ${tone}" style="width: ${Math.min(100, categoryUsage)}%"></div>
                </div>
                ` : `
                <div class="py-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl mb-4 border border-dashed border-slate-200 dark:border-slate-700">
                    <p class="text-xs text-slate-400 mb-1">Set a limit to track spending</p>
                    <p class="text-sm font-medium text-slate-500">Current Spend: ${formatCurrency(spent, app.state.user?.currency)}</p>
                </div>
                `}

                <div class="budget-card-footer">
                    <span class="budget-remaining-text ${remaining < 0 ? 'text-red-500' : 'text-slate-500'}">
                        ${remaining >= 0 ? `Left: ${formatCurrency(remaining, app.state.user?.currency)}` : `Over: ${formatCurrency(Math.abs(remaining), app.state.user?.currency)}`}
                    </span>
                    <button class="btn-secondary py-1 px-3 text-xs" onclick="app.openBudgetModal({ category: ${toInlineJsString(category)}, month: ${toInlineJsString(currentMonth)}, amount: ${toInlineJsString(budget > 0 ? String(budget) : '')} })">
                        ${budget > 0 ? 'Adjust' : 'Set'}
                    </button>
                </div>
            </article>
        `;
    }).join('');

    // Global insights
    if (totalBudget > 0 && totalSpent > totalBudget) {
        warningItems.unshift({
            type: 'danger',
            icon: 'fa-meteor',
            text: `Current total spending is ${formatCurrency(totalSpent - totalBudget, app.state.user?.currency)} over the allocated limit.`,
        });
    }

    if (!warningItems.length && totalBudget > 0 && !isFutureMonth) {
        warningItems.push({
            type: 'tip',
            icon: 'fa-wand-magic-sparkles',
            text: `You're managing your ${monthLabel(currentMonth)} budget perfectly so far!`,
        });
    }

    container.innerHTML = `
        <div class="budget-module">
            <header class="budget-header glass">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <i class="fas fa-wallet"></i>
                    </div>
                    <div class="ui-page-head">
                        <h3 class="ui-page-title">Financial Guardrails</h3>
                        <p class="ui-page-subtitle">${monthLabel(currentMonth)}</p>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <div class="budget-month-selector">
                        <i class="far fa-calendar-alt text-slate-400"></i>
                        <input type="month" value="${currentMonth}" class="budget-month-input" onchange="app.changeBudgetMonth(this.value)">
                    </div>
                </div>
            </header>

            ${totalBudget > 0 ? `
            <div class="budget-summary-grid">
                <div class="budget-stat-card">
                    <span class="budget-stat-label">Allocated</span>
                    <span class="budget-stat-value">${formatCurrency(totalBudget, app.state.user?.currency)}</span>
                    <span class="budget-stat-sub text-slate-400">In ${categories.length} categories</span>
                </div>
                <div class="budget-stat-card">
                    <span class="budget-stat-label">Consumed</span>
                    <span class="budget-stat-value">${formatCurrency(totalSpent, app.state.user?.currency)}</span>
                    <span class="budget-stat-sub ${totalUsage > 100 ? 'negative' : 'positive'}">
                        ${totalUsage}% of total
                    </span>
                </div>
                <div class="budget-stat-card">
                    <span class="budget-stat-label">Available</span>
                    <span class="budget-stat-value">${formatCurrency(Math.max(0, totalRemaining), app.state.user?.currency)}</span>
                    <span class="budget-stat-sub ${isPastMonth ? 'text-slate-400' : 'positive'}">
                        ${isPastMonth ? 'Month ended' : 'To spend'}
                    </span>
                </div>
                <div class="budget-stat-card">
                    <span class="budget-stat-label">Daily Average</span>
                    <span class="budget-stat-value">${formatCurrency(totalSpent / Math.max(1, effectiveToday), app.state.user?.currency)}</span>
                    <span class="budget-stat-sub text-slate-400">Projected pace</span>
                </div>
            </div>

            <div class="budget-global-container shadow-sm ${totalUsage > 100 ? 'budget-over-shake' : ''}">
                <div class="budget-global-meta">
                    <span class="budget-global-title font-black uppercase tracking-widest text-[10px] text-slate-400">Overall Budget Utilization</span>
                    <span class="budget-global-pct ${globalTone}">${totalUsage}%</span>
                </div>
                <div class="budget-progress-track">
                    <div class="budget-progress-fill ${globalTone}" style="width: ${Math.min(100, totalUsage)}%"></div>
                </div>
            </div>
            ` : ''}

            <div class="budget-category-grid">
                ${cards}
            </div>

            <div class="budget-insights glass">
                <div class="budget-insights-header">
                    <div class="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                        <i class="fas fa-brain"></i>
                    </div>
                    <h4 class="font-black tracking-tight">Budget Coach</h4>
                </div>
                <div class="budget-alert-list">
                    ${warningItems.length ? warningItems.map((item) => `
                        <div class="budget-alert-item alert-${item.type}">
                            <div class="budget-alert-icon">
                                <i class="fas ${item.icon}"></i>
                            </div>
                            <div class="budget-alert-content">
                                ${escapeHtml(item.text)}
                            </div>
                        </div>
                    `).join('') : '<p class="text-sm font-bold text-slate-400 tracking-tight">Great discipline so far. Keep your spending pace steady.</p>'}
                </div>
            </div>

            <button onclick="app.openBudgetModal({ month: '${currentMonth}' })" class="budget-fab" aria-label="Quick Budget">
                <i class="fas fa-plus"></i>
            </button>
        </div>
    `;
}
