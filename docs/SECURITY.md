# Security notes

## Implemented controls

- bcryptjs password hashes; password hashes and token versions are excluded from normal reads.
- JWTs are stored in HttpOnly, SameSite cookies and are not returned in JSON or browser localStorage. Cookie lifetime follows `JWT_EXPIRES_IN`.
- Unsafe cookie-authenticated requests require the configured frontend `Origin` and a matching double-submit CSRF token cryptographically bound to that session cookie.
- Logout/password change invalidate existing JWTs using a stored token version.
- Public registration accepts donor/NGO only. Admin/volunteer creation is restricted to privileged workflows.
- Backend role, ownership, active-account and approved-NGO checks guard actions.
- Express validation, JSON size limit, explicit credentialed CORS origin, Helmet, API/auth/contact rate limits and safe centralized errors.
- Conditional state updates, uniqueness constraints, audit records for privileged/workflow actions and private pickup-address projections.
- Admin endpoints require an active admin session. NGO verification requires administrator action.

## Cookie deployment requirements

Configure `FRONTEND_URL` to the exact frontend origin. The default `COOKIE_SAME_SITE=strict` works when frontend/API are same-site (including different localhost ports). Cross-site deployment needs `COOKIE_SAME_SITE=none`, HTTPS, `Secure` cookies, explicit CORS, and a deployment review of CSRF policy. Never use wildcard CORS with credentials.

`JWT_SECRET` must be a high-entropy secret from a deployment secret manager. Do not commit `.env`; do not use the generated development value in production. Rotate and revoke sessions after any suspected compromise.

## Outstanding production controls

- Private document upload/storage is not implemented. Do not collect NGO identity documents until private storage, malware scanning, strict file validation, access review and retention/deletion are configured.
- No geocoding/map key, email provider, external identity verification, automated abuse detection or production monitoring is configured.
- Administrator bootstrap currently requires an authorized operator to change an account's role in a protected database. Define a reviewed, auditable operational process before launch.
- Cookie JWTs are short-lived but not individually session-listed; token version revocation invalidates all sessions for an account.
- Apply TLS, database least privilege, Atlas network allowlisting, secret rotation, backups, audit retention, dependency update review and incident response before public production use.
