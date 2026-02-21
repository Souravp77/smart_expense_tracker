export const CATEGORY_OPTIONS = {
    expense: ['Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Bills & Utilities', 'Healthcare', 'Education', 'Other Expense'],
    income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Other Income']
};

export const PERIOD_RANGES = {
    week: 7,
    month: 30,
    year: 365,
};

export const CHART_COLORS = {
    trend: {
        income: { border: '#10b981', background: 'rgba(16, 185, 129, 0.18)' },
        expense: { border: '#f43f5e', background: 'rgba(244, 63, 94, 0.18)' },
    },
    analytics: {
        income: '#22c55e',
        expense: '#ef4444',
    },
    palette: [
        '#06b6d4',
        '#22c55e',
        '#f59e0b',
        '#f43f5e',
        '#8b5cf6',
        '#84cc16',
        '#0ea5e9',
        '#ef4444',
        '#14b8a6',
        '#eab308',
    ],
};
