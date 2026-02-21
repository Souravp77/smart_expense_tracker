from flask_login import current_user, login_required

from app.routes.api import api_bp
from app.routes.api.responses import ok, server_error
from app.services.finance_service import clear_user_financial_data, get_dashboard_payload


@api_bp.route('/data', methods=['GET'])
@login_required
def get_data():
    return ok(get_dashboard_payload(current_user))


@api_bp.route('/data/reset', methods=['POST'])
@login_required
def reset_user_data():
    try:
        clear_user_financial_data(current_user.id)
        return ok({'message': 'All financial data cleared'})
    except Exception as error:
        return server_error(error)
