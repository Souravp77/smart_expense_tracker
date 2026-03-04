export function renderDashboardView(app, container) {
    const stats = app.calculateStats();
    const recentTx = app.state.transactions.slice(0, 5);
    const currentMonthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const savingsRateLabel = stats.savingsRate >= 0
        ? `${stats.savingsRate}%`
        : `Deficit ${Math.abs(stats.savingsRate)}%`;
    const savingsRateClass = stats.savingsRate >= 0
        ? 'text-green-600 dark:text-green-400'
        : 'text-rose-600 dark:text-rose-400';

    container.innerHTML = `
        <div class="space-y-8">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                ${app.renderStatCard('Total Balance', stats.balance, 'fa-wallet', 'bg-blue-500', { subtitle: 'Available Income - Expenses' })}
                ${app.renderStatCard('Available Income', stats.totalIncome, 'fa-arrow-trend-up', 'bg-green-500', { subtitle: 'Income - Allocated Savings' })}
                ${app.renderStatCard('Expenses', stats.totalExpense, 'fa-arrow-trend-down', 'bg-red-500', { subtitle: 'Excludes savings transfers' })}
                ${app.renderStatCard('Savings Rate', savingsRateLabel, 'fa-piggy-bank', 'bg-blue-700', { subtitle: 'Total Balance / Total Income', valueClass: savingsRateClass })}
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="glass rounded-2xl p-6 ui-panel">
                    <div class="flex items-center justify-between mb-4 gap-4">
                        <h3 class="ui-panel-title">Income vs Expense</h3>
                        <select class="form-input w-40" onchange="app.setDashboardTrendPeriod(this.value)">
                            <option value="week" ${app.state.dashboardTrendPeriod === 'week' ? 'selected' : ''}>Week</option>
                            <option value="month" ${app.state.dashboardTrendPeriod === 'month' ? 'selected' : ''}>Month</option>
                            <option value="year" ${app.state.dashboardTrendPeriod === 'year' ? 'selected' : ''}>Year</option>
                        </select>
                    </div>
                    <div class="chart-container"><canvas id="trendChart"></canvas></div>
                </div>

                <div class="glass rounded-2xl p-6 ui-panel">
                    <div class="flex items-center justify-between mb-4 gap-4">
                        <h3 class="ui-panel-title">Expense Breakdown</h3>
                        <select class="form-input w-40" onchange="app.setDashboardBreakdownPeriod(this.value)">
                            <option value="week" ${app.state.dashboardBreakdownPeriod === 'week' ? 'selected' : ''}>Week</option>
                            <option value="month" ${app.state.dashboardBreakdownPeriod === 'month' ? 'selected' : ''}>Month</option>
                            <option value="year" ${app.state.dashboardBreakdownPeriod === 'year' ? 'selected' : ''}>Year</option>
                        </select>
                    </div>
                    <div class="chart-container"><canvas id="breakdownChart"></canvas></div>
                </div>
            </div>

            <div class="glass rounded-2xl p-6 ui-panel">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="ui-panel-title">Recent Transactions</h3>
                    <button class="btn-secondary text-xs" onclick="app.navigate('transactions')">View All</button>
                </div>
                ${recentTx.length ? `
                    <table class="data-table">
                        <thead><tr><th>Description</th><th>Category</th><th>Amount</th></tr></thead>
                        <tbody>
                            ${recentTx.map((t) => app.renderTransactionRow(t, true)).join('')}
                        </tbody>
                    </table>` :
                    `<div class="text-center py-10 text-slate-500">
                        <i class="fas fa-receipt text-3xl mb-2 opacity-40"></i>
                        <p class="text-sm mb-1">No transactions in ${currentMonthLabel} yet.</p>
                        <p class="text-xs mb-3">Start with one income or expense to unlock trends.</p>
                        <button class="btn-primary text-xs" onclick="app.openAddTransactionModal()"><i class="fas fa-plus"></i> Add First Transaction</button>
                    </div>`
                }
            </div>
        </div>
    `;

    setTimeout(() => app.setupDashboardCharts(), 100);
}
