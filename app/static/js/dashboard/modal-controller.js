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

export const goalModal = {
    element: () => document.getElementById('goalModal'),
    open() {
        const form = document.getElementById('goalForm');
        if (form) form.reset();
        const title = document.getElementById('goalModalTitle');
        if (title) title.textContent = 'Add Savings Goal';
        const idInput = document.getElementById('goalId');
        if (idInput) idInput.value = '';
        const el = this.element();
        if (el) el.style.display = 'flex';
    },
    openForEdit(goal) {
        const form = document.getElementById('goalForm');
        if (!form || !goal) return;

        const title = document.getElementById('goalModalTitle');
        if (title) title.textContent = 'Edit Savings Goal';

        document.getElementById('goalId').value = goal.id;
        form.elements.name.value = goal.name;
        form.elements.target.value = goal.target_amount;
        form.elements.current.value = goal.current_amount;
        form.elements.color.value = goal.color || 'bg-blue-500';

        const el = this.element();
        if (el) el.style.display = 'flex';
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
