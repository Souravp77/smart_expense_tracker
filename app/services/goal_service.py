from app.core.db import db_cursor
from app.services.errors import ResourceNotFoundError
from app.services.notification_service import NotificationService


def _lock_user_row(cursor, user_id):
    cursor.execute("SELECT user_id FROM users WHERE user_id = %s FOR UPDATE", (user_id,))
    if not cursor.fetchone():
        raise ResourceNotFoundError("User not found")


def _assert_savings_within_income(cursor, user_id, new_current_amount, exclude_goal_id=None):
    _lock_user_row(cursor, user_id)
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
    from datetime import date
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
        goal_id = cursor.lastrowid

        # Keep goal-funding audit trail consistent for initial allocations too.
        if float(data.get('current', 0) or 0) > 0:
            cursor.execute(
                """
                INSERT INTO transactions (user_id, type, amount, category, description, date)
                VALUES (%s, 'expense', %s, 'Savings', %s, %s)
                """,
                (
                    user_id,
                    float(data['current']),
                    f"[Goal#{goal_id}] Funded goal",
                    date.today().isoformat()
                )
            )
        
        # Check milestone for new goal
        if float(data.get('current', 0)) >= float(data['target']):
            cursor.execute("SELECT notify_goal_milestones FROM users WHERE user_id = %s", (user_id,))
            row = cursor.fetchone()
            if row and row[0]:
                msg = f"Congratulations! You've achieved your goal: {data['name']}!"
                NotificationService.create_notification(
                    user_id,
                    'goal_milestone',
                    'Goal Achieved \U0001F389',
                    msg,
                    '/savings',
                    conn=conn,
                    cursor=cursor
                )

        conn.commit()
        return goal_id


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
                    f"[Goal#{goal_id}] Funded goal",
                    date.today().isoformat()
                )
            )

        # Check milestone for updated goal
        if new_amount >= float(data['target']) and old_amount < float(data['target']):
            cursor.execute("SELECT notify_goal_milestones FROM users WHERE user_id = %s", (user_id,))
            user_row = cursor.fetchone()
            if user_row and user_row[0]:
                msg = f"Congratulations! You've achieved your goal: {data['name']}!"
                NotificationService.create_notification(
                    user_id,
                    'goal_milestone',
                    'Goal Achieved \U0001F389',
                    msg,
                    '/savings',
                    conn=conn,
                    cursor=cursor
                )

        conn.commit()



def delete_goal(user_id, goal_id):
    with db_cursor() as (conn, cursor):
        _lock_user_row(cursor, user_id)
        cursor.execute("DELETE FROM savings_goals WHERE goal_id=%s AND user_id=%s", (goal_id, user_id))
        if cursor.rowcount == 0:
            raise ResourceNotFoundError("Goal not found")

        # Remove auditable savings transfers tied to this goal id.
        cursor.execute(
            """
            DELETE FROM transactions
            WHERE user_id = %s
              AND type = 'expense'
              AND category = 'Savings'
              AND description LIKE %s
            """,
            (user_id, f"[Goal#{goal_id}] %")
        )
        conn.commit()
