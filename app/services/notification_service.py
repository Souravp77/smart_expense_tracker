from datetime import datetime
from app.core.db import db_cursor

class NotificationService:

    @staticmethod
    def create_notification(user_id, notif_type, title, message, action_url=None, conn=None, cursor=None):
        """Creates a new notification for a user."""
        if cursor is not None:
            # If a cursor is provided, we use the existing transaction context
            cursor.execute(
                """
                INSERT INTO notifications (user_id, type, title, message, action_url)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (user_id, notif_type, title, message, action_url)
            )
            return True

        with db_cursor() as (local_conn, local_cursor):
            local_cursor.execute(
                """
                INSERT INTO notifications (user_id, type, title, message, action_url)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (user_id, notif_type, title, message, action_url)
            )
            local_conn.commit()
            return True

    @staticmethod
    def get_unread_notifications(user_id, limit=10):
        """Gets unread notifications for a user."""
        with db_cursor(dictionary=True) as (_, cursor):
            cursor.execute(
                """
                SELECT notification_id, type, title, message, is_read, action_url, created_at
                FROM notifications
                WHERE user_id = %s AND is_read = FALSE
                ORDER BY created_at DESC
                LIMIT %s
                """,
                (user_id, limit)
            )
            notifications = cursor.fetchall()
            for n in notifications:
                if isinstance(n['created_at'], datetime):
                    n['created_at'] = n['created_at'].isoformat()
            return notifications

    @staticmethod
    def get_all_notifications(user_id, limit=50):
        """Gets recent notifications for a user, read or unread."""
        with db_cursor(dictionary=True) as (_, cursor):
            cursor.execute(
                """
                SELECT notification_id, type, title, message, is_read, action_url, created_at
                FROM notifications
                WHERE user_id = %s
                ORDER BY created_at DESC
                LIMIT %s
                """,
                (user_id, limit)
            )
            notifications = cursor.fetchall()
            for n in notifications:
                if isinstance(n['created_at'], datetime):
                    n['created_at'] = n['created_at'].isoformat()
            return notifications

    @staticmethod
    def get_unread_count(user_id):
        """Gets the total number of unread notifications for a user."""
        with db_cursor() as (_, cursor):
            cursor.execute(
                "SELECT COUNT(*) FROM notifications WHERE user_id = %s AND is_read = FALSE",
                (user_id,)
            )
            result = cursor.fetchone()
            return result[0] if result else 0

    @staticmethod
    def mark_as_read(user_id, notification_id):
        """Marks a specific notification as read."""
        with db_cursor() as (conn, cursor):
            cursor.execute(
                "UPDATE notifications SET is_read = TRUE WHERE user_id = %s AND notification_id = %s",
                (user_id, notification_id)
            )
            affected = cursor.rowcount
            conn.commit()
            return affected > 0

    @staticmethod
    def mark_all_as_read(user_id):
        """Marks all unread notifications as read for a user."""
        with db_cursor() as (conn, cursor):
            cursor.execute(
                "UPDATE notifications SET is_read = TRUE WHERE user_id = %s AND is_read = FALSE",
                (user_id,)
            )
            affected = cursor.rowcount
            conn.commit()
            return affected
