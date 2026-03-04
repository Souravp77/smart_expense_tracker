from flask import request
from flask_login import current_user, login_required

from . import api_bp
from app.routes.api.responses import bad_request, created, not_found, ok, server_error
from app.services.errors import ResourceNotFoundError
from app.services.transaction_service import add_transaction, delete_transaction, update_transaction, get_transactions
from app.utils.validators import validate_transaction_payload


@api_bp.route('/transactions', methods=['GET'])
@login_required
def list_transactions():
    search = request.args.get('q')
    raw_limit = request.args.get('limit', 1000, type=int)
    limit = max(1, min(raw_limit or 1000, 2000))
    transactions = get_transactions(current_user.id, search, limit)
    return ok({'transactions': transactions})


@api_bp.route('/transactions', methods=['POST'])

@login_required
def create_transaction():
    try:
        payload = validate_transaction_payload(request.get_json() or {})
        new_id = add_transaction(current_user.id, payload)
        return created({'message': 'Transaction added', 'id': new_id})
    except ValueError as error:
        return bad_request(error)
    except ResourceNotFoundError as error:
        return not_found(error)
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
    except ResourceNotFoundError as error:
        return not_found(error)
    except Exception as error:
        return server_error(error)


@api_bp.route('/transactions/<int:transaction_id>', methods=['DELETE'])
@login_required
def remove_transaction(transaction_id):
    try:
        delete_transaction(current_user.id, transaction_id)
        return ok({'message': 'Transaction deleted'})
    except ValueError as error:
        return bad_request(error)
    except ResourceNotFoundError as error:
        return not_found(error)
    except Exception as error:
        return server_error(error)
