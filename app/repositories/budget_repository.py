from app.core.db import db_cursor
from decimal import Decimal

class BudgetRepository:
    @staticmethod
    def get_by_category_and_month(user_id, category, month_str, cursor=None):
        query = "SELECT * FROM budgets WHERE user_id = %s AND category = %s AND month = %s"
        params = (user_id, category, month_str)
        if cursor:
            cursor.execute(query, params)
            return cursor.fetchone()
        with db_cursor(dictionary=True) as (_, cursor):
            cursor.execute(query, params)
            return cursor.fetchone()

    @staticmethod
    def get_all_by_user(user_id, month_str=None, cursor=None):
        query = "SELECT * FROM budgets WHERE user_id = %s"
        params = [user_id]
        if month_str:
            query += " AND month = %s"
            params.append(month_str)
        
        if cursor:
            cursor.execute(query, tuple(params))
            return cursor.fetchall()
        with db_cursor(dictionary=True) as (_, cursor):
            cursor.execute(query, tuple(params))
            return cursor.fetchall()

    @staticmethod
    def create_or_update(user_id, data, cursor=None):
        query = """
            INSERT INTO budgets (user_id, category, amount, month)
            VALUES (%s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                amount = VALUES(amount),
                budget_id = LAST_INSERT_ID(budget_id)
        """
        params = (user_id, data['category'], data['amount'], data['month'])
        if cursor:
            cursor.execute(query, params)
            inserted = cursor.rowcount == 1
            return cursor.lastrowid, inserted
        with db_cursor() as (conn, cursor):
            cursor.execute(query, params)
            inserted = cursor.rowcount == 1
            bid = cursor.lastrowid
            conn.commit()
            return bid, inserted

    @staticmethod
    def delete(user_id, budget_id):
        with db_cursor() as (conn, cursor):
            cursor.execute("DELETE FROM budgets WHERE budget_id = %s AND user_id = %s", (budget_id, user_id))
            conn.commit()

    @staticmethod
    def get_budget_amount(cursor, user_id, category, month_str):
        cursor.execute(
            "SELECT amount FROM budgets WHERE user_id = %s AND category = %s AND month = %s",
            (user_id, category, month_str)
        )
        row = cursor.fetchone()
        return Decimal(str(row[0])) if row else None
