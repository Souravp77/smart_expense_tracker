"""Compatibility facade for finance domain services.

This module preserves the previous import surface used by routes/tests while
internally delegating to focused service modules.
"""

from app.services.dashboard_service import get_dashboard_payload
from app.services.goal_service import add_goal, delete_goal, update_goal
from app.services.settings_service import clear_user_financial_data, update_settings
from app.services.transaction_service import (
    add_transaction,
    delete_transaction,
    update_transaction,
)

__all__ = [
    'get_dashboard_payload',
    'add_transaction',
    'update_transaction',
    'delete_transaction',
    'add_goal',
    'update_goal',
    'delete_goal',
    'update_settings',
    'clear_user_financial_data',
]
