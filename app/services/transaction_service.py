from app.core.db import db_cursor


def add_transaction(user_id, data):
    goal_id = data.get('goalId') or None

    with db_cursor() as (conn, cursor):
        cursor.execute(
            """
            INSERT INTO transactions (user_id, type, amount, category, description, date, method, goal_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                user_id,
                data['type'],
                data['amount'],
                data['category'],
                data.get('description'),
                data['date'],
                data.get('method', 'Cash'),
                goal_id
            )
        )

        if goal_id:
            cursor.execute(
                """
                UPDATE savings_goals
                SET current_amount = LEAST(target_amount, current_amount + %s)
                WHERE goal_id = %s AND user_id = %s
                """,
                (data['amount'], goal_id, user_id)
            )

        conn.commit()
        return cursor.lastrowid


def update_transaction(user_id, transaction_id, data):
    with db_cursor() as (conn, cursor):
        cursor.execute(
            """
            UPDATE transactions
            SET type=%s, amount=%s, category=%s, description=%s, date=%s, method=%s
            WHERE transaction_id=%s AND user_id=%s
            """,
            (
                data['type'],
                data['amount'],
                data['category'],
                data.get('description'),
                data['date'],
                data.get('method', 'Cash'),
                transaction_id,
                user_id
            )
        )
        conn.commit()


def delete_transaction(user_id, transaction_id):
    with db_cursor() as (conn, cursor):
        cursor.execute(
            "SELECT amount, goal_id FROM transactions WHERE transaction_id=%s AND user_id=%s",
            (transaction_id, user_id)
        )
        tx = cursor.fetchone()

        if tx and tx[1]:
            cursor.execute(
                """
                UPDATE savings_goals
                SET current_amount = GREATEST(0, current_amount - %s)
                WHERE goal_id = %s AND user_id = %s
                """,
                (tx[0], tx[1], user_id)
            )

        cursor.execute("DELETE FROM transactions WHERE transaction_id=%s AND user_id=%s", (transaction_id, user_id))
        conn.commit()
