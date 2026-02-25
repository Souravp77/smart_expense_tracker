from app.core.db import db_cursor
from app.services.errors import ResourceNotFoundError


def list_budgets(user_id):
    with db_cursor(dictionary=True) as (_, cursor):
        cursor.execute(
            """
            SELECT budget_id, category, amount, month
            FROM budgets
            WHERE user_id = %s
            ORDER BY month DESC, category ASC
            """,
            (user_id,)
        )
        rows = cursor.fetchall()
        for row in rows:
            row['id'] = row['budget_id']
        return rows


def save_budget(user_id, data):
    with db_cursor() as (conn, cursor):
        cursor.execute(
            """
            SELECT budget_id
            FROM budgets
            WHERE user_id = %s AND category = %s AND month = %s
            """,
            (user_id, data['category'], data['month'])
        )
        existing = cursor.fetchone()

        if existing:
            cursor.execute(
                """
                UPDATE budgets
                SET amount = %s
                WHERE budget_id = %s AND user_id = %s
                """,
                (data['amount'], existing[0], user_id)
            )
            conn.commit()
            return existing[0], False

        cursor.execute(
            """
            INSERT INTO budgets (user_id, category, amount, month)
            VALUES (%s, %s, %s, %s)
            """,
            (user_id, data['category'], data['amount'], data['month'])
        )
        conn.commit()
        return cursor.lastrowid, True
def delete_budget(user_id, budget_id):
    with db_cursor() as (conn, cursor):
        cursor.execute(
            "DELETE FROM budgets WHERE budget_id = %s AND user_id = %s",
            (budget_id, user_id)
        )
        if cursor.rowcount == 0:
            raise ResourceNotFoundError("Budget not found")
        conn.commit()
