from app.core.db import db_cursor


def _fetch_finance_summary(cursor, user_id):
    try:
        cursor.execute(
            """
            SELECT
                total_income_recorded,
                total_expense,
                allocated_savings,
                available_income,
                available_balance
            FROM user_finance_summary
            WHERE user_id = %s
            """,
            (user_id,)
        )
        row = cursor.fetchone()
        if row:
            total_income = float(row['total_income_recorded'] or 0)
            total_expense = float(row['total_expense'] or 0)
            allocated_savings = float(row['allocated_savings'] or 0)
            # Keep API semantics consistent with fallback logic and UI expectations:
            # available income excludes all allocated savings goal amounts.
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
    except Exception:
        pass

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
        WHERE user_id = %s AND type = 'expense'
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

        cursor.execute("SELECT name, type FROM categories")
        categories_raw = cursor.fetchall()
        categories = {'income': [], 'expense': []}
        for cat in categories_raw:
            if cat['type'] in categories:
                categories[cat['type']].append(cat['name'])

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
            'currency': user.currency or 'INR'
        }
    }
