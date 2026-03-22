from app.core.db import db_cursor

class CategoryRepository:
    @staticmethod
    def get_by_name(user_id, tx_type, name, cursor=None):
        query = "SELECT category_id FROM categories WHERE type = %s AND name = %s AND (user_id IS NULL OR user_id = %s) LIMIT 1"
        params = (tx_type, name, user_id)
        if cursor:
            cursor.execute(query, params)
            return cursor.fetchone()
        with db_cursor(dictionary=True) as (_, cursor):
            cursor.execute(query, params)
            return cursor.fetchone()

    @staticmethod
    def create(user_id, tx_type, name, cursor=None):
        query = "INSERT INTO categories (user_id, name, type) VALUES (%s, %s, %s)"
        params = (user_id, name, tx_type)
        if cursor:
            cursor.execute(query, params)
            return cursor.lastrowid
        with db_cursor() as (conn, cursor):
            cursor.execute(query, params)
            conn.commit()
            return cursor.lastrowid

    @staticmethod
    def get_all_by_user(user_id):
        with db_cursor(dictionary=True) as (_, cursor):
            cursor.execute(
                "SELECT * FROM categories WHERE user_id IS NULL OR user_id = %s",
                (user_id,)
            )
            return cursor.fetchall()
