export const modal = {
    element: () => document.getElementById('transactionModal'),
    open() {
        const form = document.getElementById('transactionForm');
        if (form) form.reset();

        const idInput = document.getElementById('txId');
        if (idInput) idInput.value = '';

        const dateInput = document.getElementById('txDate');
        if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

        const txTypeExpense = document.querySelector('input[name="type"][value="expense"]');
        if (txTypeExpense) txTypeExpense.checked = true;

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

        document.getElementById('txCategory').value = tx.category;
        document.getElementById('txMethod').value = tx.method || 'Cash';

        const el = this.element();
        if (el) el.style.display = 'flex';
    },
    close() {
        const el = this.element();
        if (el) el.style.display = 'none';
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
}

