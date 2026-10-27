# ShareMeal

ShareMeal is a responsive food donation and community distribution platform. Donors list surplus food, approved NGOs request suitable listings, organizations assign volunteers, volunteers confirm pickup, and NGOs record distribution.

> **This is a development foundation, not a fully launched service.** MongoDB Atlas must be configured for accounts, profiles, searches and records. Address geocoding, maps, private document storage, email delivery, external NGO identity checks and automated food-safety certification are not configured. NGO registration never grants approved status.

## Features

- Public home, About, How It Works, food search, NGO discovery/profile, contact, food safety, privacy and terms pages.
- Donor/NGO registration, sign-in, profile editing and password changes.
- HttpOnly session cookie, CSRF-token protection, role/ownership guards and bcrypt password hashes.
- NGO application metadata and administrator approval/rejection/needs-information review.
- Donation food-handling details, optional GeoJSON location, private pickup addresses and auditable workflow history.
- Search by text, city, category, food type, deadline, distance and pagination.
- NGO request and donor approval; volunteer assignment, pickup confirmation and distribution records.
- In-app notifications, role-specific database-backed dashboards, admin user/contact moderation and audit logs.
- Unexpired-listing discovery and a periodic expiration worker.

## Technology

- Frontend: React 18, Vite, React Router 7, Axios, Lucide React, responsive CSS and ESLint.
- Backend: Node.js, Express, MongoDB Atlas/Mongoose, JWT, bcryptjs, cookie-parser, express-validator, Helmet, credentialed CORS and rate limiting.
- Tests: Node.js built-in test runner (no real database required for the ordinary unit/API test suite).

## Structure

```text
ShareMeal/
├── backend/
│   ├── src/{config,controllers,middleware,models,routes,services,utils,validators}/
│   ├── tests/
│   ├── .env.example
│   └── package.json
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── DATABASE.md
│   ├── SECURITY.md
│   ├── FOOD_SAFETY.md
│   └── DEPLOYMENT.md
├── frontend/src/{assets,components,context,hooks,layouts,pages,routes,services,styles,utils}/
├── frontend/package.json
└── package.json
```

## Prerequisites

- Windows 10/11, PowerShell and VS Code (recommended)
- Node.js 20.19+ or 22.12+ (Node.js 24 LTS works) and npm
- MongoDB Atlas for database-backed functionality
- Git for Windows is optional; install Git separately if you want to initialize/version this workspace

```powershell
node --version
npm.cmd --version
```

## Installation

Open two PowerShell terminals at the ShareMeal folder:

```powershell
npm.cmd install --prefix backend
npm.cmd install --prefix frontend
```

## Environment setup

`backend/.env` is ignored by Git and was created locally with a randomly generated development JWT secret. For a new checkout:

```powershell
if (-not (Test-Path backend\.env)) { Copy-Item backend\.env.example backend\.env }
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Put the generated value in `JWT_SECRET` in `backend\.env`. Do not send it to the frontend, paste it into source, or reuse it in production.

```dotenv
PORT=5000
NODE_ENV=development
MONGODB_URI=
JWT_SECRET=your-generated-local-secret
JWT_EXPIRES_IN=1d
FRONTEND_URL=http://localhost:5173
COOKIE_SAME_SITE=strict
GEOCODING_API_KEY=
```

`GEOCODING_API_KEY` is reserved for a future server-side address provider; the current code does not call a geocoder. Keep provider keys on the backend. `COOKIE_SAME_SITE=strict` expects frontend and API on the same site (`localhost` in development).

### Configure MongoDB Atlas

1. Create a cluster and database user with a strong unique password.
2. Add only your development IP to Atlas Network Access.
3. Use **Connect → Drivers** to copy the Node.js connection string.
4. Replace its credentials and database name; URL-encode special characters in the password.
5. Add the URI to ignored `backend\.env` as `MONGODB_URI=...`.
6. Restart the backend and check the API's startup message and health response.

Never commit/share the URI. Use a least-privilege database user. If no URI is configured, the backend starts in limited mode and reports MongoDB as unavailable; database features return a clear service error instead of fake records.

### Provision an administrator

Public registration accepts only donor/NGO roles. After verifying an account and database through an authorized operational process, a trusted database operator can set that account's `role` to `admin`. Keep the initial admin process auditable and credentials private. Admin can review applications at **Admin → NGO review**. Only approved NGOs can request food or schedule collections.

## Start the application

Terminal 1:

```powershell
npm.cmd run dev:backend
```

Terminal 2:

```powershell
npm.cmd run dev:frontend
```

- Web app: <http://localhost:5173>
- API base: <http://localhost:5000/api>
- API health: <http://localhost:5000/api/health>

Vite runs on `localhost` so the strict same-site cookie policy works with the API. If you change the web origin, update `FRONTEND_URL` and review CORS/cookie/CSRF settings.

## Security and session notes

The browser stores the JWT in an HttpOnly cookie, not localStorage or an API JSON response. A separate readable, session-bound CSRF cookie is echoed in an `X-CSRF-Token` header for unsafe requests. Logout/password change bump the account token version. Production uses Secure cookies and needs HTTPS. Cross-site hosting requires deliberate cookie/CORS/CSRF review; see [docs/SECURITY.md](docs/SECURITY.md).

## NGO review and location

An NGO account starts `not_submitted`. It must submit organization metadata, then an admin reviews the application. Document uploads are deliberately disabled: private storage and access controls are not configured, so do not upload sensitive documents.

City-based search needs no external provider. Nearby distance search accepts coordinates entered manually or obtained after the user explicitly chooses browser location. No fake locations are shown. Address geocoding and map display are optional future integrations; review provider quotas and terms before enabling them.

## Tests and checks

```powershell
npm.cmd run lint
npm.cmd run build
npm.cmd test
npm.cmd run check --prefix backend
npm.cmd audit --prefix frontend
npm.cmd audit --prefix backend
Invoke-RestMethod http://localhost:5000/api/health
```

Ordinary tests do not need Atlas. See [docs/DATABASE.md](docs/DATABASE.md) before adding integration tests; use an isolated test database and never production.

## Deployment

Build the static frontend with `npm.cmd run build --prefix frontend`; deploy `frontend/dist` with SPA fallback. Deploy the backend as a Node service bound to the port provided by the host. Configure `VITE_API_URL` at build time, and set backend `FRONTEND_URL`, production Atlas URI, high-entropy secret, `NODE_ENV=production`, HTTPS and reviewed cookie policy. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) before any real-user deployment.

## Limitations and responsible use

- ShareMeal does not inspect, certify, store or transport food. The platform never claims a form proves safety.
- Donor-supplied recipient counts are estimates, not verified impact.
- No production seed/demo accounts are included and the app does not silently seed records.
- No private verification-document upload, email notification, geocoding service or map provider is configured.
- The example privacy/terms copy needs jurisdiction-specific legal review before launch.

Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/API.md](docs/API.md), and [docs/FOOD_SAFETY.md](docs/FOOD_SAFETY.md) for workflow, endpoint and responsible-handling details.

## Troubleshooting

- **PowerShell says `npm.ps1` is blocked**: use `npm.cmd`, not a policy change.
- **MongoDB unavailable**: check the ignored `.env`, URI encoding, Atlas network allowlist and database-user permissions.
- **CORS or cookie errors**: use `http://localhost:5173` and `http://localhost:5000`; make `FRONTEND_URL` exact and restart API. Do not mix `127.0.0.1` and `localhost`.
- **CSRF failure**: refresh the page, verify cookies are enabled and confirm frontend origin matches `FRONTEND_URL`.
- **NGO cannot request food**: submit an application and wait for administrator approval.
- **Address already in use**: stop the service using port 5000 or 5173, or configure a different port and matching API/CORS URL.
