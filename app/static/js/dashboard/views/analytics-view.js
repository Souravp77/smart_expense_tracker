import { formatCurrency } from '../app.js';
import { escapeHtml } from '../utils.js';

function getGoalAnalytics(goals = []) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totals = goals.reduce((acc, g) => {
        const target = parseFloat(g.target_amount || 0);
        const current = parseFloat(g.current_amount || 0);
        const progress = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
        const remaining = Math.max(0, target - current);
        const deadlineTs = g.deadline ? new Date(g.deadline).getTime() : null;
        const isCompleted = progress >= 100;

        acc.target += target;
        acc.saved += current;
        acc.remaining += remaining;
        if (isCompleted) acc.completed += 1;
        if (!isCompleted && deadlineTs) {
            const days = Math.ceil((deadlineTs - today.getTime()) / 86400000);
            if (days < 0) acc.overdue += 1;
            else if (days <= 30) acc.dueSoon += 1;
        }
        acc.rows.push({
            name: g.name,
            progress,
            saved: current,
            target,
            remaining,
            deadline: g.deadline || '-',
            status: isCompleted ? 'Completed' : (deadlineTs && deadlineTs < today.getTime() ? 'Overdue' : 'Active')
        });
        return acc;
    }, { target: 0, saved: 0, remaining: 0, completed: 0, overdue: 0, dueSoon: 0, rows: [] });

    totals.rate = totals.target > 0 ? Math.round((totals.saved / totals.target) * 100) : 0;
    totals.total = goals.length;
    totals.rows.sort((a, b) => b.progress - a.progress);
    return totals;
}

export function renderAnalyticsView(app, container) {
    const summary = app.getAnalyticsSummary();
    const monthly = app.getMonthlySummary();
    const goalStats = getGoalAnalytics(app.state.savingsGoals || []);

    container.innerHTML = `
        <div class="space-y-6">
            <div class="glass rounded-2xl p-4">
                <p class="text-sm text-slate-500">Break down trends, spending patterns, and monthly savings performance.</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="glass rounded-2xl p-5"><p class="text-xs text-slate-500">Average Daily Expense</p><p class="text-xl font-bold mt-1">${formatCurrency(summary.avgDailyExpense, app.state.user?.currency)}</p></div>
                <div class="glass rounded-2xl p-5"><p class="text-xs text-slate-500">Top Category</p><p class="text-xl font-bold mt-1">${summary.topCategory}</p></div>
                <div class="glass rounded-2xl p-5"><p class="text-xs text-slate-500">Net Cash Flow</p><p class="text-xl font-bold mt-1 ${summary.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}">${formatCurrency(summary.netCashFlow, app.state.user?.currency)}</p></div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="glass rounded-2xl p-6 ui-panel"><h4 class="ui-panel-title mb-3">Income vs Expense</h4><div class="chart-container"><canvas id="analyticsTrendChart"></canvas></div></div>
                <div class="glass rounded-2xl p-6 ui-panel"><h4 class="ui-panel-title mb-3">Category Distribution</h4><div class="chart-container"><canvas id="categoryChart"></canvas></div></div>
            </div>

            <div class="glass rounded-2xl p-6 overflow-x-auto ui-panel">
                <h4 class="ui-panel-title mb-3">Monthly Summary</h4>
                <table class="data-table">
                    <thead><tr><th>Month</th><th>Income</th><th>Expense</th><th>Savings</th><th>Savings Rate</th></tr></thead>
                    <tbody>
                        ${monthly.map((m) => `<tr><td>${m.label}</td><td>${formatCurrency(m.income, app.state.user?.currency)}</td><td>${formatCurrency(m.expense, app.state.user?.currency)}</td><td>${formatCurrency(m.savings, app.state.user?.currency)}</td><td><span class="badge ${m.savingsRate >= 20 ? 'badge-income' : 'badge-expense'}">${m.savingsRate}%</span></td></tr>`).join('') || '<tr><td colspan="5" class="text-center py-4">No analytics data</td></tr>'}
                    </tbody>
                </table>
            </div>

            <div class="glass rounded-2xl p-6 ui-panel">
                <h4 class="ui-panel-title mb-3">Savings Goals Analytics</h4>
                <div class="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-4">
                    <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-3"><p class="text-xs text-slate-500">Goals</p><p class="text-lg font-bold">${goalStats.total}</p></div>
                    <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-3"><p class="text-xs text-slate-500">Completed</p><p class="text-lg font-bold">${goalStats.completed}</p></div>
                    <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-3"><p class="text-xs text-slate-500">Due Soon</p><p class="text-lg font-bold">${goalStats.dueSoon}</p></div>
                    <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-3"><p class="text-xs text-slate-500">Overdue</p><p class="text-lg font-bold">${goalStats.overdue}</p></div>
                    <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-3"><p class="text-xs text-slate-500">Saved / Target</p><p class="text-lg font-bold">${goalStats.rate}%</p></div>
                    <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-3"><p class="text-xs text-slate-500">Remaining</p><p class="text-lg font-bold">${formatCurrency(goalStats.remaining, app.state.user?.currency)}</p></div>
                </div>
                <div class="overflow-x-auto">
                    <table class="data-table">
                        <thead><tr><th>Goal</th><th>Progress</th><th>Saved</th><th>Target</th><th>Remaining</th><th>Deadline</th><th>Status</th></tr></thead>
                        <tbody>
                            ${goalStats.rows.map((g) => `<tr><td>${escapeHtml(g.name)}</td><td>${g.progress}%</td><td>${formatCurrency(g.saved, app.state.user?.currency)}</td><td>${formatCurrency(g.target, app.state.user?.currency)}</td><td>${formatCurrency(g.remaining, app.state.user?.currency)}</td><td>${escapeHtml(g.deadline)}</td><td><span class="badge ${g.status === 'Completed' ? 'badge-income' : (g.status === 'Overdue' ? 'badge-expense' : '')}">${g.status}</span></td></tr>`).join('') || '<tr><td colspan="7" class="text-center py-4">No goals available</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    setTimeout(() => app.setupAnalyticsCharts(), 100);
}
