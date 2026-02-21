from datetime import date


ALLOWED_TRANSACTION_TYPES = {'income', 'expense'}
ALLOWED_CURRENCIES = {'USD', 'EUR', 'GBP', 'INR'}


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

    # Optional goalId comes from hidden form field and may arrive as an empty string.
    goal_id = data.get('goalId')
    if goal_id in (None, ''):
        data['goalId'] = None
    else:
        try:
            data['goalId'] = int(goal_id)
        except (TypeError, ValueError) as e:
            raise ValueError("goalId must be an integer") from e

    return data


def validate_goal_payload(data):
    _require(data, ['name', 'target', 'current'])

    try:
        data['target'] = float(data['target'])
        data['current'] = float(data['current'])
    except (TypeError, ValueError) as e:
        raise ValueError("Target and current must be numeric") from e

    if data['target'] <= 0:
        raise ValueError("Target must be greater than 0")

    if data['current'] < 0:
        raise ValueError("Current saved cannot be negative")

    return data


def validate_settings_payload(data):
    _require(data, ['currency'])

    if data['currency'] not in ALLOWED_CURRENCIES:
        raise ValueError("Unsupported currency")

    return data
