def update_settings(user_id, data):
    from app.core.db import db_cursor

    with db_cursor() as (conn, cursor):
        cursor.execute("SELECT user_id FROM users WHERE user_id = %s FOR UPDATE", (user_id,))
        if not cursor.fetchone():
            raise ValueError("User not found")
        query = "UPDATE users SET currency = %s"
        params = [data['currency']]
        
        if 'notify_budget_alerts' in data:
            query += ", notify_budget_alerts = %s"
            params.append(data['notify_budget_alerts'])
        if 'notify_goal_milestones' in data:
            query += ", notify_goal_milestones = %s"
            params.append(data['notify_goal_milestones'])
            
        query += " WHERE user_id = %s"
        params.append(user_id)
        
        cursor.execute(query, tuple(params))
        conn.commit()


def clear_user_financial_data(user_id):
    from app.core.db import db_cursor

    with db_cursor() as (conn, cursor):
        cursor.execute("SELECT user_id FROM users WHERE user_id = %s FOR UPDATE", (user_id,))
        if not cursor.fetchone():
            raise ValueError("User not found")
        cursor.execute("DELETE FROM transactions WHERE user_id = %s", (user_id,))
        cursor.execute("DELETE FROM savings_goals WHERE user_id = %s", (user_id,))
        cursor.execute("DELETE FROM budgets WHERE user_id = %s", (user_id,))
        cursor.execute("DELETE FROM notifications WHERE user_id = %s", (user_id,))
        cursor.execute("DELETE FROM categories WHERE user_id = %s", (user_id,))
        conn.commit()
