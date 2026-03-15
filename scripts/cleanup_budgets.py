from run import app
from app.core.db import db_cursor

with app.app_context():
    with db_cursor() as (conn, cursor):
        cursor.execute("DELETE FROM notifications WHERE type='budget_alert' AND (title='Budget Reached' OR title='Budget Warning')")
        cursor.execute("DELETE FROM budgets WHERE category IN ('Food & Dining', 'Entertainment')")
        conn.commit()
print('Cleaned up recently seeded budget data from DB')
