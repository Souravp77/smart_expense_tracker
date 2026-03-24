from app.core.db import db_cursor
from app.models.user import User

class UserRepository:
    @staticmethod
    def _row_to_user(row):
        if not row:
            return None
        return User(
            id=row['user_id'],
            username=row['username'],
            email=row['email'],
            password_hash=row['password_hash'],
            currency=row.get('currency', 'INR'),
            notify_budget_alerts=row.get('notify_budget_alerts', True),
            notify_goal_milestones=row.get('notify_goal_milestones', True)
        )

    @staticmethod
    def get_by_id(user_id, cursor=None):
        if cursor:
            # Assume cursor is already dictionary=True or handle accordingly
            # Given we use dictionary=True in db_cursor, we should keep it consistent.
            cursor.execute("SELECT * FROM users WHERE user_id = %s", (user_id,))
            return UserRepository._row_to_user(cursor.fetchone())
        with db_cursor(dictionary=True) as (_, cursor):
            cursor.execute("SELECT * FROM users WHERE user_id = %s", (user_id,))
            return UserRepository._row_to_user(cursor.fetchone())

    @staticmethod
    def get_by_email(email, cursor=None):
        if cursor:
            cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
            return UserRepository._row_to_user(cursor.fetchone())
        with db_cursor(dictionary=True) as (_, cursor):
            cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
            return UserRepository._row_to_user(cursor.fetchone())

    @staticmethod
    def create(username, email, password_hash, currency='INR', cursor=None):
        query = "INSERT INTO users (username, email, password_hash, currency) VALUES (%s, %s, %s, %s)"
        params = (username, email, password_hash, currency)
        if cursor:
            cursor.execute(query, params)
            return cursor.lastrowid
        with db_cursor() as (conn, cursor):
            cursor.execute(query, params)
            user_id = cursor.lastrowid
            conn.commit()
            return user_id

    @staticmethod
    def update_settings(user_id, settings, cursor=None):
        fields = []
        params = []
        for key, value in settings.items():
            fields.append(f"{key} = %s")
            params.append(value)
        if not fields: return
        params.append(user_id)
        query = f"UPDATE users SET {', '.join(fields)} WHERE user_id = %s"
        
        if cursor:
            cursor.execute(query, tuple(params))
            return
        with db_cursor() as (conn, cursor):
            cursor.execute(query, tuple(params))
            conn.commit()

    @staticmethod
    def lock_row(cursor, user_id):
        cursor.execute("SELECT user_id FROM users WHERE user_id = %s FOR UPDATE", (user_id,))
        row = cursor.fetchone()
        if not row:
            from app.services.errors import ResourceNotFoundError
            raise ResourceNotFoundError("User not found")
        # No need to return anything if just locking, or return the row
        return row
