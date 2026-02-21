export function renderSavingsView(app, container) {
    container.innerHTML = `
        <div class="space-y-6">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                    <h3 class="text-2xl font-bold">Savings Goals</h3>
                    <p class="text-sm text-slate-500 dark:text-slate-400">Create targets and track your progress automatically.</p>
                </div>
                <button onclick="goalModal.open()" class="btn-primary">New Goal</button>
            </div>
            ${app.state.savingsGoals.length ? `
                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    ${app.state.savingsGoals.map((g) => app.renderGoalCard(g)).join('')}
                </div>` :
                `<div class="glass rounded-2xl p-12 text-center text-slate-500">
                    <i class="fas fa-bullseye text-4xl mb-3 opacity-40"></i>
                    <p class="mb-3">No goals yet.</p>
                    <button onclick="goalModal.open()" class="btn-primary text-xs">Create First Goal</button>
                </div>`
            }
        </div>
    `;
}
