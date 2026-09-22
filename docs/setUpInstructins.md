## Setup Instructions

### Prerequisites

Install the following software before setting up the project:

- **Git**
- **Python 3.11 or later**
- **Node.js 20 or later**
- **npm**
- **MySQL 8.0 or later**
- **Docker Desktop**, optional

Verify the installations:

```bash
git --version
python3 --version
node --version
npm --version
mysql --version
```

### 1. Clone the Repository

Replace the example URL with the URL of the team’s GitHub repository.

```bash
git clone https://github.com/TEAM-NAME/Campus-Resource-Rescue-System.git
cd Campus-Resource-Rescue-System
```

### 2. Backend Setup

Navigate to the backend folder:

```bash
cd backend
```

Create a Python virtual environment:

```bash
python3 -m venv venv
```

Activate the virtual environment.

On macOS or Linux:

```bash
source venv/bin/activate
```

On Windows PowerShell:

```powershell
.\venv\Scripts\Activate.ps1
```

Install the backend dependencies:

```bash
pip install -r requirements.txt
```

### 3. Create the MySQL Database

Sign in to MySQL:

```bash
mysql -u root -p
```

Create the development database:

```sql
CREATE DATABASE campus_resource_rescue
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

Exit MySQL:

```sql
EXIT;
```

### 4. Configure Environment Variables

Create a `.env` file inside the `backend` folder.

```env
DJANGO_SECRET_KEY=replace-with-a-local-secret-key
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

DB_NAME=campus_resource_rescue
DB_USER=root
DB_PASSWORD=replace-with-your-mysql-password
DB_HOST=localhost
DB_PORT=3306

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

DUO_CLIENT_ID=
DUO_CLIENT_SECRET=
DUO_API_HOST=
```

Cloudinary and Duo values may remain empty until those services are configured.

Do not commit the `.env` file or any passwords, database credentials, API keys, or Duo secrets to GitHub.

### 5. Prepare the Django Application

Apply the database migrations:

```bash
python manage.py migrate
```

Optional: Create an administrator account:

```bash
python manage.py createsuperuser
```

Start the Django development server:

```bash
python manage.py runserver
```

The backend should be available at:

```text
http://127.0.0.1:8000/
```

### 6. Frontend Setup

Open a second terminal and navigate to the frontend folder from the repository root:

```bash
cd frontend
```

Install the frontend dependencies:

```bash
npm install
```

Create a `.env` file inside the `frontend` folder:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

Start the React development server:

```bash
npm run dev
```

The terminal will display the local frontend address. It will typically be:

```text
http://localhost:5173/
```

### 7. Run the Tests

Run the backend tests from the `backend` folder:

```bash
pytest
```

Run the frontend tests from the `frontend` folder:

```bash
npm run test
```

Run the end-to-end tests after the Playwright configuration has been added:

```bash
npx playwright test
```

Automated tests are not required during Sprint Cycle 0, but these are the planned testing commands for later sprint cycles.

### 8. Pull the Latest Team Changes

Before beginning work, retrieve the newest version of the project:

```bash
git pull origin main
```

After all team members have submitted their Sprint Cycle 0 contributions, run the command again and verify that the changes are available locally.

### 9. Basic Git Workflow

Create a branch for your contribution:

```bash
git checkout -b documentation/your-name
```

Stage and commit your work:

```bash
git add .
git commit -m "Add Sprint Cycle 0 documentation"
```

Push the branch to GitHub:

```bash
git push -u origin documentation/your-name
```

Each team member must use their own GitHub account to make at least one nonfunctional contribution during Sprint Cycle 0.

### Troubleshooting

If `python3` is unavailable on Windows, try:

```powershell
python --version
python -m venv venv
```

If the backend cannot connect to MySQL, confirm that:

- MySQL is running.
- The database has been created.
- The database name, username, password, host, and port are correct.
- The backend virtual environment is active.
- All required Python packages have been installed.

If the frontend cannot reach the backend, confirm that both development servers are running and that `VITE_API_BASE_URL` contains the correct backend address.
