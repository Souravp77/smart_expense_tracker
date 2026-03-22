# Smart Expense Tracker

A Flask + MySQL web app to track income/expenses, budgets, and savings goals.

## Features
- User registration/login/logout
- Transaction CRUD (income and expense)
- Savings goals CRUD
- Monthly budget limits
- Dashboard + analytics charts
- Notification system (Milestones, Progress Alerts, Budget Warnings)
- Professional Currency Management with Data Reset Gate
- Advanced Savings Goal customization (Icons, Priorities, Deadlines)
- API/DB health diagnostic endpoint

## Tech Stack
- Python, Flask, Flask-Login, Flask-Bcrypt
- MySQL (mysql-connector-python)
- Vanilla JS + Chart.js

## Setup
1. Install dependencies:
   `pip install -r requirements.txt`
2. Configure `.env`:
   - Copy `.env.example` to `.env` and fill in your details:
     `cp .env.example .env`
3. Initialize database:
   - Fresh Start: `python scripts/db/init_db.py --reset`
   - Upgrade Notifications: `python scripts/db/upgrade_db_notifications.py`
   - Test Edge Cases: `python scripts/dev/test_edge_cases.py`
   - Capture UI Screenshots: `python scripts/dev/capture_screenshots.py`
4. Run app:
   `python run.py`

## Project Structure
- `app/`: Core application logic
  - `core/`: Application bootstrapping, database helpers, and middleware
  - `models/`: Data Transfer Objects (DTOs) and User model
  - `routes/`: Blueprint-based routing (Web & API)
  - `services/`: Business logic layer
  - `static/`: Frontend assets (CSS, Glassmorphic UI, Vanilla JS)
  - `templates/`: HTML Jinja2 templates
- `docs/`: Documentation and project artifacts
  - `report/`: Comprehensive project documentation and analysis
  - `screenshoot/`: UI screenshots
- `infra/`: Infrastructure-related configuration
  - `db/`: Database schemas and migrations
- `scripts/`: Maintenance, setup, and utility scripts
  - `db/`: Database-related scripts
  - `dev/`: Development and testing aids
  - `maintenance/`: System maintenance tasks
- `tests/`: Automated system and service-level tests

## Main API Endpoints
- `GET /api/data`: Fetch dashboard and analytical data
- `POST /api/transactions`: Create a transaction
- `PUT /api/transactions/<id>`: Update a transaction
- `DELETE /api/transactions/<id>`: Delete a transaction
- `POST /api/goals`: Create a savings goal
- `PUT /api/goals/<id>`: Update a savings goal
- `DELETE /api/goals/<id>`: Delete a savings goal
- `POST /api/budgets`: Set a budget limit
- `DELETE /api/budgets/<id>`: Remove a budget
- `GET /api/notifications`: Retrieve user notifications
- `POST /api/notifications/read/<id>`: Mark notification as read
- `POST /api/notifications/read-all`: Mark all as read
- `POST /api/data/reset`: Clear all user data
- `GET /api/health`: System health check
