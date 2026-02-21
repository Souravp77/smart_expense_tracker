import { formatCurrency } from '../app.js';

export function renderAnalyticsView(app, container) {
    const summary = app.getAnalyticsSummary();
    const monthly = app.getMonthlySummary();

    container.innerHTML = `
        <div class="space-y-6">
            <div>
                <h3 class="text-2xl font-bold">Analytics</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400">Break down trends, spending patterns, and monthly savings performance.</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="glass rounded-2xl p-5"><p class="text-xs text-slate-500">Average Daily Expense</p><p class="text-xl font-bold mt-1">${formatCurrency(summary.avgDailyExpense, app.state.user?.currency)}</p></div>
                <div class="glass rounded-2xl p-5"><p class="text-xs text-slate-500">Top Category</p><p class="text-xl font-bold mt-1">${summary.topCategory}</p></div>
                <div class="glass rounded-2xl p-5"><p class="text-xs text-slate-500">Net Cash Flow</p><p class="text-xl font-bold mt-1 ${summary.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}">${formatCurrency(summary.netCashFlow, app.state.user?.currency)}</p></div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="glass rounded-2xl p-6"><h4 class="font-semibold mb-3">Income vs Expense</h4><div class="chart-container"><canvas id="analyticsTrendChart"></canvas></div></div>
                <div class="glass rounded-2xl p-6"><h4 class="font-semibold mb-3">Category Distribution</h4><div class="chart-container"><canvas id="categoryChart"></canvas></div></div>
            </div>

            <div class="glass rounded-2xl p-6 overflow-x-auto">
                <h4 class="font-semibold mb-3">Monthly Summary</h4>
                <table class="data-table">
                    <thead><tr><th>Month</th><th>Income</th><th>Expense</th><th>Savings</th><th>Savings Rate</th></tr></thead>
                    <tbody>
                        ${monthly.map((m) => `<tr><td>${m.label}</td><td>${formatCurrency(m.income, app.state.user?.currency)}</td><td>${formatCurrency(m.expense, app.state.user?.currency)}</td><td>${formatCurrency(m.savings, app.state.user?.currency)}</td><td><span class="badge ${m.savingsRate >= 20 ? 'badge-income' : 'badge-expense'}">${m.savingsRate}%</span></td></tr>`).join('') || '<tr><td colspan="5" class="text-center py-4">No analytics data</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    setTimeout(() => app.setupAnalyticsCharts(), 100);
}
