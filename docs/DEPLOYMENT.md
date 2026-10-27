# Deployment guide

This repository is a development foundation, not a fully certified production service.

## Local development

Install dependencies from the project root:

```powershell
npm.cmd install --prefix backend
npm.cmd install --prefix frontend
```

Copy `backend/.env.example` to `backend/.env`, generate a unique local `JWT_SECRET`, and add a real MongoDB connection string to `MONGODB_URI` when available. Copy `frontend/.env.example` to `frontend/.env.local` if you need to change the API URL; the default points to `http://localhost:5000/api`.

Run the services independently in two terminals:

```powershell
cd backend
npm.cmd run dev
```

```powershell
cd frontend
npm.cmd run dev
```

Without `MONGODB_URI`, the API still responds to `/api/health` and starts in limited mode. Account, donation, profile, search and dashboard operations return a clear database-unavailable error; no demo records are substituted.

## MongoDB Atlas

1. Create a cluster and a least-privilege database user.
2. Restrict Atlas network access to the Render service's egress addresses where practical; otherwise apply Atlas's documented connectivity guidance.
3. Copy the Node.js driver connection string, replace its database/user/password, and URL-encode special characters in the password.
4. Set the complete URI as the Render `MONGODB_URI` secret. Do not put it in `VITE_*` variables.
5. Confirm the Render health check at `/api/health` reports `database.connected: true`.

Never commit or share the connection URI. Use a separate database for development, staging and production.

## Render backend

Create a Render **Web Service** rooted at `backend` (or configure the repository root with the backend directory as the service root):

- Runtime: Node
- Build command: `npm ci`
- Start command: `npm start`
- Health check path: `/api/health`

Set these Render environment variables:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | Leave unset; Render supplies it |
| `MONGODB_URI` | Atlas URI, stored as a secret |
| `JWT_SECRET` | New high-entropy secret, stored as a secret |
| `JWT_EXPIRES_IN` | `1d` (or the reviewed session lifetime) |
| `FRONTEND_URL` | Exact deployed Vercel origin, e.g. `https://sharemeal.vercel.app` |
| `COOKIE_SAME_SITE` | `none` when Vercel and Render use different sites |

Render terminates HTTPS; the backend sets `Secure` cookies automatically for `NODE_ENV=production`. Cross-site cookies require HTTPS, `COOKIE_SAME_SITE=none`, credentialed requests and the exact `FRONTEND_URL`. The API's CSRF middleware also checks the configured Origin and session-bound CSRF token. Do not use wildcard CORS.

## Vercel frontend

Import the repository as a Vercel project and set the **Root Directory** to `frontend`. Vercel will use the frontend package scripts; set the build command to `npm run build` and output directory to `dist`. Ensure SPA routes fall back to `index.html` in the Vercel project settings.

Set this Vercel environment variable for each applicable environment:

| Variable | Value |
|---|---|
| `VITE_API_URL` | Full Render API base URL ending in `/api`, e.g. `https://sharemeal-api.onrender.com/api` |

`VITE_*` values are public browser configuration. Never put database credentials, JWT secrets or other private credentials in them. Redeploy after changing build-time variables.

## Production checklist

- Deploy Node.js 20.19+ or 22.12+ on a platform that supports long-running Express services.
- Use a unique production JWT secret and least-privilege MongoDB user; never reuse development secrets.
- Set `FRONTEND_URL` to the exact HTTPS frontend origin and verify preflight/auth requests from the deployed site.
- Provision the first administrator only through a trusted, audited operator process.
- Review backups, retention, privacy/legal requirements, food-safety and regulatory requirements, monitoring, alerts and incident response before real users.

The backend binds to the service's available interfaces. Never expose backend environment variables through frontend build-time settings.

## Required before real users

Complete legal review of terms/privacy, food-safety and regulatory review, secure private NGO document storage, admin identity/review operations, session/cookie production testing, monitoring/alerts, backup recovery, retention/deletion policy and integration tests against an isolated staging database. Address geocoding and email only after choosing providers and reviewing their quotas, terms and privacy policies.
