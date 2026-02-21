from flask import Flask

from app.core.bootstrap import register_blueprints, register_extensions
from app.core.db import get_db_connection
from app.core.json_encoder import CustomJSONProvider
from config import Config


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Use custom JSON provider for Decimal/Date serialization
    app.json = CustomJSONProvider(app)

    register_extensions(app)
    register_blueprints(app)

    return app
