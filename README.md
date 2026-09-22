# Team Members:
- Lloyd Lewis
# - Ondrea Wagner
# - Naser Halloum
# - Isaiah Miller

# Campus-Resource-Rescue-System

The Campus Resource Rescue System is a website that allows students, employees, and departments to share unused items such as textbooks, electronics, furniture, and school supplies. Users #can list, search for, reserve, and pick up items. The system would reduce campus waste and save money

# Preliminary Use Cases:

Users can: Create an account, list items with descriptions and photos, search and filter available items, reserve items and schedule pickups, and view their listings and reservations.

Department managers can approve department-owned items and track savings. Administrators can manage users, review reports, and generate system-usage and sustainability reports.

# Final Python Technical Stack
The Campus Resource Rescue System will use a web-based client-server architecture. The frontend will provide the user interface, while a Python backend will manage authentication, business rules, database operations, permissions, reservations, and reporting.

# Frontend
The frontend will use **React with TypeScript**. React is suitable for building interactive pages such as the marketplace, user dashboard, reservation screens, collection-drive pages, and administrative panels. TypeScript adds type checking, which can reduce errors and make collaboration easier across the four-person team.
**Tailwind CSS** will be used for styling. It supports rapid development of responsive and consistent interfaces without requiring the team to maintain a large amount of custom CSS.

## Backend

The backend will use **Python with Django and Django REST Framework**.

Django is appropriate because the system requires user accounts, multiple roles, permissions, database relationships, administrative functions, file uploads, forms, and security controls. Many of these capabilities are already provided by Django, reducing the amount of infrastructure the team must build during the 12 to 13 week development period.

Django REST Framework will expose REST API endpoints through which the React frontend can communicate with the backend. These endpoints will support operations such as creating listings, searching for items, making reservations, completing exchanges, managing collection drives, submitting reports, and reviewing administrative information.

## Database

The system will use **MySQL with the InnoDB storage engine**.

MySQL is suitable because the project contains strongly related information, including users, roles, listings, reservations, departments, student organizations, collection drives, and reports. InnoDB provides transactions and foreign-key constraints, which help maintain data integrity.

Database access will be handled through the **Django ORM**. This allows the team to define database tables as Python models and manage database changes through Django migrations. Transactions and row locking will be used to prevent two users from reserving the same item simultaneously.

## Authentication and Security

Django’s authentication system will provide primary authentication, user sessions, password hashing, and account management.

**Duo Security** will provide multifactor authentication through the Duo Universal Prompt. After Django or the university identity provider verifies the user’s primary credentials, the user will be redirected to Duo for secondary verification. Django will create an authenticated session only after the Duo response has been successfully validated.

If the university already uses campus single sign-on with Duo, the preferred approach is to integrate the application with the university’s identity provider through **OIDC or SAML**. The university would then manage both campus credential verification and Duo authentication.

The system will use role-based authorization for the following roles:

- Campus User
- Department Representative
- Student Organization Representative
- Community Moderator
- Administrator

Authorization will also check resource ownership. For example, a user may edit only their own listing, while an authorized representative may manage listings belonging to their department or organization.

## Image Storage

Item photographs will be stored using **Cloudinary or an Amazon S3-compatible object-storage service**. The database will store the image URL and related metadata rather than placing image files directly in MySQL.

The backend will validate file type, size, and ownership before accepting or deleting an image.

## Testing

Backend tests will use **pytest and pytest-django**. Tests will cover models, permissions, API endpoints, reservation rules, exchange completion, and moderation actions.

Frontend tests will use **Vitest and React Testing Library**. **Playwright** will provide end-to-end testing of important workflows, including:

- Registration and sign-in
- Duo authentication
- Creating a listing
- Searching for an item
- Reserving an item
- Completing an exchange
- Reporting a problem
- Managing a collection drive

## Deployment and Development Tools

The project will use:

- **GitHub** for source control
- **GitHub Projects** for the Scrum backlog and sprint tracking
- **GitHub Actions** for automated tests and build verification
- **Docker** for consistent development and deployment environments
- **Render, Railway, Azure, or a university server** for backend hosting
- **A managed MySQL service** for the production database
- **Vercel or the same hosting provider** for the React frontend

The team will maintain development, testing, and production configurations using environment variables. Passwords, database credentials, and Duo client secrets will never be committed to GitHub.

## Final Stack Summary

- **Frontend:** React, TypeScript, Tailwind CSS
- **Backend:** Python, Django, Django REST Framework
- **Database:** MySQL with InnoDB
- **Database access:** Django ORM
- **Authentication:** Django authentication or campus SSO
- **Multifactor authentication:** Duo Universal Prompt
- **Image storage:** Cloudinary or Amazon S3-compatible storage
- **Backend testing:** pytest and pytest-django
- **Frontend testing:** Vitest and React Testing Library
- **End-to-end testing:** Playwright
- **API documentation:** OpenAPI with drf-spectacular
- **Source control and Scrum tracking:** GitHub and GitHub Projects
- **Automation:** GitHub Actions
- **Deployment:** Docker with managed web and database hosting

## Rationale

This stack provides a practical balance between development speed, security, technical depth, and maintainability. Python and Django reduce the amount of foundational backend code the team must write, while still allowing the project to demonstrate API design, relational database modeling, authentication, authorization, transactions, testing, and deployment.

React provides a modern and responsive interface, while MySQL meets the project’s relational-data requirements. Duo strengthens authentication and aligns the application with common university security practices.

Most importantly, the architecture is achievable by four team members over approximately six sprints. It allows the team to concentrate on the project’s central workflow of listing, finding, reserving, and exchanging reusable campus resources instead of spending excessive time creating infrastructure.
