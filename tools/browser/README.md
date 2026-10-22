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
