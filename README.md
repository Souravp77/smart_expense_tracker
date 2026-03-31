# 💰 Smart Expense Tracker

[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![Flask 2.0+](https://img.shields.io/badge/flask-2.0+-blue.svg)](https://flask.palletsprojects.com/)
[![MySQL](https://img.shields.io/badge/database-MySQL-blue.svg)](https://www.mysql.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Smart Expense Tracker** is a comprehensive personal finance management system built with Flask and MySQL. It empowers users to take control of their finances through real-time tracking, goal setting, and advanced analytics.

---

## ✨ Key Features

| **Feature** | **Description** |
| :--- | :--- |
| **Authentication** | Secure user registration, login, and session management using Flask-Login and Bcrypt. |
| **Transaction CRUD** | Seamlessly manage income and expenses with detailed categorization. |
| **Savings Goals** | Set, track, and visualize progress towards your long-term savings objectives. |
| **Budget Control** | Define monthly budget limits and receive real-time warnings upon exceedance. |
| **Interactive Analytics** | Dynamic charts and data visualization powered by **Chart.js**. |
| **Notification Engine** | Milestone alerts, budget warnings, and goal progress updates. |
| **Currency Management** | Professional handling of multi-currency inputs with a safe data reset gateway. |
| **Health Diagnostics** | Built-in API and database health monitoring endpoints. |

---

## 🛠️ Tech Stack

-   **Backend**: Flask (Python framework)
-   **Database**: MySQL (relational storage with `mysql-connector-python`)
-   **Security**: Flask-Bcrypt (hashing) & Flask-Login (session)
-   **Frontend**: Vanilla HTML5, CSS3, & JavaScript (ES6+)
-   **Visuals**: Chart.js for data visualization
-   **Environment**: `python-dotenv` for configuration management

---

## 🚀 Quick Start

### 1. Prerequisites
- Python 3.8 or higher installed.
- MySQL Server running.

### 2. Setup Environment
```bash
# Clone the repository
git clone https://github.com/yourusername/smart_expense_tracker.git
cd smart_expense_tracker

# Create and activate virtual environment
python -m venv venv
source venv/Scripts/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configuration
Copy the template and fill in your database credentials:
```bash
cp .env.example .env
```

### 4. Initialize Database
You can perform a fresh initialization or upgrade an existing schema:
```bash
# Fresh Start (Caution: Resets all data)
python scripts/db/init_db.py --reset

# Upgrade with new features
python scripts/db/upgrade_db_notifications.py
```

### 5. Run Application
```bash
python run.py
```
Access the app at `http://localhost:5000`.

---

## 🏗️ Project Architecture

The project follows a **Service-Repository** pattern for clean separation of concerns:

-   `app/core/`: Application bootstrapping, database helpers, and middleware.
-   `app/models/`: Data models and DTOs.
-   `app/repositories/`: Direct database interaction layer.
-   `app/services/`: Core business logic and validation.
-   `app/routes/`: Blueprint-based routing (both HTML and API).
-   `app/static/`: Premium Glassmorphic UI assets and Vanilla JS modules.
-   `app/templates/`: Jinja2 templates for dynamic rendering.

---

## 🌉 Main API Endpoints

| Endpoint | Method | Action |
| :--- | :--- | :--- |
| `/api/data` | `GET` | Retrieve dashboard stats and chart data |
| `/api/transactions` | `POST` | Log a new transaction |
| `/api/goals` | `GET/POST` | Manage savings goals |
| `/api/budgets` | `POST` | Update budget limits |
| `/api/notifications`| `GET` | Fetch latest user notifications |
| `/api/health` | `GET` | System sanity and connection health check |

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

*Designed with ❤️ by [SOURAV]*
