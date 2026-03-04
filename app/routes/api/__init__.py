from flask import Blueprint

api_bp = Blueprint('api', __name__)

# Standard practice: import routes at the end to avoid circular imports
# though since these modules import api_bp, we still have to be careful.
# However, importing them here ensures they are registered when api_bp is used.

from . import budgets, data, goals, health, responses, settings, transactions, notifications
