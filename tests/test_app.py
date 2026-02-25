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

class ProjectTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestConfig)
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()

        # Setup Test DB
        self.conn = get_db_connection()
        self.cursor = self.conn.cursor()
        
        # Create test DB if not exists
        self.cursor.execute(f"CREATE DATABASE IF NOT EXISTS {TestConfig.MYSQL_DB}")
        self.conn.database = TestConfig.MYSQL_DB
        
        # Create tables
        with open(SCHEMA_PATH, 'r', encoding='utf-8') as f:
            schema = _schema_for_database(f.read(), TestConfig.MYSQL_DB)
            statements = schema.split(';')
            for statement in statements:
                if statement.strip():
                    self.cursor.execute(statement)
        self.conn.commit()

    def tearDown(self):
        # Clean up
        self.cursor.execute("DROP TABLE IF EXISTS transactions")
        self.cursor.execute("DROP TABLE IF EXISTS savings_goals")
        self.cursor.execute("DROP TABLE IF EXISTS budgets")
        self.cursor.execute("DROP TABLE IF EXISTS categories")
        self.cursor.execute("DROP TABLE IF EXISTS users")
        self.conn.commit()
        
        self.cursor.close()
        self.conn.close()
        self.app_context.pop()

    def register(self, username, email, password):
        return self.client.post('/register', data=dict(
            username=username,
            email=email,
            password=password
        ), follow_redirects=True)

    def login(self, email, password):
        return self.client.post('/login', data=dict(
            email=email,
            password=password
        ), follow_redirects=True)

    def test_registration_and_login(self):
        # Test Registration
        response = self.register('Test User', 'test@example.com', 'password123')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Account created!', response.data)

        # Test Login
        response = self.login('test@example.com', 'password123')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Dashboard', response.data)

    def test_seeded_demo_login(self):
        response = self.login('demo@example.com', 'demo123')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Dashboard', response.data)

    def test_api_transactions(self):
        # Register and Login
        self.register('Test User', 'test@example.com', 'password123')
        self.login('test@example.com', 'password123')

        # Add Income
        data = {
            'type': 'income',
            'amount': 5000.00,
            'category': 'Salary',
            'description': 'August Salary',
            'date': '2023-08-01',
            'method': 'Bank Transfer'
        }
        response = self.client.post('/api/transactions', 
                                    data=json.dumps(data),
                                    content_type='application/json')
        self.assertEqual(response.status_code, 201)

        expense_payload = {
            'type': 'expense',
            'amount': 120.00,
            'category': 'Food & Dining',
            'description': 'Groceries',
            'date': '2023-08-02',
            'method': 'Card'
        }
        response = self.client.post('/api/transactions',
                                    data=json.dumps(expense_payload),
                                    content_type='application/json')
        self.assertEqual(response.status_code, 201)

        # Check Data API
        response = self.client.get('/api/data')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        
        self.assertEqual(len(data['transactions']), 2)
        amounts = sorted(float(t['amount']) for t in data['transactions'])
        descriptions = {t['description'] for t in data['transactions']}
        self.assertEqual(amounts, [120.0, 5000.0])
        self.assertIn('August Salary', descriptions)

    def test_api_goals(self):
        self.register('Test User', 'test@example.com', 'password123')
        self.login('test@example.com', 'password123')

        data = {
            'name': 'New Laptop',
            'target': 1500.00,
            'current': 500.00,
            'color': 'bg-blue-500'
        }
        response = self.client.post('/api/goals', 
                                    data=json.dumps(data),
                                    content_type='application/json')
        self.assertEqual(response.status_code, 201)

        response = self.client.get('/api/data')
        data = json.loads(response.data)
        self.assertEqual(len(data['savingsGoals']), 1)
        self.assertEqual(data['savingsGoals'][0]['name'], 'New Laptop')

    def test_api_goals_accepts_legacy_color_alias(self):
        self.register('Test User', 'test@example.com', 'password123')
        self.login('test@example.com', 'password123')

        data = {
            'name': 'Emergency Fund',
            'target': 5000.00,
            'current': 1000.00,
            'color': 'bg-indigo-500'
        }
        response = self.client.post('/api/goals',
                                    data=json.dumps(data),
                                    content_type='application/json')
        self.assertEqual(response.status_code, 201)

        response = self.client.get('/api/data')
        payload = json.loads(response.data)
        self.assertEqual(payload['savingsGoals'][0]['color'], 'bg-indigo-600')

    def test_api_settings_persists_currency(self):
        self.register('Test User', 'test@example.com', 'password123')
        self.login('test@example.com', 'password123')

        response = self.client.post(
            '/api/settings',
            data=json.dumps({'currency': 'EUR'}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)

        response = self.client.get('/api/data')
        data = json.loads(response.data)
        self.assertEqual(data['user']['currency'], 'EUR')

    def test_transactions_do_not_mutate_goals(self):
        self.register('Test User', 'test@example.com', 'password123')
        self.login('test@example.com', 'password123')

        goal_payload = {
            'name': 'Emergency Fund',
            'target': 1000.00,
            'current': 100.00,
            'color': 'bg-blue-500'
        }
        response = self.client.post('/api/goals',
                                    data=json.dumps(goal_payload),
                                    content_type='application/json')
        self.assertEqual(response.status_code, 201)

        tx_payload = {
            'type': 'income',
            'amount': 200.00,
            'category': 'Investment',
            'description': 'Dividend',
            'date': '2026-02-10',
            'method': 'Bank Transfer'
        }
        response = self.client.post('/api/transactions',
                                    data=json.dumps(tx_payload),
                                    content_type='application/json')
        self.assertEqual(response.status_code, 201)

        response = self.client.get('/api/data')
        data = json.loads(response.data)
        self.assertEqual(len(data['savingsGoals']), 1)
        self.assertEqual(float(data['savingsGoals'][0]['current_amount']), 100.0)

    def test_api_budgets_create_and_update(self):
        self.register('Test User', 'test@example.com', 'password123')
        self.login('test@example.com', 'password123')

        payload = {
            'category': 'Food & Dining',
            'amount': 10000.00,
            'month': '2026-02'
        }
        response = self.client.post(
            '/api/budgets',
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 201)

        update_payload = {
            'category': 'Food & Dining',
            'amount': 12000.00,
            'month': '2026-02'
        }
        response = self.client.post(
            '/api/budgets',
            data=json.dumps(update_payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)

        response = self.client.get('/api/data')
        data = json.loads(response.data)
        self.assertEqual(len(data['budgets']), 1)
        self.assertEqual(float(data['budgets'][0]['amount']), 12000.0)

if __name__ == '__main__':
    unittest.main()
