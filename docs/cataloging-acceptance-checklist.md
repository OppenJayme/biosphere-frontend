# BioSphere Cataloging Acceptance Checklist

Use this checklist to verify the currently approved Cataloging workflow across
the Next.js frontend, NestJS API, and Supabase development database. It records
what is implemented now and prevents unapproved business rules from being
treated as finished behavior.

## Scope

Cataloging currently covers:

- collection lookup and maintenance;
- specimen core draft creation and editing;
- taxonomy and provenance/catalog information;
- reusable specimen tags;
- private specimen media and cover metadata;
- catalog search, filters, sorting, and the live Uncataloged queue;
- field-level revision history;
- public-display eligibility for Cataloged records; and
- archive-not-delete behavior.

Cataloging may display lot and location information returned by the API, but it
must not manage quantity, condition, placement, storage hierarchy, movements,
or transfers. Those belong to Specimen Inventory Management and Storage
Location Management.

## Test setup

- [ ] Use the development Supabase project, not production data.
- [ ] Sync both repositories to the latest `develop` branch.
- [ ] Confirm the backend `.env` and frontend `.env.local` exist locally and
      remain ignored by Git.
- [ ] Start the NestJS API and the Next.js frontend.
- [ ] Sign in with an active `CURATOR` test account.
- [ ] Prepare a recognizable test prefix such as `QA-CAT-YYYYMMDD` for names
      and accession values created during the run.
- [ ] Keep the browser network panel and backend logs available while testing.

Before manual testing, run:

```powershell
# biosphere-backend
npm ci
npm run prisma:generate
npm run lint:ci
npm test -- --runInBand
npm run build
npm run test:e2e -- --runInBand

# biosphere-frontend
npm ci
npm run lint
npm test
npm run build
```

## 1. Authentication and authorization

- [ ] Opening `/cataloging` or `/specimens` while signed out redirects to
      `/login` and preserves a safe internal return path.
- [ ] An expired session produces a sign-in prompt or redirect instead of
      silently changing data.
- [ ] A non-Curator account cannot use the protected Cataloging API endpoints,
      even if it manually sends a request outside the UI.
- [ ] Browser cookies are not treated as the backend authorization authority;
      the NestJS API validates the bearer token and active BioSphere account.

## 2. Collection maintenance

- [ ] Open `/specimens/collections` from the specimen catalog.
- [ ] Create a collection whose name uses the test prefix.
- [ ] Confirm leading/trailing spaces are removed and the saved name appears.
- [ ] Confirm blank names and names longer than 255 characters show validation
      errors without creating a record.
- [ ] Search for the collection and verify pagination preserves the search.
- [ ] Rename it and confirm specimen forms show the new name.
- [ ] Confirm renaming does not change specimen `collectionId` relationships.
- [ ] Confirm the UI exposes no delete/archive action because collection
      lifecycle rules and schema support are not approved.

Do not report identical names as a defect yet. Collection-name uniqueness is
not an approved rule and is not enforced by the current schema.

## 3. Specimen core record

- [ ] Create a specimen through `/specimens/new` using the test collection.
- [ ] Confirm it is created as `UNCATALOGED` and not publicly eligible.
- [ ] Confirm the creator attribution comes from the authenticated BioSphere
      account rather than a client-submitted identifier.
- [ ] Verify blank optional draft fields are accepted.
- [ ] Verify invalid collection UUIDs, invalid gender values, and excessive
      field lengths are rejected by the backend.
- [ ] Edit the core record and confirm the detail page displays the changes.
- [ ] Submit an unchanged edit and confirm a clear error is shown.
- [ ] Confirm clients cannot directly submit `status`, creator, updater,
      archive attribution, or timestamps through the core form.

## 4. Live queue and catalog search

- [ ] Confirm the new record appears in `/cataloging`.
- [ ] Confirm `/cataloging` contains only `UNCATALOGED` records.
- [ ] Search by accession number, common/scientific name, category, remarks,
      and collection name.
- [ ] Verify queue pagination keeps the active search term.
- [ ] Use “Continue cataloging” and confirm it opens the correct specimen.
- [ ] In `/specimens`, test status, collection, category, gender, public
      eligibility, sort field, and sort direction independently.
- [ ] Combine filters, navigate pages, and confirm the URL preserves them.
- [ ] Request an invalid filter or page value manually and confirm it falls
      back safely without exposing an error page.
- [ ] Confirm archived records appear only when explicitly filtering for
      `ARCHIVED`.

## 5. Taxonomy and provenance

- [ ] Create taxonomy for the specimen and verify every saved field.
- [ ] Edit taxonomy and confirm only actual changes are accepted.
- [ ] Create provenance and verify date, collector/donor, location, and
      preservation fields.
- [ ] Reject impossible dates and values exceeding backend length limits.
- [ ] Edit provenance and confirm the integrated specimen detail refreshes.
- [ ] Confirm an archived specimen cannot have taxonomy or provenance changed.

These curator-extensible text values must not be converted into PostgreSQL or
frontend enums unless a later approved rule explicitly freezes them.

## 6. Tags

- [ ] Attach a new trimmed tag to the specimen.
- [ ] Search and reuse an existing tag without creating a duplicate vocabulary
      entry for case/spacing variants handled by the backend.
- [ ] Repeat an attach request and confirm the relationship is idempotent.
- [ ] Detach the tag and confirm only the relationship is removed; the shared
      vocabulary entry remains available.
- [ ] Confirm archived specimens cannot have tag relationships changed.

## 7. Private media

- [ ] Upload an allowed specimen image within the configured size limit.
- [ ] Confirm invalid type, empty file, and oversized-file errors preserve the
      existing media list.
- [ ] Confirm media is stored privately and viewed using a short-lived signed
      URL rather than a permanent public URL.
- [ ] Update caption/display order and select a cover image.
- [ ] Replace an image file and confirm its database metadata relationship is
      preserved.
- [ ] Remove an image and confirm both the database relationship and private
      object follow the backend's safe cleanup behavior.
- [ ] Confirm archived specimens cannot have media changed.

Media is optional and must not be treated as a Cataloged-status requirement.

## 8. Revision history and audit evidence

- [ ] Open the specimen revision-history page.
- [ ] Confirm core, taxonomy, and provenance changes appear with field name,
      old/new values, source section, actor, and timestamp.
- [ ] Verify revision filtering and pagination.
- [ ] Confirm read-only history cannot be edited from the frontend.
- [ ] Confirm successful collection/specimen mutations also produce the
      expected protected audit event.
- [ ] Confirm a rejected or failed mutation does not leave a partial primary
      record without its transactional audit behavior.

## 9. Lifecycle behavior

- [ ] Confirm an `UNCATALOGED` specimen cannot be marked publicly eligible.
- [ ] For an existing test `CATALOGED` record, enable and disable public-display
      eligibility and verify the history/audit evidence.
- [ ] Confirm public eligibility does not itself publish an exhibit or expose
      the internal curator record.
- [ ] Confirm archive is unavailable while active lots exist; resolve this only
      through the Inventory workflow owned by that module.
- [ ] Archive a specimen with no active lots and confirm history is preserved,
      public eligibility is disabled, and edit controls are unavailable.
- [ ] Repeat archive safely and confirm no conflicting attribution rewrite.
- [ ] Confirm no permanent specimen-delete control exists.

## 10. Offline draft boundary

- [ ] Create a text-only offline specimen draft and confirm it is isolated by
      the verified browser owner ID.
- [ ] Reconnect and confirm the stable `clientDraftId` creates at most one
      server specimen across retries.
- [ ] Confirm validation, authentication, conflict, network, server, and
      malformed-response failures preserve the local draft with a useful state.
- [ ] Confirm synchronized drafts become read-only locally and continue through
      the normal online Cataloging pages.
- [ ] Confirm no offline taxonomy, provenance, media, catalog-completion,
      archive, inventory, or storage mutation is offered.

See `docs/offline-specimen-drafts.md` for the complete offline contract.

## Failure and recovery checks

- [ ] Stop the backend and confirm lists show an unavailable/retry state rather
      than fabricated sample records.
- [ ] Restore the backend and confirm retry reloads live data.
- [ ] Rename a referenced collection in another session and confirm specimen
      relationships still resolve through the unchanged collection UUID.
- [ ] Make collection lookup temporarily unavailable and confirm the catalog
      remains usable without submitting a fabricated or stale selection.
- [ ] Document the observed result of concurrent edits; do not claim optimistic
      conflict detection until the backend exposes an approved version rule.
- [ ] Confirm every destructive-looking action requires clear intent and that
      no secrets, service-role keys, or database credentials appear in browser
      responses, logs, screenshots, commits, or test evidence.

## Bulk specimen CSV import

- [ ] Download the CSV template and confirm its headers match the backend's
      supported specimen-core columns.
- [ ] Reject an empty file, a non-CSV file, a file over 5 MB, and a CSV over
      500 data rows with clear messages and no specimen creation.
- [ ] Preview a valid CSV and confirm no database rows are created until the
      curator explicitly commits selected rows.
- [ ] Confirm invalid rows cannot be selected and unmapped columns remain
      visible during review.
- [ ] Confirm selected duplicate warnings require explicit acknowledgment.
- [ ] Commit a subset of valid rows and confirm every created record is
      `UNCATALOGED` and attributed to the active curator.
- [ ] Force one commit-time row failure and confirm successful rows remain
      created while failed rows remain selected for a safe retry.
- [ ] Retry the same preview rows and confirm they do not create duplicates.
- [ ] Wait more than 30 minutes and confirm an expired preview asks for a new
      upload instead of creating anything.
- [ ] Confirm the batch identifier is displayed, appears in the corresponding
      audit details, and the result links to filtered `IMPORT_SPECIMEN` events.

## Deferred decisions — do not implement yet

The following require museum/client approval or a dedicated backend contract:

- [ ] Exact required fields for promotion from `UNCATALOGED` to `CATALOGED`.
- [ ] Whether accession numbers are globally unique, collection-scoped unique,
      or allowed to repeat.
- [ ] Duplicate-detection fields, normalization, similarity thresholds, and
      curator override workflow.
- [ ] Collection archival, deletion, or merge behavior.
- [ ] Specimen unarchive/restore behavior.
- [ ] Which Cataloged fields may become public through QR exhibits.

Until these are approved, the UI must not expose “Mark as Cataloged,” duplicate
scores, bulk import, collection deletion, or specimen restore as working
features.

## Evidence record

For each test run, record:

| Item | Value |
| --- | --- |
| Date/time | |
| Tester | |
| Frontend commit | |
| Backend commit | |
| Supabase environment | Development |
| Browser/device | |
| Automated checks | |
| Manual sections passed | |
| Failed checks / issue links | |
| Deferred items encountered | |

Do not paste access tokens, passwords, connection strings, API secret keys, or
private signed media URLs into this evidence record.
