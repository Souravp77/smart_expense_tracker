import { CATEGORY_OPTIONS } from '../constants.js';
import { escapeHtml, formatCurrency } from '../utils.js';

const CATEGORY_ICONS = {
    'Food & Dining': { icon: 'fa-utensils', color: '#f59e0b' },
    Transportation: { icon: 'fa-bus', color: '#3b82f6' },
    Shopping: { icon: 'fa-bag-shopping', color: '#ec4899' },
    Entertainment: { icon: 'fa-film', color: '#8b5cf6' },
    'Bills & Utilities': { icon: 'fa-file-invoice-dollar', color: '#ef4444' },
    Healthcare: { icon: 'fa-heart-pulse', color: '#10b981' },
    Education: { icon: 'fa-graduation-cap', color: '#6366f1' },
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
    if (usage >= 86) return 'tone-danger';
    if (usage >= 61) return 'tone-warn';
    return 'tone-safe';
}

function getBadgeClass(usage) {
    if (usage > 100) return 'badge-over';
    if (usage >= 86) return 'badge-danger';
    if (usage >= 61) return 'badge-warn';
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

    const categories = CATEGORY_OPTIONS.expense || [];
    const monthBudgets = app.state.budgets.filter((b) => b.month === currentMonth);
    const budgetMap = new Map(monthBudgets.map((b) => [b.category, toNumber(b.amount)]));

    const spentMap = new Map();
    app.state.transactions
        .filter((tx) => tx.type === 'expense' && String(tx.date || '').startsWith(currentMonth))
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
                    text: `${category} exceeded by ${formatCurrency(Math.abs(remaining), app.state.user?.currency)}.`,
                });
            } else if (categoryUsage >= 85) {
                warningItems.push({
                    type: 'warning',
                    icon: 'fa-triangle-exclamation',
                    text: `${category} budget is almost exhausted (${categoryUsage}% used).`,
                });
            }

            // Pacing only for current month
            if (!isPastMonth && !isFutureMonth && spent > 0 && effectiveToday > 0 && categoryUsage < 100) {
                const dailyPace = spent / effectiveToday;
                const projectedSpent = dailyPace * lastDayOfMonth;
                if (projectedSpent > budget) {
                    const daysToLimit = Math.floor((budget - spent) / dailyPace);
                    warningItems.push({
                        type: 'info',
                        icon: 'fa-chart-line',
                        text: `At current pace, ${category} may exceed budget in ${daysToLimit + 1} days.`,
                    });
                }
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
                    ${budget > 0 ? `<span class="budget-card-badge ${badge}">${categoryUsage > 100 ? 'Over' : categoryUsage >= 85 ? 'Limited' : 'Safe'}</span>` : ''}
                </div>

                <div class="budget-card-amounts">
                    <div class="budget-amount-box">
                        <p>Budget</p>
                        <h5>${budget > 0 ? formatCurrency(budget, app.state.user?.currency) : '—'}</h5>
                    </div>
                    <div class="budget-amount-box text-right">
                        <p>Spent</p>
                        <h5>${formatCurrency(spent, app.state.user?.currency)}</h5>
                    </div>
                </div>

                <div class="budget-progress-track">
                    <div class="budget-progress-fill ${tone}" style="width: ${Math.min(100, categoryUsage)}%"></div>
                </div>

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
                    <div>
                        <h3 class="text-lg font-black tracking-tight">Financial Guardrails</h3>
                        <p class="text-[12px] font-semibold text-slate-500">${monthLabel(currentMonth)}</p>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <div class="budget-month-selector">
                        <i class="far fa-calendar-alt text-slate-400"></i>
                        <input type="month" value="${currentMonth}" class="budget-month-input" onchange="app.changeBudgetMonth(this.value)">
                    </div>
                    <button onclick="app.openBudgetModal({ month: '${currentMonth}' })" class="btn-primary shadow-lg">
                        <i class="fas fa-sliders"></i>
                        <span class="hidden sm:inline">Set Limits</span>
                    </button>
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
            ` : `
            <div class="p-12 text-center glass rounded-[32px] border-dashed border-2 border-slate-300 dark:border-slate-700">
                <div class="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-bullseye text-2xl text-slate-400"></i>
                </div>
                <h4 class="text-lg font-bold mb-1">No Budgets Defined</h4>
                <p class="text-slate-500 text-sm mb-6 max-width-xs mx-auto">Track your spending by setting limits for your favorite categories in ${monthLabel(currentMonth)}.</p>
                <button onclick="app.openBudgetModal({ month: '${currentMonth}' })" class="btn-primary">
                    <i class="fas fa-plus mr-2"></i>Configure Budgets
                </button>
            </div>
            `}

            <div class="budget-category-grid">
                ${cards}
            </div>

            <div class="budget-insights glass">
                <div class="budget-insights-header">
                    <div class="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                        <i class="fas fa-brain"></i>
                    </div>
                    <h4 class="font-black tracking-tight">Smart Analysis</h4>
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
                    `).join('') : '<p class="text-sm font-bold text-slate-400 tracking-tight">No anomalies detected. Your spending is within parameters.</p>'}
                </div>
            </div>

            <button onclick="app.openBudgetModal({ month: '${currentMonth}' })" class="budget-fab" aria-label="Quick Budget">
                <i class="fas fa-plus"></i>
            </button>
        </div>
    `;
}

