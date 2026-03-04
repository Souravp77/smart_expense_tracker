export function renderSettingsView(app, container) {
    const selectedCurrency = app.state.user?.currency || 'INR';

    container.innerHTML = `
        <div class="space-y-6">
            <div class="ui-page-head">
                <h3 class="ui-page-title">Settings</h3>
                <p class="ui-page-subtitle">Manage profile, appearance, and system diagnostics.</p>
            </div>

            <div class="glass rounded-2xl p-6 space-y-5 ui-panel">
                <h4 class="ui-panel-title">Profile</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label class="block text-sm mb-1">Name</label><input type="text" class="form-input" value="${app.state.user?.name || ''}" disabled></div>
                    <div><label class="block text-sm mb-1">Email</label><input type="email" class="form-input" value="${app.state.user?.email || ''}" disabled></div>
                    <div><label class="block text-sm mb-1">Currency</label><select id="settingsCurrency" class="form-input">
                        <option value="USD" ${selectedCurrency === 'USD' ? 'selected' : ''}>USD ($)</option>
                        <option value="EUR" ${selectedCurrency === 'EUR' ? 'selected' : ''}>EUR (EUR)</option>
                        <option value="GBP" ${selectedCurrency === 'GBP' ? 'selected' : ''}>GBP (GBP)</option>
                        <option value="INR" ${selectedCurrency === 'INR' ? 'selected' : ''}>INR (Rs)</option>
                    </select></div>
                </div>
                <button onclick="app.saveSettings()" class="btn-primary">Save Changes</button>
            </div>

            <div class="glass rounded-2xl p-6 space-y-4 ui-panel">
                <h4 class="ui-panel-title">Notifications</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="flex items-center cursor-pointer gap-2">
                            <input type="checkbox" id="settingsNotifyBudget" class="form-checkbox h-5 w-5 text-blue-600 rounded" ${app.state.user?.notify_budget_alerts !== false ? 'checked' : ''}>
                            <span class="text-sm font-semibold">Budget Alerts</span>
                        </label>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-7">Get notified when you exceed 80% or 100% of your category limits.</p>
                    </div>
                    <div>
                        <label class="flex items-center cursor-pointer gap-2">
                            <input type="checkbox" id="settingsNotifyGoals" class="form-checkbox h-5 w-5 text-blue-600 rounded" ${app.state.user?.notify_goal_milestones !== false ? 'checked' : ''}>
                            <span class="text-sm font-semibold">Savings Milestones</span>
                        </label>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-7">Get notified when you reach a savings goal target.</p>
                    </div>
                </div>
            </div>

            <div class="glass rounded-2xl p-6 space-y-4 ui-panel">
                <h4 class="ui-panel-title">Appearance</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm mb-1 font-semibold">Theme Mode</label>
                        <select class="form-input" onchange="app.setThemeMode(this.value)">
                            <option value="light" ${app.state.themeMode === 'light' ? 'selected' : ''}>Light</option>
                            <option value="dark" ${app.state.themeMode === 'dark' ? 'selected' : ''}>Dark</option>
                        </select>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Choose your preferred theme.</p>
                    </div>
                </div>
            </div>

            <div class="glass rounded-2xl p-6 border border-rose-200 dark:border-rose-800/40 space-y-3 ui-panel">
                <h4 class="ui-panel-title text-rose-600 dark:text-rose-300">Danger Zone</h4>
                <p class="text-sm text-slate-500">Delete all transactions, savings goals, budgets, categories, and notifications permanently.</p>
                <button onclick="app.clearAllData()" class="btn-secondary text-rose-600 border-rose-300 hover:bg-rose-50 inline-flex items-center gap-2"><i class="fas fa-trash-alt"></i><span>Clear all data</span></button>
            </div>
        </div>
    `;
}
