from contextlib import contextmanager
from mysql.connector import pooling
from flask import current_app

_db_pool = None
_pool_config = None

def get_pool():
    global _db_pool, _pool_config
    cfg = (
        current_app.config['MYSQL_HOST'],
        current_app.config['MYSQL_USER'],
        current_app.config['MYSQL_PASSWORD'],
        current_app.config['MYSQL_DB'],
    )
    if _db_pool is None or _pool_config != cfg:
        _pool_config = cfg
        _db_pool = pooling.MySQLConnectionPool(
            pool_name=f"expense_pool_{abs(hash(cfg)) % 1_000_000}",
            pool_size=10,
            pool_reset_session=True,
            host=cfg[0],
            user=cfg[1],
            password=cfg[2],
            database=cfg[3],
        )
    return _db_pool

@contextmanager
def db_cursor(dictionary=False):
    pool = get_pool()
    conn = pool.get_connection()
    cursor = conn.cursor(dictionary=dictionary)
    try:
        yield conn, cursor
    finally:
        cursor.close()
        conn.close()

def get_db_connection():
    """Backward-compatible direct connection helper using the pool."""
    pool = get_pool()
    return pool.get_connection()
