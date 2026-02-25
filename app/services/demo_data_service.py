from datetime import date, timedelta

from app.core.db import db_cursor


def seed_demo_data(user_id):
    with db_cursor() as (conn, cursor):
        cursor.execute("SELECT COUNT(*) FROM transactions WHERE user_id = %s", (user_id,))
        tx_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM savings_goals WHERE user_id = %s", (user_id,))
        goal_count = cursor.fetchone()[0]

        if tx_count > 0 or goal_count > 0:
            return

        today = date.today()

        goals = [
            ('Emergency Fund', 3000.00, 900.00, 'bg-blue-500'),
            ('Summer Trip', 1800.00, 450.00, 'bg-indigo-500'),
        ]
        cursor.executemany(
            """
            INSERT INTO savings_goals (user_id, name, target_amount, current_amount, color)
            VALUES (%s, %s, %s, %s, %s)
            """,
            [(user_id, name, target, current, color) for name, target, current, color in goals]
        )

        tx_rows = [
            (user_id, 'income', 3200.00, 'Salary', 'Monthly salary', today - timedelta(days=14), 'Bank Transfer'),
            (user_id, 'income', 450.00, 'Freelance', 'Side project payment', today - timedelta(days=9), 'Bank Transfer'),
            (user_id, 'expense', 160.00, 'Food & Dining', 'Weekly groceries', today - timedelta(days=7), 'Card'),
            (user_id, 'expense', 75.00, 'Transportation', 'Fuel and commute', today - timedelta(days=5), 'Card'),
            (user_id, 'expense', 220.00, 'Bills & Utilities', 'Electricity + internet', today - timedelta(days=3), 'Bank Transfer'),
            (user_id, 'income', 300.00, 'Investment', 'Dividend payout', today - timedelta(days=2), 'Bank Transfer'),
            (user_id, 'expense', 95.00, 'Entertainment', 'Weekend outing', today - timedelta(days=1), 'Card'),
        ]

        cursor.executemany(
            """
            INSERT INTO transactions (user_id, type, amount, category, description, date, method)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            tx_rows
        )

        conn.commit()
