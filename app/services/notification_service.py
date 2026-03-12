from datetime import datetime
from app.core.db import get_db_connection

class NotificationService:

    @staticmethod
    def create_notification(user_id, notif_type, title, message, action_url=None, conn=None, cursor=None):
        """Creates a new notification for a user."""
        owns_connection = conn is None
        owns_cursor = cursor is None
        local_conn = conn or get_db_connection()
        local_cursor = cursor
        try:
            if local_cursor is None:
                local_cursor = local_conn.cursor()

            local_cursor.execute(
                """
                INSERT INTO notifications (user_id, type, title, message, action_url)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (user_id, notif_type, title, message, action_url)
            )
            if owns_connection:
                local_conn.commit()
            return True
        except Exception:
            if owns_connection:
                local_conn.rollback()
            raise
        finally:
            if owns_cursor and local_cursor is not None:
                local_cursor.close()
            if owns_connection:
                local_conn.close()

    @staticmethod
    def get_unread_notifications(user_id, limit=10):
        """Gets unread notifications for a user."""
        conn = get_db_connection()
        try:
            with conn.cursor(dictionary=True) as cursor:
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
                # Format dates
                for n in notifications:
                    if isinstance(n['created_at'], datetime):
                        n['created_at'] = n['created_at'].isoformat()
                return notifications
        finally:
            conn.close()

    @staticmethod
    def get_all_notifications(user_id, limit=50):
        """Gets recent notifications for a user, read or unread."""
        conn = get_db_connection()
        try:
            with conn.cursor(dictionary=True) as cursor:
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
                # Format dates
                for n in notifications:
                    if isinstance(n['created_at'], datetime):
                        n['created_at'] = n['created_at'].isoformat()
                return notifications
        finally:
            conn.close()

    @staticmethod
    def get_unread_count(user_id):
        """Gets the total number of unread notifications for a user."""
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT COUNT(*) FROM notifications WHERE user_id = %s AND is_read = FALSE",
                    (user_id,)
                )
                result = cursor.fetchone()
                return result[0] if result else 0
        finally:
            conn.close()

    @staticmethod
    def mark_as_read(user_id, notification_id):
        """Marks a specific notification as read."""
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    "UPDATE notifications SET is_read = TRUE WHERE user_id = %s AND notification_id = %s",
                    (user_id, notification_id)
                )
                affected = cursor.rowcount
            conn.commit()
            return affected > 0
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    @staticmethod
    def mark_all_as_read(user_id):
        """Marks all unread notifications as read for a user."""
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    "UPDATE notifications SET is_read = TRUE WHERE user_id = %s AND is_read = FALSE",
                    (user_id,)
                )
                affected = cursor.rowcount
            conn.commit()
            return affected
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()
