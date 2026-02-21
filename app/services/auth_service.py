from app.models.user import User


def get_user_by_email(email):
    return User.find_by_email(email)


def register_user(username, email, password_hash):
    return User.create(username, email, password_hash)
