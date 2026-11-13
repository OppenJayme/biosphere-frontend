# Visit request visitor-count feedback - 2026-11-13

Reported: entering 10 visitors still allowed more than 10 name rows, without
feedback when the limit was reached. Reproduced against frontend develop
`c712ad9` with the real RequestVisitForm in isolated Edge and synthetic HTTP.
The first regression failed: “Declared count 10 still allows an eleventh visitor row”.

The form now caps name rows at the valid declared visitor count, keeps Add visible
but disabled at the limit, and provides associated live feedback. Invalid counts
show immediate feedback using the existing validation schema. Reducing the count
keeps entered names and explains how to resolve the excess; Submit and its handler
both prevent an excess-row submission. Increasing the count or removing a row
restores Add. Send another resets the controlled count and rows.

Related feedback: reaching five schedule options or ten vehicles now displays an
explicit limit message instead of only removing Add. Feedback is inline and
announced through status/alert roles, without interrupting typing with modal popups.

The existing request maximum remains 200, as defined by MAX_VISITOR_COUNT. This
change does not resolve or change the separate 50-person tour-batch policy. It
does not modify schedules, backend rules, booking capacity or approval workflows.

Verification: `npm run test:visit-count:browser` passed 14 behavior scenarios,
including count 10, lowering without losing names, programmatic submit rejection,
increasing/removing rows, blank/0/negative/fractional/over-maximum input, maximum
feedback, correction, schedule/vehicle limits, one successful synthetic request,
and Send another. All network destinations are intercepted; foreign/unexpected
requests abort. The only submitted request is synthetic. Browser reports zero
runtime errors and closes only its own session. No live data or signed-in windows
are touched. This is component/browser evidence, not deployed or email acceptance.

Existing form and schedule validation tests passed 20/20. Focused ESLint,
browser-script syntax checks and git diff --check passed. An initial Vitest
attempt was blocked by sandbox child-process permissions; the isolated rerun
completed successfully. Installed dependencies were reused through worktree
junctions, not freshly installed. No app environment files were copied.

TypeScript: the first check lacked generated Next route/image declarations in
the fresh worktree. `next typegen` generated them locally, then
`tsc --noEmit --incremental false` passed. No production build or deployment ran.
