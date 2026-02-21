from app.core.db import db_cursor


def add_goal(user_id, data):
    with db_cursor() as (conn, cursor):
        cursor.execute(
            """
            INSERT INTO savings_goals (user_id, name, target_amount, current_amount, color)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                user_id,
                data['name'],
                data['target'],
                data['current'],
                data.get('color', 'bg-blue-500')
            )
        )
        conn.commit()
        return cursor.lastrowid


def update_goal(user_id, goal_id, data):
    with db_cursor() as (conn, cursor):
        cursor.execute(
            """
            UPDATE savings_goals
            SET name=%s, target_amount=%s, current_amount=%s, color=%s
            WHERE goal_id=%s AND user_id=%s
            """,
            (
                data['name'],
                data['target'],
                data['current'],
                data.get('color', 'bg-blue-500'),
                goal_id,
                user_id
            )
        )
        conn.commit()


def delete_goal(user_id, goal_id):
    with db_cursor() as (conn, cursor):
        cursor.execute("DELETE FROM savings_goals WHERE goal_id=%s AND user_id=%s", (goal_id, user_id))
        conn.commit()
