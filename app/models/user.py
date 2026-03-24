from flask_login import UserMixin

from app.core.extensions import login_manager

class User(UserMixin):
    def __init__(self, id, username, email, password_hash, currency='INR', notify_budget_alerts=True, notify_goal_milestones=True):
        self.id = id
        self.username = username
        self.email = email
        self.password_hash = password_hash
        self.currency = currency or 'INR'
        self.notify_budget_alerts = bool(notify_budget_alerts if notify_budget_alerts is not None else True)
        self.notify_goal_milestones = bool(notify_goal_milestones if notify_goal_milestones is not None else True)

@login_manager.user_loader
def load_user(user_id):
    from app.repositories.user_repository import UserRepository
    return UserRepository.get_by_id(user_id)
