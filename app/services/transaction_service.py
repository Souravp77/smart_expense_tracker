from app.core.db import db_cursor


def add_transaction(user_id, data):
    with db_cursor() as (conn, cursor):
        cursor.execute(
            """
            INSERT INTO transactions (user_id, type, amount, category, description, date, method)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                user_id,
                data['type'],
                data['amount'],
                data['category'],
                data.get('description'),
                data['date'],
                data.get('method', 'Cash')
            )
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
        cursor.execute("DELETE FROM transactions WHERE transaction_id=%s AND user_id=%s", (transaction_id, user_id))
        conn.commit()
