# Rattler Resource Rescue System – Frontend

The React + TypeScript frontend uses the Django API to sign users in and retrieve Sprint Cycle III database records. It does not contain database credentials or local fallback records.

Implemented role-based read workflows:

- Administrator: search and filter database users.
- Campus User: search and filter available listings.
- Department Representative: view department listings and related reservations.
- Student Organization Representative: view organization listings, reservations, collection drives, giveaways, and contributed items.
- Community Moderator: search and filter reported listings and exchange problems.

## Run the application

Requires Node.js 20+ and the backend/MySQL database running. See [the backend setup guide](../backend/README.md).

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL, normally `http://localhost:5173`. Vite forwards `/api` requests to `http://127.0.0.1:8000`; optionally set `VITE_API_BASE_URL` in a local `.env` file to change the API address.

The local sample account password is `Rattler2026!` after applying `Sprint Cycles/Sprint Cycle 3/Database/05_demo_passwords.sql`. The role is read from the database, not chosen in the frontend.

## Validation

```powershell
npm test
npm run build
```
