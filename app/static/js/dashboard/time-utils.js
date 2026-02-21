import { PERIOD_RANGES } from './constants.js';

export function toISODate(date) {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split('T')[0];
}

export function monthLabel(isoDate) {
    const d = new Date(isoDate);
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export function filterByPeriod(transactions, period) {
    const days = PERIOD_RANGES[period] || 30;
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days + 1);
    const startIso = toISODate(start);
    const endIso = toISODate(end);
    return transactions.filter((t) => t.date >= startIso && t.date <= endIso);
}
