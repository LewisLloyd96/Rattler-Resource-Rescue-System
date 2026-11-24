# Rattler Resource Rescue API

This Django REST API connects the React frontend to the Sprint Cycle III MySQL database, `rattler_resource_rescue`. Database credentials stay in ignored local `.env` files; the browser only calls this API.

## Configure and run

Requires Python 3.11+ and MySQL 8.0.16+ with the Sprint III schema loaded.

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

For a local container, copy `.env.example` to the repository root as `.env`, replace both placeholder passwords with random values, and start MySQL from the repository root:

```powershell
docker compose up -d mysql
docker compose ps
```

Compose initializes a fresh MySQL 8.4 data volume from the Sprint III schema, sample data, sample-password script, and application grants. Do not run `01_schema.sql` against a database containing data you need; it drops and recreates the database. The local Docker account is `rrrs_app` and receives table-level SELECT access plus only the INSERT/UPDATE privileges required by the API workflows and permission to execute the `reserve_item` stored procedure.

Docker only runs initialization scripts when the data volume is first created. To apply the current restricted API grants to an existing volume without reinitializing or deleting its data, run this from the repository root:

```powershell
Get-Content -Raw 'Sprint Cycles\Sprint Cycle 3\Database\06_app_read_grants.sql' | docker compose exec -T mysql sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql --user=root --database=rattler_resource_rescue'
```

Edit `backend/.env` and set `DB_USER` and `DB_PASSWORD` to the MySQL account that can read the application tables. For the Compose setup, `DB_USER` is `rrrs_app`, `DB_PASSWORD` must match `MYSQL_APP_PASSWORD` in the repository `.env`, and `DB_NAME` is `rattler_resource_rescue`. Set a local-only random `DJANGO_SECRET_KEY`.

The Sprint III sample rows have example, non-verifiable password strings. Compose applies `05_demo_passwords.sql` during first-time initialization. For an already populated database, run that script once manually. It assigns the shared development password `Rattler2026!` to the fictional seed accounts; do not use it for real accounts.

Sample sign-in emails after applying that script:

| Role | Email |
| --- | --- |
| Administrator | `angela.brooks@famu.edu` |
| Campus User | `jordan2.davis@famu.edu` |
| Department Representative | `robert.hayes@famu.edu` |
| Student Organization Representative | `jasmine1.carter@famu.edu` |
| Community Moderator | `marcus.johnson@famu.edu` |

Start the API:

```powershell
python manage.py runserver 127.0.0.1:8000
```

Check database connectivity at `http://127.0.0.1:8000/api/health/`. A MySQL configuration or server error is reported by the API rather than replaced with local fixture data.

In another terminal, run the frontend:

```powershell
cd frontend
npm install
npm run dev
```

Vite proxies `/api` requests to the local Django server. No database URL, password, or other database credential belongs in the frontend.

## Sprint V database permissions

If Django connects as the Docker `rrrs_app` user and the MySQL volume already exists, reapply
[06_app_read_grants.sql](../Sprint%20Cycles/Sprint%20Cycle%203/Database/06_app_read_grants.sql)
using a MySQL administrator account. Docker applies initialization scripts only when creating a
new volume. The grant script updates permissions without resetting application data.

## Implemented endpoints

| Endpoint | Access | Use |
| --- | --- | --- |
| `POST /api/auth/login/` | Public | Verify the database password hash and return the user’s role and short-lived signed token |
| `GET /api/auth/me/` | Signed-in user | Restore and validate the current database account |
| `GET /api/users/` | Administrator | Search users and filter by role |
| `PATCH /api/users/<user_id>/status/` | Administrator | Activate or deactivate an account and record the administrator's justification |
| `GET /api/items/` | Campus User | Search and filter available items |
| `POST /api/items/<item_id>/reserve/` | Campus User | Reserve a free available item |
| `POST /api/items/create/` | Campus User | Submit a free item listing; review behavior follows the system setting |
| `GET /api/my-items/`, `PATCH /api/my-items/<item_id>/` | Campus User | View and remove personal listings |
| `GET /api/reservations/`, `POST /api/reservations/<reservation_id>/cancel/` | Campus User | View and cancel personal reservations |
| `GET /api/messages/`, `POST /api/messages/` | Campus User | Read exchange messages and contact another active campus account |
| `GET /api/categories/` | Administrator, Campus User, Department Representative | Browse categories. Campus users and department representatives see active categories only. |
| `POST /api/categories/`, `PATCH /api/categories/<category_id>/` | Administrator | Create categories and update category rules or active state |
| `GET /api/activity-reports/` | Administrator, Department Representative | View system or department activity totals |
| `GET /api/settings/`, `PATCH /api/settings/` | Administrator | View and update validated application settings |
| `GET /api/department/profile/`, `PATCH /api/department/profile/` | Department Representative | View and update department contact details |
| `GET /api/organization/profile/`, `PATCH /api/organization/profile/` | Student Organization Representative | View and update organization contact details |
| `GET /api/department/` | Department Representative | Read the representative’s department listings and related reservations |
| `POST /api/department/listings/`, `PATCH /api/department/listings/<item_id>/` | Department Representative | Create department-owned listings and edit available or pending department listings |
| `POST /api/organization/events/` | Student Organization Representative | Create a collection drive or giveaway for the representative's approved organization |
| `GET /api/organization/` | Student Organization Representative | Read organization listings, reservations, drives, giveaways, and contributed items |
| `GET /api/reports/` | Administrator, Community Moderator | Search reports; `status=queue` returns open/under-review reports, while `items_only=true` returns reported items with owner and distinct reported-listing counts |
| `PATCH /api/reports/<report_id>/` | Administrator, Community Moderator | Change report review status. Moderators record the action taken when resolving or dismissing a report. |
| `GET /api/admin/pending-listings/`, `PATCH /api/admin/pending-listings/<item_id>/` | Administrator | Review and approve or reject submitted campus listings |
| `GET /api/moderation/actions/` | Community Moderator | Review moderation action history |

Role checks are enforced by the API as well as by the frontend navigation.

## Tests

```powershell
python manage.py test
```

The API tests mock database access so they can run without a MySQL server. The health endpoint and live data queries require the configured database.
