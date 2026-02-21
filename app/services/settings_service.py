def update_settings(user_id, data):
    from app.core.db import db_cursor

    with db_cursor() as (conn, cursor):
        cursor.execute(
            "UPDATE users SET currency = %s WHERE user_id = %s",
            (data['currency'], user_id)
        )
        conn.commit()


def clear_user_financial_data(user_id):
    from app.core.db import db_cursor

    with db_cursor() as (conn, cursor):
        cursor.execute("DELETE FROM transactions WHERE user_id = %s", (user_id,))
        cursor.execute("DELETE FROM savings_goals WHERE user_id = %s", (user_id,))
        cursor.execute("DELETE FROM budgets WHERE user_id = %s", (user_id,))
        conn.commit()
