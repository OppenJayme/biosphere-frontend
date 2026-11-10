# Archived specimen restoration

Cataloging-only workflow; requires the matching backend restore endpoint.
Merge/deploy the backend first. This does not implement inventory reactivation,
storage assignment, exhibit publication or backup restoration.

## How it works

On an archived specimen's detail page, **Restore archived record** displays
the backend's current readiness assessment and missing requirements. The
preview is advisory; confirming **Restore specimen** invokes the authenticated
Server Action and `PATCH /specimens/:id/restore` without a caller-chosen status.

The backend revalidates and returns the same specimen as Cataloged only when
all requirements pass, otherwise Uncataloged. Public display is off. Original
history and identity are preserved; lots/quantities/storage are not changed.
An already-active record returns unchanged, including any subsequently enabled
public eligibility. The UI shows an unchanged notice instead of claiming a new
restoration.

Success refreshes catalog/detail, queue, revision and audit views, then
redirects to a status-specific notice. An Uncataloged result displays the
normal checklist and fix links. Failures show an inline error with retry;
they do not redirect to a success notice. Restore appears only for archives;
normal archive/public-eligibility controls are retained for active records.

## Repeatable curator checks

Use a disposable development specimen; do not modify another owner's inventory
to manufacture a complete record.

1. Open the archived detail page; inspect the preview and missing requirements.
2. Open Restore, choose Cancel, reload; it must remain archived and read-only.
3. Test a controlled backend connection failure: expect an error and available
   retry, with no success notice. Restore backend availability before continuing.
4. Confirm Restore on an incomplete fixture. Expect Uncataloged, public off,
   edit links restored, exact missing checks and Catalog specimen disabled.
5. Reload: identity, status, notes, existing records and history must persist.
6. Check revision history: preserve the original archive event and add the
   actual status/public-eligibility changes, without duplicate changes on retry.
7. Filter Audit Logs by the specimen ID and `RESTORE_SPECIMEN`: verify the actor,
   resulting status, original archive metadata and missing requirements.
8. With an Inventory-owner-prepared complete archived fixture, verify Cataloged
   with public display still off. Do not reactivate lots inside Cataloging.
9. Verify protected HTTP denial and bounded retry behavior in the backend suite.

## Executed 2026-10-21

Steps 1–7 passed in the existing signed-in browser on loopback-only acceptance
servers, using `TEST - AUD-002 Archive Only 20261021`. A controlled connection
failure showed the correct retry message. Successful restore preserved the ID,
kept zero active lots, and survived reload; history went from one to two
revisions and Audit Logs showed one successful restoration event.

Step 8 remains a live-test limit; its backend behavior is covered by the
isolated protected HTTP suite, not a live inventory mutation. Full detail is in
`biosphere-backend/docs/CATALOG_RESTORATION_VERIFICATION.md`. No real secrets or
browser auth state were copied or committed. The separate production build
passed using public CI placeholders and an ignored source-only copy so the
user's running production build remained untouched.

Local checks: lint and TypeScript passed; all 56 Vitest files / 321 tests
passed. The existing production servers on 3000/3001 were left untouched;
restart/rebuild both normally after merging to use the new restore workflow
there. Browser sign-in was reused without exporting cookies or auth state.
