from datetime import date


ALLOWED_TRANSACTION_TYPES = {'income', 'expense'}
ALLOWED_CURRENCIES = {'USD', 'EUR', 'GBP', 'INR'}
ALLOWED_EXPENSE_CATEGORIES = {
    'Food & Dining',
    'Transportation',
    'Shopping',
    'Entertainment',
    'Bills & Utilities',
    'Healthcare',
    'Education',
    'Other Expense',
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

    if data['type'] not in ALLOWED_TRANSACTION_TYPES:
        raise ValueError("Invalid transaction type")

    try:
        data['amount'] = float(data['amount'])
    except (TypeError, ValueError) as e:
        raise ValueError("Amount must be numeric") from e

    if data['amount'] <= 0:
        raise ValueError("Amount must be greater than 0")

    try:
        date.fromisoformat(data['date'])
    except (TypeError, ValueError) as e:
        raise ValueError("Date must be in YYYY-MM-DD format") from e

    return data


def validate_goal_payload(data):
    _require(data, ['name', 'target'])

    try:
        data['target'] = float(data['target'])
        current_raw = data.get('current', 0)
        data['current'] = 0.0 if current_raw in (None, '') else float(current_raw)
    except (TypeError, ValueError) as e:
        raise ValueError("Target and current must be numeric") from e

    if data['target'] <= 0:
        raise ValueError("Target must be greater than 0")

    if data['current'] < 0:
        raise ValueError("Current saved cannot be negative")

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

    return data


def validate_budget_payload(data):
    _require(data, ['category', 'amount', 'month'])

    category = str(data.get('category', '')).strip()
    if not category:
        raise ValueError("Category is required")
    if category not in ALLOWED_EXPENSE_CATEGORIES:
        raise ValueError("Unsupported budget category")
    data['category'] = category

    try:
        data['amount'] = float(data['amount'])
    except (TypeError, ValueError) as e:
        raise ValueError("Budget amount must be numeric") from e

    if data['amount'] <= 0:
        raise ValueError("Budget amount must be greater than 0")

    month = str(data.get('month', '')).strip()
    if len(month) != 7 or month[4] != '-':
        raise ValueError("Month must be in YYYY-MM format")
    try:
        date.fromisoformat(f'{month}-01')
    except (TypeError, ValueError) as e:
        raise ValueError("Month must be in YYYY-MM format") from e
    data['month'] = month

    return data

