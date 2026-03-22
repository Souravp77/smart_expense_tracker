from app.core.db import db_cursor
from decimal import Decimal, ROUND_HALF_UP
from app.repositories.transaction_repository import TransactionRepository
from app.repositories.goal_repository import GoalRepository
from app.repositories.budget_repository import BudgetRepository
from app.repositories.category_repository import CategoryRepository


MONEY_QUANTUM = Decimal('0.01')
ZERO_MONEY = Decimal('0.00')


def _to_decimal(value):
    if isinstance(value, Decimal):
        return value
    if value in (None, ''):
        return ZERO_MONEY
    return Decimal(str(value))


def _to_money_float(value):
    return float(_to_decimal(value).quantize(MONEY_QUANTUM, rounding=ROUND_HALF_UP))

def _fetch_finance_summary(cursor, user_id):
    total_income = TransactionRepository.get_total_income(cursor, user_id)
    
    # Specific query for non-savings expenses
    cursor.execute(
        """
        SELECT COALESCE(SUM(amount), 0) AS total_expense
        FROM transactions
        WHERE user_id = %s
          AND type = 'expense'
          AND category <> 'Savings'
        """,
        (user_id,)
    )
    total_expense = _to_decimal(cursor.fetchone()['total_expense'])

    allocated_savings = GoalRepository.get_total_allocations(cursor, user_id)

    available_income = total_income - allocated_savings
    available_balance = available_income - total_expense
    savings_rate = round((available_balance / available_income) * 100) if available_income else 0
    return {
        'totalIncomeRecorded': _to_money_float(total_income),
        'allocatedSavings': _to_money_float(allocated_savings),
        'availableIncome': _to_money_float(available_income),
        'totalExpense': _to_money_float(total_expense),
        'availableBalance': _to_money_float(available_balance),
        'savingsRate': savings_rate,
    }


def get_dashboard_payload(user):
    with db_cursor(dictionary=True) as (_, cursor):
        transactions = TransactionRepository.get_all_by_user(user.id, cursor=cursor)
        for tx in transactions:
            tx['id'] = tx['transaction_id']
            tx['date'] = tx['date'].isoformat()
            if tx.get('created_at'):
                tx['created_at'] = tx['created_at'].isoformat()

        goals = GoalRepository.get_all_by_user(user.id, cursor=cursor)
        for goal in goals:
            goal['id'] = goal['goal_id']
            if goal.get('deadline'):
                goal['deadline'] = goal['deadline'].isoformat()
            if goal.get('created_at'):
                goal['created_at'] = goal['created_at'].isoformat()

        budgets = BudgetRepository.get_all_by_user(user.id, cursor=cursor)
        for budget in budgets:
            budget['id'] = budget['budget_id']

        categories_raw = CategoryRepository.get_all_by_user(user.id)
        
        income_cats = [c['name'] for c in categories_raw if c['type'] == 'income']
        expense_cats = [c['name'] for c in categories_raw if c['type'] == 'expense']

        DEFAULT_INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Gift']
        DEFAULT_EXPENSE_CATEGORIES = ['Food & Dining', 'Shopping', 'Entertainment', 'Travel / Outings', 'Personal Care', 'Parties', 'Subscriptions', 'Other Expense']
        
        income_cats = sorted(list(set(income_cats + DEFAULT_INCOME_CATEGORIES)))
        expense_cats = sorted(list(set(expense_cats + DEFAULT_EXPENSE_CATEGORIES)))

        categories = {
            'income': income_cats,
            'expense': expense_cats
        }

        finance_summary = _fetch_finance_summary(cursor, user.id)

    return {
        'transactions': transactions,
        'savingsGoals': goals,
        'budgets': budgets,
        'categories': categories,
        'financeSummary': finance_summary,
        'user': {
            'id': user.id,
            'name': user.username,
            'email': user.email,
            'currency': user.currency or 'INR',
            'notify_budget_alerts': getattr(user, 'notify_budget_alerts', True),
            'notify_goal_milestones': getattr(user, 'notify_goal_milestones', True)
        }
    }
