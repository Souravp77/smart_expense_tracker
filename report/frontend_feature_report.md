# Smart Expense Tracker - Frontend & GUI Feature Report

## 1. Introduction
The Smart Expense Tracker is designed to provide users with a comprehensive, intuitive, and visually appealing interface for managing their personal finances. This report details the functionality and purpose of every major frontend feature.

---

## 2. Global UI Elements
These elements are persistent across the application, providing a consistent navigation and feedback experience.

### 2.1 Sidebar Navigation (`aside#appSidebar`)
- **Purpose**: Central hub for navigating between different modules.
- **Functions**:
    - **Links**: Fast access to Dashboard, Transactions, Budget, Savings Goals, Analytics, and Settings.
    - **User Profile**: Displays the logged-in user's name and email.
    - **Responsive Design**: On mobile, it collapses into a slide-out drawer to maximize screen space.

### 2.2 Header Actions (`header#appHeader`)
- **Purpose**: Provides contextual actions and system-level controls.
- **Functions**:
    - **Theme Toggle**: Switch between **Dark Mode** and **Light Mode** seamlessly.
    - **Notification System**: A bell icon with a real-time badge indicating unread alerts.
    - **Quick Add**: A primary "Add Transaction" button available on every page.
    - **Date Display**: Shows the current date for context.

### 2.3 Toast Notification System
- **Purpose**: Non-intrusive feedback for user actions.
- **Functions**:
    - **Success/Error/Warning**: Distinct visual styles for different feedback types.
    - **Auto-Dismiss**: Messages disappear after a few seconds, with a visual progress timer bar.

---

## 3. Dashboard Module
The initial landing page providing a high-level overview of the user's financial health.

- **KPI Cards**: Summary of Total Balance, Monthly Income, Monthly Expense, and Total Savings.
- **Recent Transactions**: A compact list of the latest financial activities.
- **Spending Trends**: A line/bar chart displaying income vs. expenses over time.

---

## 4. Transactions Module
A dedicated workspace for managing detailed financial records.

- **Transaction Ledger**: A table-based view of all historical data.
- **CRUD Operations**:
    - **Create**: Add new expenses or income via a focused modal.
    - **Read**: View detailed information about any transaction.
    - **Update**: Edit existing records to correct mistakes or update details.
    - **Delete**: Remove unwanted or incorrect entries.
- **Filtering**: Advanced filters by category, date range, or payment method.

---

## 5. Budgeting Module
Empowers users to plan their spending and stay within financial limits.

- **Category Budgets**: Set specific spending limits for categories (e.g., Food, Travel).
- **Progress Tracking**: Visual progress bars showing how much of a budget has been consumed.
- **Alerts**: Visual indicators (turning red) when a category exceeds its allocated budget.

---

## 6. Savings Goals Module
A motivational tool designed to help users save for specific objectives.

- **Goal Cards**: Visually distinct cards for each goal, featuring custom icons and colors.
- **Milestone Tracking**: Real-time progress percentage based on "Saved" vs. "Target" amounts.
- **Smart Creation Modal**:
    - **Suggestion Chips**: One-click selection for common goals (Travel, Education, etc.).
    - **Custom Icons/Colors**: Personalize goals with FontAwesome icons and a curated color palette.
    - **Priority Selection**: Mark goals as Low, Medium, or High priority.

---

## 7. Analytics & Charts
Deep-dive data visualization for informed financial decision-making.

- **Category Breakdown**: Pie charts showing which categories consume the most budget.
- **Time-Series Analysis**: Interactive charts (via Chart.js) showing financial trends over weeks or months.
- **Interactive Tooltips**: Hover over chart elements to see precise data values.

---

## 8. Settings & Configuration
User-specific preferences and account management.

- **Personalization**: Change user display name and profile settings.
- **Currency Selection**: Configure the local currency symbol throughout the app.
- **Data Management**: Options for exporting data or resetting account stats.

---

## 9. Design Philosophy
The GUI utilizes **Tailwind CSS** for a modern, responsive layout and **Vanilla JS** for high-performance interactivity. The philosophy centers on **Clarity**, **Motivation**, and **Accessibility**.
