export function renderSettingsView(app, container) {
    const selectedCurrency = app.state.user?.currency || 'INR';

    container.innerHTML = `
        <div class="space-y-6">
            <div>
                <h3 class="text-2xl font-bold">Settings</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400">Manage profile, appearance, and system diagnostics.</p>
            </div>

            <div class="glass rounded-2xl p-6 space-y-5">
                <h4 class="font-semibold">Profile</h4>
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

            <div class="glass rounded-2xl p-6 space-y-4">
                <h4 class="font-semibold">Appearance</h4>
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

            <div class="glass rounded-2xl p-6 border border-rose-200 dark:border-rose-800/40 space-y-3">
                <h4 class="font-semibold text-rose-600 dark:text-rose-300">Danger Zone</h4>
                <p class="text-sm text-slate-500">Clear all transactions and savings goals. This cannot be undone.</p>
                <button onclick="app.clearAllData()" class="btn-secondary text-rose-600 border-rose-300 hover:bg-rose-50">Clear All Data</button>
            </div>
        </div>
    `;
}
