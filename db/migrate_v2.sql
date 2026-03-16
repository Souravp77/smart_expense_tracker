USE expense_db;

-- Update savings_goals table
ALTER TABLE savings_goals 
ADD COLUMN icon VARCHAR(50) DEFAULT 'fa-bullseye' AFTER color,
ADD COLUMN priority ENUM('low', 'medium', 'high') DEFAULT 'medium' AFTER icon,
ADD COLUMN deadline DATE AFTER priority;

-- Update users table
ALTER TABLE users
ADD COLUMN notify_budget_alerts BOOLEAN DEFAULT TRUE AFTER currency,
ADD COLUMN notify_goal_milestones BOOLEAN DEFAULT TRUE AFTER notify_budget_alerts;

-- Update notifications table
ALTER TABLE notifications
ADD COLUMN action_url VARCHAR(255) DEFAULT NULL AFTER is_read;
