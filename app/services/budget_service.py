from app.core.db import db_cursor
from app.services.errors import ResourceNotFoundError
from app.repositories.user_repository import UserRepository
from app.repositories.category_repository import CategoryRepository
from app.repositories.budget_repository import BudgetRepository

def list_budgets(user_id):
    return BudgetRepository.get_all_by_user(user_id)

def save_budget(user_id, data):
    with db_cursor() as (conn, cursor):
        UserRepository.lock_row(cursor, user_id)
        if not CategoryRepository.get_by_name(user_id, 'expense', data['category'], cursor=cursor):
            CategoryRepository.create(user_id, 'expense', data['category'], cursor=cursor)

        budget_id, inserted = BudgetRepository.create_or_update(user_id, data, cursor=cursor)
        conn.commit()
        return budget_id, inserted

def delete_budget(user_id, budget_id):
    with db_cursor() as (conn, cursor):
        UserRepository.lock_row(cursor, user_id)
        if BudgetRepository.delete(user_id, budget_id, cursor=cursor) == 0:
            raise ResourceNotFoundError("Budget not found")
        conn.commit()
