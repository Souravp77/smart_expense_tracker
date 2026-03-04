from app.core.db import db_cursor
from app.services.errors import ResourceNotFoundError


def _lock_user_row(cursor, user_id):
    cursor.execute("SELECT user_id FROM users WHERE user_id = %s FOR UPDATE", (user_id,))
    if not cursor.fetchone():
        raise ResourceNotFoundError("User not found")


def _ensure_budget_category_exists(cursor, user_id, category_name):
    cursor.execute(
        """
        SELECT category_id
        FROM categories
        WHERE type = 'expense' AND name = %s AND (user_id IS NULL OR user_id = %s)
        LIMIT 1
        """,
        (category_name, user_id)
    )
    if cursor.fetchone():
        return

    cursor.execute(
        """
        INSERT INTO categories (user_id, name, type)
        VALUES (%s, %s, 'expense')
        """,
        (user_id, category_name)
    )


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
        _lock_user_row(cursor, user_id)
        _ensure_budget_category_exists(cursor, user_id, data['category'])

        cursor.execute(
            """
            INSERT INTO budgets (user_id, category, amount, month)
            VALUES (%s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                amount = VALUES(amount),
                budget_id = LAST_INSERT_ID(budget_id)
            """,
            (user_id, data['category'], data['amount'], data['month'])
        )
        inserted = cursor.rowcount == 1
        conn.commit()
        return cursor.lastrowid, inserted


def delete_budget(user_id, budget_id):
    with db_cursor() as (conn, cursor):
        _lock_user_row(cursor, user_id)
        cursor.execute(
            "DELETE FROM budgets WHERE budget_id = %s AND user_id = %s",
            (budget_id, user_id)
        )
        if cursor.rowcount == 0:
            raise ResourceNotFoundError("Budget not found")
        conn.commit()
