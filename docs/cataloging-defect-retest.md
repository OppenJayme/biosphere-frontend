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
