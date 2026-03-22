from app.core.db import db_cursor
from app.repositories.user_repository import UserRepository
from app.repositories.transaction_repository import TransactionRepository
from app.repositories.goal_repository import GoalRepository
from app.repositories.budget_repository import BudgetRepository
from app.repositories.notification_repository import NotificationRepository
from app.repositories.category_repository import CategoryRepository

def update_settings(user_id, data):
    with db_cursor() as (conn, cursor):
        if not UserRepository.get_by_id(user_id, cursor=cursor):
            raise ValueError("User not found")
        
        UserRepository.update_settings(user_id, data, cursor=cursor)
        conn.commit()

def clear_user_financial_data(user_id):
    with db_cursor() as (conn, cursor):
        if not UserRepository.get_by_id(user_id, cursor=cursor):
            raise ValueError("User not found")
        
        # Using repositories to delete data
        # TransactionRepository.delete_all_by_user(user_id, cursor=cursor) # Add this if needed
        # Or just use raw SQL for "clear all" if no bulk delete in repo yet.
        # For bulk delete, it's often better to have it in repo.
        
        cursor.execute("DELETE FROM transactions WHERE user_id = %s", (user_id,))
        cursor.execute("DELETE FROM savings_goals WHERE user_id = %s", (user_id,))
        cursor.execute("DELETE FROM budgets WHERE user_id = %s", (user_id,))
        cursor.execute("DELETE FROM notifications WHERE user_id = %s", (user_id,))
        cursor.execute("DELETE FROM categories WHERE user_id = %s", (user_id,))
        conn.commit()
