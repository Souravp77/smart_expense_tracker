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

def init_db(reset=False):
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

        if not reset:
            cursor.execute(
                """
                SELECT COUNT(*)
                FROM information_schema.tables
                WHERE table_schema = %s
                """,
                (Config.MYSQL_DB,)
            )
            table_count = int(cursor.fetchone()[0] or 0)
            if table_count > 0:
                print(
                    "Initialization skipped: schema already exists. "
                    "Use --reset to recreate it (destructive)."
                )
                cursor.close()
                conn.close()
                return
        
        # Read and execute schema
        with open(SCHEMA_PATH, 'r', encoding='utf-8') as f:
            schema = _schema_for_database(f.read(), Config.MYSQL_DB)
            statements = schema.split(';')
            for statement in statements:
                stmt_clean = statement.strip()
                if stmt_clean:
                    cursor.execute(stmt_clean)
        
        conn.commit()
        print("Schema initialized successfully.")
        
        cursor.close()
        conn.close()
        
    except mysql.connector.Error as err:
        print(f"Error: {err}")

if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Initialize MySQL database schema.')
    parser.add_argument(
        '--reset',
        action='store_true',
        help='Drop/recreate schema using the full SQL file (destructive).',
    )
    cli_args = parser.parse_args()
    init_db(reset=cli_args.reset)
