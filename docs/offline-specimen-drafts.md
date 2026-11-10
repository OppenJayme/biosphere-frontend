# Offline Specimen Drafts

This feature is the browser-side implementation of the limited offline workflow
in BioSphere SRS Section 4.14. It mirrors the backend contract documented in
`biosphere-backend/docs/OFFLINE_SYNC_GUIDE.md`.

## Supported offline behavior

- Previously synchronized specimen-core records are cached for read-only viewing
  and local searching/filtering. Cached records can be filtered by their frozen
  specimen status and curator-extensible specimen category without a network
  request.
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

An open workspace left idle past `NEXT_PUBLIC_SESSION_IDLE_MINUTES` locks even while offline. Saved
drafts stay in IndexedDB, but the curator must reconnect and sign in again to continue. Text typed
into a form and not yet saved as a draft is lost at sign-out. The lock hides the page and blocks
input; it does not encrypt anything already on the device.

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

The production frontend registers a deliberately narrow service worker. It caches
only immutable same-origin build assets plus a record-free offline fallback page.
Protected HTML, API responses, Supabase traffic, authentication data, and museum
records remain network-only and are never written to the Cache API. This means a
fresh offline navigation fails safely to the generic fallback rather than replaying
another account's authenticated shell. The already-loaded specimen workspace can
continue using its owner-partitioned IndexedDB records and drafts.

Service workers are disabled during `next dev` to prevent stale development assets.
Test this behavior using a production build over HTTPS (or localhost):

```powershell
npm run build
npm start
```

Load the specimen workspace online once, use browser developer tools to switch to
offline mode, and verify both the open workspace and a fresh navigation. A fresh
navigation must show only `offline.html`; it must not display curator identity or
museum records. Reconnect and use **Try again** to return to the requested online
workflow.

## Unsupported offline request regression - 2026-10-31

The real POST-handler suite passes 29/29 cases, including 24 new negative
requests. Each supplies one unsupported field inside a valid draft or in its
envelope: `media`, `taxonomy`, `provenance`, `lots`, `quantity`, `storageUnitId`,
`movements`, `status`, `publicDisplay`, `qrCode`, `reportId` and `createdBy`.
Every case returns uncached 400 naming the field, with no credential lookup or
backend forwarding. Existing successful forwarding, 401/403 and invalid-success
cases remain green. Session/config/remote HTTP are synthetic; the actual handler,
API client and schemas execute. Changed-test lint and `git diff --check` pass.

This is test-only coverage of existing behavior, not a new feature or application
repair. Paired protected Nest HTTP checks cover the same 24 rejected inputs and
verify no receipt lookup or specimen/receipt/audit write through synthetic
adapters. Neither suite proves live Next middleware, actual login expiry,
database concurrency, PWA behavior or independent module acceptance. No app
server, shared record, browser session, dependency or production source changed.
