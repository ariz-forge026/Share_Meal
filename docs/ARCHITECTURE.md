# ShareMeal architecture

## Application layers

- **React/Vite frontend**: responsive public, donor, NGO, volunteer and administrator workspaces; React Router; shared API client configured for credentialed HttpOnly-cookie sessions and CSRF headers.
- **Express API**: REST routes use validation and middleware before controllers; controllers enforce role, ownership and workflow rules; services produce audit/notification records and expire overdue listings.
- **MongoDB/Mongoose**: referenced donation, request, collection, distribution, notification, audit and contact records; user profile data stays embedded with its user. GeoJSON Points use `[longitude, latitude]` and 2dsphere indexes.

## Authentication and trust

Public registration creates donor or NGO users only. The session JWT is HttpOnly-cookie-only, and unsafe cookie-authenticated requests require the CSRF header. Backend authorization is authoritative. NGO verification starts `not_submitted`; the organization submits metadata to become `pending`. Only an administrator may set `approved`, `rejected` or `needs_more_information`. Approved status is required for food requests and collection scheduling.

Volunteer accounts are created by an approved NGO, belong to that organization's user ID, and can update only their assigned collection tasks. Public NGO profiles show approved organizations only. Sensitive documents are not collected because private file storage is not configured.

## Donation workflow

1. A donor creates an available listing with food details, a deadline, optional storage/allergen disclosures and optional coordinates.
2. Public discovery returns available, unexpired listings with filters/pagination; pickup addresses and exact coordinates are excluded.
3. An approved NGO submits a request. A conditional atomic update reserves one request; a competing request cannot assign the same donation.
4. The listing donor accepts or rejects. Acceptance assigns that NGO; rejection reopens the listing.
5. The approved NGO assigns an organization volunteer and a future pickup time before the deadline.
6. Only the assigned volunteer records collection. The NGO records the distribution quantity and recipient estimate; the donation becomes completed.
7. State history, audit events and in-app notifications record important steps. Overdue uncollected donations are hidden immediately and persisted as expired by a periodic worker.

The workflow uses conditional document updates/unique indexes and compensating writes; it does not depend on MongoDB transactions. Review and test transaction-based writes before high-volume production deployment.

## Nearby discovery

City search is manual and works without geocoding. Browser geolocation is never requested until the user selects the action. With user-provided coordinates, MongoDB `$geoNear` searches indexed NGO/donation Points and returns distances. No address geocoding key or map provider is configured, and the platform does not fake nearby results.

## Operational boundaries

The API health route works without Atlas and explicitly reports database availability. Registration, profiles, searches and records require MongoDB. Private document storage, email delivery, external identity verification, map UI, automated regulatory checks and a development seed command are not implemented. See [API](API.md), [database](DATABASE.md), [security](SECURITY.md), [food safety](FOOD_SAFETY.md) and [deployment](DEPLOYMENT.md) notes.
