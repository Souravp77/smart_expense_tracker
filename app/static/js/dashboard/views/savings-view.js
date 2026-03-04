function renderEmptyState() {
    return `
        <div class="sav-empty-state">
            <div class="sav-empty-icon">
                <i class="fas fa-piggy-bank"></i>
                <div class="sav-empty-icon-ring"></div>
            </div>
            <h3 class="sav-empty-title">No savings goals yet</h3>
            <p class="sav-empty-desc">Create your first goal and track progress from one place.</p>
            <button onclick="goalModal.open()" class="sav-empty-cta">
                <i class="fas fa-plus"></i>
                Create Goal
            </button>
        </div>
    `;
}

export function renderSavingsView(app, container) {
    const goals = app.state.savingsGoals || [];

    container.innerHTML = `
        <section class="sav-module" aria-label="Savings Goals">
            <div class="budget-header glass">
                <div class="ui-page-head">
                    <h3 class="ui-page-title">Savings Goals</h3>
                    <p class="ui-page-subtitle">Track progress and keep goals moving each month.</p>
                </div>
                <button onclick="goalModal.open()" class="btn-primary"><i class="fas fa-plus"></i> New Goal</button>
            </div>

            <div id="savingsGoalGrid">
                ${goals.length
            ? `<div class="sav-goal-grid" id="savGoalGrid">${goals.map((g) => app.renderGoalCard(g)).join('')}</div>`
            : renderEmptyState()}
            </div>

            <button onclick="goalModal.open()" class="savings-fab" aria-label="Add new goal">
                <i class="fas fa-plus"></i>
            </button>
        </section>
    `;
}
