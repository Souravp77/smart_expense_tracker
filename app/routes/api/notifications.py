from flask_login import current_user, login_required

from app.routes.api import api_bp
from app.routes.api.responses import not_found, ok, server_error
from app.services.notification_service import NotificationService

@api_bp.route('/notifications', methods=['GET'])
@login_required
def get_notifications():
    """Get all unread notifications for a user."""
    try:
        notifications = NotificationService.get_unread_notifications(current_user.id)
        unread_count = NotificationService.get_unread_count(current_user.id)
        # Keep both legacy and normalized keys for API compatibility.
        return ok({
            'status': 'success',
            'notifications': notifications,
            'unreadCount': unread_count,
            'data': {
                'notifications': notifications,
                'unread_count': unread_count
            }
        })
    except Exception as error:
        return server_error(error)

@api_bp.route('/notifications/read/<int:notification_id>', methods=['POST'])
@login_required
def mark_read(notification_id):
    """Mark a specific notification as read."""
    try:
        success = NotificationService.mark_as_read(current_user.id, notification_id)
        if success:
            return ok({'status': 'success'})
        return not_found('Notification not found or already read')
    except Exception as error:
        return server_error(error)

@api_bp.route('/notifications/read-all', methods=['POST'])
@login_required
def mark_all_read():
    """Mark all notifications as read for a user."""
    try:
        updated = NotificationService.mark_all_as_read(current_user.id)
        return ok({'status': 'success', 'updated': updated})
    except Exception as error:
        return server_error(error)
