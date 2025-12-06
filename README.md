# Gachapon API (Express + MySQL)

Minimal API for authentication and gachas (example for local dev).
# Gachapon API (Express + MySQL)

Minimal API for authentication and gachas (example for local dev).

Setup

1. Copy `.env.example` to `.env` and set your DB credentials and JWT_SECRET.

2. Apply migrations to your MySQL database:

```powershell
mysql -u root -p gachapon < migrations/001_init.sql
```

3. Install dependencies and start server:

```powershell
npm install
npm run dev
```

4. Open `login.html` (or your existing `index.html`) and use the API endpoints under `/api`.

Notes

## Integration / smoke tests

Quick manual + automated smoke test instructions to verify API and basic flows.

1) Ensure server and static front-end are running

```powershell
npm install
npm run dev        # starts API (default port 4000)
# in a separate shell (serve static files)
# python -m http.server 5500
```

2) Seed an admin (optional if already done)

```powershell
node scripts/seed-admin.js
```

3) Manual check (browser)

- Open `http://localhost:5500/login.html` (or `127.0.0.1:5500`) and try logging in with the admin created above.
- Confirm Network tab shows requests to `http://localhost:4000/api/...` and they return 200/201.

4) Automated smoke test (Node script)

This repo includes a simple Node smoke test at `tests/api-smoke.js` that performs: GET /, POST /api/auth/login, GET /api/auth/me, POST /api/gachas, GET /api/gachas, GET /api/gachas/:id, DELETE /api/gachas/:id.

It reads admin credentials from `.env` (keys `ADMIN_EMAIL` and `ADMIN_PASS`) or environment variables. Run:

```powershell
node tests/api-smoke.js
```

If the script reports `SMOKE TEST PASSED` the basic API flows are working.
# gachapon
授業課題JAVA
