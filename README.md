# 💰 Smart Expense Tracker

> A powerful, full-stack personal finance management web application built with **Flask** and **MySQL**, featuring a stunning Glassmorphism UI, real-time analytics, and comprehensive transaction management.

---

## 🌟 Overview

**Smart Expense Tracker** helps you take control of your financial life. Track every rupee in and out, set savings goals, and visualize your spending patterns through interactive charts — all within a sleek, modern interface.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Authentication** | Secure register, login & logout with password hashing |
| 📊 **Dashboard** | Real-time overview of income, expenses, and balance |
| 💸 **Transaction Management** | Create, edit, and delete income/expense entries |
| 🎯 **Savings Goals** | Set, track, and manage your financial goals |
| 📈 **Analytics** | Visual charts for spending patterns and trends |
| ⚙️ **User Settings** | Manage profile, preferred currency, and preferences |
| 🌱 **Demo Data Seeding** | Auto-seeds sample data on registration for new users |
| 🏥 **Health Endpoint** | API/DB diagnostics for authenticated users |

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
- **Vanilla CSS** — Custom Glassmorphism design system
- **Vanilla JavaScript** — Dynamic UI interactions & API calls
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
│   │   ├── auth.py             # Register, login, logout routes
│   │   ├── main.py             # Page rendering routes
│   │   └── api/                # REST API blueprints
│   │       ├── data.py         # Dashboard data endpoint
│   │       ├── transactions.py # Transactions CRUD API
│   │       ├── goals.py        # Savings goals CRUD API
│   │       ├── settings.py     # User settings API
│   │       ├── health.py       # Health check API
│   │       └── responses.py    # Shared API response helpers
│   ├── services/               # Business & domain logic
│   │   ├── auth_service.py
│   │   ├── dashboard_service.py
│   │   ├── demo_data_service.py
│   │   ├── finance_service.py
│   │   ├── goal_service.py
│   │   ├── settings_service.py
│   │   └── transaction_service.py
│   ├── static/                 # CSS, JavaScript, images
│   ├── templates/              # Jinja2 HTML templates
│   │   ├── base.html           # Shared layout with sidebar & navbar
│   │   ├── dashboard.html
│   │   ├── transactions.html
│   │   ├── savings.html
│   │   ├── analytics.html
│   │   ├── settings.html
│   │   └── auth/               # Login & register pages
│   └── utils/                  # Utility helpers
├── db/
│   └── schema.sql              # Database schema + seed structure
├── scripts/
│   └── init_db.py              # DB creation & schema initialization
├── tests/
│   ├── test_app.py
│   └── test_full_flow.py
├── config.py                   # App configuration
├── run.py                      # Application entry point
├── requirements.txt
└── .env                        # Environment variables (not committed)
```

---

## ⚡ Quick Start

### 1. Prerequisites

Make sure you have the following installed:
- **Python 3.10+**
- **MySQL 8+**
- **pip**

### 2. Clone the Repository

```bash
git clone https://github.com/your-username/smart_expense_tracker.git
cd smart_expense_tracker
```

### 3. Create & Activate Virtual Environment

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

### 4. Install Dependencies

```bash
pip install -r requirements.txt
```

### 5. Configure Environment Variables

Create a `.env` file in the project root:

```env
SECRET_KEY=your_super_secret_key_here
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DB=expense_db
SEED_DEMO_DATA_ON_REGISTER=true
```

> **Note:** `SEED_DEMO_DATA_ON_REGISTER=true` automatically creates sample goals and transactions when a new user registers, so you can explore the app right away.  
> If `.env` values are missing, defaults from `config.py` are used as a fallback.

### 6. Initialize the Database

```bash
python scripts/init_db.py
```

This creates the `expense_db` database (or whichever name you configured) and applies `db/schema.sql`.

### 7. Run the Application

```bash
python run.py
```

Open your browser and navigate to:

```
http://127.0.0.1:5000
```

---

## 🗺️ Application Routes

| Route | Description |
|---|---|
| `/` | Redirects to dashboard (if logged in) or login page |
| `/register` | New user registration |
| `/login` | User authentication |
| `/logout` | End session |
| `/dashboard` | Main financial overview |
| `/transactions` | View & manage all transactions |
| `/savings` | Savings goals management |
| `/analytics` | Charts and spending analysis |
| `/settings` | User profile and preferences |

---

## 🔌 REST API Reference

All API endpoints require authentication.

### 📊 Dashboard Data

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/data` | Fetch full dashboard payload (transactions, goals, user info) |
| `POST` | `/api/data/reset` | Clear all user financial data |

### 💸 Transactions

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/transactions` | Create a new transaction |
| `PUT` | `/api/transactions/<id>` | Update an existing transaction |
| `DELETE` | `/api/transactions/<id>` | Delete a transaction |

### 🎯 Savings Goals

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/goals` | Create a new savings goal |
| `PUT` | `/api/goals/<id>` | Update an existing goal |
| `DELETE` | `/api/goals/<id>` | Delete a goal |

### ⚙️ Settings & Health

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/settings` | Update user settings (username, currency) |
| `GET` | `/api/health` | API and database health check |

---

## 🧪 Running Tests

Tests use a dedicated test database (`expense_db_test`). Make sure MySQL is running before executing tests.

```bash
python -m unittest discover -s tests -v
```

---

## 🔒 Security Notes

- All passwords are hashed using **Flask-Bcrypt** before storage — plain-text passwords are never saved.
- User sessions and login state are managed by **Flask-Login**.
- The `.env` file is excluded from version control via `.gitignore` — **never commit your secrets**.

---

## 🧰 Development Notes

- JSON responses use a **custom encoder** to correctly serialize `datetime`, `date`, and `Decimal` types from MySQL.
- The service layer (`app/services/`) keeps business logic decoupled from route handlers for better testability.
- The `demo_data_service.py` seeds realistic sample transactions and goals for new users when `SEED_DEMO_DATA_ON_REGISTER=true`.

---

## 📜 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

<div align="center">

Made with ❤️ by **Sourav**

</div>
