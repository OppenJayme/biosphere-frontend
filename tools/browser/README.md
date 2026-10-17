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
