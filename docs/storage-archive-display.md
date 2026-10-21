# Storage archive display — DEF-010

This is a Storage Location page repair, not Inventory Management inside
Cataloging. No backend API, schema, lot, placement, quantity, movement or archive
mutation is changed.

## Browser contract

- `/storage` displays active locations only, including search results.
- **Show archived locations** explicitly includes historical records and is
  stored in the URL as `archived=1`; `archived=0` explicitly hides them.
- Existing `/storage?selected=<archived-id>` bookmarks reveal history so they
  still open the requested archived record. An explicit hide choice wins over
  this automatic reveal and selects an available active fallback.
- Tree nodes, search results, breadcrumbs and child cards use the same Archived
  badge. Selected-record status and read-only management are retained.
- **Active direct children** counts only active children. Archived children
  have a separate count/list, visible only in historical mode.
- When all locations are archived, the active empty state still offers the
  history toggle. No records are deleted or reclassified to produce this view.
- Selection retains the chosen visibility mode. Toggle navigation has busy
  feedback and prevents repeated activation while pending.

The existing protected paginated `ALL` read remains intentional: full paths,
movement-history references, legacy links and parent-choice validation need
the original records. Filtering is a presentation policy, not authorization;
NestJS remains authoritative for access and writes. No additional API reads,
new cache, duplicate models or dependency changes are introduced.

`browser-view.ts` owns storage-page visibility/selection/child grouping. Existing
shared hierarchy helpers and Inventory consumers are unchanged. Management
continues receiving the original units and excluding archived parent options.

## Verification — 2026-10-21

User approved both pure filtering/view regressions and live curator UI checks.
TDD first reproduced missing archive/deep-link/hide/child-group behavior, then
added the smallest corresponding changes. The existing UI also failed the
new explicit-toggle check before implementation.

- 10 new view regressions cover defaults, historical links, explicit visibility,
  fallback selection, child groups, unknown modes, empty/all-archived data,
  legacy active children of archived parents, non-mutation and safe URL encoding.
- The new suite plus existing hierarchy/management suites: 18 tests passed.
- Full frontend suite: 57 files / 331 tests passed; lint and TypeScript passed.
- Production Turbopack build passed in an isolated source-only copy with public
  CI placeholders; no environment files or auth state were copied and the
  normal frontend build output was not overwritten.
- Live signed-in Edge UI used a separately started, loopback-only frontend on
  port 3100 and the existing development backend. Ports 3000/3001 were not stopped
  or replaced. No cookies, credentials or auth state were exported.
- Reused archived cabinet `4fa17866-6e90-4020-a909-63f8163f33bc` and drawer
  `360de017-ac7b-4939-9d4a-251008667209`. No fixture/data mutations were made.
- Active-only tree/search, historical toggle and reload, archived labels in all
  four surfaces, separate counts (cabinet: zero active / one archived child),
  child navigation, old deep link/reload, keyboard hide and active fallback passed.
- Archived edit/move/re-archive controls were absent; archived parent options
  remained excluded; existing archive audit history remained accessible.
- Active-ancestor navigation, another active selection and case-insensitive
  search passed. A deliberately delayed browser read response confirmed the
  busy message/disabled toggle and successful recovery; its route hook was removed.
- The main acceptance script recorded zero page errors.

The initial script used Playwright `check()`, which expects immediate checkbox
state. This control reflects the committed server navigation; corrected the
script to click and await URL/render completion, then reran successfully. That
was a test timing assumption, not an application write failure.

## Limits and rollout

All-archived/empty data and malformed legacy hierarchy behavior are covered by
pure regressions, not manufactured live database states. Backend authorization,
direct rejected writes, lot-assignment restrictions, rollback/concurrency,
server-outage recovery, and independent team acceptance are not established
by this frontend-only repair.

Merge the frontend fix and rebuild/restart the normal frontend before retesting
on port 3000. The shared defect register stays Ready for retest, with historical
failure evidence preserved; local UI verification is not full module sign-off.
