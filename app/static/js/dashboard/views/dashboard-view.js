export function renderDashboardView(app, container) {
    const stats = app.calculateStats();
    const recentTx = app.state.transactions.slice(0, 5);

    container.innerHTML = `
        <div class="space-y-8">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                ${app.renderStatCard('Total Balance', stats.balance, 'fa-wallet', 'bg-blue-500')}
                ${app.renderStatCard('Available Income', stats.totalIncome, 'fa-arrow-trend-up', 'bg-green-500')}
                ${app.renderStatCard('Expenses', stats.totalExpense, 'fa-arrow-trend-down', 'bg-red-500')}
                ${app.renderStatCard('Savings Rate', stats.savingsRate + '%', 'fa-piggy-bank', 'bg-blue-700')}
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="glass rounded-2xl p-6">
                    <div class="flex items-center justify-between mb-4 gap-4">
                        <h3 class="font-bold">Income vs Expense</h3>
                        <select class="form-input w-40" onchange="app.setDashboardTrendPeriod(this.value)">
                            <option value="week" ${app.state.dashboardTrendPeriod === 'week' ? 'selected' : ''}>Week</option>
                            <option value="month" ${app.state.dashboardTrendPeriod === 'month' ? 'selected' : ''}>Month</option>
                            <option value="year" ${app.state.dashboardTrendPeriod === 'year' ? 'selected' : ''}>Year</option>
                        </select>
                    </div>
                    <div class="chart-container"><canvas id="trendChart"></canvas></div>
                </div>

                <div class="glass rounded-2xl p-6">
                    <div class="flex items-center justify-between mb-4 gap-4">
                        <h3 class="font-bold">Expense Breakdown</h3>
                        <select class="form-input w-40" onchange="app.setDashboardBreakdownPeriod(this.value)">
                            <option value="week" ${app.state.dashboardBreakdownPeriod === 'week' ? 'selected' : ''}>Week</option>
                            <option value="month" ${app.state.dashboardBreakdownPeriod === 'month' ? 'selected' : ''}>Month</option>
                            <option value="year" ${app.state.dashboardBreakdownPeriod === 'year' ? 'selected' : ''}>Year</option>
                        </select>
                    </div>
                    <div class="chart-container"><canvas id="breakdownChart"></canvas></div>
                </div>
            </div>

            <div class="glass rounded-2xl p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-bold">Recent Transactions</h3>
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
                        <p class="text-sm mb-3">No transactions yet.</p>
                        <button class="btn-primary text-xs" onclick="app.openAddTransactionModal()"><i class="fas fa-plus"></i> Add First Transaction</button>
                    </div>`
                }
            </div>
        </div>
    `;

    setTimeout(() => app.setupDashboardCharts(), 100);
}
