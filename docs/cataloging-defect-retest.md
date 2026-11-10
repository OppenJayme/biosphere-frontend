# Cataloging blocker retest

Changes for DEF-001, DEF-002, DEF-003 and DEF-009 are on
`fix/cataloging-acceptance-defects` in both repositories. The authoritative
defect register remains `biosphere-backend/docs/TEST_DEFECT_LOG.md`.

## Restart and retest

Restart the frontend development server after changing `next.config.ts`.
Development assets now allow the host computer's exact private LAN IPv4
addresses. Preview links are relative to the current origin; they do not send
the second device to `localhost`. If the host IP changes, restart again.

1. **CSV / DEF-009:** Preview a file containing a valid row, invalid gender,
   malformed collection UUID and a future collection date. Expect a visible
   preview and row errors; invalid rows cannot be selected. Commit a valid row,
   refresh its record, then retry the same reviewed commit and check that it
   did not create another specimen. Preview alone must create nothing.
2. **Selection / DEF-003:** On localhost and a second LAN device, select at
   least three different records. Use the common-name preview link and the
   record icon's detail link. Clear selection, reload, and use Back/Forward.
   Tab to the links and activate with Enter; test touch on a narrow screen.
   The selection is represented by `selected` in the URL. With JavaScript
   disabled, preview, clear and detail links must still navigate correctly.
   Capture Console/Network errors if JavaScript interactions still fail.
3. **Collections / DEF-001:** Try exact, case-only and surrounding-space
   duplicates on create and rename. Expect a clear conflict and no mutation.
   Verify unique names and a capitalization-only rename of the same UUID.
   Backend database-index deployment/concurrency checks are tracked separately.
4. **Dates / DEF-002:** Save a historical date and today's museum date, then
   attempt tomorrow. Expect frontend and direct API rejection. An existing
   future date must fail readiness until corrected. Verify revisions/audit are
   written only for successful edits. Repeat with CSV preview.

Do not mark defects Verified until these actual retests pass. Inventory,
storage management, FAQ and authentication implementation are outside this fix.

## Clear all / DEF-008

On `fix/cataloging-filter-reset`, the filter form resets when its applied query
changes. No new filters or backend behavior are introduced.

1. Apply search, status, collection, gender, public eligibility and a nondefault
   sort. Also set at least one advanced filter and visit page 2 if available.
2. Click **Clear all**. Expect `/specimens`, default result set, page 1, empty
   search/text/date fields, All status/collection/gender/eligibility selections,
   Last updated / Descending sort and default descendant scope. More filters
   should no longer open automatically.
3. Immediately click **Apply filters**. Previously selected filters must not
   return. The browser may include explicit default values in the submitted
   query; the parsed query and results must still be unfiltered.
4. Use Back/Forward between applied and cleared states. Every visible control
   must match the results and applied query without a manual page reload.
5. Type an unfinished search and select another specimen preview without
   submitting. The same-query rerender must not erase that unfinished input.

Automated tests verify form identity and default values, not DOM interaction.
Keep DEF-008 Ready for retest until this browser checklist passes.

## Selected cover image / DEF-007

On `fix/cataloging-cover-preview`, only the selected specimen's marked cover
is fetched through the existing protected media APIs. No cover is selected
automatically from other images, and no new database/backend model is added.

1. Mark an uploaded image as cover, return to Cataloging, select the specimen
   and confirm the image appears after the loading indicator.
2. Select another specimen with a different cover, then rapidly alternate
   between them. No previous specimen's image should appear under the new one.
3. Change the cover, return to Cataloging and refresh; confirm the new cover.
4. Remove the cover or select a specimen with no marked cover. Expect the
   placeholder and “No cover image selected,” not an arbitrary image.
5. Temporarily stop the backend or fail the image request in browser DevTools.
   Expect a safe error with **Retry cover image**; restore connectivity and
   retry. Image failures or expired links must not break the specimen details.
6. Confirm the browser receives only the cover caption and a short-lived HTTPS
   URL, not storage paths or session/service credentials. Backend authorization
   still protects both metadata and URL signing.

Automated tests cover the read action's authorization/input/error contracts and
rendered image/placeholder/error states. Actual image loading, rapid-selection
race handling and retry interaction require this manual retest.

## Native file-picker feedback / DEF-004

On `fix/cataloging-media-file-feedback`, upload and replacement file inputs
share interaction styles. The native file picker and validation are unchanged.

1. Open an active specimen's Media page. Hover the upload and replacement
   pickers; both file buttons should darken consistently.
2. Tab to each picker. A visible focus outline must appear; use the keyboard
   to open the native picker and select a supported image.
3. Submit a valid upload/replacement. During pending work, verify the picker
   is disabled, looks disabled and does not show enabled hover feedback.
4. Confirm required-file and image type/size validation still work, and that
   the successful file change persists after refresh.
5. Open archived read-only media and confirm no upload/replacement picker exists.

Rendering tests check class/attribute contracts, not browser visuals or native
picker interaction. Keep DEF-004 Ready for retest until these checks pass.

## Visible reusable tag suggestions / DEF-005

On `fix/cataloging-visible-tag-suggestions`, the existing search results are
visible buttons. Choosing one fills and focuses Tag name; it does not save until
**Attach tag** is clicked. Existing APIs, duplicate checks and vocabulary remain.

1. Create a tag on specimen A, open specimen B and search its reusable vocabulary.
   Confirm the matching names are visible, not only a count.
2. Choose a result using pointer, Tab + Enter/Space, and touch if available.
   Tag name should receive the exact name and focus; no attachment should yet occur.
3. Click Attach tag. Confirm persistence after refresh and revision history;
   the attached tag must disappear from suggestions for this specimen.
4. Confirm case-insensitive duplicates still fail and detaching preserves the
   shared tag for reuse on other specimens.
5. Search for a nonexistent tag; expect an explicit no-results message. Clear
   the search; the search field and results should both reset.
6. During attachment, choices and Tag name must be disabled. Archived records
   must remain read-only. A failed save should show the existing validation error.

Automated checks cover rendering, selection callback, pending/read-only states
and preserved form contracts. Browser focus, search navigation and persistence
still need this retest; DEF-005 is not yet Verified.

## Readable media revision history / DEF-006

On `fix/cataloging-readable-media-history`, media history uses event labels and
neutral image/file/cover descriptions instead of UUIDs and storage paths.
Historical filenames are not available in these records, so none are guessed.
Raw immutable evidence remains unchanged in the protected API/database.

1. Upload and remove an image. Expect Image added / Image removed with readable
   previous/new states rather than media IDs.
2. Replace an image file. Expect Image file replaced, Previous image file and
   Replacement image file, with no storage path or clickable image URL.
3. Switch cover images, including initially selecting one. Expect Cover image
   changed and clear selected/no-cover states, not UUIDs.
4. Edit/remove a caption and change display order to zero. Confirm actual caption
   text, Not recorded for removed captions, and numeric order values still show.
5. Confirm actor, timestamp, reason, filters and pagination still work, and that
   tag/core/taxonomy/provenance histories retain their previous formatting.

Automated helper/rendering checks verify labels, empty states, suppression of
raw media IDs/paths and unchanged input evidence. Live acceptance testing is
still required; DEF-006 remains Ready for retest rather than Verified.

## Media buttons and CSV picker feedback / DEF-012 and DEF-013

On `fix/cataloging-control-hover-feedback`, Save metadata and Set as cover use
the defined forest-100 hover color, enabled-only feedback and keyboard outlines.
The CSV picker shares the existing media pickers' interaction styles; native
inputs, validation, pending disabling and save actions are unchanged.

1. On active specimen Media, hover Save metadata and a non-cover image's Set as
   cover button. Each should visibly darken. Tab to both and confirm an outline.
2. Save metadata and set a cover. During saving confirm pending controls cannot
   be activated; refresh and confirm persisted values and revision history.
3. On Cataloging Import, hover and Tab to Choose file. Confirm visible feedback
   and select a CSV using the native picker.
4. Preview a mixed valid/invalid file, then import only selected valid rows.
   Confirm preview/import disable the picker and preserve validation/persistence.
5. Recheck media upload/replacement file hover/focus (DEF-004) and archived
   read-only media to ensure existing behavior remains intact.

Rendering tests check native input and class contracts; generated production
CSS and real-browser hover/focus must also be checked before marking Verified.

## Already-attached tag feedback / DEF-014

On `fix/cataloging-duplicate-tag-notice`, an existing relationship shows an amber
status notice headed Already attached — no changes saved. New attachments,
changes and detachments keep green success feedback. No backend or mutation
logic changes, and an existing valid tag is not styled as erroneous.

1. Attach a tag to an active test specimen; confirm green success feedback.
2. Submit that same name with different capitalization. Confirm the amber notice
   and explicit no-change wording appear just above the tag management section.
3. Refresh and confirm only one relationship exists and no new attachment
   revision was created for the duplicate attempt.
4. Detach/reuse and change a tag; confirm their success messages remain distinct.
5. Confirm the status text is understandable without color and available to
   keyboard/screen-reader users. Unknown query outcomes must show no status notice.

Automated page checks cover outcome styling/text, allowlisted query handling
and the existing session boundary. Live duplicate/revision and accessibility
retesting remains required before marking Verified.

## Clear all pending feedback / DEF-011 (partial repair)

On `fix/cataloging-clear-filter-feedback`, Clear all changes to Clearing filters…
and shows an accessible Loading unfiltered specimen results… status during its
navigation transition. Feedback is non-modal so a stalled network does not
trap the curator. The fixed native href and Next Link's modified-click behavior
remain; the query-keyed form resets only when new results commit, not prematurely.
Existing catalog-unavailable and optional-lookup fallbacks are unchanged.

1. Apply collection/gender filters, then Clear all. With browser Network
   throttling enabled, confirm immediate pending text before results arrive.
2. Confirm busy/disabled semantics and that clicking Clear again while pending
   does not start another navigation. Other navigation remains available.
3. When loading completes, confirm all controls/results reset together and
   pending feedback disappears. Apply again and use Back/Forward.
4. Use keyboard Enter, Ctrl/Cmd-click and, separately, disable JavaScript.
   Normal links must still reach /specimens without filters.
5. Temporarily interrupt the backend and clear filters; existing unavailable
   feedback/retry must remain usable, without a blocking loading dialog.

### Performance evidence still needed

The source already verifies the session before three parallel reads (specimen
search, collections, storage filter options). This is inspection, not timing
evidence; no new query, authentication bypass or cache is introduced.

In an authenticated browser, record tested frontend/backend commits, record
count, cold vs warm navigation and at least three unthrottled Clear all timings.
Capture the relevant document/RSC request's Network Timing, with tokens/cookies
and sensitive payloads omitted. Compare next dev against next build + next start
on the same data/backend. Record time to pending feedback separately from time
to updated results. Do not use artificial throttling for performance baselines.
If server time dominates, measure the three backend reads; if transfer/rendering
dominates, inspect payload/render work. Only optimize a demonstrated bottleneck.

Automated tests cover href/navigation/pending/repeat-click contracts and existing
filter-form reset tests. Actual browser timings and failure/history interaction
are pending; DEF-011 remains In progress, not a claimed speed improvement.

## DEF-020 - Interrupted duplicate-warning request

The client request boundary now catches transport rejection separately from
the Server Action's backend-error handling. It returns `unavailable`, preserving
the existing unknown/Check again UI and request-ID stale-response guard. It does
not change duplicate rules, accession uniqueness, archive policy or save behavior.

Test seam approved by the user: real client request function with only the
remote Server Action mocked, plus a browser interruption/retry check. The new
regression failed on uncaught `Failed to fetch` before the fallback was added.
Five request tests now cover rejection, a successful matching retry and resolved
idle/clear/unavailable results; all 366 frontend tests (62 files), lint and
TypeScript passed on 2026-10-23. These unit tests are not full React/Next transport
integration or live backend failure evidence.

Browser verification used a separately approved loopback-only dev server on
port 3002 because port 3000 runs an older production build. The original failure
was reproduced there; replaying it against that unchanged build is not a failed
test of new source. Do not rebuild underneath an occupied production server.

For an independent retest, use an existing `TEST` record with both names:

1. Copy its names into an unsaved new-specimen form; do not submit. Blur a name
   and confirm the warning links that record without disabling Save.
2. Change to unrelated names; confirm clear replaces the old warning/link.
3. Interrupt only the read-only duplicate-check action. Confirm pending then
   unknown/Check again, with entered values intact and Save still enabled.
4. Restore the connection and Check again; confirm a fresh result, no page error
   and no specimen save. Do not interrupt unrelated writes or stop shared servers.

The controlled browser run passed those checks with six validated duplicate-read
attempts, one deliberately aborted, and no other non-read requests or submitted
forms. Its temporary tab closed; the signed-in Audit tab stayed open. Shared
DEF-020 remains Ready for retest pending merged/deployed independent verification.

## DEF-021 - Reviewed import recovery after commit transport rejection

The user-approved client request seam wraps only the remote commit Server
Action. Rejected transport returns an unknown-outcome message to the existing
alert path instead of escaping the transition. It does not claim the backend
saved nothing or retry automatically. The component preserves the preview,
selected rows, duplicate-warning acknowledgement and file. Server validation,
authorization, normalization, idempotency and result handling are unchanged.

The first focused test failed on rejected `Failed to fetch`, then passed after
the fallback. Four request tests cover rejection without automatic retry,
explicit same-preview/row retry, resolved backend rejection and resolved result
counts. Focused import tests passed 10/10; full frontend 370/370 across 63 files,
full lint and TypeScript `--noEmit --incremental false` passed.

Approved browser retest used a temporary dev server bound only to
`127.0.0.1:3002`, with a locally supplied synthetic preview (two valid rows,
one invalid, one duplicate warning). After choosing only the warning row and
acknowledging it, both the initial commit and an explicit retry were intercepted
and aborted before server forwarding. Two complete runs preserved reviewed
state and showed the unknown-outcome alert, with controls re-enabled and zero
page errors. Both attempts used the same preview ID and selected row `[2]`;
invalid rows stayed disabled and no automatic commit was observed.

The first cold-dev attempt clicked server-rendered controls before hydration,
causing a GET form navigation rather than a synthetic preview. The helper now
waits for the submit handler; that harness precondition failure is not a failed
retest of the recovery fix. No real preview or commit was sent. The temporary
server was stopped and ports 3000/3001 plus original role windows were preserved.

DEF-021 is Ready for retest, not Verified: merge/CI, rebuilt deployed behavior
and independent acceptance remain pending. Production port 3000 still serves
the pre-fix build. Browser success here does not prove real database commits,
retry idempotency, provider failures or concurrency. Recheck the same scoped
scenario after approved deployment; do not send live commits merely to repeat
this transport-only case.
