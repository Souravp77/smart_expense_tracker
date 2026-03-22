from app.core.db import db_cursor

class NotificationRepository:
    @staticmethod
    def get_all_by_user(user_id, limit=100):
        with db_cursor(dictionary=True) as (_, cursor):
            cursor.execute(
                "SELECT * FROM notifications WHERE user_id = %s ORDER BY created_at DESC LIMIT %s",
                (user_id, limit)
            )
            return cursor.fetchall()

    @staticmethod
    def create(user_id, n_type, title, message, action_url=None, cursor=None):
        query = "INSERT INTO notifications (user_id, type, title, message, action_url) VALUES (%s, %s, %s, %s, %s)"
        params = (user_id, n_type, title, message, action_url)
        if cursor:
            cursor.execute(query, params)
            return cursor.lastrowid
        with db_cursor() as (conn, cursor):
            cursor.execute(query, params)
            conn.commit()
            return cursor.lastrowid

    @staticmethod
    def mark_read(user_id, notification_id, cursor=None):
        query = "UPDATE notifications SET is_read = 1 WHERE notification_id = %s AND user_id = %s"
        if cursor:
            cursor.execute(query, (notification_id, user_id))
            return
        with db_cursor() as (conn, cursor):
            cursor.execute(query, (notification_id, user_id))
            conn.commit()

    @staticmethod
    def mark_all_read(user_id, cursor=None):
        query = "UPDATE notifications SET is_read = 1 WHERE user_id = %s"
        if cursor:
            cursor.execute(query, (user_id,))
            return
        with db_cursor() as (conn, cursor):
            cursor.execute(query, (user_id,))
            conn.commit()

    @staticmethod
    def delete_all_by_user(user_id, cursor=None):
        query = "DELETE FROM notifications WHERE user_id = %s"
        if cursor:
            cursor.execute(query, (user_id,))
            return
        with db_cursor() as (conn, cursor):
            cursor.execute(query, (user_id,))
            conn.commit()
