from app.core.db import db_cursor
from app.services.errors import ResourceNotFoundError
from app.services.notification_service import NotificationService
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


def _ensure_category_exists(cursor, user_id, tx_type, category_name):
    cursor.execute(
        """
        SELECT category_id
        FROM categories
        WHERE type = %s AND name = %s AND (user_id IS NULL OR user_id = %s)
        LIMIT 1
        """,
        (tx_type, category_name, user_id)
    )
    if cursor.fetchone():
        return

    cursor.execute(
        """
        INSERT INTO categories (user_id, name, type)
        VALUES (%s, %s, %s)
        """,
        (user_id, category_name, tx_type)
    )


def _lock_user_row(cursor, user_id):
    cursor.execute("SELECT user_id FROM users WHERE user_id = %s FOR UPDATE", (user_id,))
    if not cursor.fetchone():
        raise ResourceNotFoundError("User not found")


def _get_allocated_savings(cursor, user_id):
    cursor.execute(
        """
        SELECT COALESCE(SUM(current_amount), 0)
        FROM savings_goals
        WHERE user_id = %s
        """,
        (user_id,)
    )
    return _to_decimal(cursor.fetchone()[0])


def _get_total_income(cursor, user_id):
    cursor.execute(
        """
        SELECT COALESCE(SUM(amount), 0)
        FROM transactions
        WHERE user_id = %s AND type = 'income'
        """,
        (user_id,)
    )
    return _to_decimal(cursor.fetchone()[0])


def _assert_income_invariant(cursor, user_id, projected_total_income):
    allocated_savings = _get_allocated_savings(cursor, user_id)
    if projected_total_income < allocated_savings:
        raise ValueError("Cannot reduce income below allocated savings")


def _is_system_goal_audit_tx(tx_type, category, description):
    return (
        tx_type == 'expense'
        and category == 'Savings'
        and str(description or '').startswith('[Goal#')
    )


def _check_budget_and_notify(conn, cursor, user_id, category, tx_date):
    # Check if user wants budget alerts
    cursor.execute("SELECT notify_budget_alerts FROM users WHERE user_id = %s", (user_id,))
    row = cursor.fetchone()
    if not row or not row[0]:
        return

    if isinstance(tx_date, str):
        tx_date = dt_date.fromisoformat(tx_date)
    month_str = tx_date.strftime('%Y-%m')
    month_start = tx_date.replace(day=1)
    if month_start.month == 12:
        month_end = month_start.replace(year=month_start.year + 1, month=1)
    else:
        month_end = month_start.replace(month=month_start.month + 1)
    
    # Get budget
    cursor.execute(
        "SELECT amount FROM budgets WHERE user_id = %s AND category = %s AND month = %s",
        (user_id, category, month_str)
    )
    b_row = cursor.fetchone()
    if not b_row:
        return
    budget_limit = _to_decimal(b_row[0])
    
    # Get total spent in this category for this month
    cursor.execute(
        """
        SELECT SUM(amount)
        FROM transactions
        WHERE user_id = %s
          AND category = %s
          AND type = 'expense'
          AND date >= %s
          AND date < %s
        """,
        (user_id, category, month_start, month_end)
    )
    s_row = cursor.fetchone()
    spent = _to_decimal(s_row[0])
    
    # Trigger logic
    if spent >= budget_limit:
        msg = f"You have exceeded your {month_str} budget for {category} by {spent - budget_limit:.2f}." if spent > budget_limit else f"You have reached your {month_str} budget limit for {category}."
        title = f"Budget Reached: {category} ({month_str})"
        cursor.execute(
            """
            SELECT 1
            FROM notifications
            WHERE user_id = %s
              AND type = 'budget_alert'
              AND title = %s
            LIMIT 1
            """,
            (user_id, title)
        )
        if not cursor.fetchone():
            NotificationService.create_notification(user_id, 'budget_alert', title, msg, '/budget', cursor=cursor)
    elif spent >= budget_limit * WARNING_THRESHOLD:
        msg = f"You have spent {(spent/budget_limit)*100:.0f}% of your {month_str} budget for {category}."
        title = f"Budget Warning: {category} ({month_str})"
        cursor.execute(
            """
            SELECT 1 
            FROM notifications 
            WHERE user_id = %s 
              AND type = 'budget_alert' 
              AND title = %s
            LIMIT 1
            """,
            (user_id, title)
        )
        if not cursor.fetchone():
            NotificationService.create_notification(user_id, 'budget_alert', title, msg, '/budget', cursor=cursor)



def add_transaction(user_id, data):
    with db_cursor() as (conn, cursor):
        _lock_user_row(cursor, user_id)
        _ensure_category_exists(cursor, user_id, data['type'], data['category'])
        cursor.execute(
            """
            INSERT INTO transactions (user_id, type, amount, category, description, date, method)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                user_id,
                data['type'],
                data['amount'],
                data['category'],
                data.get('description'),
                data['date'],
                data.get('method', 'Cash')
            )
        )
        transaction_id = cursor.lastrowid

        if data['type'] == 'expense':
            _check_budget_and_notify(conn, cursor, user_id, data['category'], data['date'])

        conn.commit()
        return transaction_id


def update_transaction(user_id, transaction_id, data):
    with db_cursor() as (conn, cursor):
        _lock_user_row(cursor, user_id)
        cursor.execute(
            """
            SELECT type, amount, category, description
            FROM transactions
            WHERE transaction_id = %s AND user_id = %s
            FOR UPDATE
            """,
            (transaction_id, user_id)
        )
        previous = cursor.fetchone()
        if not previous:
            raise ResourceNotFoundError("Transaction not found")

        previous_type = previous[0]
        previous_amount = _to_decimal(previous[1])
        previous_category = previous[2]
        previous_description = previous[3]

        if _is_system_goal_audit_tx(previous_type, previous_category, previous_description):
            raise ValueError("System-generated goal funding transactions cannot be edited")

        if previous_type == 'income' or data['type'] == 'income':
            total_income = _get_total_income(cursor, user_id)
            projected_total_income = total_income
            if previous_type == 'income':
                projected_total_income -= previous_amount
            if data['type'] == 'income':
                projected_total_income += _to_decimal(data['amount'])
            _assert_income_invariant(cursor, user_id, projected_total_income)

        _ensure_category_exists(cursor, user_id, data['type'], data['category'])
        cursor.execute(
            """
            UPDATE transactions
            SET type=%s, amount=%s, category=%s, description=%s, date=%s, method=%s
            WHERE transaction_id=%s AND user_id=%s
            """,
            (
                data['type'],
                data['amount'],
                data['category'],
                data.get('description'),
                data['date'],
                data.get('method', 'Cash'),
                transaction_id,
                user_id
            )
        )
        if data['type'] == 'expense':
            _check_budget_and_notify(conn, cursor, user_id, data['category'], data['date'])
            
        conn.commit()


def delete_transaction(user_id, transaction_id):
    with db_cursor() as (conn, cursor):
        _lock_user_row(cursor, user_id)
        cursor.execute(
            """
            SELECT type, amount, category, description
            FROM transactions
            WHERE transaction_id = %s AND user_id = %s
            FOR UPDATE
            """,
            (transaction_id, user_id)
        )
        row = cursor.fetchone()
        if not row:
            raise ResourceNotFoundError("Transaction not found")

        tx_type = row[0]
        tx_amount = _to_decimal(row[1])
        tx_category = row[2]
        tx_description = row[3]

        if _is_system_goal_audit_tx(tx_type, tx_category, tx_description):
            raise ValueError("System-generated goal funding transactions cannot be deleted")

        if tx_type == 'income':
            total_income = _get_total_income(cursor, user_id)
            _assert_income_invariant(cursor, user_id, total_income - tx_amount)

        cursor.execute("DELETE FROM transactions WHERE transaction_id=%s AND user_id=%s", (transaction_id, user_id))
        conn.commit()


def get_transactions(user_id, search_query=None, limit=1000):
    with db_cursor(dictionary=True) as (_, cursor):
        query = "SELECT * FROM transactions WHERE user_id = %s"
        params = [user_id]
        
        if search_query:
            query += " AND (description LIKE %s OR category LIKE %s)"
            params.extend([f"%{search_query}%", f"%{search_query}%"])
            
        query += " ORDER BY date DESC LIMIT %s"
        params.append(limit)
        
        cursor.execute(query, tuple(params))
        transactions = cursor.fetchall()
        for tx in transactions:
            tx['id'] = tx['transaction_id']
            tx['date'] = tx['date'].isoformat()
            if tx.get('created_at'):
                tx['created_at'] = tx['created_at'].isoformat()
        return transactions
