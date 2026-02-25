# 💰 Smart Expense Tracker

> A powerful, full-stack personal finance management web application built with **Flask** and **MySQL**, featuring a stunning premium Glassmorphism UI, real-time analytics, and comprehensive financial guardrails.

---

## 🌟 Overview

**Smart Expense Tracker** helps you take control of your financial life. Track every rupee in and out, set monthly budget guardrails, manage savings goals, and visualize your spending patterns through interactive charts — all within a sleek, modern interface.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Authentication** | Secure register, login & logout with password hashing |
| 📊 **Dashboard** | Real-time overview of income, expenses, and balance |
| 🛡️ **Budget Guardrails** | Set monthly limits per category with smart pacing insights |
| 💸 **Transaction Management** | Create, edit, and delete income/expense entries |
| 🎯 **Savings Goals** | Set, track, and manage your financial goals with progress colors |
| 📈 **Analytics** | Visual charts for spending patterns and historical trends |
| ⚙️ **User Settings** | Manage profile, preferred currency, and interface theme |
| 🌱 **Demo Data Seeding** | Auto-seeds sample data on registration for new users |
| 🏥 **Health Diagnostics** | Real-time API/DB connectivity status check |

---

## 🛠️ Tech Stack

### Backend
- **Python 3.10+** — Core language
- **Flask** — Lightweight WSGI web framework
- **Flask-Login** — Session-based user authentication
- **Flask-Bcrypt** — Password hashing & verification
- **mysql-connector-python** — MySQL database driver
- **python-dotenv** — Environment variable management

### Frontend
- **Jinja2** — Server-side HTML templating
- **Vanilla CSS** — Custom Premium Glassmorphism design system
- **Vanilla JavaScript** — High-performance modular UI logic (ES6+)
- **Chart.js** — Interactive analytics charts

### Database
- **MySQL 8+** — Relational database for all financial data

---

## 📁 Project Structure

```text
smart_expense_tracker/
├── app/
│   ├── core/                   # App bootstrap, DB helpers, extensions
│   ├── models/                 # Domain models (User)
│   ├── routes/
│   │   ├── auth.py             # Auth routes
│   │   ├── main.py             # Page rendering routes
│   │   └── api/                # REST API blueprints
│   │       ├── budgets.py      # Budget CRUD API
│   │       ├── transactions.py # Transactions CRUD API
│   │       ├── goals.py        # Savings goals CRUD API
│   │       ├── settings.py     # User settings API
│   │       └── health.py       # Health check API
│   ├── services/               # Business & domain logic
│   │   ├── budget_service.py
│   │   ├── dashboard_service.py
│   │   ├── finance_service.py
│   │   └── transaction_service.py
│   ├── static/                 # CSS & JavaScript
│   │   ├── css/                # Dashboard & Global styles
│   │   └── js/                 # Modular Dashboard app
│   └── templates/              # Jinja2 HTML templates
├── db/
│   └── schema.sql              # Database schema
├── scripts/
│   └── init_db.py              # DB creation & initialization script
├── tests/                      # Automated tests
├── config.py                   # App configuration
├── run.py                      # Application entry point
└── requirements.txt            # Python dependencies
```

---

## ⚡ Quick Start

### 1. Prerequisites

- **Python 3.10+**
- **MySQL 8+**

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```env
SECRET_KEY=your_secret_key
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DB=expense_db
SEED_DEMO_DATA_ON_REGISTER=true
```

### 3. Setup & Initialization

```bash
# Install dependencies
pip install -r requirements.txt

# Initialize Database
python scripts/init_db.py

# Run the Application
python run.py
```

Open `http://127.0.0.1:5000` in your browser.

---

## 🔌 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/data` | Fetch full dashboard payload |
| `POST` | `/api/transactions` | Create a transaction |
| `POST` | `/api/budgets` | Upsert a monthly budget |
| `DELETE` | `/api/budgets/<id>` | Remove a budget limit |
| `PUT` | `/api/goals/<id>` | Update savings goal |
| `GET` | `/api/health` | System health check |

---

## 📜 License

This project is licensed under the **MIT License**.

---

<div align="center">

Made with ❤️ by **Sourav**

</div>
