from flask_login import login_required

from app.core.db import db_cursor
from . import api_bp
from app.routes.api.responses import ok


@api_bp.route('/health', methods=['GET'])
@login_required
def health_check():
    stats = {}
    try:
        with db_cursor(dictionary=True) as (_, cursor):
            cursor.execute("SELECT 1")
            cursor.fetchone()
            
        return ok({'api': True, 'db': True})
    except Exception as error:
        # Keep status 200 so frontend diagnostics can classify API-vs-DB.
        return ok({'api': True, 'db': False, 'error': str(error)})
