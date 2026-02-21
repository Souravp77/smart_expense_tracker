CREATE DATABASE IF NOT EXISTS expense_db;
USE expense_db;

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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    name VARCHAR(50) NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
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
    goal_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (goal_id) REFERENCES savings_goals(goal_id) ON DELETE SET NULL
);

CREATE TABLE budgets (
    budget_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    month VARCHAR(7) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

INSERT INTO categories (user_id, name, type) VALUES
(NULL, 'Salary', 'income'),
(NULL, 'Freelance', 'income'),
(NULL, 'Investment', 'income'),
(NULL, 'Food & Dining', 'expense'),
(NULL, 'Transportation', 'expense'),
(NULL, 'Shopping', 'expense'),
(NULL, 'Entertainment', 'expense'),
(NULL, 'Bills & Utilities', 'expense'),
(NULL, 'Healthcare', 'expense'),
(NULL, 'Education', 'expense');

INSERT INTO users (username, email, password_hash) VALUES
('Demo User', 'demo@example.com', '$2b$12$jAJ/UDnvehDkOfVUxGY/LOBcsSkyDWlRtzgHfLUUu713d4sAok1TC');

INSERT INTO savings_goals (user_id, name, target_amount, current_amount, color, deadline) VALUES
(1, 'Emergency Fund', 300000.00, 90000.00, 'bg-blue-500', '2026-12-31'),
(1, 'Summer Trip', 150000.00, 45000.00, 'bg-indigo-500', '2026-08-15');

INSERT INTO transactions (user_id, category, amount, type, description, date, method, goal_id) VALUES
(1, 'Salary', 320000.00, 'income', 'Monthly salary', '2026-02-01', 'Bank Transfer', NULL),
(1, 'Freelance', 45000.00, 'income', 'Side project payment', '2026-02-05', 'Bank Transfer', NULL),
(1, 'Food & Dining', 16000.00, 'expense', 'Weekly groceries', '2026-02-08', 'Card', NULL),
(1, 'Transportation', 7500.00, 'expense', 'Fuel and commute', '2026-02-10', 'Card', NULL),
(1, 'Bills & Utilities', 22000.00, 'expense', 'Electricity + internet', '2026-02-12', 'Bank Transfer', NULL),
(1, 'Investment', 30000.00, 'income', 'Dividend payout', '2026-02-15', 'Bank Transfer', 1),
(1, 'Entertainment', 9500.00, 'expense', 'Weekend outing', '2026-02-18', 'Card', NULL);

INSERT INTO budgets (user_id, category, amount, month) VALUES
(1, 'Food & Dining', 25000.00, '2026-02'),
(1, 'Transportation', 12000.00, '2026-02'),
(1, 'Entertainment', 15000.00, '2026-02');
