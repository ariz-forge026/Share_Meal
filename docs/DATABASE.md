# Database model and operations

All records use Mongoose timestamps and MongoDB ObjectId references. Optional coordinates use GeoJSON `Point` with `[longitude, latitude]` order. User NGO/donor locations and donation pickup points have 2dsphere indexes.

## Collections

- **User**: account name/email/phone/password hash/role/status/session token version; donor and NGO profile data are embedded to keep one profile per account. Volunteers reference their NGO account. Password hashes and token version are not selected by default.
- **Donation**: donor reference, food details, food-safety disclosures, collection deadline, optional pickup Point, workflow status, assigned/requesting NGO references and an embedded status history. Public query projection omits private pickup address and coordinates.
- **DonationRequest**: donation/NGO references, message and review status. A unique `{ donation, ngo }` index prevents duplicate NGO requests to the same donation.
- **CollectionTask**: one unique task per donation, assigned NGO and volunteer, schedule and collection confirmation.
- **DistributionRecord**: one unique distribution record per donation, reporting NGO/user, quantity and recipient estimate.
- **Notification**: recipient, typed message, resource reference and read timestamp.
- **AuditLog**: actor, action/resource, limited details, request IP and timestamp. Never store credentials or auth tokens in details.
- **ContactMessage**: rate-limited support form content and moderation status.

## Concurrency and transactions

Donation requests first reserve an available donation using a conditional atomic update, then create the active request. If another NGO wins the update race, the losing request record is removed. Unique indexes also prevent repeated requests and collection/distribution records. These operations do not require MongoDB replica-set transactions. For multi-document collection updates, the service uses conditional updates and compensating writes; production deployments that support transactions should consider enabling them and adding integration tests.

## Expiration

The API excludes expired records from discovery and request predicates. When the connected backend starts and every 60 seconds afterward, it conditionally marks overdue available/requested/accepted/scheduled donations expired, withdraws a pending request, expires a scheduled collection task, creates an audit entry and notifies affected participants. An unavailable database means that scheduled persistence cannot run.

## Test database

Ordinary tests use no production credentials and do not require MongoDB. For integration tests, create a separate local/Atlas database (for example `sharemeal_test`), set its URI only in a local ignored environment, and verify it is not a production database before running destructive fixtures. Do not point automated tests or the seed script at production data.

## Demo records

Any future seed records must use fictional data, carry `isDemo: true`, never imply a real partnership, and only run after an explicit development-only opt-in. The current platform does not automatically seed sample records.
