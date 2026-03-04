import mysql.connector
from pathlib import Path
import sys

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from config import Config

def upgrade_db():
    print("Starting database upgrade...")
    try:
        conn = mysql.connector.connect(
            host=Config.MYSQL_HOST,
            user=Config.MYSQL_USER,
            password=Config.MYSQL_PASSWORD,
            database=Config.MYSQL_DB
        )
        cursor = conn.cursor()

        # 1. Add new columns to users table if they don't exist
        print("Checking users table for notification settings columns...")
        cursor.execute("SHOW COLUMNS FROM users LIKE 'notify_budget_alerts'")
        if not cursor.fetchone():
            print("Adding notify_budget_alerts column to users table...")
            cursor.execute("ALTER TABLE users ADD COLUMN notify_budget_alerts BOOLEAN DEFAULT TRUE")
        
        cursor.execute("SHOW COLUMNS FROM users LIKE 'notify_goal_milestones'")
        if not cursor.fetchone():
            print("Adding notify_goal_milestones column to users table...")
            cursor.execute("ALTER TABLE users ADD COLUMN notify_goal_milestones BOOLEAN DEFAULT TRUE")

        # 2. Create notifications table if it doesn't exist
        print("Checking if notifications table exists...")
        cursor.execute("SHOW TABLES LIKE 'notifications'")
        if not cursor.fetchone():
            print("Creating notifications table...")
            cursor.execute("""
                CREATE TABLE notifications (
                    notification_id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    type ENUM('budget_alert', 'goal_milestone', 'system_message', 'reminder') NOT NULL,
                    title VARCHAR(100) NOT NULL,
                    message TEXT NOT NULL,
                    is_read BOOLEAN DEFAULT FALSE,
                    action_url VARCHAR(255) DEFAULT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
                )
            """)
        
        conn.commit()
        print("Database upgrade completed successfully.")

    except mysql.connector.Error as err:
        print(f"Error during database upgrade: {err}")
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn.is_connected():
            conn.close()

if __name__ == '__main__':
    upgrade_db()
