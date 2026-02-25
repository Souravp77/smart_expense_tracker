from app.core.db import db_cursor
from app.services.errors import ResourceNotFoundError


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
        if cursor.rowcount == 0:
            raise ResourceNotFoundError("Transaction not found")
        conn.commit()


def delete_transaction(user_id, transaction_id):
    with db_cursor() as (conn, cursor):
        cursor.execute("DELETE FROM transactions WHERE transaction_id=%s AND user_id=%s", (transaction_id, user_id))
        if cursor.rowcount == 0:
            raise ResourceNotFoundError("Transaction not found")
        conn.commit()
def get_transactions(user_id, search_query=None, limit=1000):
    with db_cursor(dictionary=True) as (_, cursor):
        query = "SELECT * FROM transactions WHERE user_id = %s"
        params = [user_id]
        
        if search_query:
            query += " AND (description LIKE %s OR category LIKE %s)"
            params.extend([f"%{search_query}%", f"%{search_query}%"])
            
        query += " ORDER BY date DESC LIMIT %s"
        params.append(limit)
        
        cursor.execute(query, tuple(params))
        transactions = cursor.fetchall()
        for tx in transactions:
            tx['id'] = tx['transaction_id']
            tx['date'] = tx['date'].isoformat()
            if tx.get('created_at'):
                tx['created_at'] = tx['created_at'].isoformat()
        return transactions
