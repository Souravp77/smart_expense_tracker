from datetime import date, timedelta
from app.core.db import db_cursor
from app.repositories.goal_repository import GoalRepository
from app.repositories.transaction_repository import TransactionRepository

def seed_demo_data(user_id):
    with db_cursor() as (conn, cursor):
        # Check if user already has data
        cursor.execute("SELECT COUNT(*) AS count FROM transactions WHERE user_id = %s", (user_id,))
        tx_count = cursor.fetchone()['count']
        cursor.execute("SELECT COUNT(*) AS count FROM savings_goals WHERE user_id = %s", (user_id,))
        goal_count = cursor.fetchone()['count']

        if tx_count > 0 or goal_count > 0:
            return

        today = date.today()

        goals = [
            {'name': 'Summer Trip', 'target': 1800.00, 'current': 450.00, 'color': 'bg-indigo-500', 'icon': 'fa-plane', 'priority': 'high', 'deadline': (today + timedelta(days=180)).isoformat()},
        ]
        for goal_data in goals:
            GoalRepository.create(user_id, goal_data, cursor=cursor)

        tx_rows = [
            {'type': 'income', 'amount': 3200.00, 'category': 'Salary', 'description': 'Monthly salary', 'date': (today - timedelta(days=14)).isoformat(), 'method': 'Bank Transfer'},
            {'type': 'income', 'amount': 450.00, 'category': 'Freelance', 'description': 'Side project payment', 'date': (today - timedelta(days=9)).isoformat(), 'method': 'Bank Transfer'},
            {'type': 'expense', 'amount': 160.00, 'category': 'Food & Dining', 'description': 'Weekly groceries', 'date': (today - timedelta(days=7)).isoformat(), 'method': 'Card'},
            {'type': 'income', 'amount': 300.00, 'category': 'Investment', 'description': 'Dividend payout', 'date': (today - timedelta(days=2)).isoformat(), 'method': 'Bank Transfer'},
            {'type': 'expense', 'amount': 95.00, 'category': 'Entertainment', 'description': 'Weekend outing', 'date': (today - timedelta(days=1)).isoformat(), 'method': 'Card'},
        ]

        for tx_data in tx_rows:
            TransactionRepository.create(user_id, tx_data, cursor=cursor)

        conn.commit()

