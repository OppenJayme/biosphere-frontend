# Audit page failure and recovery verification

## Isolated regression checkpoint — 2026-10-22

Related acceptance case: **AUD-001** in the backend repository's
`docs/ACCEPTANCE_TEST_PLAN.md`. This is additional scoped evidence, not full
Audit module acceptance or a production security sign-off.

`src/app/(curator)/audit-logs/page.test.ts` exercises the real Audit page,
audit API client, response schema, workspace, table and detail components.
Only the external session interface, HTTP fetch and server-only/environment
test boundaries are simulated. All identities, tokens and entries are synthetic;
HTTP is stubbed and the environment module supplies a placeholder API URL.
These cases require no live credentials or server connection.

Covered output:

- Connection failures and HTTP 500/502/503 show safe connection guidance,
  not an empty-result message, table, selected detail or success counts.
- HTTP 403 shows permission guidance without reflecting the upstream body.
- HTTP 401 produces the login redirect rather than rendered audit data.
- Invalid response shapes and non-JSON content fail safely without exposing
  upstream content or rendering unvalidated entries.
- Independent success → failure → success page requests hide earlier audit
  data on failure and render the returned table/detail after recovery.

Run the focused tests from the frontend repository:

```powershell
npm test -- 'src/app/(curator)/audit-logs/page.test.ts'
```

The harness explicitly awaits the page function, then uses React's static
renderer on its returned tree. It does **not** run Next's async React Server
Component renderer, proxy/layout, hydration, browser navigation or session
expiration. Recovery assertions concern independent server-rendered outputs,
not whether an already-hydrated browser removes stale content. Actual outages,
live role/account enforcement and database concurrency remain unverified here.

No application behavior, dependencies, authentication rules, Inventory data or
live records were changed. The existing running browser/server need not be
stopped to run these regressions. No defect was reproduced in these cases.

Local verification: focused tests **9/9**, full suite **340/340** across
**58 files**, `npm run lint`, TypeScript `--noEmit --incremental false`, and
`git diff --check`. No local production build was run against the active
workspace; the frontend PR's CI separately runs lint, tests and build.
