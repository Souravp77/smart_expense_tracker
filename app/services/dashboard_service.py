from app.core.db import db_cursor

DEFAULT_INCOME_CATEGORIES = [
    'Salary',
    'Freelance',
    'Investment',
    'Gift',
]

DEFAULT_EXPENSE_CATEGORIES = [
    'Food & Dining',
    'Shopping',
    'Entertainment',
    'Travel / Outings',
    'Personal Care',
    'Parties',
    'Subscriptions',
    'Other Expense',
]


def _fetch_finance_summary(cursor, user_id):
    cursor.execute(
        """
        SELECT COALESCE(SUM(amount), 0) AS total_income
        FROM transactions
        WHERE user_id = %s AND type = 'income'
        """,
        (user_id,)
    )
    total_income = float(cursor.fetchone()['total_income'] or 0)

    cursor.execute(
        """
        SELECT COALESCE(SUM(amount), 0) AS total_expense
        FROM transactions
        WHERE user_id = %s
          AND type = 'expense'
          AND category <> 'Savings'
        """,
        (user_id,)
    )
    total_expense = float(cursor.fetchone()['total_expense'] or 0)

    cursor.execute(
        """
        SELECT COALESCE(SUM(current_amount), 0) AS allocated_savings
        FROM savings_goals
        WHERE user_id = %s
        """,
        (user_id,)
    )
    allocated_savings = float(cursor.fetchone()['allocated_savings'] or 0)

    available_income = total_income - allocated_savings
    available_balance = available_income - total_expense
    savings_rate = round((available_balance / available_income) * 100) if available_income else 0
    return {
        'totalIncomeRecorded': total_income,
        'allocatedSavings': allocated_savings,
        'availableIncome': available_income,
        'totalExpense': total_expense,
        'availableBalance': available_balance,
        'savingsRate': savings_rate,
    }


def get_dashboard_payload(user):
    with db_cursor(dictionary=True) as (_, cursor):

        cursor.execute(
            "SELECT * FROM transactions WHERE user_id = %s ORDER BY date DESC LIMIT 1000",
            (user.id,)
        )
        transactions = cursor.fetchall()

        for tx in transactions:
            tx['id'] = tx['transaction_id']
            tx['date'] = tx['date'].isoformat()
            if tx.get('created_at'):
                tx['created_at'] = tx['created_at'].isoformat()

        cursor.execute("SELECT * FROM savings_goals WHERE user_id = %s", (user.id,))
        goals = cursor.fetchall()
        for goal in goals:
            goal['id'] = goal['goal_id']
            if goal.get('deadline'):
                goal['deadline'] = goal['deadline'].isoformat()
            if goal.get('created_at'):
                goal['created_at'] = goal['created_at'].isoformat()

        cursor.execute(
            """
            SELECT budget_id, category, amount, month
            FROM budgets
            WHERE user_id = %s
            ORDER BY month DESC, category ASC
            """,
            (user.id,)
        )
        budgets = cursor.fetchall()
        for budget in budgets:
            budget['id'] = budget['budget_id']

        cursor.execute(
            """
            SELECT DISTINCT name, type
            FROM categories
            WHERE user_id IS NULL OR user_id = %s
            ORDER BY name ASC
            """,
            (user.id,)
        )
        categories_raw = cursor.fetchall()
        categories = {'income': [], 'expense': []}
        for cat in categories_raw:
            if cat['type'] in categories:
                categories[cat['type']].append(cat['name'])

        # Merge defaults so UI stays consistent even when older DB seeds are present.
        categories['income'] = list(dict.fromkeys(DEFAULT_INCOME_CATEGORIES + categories['income']))
        categories['expense'] = list(dict.fromkeys(DEFAULT_EXPENSE_CATEGORIES + categories['expense']))

        finance_summary = _fetch_finance_summary(cursor, user.id)



    return {
        'transactions': transactions,
        'savingsGoals': goals,
        'budgets': budgets,
        'categories': categories,
        'financeSummary': finance_summary,
        'user': {
            'id': user.id,
            'name': user.username,
            'email': user.email,
            'currency': user.currency or 'INR',
            'notify_budget_alerts': getattr(user, 'notify_budget_alerts', True),
            'notify_goal_milestones': getattr(user, 'notify_goal_milestones', True)
        }
    }
