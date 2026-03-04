CREATE DATABASE IF NOT EXISTS expense_db;
USE expense_db;

DROP VIEW IF EXISTS user_finance_summary;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS savings_goals;
DROP TABLE IF EXISTS budgets;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    currency ENUM('USD', 'EUR', 'GBP', 'INR') NOT NULL DEFAULT 'INR',
    notify_budget_alerts BOOLEAN DEFAULT TRUE,
    notify_goal_milestones BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    name VARCHAR(50) NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    UNIQUE KEY uq_categories_user_name_type (user_id, name, type),
    KEY idx_categories_type_name (type, name),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE savings_goals (
    goal_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    target_amount DECIMAL(10, 2) NOT NULL,
    current_amount DECIMAL(10, 2) DEFAULT 0.00,
    color VARCHAR(20) DEFAULT 'bg-blue-500',
    deadline DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_savings_goals_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    description VARCHAR(255),
    date DATE NOT NULL,
    method VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_transactions_user_date (user_id, date),
    KEY idx_transactions_user_type_date (user_id, type, date),
    KEY idx_transactions_user_category_date (user_id, category, date),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE budgets (
    budget_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    month VARCHAR(7) NOT NULL,
    UNIQUE KEY uq_budgets_user_category_month (user_id, category, month),
    KEY idx_budgets_user_month (user_id, month),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('budget_alert', 'goal_milestone', 'system_message', 'reminder') NOT NULL,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_notifications_user_read_created (user_id, is_read, created_at),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE OR REPLACE VIEW user_finance_summary AS
SELECT
    u.user_id,
    COALESCE((SELECT SUM(t.amount) FROM transactions t WHERE t.user_id = u.user_id AND t.type = 'income'), 0) AS total_income_recorded,
    COALESCE((SELECT SUM(t.amount) FROM transactions t WHERE t.user_id = u.user_id AND t.type = 'expense' AND t.category <> 'Savings'), 0) AS total_expense,
    COALESCE((SELECT SUM(g.current_amount) FROM savings_goals g WHERE g.user_id = u.user_id), 0) AS allocated_savings,
    (
        COALESCE((SELECT SUM(t.amount) FROM transactions t WHERE t.user_id = u.user_id AND t.type = 'income'), 0) -
        COALESCE((SELECT SUM(g.current_amount) FROM savings_goals g WHERE g.user_id = u.user_id), 0)
    ) AS available_income,
    (
        (
            COALESCE((SELECT SUM(t.amount) FROM transactions t WHERE t.user_id = u.user_id AND t.type = 'income'), 0) -
            COALESCE((SELECT SUM(g.current_amount) FROM savings_goals g WHERE g.user_id = u.user_id), 0)
        ) -
        COALESCE((SELECT SUM(t.amount) FROM transactions t WHERE t.user_id = u.user_id AND t.type = 'expense' AND t.category <> 'Savings'), 0)
    ) AS available_balance
FROM users u;


INSERT INTO categories (user_id, name, type) VALUES
(NULL, 'Salary', 'income'),
(NULL, 'Freelance', 'income'),
(NULL, 'Investment', 'income'),
(NULL, 'Food & Dining', 'expense'),
(NULL, 'Shopping', 'expense'),
(NULL, 'Entertainment', 'expense'),
(NULL, 'Travel / Outings', 'expense'),
(NULL, 'Personal Care', 'expense'),
(NULL, 'Parties', 'expense'),
(NULL, 'Subscriptions', 'expense');


INSERT INTO users (username, email, password_hash) VALUES
('Demo User', 'demo@example.com', '$2b$12$jAJ/UDnvehDkOfVUxGY/LOBcsSkyDWlRtzgHfLUUu713d4sAok1TC');

INSERT INTO savings_goals (user_id, name, target_amount, current_amount, color, deadline) VALUES
(1, 'Summer Trip', 150000.00, 45000.00, 'bg-indigo-500', '2026-08-15');

INSERT INTO transactions (user_id, category, amount, type, description, date, method) VALUES
(1, 'Salary', 320000.00, 'income', 'Monthly salary', '2026-02-01', 'Bank Transfer'),
(1, 'Freelance', 45000.00, 'income', 'Side project payment', '2026-02-05', 'Bank Transfer'),
(1, 'Food & Dining', 16000.00, 'expense', 'Weekly groceries', '2026-02-08', 'Card'),
(1, 'Investment', 30000.00, 'income', 'Dividend payout', '2026-02-15', 'Bank Transfer'),
(1, 'Entertainment', 9500.00, 'expense', 'Weekend outing', '2026-02-18', 'Card');

INSERT INTO budgets (user_id, category, amount, month) VALUES
(1, 'Food & Dining', 25000.00, '2026-02'),
(1, 'Entertainment', 15000.00, '2026-02');
