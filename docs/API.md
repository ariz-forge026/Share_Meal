# ShareMeal REST API

Base URL: `http://localhost:5000/api`. Responses are JSON with a `success` boolean. Error responses include a safe `message`; validation errors may also include field-level `errors`.

## Authentication

| Method | Path | Access |
|---|---|---|
| POST | `/auth/register` | Public, rate-limited; donor or NGO only |
| POST | `/auth/login` | Public, rate-limited |
| POST | `/auth/logout` | Public; clears cookie and revokes sessions when the DB is available |
| GET | `/auth/me` | Signed in |
| POST | `/auth/change-password` | Signed in; current password required |
| GET | `/users/me` | Signed in |
| PATCH | `/users/me` | Signed in; only profile fields are editable |

Authentication uses an HttpOnly JWT cookie. Mutating authenticated requests also need the readable, session-bound `sharemeal-csrf` cookie echoed in `X-CSRF-Token`; Axios is configured to do this. Configure `FRONTEND_URL` to the exact browser origin.

## Donations and handoff

| Method | Path | Access |
|---|---|---|
| GET | `/donations` | Public; available, unexpired listings, filters and pagination |
| GET | `/donations/nearby` | Public; requires valid `lat` and `lng` |
| GET | `/donations/my-donations` | Donor or NGO; own workflow records |
| GET | `/donations/:id` | Public listing details; pickup address is access-controlled |
| POST | `/donations` | Donor |
| PATCH | `/donations/:id` | Owner, while available; edit fields validated server-side |
| DELETE | `/donations/:id` | Owner, only when safe |
| POST | `/donations/:id/cancel` | Owner, while available or requested |
| POST | `/donations/:id/requests` | Administrator-approved NGO |
| GET | `/donations/:id/requests` | Listing donor or requesting NGO |
| PATCH | `/donation-requests/:id` | Listing donor; `accepted` or `rejected` |
| POST | `/collection-tasks` | Approved NGO; assigns a volunteer |
| GET | `/collection-tasks/my-tasks` | NGO or assigned volunteer |
| PATCH | `/collection-tasks/:id` | Assigned volunteer; confirms collection |
| POST | `/donations/:id/distribution` | Approved, assigned NGO |
| GET | `/distributions/my-history` | NGO |

Donation search query parameters include `search`, `category`, `foodType`, `city`, `before`, `sort`, `page`, `limit`, `lat`, `lng`, and `radiusKm`. Sort values are `newest`, `deadline`, and `distance`; distance requires coordinates. Page size is capped at 50. Lists intentionally omit pickup addresses.

## NGOs, volunteers and notifications

| Method | Path | Access |
|---|---|---|
| GET | `/ngos` or `/ngos/nearby` | Public; approved profiles only; city or coordinates |
| GET | `/ngos/:id` | Public; approved organization profile |
| GET | `/ngos/my-profile` | NGO |
| POST | `/ngos/apply` | NGO; submits application metadata |
| PATCH | `/ngos/profile` | NGO |
| GET/POST | `/ngos/volunteers` | Approved NGO; create or list its volunteers |
| GET | `/notifications` | Signed in; paginated, with unread count |
| PATCH | `/notifications/:id/read` | Notification recipient |
| PATCH | `/notifications/read-all` | Signed in |
| POST | `/contact` | Public, rate-limited |

NGO coordinate search uses MongoDB 2dsphere indexes. Address geocoding and maps are not configured. Manual city/coordinate search is available and no fake locations are returned.

## Administration

All `/admin` routes require an active admin account.

- `GET /admin/dashboard`, `/admin/users`, `/admin/donations`, `/admin/ngos`, `/admin/ngos/pending`, `/admin/audit-logs`, `/admin/contact-messages`
- `PATCH /admin/ngos/:id/verification` with `{ "status": "approved|rejected|needs_more_information", "decisionNote": "..." }`
- `PATCH /admin/users/:id/status` with `{ "accountStatus": "active|suspended|disabled" }`
- `PATCH /admin/contact-messages/:id` with `{ "status": "reviewed|closed" }`

Public registration rejects `admin` and `volunteer`. A trusted database operator must provision the first administrator; only that administrator can approve an NGO.

## Health

`GET /health` reports API status, database connection state and timestamp. It does not disclose environment variables.
