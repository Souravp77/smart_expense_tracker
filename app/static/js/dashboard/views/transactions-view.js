export function renderTransactionsView(app, container) {
    const items = app.getFilteredTransactions();

    container.innerHTML = `
        <div class="glass rounded-2xl overflow-hidden">
            <div class="p-6 border-b border-slate-200 dark:border-slate-800 space-y-4">
                <div class="flex justify-between items-center">
                    <h3 class="font-bold text-lg">Transactions</h3>
                    <button onclick="app.openAddTransactionModal()" class="btn-primary"><i class="fas fa-plus"></i> Add</button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input id="transactionSearchInput" type="text" class="form-input md:col-span-2" placeholder="Search description or category..." value="${app.state.filterSearch || ''}" oninput="app.setTransactionSearch(this.value, this.selectionStart)">
                    <select class="form-input" onchange="app.setTransactionType(this.value)">
                        <option value="all" ${app.state.filterType === 'all' ? 'selected' : ''}>All</option>
                        <option value="income" ${app.state.filterType === 'income' ? 'selected' : ''}>Income</option>
                        <option value="expense" ${app.state.filterType === 'expense' ? 'selected' : ''}>Expense</option>
                    </select>
                </div>
            </div>

            <div class="overflow-x-auto">
                <table class="data-table">
                    <thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Type</th><th>Payment Method</th><th class="text-right">Amount</th><th class="text-right">Actions</th></tr></thead>
                    <tbody>
                        ${items.map((t) => app.renderFullTransactionRow(t)).join('') || `<tr><td colspan="7" class="text-center py-10">
                            <div class="text-slate-500">
                                <i class="fas fa-filter text-2xl opacity-50 mb-2"></i>
                                <p>No transactions match your filter.</p>
                            </div>
                        </td></tr>`}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}
