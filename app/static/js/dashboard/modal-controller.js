export const modal = {
    element: () => document.getElementById('transactionModal'),
    open() {
        const form = document.getElementById('transactionForm');
        if (form) form.reset();
        window.app?.showTransactionFormError('');

        const idInput = document.getElementById('txId');
        if (idInput) idInput.value = '';

        const dateInput = document.getElementById('txDate');
        if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

        const lastType = localStorage.getItem('lastTxType') || 'expense';
        const txType = document.querySelector(`input[name="type"][value="${lastType}"]`)
            || document.querySelector('input[name="type"][value="expense"]');
        if (txType) txType.checked = true;

        const categoryCustom = document.getElementById('txCategoryCustom');
        if (categoryCustom) {
            categoryCustom.value = '';
            categoryCustom.classList.add('hidden');
            categoryCustom.required = false;
        }

        if (window.app) window.app.updateCategoryOptions(lastType);
        const categorySelect = document.getElementById('txCategory');
        const lastCategory = (localStorage.getItem('lastTxCategory') || '').trim();
        if (categorySelect && lastCategory) {
            const knownCategory = Array.from(categorySelect.options).some((o) => o.value === lastCategory);
            if (knownCategory) {
                categorySelect.value = lastCategory;
            } else {
                categorySelect.value = '__custom__';
                if (categoryCustom) categoryCustom.value = lastCategory;
            }
            window.app?.syncCustomCategoryInput();
        }

        const methodSelect = document.getElementById('txMethod');
        if (methodSelect) {
            const lastMethod = (localStorage.getItem('lastTxMethod') || 'Cash').trim();
            const knownMethod = Array.from(methodSelect.options).some((o) => o.value === lastMethod);
            methodSelect.value = knownMethod ? lastMethod : 'Cash';
        }

        const el = this.element();
        if (el) el.style.display = 'flex';
    },
    openForEdit(tx) {
        const form = document.getElementById('transactionForm');
        if (!form || !tx) return;

        document.getElementById('txId').value = tx.id;
        document.getElementById('txAmount').value = tx.amount;
        document.getElementById('txDescription').value = tx.description || '';
        document.getElementById('txDate').value = tx.date;

        const radios = form.querySelectorAll('input[name="type"]');
        radios.forEach((r) => { r.checked = r.value === tx.type; });

        if (window.app) window.app.updateCategoryOptions(tx.type);
        const categorySelect = document.getElementById('txCategory');
        const categoryCustom = document.getElementById('txCategoryCustom');
        if (categorySelect && categoryCustom) {
            const knownCategory = Array.from(categorySelect.options).some((o) => o.value === tx.category);
            if (knownCategory) {
                categorySelect.value = tx.category;
                categoryCustom.value = '';
            } else {
                categorySelect.value = '__custom__';
                categoryCustom.value = tx.category || '';
            }
            window.app?.syncCustomCategoryInput();
        }
        const methodSelect = document.getElementById('txMethod');
        if (methodSelect) {
            const normalizedMethod = (tx.method || '').trim() || 'Cash';
            const knownMethod = Array.from(methodSelect.options).some((o) => o.value === normalizedMethod);
            methodSelect.value = knownMethod ? normalizedMethod : 'Other';
        }

        const el = this.element();
        if (el) el.style.display = 'flex';
    },
    close() {
        const el = this.element();
        if (el) el.style.display = 'none';
        window.app?.showTransactionFormError('');
    }
};

function normalizeGoalColor(color) {
    const aliases = {
        'bg-sky-500': 'bg-blue-500',
        'bg-cyan-500': 'bg-teal-600',
        'bg-blue-700': 'bg-indigo-600',
        'bg-indigo-500': 'bg-indigo-600',
        'bg-emerald-500': 'bg-teal-600',
    };
    return aliases[color] || color || 'bg-blue-500';
}

export const goalModal = {
    element: () => document.getElementById('goalModal'),
    open() {
        const form = document.getElementById('goalForm');
        if (form) form.reset();
        const errorBox = document.getElementById('goalModalError');
        if (errorBox) errorBox.style.display = 'none';
        const errorText = document.getElementById('goalModalErrorText');
        if (errorText) errorText.textContent = '';
        const title = document.getElementById('goalModalTitle');
        if (title) title.textContent = 'Create New Goal';
        // Update save button text
        const saveBtn = form?.querySelector('.gm-btn-save, button[type="submit"]');
        const saveBtnSpan = saveBtn?.querySelector('span') || saveBtn;
        if (saveBtnSpan) saveBtnSpan.textContent = 'Create Goal';
        const idInput = document.getElementById('goalId');
        if (idInput) idInput.value = '';
        const currentInput = form?.elements?.current;
        if (currentInput) currentInput.value = '0';

        // Reset swatches to default blue
        if (form) {
            form.querySelectorAll('.goal-color-swatch').forEach((s) => s.classList.remove('selected'));
            const blueRadio = form.querySelector('input[name="color"][value="bg-blue-500"]');
            if (blueRadio) {
                blueRadio.checked = true;
                blueRadio.parentElement?.classList.add('selected');
            }
        }

        ['name', 'target', 'current'].forEach((field) => {
            const input = form?.elements?.[field];
            if (input) input.dispatchEvent(new Event('input', { bubbles: true }));
        });
        const el = this.element();
        if (el) el.style.display = 'flex';

        // Autofocus name input
        setTimeout(() => { form?.elements?.name?.focus(); }, 80);
    },
    openForEdit(goal) {
        const form = document.getElementById('goalForm');
        if (!form || !goal) return;
        const errorBox = document.getElementById('goalModalError');
        if (errorBox) errorBox.style.display = 'none';
        const errorText = document.getElementById('goalModalErrorText');
        if (errorText) errorText.textContent = '';

        const title = document.getElementById('goalModalTitle');
        if (title) title.textContent = 'Edit Savings Goal';
        // Update save button text
        const saveBtn = form.querySelector('.gm-btn-save, button[type="submit"]');
        const saveBtnSpan = saveBtn?.querySelector('span') || saveBtn;
        if (saveBtnSpan) saveBtnSpan.textContent = 'Update Goal';

        document.getElementById('goalId').value = goal.id;
        form.elements.name.value = goal.name;
        form.elements.target.value = goal.target_amount;
        form.elements.current.value = goal.current_amount;
        if (form.elements.deadline) form.elements.deadline.value = goal.deadline || '';

        // Restore saved color swatch
        const savedColor = normalizeGoalColor(goal.color || 'bg-blue-500');
        form.querySelectorAll('.goal-color-swatch').forEach((s) => s.classList.remove('selected'));
        const matchedRadio = form.querySelector(`input[name="color"][value="${savedColor}"]`);
        if (matchedRadio) {
            matchedRadio.checked = true;
            matchedRadio.parentElement?.classList.add('selected');
        } else {
            const blueRadio = form.querySelector('input[name="color"][value="bg-blue-500"]');
            if (blueRadio) {
                blueRadio.checked = true;
                blueRadio.parentElement?.classList.add('selected');
            }
        }

        ['name', 'target', 'current'].forEach((field) => {
            const input = form.elements[field];
            if (input) input.dispatchEvent(new Event('input', { bubbles: true }));
        });

        const el = this.element();
        if (el) el.style.display = 'flex';

        // Autofocus name input
        setTimeout(() => { form?.elements?.name?.focus(); }, 80);
    },
    close() {
        const el = this.element();
        if (el) el.style.display = 'none';
        const errorBox = document.getElementById('goalModalError');
        if (errorBox) errorBox.style.display = 'none';
        const errorText = document.getElementById('goalModalErrorText');
        if (errorText) errorText.textContent = '';
    }
};

export function bindModalCloseUX() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            window.modal.close();
            window.goalModal.close();
        }
    });

    ['transactionModal', 'goalModal'].forEach((id) => {
        const overlay = document.getElementById(id);
        if (!overlay) return;
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                if (id === 'transactionModal') window.modal.close();
                if (id === 'goalModal') window.goalModal.close();
            }
        });
    });
}

export function bindTransactionTypeSwitch() {
    document.querySelectorAll('input[name="type"]').forEach((radio) => {
        radio.addEventListener('change', () => {
            if (!window.app) return;
            window.app.updateCategoryOptions(radio.value);
        });
    });

    const categorySelect = document.getElementById('txCategory');
    if (categorySelect) {
        categorySelect.addEventListener('change', () => {
            window.app?.syncCustomCategoryInput();
        });
    }
}
