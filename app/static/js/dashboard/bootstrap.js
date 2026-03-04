import { ExpenseApp, loading, toast } from './app.js';
import {
    bindModalCloseUX,
    bindTransactionTypeSwitch,
    goalModal,
    modal,
} from './modal-controller.js';

function bindResponsiveShell() {
    const onResize = () => {
        if (!window.app) return;
        if (window.innerWidth >= 1024) {
            window.app.closeSidebar();
        }
    };

    window.addEventListener('resize', onResize);
    onResize();
}

function bindForms() {
    const showGoalError = (message = '') => {
        const box = document.getElementById('goalModalError');
        const text = document.getElementById('goalModalErrorText');
        if (!box || !text) return;
        if (!message) {
            box.style.display = 'none';
            text.textContent = '';
            return;
        }
        text.textContent = message;
        box.style.display = 'flex';
    };

    const txForm = document.getElementById('transactionForm');
    if (txForm) {
        txForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            window.app.addTransaction(formData);
        });
    }

    const goalForm = document.getElementById('goalForm');
    if (goalForm) {
        // Sync swatch selected highlight
        goalForm.querySelectorAll('.goal-color-swatch input[type="radio"]').forEach((radio) => {
            radio.addEventListener('change', () => {
                goalForm.querySelectorAll('.goal-color-swatch').forEach((s) => s.classList.remove('selected'));
                if (radio.parentElement) radio.parentElement.classList.add('selected');
            });
        });

        // Quick suggestion chips — autofill goal name
        goalForm.querySelectorAll('.gm-suggest').forEach((btn) => {
            btn.addEventListener('click', () => {
                const nameInput = goalForm.elements.name;
                if (nameInput) {
                    nameInput.value = btn.dataset.name || '';
                    nameInput.dispatchEvent(new Event('input', { bubbles: true }));
                    nameInput.focus();
                }
            });
        });

        goalForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.target));
            const goalId = data.goalId;
            delete data.goalId;
            data.current = data.current === '' ? '0' : data.current;
            data.deadline = data.deadline || null;

            const targetAmount = parseFloat(data.target);
            const currentAmount = parseFloat(data.current);
            if (Number.isFinite(targetAmount) && Number.isFinite(currentAmount) && currentAmount > targetAmount) {
                showGoalError('Initial amount cannot be greater than target amount');
                toast.error('Initial amount cannot be greater than target amount');
                return;
            }
            showGoalError('');

            loading.with(async () => {
                try {
                    await window.app.requestJson(
                        goalId ? `/api/goals/${goalId}` : '/api/goals',
                        {
                            method: goalId ? 'PUT' : 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(data)
                        },
                        'Goal save failed'
                    );
                    toast.success(goalId ? 'Goal updated' : 'Goal added');
                    window.goalModal.close();
                    await window.app.fetchData();
                } catch (error) {
                    showGoalError(error.message || 'Goal save failed');
                    toast.error(error.message || 'Goal save failed');
                    console.error(error);
                }
            });
        });
    }
}

export async function initDashboard() {
    window.modal = modal;
    window.goalModal = goalModal;

    window.app = new ExpenseApp();
    await window.app.init();

    bindModalCloseUX();
    bindTransactionTypeSwitch();
    bindResponsiveShell();
    bindForms();
}
