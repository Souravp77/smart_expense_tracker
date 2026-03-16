from datetime import date
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP


ALLOWED_TRANSACTION_TYPES = {'income', 'expense'}
ALLOWED_CURRENCIES = {'USD', 'EUR', 'GBP', 'INR'}
MAX_DECIMAL_AMOUNT = Decimal('99999999.99')  # DECIMAL(10,2)
MONEY_QUANTUM = Decimal('0.01')
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


def _to_money(value, numeric_error, finite_error):
    try:
        amount = Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError) as e:
        raise ValueError(numeric_error) from e

    if not amount.is_finite():
        raise ValueError(finite_error)

    return amount.quantize(MONEY_QUANTUM, rounding=ROUND_HALF_UP)


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
    # If the user provides a category, we accept it. 
    # In a more strict system, we'd check if it's in ALLOWED_EXPENSE_CATEGORIES/ALLOWED_INCOME_CATEGORIES
    # unless it's a known custom category. For now, we enforce length and non-empty.
    if tx_type == 'expense' and category not in ALLOWED_EXPENSE_CATEGORIES:
        # We allow it, but we could log a warning or enforce a 'custom' flag if the architecture required.
        pass
    elif tx_type == 'income' and category not in ALLOWED_INCOME_CATEGORIES:
        pass
    data['category'] = category

    data['amount'] = _to_money(
        data['amount'],
        numeric_error="Amount must be numeric",
        finite_error="Amount must be a finite number",
    )

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
        data['target'] = _to_money(
            data['target'],
            numeric_error="Target and current must be numeric",
            finite_error="Target and current must be finite numbers",
        )
        current_raw = data.get('current', 0)
        data['current'] = _to_money(
            0 if current_raw in (None, '') else current_raw,
            numeric_error="Target and current must be numeric",
            finite_error="Target and current must be finite numbers",
        )
    except ValueError as e:
        raise ValueError(str(e)) from e

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


    data['amount'] = _to_money(
        data['amount'],
        numeric_error="Budget amount must be numeric",
        finite_error="Budget amount must be a finite number",
    )

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
