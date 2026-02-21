from flask import request
from flask_login import current_user, login_required

from app.routes.api import api_bp
from app.routes.api.responses import bad_request, created, ok, server_error
from app.services.finance_service import add_transaction, delete_transaction, update_transaction
from app.utils.validators import validate_transaction_payload


@api_bp.route('/transactions', methods=['POST'])
@login_required
def create_transaction():
    try:
        payload = validate_transaction_payload(request.get_json() or {})
        new_id = add_transaction(current_user.id, payload)
        return created({'message': 'Transaction added', 'id': new_id})
    except ValueError as error:
        return bad_request(error)
    except Exception as error:
        return server_error(error)


@api_bp.route('/transactions/<int:transaction_id>', methods=['PUT'])
@login_required
def edit_transaction(transaction_id):
    try:
        payload = validate_transaction_payload(request.get_json() or {})
        update_transaction(current_user.id, transaction_id, payload)
        return ok({'message': 'Transaction updated'})
    except ValueError as error:
        return bad_request(error)
    except Exception as error:
        return server_error(error)


@api_bp.route('/transactions/<int:transaction_id>', methods=['DELETE'])
@login_required
def remove_transaction(transaction_id):
    try:
        delete_transaction(current_user.id, transaction_id)
        return ok({'message': 'Transaction deleted'})
    except Exception as error:
        return server_error(error)
