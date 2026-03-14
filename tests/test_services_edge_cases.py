import unittest
from datetime import date
from app import create_app, get_db_connection
from app.core.db import db_cursor
from app.services import transaction_service, goal_service
from app.services.notification_service import NotificationService
from config import Config
from pathlib import Path

SCHEMA_PATH = Path(__file__).resolve().parents[1] / 'db' / 'schema.sql'

def _schema_for_database(schema_text, database_name):
    return (
        schema_text
        .replace("CREATE DATABASE IF NOT EXISTS expense_db;", f"CREATE DATABASE IF NOT EXISTS {database_name};")
        .replace("USE expense_db;", f"USE {database_name};")
    )

class TestConfig(Config):
    TESTING = True
    MYSQL_DB = 'expense_db_services_test'
    WTF_CSRF_ENABLED = False
    SEED_DEMO_DATA_ON_REGISTER = False

class ServicesEdgeCasesTestCase(unittest.TestCase):
    def setUp(self):
        import mysql.connector

        # Connect without DB to create it
        raw_conn = mysql.connector.connect(
            host=TestConfig.MYSQL_HOST,
            user=TestConfig.MYSQL_USER,
            password=TestConfig.MYSQL_PASSWORD
        )
        raw_cursor = raw_conn.cursor()
        raw_cursor.execute(f"DROP DATABASE IF EXISTS {TestConfig.MYSQL_DB}")
        raw_cursor.execute(f"CREATE DATABASE {TestConfig.MYSQL_DB}")
        raw_cursor.close()
        raw_conn.close()

        self.app = create_app(TestConfig)
        self.app_context = self.app.app_context()
        self.app_context.push()

        self.conn = get_db_connection()
        self.cursor = self.conn.cursor()
        
        with open(SCHEMA_PATH, 'r', encoding='utf-8') as f:
            schema = _schema_for_database(f.read(), TestConfig.MYSQL_DB)
            statements = schema.split(';')
            for statement in statements:
                if statement.strip():
                    self.cursor.execute(statement)
        self.conn.commit()

        # Create a test user
        self.cursor.execute("INSERT INTO users (username, email, password_hash, notify_budget_alerts, notify_goal_milestones) VALUES ('User', 'user@test.com', 'pwd', 1, 1)")
        self.user_id = self.cursor.lastrowid
        self.conn.commit()

    def tearDown(self):
        self.cursor.close()
        self.conn.close()
        self.app_context.pop()

    def test_budget_notification_trigger(self):
        # Add budget
        self.cursor.execute("INSERT INTO budgets (user_id, category, amount, month) VALUES (%s, %s, %s, %s)",
            (self.user_id, 'Food & Dining', 100.0, date.today().strftime('%Y-%m')))
        self.conn.commit()

        # Add transaction
        transaction_service.add_transaction(self.user_id, {
            'type': 'expense',
            'amount': 85.0, # 85% > 80% threshold
            'category': 'Food & Dining',
            'description': 'Dinner',
            'date': date.today().isoformat()
        })

        notifs = NotificationService.get_all_notifications(self.user_id)
        self.assertTrue(any(n['title'] == 'Budget Warning' for n in notifs))

        # Exceed budget
        transaction_service.add_transaction(self.user_id, {
            'type': 'expense',
            'amount': 20.0,
            'category': 'Food & Dining',
            'description': 'Snack',
            'date': date.today().isoformat()
        })

        notifs = NotificationService.get_all_notifications(self.user_id)
        self.assertTrue(any(n['title'] == 'Budget Reached' for n in notifs))

    def test_goal_service_add_and_milestone(self):
        transaction_service.add_transaction(self.user_id, {
            'type': 'income',
            'amount': 5000.0,
            'category': 'Salary',
            'date': date.today().isoformat()
        })

        goal_id = goal_service.add_goal(self.user_id, {
            'name': 'Test Goal',
            'target': 1000.0,
            'current': 1000.0
        })

        notifs = NotificationService.get_all_notifications(self.user_id)
        self.assertTrue(any('Goal Achieved' in n['title'] for n in notifs))

    def test_system_audit_transaction_protection(self):
        transaction_service.add_transaction(self.user_id, {
            'type': 'income',
            'amount': 5000.0,
            'category': 'Salary',
            'date': str(date.today())
        })

        goal_id = goal_service.add_goal(self.user_id, {
            'name': 'Protected Goal',
            'target': 1000.0,
            'current': 200.0
        })

        # Find the audit tx
        self.cursor.execute("SELECT transaction_id FROM transactions WHERE category = 'Savings' AND description LIKE %s", (f'[Goal#{goal_id}]%',))
        audit_tx_id = self.cursor.fetchone()[0]

        with self.assertRaisesRegex(ValueError, "System-generated"):
            transaction_service.update_transaction(self.user_id, audit_tx_id, {
                'type': 'expense',
                'amount': 300.0,
                'category': 'Food',
                'description': 'Hack',
                'date': str(date.today())
            })

if __name__ == '__main__':
    unittest.main()
