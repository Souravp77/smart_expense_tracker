import sys
import mysql.connector
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from config import Config

def migrate():
    try:
        conn = mysql.connector.connect(
            host=Config.MYSQL_HOST,
            user=Config.MYSQL_USER,
            password=Config.MYSQL_PASSWORD,
            database=Config.MYSQL_DB
        )
        cursor = conn.cursor()
        
        print("Adding unique constraint to budgets table...")
        try:
            cursor.execute("ALTER TABLE budgets ADD UNIQUE KEY unique_budget (user_id, category, month);")
            conn.commit()
            print("Successfully added unique constraint.")
        except mysql.connector.Error as err:
            if err.errno == 1061: # Duplicate key name
                print("Constraint already exists.")
            else:
                print(f"Error: {err}")

        conn.close()
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
