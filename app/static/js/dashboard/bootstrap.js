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
        goalForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.target));
            const goalId = data.goalId;
            delete data.goalId;

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
