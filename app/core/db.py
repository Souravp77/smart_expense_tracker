from contextlib import contextmanager

import mysql.connector
from mysql.connector import errorcode
from flask import current_app


@contextmanager
def db_cursor(dictionary=False):
    conn = mysql.connector.connect(
        host=current_app.config['MYSQL_HOST'],
        user=current_app.config['MYSQL_USER'],
        password=current_app.config['MYSQL_PASSWORD'],
        database=current_app.config['MYSQL_DB']
    )
    cursor = conn.cursor(dictionary=dictionary)
    try:
        yield conn, cursor
    finally:
        cursor.close()
        conn.close()


def get_db_connection():
    """Backward-compatible direct connection helper."""
    config = {
        'host': current_app.config['MYSQL_HOST'],
        'user': current_app.config['MYSQL_USER'],
        'password': current_app.config['MYSQL_PASSWORD'],
    }

    database = current_app.config.get('MYSQL_DB')
    if database:
        config['database'] = database

    try:
        return mysql.connector.connect(**config)
    except mysql.connector.Error as exc:
        # Test setup creates the database after connecting; allow a root-level
        # connection when the configured DB does not exist yet.
        if config.get('database') and exc.errno == errorcode.ER_BAD_DB_ERROR:
            config.pop('database', None)
            return mysql.connector.connect(**config)
        raise
