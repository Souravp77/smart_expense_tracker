from app.core.db import db_cursor
from app.services.errors import ResourceNotFoundError
from app.services.notification_service import NotificationService
from decimal import Decimal


ZERO_MONEY = Decimal('0.00')


def _to_decimal(value):
    if isinstance(value, Decimal):
        return value
    if value in (None, ''):
        return ZERO_MONEY
    return Decimal(str(value))


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
    total_income = _to_decimal(cursor.fetchone()[0])

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

    existing_allocations = _to_decimal(cursor.fetchone()[0])
    next_total_allocations = existing_allocations + _to_decimal(new_current_amount)

    if next_total_allocations > total_income:
        raise ValueError("Allocated savings cannot exceed total income")


def add_goal(user_id, data):
    from datetime import date
    with db_cursor() as (conn, cursor):
        _assert_savings_within_income(cursor, user_id, data.get('current', 0))
        cursor.execute(
            """
            INSERT INTO savings_goals (user_id, name, target_amount, current_amount, color, icon, priority, deadline)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                user_id,
                data['name'],
                data['target'],
                data['current'],
                data.get('color', 'bg-blue-500'),
                data.get('icon', 'fa-bullseye'),
                data.get('priority', 'medium'),
                data.get('deadline')
            )
        )
        goal_id = cursor.lastrowid

        # Keep goal-funding audit trail consistent for initial allocations too.
        current_amount = _to_decimal(data.get('current', 0))
        if current_amount > ZERO_MONEY:
            cursor.execute(
                """
                INSERT INTO transactions (user_id, type, amount, category, description, date)
                VALUES (%s, 'expense', %s, 'Savings', %s, %s)
                """,
                (
                    user_id,
                    current_amount,
                    f"[Goal#{goal_id}] Funded goal",
                    date.today().isoformat()
                )
            )
        
        # Check milestones for new goal
        target_amount = _to_decimal(data['target'])
        if target_amount > ZERO_MONEY:
            progress = (current_amount / target_amount) * 100
            if progress >= 100:
                milestone_title = 'Goal Achieved \U0001F389'
                milestone_msg = f"Congratulations! You've achieved your goal: {data['name']}!"
            elif progress >= 75:
                milestone_title = 'Goal Milestone: 75% \U0001F680'
                milestone_msg = f"You are almost there! 75% of your goal '{data['name']}' is complete."
            elif progress >= 50:
                milestone_title = 'Goal Milestone: 50% \U0001F4AA'
                milestone_msg = f"Halfway there! You've reached 50% of your goal '{data['name']}'."
            elif progress >= 25:
                milestone_title = 'Goal Milestone: 25% \U0001F331'
                milestone_msg = f"Great start! You've reached 25% of your goal '{data['name']}'."
            else:
                milestone_title = None

            if milestone_title:
                cursor.execute("SELECT notify_goal_milestones FROM users WHERE user_id = %s", (user_id,))
                row = cursor.fetchone()
                if row and row[0]:
                    NotificationService.create_notification(
                        user_id,
                        'goal_milestone',
                        milestone_title,
                        milestone_msg,
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
        
        old_amount = _to_decimal(row[0])
        new_amount = _to_decimal(data.get('current', 0))
        
        _assert_savings_within_income(cursor, user_id, new_amount, exclude_goal_id=goal_id)
        
        cursor.execute(
            """
            UPDATE savings_goals
            SET name=%s, target_amount=%s, current_amount=%s, color=%s, icon=%s, priority=%s, deadline=%s
            WHERE goal_id=%s AND user_id=%s
            """,
            (
                data['name'],
                data['target'],
                data['current'],
                data.get('color', 'bg-blue-500'),
                data.get('icon', 'fa-bullseye'),
                data.get('priority', 'medium'),
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

        # Check milestones for updated goal
        target_amount = _to_decimal(data['target'])
        if target_amount > ZERO_MONEY:
            old_progress = (old_amount / target_amount) * 100
            new_progress = (new_amount / target_amount) * 100
            
            milestone_title = None
            milestone_msg = None
            
            if new_progress >= 100 and old_progress < 100:
                milestone_title = 'Goal Achieved \U0001F389'
                milestone_msg = f"Congratulations! You've achieved your goal: {data['name']}!"
            elif new_progress >= 75 and old_progress < 75:
                milestone_title = 'Goal Milestone: 75% \U0001F680'
                milestone_msg = f"You are almost there! 75% of your goal '{data['name']}' is complete."
            elif new_progress >= 50 and old_progress < 50:
                milestone_title = 'Goal Milestone: 50% \U0001F4AA'
                milestone_msg = f"Halfway there! You've reached 50% of your goal '{data['name']}'."
            elif new_progress >= 25 and old_progress < 25:
                milestone_title = 'Goal Milestone: 25% \U0001F331'
                milestone_msg = f"Great start! You've reached 25% of your goal '{data['name']}'."

            if milestone_title:
                cursor.execute("SELECT notify_goal_milestones FROM users WHERE user_id = %s", (user_id,))
                user_row = cursor.fetchone()
                if user_row and user_row[0]:
                    NotificationService.create_notification(
                        user_id,
                        'goal_milestone',
                        milestone_title,
                        milestone_msg,
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
