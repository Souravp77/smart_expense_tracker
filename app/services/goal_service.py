from app.core.db import db_cursor
from app.services.errors import ResourceNotFoundError


def _assert_savings_within_income(cursor, user_id, new_current_amount, exclude_goal_id=None):
    cursor.execute(
        """
        SELECT COALESCE(SUM(amount), 0)
        FROM transactions
        WHERE user_id = %s AND type = 'income'
        """,
        (user_id,)
    )
    total_income = float(cursor.fetchone()[0] or 0)

    if exclude_goal_id is None:
        cursor.execute(
            "SELECT COALESCE(SUM(current_amount), 0) FROM savings_goals WHERE user_id = %s",
            (user_id,)
        )
    else:
        cursor.execute(
            """
            SELECT COALESCE(SUM(current_amount), 0)
            FROM savings_goals
            WHERE user_id = %s AND goal_id <> %s
            """,
            (user_id, exclude_goal_id)
        )

    existing_allocations = float(cursor.fetchone()[0] or 0)
    next_total_allocations = existing_allocations + float(new_current_amount or 0)

    if next_total_allocations > total_income:
        raise ValueError("Allocated savings cannot exceed total income")


def add_goal(user_id, data):
    with db_cursor() as (conn, cursor):
        _assert_savings_within_income(cursor, user_id, data.get('current', 0))
        cursor.execute(
            """
            INSERT INTO savings_goals (user_id, name, target_amount, current_amount, color, deadline)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (
                user_id,
                data['name'],
                data['target'],
                data['current'],
                data.get('color', 'bg-blue-500'),
                data.get('deadline')
            )
        )
        conn.commit()
        return cursor.lastrowid


def update_goal(user_id, goal_id, data):
    from datetime import date
    with db_cursor() as (conn, cursor):
        # Fetch current state to see if amount increased
        cursor.execute("SELECT current_amount, name FROM savings_goals WHERE goal_id=%s AND user_id=%s", (goal_id, user_id))
        row = cursor.fetchone()
        if not row:
            raise ResourceNotFoundError("Goal not found")
        
        old_amount = float(row[0] or 0)
        new_amount = float(data.get('current', 0))
        
        _assert_savings_within_income(cursor, user_id, new_amount, exclude_goal_id=goal_id)
        
        cursor.execute(
            """
            UPDATE savings_goals
            SET name=%s, target_amount=%s, current_amount=%s, color=%s, deadline=%s
            WHERE goal_id=%s AND user_id=%s
            """,
            (
                data['name'],
                data['target'],
                data['current'],
                data.get('color', 'bg-blue-500'),
                data.get('deadline'),
                goal_id,
                user_id
            )
        )

        # Create audit transaction if funded
        if new_amount > old_amount:
            cursor.execute(
                """
                INSERT INTO transactions (user_id, type, amount, category, description, date)
                VALUES (%s, 'expense', %s, 'Savings', %s, %s)
                """,
                (
                    user_id,
                    new_amount - old_amount,
                    f"Funded goal: {row[1]}",
                    date.today().isoformat()
                )
            )

        conn.commit()



def delete_goal(user_id, goal_id):
    with db_cursor() as (conn, cursor):
        cursor.execute("DELETE FROM savings_goals WHERE goal_id=%s AND user_id=%s", (goal_id, user_id))
        if cursor.rowcount == 0:
            raise ResourceNotFoundError("Goal not found")
        conn.commit()
