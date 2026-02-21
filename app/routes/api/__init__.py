from flask import Blueprint


api_bp = Blueprint('api', __name__)


def register_api_routes():
    # Import modules for side-effect route registration on api_bp.
    from app.routes.api import data, goals, health, settings, transactions  # noqa: F401


register_api_routes()
