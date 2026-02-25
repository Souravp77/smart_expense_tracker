from flask import request
from flask_login import current_user, login_required

from . import api_bp
from app.routes.api.responses import bad_request, created, not_found, ok, server_error
from app.services.errors import ResourceNotFoundError
from app.services.finance_service import add_goal, delete_goal, update_goal
from app.utils.validators import validate_goal_payload


@api_bp.route('/goals', methods=['POST'])
@login_required
def create_goal():
    try:
        payload = validate_goal_payload(request.get_json() or {})
        new_id = add_goal(current_user.id, payload)
        return created({'message': 'Goal created', 'id': new_id})
    except ValueError as error:
        return bad_request(error)
    except ResourceNotFoundError as error:
        return not_found(error)
    except Exception as error:
        return server_error(error)


@api_bp.route('/goals/<int:goal_id>', methods=['PUT'])
@login_required
def edit_goal(goal_id):
    try:
        payload = validate_goal_payload(request.get_json() or {})
        update_goal(current_user.id, goal_id, payload)
        return ok({'message': 'Goal updated'})
    except ValueError as error:
        return bad_request(error)
    except ResourceNotFoundError as error:
        return not_found(error)
    except Exception as error:
        return server_error(error)


@api_bp.route('/goals/<int:goal_id>', methods=['DELETE'])
@login_required
def remove_goal(goal_id):
    try:
        delete_goal(current_user.id, goal_id)
        return ok({'message': 'Goal deleted'})
    except ResourceNotFoundError as error:
        return not_found(error)
    except Exception as error:
        return server_error(error)
