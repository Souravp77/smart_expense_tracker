from app.core.db import db_cursor
from app.services.errors import ResourceNotFoundError
from app.services.notification_service import NotificationService
from app.repositories.user_repository import UserRepository
from app.repositories.transaction_repository import TransactionRepository
from app.repositories.budget_repository import BudgetRepository
from app.repositories.category_repository import CategoryRepository
from datetime import date as dt_date
from decimal import Decimal

ZERO_MONEY = Decimal('0.00')
WARNING_THRESHOLD = Decimal('0.8')

def _to_decimal(value):
    if isinstance(value, Decimal):
        return value
    if value in (None, ''):
        return ZERO_MONEY
    return Decimal(str(value))

def _is_system_goal_audit_tx(tx_type, category, description):
    return (
        tx_type == 'expense'
        and category == 'Savings'
        and str(description or '').startswith('[Goal#')
    )

def _check_budget_and_notify(user_id, category, tx_date, cursor=None):
    user = UserRepository.get_by_id(user_id, cursor=cursor)
    if not user or not user.notify_budget_alerts:
        return

    if isinstance(tx_date, str):
        tx_date = dt_date.fromisoformat(tx_date)
    month_str = tx_date.strftime('%Y-%m')
    month_start = tx_date.replace(day=1)
    if month_start.month == 12:
        month_end = month_start.replace(year=month_start.year + 1, month=1)
    else:
        month_end = month_start.replace(month=month_start.month + 1)
    
    budget_row = BudgetRepository.get_by_category_and_month(user_id, category, month_str, cursor=cursor)
    if not budget_row:
        return
    budget_limit = _to_decimal(budget_row['amount'])
    
    spent = TransactionRepository.get_total_spent_in_category(cursor, user_id, category, month_start, month_end)
    
    if spent >= budget_limit:
        msg = f"You have exceeded your {month_str} budget for {category} by {spent - budget_limit:.2f}." if spent > budget_limit else f"You have reached your {month_str} budget limit for {category}."
        title = f"Budget Reached: {category} ({month_str})"
        NotificationService.create_notification(user_id, 'budget_alert', title, msg, '/budget', cursor=cursor)
    elif spent >= budget_limit * WARNING_THRESHOLD:
        msg = f"You have spent {(spent/budget_limit)*100:.0f}% of your {month_str} budget for {category}."
        title = f"Budget Warning: {category} ({month_str})"
        NotificationService.create_notification(user_id, 'budget_alert', title, msg, '/budget', cursor=cursor)

def add_transaction(user_id, data):
    with db_cursor() as (conn, cursor):
        UserRepository.lock_row(cursor, user_id)
        if not CategoryRepository.get_by_name(user_id, data['type'], data['category'], cursor=cursor):
            CategoryRepository.create(user_id, data['type'], data['category'], cursor=cursor)
            
        transaction_id = TransactionRepository.create(user_id, data, cursor=cursor)

        if data['type'] == 'expense':
            _check_budget_and_notify(user_id, data['category'], data['date'], cursor=cursor)

        conn.commit()
        return transaction_id

def update_transaction(user_id, transaction_id, data):
    with db_cursor() as (conn, cursor):
        UserRepository.lock_row(cursor, user_id)
        previous = TransactionRepository.get_by_id(user_id, transaction_id, cursor=cursor)
        if not previous:
            raise ResourceNotFoundError("Transaction not found")

        if _is_system_goal_audit_tx(previous['type'], previous['category'], previous['description']):
            raise ValueError("System-generated goal funding transactions cannot be edited")

        if previous['type'] == 'income' or data['type'] == 'income':
            total_income = TransactionRepository.get_total_income(cursor, user_id)
            projected_total_income = total_income
            if previous['type'] == 'income':
                projected_total_income -= _to_decimal(previous['amount'])
            if data['type'] == 'income':
                projected_total_income += _to_decimal(data['amount'])
            
            # Use goal repository helper for invariant check
            from app.repositories.goal_repository import GoalRepository
            allocated_savings = GoalRepository.get_total_allocations(cursor, user_id)
            if projected_total_income < allocated_savings:
                raise ValueError("Cannot reduce income below allocated savings")

        if not CategoryRepository.get_by_name(user_id, data['type'], data['category'], cursor=cursor):
            CategoryRepository.create(user_id, data['type'], data['category'], cursor=cursor)
            
        TransactionRepository.update(user_id, transaction_id, data, cursor=cursor)
        
        if data['type'] == 'expense':
            _check_budget_and_notify(user_id, data['category'], data['date'], cursor=cursor)
            
        conn.commit()

def delete_transaction(user_id, transaction_id):
    with db_cursor() as (conn, cursor):
        UserRepository.lock_row(cursor, user_id)
        row = TransactionRepository.get_by_id(user_id, transaction_id, cursor=cursor)
        if not row:
            raise ResourceNotFoundError("Transaction not found")

        if _is_system_goal_audit_tx(row['type'], row['category'], row['description']):
            raise ValueError("System-generated goal funding transactions cannot be deleted")

        if row['type'] == 'income':
            total_income = TransactionRepository.get_total_income(cursor, user_id)
            from app.repositories.goal_repository import GoalRepository
            allocated_savings = GoalRepository.get_total_allocations(cursor, user_id)
            if total_income - _to_decimal(row['amount']) < allocated_savings:
                raise ValueError("Cannot reduce income below allocated savings")

        TransactionRepository.delete(user_id, transaction_id, cursor=cursor)
        conn.commit()

def get_transactions(user_id, search_query=None, limit=1000):
    transactions = TransactionRepository.get_all_by_user(user_id, search_query, limit)
    for tx in transactions:
        tx['id'] = tx['transaction_id']
        tx['date'] = tx['date'].isoformat()
        if tx.get('created_at'):
            tx['created_at'] = tx['created_at'].isoformat()
    return transactions
