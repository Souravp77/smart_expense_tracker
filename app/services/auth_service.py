from app.repositories.user_repository import UserRepository

def get_user_by_email(email):
    return UserRepository.get_by_email(email)

def register_user(username, email, password_hash, currency='INR'):
    return UserRepository.create(username, email, password_hash, currency=currency)
