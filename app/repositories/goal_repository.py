from app.core.db import db_cursor
from decimal import Decimal

class GoalRepository:
    @staticmethod
    def get_by_id(user_id, goal_id, cursor=None):
        query = "SELECT * FROM savings_goals WHERE goal_id = %s AND user_id = %s"
        params = (goal_id, user_id)
        if cursor:
            cursor.execute(query, params)
            return cursor.fetchone()
        with db_cursor(dictionary=True) as (_, cursor):
            cursor.execute(query, params)
            return cursor.fetchone()

    @staticmethod
    def get_all_by_user(user_id, cursor=None):
        query = "SELECT * FROM savings_goals WHERE user_id = %s"
        if cursor:
            cursor.execute(query, (user_id,))
            return cursor.fetchall()
        with db_cursor(dictionary=True) as (_, cursor):
            cursor.execute(query, (user_id,))
            return cursor.fetchall()

    @staticmethod
    def create(user_id, data, cursor=None):
        query = """
            INSERT INTO savings_goals (user_id, name, target_amount, current_amount, color, icon, priority, deadline)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        params = (
            user_id, data['name'], data['target'], data['current'],
            data.get('color', 'bg-blue-500'), data.get('icon', 'fa-bullseye'),
            data.get('priority', 'medium'), data.get('deadline')
        )
        if cursor:
            cursor.execute(query, params)
            return cursor.lastrowid
        with db_cursor() as (conn, cursor):
            cursor.execute(query, params)
            goal_id = cursor.lastrowid
            conn.commit()
            return goal_id

    @staticmethod
    def update(user_id, goal_id, data, cursor=None):
        query = """
            UPDATE savings_goals 
            SET name = %s, target_amount = %s, current_amount = %s, color = %s, icon = %s, priority = %s, deadline = %s
            WHERE goal_id = %s AND user_id = %s
        """
        params = (
            data['name'], data['target'], data['current'], data['color'],
            data.get('icon', 'fa-bullseye'), data.get('priority', 'medium'),
            data.get('deadline'), goal_id, user_id
        )
        if cursor:
            cursor.execute(query, params)
            return
        with db_cursor() as (conn, cursor):
            cursor.execute(query, params)
            conn.commit()

    @staticmethod
    def delete(user_id, goal_id, cursor=None):
        query = "DELETE FROM savings_goals WHERE goal_id = %s AND user_id = %s"
        if cursor:
            cursor.execute(query, (goal_id, user_id))
            return cursor.rowcount
        with db_cursor() as (conn, cursor):
            cursor.execute(query, (goal_id, user_id))
            rowcount = cursor.rowcount
            conn.commit()
            return rowcount

    @staticmethod
    def get_total_allocations(cursor, user_id, exclude_goal_id=None):
        if exclude_goal_id is None:
            cursor.execute(
                "SELECT COALESCE(SUM(current_amount), 0) AS total FROM savings_goals WHERE user_id = %s",
                (user_id,)
            )
        else:
            cursor.execute(
                """
                SELECT COALESCE(SUM(current_amount), 0) AS total
                FROM savings_goals
                WHERE user_id = %s AND goal_id <> %s
                """,
                (user_id, exclude_goal_id)
            )
        row = cursor.fetchone()
        return Decimal(str(row['total'] if row else 0))
