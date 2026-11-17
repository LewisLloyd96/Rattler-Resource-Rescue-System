# Sprint Cycle IV – Sign-in, Authorization, and Data Retrieval

The first working version of the Rattler Resource Rescue System: all five roles sign in against the Sprint III MySQL database, land on their own navigation screen, are restricted to their own functions, and each runs its assigned retrieval use case on live data.

**Sign-in → Role identification → Role-based navigation → Authorization → Database-backed retrieval**

| Layer | Technology | Location |
|---|---|---|
| Frontend | React 19 + TypeScript + Tailwind (Vite) | `frontend/` |
| API | Django 5.2 + Django REST Framework | `backend/` (`rrrs_api` project, `api` app) |
| Database | MySQL 8, Sprint III schema | `Sprint Cycles/Sprint Cycle 3/Database/` |

## Contents

```text
Sprint Cycle 4/
├── README.md                          this file: requirements, run guide, tests
├── Testing/
│   ├── sprint4_api_test.py            32 automated acceptance checks against the live API + database
│   ├── sprint4_api_test_output.txt    result of the last run (32 of 32 passed)
│   └── screenshots/                   each role's landing screen and retrieval screen, invalid sign-in
└── Presentation/
    └── Sprint-IV-Presentation.pdf
```

## How the requirements are met

| Requirement | How it works | Code |
|---|---|---|
| Sign-in for all five roles | `POST /api/auth/login/` checks the email and the PBKDF2 `password_hash` in the `user` table, rejects inactive accounts, and returns a signed, short-lived token | `backend/api/authentication.py`, `views.py` (`LoginView`) |
| Identify the user’s role | The role is read from `user.role_id → role.role_name` in the database; the frontend never chooses it. `GET /api/auth/me/` re-checks the token and account on reload | `views.py` (`CurrentAccountView`) |
| Role-based landing/navigation | Each role gets its own workspace and full navigation (all planned functions shown) | `frontend/src/App.tsx` (navigation by role) |
| Authorization (not just menus) | Every API endpoint declares the roles allowed; any other role gets **HTTP 403**, no token gets **401** | `backend/api/permissions.py`, each view’s permission class |
| Retrieval from the real database | Endpoints run SQL against the Sprint III tables and views (`v_available_items`, etc.); no fixture or fallback data | `views.py`, `backend/api/db.py` |

### Assigned retrieval use cases

| Role | Sample account | Assigned use case | Screen → Endpoint |
|---|---|---|---|
| Administrator | `angela.brooks@famu.edu` | Search/browse/list users | Manage users → `GET /api/users/` |
| Campus User | `jordan2.davis@famu.edu` | Search/browse available items | Browse items → `GET /api/items/` |
| Department Representative | `robert.hayes@famu.edu` | View the department’s items and reservations | Department inventory, Reservations → `GET /api/department/` |
| Student Organization Representative | `jasmine1.carter@famu.edu` | View the organization’s listings, reservations, giveaways and drives | Listings & reservations, Drives & giveaways → `GET /api/organization/` |
| Community Moderator | `marcus.johnson@famu.edu` | View reported listings and exchange problems | Reported listings, Exchange problems → `GET /api/reports/` |

All sample accounts use the development password **`Rattler2026!`** (set by `05_demo_passwords.sql`; fictional accounts only).

## Run the application

You need: **MySQL 8.0.16+**, **Python 3.10+** (Django 5.2 does not run on the Mac’s built-in Python 3.9), and **Node.js 20+**. Use three terminals: database setup, API, frontend.

### 1. Get the latest code
```bash
cd ~/IS_Development/Rattler-Resource-Rescue-System     # or wherever you cloned it
git checkout main
git pull
```

### 2. Load the database (from the repository root)
This drops and recreates `rattler_resource_rescue`, then sets the sample passwords.
```bash
cd "Sprint Cycles/Sprint Cycle 3/Database"
mysql -u root -p < 01_schema.sql
mysql -u root -p < 02_sample_data.sql
mysql -u root -p < 05_demo_passwords.sql
cd ../../..
```
(Homebrew MySQL has no root password: leave out `-p`.)

### 3. Start the API – terminal 1

**Mac**
```bash
cd backend
python3 --version                  # must be 3.10 or newer; if not, install Python from python.org
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env               # then edit .env: DB_USER=root, DB_PASSWORD=<your MySQL root password>
python manage.py runserver 127.0.0.1:8000
```

**Windows (PowerShell)**
```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env        # then edit .env: DB_USER and DB_PASSWORD for your MySQL
python manage.py runserver 127.0.0.1:8000
```

Check it: open `http://127.0.0.1:8000/api/health/` – it must show `{"status": "ok", "database": "connected"}`.

### 4. Start the frontend – terminal 2
```bash
cd frontend
npm install
npm run dev
```
Open **http://localhost:5173** and sign in with any sample account above.

### 5. Run the acceptance tests – terminal 3 (API must be running)
```bash
python3 "Sprint Cycles/Sprint Cycle 4/Testing/sprint4_api_test.py"
```
Expected last line: `32 of 32 checks passed`.

Unit tests: `cd backend && python manage.py test` (9 tests) and `cd frontend && npm test` (15 tests).

### Troubleshooting

| Problem | Fix |
|---|---|
| `/api/health/` shows a database error | Wrong `DB_USER`/`DB_PASSWORD` in `backend/.env`, or MySQL is not running (`sudo /usr/local/mysql/support-files/mysql.server start` on a Mac installer setup, `brew services start mysql` on Homebrew) |
| Sign-in says “Email or password is incorrect” for a sample account | `05_demo_passwords.sql` has not been run on this database |
| `pip install` fails on Django | Python is older than 3.10 – install Python 3.12 from python.org and recreate the `.venv` |
| `npm: command not found` | Install Node.js 20+ from nodejs.org |
| Frontend loads but every request fails | The API is not running on `127.0.0.1:8000` (Vite forwards `/api` there) |

## Test plan and results

Run on 2026-11-17 against MySQL 8.0 with the Sprint III data (full output in `Testing/sprint4_api_test_output.txt`, screens in `Testing/screenshots/`).

| Test | Expected | Result |
|---|---|---|
| Valid sign-in, each of the 5 roles | HTTP 200, correct role from the database, correct landing screen | Pass (5/5) |
| Invalid sign-in: wrong password, unknown email | HTTP 401 “Email or password is incorrect.”, no token | Pass (2/2) |
| Administrator lists users | All 16 accounts across all five roles | Pass |
| Campus User browses items | Only `Available` items (14) | Pass |
| Department Rep views department | CIS department’s items and reservations, incl. the monitors Biology reserved | Pass |
| Student Org Rep views organization | Environmental Club’s listings, reservations, drives | Pass |
| Moderator views reports | Reported listings and exchange problems | Pass |
| No token | HTTP 401 | Pass |
| Each role opens another role’s retrieval | HTTP 403 (19 combinations; Administrators may also review reports) | Pass |

**32 of 32 checks passed.**
