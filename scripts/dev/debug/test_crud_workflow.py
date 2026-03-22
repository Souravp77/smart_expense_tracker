import json
from app import create_app
from app.core.db import db_cursor

def test_crud():
    app = create_app()
    client = app.test_client()
    
    with app.app_context():
        # 1. Verify we have the Demo User
        with db_cursor(dictionary=True) as (_, cursor):
            cursor.execute("SELECT * FROM users WHERE email = 'demo@example.com'")
            user = cursor.fetchone()
            if not user:
                print("Demo user not found. Creating one...")
                cursor.execute("INSERT INTO users (username, email, password_hash) VALUES ('Demo User', 'demo@example.com', 'test')")
                user_id = cursor.lastrowid
            else:
                user_id = user['user_id']
            print(f"Testing with User ID: {user_id}")

        with client.session_transaction() as sess:
            sess['_user_id'] = str(user_id)
            sess['_fresh'] = True
            sess['_csrf_token'] = 'test-csrf-token'

        csrf_headers = {'X-CSRF-Token': 'test-csrf-token'}

        print("\n--- Starting CRUD Tests ---")

        # --- TRANSACTIONS ---
        print("\n[Transaction CRUD]")
        tx_data = {
            'type': 'expense',
            'amount': 50.0,
            'category': 'Food & Dining',
            'description': 'Test Expense',
            'date': '2026-02-24',
            'method': 'Cash'
        }
        resp = client.post('/api/transactions', json=tx_data, headers=csrf_headers)
        print(f"POST /api/transactions: {resp.status_code}")
        tx_id = resp.get_json()['id']
        
        with db_cursor(dictionary=True) as (_, cursor):
            cursor.execute("SELECT * FROM transactions WHERE transaction_id = %s", (tx_id,))
            db_tx = cursor.fetchone()
            print(f"DB Verification (Create): {'SUCCESS' if db_tx and db_tx['amount'] == 50.0 else 'FAILED'}")

        tx_data['amount'] = 75.0
        resp = client.put(f'/api/transactions/{tx_id}', json=tx_data, headers=csrf_headers)
        print(f"PUT /api/transactions/{tx_id}: {resp.status_code}")
        
        with db_cursor(dictionary=True) as (_, cursor):
            cursor.execute("SELECT * FROM transactions WHERE transaction_id = %s", (tx_id,))
            db_tx = cursor.fetchone()
            print(f"DB Verification (Update): {'SUCCESS' if db_tx and db_tx['amount'] == 75.0 else 'FAILED'}")

        resp = client.delete(f'/api/transactions/{tx_id}', headers=csrf_headers)
        print(f"DELETE /api/transactions/{tx_id}: {resp.status_code}")
        
        with db_cursor(dictionary=True) as (_, cursor):
            cursor.execute("SELECT * FROM transactions WHERE transaction_id = %s", (tx_id,))
            db_tx = cursor.fetchone()
            print(f"DB Verification (Delete): {'SUCCESS' if not db_tx else 'FAILED'}")

        # --- SAVINGS GOALS ---
        print("\n[Savings Goal CRUD]")
        goal_data = {
            'name': 'New Laptop',
            'target': 1000.0,
            'current': 100.0,
            'color': 'bg-blue-500',
            'deadline': '2026-12-31'
        }
        resp = client.post('/api/goals', json=goal_data, headers=csrf_headers)
        print(f"POST /api/goals: {resp.status_code}")
        goal_resp_data = resp.get_json()
        goal_id = goal_resp_data.get('id')
        
        with db_cursor(dictionary=True) as (_, cursor):
            cursor.execute("SELECT * FROM savings_goals WHERE goal_id = %s", (goal_id,))
            db_goal = cursor.fetchone()
            print(f"DB Verification (Create): {'SUCCESS' if db_goal and db_goal['target_amount'] == 1000.0 else 'FAILED'}")

        goal_data['target'] = 1200.0
        resp = client.put(f'/api/goals/{goal_id}', json=goal_data, headers=csrf_headers)
        print(f"PUT /api/goals/{goal_id}: {resp.status_code}")
        
        with db_cursor(dictionary=True) as (_, cursor):
            cursor.execute("SELECT * FROM savings_goals WHERE goal_id = %s", (goal_id,))
            db_goal = cursor.fetchone()
            print(f"DB Verification (Update): {'SUCCESS' if db_goal and db_goal['target_amount'] == 1200.0 else 'FAILED'}")

        resp = client.delete(f'/api/goals/{goal_id}', headers=csrf_headers)
        print(f"DELETE /api/goals/{goal_id}: {resp.status_code}")
        
        with db_cursor(dictionary=True) as (_, cursor):
            cursor.execute("SELECT * FROM savings_goals WHERE goal_id = %s", (goal_id,))
            db_goal = cursor.fetchone()
            print(f"DB Verification (Delete): {'SUCCESS' if not db_goal else 'FAILED'}")

        # --- BUDGETS ---
        print("\n[Budget CRUD (Upsert)]")
        budget_data = {
            'category': 'Food & Dining',
            'amount': 200.0,
            'month': '2026-03'
        }
        resp = client.post('/api/budgets', json=budget_data, headers=csrf_headers)
        print(f"POST /api/budgets (Create): {resp.status_code}")
        
        with db_cursor(dictionary=True) as (_, cursor):
            cursor.execute("SELECT * FROM budgets WHERE user_id = %s AND category = %s AND month = %s", 
                           (user_id, 'Food & Dining', '2026-03'))
            db_budget = cursor.fetchone()
            print(f"DB Verification (Create): {'SUCCESS' if db_budget and db_budget['amount'] == 200.0 else 'FAILED'}")

        budget_data['amount'] = 250.0
        resp = client.post('/api/budgets', json=budget_data, headers=csrf_headers)
        print(f"POST /api/budgets (Update): {resp.status_code}")
        
        with db_cursor(dictionary=True) as (_, cursor):
            cursor.execute("SELECT * FROM budgets WHERE user_id = %s AND category = %s AND month = %s", 
                           (user_id, 'Food & Dining', '2026-03'))
            db_budget = cursor.fetchone()
            print(f"DB Verification (Update): {'SUCCESS' if db_budget and db_budget['amount'] == 250.0 else 'FAILED'}")

        with db_cursor() as (conn, cursor):
            cursor.execute("DELETE FROM budgets WHERE user_id = %s AND category = %s AND month = %s", 
                           (user_id, 'Food & Dining', '2026-03'))
            conn.commit()
        print("Test Budget cleaned up.")

        print("\n--- Tests Completed ---")

if __name__ == "__main__":
    test_crud()
