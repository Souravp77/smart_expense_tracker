# SMART EXPENSE TRACKER

A MINI PROJECT REPORT
Submitted by
SOURAV P

to
the APJ Abdul Kalam Technological University in partial fulfilment of the requirements for the award of the Degree
of
Bachelor of Technology in Computer Science

Department of Computer Science Engineering
College of Engineering Trikaripur

---

## DECLARATION
We undersigned hereby declare that the project report “Smart Expense Tracker”, submitted for partial fulfillment of the requirements for the award of degree of Bachelor of Technology of the APJ Abdul Kalam Technological University, Kerala is a bonafide work done by us under supervision of Supervisor Name, Assistant Professor, Department of CSE. This submission represents our ideas in our own words and where ideas or words of others have been included, we have adequately and accurately cited and referenced the original sources. We also declare that we have adhered to ethics of academic honesty and integrity and have not misrepresented or fabricated any data or idea or fact or source in our submission. We understand that any violation of the above will be a cause for disciplinary action by the institute and/or the University and can also evoke penal action from the sources which have thus not been properly cited or from whom proper permission has not been obtained. This report has not been previously formed the basis for the award of any degree, diploma or similar title of any other University.

Place: Cheemeni
Date:
SOURAV P

---

## CERTIFICATE
This is to certify that the report entitled “SMART EXPENSE TRACKER”, submitted by Sourav P to the APJ Abdul Kalam Technological University in partial fulfillment of the requirements for the award of the Degree of Bachelor of Technology in Computer Science is a bonafide record of the mini project carried out by him under my guidance and supervision. This report in any form has not been submitted to any other University or Institute for any purpose.

Project Coordinator
Name

---

## ACKNOWLEDGEMENT
We give honour and praise to the LORD who gave us wisdom and enabled us to complete this mini project successfully.
We are extremely grateful to Dr. Mahesh V V, Principal, College of Engineering Trikaripur, Cheemeni, providing necessary facilities.
With immense pleasure and heartiest gratitude, we express our sincere thanks to Dr. Naveena A K, Associate Professor and Head of CSE Department.
We would like to express our deep gratitude to our Co-ordinators/Guides for their timely suggestions and encouragement through the processes involved in the presentation of the project.
Last, but not the least, we express our heartfelt thanks to our friends and parents for their support and encouragement during this endeavour.

SOURAV P

---

## VISION (Institution)
To be a premier institution in education and research for moulding technically competent and socially committed professionals.

## MISSION (Institution)
(i) Promote interdisciplinary research and innovation so as to meet the current needs of industry and society.
(ii) Attract, nurture and retain the best faculty and technical man power.
(iii) Provide state of art facility for quality technical education.
(iv) Develop personality and professional skills of the students through interaction with alumni academia and industry.

## VISION (Department)
To mould technically competent and socially committed professionals in the field of computer science.

## MISSION (Department)
(i) To provide a strong foundation in theoretical and practical aspects of computer science.
(ii) To impart technical skills necessary to generate quality professional according to industry needs.
(iii) To develop human resource with the ability to apply the knowledge for the benefit of the society.

---

## ABSTRACT
Manage your personal finances effortlessly with the Smart Expense Tracker designed to simplify and enhance the financial tracking experience. This platform enables users to log in securely using their credentials and track their income and expenses based on different categories. Users can set their monthly budgets, and add customized savings goals to begin planning for a stable financial future.

The system allows users to personalize every aspect of their spending tracking, including adding multiple expense categories, configuring a preferred currency, and managing notification settings. An intelligent tracking feature enhances user convenience by automatically calculating the available balance, total savings, and spending rate based on logged transactions and predefined saving targets.

With an interactive dashboard integration, users can view intuitive charts outlining category distributions and financial trends. The system also provides access to transaction history, enabling users to review or manage their previous entries easily. By combining visual analytics, smart budget alerts, and efficient record management, the platform ensures a hassle-free and personalized financial planning experience while saving time and improving decision-making for users.

---

## CONTENTS
1. ABSTRACT
2. LIST OF FIGURES
3. ABBREVIATIONS
4. INTRODUCTION
   1.1 BACKGROUND
   1.2 SCOPE
   1.3 OBJECTIVE
   1.4 PROPOSED SYSTEM
5. SOFTWARE REQUIREMENT SPECIFICATION
   2.1 PRODUCT OVERVIEW
   2.2 PRODUCT FUNCTIONALITY
   2.3 DESIGN AND IMPLEMENTATION CONSTRAINTS
   2.4 HARDWARE REQUIREMENTS
   2.5 SOFTWARE REQUIREMENTS
   2.6 FUNCTIONAL REQUIREMENTS
6. MATERIAL AND METHODS
   3.1 DESIGN PHASE
   3.2 DATA FLOW DIAGRAM
   3.3 ACTIVITY DIAGRAM
   3.4 USE CASE DIAGRAM
   3.5 DATABASE DESIGN
7. IMPLEMENTATION
8. RESULTS AND DISCUSSIONS
9. CONCLUSION
10. BIBLIOGRAPHY

---

## LIST OF FIGURES
3.2 Data Flow Diagram
3.3 Activity Diagram
3.4 Use case Diagram
3.5 Database Design
4.1 User login
4.2 Register
4.3 Dashboard View
4.4 Transaction Input Interface
4.5 Budget Configuration
4.6 Savings Goal Milestones
4.7 Interactive Spending Analytics
4.8 System Notifications Center

---

## ABBREVIATIONS
- HTML – Hypertext Markup Language
- CSS – Cascading Style Sheets
- JS – JavaScript
- UI – User Interface
- API – Application Programming Interface
- DBMS – Database Management System
- MySQL – My Structured Query Language
- DFD – Data Flow Diagram
- MVC – Model-View-Controller

---

## INTRODUCTION
The Smart Expense Tracker is developed to provide a convenient and efficient way for users to plan and manage their personal finances digitally. Users can log in securely and record their daily financial activities by specifying amount, category, and date, making the tracking process simple and user-friendly.

The system offers a wide range of facilities, including logging income and expenses, setting budget limits, and managing personalized savings goals. An intelligent budget monitoring feature enhances the experience by proactively alerting the user when their spending reaches predefined thresholds.

With dynamic dashboard visualizations and instant data updates, users can analyze their financial patterns quickly. The platform also maintains a permanent transaction history for easy access and future audits. By reducing manual calculation effort, saving time, and offering personalized visual reports along with proactive notification features, the system provides an engaging and attractive financial management experience that encourages users to shift from traditional ledgers to a smarter digital solution.

### 1.1 BACKGROUND
The existing financial tracking systems do not provide users with a centralized platform to manage all aspects of their economy efficiently. Users often rely on paper diaries or basic spreadsheets to record transactions, which leads to confusion, calculation errors, increased time consumption, and lack of visual insights.

In the current system, users do not receive proactive warnings based on their spending relative to their monthly budget. There is also no integrated facility to explore spending trends intuitively or to intelligently partition funds towards long-term savings goals securely.

Additionally, the absence of an automated balance calculation makes it difficult for users to track their actual available funds accurately. Due to these limitations, personal finance management becomes inefficient, less engaging, and often results in poor financial decision-making and uncontrolled spending.

### 1.2 SCOPE
The scope of the Smart Expense Tracker is to provide a complete and user-friendly platform for tracking and managing personal finances in one place. It allows users to manage their wealth based on their needs, including daily transactions, monthly budgets, and long-term saving priorities.

The system covers key functionalities such as expense logging, income recording, threshold-based budget alerts, and savings goal milestones. It also offers interactive charting components to visualize categorical spending and temporal trends effectively.

The platform supports robust data persistence, instant dashboard updates, and access to transaction history. Overall, it aims to reduce calculation time, improve transparency, and deliver a personalized and efficient financial planning experience.

### 1.3 OBJECTIVE
The main objective of the Smart Expense Tracker is to simplify and modernize personal finance tracking through a single user-friendly platform. It enables users to record transactions instantly based on category, date, and type, reducing the manual effort of bookkeeping.

The system provides key features such as budget enforcement, saving goal management, category customization, and real-time dashboard analytics, along with intelligent threshold notifications.

By maintaining a structured database, ensuring fast and accurate calculations, and offering an easy-to-use modern interface, the system helps users manage cash flows and access financial history efficiently. Overall, it enhances financial awareness, improves decision-making, and delivers a controlled economic management experience.

### 1.4 PROPOSED SYSTEM
The proposed Smart Expense Tracker offers a modern, visual approach to financial planning by replacing traditional physical ledgers with a fully automated digital platform. Users can log in securely and manage their economy by entering their daily income and expenses. The system enables dynamic tracking of balances, incorporating budget monitoring and milestone-oriented savings goals.

Unlike conventional spreadsheets, it incorporates an intelligent analytics module that recommends spending adjustments by displaying real-time doughnut charts and variance bars based on the user’s logged data. The system supports a secure database backend and maintains a permanent transaction history for future reference.

Overall, the proposed system enhances awareness, financial discipline, and efficiency, significantly reducing manual effort and improving the overall personal finance management experience.

---

## SOFTWARE REQUIREMENT SPECIFICATION
This chapter discusses the overall description of the system, including product overview, product functionality and design and implementation constraints. It also specifies the software and hardware requirements of the system.

### 2.1 PRODUCT OVERVIEW
Track and manage personal finances easily through a digital platform. Enables users to record income, log expenses, define monthly budgets, and establish savings goals. Provides intelligent visual analytics and proactive notifications warning users before they overspend. Supports secure data storage and real-time calculation updates while maintaining a full transaction history. Eliminates the need for manual calculations and paper ledgers, offering a smarter and more transparent financial experience.

### 2.2 PRODUCT FUNCTIONALITY
**User: Regular User**
Functions: The user can securely log in to the system and initiate financial tracking by uploading their income and daily expenses. Based on these inputs, the user can review their financial status by interacting with the dashboard, creating monthly budget limits, and establishing savings goals.
The system assists the user with intelligent calculations, ensuring the "Available Balance" automatically reflects the income minus the expenses and allocated saving targets. The user can view visual distribution charts and progress bars. Additionally, the user can manage their personal profile settings such as currency choice and view historical transactions.

### 2.3 DESIGN AND IMPLEMENTATION CONSTRAINTS
- The system must be developed using standard web technologies compatible with common devices and modern browsers.
- The application should ensure secure user authentication and data privacy via Bcrypt password hashing.
- The system should handle real-time balance calculations smoothly, utilizing a responsive frontend.
- The design must be user-friendly and aesthetically pleasing, utilizing Tailwind CSS for glassmorphism styling.
- Data storage and processing rely on a scalable relational database structure.
- Implementation should follow the technical constraints defined for a Flask-based backend server.

### 2.4 HARDWARE REQUIREMENTS
- Computer/Device: Minimum 2 GHz multi-core processor (PC, laptop, or smartphone)
- Memory (RAM): At least 4 GB (8 GB recommended for better performance during development)
- Storage: Minimum 500 MB free disk space (Includes Python environment)
- Display: Minimum resolution of 1366 × 768 (1920 × 1080 recommended)
- Network: Internet connection for external CDN dependencies (Tailwind script)

### 2.5 SOFTWARE REQUIREMENTS
- Technology Used: Python (Flask Framework), JavaScript, HTML, CSS (Tailwind)
- IDE: Visual Studio Code (VS Code)
- Front-end: HTML5, Tailwind CSS, Vanilla JS
- Back-end: Python Flask
- Database: MySQL

### 2.6 FUNCTIONAL REQUIREMENTS
**User: Regular User**
- Register: Users must register on the platform with an email and password to access features.
- Login: Registered users can securely log in to the system to access their personal dashboard.
- Log Transactions: Users can submit daily expenses and income entries.
- Manage Budgets: Users can define specific spending limits for various categories.
- Track Goals: Users can create and monitor savings objectives with attached monetary targets.
- View Analytics: Users can view intelligent charts breaking down their spending habits.
- Receive Notifications: Users are alerted when approaching budget limits or achieving saving milestones.

---

## MATERIAL AND METHODS
The Smart Expense Tracker is developed using modern web technologies to ensure efficiency and usability. The frontend is built using Tailwind CSS and Vanilla JavaScript for an interactive and visually appealing interface, while the backend is implemented using Python Flask to handle application logic and server-side operations securely. MySQL is used as the relational database for storing user, budget, goal, and transaction information.
System design is carried out using ER Diagrams, Use Case Diagrams, and Activity Diagrams to represent the workflow and functionality of the system in a structured manner.

### 3.1 DESIGN PHASE
The design phase provides a visual representation of the architecture of the Smart Expense Tracker. It illustrates how the main modules—User Authentication Module, Transaction Management Module, Budget & Goal Module, and Notification Module—are interconnected. By isolating routing from the database using a Repository/Service pattern, the phase ensures a clear workflow, robust data handling, and a flexible system design.

### 3.2 DATA FLOW DIAGRAM
The Data Flow Diagram (DFD) illustrates the overall structure of the Smart Expense Tracker. It depicts how users provide fundamental inputs like expenses, incomes, and budgets, and how the system processes this data through various control modules. It also showcases the interaction between the system services and the MySQL database ensuring accurate retrieval of balance summaries and notifications.

### 3.3 ACTIVITY DIAGRAM
An activity diagram visually represents the sequence of actions and flow of control in the Smart Expense Tracker. It illustrates the step-by-step process starting from user authentication, entering transaction data, updating the backend ledger, and dynamically updating the frontend dashboard with newly computed balances and charts. It models the concurrent updates to the system notifications effectively.

### 3.4 USE CASE DIAGRAM
A use case diagram represents the interactions between users and the Smart Expense Tracker system. It illustrates the various functionalities accessible to the user, such as Registration, Login, Adding Transactions, Setting Budgets, and Managing Profile Settings. It provides a generalized overview of how a standard actor leverages the features of the system.

### 3.5 DATABASE DESIGN
Database design is a systematic process of organizing, storing, and managing data to ensure efficient retrieval, consistency, and integrity of financial information. In the Smart Expense Tracker, the relational schema plays a vital role in recording transactions securely and mapping them to specific users.
The logical design focuses on identifying core entities like Users, Transactions, Budgets, Savings Goals, and Notifications.
The physical design involves translating this logic into MySQL tables with appropriate primary keys (`user_id`, `transaction_id`) and foreign keys connecting records back to the registered user.
Features like cascading deletes (`ON DELETE CASCADE`) are implemented to ensure that if a user removes an account, all linked financial data is safely cleaned up, preventing redundant database bloat. This robust design guarantees the necessary accuracy required for financial reporting applications.

---

## IMPLEMENTATION
Implementation is the phase where the theoretical design is transformed into a functional application. In this stage, the backend API endpoints were built in Flask, integrated with the MySQL database, and attached to the dynamic styling of the frontend.
Users interact with the system by authenticating securely. Upon a successful login, they land directly on a live dashboard populated with their financial footprint securely fetched from the database.
Transactions can be immediately registered via intuitive modal dialogs. Features like savings goals updates and budget verifications run seamlessly in the background, computing new balances.
The system is built to intercept invalid entries and render user-friendly warnings or success notifications via a toast message system. Overall implementation emphasizes responsive feedback and robust backend data processing.

*(Refer to actual application screenshots for visual context of the login screens, dashboard overview, chart rendering, and transaction modals)*

---

## RESULTS AND DISCUSSIONS
As per the objectives of the project, the Smart Expense Tracker has been successfully developed and deployed to a functional state. The frontend of the system has been styled efficiently using Tailwind CSS, providing a modern, premium layout that is highly responsive.

On the backend, Python Flask seamlessly orchestrates the business logic, processing transactions quickly and ensuring that the logical separation between user data is strictly maintained. The MySQL database manages multiple relational tables (users, transactions, budgets, goals, notifications) flawlessly. The application handles user authentication securely with Bcrypt password hashing.

The inclusion of interactive data visualization (Chart.js) provides immediate understanding of personal spending, and the proactive threshold-based notification system correctly alerts users to their budgetary status. 

Overall, the final product demonstrates effective integration between a robust Python backend service and a dynamic web frontend, offering a holistic and secure platform for personal finance management.

---

## CONCLUSION
The Smart Expense Tracker provides a simple, highly effective platform for users to take control of their personal finances. The system enables users to monitor their balances, record daily transactions, enforce spending limits, and cultivate long-term saving habits in a central location.

By integrating modern solutions such as real-time dashboard analytics and system-triggered notifications, the application dramatically enhances user awareness regarding their economic behavior. It transforms the traditionally tedious task of ledger accounting into an engaging, visual experience.

The implementation using Python Flask, Tailwind CSS, and MySQL guarantees high performance, structural integrity, and long-term maintainability. In summary, the system successfully modernizes money management, proving to be a valuable tool for anyone looking to achieve financial stability and transparency.

---

## BIBLIOGRAPHY
### WEBSITES
- https://flask.palletsprojects.com/
- https://tailwindcss.com/docs
- https://www.chartjs.org/docs/latest/
- https://developer.mozilla.org/en-US/docs/Web/JavaScript
- https://dev.mysql.com/doc/
- https://www.geeksforgeeks.org/

### BOOKS
- Pankaj Jalote, An Approach to Software Engineering, 3rd Edition, Narosa Publishing House, 2005.
- Alexis Leon & Mathews Leon, Database Management Systems, Vikas Publishing House.
- Roger S. Pressman, Software Engineering: A Practitioner’s Approach, McGraw-Hill.
