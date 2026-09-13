# Offline Specimen Drafts

This feature is the browser-side implementation of the limited offline workflow
in BioSphere SRS Section 4.14. It mirrors the backend contract documented in
`biosphere-backend/docs/OFFLINE_SYNC_GUIDE.md`.

## Supported offline behavior

- Previously synchronized specimen-core records are cached for read-only viewing
  and searching.
- A curator can create and retain a new text-only specimen draft on the device.
- Every local draft receives one stable `clientDraftId` UUID. That identifier is
  reused for every retry so the backend can return the original specimen instead
  of creating duplicates.
- A reconnect waits two seconds before attempting the queue. This is only a
  stability hint; the HTTP result remains the source of truth.
- A failed request never deletes the local draft. Validation, authorization,
  conflict, network, server, and malformed-response failures produce explicit
  local error states.

The visible states are `PENDING_SYNC`, `SYNCHRONIZING`, `SYNCHRONIZED`, and
`SYNC_FAILED`.

## IndexedDB layout

Dexie owns the `biosphere-offline` IndexedDB database:

- `specimenDrafts` stores the stable UUID, normalized text payload, state,
  timestamps, safe error details, and accepted server specimen ID.
- `specimenCache` stores read-only specimen-core API responses and their cache
  time.

Both stores include the verified Supabase user ID as `ownerId`. UI queries always
filter by that owner so accounts sharing one browser profile do not see each
other's BioSphere cache. Tokens, passwords, service keys, and Supabase secrets are
never stored in IndexedDB.

IndexedDB is device-local storage, not an encrypted backup. Devices allowed to
retain museum records must follow the team's device-access and browser-profile
rules.

## Network boundary

Client code calls same-origin Next.js handlers:

- `GET /api/offline/specimens`
- `POST /api/offline/specimen-drafts`

Those handlers use the existing server-only `apiFetch` client, which retrieves the
Supabase access token from the server-managed session and forwards it to NestJS.
The POST handler rejects cross-site browser requests, non-JSON bodies, oversized
payloads, and values outside the backend DTO contract. Backend responses are
validated before they enter IndexedDB.

The NestJS API remains the authorization and database authority. Client-side owner
partitioning and validation improve safety and feedback but never grant access.

## Retry and conflict rules

- Only one request for a local draft may be in progress in this browser context.
- Pending and retryable failed drafts synchronize sequentially to avoid request
  bursts.
- A page close during `SYNCHRONIZING` is recovered as a retryable failure on the
  next load. The backend receipt makes that retry safe even if the earlier request
  committed before the browser closed.
- HTTP 409 locks the conflicting local draft against editing and automatic retry.
  Generating a replacement UUID automatically could duplicate an already accepted
  specimen, so recovery requires human review.
- Synchronized records are read-only locally. Subsequent edits use online
  cataloging endpoints.

## Deliberate boundaries

Offline mode does not queue edits to existing records, taxonomy, provenance, lots,
location or quantity changes, condition changes, media, imports, archiving,
publishing, reports, inquiries, visits, accounts, backups, QR, or AR operations.

This change provides the IndexedDB data and synchronization layer. A service worker
for offline app-shell loading is still a separate PWA task; without it, the already
loaded page can use IndexedDB offline, but a fresh offline navigation is not yet
guaranteed. The older specimen table still uses placeholder presentation data and
should later be replaced with the real online catalog list rather than being
silently mixed with cached core records.
