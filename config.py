import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Application configuration from environment variables."""
    
    # Flask settings
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-me'
    
    # MySQL Database settings
    MYSQL_HOST = os.environ.get('MYSQL_HOST') or 'localhost'
    MYSQL_USER = os.environ.get('MYSQL_USER') or 'root'
    MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD') or ''
    MYSQL_DB = os.environ.get('MYSQL_DB') or 'expense_db'
    MYSQL_CURSORCLASS = 'DictCursor'
    
    # Feature Flags
    SEED_DEMO_DATA_ON_REGISTER = os.environ.get('SEED_DEMO_DATA_ON_REGISTER', 'false').lower() == 'true'
