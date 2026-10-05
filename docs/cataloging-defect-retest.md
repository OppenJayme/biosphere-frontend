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
