from flask import Blueprint, render_template, redirect, url_for, flash, request, current_app
from flask_login import login_user, logout_user, login_required, current_user
from app.core.extensions import bcrypt
from app.services.auth_service import get_user_by_email, register_user
from app.services.demo_data_service import seed_demo_data

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))

    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')

        user = get_user_by_email(email)
        password_ok = False
        if user:
            try:
                password_ok = bcrypt.check_password_hash(user.password_hash, password)
            except (ValueError, TypeError):
                password_ok = False

        if user and password_ok:
            login_user(user)
            return redirect(url_for('main.dashboard'))
        else:
            flash('Login Unsuccessful. Please check email and password', 'error')

    return render_template('auth/login.html')

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))

    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')

        user = get_user_by_email(email)
        if user:
            flash('Email already exists', 'error')
            return redirect(url_for('auth.register'))

        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        new_user_id = register_user(username, email, hashed_password)

        if not new_user_id:
            flash('Registration failed. Please try again.', 'error')
            return redirect(url_for('auth.register'))

        if current_app.config.get('SEED_DEMO_DATA_ON_REGISTER', True):
            seed_demo_data(new_user_id)

        flash('Account created! You are now able to log in', 'success')
        return redirect(url_for('auth.login'))

    return render_template('auth/register.html')

@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('auth.login'))
