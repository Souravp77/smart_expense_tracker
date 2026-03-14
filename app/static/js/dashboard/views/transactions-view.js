export function renderTransactionsView(app, container) {
    const items = app.getFilteredTransactions();
    const hasAnyTransactions = (app.state.transactions || []).length > 0;
    const hasFilters = (app.state.filterType && app.state.filterType !== 'all') || Boolean(app.state.filterSearch);
    const isMobile = window.matchMedia('(max-width: 640px)').matches;
    const categories = Array.from(new Set((app.state.transactions || []).map((t) => t.category).filter(Boolean))).sort((a, b) => a.localeCompare(b));
    const hasAdvancedFilters = hasFilters || (app.state.filterCategory && app.state.filterCategory !== 'all') || Boolean(app.state.filterMonth);
    const emptyMessage = hasAnyTransactions
        ? 'No transactions match your current filters.'
        : 'No transactions yet. Add your first transaction to start tracking.';
    const emptyHint = hasAnyTransactions
        ? 'Try a different keyword or reset filters.'
        : 'Your recent activity will appear here once you add income or expense records.';

    container.innerHTML = `
        <div class="glass rounded-2xl overflow-hidden">
            <div class="p-6 border-b border-slate-200 dark:border-slate-800 space-y-4">
                <div class="flex justify-between items-center">
                    <p class="text-sm text-slate-500">Filter and manage all your income and expenses in one place.</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input id="transactionSearchInput" type="text" class="form-input md:col-span-3" placeholder="Search description or category..." value="${app.state.filterSearch || ''}" oninput="app.setTransactionSearch(this.value, this.selectionStart)">
                    <select class="form-input" onchange="app.setTransactionType(this.value)">
                        <option value="all" ${app.state.filterType === 'all' ? 'selected' : ''}>All</option>
                        <option value="income" ${app.state.filterType === 'income' ? 'selected' : ''}>Income</option>
                        <option value="expense" ${app.state.filterType === 'expense' ? 'selected' : ''}>Expense</option>
                    </select>
                    <select class="form-input" onchange="app.setTransactionCategory(this.value)">
                        <option value="all" ${app.state.filterCategory === 'all' ? 'selected' : ''}>All Categories</option>
                        ${categories.map((c) => `<option value="${c}" ${app.state.filterCategory === c ? 'selected' : ''}>${c}</option>`).join('')}
                    </select>
                    <input type="month" class="form-input" value="${app.state.filterMonth || ''}" onchange="app.setTransactionMonth(this.value)">
                </div>

                <div class="flex justify-end">
                    <button class="btn-secondary text-xs" onclick="app.resetTransactionFilters()" ${hasAdvancedFilters ? '' : 'disabled'}>
                        Reset Filters
                    </button>
                </div>
            </div>

            ${isMobile ? `
                <div class="tx-mobile-list">
                    ${items.map((t) => app.renderTransactionCard(t)).join('') || `<div class="text-center py-10 px-4 text-slate-500">
                        <i class="fas fa-filter text-2xl opacity-50 mb-2"></i>
                        <p>${emptyMessage}</p>
                        <p class="text-xs mt-1">${emptyHint}</p>
                        ${hasAnyTransactions && hasAdvancedFilters ? '<button class="btn-secondary text-xs mt-3" onclick="app.resetTransactionFilters()">Reset filters</button>' : ''}
                    </div>`}
                </div>
                <button onclick="app.openAddTransactionModal()" class="tx-mobile-fab" aria-label="Add transaction">
                    <i class="fas fa-plus"></i>
                </button>
            ` : `
                <div class="overflow-x-auto">
                    <table class="data-table">
                        <thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Type</th><th>Payment Method</th><th class="text-right">Amount</th><th class="text-right">Actions</th></tr></thead>
                        <tbody>
                            ${items.map((t) => app.renderFullTransactionRow(t)).join('') || `<tr><td colspan="7" class="text-center py-10">
                                <div class="text-slate-500">
                                    <i class="fas fa-filter text-2xl opacity-50 mb-2"></i>
                                    <p>${emptyMessage}</p>
                                    <p class="text-xs mt-1">${emptyHint}</p>
                                ${hasAnyTransactions && hasAdvancedFilters ? '<button class="btn-secondary text-xs mt-3" onclick="app.resetTransactionFilters()">Reset filters</button>' : ''}
                            </div>
                        </td></tr>`}
                        </tbody>
                    </table>
                </div>
            `}
        </div>
    `;
}
