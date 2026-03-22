from app.core.db import db_cursor
from app.services.errors import ResourceNotFoundError
from app.services.notification_service import NotificationService
from app.repositories.goal_repository import GoalRepository
from app.repositories.transaction_repository import TransactionRepository
from app.repositories.user_repository import UserRepository
from decimal import Decimal
from datetime import date

ZERO_MONEY = Decimal('0.00')

def _to_decimal(value):
    if isinstance(value, Decimal):
        return value
    if value in (None, ''):
        return ZERO_MONEY
    return Decimal(str(value))

def _assert_savings_within_income(cursor, user_id, new_current_amount, exclude_goal_id=None):
    UserRepository.lock_row(cursor, user_id)
    total_income = TransactionRepository.get_total_income(cursor, user_id)
    existing_allocations = GoalRepository.get_total_allocations(cursor, user_id, exclude_goal_id)
    
    if existing_allocations + _to_decimal(new_current_amount) > total_income:
        raise ValueError("Allocated savings cannot exceed total income")

def add_goal(user_id, data):
    with db_cursor() as (conn, cursor):
        _assert_savings_within_income(cursor, user_id, data.get('current', 0))
        goal_id = GoalRepository.create(user_id, data, cursor=cursor)

        current_amount = _to_decimal(data.get('current', 0))
        if current_amount > ZERO_MONEY:
            TransactionRepository.create(user_id, {
                'type': 'expense',
                'amount': current_amount,
                'category': 'Savings',
                'description': f"[Goal#{goal_id}] Funded goal: {data['name']}",
                'date': date.today().isoformat()
            }, cursor=cursor)
        
        _check_milestones(user_id, goal_id, ZERO_MONEY, current_amount, _to_decimal(data['target']), data['name'], conn, cursor)
        conn.commit()
        return goal_id

def update_goal(user_id, goal_id, data):
    with db_cursor() as (conn, cursor):
        goal = GoalRepository.get_by_id(user_id, goal_id, cursor=cursor)
        if not goal:
            raise ResourceNotFoundError("Goal not found")
        
        old_amount = _to_decimal(goal['current_amount'] if isinstance(goal, dict) else goal[3]) # dictionary=True is usually used
        # Fallback for non-dict row if needed, but repositories use dictionary=True mostly.
        # Actually, let's ensure goal is treated as a dict as per repo implementation.
        old_amount = _to_decimal(goal['current_amount'])
        new_amount = _to_decimal(data['current'])
        
        _assert_savings_within_income(cursor, user_id, new_amount, exclude_goal_id=goal_id)
        GoalRepository.update(user_id, goal_id, data, cursor=cursor)

        if new_amount > old_amount:
            TransactionRepository.create(user_id, {
                'type': 'expense',
                'amount': new_amount - old_amount,
                'category': 'Savings',
                'description': f"[Goal#{goal_id}] Funded goal: {data['name']}",
                'date': date.today().isoformat()
            }, cursor=cursor)

        _check_milestones(user_id, goal_id, old_amount, new_amount, _to_decimal(data['target']), data['name'], conn, cursor)
        conn.commit()

def delete_goal(user_id, goal_id):
    with db_cursor() as (conn, cursor):
        UserRepository.lock_row(cursor, user_id)
        if GoalRepository.delete(user_id, goal_id, cursor=cursor) == 0:
            raise ResourceNotFoundError("Goal not found")
        TransactionRepository.delete_by_goal_audit(user_id, goal_id, cursor=cursor)
        conn.commit()

def _check_milestones(user_id, goal_id, old_amount, new_amount, target_amount, goal_name, conn, cursor):
    if target_amount <= ZERO_MONEY:
        return

    old_progress = (old_amount / target_amount) * 100
    new_progress = (new_amount / target_amount) * 100
    
    milestone_title = None
    milestone_msg = None
    
    if new_progress >= 100 and old_progress < 100:
        milestone_title = 'Goal Achieved \U0001F389'
        milestone_msg = f"Congratulations! You've achieved your goal: {goal_name}!"
    elif new_progress >= 75 and old_progress < 75:
        milestone_title = 'Goal Milestone: 75% \U0001F680'
        milestone_msg = f"You are almost there! 75% of your goal '{goal_name}' is complete."
    elif new_progress >= 50 and old_progress < 50:
        milestone_title = 'Goal Milestone: 50% \U0001F4AA'
        milestone_msg = f"Halfway there! You've reached 50% of your goal '{goal_name}'."
    elif new_progress >= 25 and old_progress < 25:
        milestone_title = 'Goal Milestone: 25% \U0001F331'
        milestone_msg = f"Great start! You've reached 25% of your goal '{goal_name}'."

    if milestone_title:
        user = UserRepository.get_by_id(user_id, cursor=cursor)
        if user and user.notify_goal_milestones:
            NotificationService.create_notification(
                user_id, 'goal_milestone', milestone_title, milestone_msg, '/savings',
                cursor=cursor
            )
