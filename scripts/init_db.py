from pathlib import Path
import sys

import mysql.connector

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from config import Config

SCHEMA_PATH = ROOT_DIR / 'db' / 'schema.sql'


def _schema_for_database(schema_text, database_name):
    return (
        schema_text
        .replace("CREATE DATABASE IF NOT EXISTS expense_db;", f"CREATE DATABASE IF NOT EXISTS {database_name};")
        .replace("USE expense_db;", f"USE {database_name};")
    )

def init_db():
    try:
        conn = mysql.connector.connect(
            host=Config.MYSQL_HOST,
            user=Config.MYSQL_USER,
            password=Config.MYSQL_PASSWORD
        )
        cursor = conn.cursor()
        
        # Create database if not exists
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {Config.MYSQL_DB}")
        print(f"Database {Config.MYSQL_DB} created or exists.")
        
        conn.database = Config.MYSQL_DB
        
        # Read and execute schema
        with open(SCHEMA_PATH, 'r', encoding='utf-8') as f:
            schema = _schema_for_database(f.read(), Config.MYSQL_DB)
            statements = schema.split(';')
            for statement in statements:
                if statement.strip():
                    cursor.execute(statement)
                    
        print("Schema initialized successfully.")
        
        cursor.close()
        conn.close()
        
    except mysql.connector.Error as err:
        print(f"Error: {err}")

if __name__ == '__main__':
    init_db()
