from datetime import date
import math


ALLOWED_TRANSACTION_TYPES = {'income', 'expense'}
ALLOWED_CURRENCIES = {'USD', 'EUR', 'GBP', 'INR'}
MAX_DECIMAL_AMOUNT = 99_999_999.99  # DECIMAL(10,2)
ALLOWED_EXPENSE_CATEGORIES = {
    'Food & Dining',
    'Transportation',
    'Shopping',
    'Entertainment',
    'Bills & Utilities',
    'Healthcare',
    'Education',
    'Parties',
    'Other Expense',
    'Savings',
}
ALLOWED_INCOME_CATEGORIES = {
    'Salary',
    'Freelance',
    'Investment',
    'Gift',
    'Other Income',
}
GOAL_COLOR_ALIASES = {
    'bg-sky-500': 'bg-blue-500',
    'bg-cyan-500': 'bg-teal-600',
    'bg-blue-700': 'bg-indigo-600',
    'bg-indigo-500': 'bg-indigo-600',
    'bg-emerald-500': 'bg-teal-600',
}
ALLOWED_GOAL_COLORS = {
    'bg-blue-500',
    'bg-teal-600',
    'bg-violet-600',
    'bg-rose-600',
    'bg-amber-700',
    'bg-indigo-600',
}


def _require(data, fields):
    missing = [f for f in fields if f not in data or data[f] in (None, '')]
    if missing:
        raise ValueError(f"Missing required fields: {', '.join(missing)}")


def validate_transaction_payload(data):
    _require(data, ['type', 'amount', 'category', 'date'])

    tx_type = str(data['type']).strip()
    if tx_type not in ALLOWED_TRANSACTION_TYPES:
        raise ValueError("Invalid transaction type")
    data['type'] = tx_type

    category = str(data.get('category', '')).strip()
    if not category:
        raise ValueError("Category is required")
    if category == '__custom__':
        raise ValueError("Custom category value is required")

    if len(category) > 50:
        raise ValueError("Category must be 50 characters or fewer")
    # Keep recommended categories, but allow custom user-provided categories.
    if tx_type == 'expense' and category in ALLOWED_EXPENSE_CATEGORIES:
        pass
    elif tx_type == 'income' and category in ALLOWED_INCOME_CATEGORIES:
        pass
    data['category'] = category

    try:
        data['amount'] = float(data['amount'])
    except (TypeError, ValueError) as e:
        raise ValueError("Amount must be numeric") from e

    if not math.isfinite(data['amount']):
        raise ValueError("Amount must be a finite number")

    if data['amount'] <= 0:
        raise ValueError("Amount must be greater than 0")
    if data['amount'] > MAX_DECIMAL_AMOUNT:
        raise ValueError("Amount exceeds maximum supported value")

    try:
        date.fromisoformat(data['date'])
    except (TypeError, ValueError) as e:
        raise ValueError("Date must be in YYYY-MM-DD format") from e

    method = str(data.get('method', 'Cash')).strip()
    if len(method) > 50:
        raise ValueError("Payment method must be 50 characters or fewer")
    data['method'] = method or 'Cash'
    data['description'] = str(data.get('description') or '').strip()
    if len(data['description']) > 255:
        raise ValueError("Description must be 255 characters or fewer")

    return data


def validate_goal_payload(data):
    _require(data, ['name', 'target'])

    try:
        data['target'] = float(data['target'])
        current_raw = data.get('current', 0)
        data['current'] = 0.0 if current_raw in (None, '') else float(current_raw)
    except (TypeError, ValueError) as e:
        raise ValueError("Target and current must be numeric") from e

    if not math.isfinite(data['target']) or not math.isfinite(data['current']):
        raise ValueError("Target and current must be finite numbers")

    if data['target'] <= 0:
        raise ValueError("Target must be greater than 0")
    if data['target'] > MAX_DECIMAL_AMOUNT:
        raise ValueError("Target exceeds maximum supported value")

    if data['current'] < 0:
        raise ValueError("Current saved cannot be negative")
    if data['current'] > MAX_DECIMAL_AMOUNT:
        raise ValueError("Current saved exceeds maximum supported value")

    if data['current'] > data['target']:
        raise ValueError("Current saved cannot exceed target amount")

    deadline = data.get('deadline')
    if deadline in (None, ''):
        data['deadline'] = None
    else:
        try:
            date.fromisoformat(deadline)
        except (TypeError, ValueError) as e:
            raise ValueError("Deadline must be in YYYY-MM-DD format") from e

    color = str(data.get('color') or 'bg-blue-500').strip()
    color = GOAL_COLOR_ALIASES.get(color, color)
    if color not in ALLOWED_GOAL_COLORS:
        raise ValueError("Unsupported goal color")
    data['color'] = color

    return data


def validate_settings_payload(data):
    _require(data, ['currency'])

    if data['currency'] not in ALLOWED_CURRENCIES:
        raise ValueError("Unsupported currency")
        
    # Optional notification settings
    if 'notify_budget_alerts' in data:
        data['notify_budget_alerts'] = bool(data['notify_budget_alerts'])
    if 'notify_goal_milestones' in data:
        data['notify_goal_milestones'] = bool(data['notify_goal_milestones'])

    return data


def validate_budget_payload(data):
    _require(data, ['category', 'amount', 'month'])

    category = str(data.get('category', '')).strip()
    if not category:
        raise ValueError("Category is required")
    if len(category) > 50:
        raise ValueError("Category must be 50 characters or fewer")
    data['category'] = category


    try:
        data['amount'] = float(data['amount'])
    except (TypeError, ValueError) as e:
        raise ValueError("Budget amount must be numeric") from e

    if not math.isfinite(data['amount']):
        raise ValueError("Budget amount must be a finite number")

    if data['amount'] <= 0:
        raise ValueError("Budget amount must be greater than 0")
    if data['amount'] > MAX_DECIMAL_AMOUNT:
        raise ValueError("Budget amount exceeds maximum supported value")

    month = str(data.get('month', '')).strip()
    if len(month) != 7 or month[4] != '-':
        raise ValueError("Month must be in YYYY-MM format")
    try:
        date.fromisoformat(f'{month}-01')
    except (TypeError, ValueError) as e:
        raise ValueError("Month must be in YYYY-MM format") from e
    data['month'] = month

    return data
