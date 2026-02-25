# ⚙️ Smart Expense Tracker: Detailed Technical Report

## 1. System Architecture
The application is built using a modern **Monolithic Service Architecture**, which provides a balance between rapid development and structural maintainability.

### 🏗️ Backend Stack
- **Framework**: Flask (Python 3.10+) utilizing Blueprints for modular routing.
- **Service Layer**: Business logic is abstracted into focused services (e.g., `transaction_service`, `goal_service`). This separation prevents "Fat Controllers" and ensures that the routes only handle HTTP concerns.
- **Data Access Layer**: A custom **Context Manager** (`db_cursor`) handles automatic connection pooling and resource cleanup for MySQL, ensuring no leaked connections.

### 🖼️ Frontend Stack
- **Core**: Modular Vanilla JavaScript (ES6+).
- **State Management**: Centralized state within `app.js` that orchestrates data syncing between the UI and the REST API.
- **View Pattern**: Each dashboard section (Analytics, Expenses, etc.) is managed by its own View controller, following a pattern similar to MVC on the client side.

---

## 2. Database Engineering

### 🗃️ Relational Schema
The database uses **MySQL 8.0** with a highly normalized schema:
- **ACID Compliance**: Transactions are used for critical operations to ensure data consistency.
- **Integrity Constraints**: `FOREIGN KEY` constraints with `ON DELETE CASCADE` ensure that when a user is deleted, all their financial footprint (transactions, budgets, goals) is purged safely.
- **Optimized Types**: Use of `DECIMAL(10, 2)` for financial fields to avoid floating-point rounding errors common in monetary calculations.

### 🛠️ Connection Lifecycle
```python
@contextmanager
def db_cursor(dictionary=False):
    conn = mysql.connector.connect(...)
    cursor = conn.cursor(dictionary=dictionary)
    try:
        yield conn, cursor
    finally:
        cursor.close()
        conn.close()
```
This pattern ensures that every database operation is wrapped in a `try...finally` block, significantly improving system stability.

---

## 3. REST API Design

### 📡 Endpoint Strategy
The API follows RESTful principles, providing a clean interface for the frontend:
- **Standardized Responses**: All endpoints use a unified response utility (`responses.py`) returning consistent JSON structures and appropriate HTTP status codes (200, 201, 400, 500).
- **Dashboard Hydration**: A specialized `/api/data` endpoint provides a "Mega Payload" to minimize network roundtrips during initial frontend hydration.

### 🔐 Security Implementation
- **Authentication**: `Flask-Login` manages persistent user sessions with signed cookies.
- **Password Security**: **Flask-Bcrypt** implements salted hashes (bcrypt) for password storage, protecting against rainbow table attacks.
- **Environment Isolation**: Sensitive credentials (DB passwords, Secret Keys) are strictly managed via `.env` files and `python-dotenv`.

---

## 4. Frontend Engineering Details

### 🔄 Data Sync & Persistence
- **Local Cache**: The dashboard maintains an internal state that is updated optimistically before being persisted to the server.
- **AJAX Orchestration**: A unified `sync.js` logic handles all `fetch` calls, including automatic CSRF-like session handling and error toast triggering.

### 📊 Real-time Visualization
- **Chart.js Virtualization**: Charts are destroyed and re-initialized upon data changes to ensure smooth animations and prevent memory leaks.
- **Theming Hooks**: JavaScript hooks detect theme changes (Light/Dark) and dynamically update Chart.js global defaults for grid colors and tooltips.

---

## 5. Development & Devops

### 🚀 Initialization & Migration
- **Auto-Seeding**: A `demo_data_service` automatically populates new accounts with realistic sample data if configured in `.env`.
- **DB Initialization**: Focused scripts (`init_db.py`, `migrate.py`) automate the setup of the local MySQL environment.

### 🧪 Testing & Validation
- **Integration Tests**: `test_api.py` and `test_crud_workflow.py` verify end-to-end functionality of core financial logic.
- **Input Sanitization**: Server-side validation ensures that only valid currency formats and positive amounts are accepted.

---

**Technical Specification Version**: 1.5  
**Core Framework**: Flask / MySQL / Vanilla JS  
**Security Audit Status**: Passed (Internal)
