# Smart Expense Tracker - API Report

This document outlines the RESTful API endpoints available in the Smart Expense Tracker application. The APIs are protected and require user authentication (managed via `flask_login`).

## 1. Dashboard & Core Data
The dashboard aggregates the primary financial data for the user.

- **`GET /api/data`**
  Fetches the complete dashboard payload, including recent transactions, balance, and goal updates.
- **`POST /api/data/reset`**
  Clears all user financial data (transactions, goals, budgets) from the account.

### Dashboard View
![Dashboard Light Mode](./report_assets/dashboard_light.png)
*Figure 1.1: The main dashboard populated with data from the `/api/data` endpoint.*

### Typical Data Flow (Transaction Creation)
```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant DB
    
    User->>Frontend: Fill Form & Submit
    Frontend->>API: POST /api/transactions
    API->>API: Validate Payload
    API->>DB: INSERT INTO transactions
    DB-->>API: Success
    API-->>Frontend: 201 Created (Success)
    Frontend->>API: GET /api/data (Refresh)
    API-->>Frontend: 200 OK (Latest Balance)
    Frontend->>User: Update UI & Show Toast
```

---

## 2. Transactions API
Endpoints for managing financial transactions (income and expenses).

- **`GET /api/transactions`**
  Lists transactions for the user. Supports `q` for search queries and `limit` for pagination/limiting.
- **`POST /api/transactions`**
  Creates a new transaction. Returns the newly created transaction ID.
- **`PUT /api/transactions/<id>`**
  Updates an existing transaction identified by its ID.
- **`DELETE /api/transactions/<id>`**
  Deletes an existing transaction.

### Adding a Transaction
![Add Transaction Modal](./report_assets/add_transaction.png)
*Figure 2.1: The Add Transaction modal, which submits data to `/api/transactions` via POST.*

---

## 3. Savings Goals API
Endpoints to track and manage user savings goals.

- **`POST /api/goals`**
  Creates a new savings goal. Payload includes `name`, `target`, `current`, `color`, `icon`, `priority`, and `deadline`.
- **`PUT /api/goals/<id>`**
  Updates a specific savings goal with full payload support.
- **`DELETE /api/goals/<id>`**
  Removes a savings goal from the user's account and cleans up associated audit transactions.

### Savings Goals Integration
![Savings Goals](./report_assets/savings_goals.png)
*Figure 3.1: The Savings goals interface powered by the Goals API.*

![Add Goal Modal](./report_assets/add_goal_modal.png)
*Figure 3.2: The Add Goal modal, submitting data to `/api/goals`.*

---

## 4. Budgets API
Endpoints designed for creating and managing spending limits.

- **`POST /api/budgets`** (or `/api/budget`)
  Upserts a budget. If the budget doesn't exist it is created, otherwise updated.
- **`DELETE /api/budgets/<id>`**
  Deletes a specific budget.

---

## 5. Notifications API
Manages system-generated notifications for the user (e.g., milestone alerts, budget warnings).

- **`GET /api/notifications`**
  Retrieves a list of all unread notifications.
- **`POST /api/notifications/read/<id>`**
  Marks a single specified notification as read.
- **`POST /api/notifications/read-all`**
  Marks all of the user's current notifications as read.

---

## 6. Settings API
Manages user application preferences.

- **`POST /api/settings`**
  Updates user settings. Accommodates configuration for app currency (`currency`) and granular notification preferences (`notify_budget_alerts`, `notify_goal_milestones`).

### Settings Application (Dark Mode)
![Dark Mode Dashboard](./report_assets/dashboard_dark.png)
*Figure 6.1: An example of the UI adapting to user preferences such as Dark Mode.*

---

## 7. System Health API
Diagnostic tool for checking application vitality.

- **`GET /api/health`**
  Returns the status of the API and Database connection. Expected response includes `{'api': True, 'db': True}`.

---

*End of Document*
