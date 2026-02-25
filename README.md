# Smart Expense Tracker

A Flask + MySQL web app to track income/expenses, budgets, and savings goals.

## Features
- User registration/login/logout
- Transaction CRUD (income and expense)
- Savings goals CRUD
- Monthly budget limits
- Dashboard + analytics charts
- Currency setting
- API/DB health endpoint

## Tech Stack
- Python, Flask, Flask-Login, Flask-Bcrypt
- MySQL (mysql-connector-python)
- Vanilla JS + Chart.js

## Setup
1. Install dependencies:
   `pip install -r requirements.txt`
2. Configure `.env`:
   - `SECRET_KEY`
   - `MYSQL_HOST`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`
   - `MYSQL_DB`
3. Initialize database:
   - Safe mode (default, non-destructive if schema exists):
     `python scripts/init_db.py`
   - Destructive reset:
     `python scripts/init_db.py --reset`
4. Run app:
   `python run.py`

## Main API Endpoints
- `GET /api/data`
- `POST /api/transactions`
- `PUT /api/transactions/<id>`
- `DELETE /api/transactions/<id>`
- `POST /api/goals`
- `PUT /api/goals/<id>`
- `DELETE /api/goals/<id>`
- `POST /api/budgets`
- `DELETE /api/budgets/<id>`
- `POST /api/settings`
- `GET /api/health`
