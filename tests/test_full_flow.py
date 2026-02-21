import unittest
import json
from pathlib import Path
from app import create_app, get_db_connection
from config import Config

SCHEMA_PATH = Path(__file__).resolve().parents[1] / 'db' / 'schema.sql'


def _schema_for_database(schema_text, database_name):
    return (
        schema_text
        .replace("CREATE DATABASE IF NOT EXISTS expense_db;", f"CREATE DATABASE IF NOT EXISTS {database_name};")
        .replace("USE expense_db;", f"USE {database_name};")
    )

class TestConfig(Config):
    TESTING = True
    MYSQL_DB = 'expense_db_test'
    WTF_CSRF_ENABLED = False
    SEED_DEMO_DATA_ON_REGISTER = False

class FullFlowTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestConfig)
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()

        # Reset DB
        self.conn = get_db_connection()
        self.cursor = self.conn.cursor()
        
        # Recreate tables for clean state
        self.cursor.execute("DROP DATABASE IF EXISTS expense_db_test")
        self.cursor.execute("CREATE DATABASE expense_db_test")
        self.conn.database = "expense_db_test"
        
        # Load schema
        with open(SCHEMA_PATH, 'r', encoding='utf-8') as f:
            schema = _schema_for_database(f.read(), TestConfig.MYSQL_DB)
            statements = schema.split(';')
            for statement in statements:
                if statement.strip():
                    self.cursor.execute(statement)
        self.conn.commit()

    def tearDown(self):
        self.cursor.close()
        self.conn.close()
        self.app_context.pop()

    def test_full_user_journey(self):
        # 1. Register
        print("Testing Registration...")
        res = self.client.post('/register', data={
            'username': 'Flow User',
            'email': 'flow@example.com',
            'password': 'password123'
        }, follow_redirects=True)
        self.assertIn(b'Account created!', res.data)

        # 2. Login
        print("Testing Login...")
        res = self.client.post('/login', data={
            'email': 'flow@example.com',
            'password': 'password123'
        }, follow_redirects=True)
        self.assertIn(b'Dashboard', res.data)

        # 3. Create Savings Goal
        print("Testing Create Goal...")
        goal_data = {
            'name': 'Vacation',
            'target': 2000.00,
            'current': 500.00,
            'color': 'bg-emerald-500'
        }
        res = self.client.post('/api/goals', json=goal_data)
        self.assertEqual(res.status_code, 201)
        goal_id = res.json['id']

        # 4. Create Income Transaction
        print("Testing Create Income...")
        income_data = {
            'type': 'income',
            'amount': 3000.00,
            'category': 'Salary',
            'description': 'Monthly Pay',
            'date': '2023-10-01',
            'method': 'Bank Transfer'
        }
        res = self.client.post('/api/transactions', json=income_data)
        self.assertEqual(res.status_code, 201)

        # 5. Create Expense Transaction
        print("Testing Create Expense...")
        expense_data = {
            'type': 'expense',
            'amount': 150.00,
            'category': 'Food & Dining',
            'description': 'Groceries',
            'date': '2023-10-02',
            'method': 'Card'
        }
        res = self.client.post('/api/transactions', json=expense_data)
        self.assertEqual(res.status_code, 201)
        tx_id = res.json['id']

        # 6. Verify Dashboard Data
        print("Testing Data Fetch...")
        res = self.client.get('/api/data')
        data = res.json
        
        # Check totals indirectly
        txs = data['transactions']
        self.assertEqual(len(txs), 2)
        self.assertEqual(txs[0]['description'], 'Groceries') # Ordered by date DESC usually
        
        goals = data['savingsGoals']
        self.assertEqual(len(goals), 1)
        self.assertEqual(goals[0]['name'], 'Vacation')

        # 7. Update Settings
        print("Testing Update Settings...")
        settings_data = {
            'currency': 'USD'
        }
        res = self.client.post('/api/settings', json=settings_data)
        self.assertEqual(res.status_code, 200)

        # Verify user row is intact after settings update
        self.cursor.execute("SELECT username, currency FROM users WHERE email=%s", ('flow@example.com',))
        user_row = self.cursor.fetchone()
        self.assertEqual(user_row[0], 'Flow User')
        self.assertEqual(user_row[1], 'USD')

        res = self.client.get('/api/data')
        self.assertEqual(res.json['user']['currency'], 'USD')

        # 8. Delete Transaction
        print("Testing Delete Transaction...")
        res = self.client.delete(f'/api/transactions/{tx_id}')
        self.assertEqual(res.status_code, 200)
        
        res = self.client.get('/api/data')
        self.assertEqual(len(res.json['transactions']), 1)

        # 9. Delete Goal
        print("Testing Delete Goal...")
        res = self.client.delete(f'/api/goals/{goal_id}')
        self.assertEqual(res.status_code, 200)
        
        res = self.client.get('/api/data')
        self.assertEqual(len(res.json['savingsGoals']), 0)

        print("Full flow verification successful!")

if __name__ == '__main__':
    unittest.main()

