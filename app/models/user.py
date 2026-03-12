from flask_login import UserMixin

from app.core.db import db_cursor
from app.core.extensions import login_manager

class User(UserMixin):
    def __init__(self, id, username, email, password_hash, currency='INR'):
        self.id = id
        self.username = username
        self.email = email
        self.password_hash = password_hash
        self.currency = currency or 'INR'

    @staticmethod
    def get(user_id):
        with db_cursor(dictionary=True) as (_, cursor):
            cursor.execute("SELECT * FROM users WHERE user_id = %s", (user_id,))
            user_data = cursor.fetchone()
        if user_data:
            return User(
                id=user_data['user_id'],
                username=user_data['username'],
                email=user_data['email'],
                password_hash=user_data['password_hash'],
                currency=user_data.get('currency', 'INR')
            )
        return None

    @staticmethod
    def find_by_email(email):
        with db_cursor(dictionary=True) as (_, cursor):
            cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
            user_data = cursor.fetchone()
        
        if user_data:
            return User(
                id=user_data['user_id'],
                username=user_data['username'],
                email=user_data['email'],
                password_hash=user_data['password_hash'],
                currency=user_data.get('currency', 'INR')
            )
        return None

    @staticmethod
    def create(username, email, password_hash, currency='INR'):
        from flask import current_app
        try:
            with db_cursor() as (conn, cursor):
                cursor.execute(
                    "INSERT INTO users (username, email, password_hash, currency) VALUES (%s, %s, %s, %s)",
                    (username, email, password_hash, currency)
                )
                conn.commit()
                return cursor.lastrowid
        except Exception as e:
            current_app.logger.error(f"Error creating user: {e}")
            return None

@login_manager.user_loader
def load_user(user_id):
    return User.get(user_id)
