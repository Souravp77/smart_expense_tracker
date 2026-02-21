from flask import request
from flask_login import current_user, login_required

from app.routes.api import api_bp
from app.routes.api.responses import bad_request, ok, server_error
from app.services.finance_service import update_settings
from app.utils.validators import validate_settings_payload


@api_bp.route('/settings', methods=['POST'])
@login_required
def save_settings():
    try:
        payload = validate_settings_payload(request.get_json() or {})
        update_settings(current_user.id, payload)
        # Keep current request/session user object in sync with persisted settings.
        current_user.currency = payload['currency']
        return ok({'message': 'Settings updated'})
    except ValueError as error:
        return bad_request(error)
    except Exception as error:
        return server_error(error)
