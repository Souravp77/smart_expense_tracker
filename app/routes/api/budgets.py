from flask import request
from flask_login import current_user, login_required

from . import api_bp
from app.routes.api.responses import bad_request, created, not_found, ok, server_error
from app.services.budget_service import delete_budget, save_budget
from app.services.errors import ResourceNotFoundError
from app.utils.validators import validate_budget_payload


@api_bp.route('/budgets', methods=['POST'])
@api_bp.route('/budget', methods=['POST'])
@login_required
def upsert_budget():
    try:
        payload = validate_budget_payload(request.get_json() or {})
        budget_id, inserted = save_budget(current_user.id, payload)
        message = 'Budget created' if inserted else 'Budget updated'
        response = {'message': message, 'id': budget_id}
        return created(response) if inserted else ok(response)
    except ValueError as error:
        return bad_request(error)
    except Exception as error:
        return server_error(error)


@api_bp.route('/budgets/<int:budget_id>', methods=['DELETE'])
@login_required
def remove_budget(budget_id):
    try:
        delete_budget(current_user.id, budget_id)
        return ok({'message': 'Budget deleted'})
    except ResourceNotFoundError as error:
        return not_found(error)
    except Exception as error:
        return server_error(error)
