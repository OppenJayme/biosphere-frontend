# Optional isolated browser tooling

This folder contains browser diagnostics, not application dependencies or a
replacement for Vitest/backend tests. It does not configure Context7, install
additional skills, or authorize testing production or another owner's module.

## Versions and installation

- `@playwright/cli` is pinned to **0.1.22**; the separate lockfile pins its
  Playwright/core dependencies to **1.64.0-alpha-1790635538000**.
- This tooling package requires Node 22 or newer. It is not a stability guarantee
  for the upstream alpha dependencies; review updates explicitly, never `@latest`.
- The initial Windows setup uses an already-installed Microsoft Edge. No browser
  was downloaded. Other machines need that channel or a reviewed config change;
  do not install a browser or OS dependencies without approval.

From the frontend repository root:

```powershell
npm --prefix tools/browser ci --ignore-scripts --no-audit --no-fund
npm --prefix tools/browser run cli -- --version
npm --prefix tools/browser run smoke
npm --prefix tools/browser audit
```

The install is limited to this folder and disables dependency lifecycle scripts.
Do not run global installers, skill installers or the CLI's `install` commands.
The root application package/lockfile and existing skill files are unchanged.
Normal frontend CI does not install or run this optional tool package.

## What the smoke test proves

`smoke.mjs` uses the actual CLI through `cli.mjs`, opens about:blank in a uniquely
named headless session, verifies an intentional assertion produces a failure,
and checks input/click/output behavior in an in-memory fixture. Fixture page
requests are blocked. It closes only its own session in a finally block and
exits nonzero on assertion, command, timeout or cleanup failure.

This proves local CLI/browser compatibility and a failure-sensitive harness.
It does not exercise BioSphere, authentication, database writes, offline sync,
an actual interrupted server commit, or a maintained Playwright E2E test suite.
The next proposed pilot is the existing offline lost-response/retry workflow,
using approved development fixtures and independently defined expected results.

## Safe manual use

### Public submission uncertainty regression

Run `npm run test:public-submissions:browser` from the frontend root with the
existing application/browser dependencies and installed Edge. No application
URL, credentials or database is accepted. Vite bundles the real inquiry/visit
forms, validators, feedback components and submission helper with fixed synthetic
public configuration (`envDir: false`, no public assets). A fresh isolated
context permits only intercepted requests to `public-submissions-fixture.test`;
other destinations are aborted. No local app server or live backend is used.

Sixteen scenarios include the original fourteen covering both forms across
malformed receipts, transport loss,
503, validation rejection, rate limiting, confirmed success and pending response.
Checks include retained fields/consent, focused uncertainty feedback, disabled
resubmission including requestSubmit, explicit acknowledgement without a POST,
explicit subsequent send, valid reference display, send-another reset and
pending-request protection. Two added merged-dialog scenarios drive the real
VisitOptionsSection through transport loss, acknowledgement, 503, another
acknowledgement, success and Done. They check retained fields/consent, focused
warning inside the modal, Cancel/Close Tab boundaries while Send is disabled,
explicit POST counts and final opener/scroll restoration. Only HTTP is synthetic.
The uniquely named session
closes on success/failure; generated artifacts remain ignored. These checks do
not establish server-side idempotency, actual stored/lost responses, email
delivery, real proxy/CORS behavior, unsent/pending-close recovery or full
accessibility.

Merged integration checkpoint - 2026-10-29: on frontend develop
`dad7a561397f0b0d97d1ea08ac2b3c58f6362347` (merged #92/#93), all sixteen
scenarios passed and the owned browser session closed. The two additional flows
use the actual VisitOptionsSection and native Modal together with the merged
forms; prior isolated results remain historical at their recorded SHAs. Focused
tooling lint and TypeScript passed. No application-source change, full-suite
rerun, production build, running-app restart, live submission/email or database
operation was performed for this test-only integration follow-up. Backend #212
and its independent review remain separate.

### Notification bell state regression

Run `npm run test:notifications:browser` from the frontend root with existing
root/browser dependencies and installed Edge. No application URL or login is
accepted. Vite bundles the real bell without application environment/public
assets; a fresh isolated context receives synthetic intercepted HTTP responses
only. No application server, museum record, email or actual backend is used.

Seven scenarios cover read/dismiss with unchanged pending-work counts, three
failure/explicit-retry paths (503, transport loss, malformed acknowledgement),
pending double-click prevention, a stale pre-mutation response, and hidden
controls for a legacy/disabled backend. No internal component collaborator is
mocked. Only the remote HTTP boundary is synthetic. The named session closes
on normal success/failure and generated artifacts remain ignored. This is not
live provider/auth, shared database or production deployment acceptance.

The paired backend guide is `docs/NOTIFICATION_STATE_GUIDE.md`. Backend
`NOTIFICATION_STATE_ENABLED` stays off until the migration and runtime-role
deployment checks are separately verified. No new frontend environment flag
or browser authentication export is required.

### Offline containment preflight

This opt-in cross-repository check requires sibling `biosphere-backend` and
`biosphere-frontend` checkouts containing the containment changes, backend's
offline disposable database fixture, existing installed root/browser dependencies,
Windows local Docker, its pinned cached PostgreSQL image and installed Edge.
From the **backend** root run `npm run test:offline:containment`. Normal CI does
not run it or install a browser/Docker image. Do not invoke the frontend runner
with an application URL; it accepts no CLI targets and reads only its parent's
ephemeral loopback fixture descriptor on stdin.

The real offline panel, hook, Dexie and sync modules are bundled with Vite
(`configFile: false`, `envDir: false`); no remote Server Action or `.env` is loaded.
A fresh nonpersistent context and origin receive a synthetic owner, no cookies
or preexisting IndexedDB. The panel opens/cancels its modal; no draft is saved.
The permanent read-only adapter rejects non-GET requests, credentials, foreign
origins, host mismatches, unknown paths and query overrides. Its sole backend
forward is a fixed protected audit GET to the owned Nest fixture, using a
synthetic identity; only a readiness boolean returns. Cache reads return an
explicit 503: cache population is **not** tested here.

Browser default-deny interception and a restrictive document CSP add protection.
A separate in-memory canary observes one permitted synthetic POST and zero
blocked POST arrivals across five observations over one second, after the probe
tab closes. Direct Node HTTP checks also bypass browser interception to verify
adapter denial against independently counted owned servers. Owned SQL counts
must remain zero specimens, receipts and audits. Normal success/failure paths
close only the owned session, adapter, backend and container. Generated bundles
remain ignored under `artifacts/`; no app processes or signed-in windows are
controlled.

This is bounded preflight evidence, not an OS/network sandbox or process-crash
cleanup guarantee. It does not exercise interrupted draft writes, successful
sync, real Next authentication/route middleware, styling, service workers/PWA,
provider login, shared records or production DB containment. DEF-019 remains
open; its disabled shared-backend pilot must stay disabled. A later interruption
slice needs an explicitly agreed write-capable owned adapter, not removal of
these protections against shared servers.

#### Collapsed-panel harness repair — 2026-11-12

On backend `4eabc11` and frontend `77642f4`, the unchanged preflight passed its
two direct adapter-denial tests but failed its real-panel browser case. The
online workspace now defaults to collapsed when no drafts are pending; the
harness waited for the hidden empty-queue text without opening the panel.
The repaired harness opens the workspace through its accessible toggle only
when `aria-expanded` is false, then retains the existing queue/modal checks.

The same `npm run test:offline:containment` command from the owned sibling
backend now passes **3/3**. The permanent write denial, credential/origin/target
checks, browser default-deny routes, independent canary samples and zero SQL
specimen/receipt/audit assertions are unchanged. Only synthetic identities and
fresh owned services were used; no application environment files or login state
were copied. The browser and owned database were cleaned up.

This repairs the stale harness, not DEF-019's historical shared-target leak.
DEF-019 remains open and that diagnostic stays disabled. No accepted-write,
lost-response recovery, real authentication or PWA check was performed here.

### Owned offline lost-response recovery

After the approved containment preflight, run `npm run test:offline:recovery`
from the sibling backend root with matching recovery changes in both checkouts.
It uses the same existing Docker/image/Edge/dependency prerequisites and stays
outside normal CI browser discovery. No CLI target URLs or saved profiles are
accepted; the parent supplies its newly owned adapter origin on stdin.

The real panel/hook/Dexie/sync modules save one synthetic draft while the fresh
context is offline. Reconnecting runs the real two-second stable-connection
queue. A **separate** write-capable fixture adapter permits only the complete
expected synthetic payload, one draft UUID and at most two forwards, to one
fixed owned Nest endpoint/identity. It holds the first successful response
without sending headers/body, then observes that fixture tab's connection close.
No page-scoped held-route callback controls the backend destination.

A new tab in the same isolated context/origin mounts offline, so recovery can
be inspected before automatic retry. The interrupted alert, disabled offline
Retry and unchanged editable fields are checked. Reconnecting automatically
retries through the real hook; the backend must return `alreadySynchronized`
and the original specimen ID. The UI must show Synchronized and an Uncataloged
cached record, with no Retry control. Parent SQL checks require exactly one
specimen, receipt, audit and successful sync audit; public eligibility stays off.
Cache-list GET still returns 503 and is not counted as cache-list coverage.

The fixture CSP permits inline bundle execution and Zod's runtime `new Function`
compiler (`unsafe-eval`); network connections remain same-origin and browser
requests default-deny outside the exact fixture routes. This is **not** a
production CSP recommendation/change. No app component or remote response is
mocked; the HTTP facade replaces Next's session/route boundary. Vite ignores
environment configuration and public assets. Errors include only synthetic
fixture text/state; generated bundles remain ignored.

2026-10-28: two complete consecutive runs passed (25.7s and 26.8s). Earlier
attempts exposed a fixture CSP incompatibility and incorrect SQL column name,
both corrected. One earlier wait for Synchronized timed out without sufficient
state diagnostics; richer bounded diagnostics were added, and that timeout did
not recur in the two complete runs. Its cause is unestablished, not a confirmed
app defect or a justified flaky-test suppression. No production fix is claimed.

Normal cleanup closes only the owned session/servers/tmpfs database. This is
tab-close/accepted-write recovery, not a browser/OS crash, real Next/PWA auth,
provider expiry, deployed database or independent acceptance test. DEF-019 stays
open and its shared-backend pilot remains disabled. Do not replace the parent
fixture with shared application ports or remove the original read-only adapter.

### Duplicate-warning component regression

From the frontend root, run `npm run test:duplicates:browser` after the existing
root and optional browser dependencies are installed. This opt-in check uses
the Vite bundler already supplied by Vitest; it installs nothing and does not
run as part of ordinary Vitest/CI discovery.

The actual duplicate-warning component, React renderer, candidate validation,
transport wrapper and duplicate list run in a fresh headless Edge context on
`about:blank`. Only the remote duplicate-check Server Action is replaced by
synthetic delayed responses. Page network requests are aborted; no application
server, credentials, live API, records or environment files are needed.

Six scenarios cover editing during a pending check, reversed response order,
each of the three matched fields' settled-result invalidation/failed transport/
same-candidate retry/clearing, and an unrelated remarks edit. The pending-edit
assertion was observed failing before the input-invalidation fix (DEF-026).
This is mounted component behavior, not deployed Next Server Action, backend
matching/database, production-build or independent acceptance evidence. It also
does not assert that a newer response renders while an older request is still
pending; that transition timing is outside this regression's claim.

The harness loads no Vite config or `.env`, writes only ignored bundles/scripts
under `tools/browser/artifacts/`, and closes only its unique temporary session
in `finally`. Existing signed-in sessions and servers remain untouched.

### Manual CLI commands

```powershell
npm --prefix tools/browser run cli -- -s=biosphere-review open about:blank
npm --prefix tools/browser run cli -- -s=biosphere-review snapshot
npm --prefix tools/browser run cli -- -s=biosphere-review close
```

`cli.config.json` selects isolated headless Edge and ignored artifact output.
Sessions use disposable contexts, not the everyday browser profile. Do not use
attach/CDP, --persistent, --profile, global close-all/kill-all, or saved personal
auth state. When a headed browser is needed, make that an explicit choice.

`cli.mjs` invokes the local package without shell interpolation, uses this
folder as its working directory, does not load environment files, disables
update notifications, and forwards only allowlisted OS/browser environment
variables rather than application secrets, NODE_OPTIONS or arbitrary proxy/npm
credentials. Network/proxy-dependent setups may require separate review.

This is dependency/session isolation and defense in depth, **not an OS sandbox**.
The third-party process still has the permissions of the user running it;
dependency installation/execution and browser background services are not
guaranteed network-free. Use only reviewed tooling and authorized test targets.

Never put passwords, tokens or service keys into CLI arguments, source files,
snapshots or shared output. Even development browser traces/requests can reveal
cookies, headers and museum records. Do not use request/header/cookie dump
commands in an authenticated session without a redaction plan. No authentication
or private museum data is needed for the fixture smoke test.

## Artifacts and cleanup

Snapshots/output go to ignored `tools/browser/artifacts/`; local CLI metadata
directories, known auth-state/profile paths and nested dependencies are ignored
by the repository. The upstream CLI may also keep named-session metadata and
temporary browser files in its OS cache/temp directories. Closing a session is
not a claim that every diagnostic file was securely erased.

Keep any manually exported state inside the ignored artifact folder, never
elsewhere in the repo. Ignoring files prevents normal accidental staging; it
does not encrypt them or make force-adding safe. Inspect staged filenames before
every commit. Close the specific test session after use and sanitize evidence
before sharing it. Do not delete all browser caches or user profiles.

To roll back: close this workspace's named test sessions, then revert the
reviewed tooling commit via the normal PR workflow. That removes tracked setup
and ignore changes, not ignored artifacts/dependencies or OS cache files. Review
those exact paths before any cleanup; do not blanket-delete a user's browser
data. No runtime app settings or global packages need reverting.

## Sources

- [Microsoft Playwright CLI](https://github.com/microsoft/playwright-cli)
- [Published package](https://www.npmjs.com/package/@playwright/cli/v/0.1.22)
- The existing skill in `.agents/skills/playwright-cli/` (from the repo root)
  documents commands; use `run cli -- --help` for this pinned implementation.

## Verification - 2026-10-18

Initial install used lifecycle scripts disabled and the existing Edge channel.
Verified locally on Windows with Node 24.7.0:

- Clean isolated `npm ci --ignore-scripts --no-audit --no-fund`: passed.
- CLI version: 0.1.22; fixture smoke passed again after the clean install and
  after converting the launcher/harness to ES modules for project lint rules.
- An intentional fixture failure was detected; successful fixture input/click
  assertions passed and the test sessions were closed.
- Isolated `npm audit --json`: zero known findings at check time.
- Existing frontend Vitest suite: 56 files / 321 tests passed; full lint passed.
- Artifact-ignore checks and application package/lockfile unchanged checks passed.

No application production build was rerun for this tooling-only change, and no
real BioSphere workflow was automated. Node 22, other operating systems, and
other browser channels were not verified. The empty tool advisory report does
not assess the application's dependencies or prove that either is secure.

## DEF-019 investigation: disposable request canary

The shared-backend interruption pilot created a labelled server fixture despite
its intended interception. It is recorded as **DEF-019** in the backend's
`docs/TEST_DEFECT_LOG.md`; that ignored pilot remains disabled. Do not rerun it
against the shared app or delete its retained evidence fixture automatically.

The replacement investigation below deliberately does **not** open BioSphere.
`isolation-server.mjs` binds only `127.0.0.1` on an OS-assigned port, refusing
3000/3001. It counts four fixed synthetic POST paths in memory, discards bodies,
rejects Cookie/Authorization headers and unknown routes, and has no database,
outbound forwarding, app imports or environment-file loading. It is a disposable
HTTP fixture, not a separate BioSphere backend or an OS/network sandbox.

```powershell
# Built-in Node tests; no optional browser dependencies needed.
npm --prefix tools/browser run isolation:unit

# Existing pinned CLI/Edge installation needed; no URL/config arguments accepted.
npm --prefix tools/browser run isolation:check
```

`isolation-check.mjs` starts its own fresh uniquely named nonpersistent browser
session through the existing environment-filtering CLI wrapper. It never loads
saved auth state, contacts app ports, changes the signed-in session, or imports
application data. Async child execution keeps the counting server responsive.
Only the generated canary origin is permitted by fixture context routing;
that routing is defense in depth, **not** an independent containment guarantee
or a claim that browser background services are network-free.

The positive control sends one real synthetic POST and verifies the server
counter changes to one. An intentionally false zero-arrival assertion must
throw, showing the observer cannot silently report no writes. An intentional
browser assertion also must produce a failed CLI command. Then it compares:

- A held page route followed by tab closure, release and attempted abort.
- Abort while the page is still alive, awaiting fetch rejection before closing.
- Context offline before closing a held-request page; restore only this fresh
  fixture context afterward, never the signed-in application context.

Five server reads, spaced 200 ms apart after the browser cases, check for delayed
arrivals. The held-close case is **observational**: either zero or one arrival
is reported, and `heldCloseLeakObserved` makes any observed arrival explicit.
A zero exit code does not mean that held page routes guarantee isolation.
Abort-before-close and offline-before-close counts must remain zero; repeated
unexpected arrivals, CLI errors, counter failures or cleanup failures fail the
command. Finally, it closes only its own named session and counting server;
it never uses global browser cleanup or stops application servers.

### Local evidence — 2026-10-22

The HTTP contract test first failed before the server implementation existed,
then passed after implementation. Both current HTTP tests pass, including
credential/unknown-route rejection (including empty credential headers). Five
complete fresh-session browser runs
each reported `{control: 1, held: 0, aborted: 0, offline: 0}` during the bounded
one-second observation window. No BioSphere records/accounts were used.

The minimal canary **did not reproduce** DEF-019's unexpected write. It does not
establish its cause, close the defect, authorize re-enabling the disabled pilot,
or prove indefinite isolation across other platforms/versions/process crashes.
No offline sync, authentication, IndexedDB, database commit/idempotency or app
acceptance claim follows from these synthetic fixture results. Any full-stack
interruption retest still requires an explicitly approved disposable target and
independently established containment.

Frontend CI runs only the built-in HTTP contract tests plus its usual app checks.
The optional real-browser canary remains manual; CI does not install Edge or
the optional tool package. No dependencies or lockfiles changed in this addition.

Local verification used Node 24.7.0/Windows with the existing Edge install:
HTTP tests 2/2, application Vitest suite 340/340 across 58 files, full lint and
`git diff --check`. An added empty-credential-header case first failed (204
instead of 400), then passed after changing the counter's guard to reject header
presence, not just nonempty values. An unsupported target argument was also
rejected before the server/browser started. A local application build was not run against
the active workspace; normal PR CI separately checks Node 22 and the app build.

### Public dialog keyboard regression

Run `npm run test:public-dialogs:browser` from the frontend root with the
existing application/browser dependencies and supported installed Edge channel.
The runner accepts no live URL or login. It bundles the real VisitOptionsSection,
Modal and both real forms using fixed synthetic public configuration, no .env
or public assets. A fresh isolated browser permits only its intercepted fixture
GET; every other request is blocked and counted. No submission is performed.

Six scenarios cover inquiry/visit dialogs closed through Escape, the Close
button or Cancel, using actual keyboard actions. Checks include initial focus,
forward/backward Tab wrap, denied programmatic background focus, normal field
navigation, return to the opening button, and restoring both empty and nonempty
body scroll styles. Zero unexpected/non-read requests and zero browser runtime
errors are required. Only its own uniquely named session is closed on success
or failure; artifacts stay ignored. These are real DOM keyboard checks with the
production React fixture bundle, not a deployed-build, CSS/visual, mobile,
screen-reader or full accessibility certification. The StrictMode wrapper does
not imply development Strict Effects were executed in this production bundle.
Pending-submit close/retention policy and server-side request behavior remain
separate and are unchanged by this dialog-only repair.
