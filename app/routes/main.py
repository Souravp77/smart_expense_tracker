from flask import Blueprint, render_template
from flask_login import login_required, current_user

main_bp = Blueprint('main', __name__)

def _render_dashboard(tab='dashboard'):
    return render_template('dashboard.html', initial_tab=tab)

@main_bp.route('/')
def index():
    if current_user.is_authenticated:
        return _render_dashboard('dashboard')
    return render_template('auth/login.html')

@main_bp.route('/dashboard')
@login_required
def dashboard():
    return _render_dashboard('dashboard')

@main_bp.route('/transactions')
@login_required
def transactions():
    return _render_dashboard('transactions')

@main_bp.route('/savings')
@login_required
def savings():
    return _render_dashboard('savings')

@main_bp.route('/analytics')
@login_required
def analytics():
    return _render_dashboard('analytics')

@main_bp.route('/settings')
@login_required
def settings():
    return _render_dashboard('settings')
