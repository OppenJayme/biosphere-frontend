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
