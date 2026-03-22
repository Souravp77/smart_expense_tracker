from datetime import datetime
from app.repositories.notification_repository import NotificationRepository

class NotificationService:
    @staticmethod
    def create_notification(user_id, notif_type, title, message, action_url=None, cursor=None):
        return NotificationRepository.create(user_id, notif_type, title, message, action_url, cursor=cursor)

    @staticmethod
    def get_unread_notifications(user_id, limit=10):
        # We can implement specific filtering in repo if needed
        all_n = NotificationRepository.get_all_by_user(user_id, limit=limit)
        unread = [n for n in all_n if not n['is_read']]
        for n in unread:
            if isinstance(n['created_at'], datetime):
                n['created_at'] = n['created_at'].isoformat()
        return unread

    @staticmethod
    def get_all_notifications(user_id, limit=50):
        notifications = NotificationRepository.get_all_by_user(user_id, limit=limit)
        for n in notifications:
            if isinstance(n['created_at'], datetime):
                n['created_at'] = n['created_at'].isoformat()
        return notifications

    @staticmethod
    def get_unread_count(user_id):
        all_n = NotificationRepository.get_all_by_user(user_id, limit=1000)
        return len([n for n in all_n if not n['is_read']])

    @staticmethod
    def mark_as_read(user_id, notification_id):
        NotificationRepository.mark_read(user_id, notification_id)
        return True

    @staticmethod
    def mark_all_as_read(user_id):
        NotificationRepository.mark_all_read(user_id)
        return True
