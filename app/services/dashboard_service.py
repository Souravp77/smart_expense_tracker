from app.core.db import db_cursor


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

    return {
        'transactions': transactions,
        'savingsGoals': goals,
        'budgets': budgets,
        'user': {
            'id': user.id,
            'name': user.username,
            'email': user.email,
            'currency': user.currency or 'INR'
        }
    }
