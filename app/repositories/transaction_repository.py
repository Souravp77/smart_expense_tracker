from app.core.db import db_cursor
from decimal import Decimal

class TransactionRepository:
    @staticmethod
    def get_by_id(user_id, transaction_id, cursor=None):
        query = "SELECT * FROM transactions WHERE transaction_id = %s AND user_id = %s"
        params = (transaction_id, user_id)
        if cursor:
            cursor.execute(query, params)
            return cursor.fetchone()
        with db_cursor(dictionary=True) as (_, cursor):
            cursor.execute(query, params)
            return cursor.fetchone()

    @staticmethod
    def get_all_by_user(user_id, search_query=None, limit=1000, cursor=None):
        query = "SELECT * FROM transactions WHERE user_id = %s"
        params = [user_id]
        if search_query:
            query += " AND (description LIKE %s OR category LIKE %s)"
            params.extend([f"%{search_query}%", f"%{search_query}%"])
        query += " ORDER BY date DESC LIMIT %s"
        params.append(limit)
        
        if cursor:
            cursor.execute(query, tuple(params))
            return cursor.fetchall()
        with db_cursor(dictionary=True) as (_, cursor):
            cursor.execute(query, tuple(params))
            return cursor.fetchall()

    @staticmethod
    def create(user_id, data, cursor=None):
        query = """
            INSERT INTO transactions (user_id, type, amount, category, description, date, method)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        params = (
            user_id, data['type'], data['amount'], data['category'],
            data.get('description'), data['date'], data.get('method', 'Cash')
        )
        if cursor:
            cursor.execute(query, params)
            return cursor.lastrowid
        with db_cursor() as (conn, cursor):
            cursor.execute(query, params)
            transaction_id = cursor.lastrowid
            conn.commit()
            return transaction_id

    @staticmethod
    def update(user_id, transaction_id, data, cursor=None):
        query = """
            UPDATE transactions
            SET type=%s, amount=%s, category=%s, description=%s, date=%s, method=%s
            WHERE transaction_id=%s AND user_id=%s
        """
        params = (
            data['type'], data['amount'], data['category'], data.get('description'),
            data['date'], data.get('method', 'Cash'), transaction_id, user_id
        )
        if cursor:
            cursor.execute(query, params)
            return
        with db_cursor() as (conn, cursor):
            cursor.execute(query, params)
            conn.commit()

    @staticmethod
    def delete(user_id, transaction_id, cursor=None):
        query = "DELETE FROM transactions WHERE transaction_id=%s AND user_id=%s"
        if cursor:
            cursor.execute(query, (transaction_id, user_id))
            return cursor.rowcount
        with db_cursor() as (conn, cursor):
            cursor.execute(query, (transaction_id, user_id))
            rowcount = cursor.rowcount
            conn.commit()
            return rowcount

    @staticmethod
    def delete_by_goal_audit(user_id, goal_id, cursor=None):
        query = """
            DELETE FROM transactions
            WHERE user_id = %s AND type = 'expense' AND category = 'Savings' AND description LIKE %s
        """
        params = (user_id, f"[Goal#{goal_id}] %")
        if cursor:
            cursor.execute(query, params)
            return
        with db_cursor() as (conn, cursor):
            cursor.execute(query, params)
            conn.commit()

    @staticmethod
    def get_total_income(cursor, user_id):
        cursor.execute("SELECT COALESCE(SUM(amount), 0) AS total FROM transactions WHERE user_id = %s AND type = 'income'", (user_id,))
        row = cursor.fetchone()
        return row['total'] if row else 0

    @staticmethod
    def get_total_spent_in_category(cursor, user_id, category, start_date, end_date):
        cursor.execute(
            """
            SELECT COALESCE(SUM(amount), 0) AS total
            FROM transactions
            WHERE user_id = %s
              AND category = %s
              AND type = 'expense'
              AND date >= %s
              AND date < %s
            """,
            (user_id, category, start_date, end_date)
        )
        row = cursor.fetchone()
        return row['total'] if row else 0
