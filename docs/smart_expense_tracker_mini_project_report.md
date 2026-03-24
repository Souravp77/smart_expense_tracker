# SMART EXPENSE TRACKER - MINI PROJECT REPORT

---

**[Page 1]**

**A MINI PROJECT REPORT**

Submitted by

**SOURAV P** (Reg No: [Placeholder])

to

**APJ Abdul Kalam Technological University**

in partial fulfilment of the requirements for the award of Degree of

**Bachelor of Technology in Computer Science**

**Department of Computer Science Engineering**
**College of Engineering, Trikaripur**
**2024**

---

**[Page 2]**

**DECLARATION**

We undersigned hereby declare that the project report titled "Smart Expense Tracker" submitted for partial fulfillment of the requirements for the award of degree of Bachelor of Technology of the APJ Abdul Kalam Technological University, Kerala is a bonafide work carried out by us under the supervision of ________.

This report has not been submitted previously for any degree or diploma. This submission represents our ideas in our own words and where ideas or words of others have been included, we have adequately and accurately cited and referenced the original sources. We also declare that we have adhered to ethics of academic honesty and integrity and have not misrepresented or fabricated any data or idea or fact or source in our submission. We understand that any violation of the above will be a cause for disciplinary action by the institute and/or the University and can also evoke penal action from the sources which have thus not been properly cited or from whom proper permission has not been obtained. This report has not been previously formed the basis for the award of any degree, diploma or similar title of any other University.

---

**[Page 3]**

**DEPARTMENT OF COMPUTER SCIENCE ENGINEERING**
**COLLEGE OF ENGINEERING, TRIKARIPUR**

**CERTIFICATE**

This is to certify that the report entitled "SMART EXPENSE TRACKER", submitted by **Sourav P** to the APJ Abdul Kalam Technological University in partial fulfillment of the requirements for the award of the Degree of Bachelor of Technology in Computer Science is a bonafide record of the project carried out by him under my guidance and supervision. This report in any form has not been submitted to any other University or Institute for any purpose.

**Internal Supervisor(s)**

**External Supervisor(s)**

**PG Coordinator**

**Head of the Department**

---

**[Page 4]**

**ACKNOWLEDGEMENT**

We give honour and praise to the LORD who gave us wisdom and enabled us to complete this mini project successfully.

We would like to thank the Department of Computer Science Engineering, College of Engineering Trikaripur, for giving us the opportunity to present this project.

We would like to express our deep gratitude to our project guide for his/her timely suggestions and encouragement through the processes involved in the development of the project and report preparation.

Last, but not the least, we express our heartfelt thanks to our friends and parents for their support and encouragement during this endeavour.

---

**[Page 5]**

**ABSTRACT**

Smart Expense Tracker is a secure, web-based financial management system designed to empower users with real-time control over their personal economy. Built on a robust **Modified MVC (Model-View-Controller)** architecture, the system leverages **Python (Flask)** and **MySQL** to provide high-integrity data management and visual analytics. 

The application facilitates precise income and expense tracking, category-specific monthly budgeting with automated alert thresholds, and milestone-based savings goal management. Featuring a premium, responsive interface styled with **Tailwind CSS**, it transforms raw transaction data into actionable financial insights. By industrializing the traditional ledger through automated balance invariants and secure session-based authentication, the project ensures data persistence, privacy, and proactive financial monitoring.

---

**[Page 6]**

**CONTENTS**

1. ABSTRACT 5
2. LIST OF FIGURES 7
3. ABBREVIATIONS 8
4. CHAPTER 1: INTRODUCTION 9
   1.1 BACKGROUND 9
   1.2 SCOPE 10
   1.3 OBJECTIVE 10
   1.4 PROPOSED SYSTEM 10
5. CHAPTER 2: SRS 11
   2.1 PRODUCT OVERVIEW 11
   2.2 PRODUCT FUNCTIONALITY 12
   2.3 DESIGN AND IMPLEMENTATION CONSTRAINTS 13
   2.4 HARDWARE REQUIREMENTS 13
   2.5 SOFTWARE REQUIREMENTS 14
   2.6 FUNCTIONAL REQUIREMENTS 14
6. CHAPTER 3: MATERIAL AND METHODS 15
   3.1 DESIGN PHASE 15
   3.2 DATA FLOW DIAGRAM 16
   3.3 ACTIVITY DIAGRAM 19
   3.4 USE CASE DIAGRAM 21
   3.5 DATABASE DESIGN 23
7. CHAPTER 4: IMPLEMENTATION 25
8. CHAPTER 5: RESULTS AND DISCUSSIONS 29
9. CHAPTER 6: CONCLUSION 30
10. BIBLIOGRAPHY 31

---

**[Page 7]**

**LIST OF FIGURES**

3.2 Data Flow Diagram. 16
3.3 Activity Diagram. 20
3.4 Use case Diagram. 22
3.5 Database Design (ER Diagram). 24
4.1 Dashboard Hub. 26
4.2 Secure Authentication Gateway. 26
4.3 Transaction Input Interface. 27
4.4 Transaction Ledger & Audit Trail. 27
4.5 Budget Configuration. 28
4.6 Savings Goal Milestones. 28
4.7 Interactive Spending Analytics. 29
4.8 System Notifications Center. 29

---

**[Page 8]**

**ABBREVIATIONS**

1. **MVC** - Model-View-Controller (Architecture)
2. **HTML5** - HyperText Markup Language (5th revision)
3. **CSS3** - Cascading Style Sheets (Level 3)
4. **JS (ES6+)** - JavaScript (ECMAScript 2015+)
5. **RDBMS** - Relational Database Management System
6. **Bcrypt** - Password Hashing Function
7. **CSRF** - Cross-Site Request Forgery
8. **REST** - Representational State Transfer

---

**[Page 9]**

**CHAPTER 1: INTRODUCTION**

Effective financial literacy begins with the accurate recording of every transaction. The Smart Expense Tracker addresses the modern need for a centralized, secure, and intuitive platform to manage personal finances. By bridging the gap between raw data and visual insights, it enables users to identify waste, enforce discipline, and achieve long-term financial security.

**1.1 BACKGROUND**

The current manual methods of financial tracking—ranging from paper books to complex, offline spreadsheets—suffer from lack of real-time accessibility, high error rates, and zero proactive monitoring. Physical ledgers provide no security and are time-consuming to audit. Existing software solutions are often either too generic or lack the specific localized features (like custom currency and milestone-based saving) required for disciplined management. The Smart Expense Tracker solves these by internalizing business logic that automatically calculates available balances based on earnings, expenditures, and pre-allocated savings.

**1.2 SCOPE**

The project is designed for individual users seeking to manage high-frequency daily transactions. It covers:
- **Identity Security**: Isolated user environments via session-based authentication.
- **Financial Enforcement**: Real-time budget monitoring and goal-based income reservation.
- **Reporting**: Dynamic data visualization for category distributions and monthly trends.
- **Accessibility**: A mobile-first, responsive web interface for cross-device usage.

**1.3 OBJECTIVE**

- To provide an automated alternative to error-prone manual bookkeeping.
- To implement a **Service-Repository** architecture for decoupled, maintainable code.
- To ensure data integrity via relational database constraints and transactional logic.
- To foster financial discipline through milestone-based alerts and budget warnings.

**1.4 PROPOSED SYSTEM**

The Smart Expense Tracker utilizes a modern technical stack to ensure scalability and performance. Unlike traditional systems, it introduces a "virtual allocation" logic for savings. When a user defines a savings goal, the system treats the allocated funds as "reserved," dynamically reducing the `Available Balance` shown on the dashboard even before the money is physically spent. This proactive approach ensures users do not accidentally overspend funds intended for future milestones.

---

**[Page 11]**

**CHAPTER 2: SOFTWARE REQUIREMENT SPECIFICATION (SRS)**

This chapter provides a technical breakdown of the product specification, including the functional logic and environmental constraints.

**2.1 PRODUCT OVERVIEW**

A full-stack web application implementing the **Modified MVC** pattern. The backend (Python/Flask) handles transaction processing, budget validation, and notification triggers. The frontend (Tailwind/JS) handles asynchronous data submission (AJAX/Fetch) and dynamic charting (Chart.js).

**2.2 PRODUCT FUNCTIONALITY**

**Regular User:**
- **Secure Onboarding**: Registration and login using **Bcrypt** hashing.
- **Transaction Engine**: CRUD operations for Income/Expenses with automatic category detection.
- **Budgeting Module**: Set monthly limits per category with 80% and 100% threshold notifications.
- **Goal Management**: Track savings with color-coded priorities and automated system-audit transactions.
- **Settings**: Manage currency (USD, EUR, GBP, INR) and notification preferences.

**System Level (Admin):**
- **Lifecycle Management**: Seeding and resetting application state for testing.
- **Audit Logging**: Traceable system-generated transactions for goal funding integrity.

**2.3 DESIGN AND IMPLEMENTATION CONSTRAINTS**

- **Data Isolation**: Unique database identifiers (`user_id`) bound to every transaction record.
- **Transactional Integrity**: Row-level locking during sensitive financial updates.
- **Serialization**: Custom JSON providers for accurate handling of `Decimal` and `Date` types.
- **Security**: CSRF protection on all mutating requests and hashed password storage.

**2.4 HARDWARE REQUIREMENTS**

- **Processor**: Dual-core 2.4 GHz (Recommended: Quad-core for DB performance).
- **RAM**: 4 GB (Server-side) / 2 GB (Client-side).
- **Connectivity**: Stable internet for external CDN dependencies (Wait for Tailwind/FontAwesome).

**2.5 SOFTWARE REQUIREMENTS**

- **Runtime**: Python 3.9+
- **Database**: MySQL 8.0+ (InnoDB Engine)
- **Frameworks**: Flask 2.0+, Flask-Login, Flask-Bcrypt
- **Frontend**: Tailwind CSS 3.0+, Chart.js, FontAwesome 6+

---

**[Page 15]**

**CHAPTER 3: MATERIAL AND METHODS**

The development process prioritized the **separation of concerns** through a structured architectural approach.

**3.1 DESIGN PHASE (Service-Repository Pattern)**

To ensure the codebase remains scalable, the logic is split into:
1. **Routes**: Handle HTTP requests and responses.
2. **Services**: Contain business logic (e.g., triggering a notification if a budget is exceeded).
3. **Repositories**: Handle raw SQL interaction (e.g., `goal_repository.py`).
4. **Models**: Define the data structure of core entities.

**3.2 DATA FLOW DIAGRAM (DFD)**

**Level 0 (Context Diagram):** High-level view of user interacting with the secure portal.

**Level 1 (Logical Process):** Illustrates the flow from Authentication -> Transaction Handling -> Business Policy Enforcement (Budgets/Goals) -> Data Persistence.

**Level 2 (Internal Calculation Flow):** 
1. User inputs transaction.
2. System fetches `Finance Summary`.
3. System calculates: `Total Income - (Expenses + Allocated Savings)`.
4. Output: Updated Balance.

---

**[Page 23]**

**3.5 DATABASE DESIGN**

The database uses a strictly relational schema (InnoDB) to ensure data consistency and referential integrity. 

**ER Diagram Analysis:**
The core of the system is the `users` table, which serves as the foreign key anchor for all other entities (`transactions`, `budgets`, `savings_goals`, `notifications`). This ensures that when a user account is deleted, all related financial history is purged automatically (CASCADE).

**Detailed Table Schema (Physical Design):**
- **users**: `user_id` (PK), `email` (Unique), `password_hash`, `currency` (Enum), `notify_flags`.
- **transactions**: `transaction_id` (PK), `user_id` (FK), `amount` (Decimal 10,2), `type` (income/expense), `category`.
- **budgets**: `budget_id` (PK), `user_id` (FK), `category`, `amount`, `month` (Index).
- **savings_goals**: `goal_id` (PK), `user_id` (FK), `target_amount`, `current_amount`, `priority`, `color`.

---

**[Page 25]**

**CHAPTER 4: IMPLEMENTATION**

The implementation transformed the blueprints into a high-performance web system. **Flask-Login** was utilized to manage the persistent authenticated state, while **Tailwind CSS** ensured a "Glassmorphism" inspired premium aesthetics.

*(Screenshots remain as previously placed, but with technically enriched captions)*

![Dashboard Hub](file:///c:/Users/soura/OneDrive/Desktop/pro/smart_expense_tracker/docs/screenshoot/Screenshot 2026-03-15 145405.png)
*Fig 4.1: Real-time dashboard utilizing the `user_finance_summary` view to display available balance and spending rates.*

![Analytics](file:///c:/Users/soura/OneDrive/Desktop/pro/smart_expense_tracker/docs/screenshoot/Screenshot 2026-03-15 145814.png)
*Fig 4.7: Data visualization layer using Chart.js to render category distributions.*

---

**[Page 31]**

**CHAPTER 5: RESULTS AND DISCUSSION**

The system successfully enforces financial boundaries. Testing revealed that the **Budget Notification Service** accurately triggers warnings when spending reaches **80%** of the allocated limit. The **Goal Allocation Logic** ensures that users remain aware of their true "spending power" by deducting saving targets from the primary balance. The use of a **Custom JSON Provider** ensured that all financial data rendered on the frontend remained accurate to two decimal places, avoiding floating-point errors common in standard JavaScript.

---

**[Page 32]**

**CHAPTER 6: CONCLUSION**

The Smart Expense Tracker project successfully demonstrates the implementation of a professional-grade financial management tool. By adopting a **Service-Repository** pattern and a secure **Modified MVC** architecture, the project achieves high technical standards and user utility. The transition from manual methods to this automated ecosystem provides users with unprecedented clarity over their wealth. Future updates will focus on **Predictive Analytics** to forecast future spending based on historical category trends.

---

**[Page 33]**

**BIBLIOGRAPHY**

1. **Pallets Projects** - Flask Documentation (Routing & Blueprints).
2. **Tailwind Labs** - Tailwind CSS Documentation (Utility-first styling).
3. **OWASP** - Best practices for password hashing (Bcrypt) and CSRF protection.
4. **MDN Web Docs** - Modern JavaScript (ES6) and AJAX implementations.
5. **Chart.js** - Dynamic data visualization documentation.
6. **APJ Abdul Kalam Technological University** - Project guidelines and standards.

---
