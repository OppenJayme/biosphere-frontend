# BioSphere frontend progress report

> **Screenshots are not in Git.** The `screenshots/` evidence images (103 files) were captured from the shared database and show real account emails, so they are kept out of the repository per CLAUDE.md. The image links below resolve only in a local copy of this folder; ask the report author for the files.

Verified on **2026-11-04/05** by black-box testing of `biosphere-frontend` `develop` @ `248bf53`
against the local backend `develop` @ `06545c0`. The frontend ran as a production build (`npm run build` +
`npm run start`) so that the offline service worker was active. Playwright CLI 0.1.23 drove Google Chrome with fresh
profiles; the Curator and Developer test accounts were signed in by hand.

> **Scope of writes.** The local backend talks to the shared Supabase database and real Brevo email, so this run
> was read-only plus invalid input. Valid submissions, saves, sends, uploads, report generation and lot moves were
> not executed. Requirements that need them are rated from the latest live BBT on unchanged code and are marked
> *prior* in the tables. One offline draft was created and discarded on the device while offline; nothing reached the server
> (verified by search afterwards). The only server-side records this run created are the audit entries for the sign-ins,
> the deliberately failed sign-in and the denied developer-page calls.

## Overall frontend progress

**92.8%** of frontend-applicable SRS requirements are Done (priority-weighted).

| Measure | Value |
| --- | --- |
| SRS v0.10 functional requirements | 192 (191 `REQ-4.x-yy` IDs plus `REQ-4.9.16`, a typo for REQ-4.9-16) |
| With a frontend surface (scored) | 170 |
| No frontend surface (excluded) | 22 — backend logging, email content, deployment backup/restore and process rules |
| Done / Partial / Not Started | 157 / 10 / 3 |
| **Frontend % (required formula)** | **92.8%** |
| Same data on the last report's method (Done 1, Partial 0.5, unweighted) | 95.3% |
| Unweighted share Done | 92.4% |
| Test cases run | 94 (84 pass, 10 fail), plus lint, 501/501 unit tests and a 48-route build |

**Formula.** For module *m* (and for the whole frontend, over all scored requirements):

```
percent(m) = Σ weight(r) × done(r) / Σ weight(r) × 100     over requirements r in m with a frontend surface
weight(r)  = 2 if SRS priority is High, 1 if Medium          (SRS: High = MVP; Medium = deferrable via scope control)
done(r)    = 1 if status is Done, else 0                     (Partial and Not Started earn nothing)
```

Requirements with no frontend surface are left out of both sums, as the previous reports did. The overall figure
is computed over all scored requirements, not averaged across modules.

Status rules: **Done** means the UI works end to end against the real API. **Partial** means the UI exists but is broken, uses
placeholder data, or is switched off or not wired up. **Not Started** means no UI exists.

## Sources read

| Source | Date | Location | Use |
| --- | --- | --- | --- |
| SRS v0.10 | — | `docs/BioSphere-SRS.pdf` | 192 requirements, IDs and priorities (184 High, 8 Medium) |
| Module ownership register | 2026-11-02 | backend `docs/ACCEPTANCE_TEST_PLAN.md` §3 | Owners per module |
| **Frontend Progress (last report)** | 2026-11-03/04 @ `248bf53` | Claude artifact *BioSphere Frontend Progress* (claude.ai/artifact/H59jkW2x9ReBWv76nvJ1af) | Comparison baseline: claims 95% |
| System Progress | 2026-11-03/04 | artifact *BioSphere System Progress* (ANxAtnCDy9zgomxqArLCuF) | Same frontend figures; whole system 94% |
| Completion Report 28 Oct | 2026-10-28 @ `f3f38b2` | artifact *BioSphere Completion Report 28 Oct* (8oFAEAcX5C2Hxj2giU6PAR) | Scoring method the last report reuses; gap lists |
| Black-Box Test Report | 2026-11-03/04 | artifact *BioSphere Black-Box Test Report* (NorAHzUnJghkM2561fwco2) | 37 cases (33 pass) + 8 email-delivery checks |
| BBT results register | 2026-10-27/28 | Google Drive `BioSphere-BlackBox-Results.csv` (folder Capstone-2-BlackBox-Testing) | 140 cases: 133 pass, 6 fail, 1 not verified |
| Chapter 5 draft | 2026-10-29 | Google Drive `BioSphere-Chapter5-DRAFT.docx` | Summarises the 140-case BBT, unit-test counts |

No progress report or BBT file exists in this repository's `docs/`. The reports are Claude artifacts and Drive files, as listed above.

## How each BBT / progress-report conflict was settled

| # | Topic (SRS) | BBT says | Progress report says | Tested 2026-11-04/05 | Settled as |
| --- | --- | --- | --- | --- | --- |
| 1 | Notification read/dismiss (REQ-4.3-07) | 27 Oct BB-DSH-07 **Fail**: no control | Built (#91, 28 Oct), counted Done behind a rollout flag | No Mark as read / Dismiss in the bell; the backend `.env` does not set `NOTIFICATION_STATE_ENABLED` (DSH-03) | **Partial.** The code is real, but it is switched off here and has never been switched on in a tested environment. The BBT predates the merge; the report overstates. |
| 2 | Curator email alert (REQ-4.3-09, 4.8-08, 4.9-07) | 27 Oct BB-DSH-06 **Fail**; 4 Nov MAIL-02/05 delivered | Not scored on the frontend | In-system alert works (DSH-02); email not re-sent | Frontend in-system part **Done**; email is backend (excluded). The later BBT supersedes the 27 Oct failure. |
| 3 | Import duplicate warning (REQ-4.4-21) | 27 Oct BB-IMP-02 **Fail**; Chapter 5 lists it as a defect | §4.4 100% | Preview flags the same-species row (IMP-02 Pass) | **Done.** The BBT failure no longer reproduces; the report is right. |
| 4 | Lot capacity warning (REQ-4.6-11) | 27 Oct BB-SPC-08 **Fail** | §4.5 and §4.6 100% | Not re-runnable without creating a lot; no frontend lot change since the BBT | **Partial** (last live evidence fails). The report overstates. |
| 5 | Curator activation / handover (REQ-4.1-08/09) | BB-USR-04 **Fail** | Missing (§4.1 75%) | No controls; Users page says it is done through the developer interface (USR-03) | **Not Started.** Aligned. |
| 6 | Change own password (REQ-4.1-16) | BB-USR-05 **Fail** | Missing | Profile menu: Sign out only (USR-05) | **Not Started.** Aligned. |
| 7 | Developer curator status (REQ-4.2-03) | 3 Nov DEV-07 **Fail** (medium) | §4.2 100%, noted as an issue | All 8 curators shown Active; `/users` shows 2 Pending Invite (DEV-02) | **Partial.** The report overstates. Root cause: backend `/developer/curators` response. |
| 8 | QR URL host (REQ-4.12-04/05) | 3 Nov CUR-09 **Fail** (medium) | §4.12 100% | URL still `*.trycloudflare.com` (EXH-02) | Frontend **Done**. The host comes from the local backend `PUBLIC_SITE_URL`: a deployment setting, not code. Kept as a release blocker. |
| 9 | Placeholder FAQ entry (REQ-4.11-04) | 3 Nov CUR-10 **Fail** (medium) | §4.11 100% | 'Who is sir Fidel' still Active and suggested (FAQ-05) | **Done** for the code. This is a curator-data issue, listed under UI issues. |
| 10 | Completed-visit summary error (REQ-4.9-12) | 27 Oct BB-VRM-04 Pass (status flow only) | §4.9 100%, but lists the bug as medium | 3/3 Completed visits show 'The summary could not be loaded' (VRM-02) | **Partial.** The report scores 100% while describing the bug; overstated. |
| 11 | Backup history (REQ-4.15-06) | 27 Oct BB-AUD-04 **Not Verified** (empty list) | §4.15 83%, history page only | 1 recorded backup listed; no failure notification (BAK-01) | **Partial.** Aligned. |
| 12 | About page content (REQ-4.10-06) | BB-PUB-03 Pass | §4.10 100% | Personnel entry is placeholder: `+63 XXX XXX XXXX`, and a project developer is shown as Museum Director (PUB-04) | **Partial.** Both documents missed it. |
| 13 | Gallery imagery (REQ-4.10-04) | BB-PUB-02 Pass | §4.10 100% | 4 of 19 Gallery images are Unsplash stock marked 'placeholder' in code | **Partial.** Both documents missed it. |
| 14 | Visit dialog layout | 3 Nov PUB-08 Fail (minor) | Not mentioned | Option card still clipped at 1440 px (PUB-08) | Confirmed UI issue (no SRS failure). |
| 15 | Unit-test count | Chapter 5: 426 in 71 files | 501 in 77 files | 501/501 in 77 files | The progress report is right; Chapter 5 is out of date. |
| 16 | Requirement count | Chapter 5: 193 | Completion report: 190 scored | 192 parsed from the SRS | **192.** Neither document's base matches. |
| 17 | Green Sea Turtle exhibit content | Not mentioned | High: offensive placeholder | Text still 'ninja tortol' / 'Ninja Tortol'. Not screenshotted, to keep the image out of the repo | The progress report is right; still open. |

## UI map against the SRS

Every page in `src/app` with the SRS section it serves and where its data comes from. Curator pages fetch on the server
through `src/lib/api-client.ts` (bearer token forwarded to the NestJS backend). The browser therefore sees only RSC and
same-origin calls, and real-API use was confirmed from live database records on every page plus the import trace.

| Route | SRS | Data source | Verified |
| --- | --- | --- | --- |
| / (Home) | 4.10-01/02, 4.11 | Static source + Unsplash placeholders; FAQ widget calls `GET /faq/assistant/suggestions`, `POST /faq/assistant/ask` | PUB-01, FAQ-01..04 |
| /gallery | 4.10-04 | Static `collections-data.ts`; **4 stock placeholder images** | PUB-02 |
| /visit (+ Request a Visit dialog) | 4.10-05, 4.9-01..06 | Static page; dialog posts to backend public endpoint | PUB-03, VIS-01..05 |
| /about | 4.10-06 | Static; **placeholder personnel data** | PUB-04 |
| /inquiry | 4.8-01..03 | Backend public endpoint | INQ-01..03 |
| /exhibits/[slug] | 4.12-07..12, 4.13 | Backend public exhibit API + model-viewer | QRP-01..03 |
| /login, /login/forgot-password, /login/verify, /login/reset-password, /login/accept-invite | 4.1-01/03/10/19 | Supabase Auth | AUTH-01..05 |
| /dashboard | 4.3-01..04 | Backend dashboard summary | DSH-01 |
| Notification bell (layout) | 4.3-05..08 | `/api/notifications` -> backend feed | DSH-02/03 |
| /specimens, /specimens/new, /specimens/[id], /edit, /history | 4.4, 4.7-01..03 | Backend specimens API | SRC-01..04, SPC-01..04 |
| /specimens/[id]/taxonomy, /provenance, /media | 4.4-09/12 | Backend | CUR sweep |
| /specimens/[id]/tags | No direct SRS ID (supports 4.7-01 search identifiers) | Backend | CUR sweep |
| /specimens/collections | No direct SRS ID (supports 4.3-01 / 4.7-02 collection categories) | Backend | CUR sweep |
| /specimens/[id]/lots, /lots/new, /lots/[lotId] | 4.5, 4.6-05/06/09/11 | Backend lots API | LOT-01..04 |
| /cataloging, /cataloging/import | 4.4-06..08, 4.4-19..21 | Backend; preview via `/api/cataloging/specimens/import/preview` | SPC-02, IMP-01..04 |
| /storage | 4.6 | Backend storage-locations API | STO-01..03 |
| /public-website (inquiries, visits tabs) | 4.8-04..11, 4.9-08..16 | Backend inquiries + visit-requests | INQM-01..03, VRM-01..04 |
| /exhibits (curator) | 4.12-01..06, 4.13-02 | Backend exhibits; QR via `/api/exhibits/[id]/qr` | EXH-01..04 |
| /faq-knowledge | 4.11-02/03/09 | Backend FAQ knowledge | FAQK-01/02 |
| /faq-knowledge/review | No SRS ID (opt-in review queue, off by default) | Backend | CUR sweep |
| /reports | 4.7-04..15 | Backend; download via `/api/reports` | RPT-01..03 |
| /audit-logs | 4.15-02..04 | Backend audit API | AUD-01 |
| /backup-history | 4.15-06/10 | Backend backup history | BAK-01 |
| /users | 4.1-02/07/08/09 | Backend user-accounts | USR-01..03 |
| Offline workspace (on /specimens) | 4.14, 4.3-03 | IndexedDB + `/api/offline/*` | OFF-01..07 |
| /developer | 4.1-13, 4.2, 4.13-03 | Backend developer API; uploads via `/api/developer/ar-assets` | DEV-01..07 |

**Missing screens.** Change own password (REQ-4.1-16). Curator activation, deactivation and handover (REQ-4.1-08/09).
Notification read/dismiss, built but switched off (REQ-4.3-07). Sync-failure and backup notifications (REQ-4.3-05/10, 4.15-06).
No inactivity timeout (REQ-4.1-05).

**Screens with no SRS requirement.** `/faq-knowledge/review` (opt-in visitor-question queue), `/specimens/[id]/tags` and
`/specimens/collections` support SRS needs indirectly, but no requirement asks for them.

**Mock or placeholder data.** No curator page reads mock data. `src/lib/dummy-data/exhibits.ts` and `specimens.ts` exist but nothing imports them
(dead code since 2026-10-05). The public site uses Unsplash placeholders (`src/lib/placeholder-images.ts`, labelled "standing in for real
museum photography"), placeholder About personnel (`src/app/(public)/about/page.tsx:54-60`) and a privacy notice still marked
`TODO(curators)` (`src/components/public-forms/FormParts.tsx:13`). A comment in `src/components/dashboard/PublicQrReadiness.tsx:61`
says `/exhibits` "still renders placeholder data"; that is stale, since `/exhibits/[slug]` reads the backend.

## Results by module

Each module table lists every SRS requirement. *Last report* is the requirement status implied by the 3–4 Nov report
(see the comparison section); *Source* is `live` (tested in this run), `prior` (not re-run because it writes or sends; rated
from the latest live BBT on unchanged code) or `n/a`.

### §4.1 Authentication and Curator Account Management — 71.4%

Owner: Voltaire Ratilla. Done 10, Partial 1, Not Started 3, no frontend surface 5.
Tests: 18 pass, 3 fail. Last report: 75% (Aligned).

| Requirement | Pri. | Status | Test result | Owner | Screenshot | Last report | Alignment | Source / evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **REQ-4.1-01** The system shall authenticate registered and active curator accounts before granting access to curator functi… | H | Done | AUTH-02 Pass, AUTH-06 Pass | Voltaire Ratilla | [AUTH-02-wrong-credentials.png](screenshots/AUTH-02-wrong-credentials.png) | Done | Aligned | live: Valid sign-in works; wrong password refused generically. |
| **REQ-4.1-02** The system shall provide each curator with separate credentials and shall not require credential sharing. | H | Done | USR-01 Pass | Voltaire Ratilla | [USR-01-users.png](screenshots/USR-01-users.png) | Done | Aligned | live: Each curator has a separate account; invitations are per person. |
| **REQ-4.1-03** The system shall prevent public self-registration for curator accounts. | H | Done | AUTH-01 Pass | Voltaire Ratilla | [AUTH-01-login.png](screenshots/AUTH-01-login.png) | Done | Aligned | live: No registration link or route. |
| **REQ-4.1-04** The system shall create a protected authenticated session after successful login. | H | Done | AUTH-06 Pass, CUR-SWEEP Pass | Voltaire Ratilla | [CUR-01-dashboard.png](screenshots/CUR-01-dashboard.png) | Done | Aligned | live: Session persists across all curator pages. |
| **REQ-4.1-05** The system shall provide secure logout and terminate the session after logout or approved inactivity timeout. | H | **Partial** | AUTH-05 Pass | Voltaire Ratilla | [AUTH-05-logout.png](screenshots/AUTH-05-logout.png) | Partial | Aligned | live: Logout ends the session. No inactivity timeout exists in the frontend. |
| **REQ-4.1-06** The system shall prevent unauthenticated users from accessing protected curator or developer routes, restrict… | H | Done | AUTH-G1 Pass, AUTH-G2 Pass | Voltaire Ratilla | [AUTH-G1-signed-out-redirect.png](screenshots/AUTH-G1-signed-out-redirect.png) | Done | Aligned | live: All 16 protected routes and API handlers refuse anonymous access. Low issue: 3 routes drop the return path. |
| **REQ-4.1-07** The system shall allow an authorized curator to initiate the creation of a separate account for another autho… | H | Done | USR-02 Pass | Voltaire Ratilla | [USR-02-invite-invalid-email.png](screenshots/USR-02-invite-invalid-email.png) | Done | Aligned | prior: Invite form validates; sending not re-run (would email). BBT 27 Oct BB-USR-03 passed. |
| **REQ-4.1-08** The system shall allow an authorized curator to activate or deactivate another curator account only according… | H | **Not Started** | USR-03 Fail | Voltaire Ratilla | [USR-01-users.png](screenshots/USR-01-users.png) | Not Started | Aligned | live: Users page: account status changes are done through the restricted developer interface. |
| **REQ-4.1-09** The system shall support curator succession or handover by providing the successor with a separate authorized… | H | **Not Started** | USR-03 Fail | Voltaire Ratilla | [USR-01-users.png](screenshots/USR-01-users.png) | Not Started | Aligned | live: No handover workflow in the UI. |
| **REQ-4.1-10** The system shall provide an approved email-based account-recovery or password-reset process using a secure, t… | H | Done | AUTH-03 Pass | Voltaire Ratilla | [AUTH-03-forgot-password-unknown.png](screenshots/AUTH-03-forgot-password-unknown.png) | Done | Aligned | live: Generic response; 8-digit email code flow. |
| **REQ-4.1-11** The system shall record curator account creation, onboarding invitation, password setup, password change, act… | H | N/A | Not re-run | Voltaire Ratilla | — | Done | Excluded | n/a: Backend audit recording. |
| **REQ-4.1-12** The system shall prevent inactive curator accounts from authenticating or receiving new operational permissio… | H | N/A | Not re-run | Voltaire Ratilla | — | Done | Excluded | n/a: Backend/Supabase enforcement; not testable without deactivating an account. |
| **REQ-4.1-13** The system shall authenticate registered and active Developer accounts before granting access to restricted D… | H | Done | DEV-01 Pass, AUTH-06 Pass | Voltaire Ratilla | [DEV-01-developer-interface.png](screenshots/DEV-01-developer-interface.png) | Done | Aligned | live: Developer signs in to /developer. |
| **REQ-4.1-14** The system shall enforce role-based access controls that prevent curators from accessing Developer-restricted… | H | Done | CUR-26 Pass, DEV-06 Pass, DEV-07 Pass | Voltaire Ratilla | [CUR-26-curator-opens-developer.png](screenshots/CUR-26-curator-opens-developer.png) | Done | Aligned | live: Role separation holds in both directions. |
| **REQ-4.1-15** The system shall record successful and unsuccessful authentication attempts and restricted account-management… | H | N/A | AUD-01 Pass | Voltaire Ratilla | [AUD-01-audit-failed-signins.png](screenshots/AUD-01-audit-failed-signins.png) | Done | Excluded | n/a: Backend audit recording (failed sign-in seen in the audit log). |
| **REQ-4.1-16** The system shall allow an authenticated curator or Developer to change their own password after completing th… | H | **Not Started** | USR-05 Fail | Voltaire Ratilla | [USR-05-profile-menu.png](screenshots/USR-05-profile-menu.png) | Not Started | Aligned | live: No change-password page or menu item. |
| **REQ-4.1-17** The system shall not send a current or temporary password through email during onboarding, password change, o… | H | N/A | Not re-run | Voltaire Ratilla | — | Done | Excluded | n/a: Email content rule (backend/Supabase). |
| **REQ-4.1-18** The system should send a confirmation email to the account holder after a successful password change, without… | M | N/A | Not re-run | Voltaire Ratilla | — | Not Started | Excluded | n/a: Confirmation email (backend); blocked anyway by REQ-4.1-16. |
| **REQ-4.1-19** The system shall ensure that onboarding invitations and password-reset links expire after the approved period… | H | Done | AUTH-04 Pass | Voltaire Ratilla | [AUTH-04-wrong-recovery-code.png](screenshots/AUTH-04-wrong-recovery-code.png) | Done | Aligned | live: Wrong/expired code rejected without account detail. |

### §4.2 Restricted Developer Functions — 87.5%

Owner: Voltaire Ratilla. Done 7, Partial 1, Not Started 0, no frontend surface 1.
Tests: 9 pass, 1 fail. Last report: 100% (Overstated).

| Requirement | Pri. | Status | Test result | Owner | Screenshot | Last report | Alignment | Source / evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **REQ-4.2-01** The system shall authenticate the developer before granting access to restricted technical functions. | H | Done | DEV-01 Pass | Voltaire Ratilla | [DEV-01-developer-interface.png](screenshots/DEV-01-developer-interface.png) | Done | Aligned | live: — |
| **REQ-4.2-02** The system shall allow an authorized Developer to provision the initial curator account through the approved… | H | Done | DEV-03 Pass | Voltaire Ratilla | [DEV-03-provision-invalid-email.png](screenshots/DEV-03-provision-invalid-email.png) | Done | Aligned | prior: Provision form validates; sending not re-run. BBT 27 Oct BB-DEV passed. |
| **REQ-4.2-03** The system shall allow an authorized Developer to activate or deactivate a curator account only when formal a… | H | **Partial** | DEV-04 Pass, DEV-02 Fail | Voltaire Ratilla | [DEV-04-deactivate-needs-authorization.png](screenshots/DEV-04-deactivate-needs-authorization.png) | Done | **Overstated** | live: Authorization required, but every curator is shown Active (pending invitations included), so status is wrong on screen. Root cause: /developer/curators returns ACTIVE. |
| **REQ-4.2-04** The system shall allow a developer to upload, replace, activate, deactivate, or remove approved AR assets lin… | H | Done | DEV-05 Pass | Voltaire Ratilla | [DEV-05-ar-upload-blocked.png](screenshots/DEV-05-ar-upload-blocked.png) | Done | Aligned | prior: Upload/activate/deactivate/remove controls present; not exercised. BBT BB-AR-07/08 passed. |
| **REQ-4.2-05** The system shall validate the AR asset's file type, file size, required metadata, technical compatibility, an… | H | Done | DEV-05 Pass | Voltaire Ratilla | [DEV-05-ar-upload-blocked.png](screenshots/DEV-05-ar-upload-blocked.png) | Done | Aligned | prior: Client GLB checks + required authorization; BBT BB-AR-02..06 passed. |
| **REQ-4.2-06** The system shall prevent the developer from creating, editing, archiving, moving, or publishing specimen reco… | H | Done | DEV-06 Pass, DEV-07 Pass | Voltaire Ratilla | [DEV-06-developer-blocked-from-curator.png](screenshots/DEV-06-developer-blocked-from-curator.png) | Done | Aligned | live: — |
| **REQ-4.2-07** The system shall prevent the developer from managing routine locations, inquiries, visit requests, reports, F… | H | Done | DEV-06 Pass | Voltaire Ratilla | [DEV-06-developer-blocked-from-curator.png](screenshots/DEV-06-developer-blocked-from-curator.png) | Done | Aligned | live: — |
| **REQ-4.2-08** The Developer interface shall provide only authorized curator-account controls and approved AR-asset deployme… | H | Done | DEV-01 Pass | Voltaire Ratilla | [DEV-01-developer-interface.png](screenshots/DEV-01-developer-interface.png) | Done | Aligned | live: — |
| **REQ-4.2-09** The system shall audit all developer account and AR deployment actions. | H | N/A | Not re-run | Voltaire Ratilla | — | Done | Excluded | n/a: Backend audit recording. |

### §4.3 Curator Dashboard and Notifications — 70.6%

Owner: Charles Boquecosa, John Gerozaga. Done 6, Partial 3, Not Started 0, no frontend surface 1.
Tests: 10 pass, 1 fail. Last report: 89% (Overstated).

| Requirement | Pri. | Status | Test result | Owner | Screenshot | Last report | Alignment | Source / evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **REQ-4.3-01** The system shall display counts for Uncataloged, Cataloged, and Archived specimen records and selected collec… | H | Done | DSH-01 Pass | Charles Boquecosa, John Gerozaga | [DSH-01-dashboard-full.png](screenshots/DSH-01-dashboard-full.png) | Done | Aligned | live: — |
| **REQ-4.3-02** The system shall display pending general inquiries and visit requests requiring curator attention. | H | Done | DSH-01 Pass | Charles Boquecosa, John Gerozaga | [DSH-01-dashboard-full.png](screenshots/DSH-01-dashboard-full.png) | Done | Aligned | live: — |
| **REQ-4.3-03** The system shall display Online, Offline, Pending Sync, Synchronizing, Synchronized, and Sync Failed states f… | H | Done | DSH-01 Pass, OFF-02 Pass, OFF-04 Pass | Charles Boquecosa, John Gerozaga | [DSH-01-dashboard-full.png](screenshots/DSH-01-dashboard-full.png) | Done | Aligned | live: Online/Offline/Pending Sync seen live; Sync Failed seen in BBT BB-OFF-06. |
| **REQ-4.3-04** The system shall display quick actions for adding a specimen, reviewing requests, opening reports, and review… | H | Done | DSH-01 Pass | Charles Boquecosa, John Gerozaga | [DSH-01-dashboard-full.png](screenshots/DSH-01-dashboard-full.png) | Done | Aligned | live: — |
| **REQ-4.3-05** The system shall provide in-system notifications for new inquiries, new visit requests, sync failures, and ot… | H | **Partial** | DSH-02 Pass | Charles Boquecosa, John Gerozaga | [DSH-02b-notification-opens-record.png](screenshots/DSH-02b-notification-opens-record.png) | Partial | Aligned | live: Bell covers new inquiries, visit requests and failed emails only; no sync-failure alerts. |
| **REQ-4.3-06** The system shall allow the curator to open the related record or module from a notification. | H | Done | DSH-02 Pass | Charles Boquecosa, John Gerozaga | [DSH-02b-notification-opens-record.png](screenshots/DSH-02b-notification-opens-record.png) | Done | Aligned | live: — |
| **REQ-4.3-07** The system shall allow the curator to mark notifications as read or dismissed without deleting or modifying t… | M | **Partial** | DSH-03 Fail | Charles Boquecosa, John Gerozaga | [DSH-02-notifications.png](screenshots/DSH-02-notifications.png) | Done | **Overstated** | live: Built (NotificationBell) but switched off unless the backend sets NOTIFICATION_STATE_ENABLED=true; not usable in this environment. |
| **REQ-4.3-08** The system shall not expose private visitor or specimen details in a notification shown to an unauthorized or… | H | Done | AUTH-G2 Pass | Charles Boquecosa, John Gerozaga | — | Done | Aligned | live: /api/notifications answers 401 signed out. |
| **REQ-4.3-09** The system shall send operational email alerts to the authorized curator when a new General Inquiry or Visit… | H | N/A | Not re-run | Charles Boquecosa, John Gerozaga | — | Done | Excluded | n/a: Email alert is backend. BBT 4 Nov MAIL-02/05 delivered. |
| **REQ-4.3-10** The system shall use in-system notifications rather than email for synchronization failures, incomplete recor… | H | **Partial** | DSH-02 Pass | Charles Boquecosa, John Gerozaga | [DSH-02b-notification-opens-record.png](screenshots/DSH-02b-notification-opens-record.png) | Partial | Aligned | live: No in-system notifications for sync failures, backups or report results. |

### §4.4 Specimen Inventory and Cataloging — 100.0%

Owner: Kyer Jayme (Cataloging); John Gerozaga (inventory). Done 22, Partial 0, Not Started 0, no frontend surface 1.
Tests: 29 pass, 0 fail. Last report: 100% (Aligned).

| Requirement | Pri. | Status | Test result | Owner | Screenshot | Last report | Alignment | Source / evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **REQ-4.4-01** The system shall allow the curator to create and save a specimen record. | H | Done | CUR-SWEEP Pass | Kyer Jayme | [CUR-02-specimens.png](screenshots/CUR-02-specimens.png) | Done | Aligned | prior: Create form loads; save not re-run. Records created 1 Nov (after the 31 Oct redesign) are listed. |
| **REQ-4.4-02** The system shall automatically assign every specimen record a unique system-generated specimen ID. | H | Done | SPC-01 Pass | Kyer Jayme | [SPC-01-specimen-detail-uncataloged.png](screenshots/SPC-01-specimen-detail-uncataloged.png) | Done | Aligned | live: UUID system ID in every record URL. |
| **REQ-4.4-03** The system shall allow the museum accession number or code to remain null until assigned or confirmed. | H | Done | SPC-03 Pass | Kyer Jayme | [SPC-03-new-draft-duplicate-warning.png](screenshots/SPC-03-new-draft-duplicate-warning.png) | Done | Aligned | live: Accession is optional on the draft form. |
| **REQ-4.4-04** The system shall enforce the curator-approved accession-number uniqueness rule after the official format, sco… | H | Done | SPC-03 Pass, IMP-02 Pass | Kyer Jayme | [SPC-03-new-draft-duplicate-warning.png](screenshots/SPC-03-new-draft-duplicate-warning.png) | Done | Aligned | live: Used accession flagged in form and rejected in import. |
| **REQ-4.4-05** The system shall assign each specimen record the status Uncataloged, Cataloged, or Archived. | H | Done | SRC-02 Pass, SPC-01 Pass | Kyer Jayme | [SRC-02-filter-cataloged.png](screenshots/SRC-02-filter-cataloged.png) | Done | Aligned | live: — |
| **REQ-4.4-06** The system shall classify a newly saved record as Uncataloged when at least one applicable required non-image… | H | Done | SPC-02 Pass | Kyer Jayme | [SPC-02-missing-requirements.png](screenshots/SPC-02-missing-requirements.png) | Done | Aligned | live: — |
| **REQ-4.4-07** The system shall classify a record as Cataloged only when all applicable required non-image fields contain va… | H | Done | SPC-02 Pass | Kyer Jayme | [SPC-02-missing-requirements.png](screenshots/SPC-02-missing-requirements.png) | Done | Aligned | live: — |
| **REQ-4.4-08** The system shall identify and display missing or invalid applicable required fields. | H | Done | SPC-02 Pass | Kyer Jayme | [SPC-02-missing-requirements.png](screenshots/SPC-02-missing-requirements.png) | Done | Aligned | live: — |
| **REQ-4.4-09** The system shall allow the curator to view and edit Uncataloged and Cataloged records. | H | Done | CUR-SWEEP Pass | Kyer Jayme | [CUR-02-specimens.png](screenshots/CUR-02-specimens.png) | Done | Aligned | prior: Edit page loads with data; saving not re-run (BBT BB-SPC-04 passed). |
| **REQ-4.4-10** The system shall archive inactive specimen records instead of permanently deleting them through routine curat… | H | Done | SRC-02 Pass | Kyer Jayme | [SRC-02-filter-cataloged.png](screenshots/SRC-02-filter-cataloged.png) | Done | Aligned | prior: Archived tab (9); archive guarded by active lots. BBT BB-SPC-19 passed. |
| **REQ-4.4-11** The system shall prevent Uncataloged and Archived records from being published as public exhibit content. | H | Done | EXH-03 Pass | Kyer Jayme | [EXH-03-create-exhibit-picker.png](screenshots/EXH-03-create-exhibit-picker.png) | Done | Aligned | live: — |
| **REQ-4.4-12** The system shall allow the curator to attach, view, replace, and remove supported specimen images. | H | Done | CUR-SWEEP Pass | Kyer Jayme | [CUR-02-specimens.png](screenshots/CUR-02-specimens.png) | Done | Aligned | prior: Media page loads; upload not re-run (BBT BB-SPC-17 passed). |
| **REQ-4.4-13** Specimen images shall be optional and shall not prevent an otherwise complete record from becoming Cataloged. | H | Done | SPC-02 Pass | Kyer Jayme | [SPC-02-missing-requirements.png](screenshots/SPC-02-missing-requirements.png) | Done | Aligned | live: Checklist has no image item. |
| **REQ-4.4-14** The system shall store classification status and condition information only as entered or approved by an auth… | H | N/A | Not re-run | Kyer Jayme | — | Done | Excluded | n/a: Data-integrity rule enforced by the backend. |
| **REQ-4.4-15** The system shall allow the curator to mark or unmark a Cataloged specimen record as eligible for public exhib… | H | Done | SPC-04 Pass | Kyer Jayme | [SPC-04-cataloged-public-display.png](screenshots/SPC-04-cataloged-public-display.png) | Done | Aligned | live: — |
| **REQ-4.4-16** The public-display flag shall not automatically publish the complete internal specimen record. | H | Done | SPC-04 Pass, EXH-03 Pass | Kyer Jayme | [SPC-04-cataloged-public-display.png](screenshots/SPC-04-cataloged-public-display.png) | Done | Aligned | live: Eligibility and publishing are separate steps. |
| **REQ-4.4-17** The system shall preserve the record creator, last editor, creation date and time, last update date and time,… | H | Done | SPC-01 Pass | Kyer Jayme | [SPC-01-specimen-detail-uncataloged.png](screenshots/SPC-01-specimen-detail-uncataloged.png) | Done | Aligned | live: — |
| **REQ-4.4-18** The system shall allow manual specimen record encoding. | H | Done | SPC-03 Pass | Kyer Jayme | [SPC-03-new-draft-duplicate-warning.png](screenshots/SPC-03-new-draft-duplicate-warning.png) | Done | Aligned | live: — |
| **REQ-4.4-19** The system shall allow import through an approved spreadsheet or CSV template. | H | Done | IMP-01 Pass, IMP-02 Pass | Kyer Jayme | [IMP-01-import-page-template.png](screenshots/IMP-01-import-page-template.png) | Done | Aligned | live: Commit not re-run (BBT BB-IMP-03 passed). |
| **REQ-4.4-20** The system shall validate imported rows and identify missing, invalid, or unmapped values before final saving. | H | Done | IMP-02 Pass, IMP-04 Pass | Kyer Jayme | [IMP-02-preview-invalid-and-duplicate.png](screenshots/IMP-02-preview-invalid-and-duplicate.png) | Done | Aligned | live: — |
| **REQ-4.4-21** The system shall warn the curator when a manually entered or imported record may duplicate an existing record. | H | Done | SPC-03 Pass, IMP-02 Pass | Kyer Jayme | [SPC-03-new-draft-duplicate-warning.png](screenshots/SPC-03-new-draft-duplicate-warning.png) | Done | Aligned | live: Import preview now warns on same-species rows (BBT 27 Oct BB-IMP-02 failure no longer reproduces). |
| **REQ-4.4-22** The system shall not automatically merge or delete possible duplicates; the curator shall decide how they are… | H | Done | SPC-03 Pass, IMP-02 Pass | Kyer Jayme | [SPC-03-new-draft-duplicate-warning.png](screenshots/SPC-03-new-draft-duplicate-warning.png) | Done | Aligned | live: — |
| **REQ-4.4-23** The system shall allow separate records for the same species when they represent different physical groups, c… | H | Done | SRC-01 Pass | Kyer Jayme | [SRC-01-search-common-name.png](screenshots/SRC-01-search-common-name.png) | Done | Aligned | live: Two Acanthaster planci records coexist. |

### §4.5 Specimen Lot Grouping and Quantity Management — 100.0%

Owner: John Gerozaga. Done 11, Partial 0, Not Started 0, no frontend surface 0.
Tests: 6 pass, 0 fail. Last report: 100% (Aligned).

| Requirement | Pri. | Status | Test result | Owner | Screenshot | Last report | Alignment | Source / evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **REQ-4.5-01** The system shall allow one specimen record to contain one or more active specimen lots. | H | Done | LOT-04 Pass | John Gerozaga | [LOT-04-lot-history.png](screenshots/LOT-04-lot-history.png) | Done | Aligned | live: — |
| **REQ-4.5-02** Each specimen lot shall have exactly one storage location, one condition class, and a positive quantity. | H | Done | LOT-01 Pass | John Gerozaga | [LOT-01-quantity-zero.png](screenshots/LOT-01-quantity-zero.png) | Done | Aligned | live: — |
| **REQ-4.5-03** The system shall calculate the specimen record total quantity as the sum of all active specimen-lot quantitie… | H | Done | LOT-04 Pass | John Gerozaga | [LOT-04-lot-history.png](screenshots/LOT-04-lot-history.png) | Done | Aligned | live: Total active quantity 2 = list Qty 2. |
| **REQ-4.5-04** When only part of a lot is moved, the system shall reduce the source lot by the selected quantity and create… | H | Done | Not re-run | John Gerozaga | — | Done | Aligned | prior: Not re-run (write). BBT BB-SPC-10 passed. |
| **REQ-4.5-05** When only part of a lot changes condition, the system shall reduce the source lot and create or update a targ… | H | Done | Not re-run | John Gerozaga | — | Done | Aligned | prior: Not re-run (write). BBT BB-SPC-12 passed. |
| **REQ-4.5-06** A partial location or condition change shall not change the total quantity of the parent specimen record. | H | Done | Not re-run | John Gerozaga | — | Done | Aligned | prior: Not re-run (write). BBT BB-SPC-10/12 passed. |
| **REQ-4.5-07** When a target lot already exists with the same specimen, location, and condition, the system shall merge the… | H | Done | Not re-run | John Gerozaga | — | Done | Aligned | prior: Not re-run (write). BBT BB-SPC-11 passed. |
| **REQ-4.5-08** The system shall prevent a move or condition change from using a quantity greater than the source lot quantit… | H | Done | LOT-03 Pass | John Gerozaga | [LOT-03-move-over-quantity.png](screenshots/LOT-03-move-over-quantity.png) | Done | Aligned | live: — |
| **REQ-4.5-09** The system shall change the overall specimen quantity only through an authorized addition, removal, transfer… | H | Done | Not re-run | John Gerozaga | — | Done | Aligned | prior: Not re-run (write). BBT BB-SPC-13 passed. |
| **REQ-4.5-10** The system shall require or record a reason for quantity removals, condition changes, and location changes wh… | H | Done | LOT-04 Pass | John Gerozaga | [LOT-04-lot-history.png](screenshots/LOT-04-lot-history.png) | Done | Aligned | prior: Reason shown in history; BBT BB-SPC-13 passed. |
| **REQ-4.5-11** The system shall record the acting curator, timestamp, source lot, target lot, and quantity affected for each… | H | Done | LOT-04 Pass | John Gerozaga | [LOT-04-lot-history.png](screenshots/LOT-04-lot-history.png) | Done | Aligned | live: — |

### §4.6 Hierarchical Storage-Location Management — 95.7%

Owner: Kyer Jayme; John Gerozaga (lot placement/movement rows). Done 11, Partial 1, Not Started 0, no frontend surface 0.
Tests: 15 pass, 0 fail. Last report: 100% (Overstated).

| Requirement | Pri. | Status | Test result | Owner | Screenshot | Last report | Alignment | Source / evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **REQ-4.6-01** The system shall support rooms or galleries, cabinets, drawers or shelves, boxes, vials, and other curator-ap… | H | Done | STO-01 Pass | Kyer Jayme | [STO-01-storage-cabinet.png](screenshots/STO-01-storage-cabinet.png) | Done | Aligned | live: — |
| **REQ-4.6-02** The system shall allow the curator to create, view, update, archive, and organize storage units. | H | Done | STO-02 Pass, STO-03 Pass | Kyer Jayme | [STO-02-storage-manage.png](screenshots/STO-02-storage-manage.png) | Done | Aligned | live: Add/edit/move/archive controls present; not submitted. |
| **REQ-4.6-03** The system shall use a parent-child relationship so that a storage unit may be assigned to a valid parent sto… | H | Done | STO-01 Pass | Kyer Jayme | [STO-01-storage-cabinet.png](screenshots/STO-01-storage-cabinet.png) | Done | Aligned | live: — |
| **REQ-4.6-04** The system shall store a unit label, unit type, parent, holds-specimens setting, and optional capacity for ea… | H | Done | STO-01 Pass, STO-03 Pass | Kyer Jayme | [STO-01-storage-cabinet.png](screenshots/STO-01-storage-cabinet.png) | Done | Aligned | live: — |
| **REQ-4.6-05** The system shall allow a specimen lot to be assigned only to a storage unit configured to hold specimens. | H | Done | LOT-02 Pass | John Gerozaga | [LOT-01-quantity-zero.png](screenshots/LOT-01-quantity-zero.png) | Done | Aligned | live: — |
| **REQ-4.6-06** The system shall allow the curator to move all or a selected quantity of a specimen lot to another valid stor… | H | Done | LOT-03 Pass | John Gerozaga | [LOT-03-move-over-quantity.png](screenshots/LOT-03-move-over-quantity.png) | Done | Aligned | prior: Move form present; full moves not re-run (BBT BB-SPC-10 passed). |
| **REQ-4.6-07** The system shall allow the curator to move a container by changing its parent while preserving its child stru… | H | Done | STO-02 Pass | Kyer Jayme | [STO-02-storage-manage.png](screenshots/STO-02-storage-manage.png) | Done | Aligned | prior: Not re-run (write). BBT BB-STO-04 passed. |
| **REQ-4.6-08** The system shall derive the higher-level room or gallery from the assigned storage hierarchy instead of dupli… | H | Done | LOT-02 Pass, SRC-04 Pass | Kyer Jayme | [LOT-01-quantity-zero.png](screenshots/LOT-01-quantity-zero.png) | Done | Aligned | live: Locations shown as Room / Cabinet / Drawer paths. |
| **REQ-4.6-09** The system shall record each specimen-lot location movement with the affected quantity, previous location, ne… | H | Done | LOT-04 Pass | John Gerozaga | [LOT-04-lot-history.png](screenshots/LOT-04-lot-history.png) | Done | Aligned | live: — |
| **REQ-4.6-10** The system shall prevent detailed internal storage locations from appearing on the public website, QR pages,… | H | Done | PUB-02 Pass, QRP-01 Pass | Kyer Jayme | [PUB-02-gallery.png](screenshots/PUB-02-gallery.png) | Done | Aligned | live: — |
| **REQ-4.6-11** The system shall warn the curator when assigning specimens would exceed an optional configured storage-unit c… | M | **Partial** | Not re-run | John Gerozaga | — | Done | **Overstated** | prior: UI can show a capacity warning, but the last live test (BBT 27 Oct BB-SPC-08) saw none for a lot of 5 in a drawer of capacity 3. Not re-run (needs a write). |
| **REQ-4.6-12** The system shall prevent a storage unit from being assigned to itself or to one of its descendants and shall… | H | Done | STO-02 Pass | Kyer Jayme | [STO-02-storage-manage.png](screenshots/STO-02-storage-manage.png) | Done | Aligned | live: — |

### §4.7 Search, Filtering, Reports, and Export — 100.0%

Owner: John Gerozaga; Kyer Jayme (catalog search). Done 12, Partial 0, Not Started 0, no frontend surface 4.
Tests: 15 pass, 0 fail. Last report: 100% (Aligned).

| Requirement | Pri. | Status | Test result | Owner | Screenshot | Last report | Alignment | Source / evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **REQ-4.7-01** The system shall allow search by accession number, system specimen ID, scientific name, common name, category… | H | Done | SRC-01 Pass | Kyer Jayme | [SRC-01-search-common-name.png](screenshots/SRC-01-search-common-name.png) | Done | Aligned | live: — |
| **REQ-4.7-02** The system shall allow filtering by taxonomy, specimen category, specimen status, classification status, cond… | H | Done | SRC-02 Pass, SRC-04 Pass | John Gerozaga, Kyer Jayme | [SRC-02-filter-cataloged.png](screenshots/SRC-02-filter-cataloged.png) | Done | Aligned | live: — |
| **REQ-4.7-03** The system shall allow supported inventory tables to be sorted by relevant columns. | H | Done | SRC-03 Pass | John Gerozaga, Kyer Jayme | [SRC-03-sort-scientific-name.png](screenshots/SRC-03-sort-scientific-name.png) | Done | Aligned | live: — |
| **REQ-4.7-04** The system shall allow the curator to select a report type, reporting period, applicable filters, and support… | H | Done | RPT-01 Pass | John Gerozaga | [RPT-01-export-dialog.png](screenshots/RPT-01-export-dialog.png) | Done | Aligned | live: — |
| **REQ-4.7-05** The system shall generate a Consolidated Museum Operations Report for a monthly, yearly, or custom period. | H | Done | RPT-01 Pass | John Gerozaga | [RPT-01-export-dialog.png](screenshots/RPT-01-export-dialog.png) | Done | Aligned | prior: Generation not re-run (writes history). BBT BB-RPT-01/02 passed. |
| **REQ-4.7-06** The Consolidated Museum Operations Report shall include inventory summaries, inventory changes, condition/cat… | H | N/A | Not re-run | John Gerozaga | — | Done | Excluded | n/a: File content is generated by the backend. |
| **REQ-4.7-07** The system shall generate a complete or filtered Inventory Report by status, category, taxonomy, condition, l… | H | Done | RPT-01 Pass | John Gerozaga | [RPT-01-export-dialog.png](screenshots/RPT-01-export-dialog.png) | Done | Aligned | prior: BBT BB-RPT-03 passed. |
| **REQ-4.7-08** The system shall generate a General Inquiry Summary by date range and status. | H | Done | RPT-01 Pass | John Gerozaga | [RPT-01-export-dialog.png](screenshots/RPT-01-export-dialog.png) | Done | Aligned | prior: BBT BB-RPT-04 passed. |
| **REQ-4.7-09** The system shall generate a Visit-Request Summary by date range and status. | H | Done | RPT-01 Pass | John Gerozaga | [RPT-01-export-dialog.png](screenshots/RPT-01-export-dialog.png) | Done | Aligned | prior: BBT BB-RPT-05 passed. |
| **REQ-4.7-10** The system shall generate a QR and AR Exhibit Report covering published, unpublished, disabled, and AR-enable… | H | Done | RPT-01 Pass | John Gerozaga | [RPT-01-export-dialog.png](screenshots/RPT-01-export-dialog.png) | Done | Aligned | prior: BBT BB-RPT-06 passed. |
| **REQ-4.7-11** The system shall allow the curator to export the Consolidated Museum Operations Report in DOCX format for off… | H | Done | RPT-01 Pass | John Gerozaga | [RPT-01-export-dialog.png](screenshots/RPT-01-export-dialog.png) | Done | Aligned | live: — |
| **REQ-4.7-12** The system shall provide PDF or printable output for supported reports and CSV output for applicable tabular… | M | Done | RPT-01 Pass | John Gerozaga | [RPT-01-export-dialog.png](screenshots/RPT-01-export-dialog.png) | Done | Aligned | live: — |
| **REQ-4.7-13** The system shall include private visitor information and detailed internal storage-location data only in auth… | H | N/A | AUTH-G1 Pass | John Gerozaga | [AUTH-G1-signed-out-redirect.png](screenshots/AUTH-G1-signed-out-redirect.png) | Done | Excluded | n/a: Authorization of report content is backend; page is guarded. |
| **REQ-4.7-14** The system shall record report generation, filters, output type, acting curator, and timestamp in the audit l… | H | N/A | RPT-03 Pass | John Gerozaga | [CUR-19-reports.png](screenshots/CUR-19-reports.png) | Done | Excluded | n/a: Backend audit recording (history visible). |
| **REQ-4.7-15** The system shall validate report parameters and display an understandable failure message when generation can… | H | Done | RPT-02 Pass | John Gerozaga | [RPT-02-invalid-date-range.png](screenshots/RPT-02-invalid-date-range.png) | Done | Aligned | live: — |
| **REQ-4.7-16** The system shall generate editable DOCX reports as separate exported files, and changes made to an exported f… | H | N/A | Not re-run | John Gerozaga | — | Done | Excluded | n/a: Property of exported files. |

### §4.8 General Inquiry Management — 100.0%

Owner: Charles Boquecosa, John Gerozaga. Done 11, Partial 0, Not Started 0, no frontend surface 0.
Tests: 14 pass, 0 fail. Last report: 100% (Aligned).

| Requirement | Pri. | Status | Test result | Owner | Screenshot | Last report | Alignment | Source / evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **REQ-4.8-01** The public website shall allow a visitor to submit a general museum inquiry without creating an account. | H | Done | INQ-01 Pass | Charles Boquecosa, John Gerozaga | [INQ-01-empty-submit.png](screenshots/INQ-01-empty-submit.png) | Done | Aligned | prior: Valid submission not re-run (would email). BBT 4 Nov MAIL-01 submitted one on this commit. |
| **REQ-4.8-02** The inquiry form shall collect only the approved minimum contact and message information needed for processin… | H | Done | INQ-01 Pass | Charles Boquecosa, John Gerozaga | [INQ-01-empty-submit.png](screenshots/INQ-01-empty-submit.png) | Done | Aligned | live: — |
| **REQ-4.8-03** The inquiry form shall validate required fields, input lengths, and email format before submission. | H | Done | INQ-01 Pass, INQ-02 Pass, INQ-03 Pass | Charles Boquecosa, John Gerozaga | [INQ-01-empty-submit.png](screenshots/INQ-01-empty-submit.png) | Done | Aligned | live: — |
| **REQ-4.8-04** The system shall store each inquiry with a unique identifier, submission timestamp, status, and consent/priva… | H | Done | INQM-01 Pass | Charles Boquecosa, John Gerozaga | [INQM-01-inquiry-detail.png](screenshots/INQM-01-inquiry-detail.png) | Done | Aligned | live: Reference number, timestamp, status and consent shown. |
| **REQ-4.8-05** The system shall allow the curator to view, search, filter, and compose outbound email replies for General In… | H | Done | INQM-01 Pass, INQM-03 Pass | Charles Boquecosa, John Gerozaga | [INQM-01-inquiry-detail.png](screenshots/INQM-01-inquiry-detail.png) | Done | Aligned | live: — |
| **REQ-4.8-06** The system shall support the General Inquiry statuses Pending, Reviewed, Turned to Visit Request, and Closed. | H | Done | INQM-01 Pass | Charles Boquecosa, John Gerozaga | [INQM-01-inquiry-detail.png](screenshots/INQM-01-inquiry-detail.png) | Done | Aligned | live: — |
| **REQ-4.8-07** The system shall allow the curator to manually refer an inquiry to the visit-request workflow. | H | Done | INQM-02 Pass | Charles Boquecosa, John Gerozaga | [INQM-01-inquiry-detail.png](screenshots/INQM-01-inquiry-detail.png) | Done | Aligned | prior: Not re-run (write). BBT BB-INQM-05 passed. |
| **REQ-4.8-08** The system shall send the authorized curator an in-system alert and email notification when a new General Inq… | H | Done | DSH-02 Pass | Charles Boquecosa, John Gerozaga | [DSH-02b-notification-opens-record.png](screenshots/DSH-02b-notification-opens-record.png) | Done | Aligned | live: In-system alert verified; email part is backend (BBT 4 Nov MAIL-02 delivered). |
| **REQ-4.8-09** The system shall send curator-initiated outbound replies through BioSphere to the visitor's email | H | Done | INQM-02 Pass | Charles Boquecosa, John Gerozaga | [INQM-01-inquiry-detail.png](screenshots/INQM-01-inquiry-detail.png) | Done | Aligned | prior: Send not re-run. BBT 4 Nov MAIL-03 delivered. |
| **REQ-4.8-10** The system shall not expose inquiry information to public users or other unauthorized actors. | H | Done | AUTH-G1 Pass | Charles Boquecosa, John Gerozaga | [AUTH-G1-signed-out-redirect.png](screenshots/AUTH-G1-signed-out-redirect.png) | Done | Aligned | live: — |
| **REQ-4.8-11** The system shall record curator-initiated outbound replies, status changes, referral actions, and manually en… | H | Done | INQM-02 Pass | Charles Boquecosa, John Gerozaga | [INQM-01-inquiry-detail.png](screenshots/INQM-01-inquiry-detail.png) | Done | Aligned | live: — |

### §4.9 Visit-Request Management — 93.1%

Owner: Charles Boquecosa. Done 14, Partial 1, Not Started 0, no frontend surface 1.
Tests: 18 pass, 1 fail. Last report: 100% (Overstated).

| Requirement | Pri. | Status | Test result | Owner | Screenshot | Last report | Alignment | Source / evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **REQ-4.9-01** The public website shall allow a visitor to submit a formal museum visit request without creating an account. | H | Done | VIS-01 Pass | Charles Boquecosa | [VIS-01-empty-submit.png](screenshots/VIS-01-empty-submit.png) | Done | Aligned | prior: Valid submission not re-run. BBT 4 Nov MAIL-04 submitted one on this commit. |
| **REQ-4.9-02** The system shall require one Visit Request to contain at least one preferred date and time option and shall a… | H | Done | VIS-03 Pass | Charles Boquecosa | [VIS-03-five-schedules.png](screenshots/VIS-03-five-schedules.png) | Done | Aligned | live: — |
| **REQ-4.9-03** The system shall store each preferred schedule as a separate child record linked to the visit request. | H | N/A | VRM-04 Pass | Charles Boquecosa | [VRM-04-pending-visit-approve-options.png](screenshots/VRM-04-pending-visit-approve-options.png) | Done | Excluded | n/a: Storage model is backend; options listed separately in the UI. |
| **REQ-4.9-04** The system shall collect approved contact, organization, visitor-count, purpose, and other information needed… | H | Done | VIS-01 Pass | Charles Boquecosa | [VIS-01-empty-submit.png](screenshots/VIS-01-empty-submit.png) | Done | Aligned | live: — |
| **REQ-4.9-05** The system shall allow optional vehicle information to be recorded separately and linked to the visit request. | H | Done | VIS-04 Pass | Charles Boquecosa | — | Done | Aligned | live: — |
| **REQ-4.9-06** The form shall validate required fields, schedule values, visitor count, contact information, consent, and ap… | H | Done | VIS-01 Pass, VIS-02 Pass | Charles Boquecosa | [VIS-01-empty-submit.png](screenshots/VIS-01-empty-submit.png) | Done | Aligned | live: Layout issue: Option card clipped at desktop width (PUB-08). |
| **REQ-4.9-07** The system shall notify the authorized curator through an in-system alert and email when a new Visit Request… | H | Done | DSH-02 Pass | Charles Boquecosa | [DSH-02b-notification-opens-record.png](screenshots/DSH-02b-notification-opens-record.png) | Done | Aligned | live: In-system alert verified; email part backend (BBT 4 Nov MAIL-05). |
| **REQ-4.9-08** The system shall allow the curator to view, search, filter, and review Visit Requests and compose outbound em… | H | Done | VRM-03 Pass, VRM-01 Pass | Charles Boquecosa | [VRM-01-visit-approved-detail.png](screenshots/VRM-01-visit-approved-detail.png) | Done | Aligned | live: — |
| **REQ-4.9-09** The system shall support the Visit Request statuses Pending, Approved by Curator, Submitted for Campus Entry,… | H | Done | VRM-03 Pass | Charles Boquecosa | — | Done | Aligned | live: — |
| **REQ-4.9-10** The system shall allow the curator to send an outbound request for additional information to the visitor whil… | H | Done | VRM-04 Pass | Charles Boquecosa | [VRM-04-pending-visit-approve-options.png](screenshots/VRM-04-pending-visit-approve-options.png) | Done | Aligned | prior: Send not re-run. BBT 4 Nov MAIL-06 delivered. |
| **REQ-4.9-11** The system shall send curator-initiated outbound Visit Request messages and status updates through BioSphere… | H | Done | VRM-01 Pass | Charles Boquecosa | [VRM-01-visit-approved-detail.png](screenshots/VRM-01-visit-approved-detail.png) | Done | Aligned | prior: Send not re-run. BBT 4 Nov MAIL-07/08 delivered. |
| **REQ-4.9-12** The system shall present approved visitor and schedule information in a consolidated format for the curator's… | H | **Partial** | VRM-01 Pass, VRM-02 Fail | Charles Boquecosa | [VRM-01-visit-approved-detail.png](screenshots/VRM-01-visit-approved-detail.png) | Done | **Overstated** | live: Summary works for Approved; every Completed visit shows a false load error. |
| **REQ-4.9-13** The system shall not directly submit visitor information to USC ISMIS or approve campus entry unless a separa… | H | Done | VRM-01 Pass | Charles Boquecosa | [VRM-01-visit-approved-detail.png](screenshots/VRM-01-visit-approved-detail.png) | Done | Aligned | live: UI states BioSphere does not submit to USC. |
| **REQ-4.9-14** The system shall record status history, acting curator, timestamps, outbound messages sent through BioSphere,… | H | Done | VRM-01 Pass | Charles Boquecosa | [VRM-01-visit-approved-detail.png](screenshots/VRM-01-visit-approved-detail.png) | Done | Aligned | live: — |
| **REQ-4.9-15** The system shall restrict visit-request personal data to authorized internal access. | H | Done | AUTH-G1 Pass | Charles Boquecosa | [AUTH-G1-signed-out-redirect.png](screenshots/AUTH-G1-signed-out-redirect.png) | Done | Aligned | live: — |
| **REQ-4.9-16** The system shall allow the curator to select the approved preferred schedule and preserve the other submitted… | M | Done | VRM-04 Pass | Charles Boquecosa | [VRM-04-pending-visit-approve-options.png](screenshots/VRM-04-pending-visit-approve-options.png) | Done | Aligned | live: — |

### §4.10 Static Public Museum Website — 80.0%

Owner: Charles Boquecosa, John Gerozaga, Voltaire Ratilla. Done 8, Partial 2, Not Started 0, no frontend surface 0.
Tests: 10 pass, 1 fail. Last report: 100% (Overstated).

| Requirement | Pri. | Status | Test result | Owner | Screenshot | Last report | Alignment | Source / evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **REQ-4.10-01** The public website shall provide Home, Gallery, Visit, and About areas. | H | Done | PUB-01 Pass | Charles Boquecosa, John Gerozaga, Voltaire Ratilla | [PUB-01-home.png](screenshots/PUB-01-home.png) | Done | Aligned | live: — |
| **REQ-4.10-02** The public website shall provide a Plan Your Visit action that opens the Visit area. | H | Done | PUB-01 Pass | Charles Boquecosa, John Gerozaga, Voltaire Ratilla | [PUB-01-home.png](screenshots/PUB-01-home.png) | Done | Aligned | live: — |
| **REQ-4.10-03** The public website shall not include an Events page in the MVP. | H | Done | PUB-05 Pass | Charles Boquecosa, John Gerozaga, Voltaire Ratilla | [PUB-05-no-events-404.png](screenshots/PUB-05-no-events-404.png) | Done | Aligned | live: — |
| **REQ-4.10-04** The Gallery shall display selected curator-approved museum and collection content without exposing the comple… | H | **Partial** | PUB-02 Pass | Charles Boquecosa, John Gerozaga, Voltaire Ratilla | [PUB-02-gallery.png](screenshots/PUB-02-gallery.png) | Done | **Overstated** | live: Gallery works but uses Unsplash stock photos marked 'placeholder' in src/lib/placeholder-images.ts, not curator-approved museum images. |
| **REQ-4.10-05** The Visit area shall provide visitor guidance, inquiry access, and formal visit-request access. | H | Done | PUB-03 Pass | Charles Boquecosa, John Gerozaga, Voltaire Ratilla | [PUB-03-visit.png](screenshots/PUB-03-visit.png) | Done | Aligned | live: — |
| **REQ-4.10-06** The About area shall provide approved museum background, mission, authorized museum personnel information, co… | H | **Partial** | PUB-04 Fail | Charles Boquecosa, John Gerozaga, Voltaire Ratilla | [PUB-04-about.png](screenshots/PUB-04-about.png) | Done | **Overstated** | live: About personnel data is placeholder (src/app/(public)/about/page.tsx:54-60); location only in the footer. |
| **REQ-4.10-07** The Home, Gallery, Visit, and About page content shall be implemented as static frontend content and shall no… | H | Done | AUTO-BUILD Pass | Charles Boquecosa, John Gerozaga, Voltaire Ratilla | — | Done | Aligned | live: Public pages are prerendered static routes; no edit UI. |
| **REQ-4.10-08** The public website shall not expose internal storage locations, internal remarks, audit data, account data, o… | H | Done | PUB-02 Pass, QRP-01 Pass | Charles Boquecosa, John Gerozaga, Voltaire Ratilla | [PUB-02-gallery.png](screenshots/PUB-02-gallery.png) | Done | Aligned | live: — |
| **REQ-4.10-09** The public website shall use responsive layouts suitable for supported desktop, tablet, and mobile screen siz… | H | Done | PUB-07 Pass | Charles Boquecosa, John Gerozaga, Voltaire Ratilla | [PUB-07-home-phone.png](screenshots/PUB-07-home-phone.png) | Done | Aligned | live: — |
| **REQ-4.10-10** Approved changes to the static Home, Gallery, Visit, or About page content shall require a frontend source-co… | H | Done | AUTO-BUILD Pass | Charles Boquecosa, John Gerozaga, Voltaire Ratilla | — | Done | Aligned | live: Content lives in source files. |

### §4.11 Controlled Knowledge-Based FAQ Assistant — 100.0%

Owner: Kyer Jayme. Done 9, Partial 0, Not Started 0, no frontend surface 1.
Tests: 11 pass, 1 fail. Last report: 100% (Aligned).

| Requirement | Pri. | Status | Test result | Owner | Screenshot | Last report | Alignment | Source / evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **REQ-4.11-01** The public website shall provide a controlled knowledge-based FAQ assistant for museum-related questions. | H | Done | FAQ-01 Pass | Kyer Jayme | [FAQ-01-assistant-open.png](screenshots/FAQ-01-assistant-open.png) | Done | Aligned | live: — |
| **REQ-4.11-02** The system shall allow the curator to create, edit, activate, deactivate, and archive approved FAQ questions… | H | Done | FAQK-01 Pass, FAQK-02 Pass | Kyer Jayme | [FAQK-01-faq-entry.png](screenshots/FAQK-01-faq-entry.png) | Done | Aligned | live: — |
| **REQ-4.11-03** The system shall support curator-approved alternative wording, keywords, and categories for matching. | H | Done | FAQK-01 Pass | Kyer Jayme | [FAQK-01-faq-entry.png](screenshots/FAQK-01-faq-entry.png) | Done | Aligned | live: — |
| **REQ-4.11-04** The assistant shall answer only from active curator-approved FAQ knowledge. | H | Done | FAQ-02 Pass, FAQ-05 Fail | Kyer Jayme | [FAQ-02-approved-question.png](screenshots/FAQ-02-approved-question.png) | Done | Aligned | live: Works as built; content issue: a placeholder entry is Active (curator data, not code). |
| **REQ-4.11-05** The assistant shall not use unrestricted general knowledge, identify specimens or species, invent museum info… | H | Done | FAQ-03 Pass | Kyer Jayme | [FAQ-03-off-topic.png](screenshots/FAQ-03-off-topic.png) | Done | Aligned | live: — |
| **REQ-4.11-06** When the visitor's question does not match an active approved FAQ entry according to the configured matching… | H | Done | FAQ-03 Pass | Kyer Jayme | [FAQ-03-off-topic.png](screenshots/FAQ-03-off-topic.png) | Done | Aligned | live: — |
| **REQ-4.11-07** The FAQ Assistant shall not request or store personal information during the FAQ interaction and shall not di… | H | Done | FAQ-01 Pass | Kyer Jayme | [FAQ-01-assistant-open.png](screenshots/FAQ-01-assistant-open.png) | Done | Aligned | live: No personal fields in the assistant. |
| **REQ-4.11-08** The assistant shall require an internet connection in the MVP. | H | Done | FAQ-04 Pass | Kyer Jayme | [FAQ-04-offline.png](screenshots/FAQ-04-offline.png) | Done | Aligned | live: — |
| **REQ-4.11-09** The system shall record FAQ knowledge changes in the audit log. | H | N/A | FAQK-01 Pass | Kyer Jayme | [FAQK-01-faq-entry.png](screenshots/FAQK-01-faq-entry.png) | Done | Excluded | n/a: Backend audit recording (audit link present). |
| **REQ-4.11-10** The assistant interface shall clearly indicate that its answers are limited to curator-approved museum inform… | H | Done | FAQ-01 Pass | Kyer Jayme | [FAQ-01-assistant-open.png](screenshots/FAQ-01-assistant-open.png) | Done | Aligned | live: — |

### §4.12 QR Exhibit Management and Public QR Pages — 100.0%

Owner: Voltaire Ratilla. Done 11, Partial 0, Not Started 0, no frontend surface 1.
Tests: 11 pass, 1 fail. Last report: 100% (Aligned).

| Requirement | Pri. | Status | Test result | Owner | Screenshot | Last report | Alignment | Source / evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **REQ-4.12-01** The system shall allow the curator to create, edit, publish, unpublish, disable, and archive a QR exhibit pag… | H | Done | EXH-01 Pass | Voltaire Ratilla | [EXH-01-exhibit-detail-qr.png](screenshots/EXH-01-exhibit-detail-qr.png) | Done | Aligned | prior: Publish/Withdraw/Edit/Archive controls; not exercised. BBT BB-EXH-02 passed. |
| **REQ-4.12-02** The system shall require public-display approval before a specimen can be used as a QR exhibit source. | H | Done | EXH-03 Pass | Voltaire Ratilla | [EXH-03-create-exhibit-picker.png](screenshots/EXH-03-create-exhibit-picker.png) | Done | Aligned | live: — |
| **REQ-4.12-03** The system shall allow the curator to control which approved fields, descriptions, images, and other public c… | H | Done | EXH-01 Pass | Voltaire Ratilla | [EXH-01-exhibit-detail-qr.png](screenshots/EXH-01-exhibit-detail-qr.png) | Done | Aligned | prior: Edit Exhibit present; content issue on Green Sea Turtle (curator data). |
| **REQ-4.12-04** The system shall assign each published QR exhibit page a unique public URL. | H | Done | EXH-01 Pass, EXH-02 Fail | Voltaire Ratilla | [EXH-01-exhibit-detail-qr.png](screenshots/EXH-01-exhibit-detail-qr.png) | Done | Aligned | live: Unique URL per exhibit; host comes from backend PUBLIC_SITE_URL (a tunnel locally). |
| **REQ-4.12-05** The system shall generate a printable QR code that opens the correct published page. | H | Done | EXH-01 Pass | Voltaire Ratilla | [EXH-01-exhibit-detail-qr.png](screenshots/EXH-01-exhibit-detail-qr.png) | Done | Aligned | live: — |
| **REQ-4.12-06** The system shall allow the curator to download or print an approved exhibit label containing the QR code and… | H | Done | EXH-01 Pass | Voltaire Ratilla | [EXH-01-exhibit-detail-qr.png](screenshots/EXH-01-exhibit-detail-qr.png) | Done | Aligned | live: — |
| **REQ-4.12-07** QR exhibit pages shall remain outside normal public website navigation and shall be accessed primarily throug… | H | Done | QRP-01 Pass | Voltaire Ratilla | [QRP-01-canada-lynx.png](screenshots/QRP-01-canada-lynx.png) | Done | Aligned | live: — |
| **REQ-4.12-08** The system shall prevent storage locations, condition notes, internal remarks, audit data, and other restrict… | H | Done | QRP-01 Pass | Voltaire Ratilla | [QRP-01-canada-lynx.png](screenshots/QRP-01-canada-lynx.png) | Done | Aligned | live: — |
| **REQ-4.12-09** A disabled or unpublished QR URL shall show a safe unavailable message and shall not expose previous private… | H | Done | QRP-03 Pass | Voltaire Ratilla | [QRP-03-exhibit-unavailable.png](screenshots/QRP-03-exhibit-unavailable.png) | Done | Aligned | live: — |
| **REQ-4.12-10** The system shall preserve the QR exhibit page's public URL when its approved content is updated, unless the c… | M | Done | EXH-01 Pass | Voltaire Ratilla | [EXH-01-exhibit-detail-qr.png](screenshots/EXH-01-exhibit-detail-qr.png) | Done | Aligned | prior: Replace URL is explicit; BBT BB-EXH-04 passed. |
| **REQ-4.12-11** The system shall record QR publication changes in the audit log. | H | N/A | Not re-run | Voltaire Ratilla | — | Done | Excluded | n/a: Backend audit recording. |
| **REQ-4.12-12** A visitor shall be able to access a published QR exhibit page through its direct public URL without requiring… | H | Done | QRP-01 Pass | Voltaire Ratilla | [QRP-01-canada-lynx.png](screenshots/QRP-01-canada-lynx.png) | Done | Aligned | live: — |

### §4.13 Selected WebAR Experiences — 100.0%

Owner: Voltaire Ratilla. Done 9, Partial 0, Not Started 0, no frontend surface 0.
Tests: 9 pass, 0 fail. Last report: 100% (Aligned).

| Requirement | Pri. | Status | Test result | Owner | Screenshot | Last report | Alignment | Source / evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **REQ-4.13-01** The system shall provide WebAR or 3D viewing only for selected curator-approved exhibits with available appro… | H | Done | QRP-02 Pass | Voltaire Ratilla | [QRP-02-3d-viewer-fallback.png](screenshots/QRP-02-3d-viewer-fallback.png) | Done | Aligned | live: — |
| **REQ-4.13-02** The system shall allow the curator to select and mark an approved exhibit for AR preparation through the auth… | H | Done | EXH-04 Pass | Voltaire Ratilla | [EXH-01-exhibit-detail-qr.png](screenshots/EXH-01-exhibit-detail-qr.png) | Done | Aligned | live: — |
| **REQ-4.13-03** The developer shall be able to upload, update, activate, deactivate, or replace the AR asset linked to the ap… | H | Done | DEV-05 Pass | Voltaire Ratilla | [DEV-05-ar-upload-blocked.png](screenshots/DEV-05-ar-upload-blocked.png) | Done | Aligned | live: — |
| **REQ-4.13-04** A published exhibit page shall provide the View in AR action only when an approved usable AR asset is active… | H | Done | QRP-02 Pass | Voltaire Ratilla | [QRP-02-3d-viewer-fallback.png](screenshots/QRP-02-3d-viewer-fallback.png) | Done | Aligned | live: Desktop gets 3D + 'AR not supported'; phone camera AR untested. |
| **REQ-4.13-05** The system shall request camera permission only after the visitor explicitly starts the AR experience. | H | Done | QRP-02 Pass | Voltaire Ratilla | [QRP-02-3d-viewer-fallback.png](screenshots/QRP-02-3d-viewer-fallback.png) | Done | Aligned | live: — |
| **REQ-4.13-06** The normal QR exhibit page shall remain available when AR is unavailable, unsupported, denied, disabled, or f… | H | Done | QRP-02 Pass | Voltaire Ratilla | [QRP-02-3d-viewer-fallback.png](screenshots/QRP-02-3d-viewer-fallback.png) | Done | Aligned | live: — |
| **REQ-4.13-07** AR content shall use only approved public exhibit information and shall not expose internal inventory or stor… | H | Done | QRP-01 Pass | Voltaire Ratilla | [QRP-01-canada-lynx.png](screenshots/QRP-01-canada-lynx.png) | Done | Aligned | live: — |
| **REQ-4.13-08** Custom three-dimensional model production shall not be required for every specimen and shall depend on asset… | M | Done | EXH-04 Pass | Voltaire Ratilla | [EXH-01-exhibit-detail-qr.png](screenshots/EXH-01-exhibit-detail-qr.png) | Done | Aligned | live: AR marking is a manual curator choice with a reason. |
| **REQ-4.13-09** The system shall display an understandable message when an AR experience is unsupported, unavailable, or fail… | M | Done | QRP-02 Pass | Voltaire Ratilla | [QRP-02-3d-viewer-fallback.png](screenshots/QRP-02-3d-viewer-fallback.png) | Done | Aligned | live: — |

### §4.14 Selected Offline Inventory Operations and Synchronization — 100.0%

Owner: Kyer Jayme. Done 12, Partial 0, Not Started 0, no frontend surface 0.
Tests: 15 pass, 0 fail. Last report: 100% (Aligned).

| Requirement | Pri. | Status | Test result | Owner | Screenshot | Last report | Alignment | Source / evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **REQ-4.14-01** The system shall allow the curator to view previously synchronized specimen records while temporarily offline. | H | Done | OFF-01 Pass, OFF-02 Pass | Kyer Jayme | [OFF-02-offline-cached-search.png](screenshots/OFF-02-offline-cached-search.png) | Done | Aligned | live: — |
| **REQ-4.14-02** The system shall allow searching and filtering of locally cached specimen records while offline. | H | Done | OFF-02 Pass, OFF-03 Pass | Kyer Jayme | [OFF-02-offline-cached-search.png](screenshots/OFF-02-offline-cached-search.png) | Done | Aligned | live: — |
| **REQ-4.14-03** The system shall allow the curator to create a new Uncataloged text-only specimen draft while offline. | H | Done | OFF-04 Pass | Kyer Jayme | [OFF-05-offline-draft-pending-sync.png](screenshots/OFF-05-offline-draft-pending-sync.png) | Done | Aligned | live: — |
| **REQ-4.14-04** The system shall mark every offline-created draft as Pending Sync until it is successfully accepted by the se… | H | Done | OFF-04 Pass | Kyer Jayme | [OFF-05-offline-draft-pending-sync.png](screenshots/OFF-05-offline-draft-pending-sync.png) | Done | Aligned | live: — |
| **REQ-4.14-05** The system shall retain an offline-created draft until it is synchronized or intentionally discarded by the c… | H | Done | OFF-04 Pass, OFF-06 Pass | Kyer Jayme | [OFF-05-offline-draft-pending-sync.png](screenshots/OFF-05-offline-draft-pending-sync.png) | Done | Aligned | live: — |
| **REQ-4.14-06** The system shall submit pending offline-created drafts after stable connectivity is restored and the curator… | H | Done | Not re-run | Kyer Jayme | — | Done | Aligned | prior: Not re-run (would create a server record). BBT BB-OFF-05 passed. |
| **REQ-4.14-07** The system shall retain a draft and display an understandable failure state when synchronization fails or the… | H | Done | Not re-run | Kyer Jayme | — | Done | Aligned | prior: Not re-run. BBT BB-OFF-06 passed. |
| **REQ-4.14-08** The system shall prevent retry operations from creating multiple server records from the same offline draft. | H | Done | Not re-run | Kyer Jayme | — | Done | Aligned | prior: Not re-run. BBT BB-OFF-05 passed. |
| **REQ-4.14-09** The system shall display Online, Offline, Pending Sync, Synchronizing, Synchronized, and Sync Failed states. | H | Done | OFF-02 Pass, OFF-04 Pass, OFF-07 Pass | Kyer Jayme | [OFF-02-offline-cached-search.png](screenshots/OFF-02-offline-cached-search.png) | Done | Aligned | live: — |
| **REQ-4.14-10** Existing specimen records shall remain read-only while the application is offline. | H | Done | OFF-02 Pass, OFF-05 Pass | Kyer Jayme | [OFF-02-offline-cached-search.png](screenshots/OFF-02-offline-cached-search.png) | Done | Aligned | live: — |
| **REQ-4.14-11** Internet connectivity shall be required for editing existing records, cataloging, location changes, quantity… | H | Done | OFF-05 Pass | Kyer Jayme | [OFF-06-offline-fallback.png](screenshots/OFF-06-offline-fallback.png) | Done | Aligned | live: — |
| **REQ-4.14-12** Offline data stored in the browser shall not be treated as a server backup or confirmed server record until s… | H | Done | OFF-05 Pass | Kyer Jayme | [OFF-06-offline-fallback.png](screenshots/OFF-06-offline-fallback.png) | Done | Aligned | live: UI labels local data device-only. |

### §4.15 Audit Logging, Backup, and Recovery — 80.0%

Owner: Kyer Jayme. Done 4, Partial 1, Not Started 0, no frontend surface 7.
Tests: 7 pass, 0 fail. Last report: 83% (Aligned).

| Requirement | Pri. | Status | Test result | Owner | Screenshot | Last report | Alignment | Source / evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **REQ-4.15-01** The system shall record major internal actions including authentication events, curator account actions, spec… | H | N/A | AUD-01 Pass | Kyer Jayme | [AUD-01-audit-failed-signins.png](screenshots/AUD-01-audit-failed-signins.png) | Partial | Excluded | n/a: Backend audit recording. |
| **REQ-4.15-02** Each audit entry shall contain the acting account, action, affected record or module, date/time, and result o… | H | Done | AUD-01 Pass | Kyer Jayme | [AUD-01-audit-failed-signins.png](screenshots/AUD-01-audit-failed-signins.png) | Done | Aligned | live: Entries show actor, action, module, time, result. |
| **REQ-4.15-03** The system shall prevent all users from editing or deleting protected audit entries through routine applicati… | H | Done | AUD-01 Pass | Kyer Jayme | [AUD-01-audit-failed-signins.png](screenshots/AUD-01-audit-failed-signins.png) | Done | Aligned | live: — |
| **REQ-4.15-04** Authorized users shall be able to search or filter audit information needed for review without exposing it pu… | H | Done | AUD-01 Pass, AUTH-G1 Pass | Kyer Jayme | [AUD-01-audit-failed-signins.png](screenshots/AUD-01-audit-failed-signins.png) | Done | Aligned | live: — |
| **REQ-4.15-05** The deployment shall support scheduled backup of the PostgreSQL database, audit data, required object-storage… | H | N/A | Not re-run | Kyer Jayme | — | Done | Excluded | n/a: Deployment backup job. |
| **REQ-4.15-06** The deployment shall record the result of every scheduled or authorized manual backup and shall notify the de… | H | **Partial** | BAK-01 Pass | Kyer Jayme | [BAK-01-backup-history.png](screenshots/BAK-01-backup-history.png) | Partial | Aligned | live: Results are listed, but nothing in the UI notifies anyone when a backup fails. |
| **REQ-4.15-07** Backup copies shall be protected through approved access controls and encryption appropriate to the deploymen… | H | N/A | Not re-run | Kyer Jayme | — | Done | Excluded | n/a: Deployment control. |
| **REQ-4.15-08** Authorized technical personnel shall be able to restore required BioSphere data from a valid verified backup… | H | N/A | Not re-run | Kyer Jayme | — | Done | Excluded | n/a: Technical-personnel restore procedure. |
| **REQ-4.15-09** Restoration actions shall be logged and shall not be presented as successful when verification fails. | H | N/A | Not re-run | Kyer Jayme | — | Done | Excluded | n/a: Restore logging (backend/deployment). |
| **REQ-4.15-10** Backup and recovery maintenance shall not require a general-purpose administrator dashboard in the curator ap… | H | Done | BAK-01 Pass | Kyer Jayme | [BAK-01-backup-history.png](screenshots/BAK-01-backup-history.png) | Done | Aligned | live: — |
| **REQ-4.15-11** The development team shall complete and document at least one successful full backup-and-restoration test bef… | H | N/A | Not re-run | Kyer Jayme | — | Done | Excluded | n/a: Process requirement. |
| **REQ-4.15-12** The final backup schedule, retention, recovery point, off-site destination, and responsible operator shall be… | H | N/A | Not re-run | Kyer Jayme | — | Done | Excluded | n/a: Approval requirement. |

## Comparison with Last Progress Report

**Last report:** *BioSphere Frontend Progress*, dated 3–4 November 2026, Claude artifact
https://claude.ai/artifact/H59jkW2x9ReBWv76nvJ1af. It is the newest frontend report: the System Progress artifact of the same
date repeats its frontend figures, and the 28 Oct Completion Report precedes it. It measured `develop` @ `248bf53` and
claims **95%**.

**What changed since.** `git log 248bf53..HEAD` is empty: the frontend code tested here is the commit the report measured, and backend
`develop` is still `06545c0` (3 Nov 01:35, also before the report). No real progress happened in between, so every difference below is a
reporting difference. All features compared existed before the report date.

**How the report's per-requirement statuses were derived.** The report scores sections only. It says it uses the 28 Oct method
(1 Done, 0.5 Partial, 0.25 dummy data, 0 missing), so a section at 100% means every applicable requirement is Done. For the sections
below 100%, the gaps it names (REQ-4.1-05 partial; 4.1-08/09/16/18 missing; 4.3-05/10 partial; 4.15-01/06 partial) reproduce its
75%, 89% and 83%. Rows with no frontend surface are shown as *Excluded* and not counted in the four categories.
No requirement or module is missing from the report, so the *Not in report* count is 0. Note that its 190-requirement base is 2
short of the SRS's 192, and the report does not say which two it dropped.

| Module | Last report % | Verified % (required formula) | Verified % (report's own method) | Alignment |
| --- | --- | --- | --- | --- |
| §4.1 Authentication and Curator Account Management | 75% | 71.4% | 75.0% | Aligned |
| §4.2 Restricted Developer Functions | 100% | 87.5% | 93.8% | **Overstated** |
| §4.3 Curator Dashboard and Notifications | 89% | 70.6% | 83.3% | **Overstated** |
| §4.4 Specimen Inventory and Cataloging | 100% | 100.0% | 100.0% | Aligned |
| §4.5 Specimen Lot Grouping and Quantity Management | 100% | 100.0% | 100.0% | Aligned |
| §4.6 Hierarchical Storage-Location Management | 100% | 95.7% | 95.8% | **Overstated** |
| §4.7 Search, Filtering, Reports, and Export | 100% | 100.0% | 100.0% | Aligned |
| §4.8 General Inquiry Management | 100% | 100.0% | 100.0% | Aligned |
| §4.9 Visit-Request Management | 100% | 93.1% | 96.7% | **Overstated** |
| §4.10 Static Public Museum Website | 100% | 80.0% | 90.0% | **Overstated** |
| §4.11 Controlled Knowledge-Based FAQ Assistant | 100% | 100.0% | 100.0% | Aligned |
| §4.12 QR Exhibit Management and Public QR Pages | 100% | 100.0% | 100.0% | Aligned |
| §4.13 Selected WebAR Experiences | 100% | 100.0% | 100.0% | Aligned |
| §4.14 Selected Offline Inventory Operations and Synchronization | 100% | 100.0% | 100.0% | Aligned |
| §4.15 Audit Logging, Backup, and Recovery | 83% | 80.0% | 90.0% | Aligned |
| **Frontend overall** | **95%** | **92.8%** | 95.3% | — |

Requirements where the report and the tests disagree:

| Requirement | Last report | Verified | Why |
| --- | --- | --- | --- |
| REQ-4.2-03 | Done | Partial | Authorization required, but every curator is shown Active (pending invitations included), so status is wrong on screen. Root cause: /developer/curators returns ACTIVE. |
| REQ-4.3-07 | Done | Partial | Built (NotificationBell) but switched off unless the backend sets NOTIFICATION_STATE_ENABLED=true; not usable in this environment. |
| REQ-4.6-11 | Done | Partial | UI can show a capacity warning, but the last live test (BBT 27 Oct BB-SPC-08) saw none for a lot of 5 in a drawer of capacity 3. Not re-run (needs a write). |
| REQ-4.9-12 | Done | Partial | Summary works for Approved; every Completed visit shows a false load error. |
| REQ-4.10-04 | Done | Partial | Gallery works but uses Unsplash stock photos marked 'placeholder' in src/lib/placeholder-images.ts, not curator-approved museum images. |
| REQ-4.10-06 | Done | Partial | About personnel data is placeholder (src/app/(public)/about/page.tsx:54-60); location only in the footer. |

Category counts:

| Category | Requirement rows | Module rows |
| --- | --- | --- |
| Aligned | 164 | 10 |
| Overstated | 6 | 5 |
| Understated | 0 | 0 |
| Not in report | 0 | 0 |
| Excluded (no frontend surface) | 22 | — |

### Verdict

**Partly accurate.** The report claimed **95%**. The verified figure is **92.8%** under the required Done-only, priority-weighted
formula, a gap of **-2.2 points**. On the report's own partial-credit method the same results give 95.3%. Its headline number
is therefore close only because two errors cancel:

- It **overstates 6 requirements in 5 modules**: §4.2, §4.3, §4.6, §4.9 and §4.10. Notification read/dismiss is counted Done while switched off. The capacity warning
  and the Completed-visit summary are counted Done although its own issue list or the BBT shows them failing. The Developer status
  display is counted Done despite its own 'pending shown as Active' issue. Placeholder Gallery and About content was never flagged.
- It **scores backend-only rows** such as REQ-4.1-18 and REQ-4.15-01 against the frontend, as Partial or missing. This run excludes rows with no UI, which removes those penalties and offsets the overstated rows.

164 of 170 scored requirement rows are aligned, and none are understated. Where the
report names a gap (account management, change password, operational notifications, backup), the tests agree with it.

## UI issues found

Reported only; nothing was fixed during this run.

| Sev. | Issue | Where | Owner | Evidence |
| --- | --- | --- | --- | --- |
| High | Green Sea Turtle public exhibit still shows the 'ninja tortol' placeholder image, caption and description | `/exhibits/green-sea-turtle` (curator data) | Voltaire Ratilla (exhibits) | text check, not screenshotted |
| Medium | Completed visits show a false 'The summary could not be loaded' error (backend returns 400 for non-approved states) | `src/app/(curator)/public-website/page.tsx:111` | Charles Boquecosa | VRM-02 |
| Medium | Developer page shows every curator as Active; 2 are Pending Invite on `/users` | `/developer` (backend `/developer/curators`) | Voltaire Ratilla | DEV-02 |
| Medium | Notification read/dismiss hidden: backend `NOTIFICATION_STATE_ENABLED` not set in this environment | backend `.env`; `src/components/curator/NotificationBell.tsx` | Charles Boquecosa, John Gerozaga | DSH-03 |
| Medium | Exhibit public URLs and printed QR labels use a temporary `trycloudflare.com` host | backend `PUBLIC_SITE_URL` | Voltaire Ratilla | EXH-02 |
| Medium | Placeholder FAQ entry 'Who is sir Fidel' (category 'Inquirey', keyword 'asdasd') is Active and suggested publicly | FAQ knowledge data | Kyer Jayme | FAQ-05 |
| Medium | About page shows placeholder personnel (phone `+63 XXX XXX XXXX`, a project developer as Museum Director) | `src/app/(public)/about/page.tsx:54-60` | Charles Boquecosa, John Gerozaga, Voltaire Ratilla | PUB-04 |
| Low | Gallery/Home/Visit/About use Unsplash stock placeholders instead of museum photography | `src/lib/placeholder-images.ts` | Charles Boquecosa, John Gerozaga, Voltaire Ratilla | PUB-02 |
| Low | Visit-request Option card is wider than the dialog column and clipped on desktop | Request a Visit dialog | Charles Boquecosa | PUB-08 |
| Low | `/backup-history`, `/faq-knowledge`, `/faq-knowledge/review` redirect to `/login` without `?from=` | `src/proxy.ts:14` (prefix list) | Voltaire Ratilla (auth) | AUTH-G1 |
| Low | Unknown URLs show the unbranded default Next.js 404 | `app/not-found` | Charles Boquecosa, John Gerozaga, Voltaire Ratilla | PUB-06 |
| Low | Storage page renders two nested `<main>` landmarks | `/storage` | Kyer Jayme | probe during STO-01 |
| Low | Offline draft modal has no `role=dialog`/`aria-modal` | `src/features/offline/components/OfflineSpecimenDraftModal.tsx` | Kyer Jayme | OFF-04 |
| Trivial | Login link reads 'Forget Password ?' | `/login` | Voltaire Ratilla | AUTH-01 |
| Trivial | Stale comment says `/exhibits` renders placeholder data; `dummy-data/*` files are unused | `src/components/dashboard/PublicQrReadiness.tsx:61`, `src/lib/dummy-data/` | Unassigned | code review |

## Work remaining (frontend)

1. **§4.1, Voltaire:** a change-password page (REQ-4.1-16) and an inactivity timeout (REQ-4.1-05). Decide whether curators may
   activate, deactivate and hand over accounts (REQ-4.1-08/09). The UI currently sends that to the Developer interface, which conflicts with the SRS.
2. **§4.3, Charles and John:** enable `NOTIFICATION_STATE_ENABLED` and verify read/dismiss live. Add sync-failure and other operational
   notifications (REQ-4.3-05/10).
3. **§4.9, Charles:** request or show the campus-entry summary only for Approved and Submitted visits (REQ-4.9-12).
4. **§4.10, Charles, John and Voltaire:** replace the placeholder About personnel and stock imagery with approved content (REQ-4.10-04/06), finish the
   privacy notice, fix the clipped Option card and add a branded 404.
5. **§4.2, Voltaire:** show Pending Invite on `/developer` once the backend returns the real status (REQ-4.2-03).
6. **§4.6, John:** retest the capacity warning with a disposable drawer (REQ-4.6-11).
7. **§4.15, Kyer:** add a backup-failure notification path (REQ-4.15-06).
8. **Data and deployment:** unpublish or replace the Green Sea Turtle content, retire the placeholder FAQ entry, and set a permanent
   `PUBLIC_SITE_URL` before printing QR labels.
9. **Retests needing writes:** rerun every *prior* row against a disposable database (saves, sends, uploads, report generation, lot
   split/merge, offline sync), plus camera AR on a phone.

## Test log

| ID | Result | What was checked | Screenshot |
| --- | --- | --- | --- |
| AUTO-LINT | Pass | npm run lint (0 errors) | — |
| AUTO-UNIT | Pass | npm test: 501/501 in 77 files | — |
| AUTO-BUILD | Pass | npm run build: 48 routes | — |
| PUB-01 | Pass | Home + primary nav; Plan a visit opens /visit | [PUB-01-home.png](screenshots/PUB-01-home.png) |
| PUB-02 | Pass | Gallery: no internal data (4/19 images are Unsplash stock placeholders) | [PUB-02-gallery.png](screenshots/PUB-02-gallery.png) |
| PUB-03 | Pass | Visit page: guidance, inquiry + visit-request access | [PUB-03-visit.png](screenshots/PUB-03-visit.png) |
| PUB-04 | **Fail** | About: personnel entry is placeholder (+63 XXX XXX XXXX; developer listed as Museum Director) | [PUB-04-about.png](screenshots/PUB-04-about.png) |
| PUB-05 | Pass | /events is 404, no Events link | [PUB-05-no-events-404.png](screenshots/PUB-05-no-events-404.png) |
| PUB-06 | **Fail** | Unknown URL shows unbranded default 404 (no SRS ID) | [PUB-06-unknown-url-404.png](screenshots/PUB-06-unknown-url-404.png) |
| PUB-07 | Pass | No horizontal overflow at 390px and 768px on 6 public pages | [PUB-07-home-phone.png](screenshots/PUB-07-home-phone.png) |
| PUB-08 | **Fail** | Visit dialog Option 1 card clipped at the dialog edge (1440px) | [PUB-08-visit-dialog-desktop.png](screenshots/PUB-08-visit-dialog-desktop.png) |
| INQ-01 | Pass | Inquiry empty submit blocked, inline errors, no request | [INQ-01-empty-submit.png](screenshots/INQ-01-empty-submit.png) |
| INQ-02 | Pass | Invalid email + missing consent blocked | [INQ-02-invalid-email-no-consent.png](screenshots/INQ-02-invalid-email-no-consent.png) |
| INQ-03 | Pass | Message capped at 2000 characters | — |
| VIS-01 | Pass | Visit request empty submit blocked, focus to first error | [VIS-01-empty-submit.png](screenshots/VIS-01-empty-submit.png) |
| VIS-02 | Pass | Past date, end<start, 0 visitors rejected (end<start confirmed on retest) | [VIS-02b-end-before-start.png](screenshots/VIS-02b-end-before-start.png) |
| VIS-03 | Pass | Max 5 preferred schedules | [VIS-03-five-schedules.png](screenshots/VIS-03-five-schedules.png) |
| VIS-04 | Pass | Optional vehicle section present | — |
| VIS-05 | Pass | Cancel discards entered data | — |
| FAQ-01 | Pass | Assistant opens with scope notice; GET /faq/assistant/suggestions | [FAQ-01-assistant-open.png](screenshots/FAQ-01-assistant-open.png) |
| FAQ-02 | Pass | Approved question answered; POST /faq/assistant/ask | [FAQ-02-approved-question.png](screenshots/FAQ-02-approved-question.png) |
| FAQ-03 | Pass | Off-topic -> no approved answer + General Inquiry link | [FAQ-03-off-topic.png](screenshots/FAQ-03-off-topic.png) |
| FAQ-04 | Pass | Offline -> internet-required message | [FAQ-04-offline.png](screenshots/FAQ-04-offline.png) |
| FAQ-05 | **Fail** | Placeholder entry 'Who is sir Fidel' still Active and suggested (content) | [FAQ-01-assistant-open.png](screenshots/FAQ-01-assistant-open.png) |
| QRP-01 | Pass | Published exhibit by direct URL; no internal fields; not in nav | [QRP-01-canada-lynx.png](screenshots/QRP-01-canada-lynx.png) |
| QRP-02 | Pass | Camera not requested on load; 3D viewer + 'not supported' fallback | [QRP-02-3d-viewer-fallback.png](screenshots/QRP-02-3d-viewer-fallback.png) |
| QRP-03 | Pass | Unknown exhibit -> safe 'exhibit is unavailable' page | [QRP-03-exhibit-unavailable.png](screenshots/QRP-03-exhibit-unavailable.png) |
| AUTH-G1 | Pass | 16 protected routes redirect to /login signed out (3 lose ?from=) | [AUTH-G1-signed-out-redirect.png](screenshots/AUTH-G1-signed-out-redirect.png) |
| AUTH-G2 | Pass | Signed out: /api/* 401/405, backend 401 | — |
| AUTH-01 | Pass | No self-registration on login page | [AUTH-01-login.png](screenshots/AUTH-01-login.png) |
| AUTH-02 | Pass | Wrong credentials -> generic 'Incorrect email or password.' | [AUTH-02-wrong-credentials.png](screenshots/AUTH-02-wrong-credentials.png) |
| AUTH-03 | Pass | Recovery for unknown email -> generic flow, no account leak | [AUTH-03-forgot-password-unknown.png](screenshots/AUTH-03-forgot-password-unknown.png) |
| AUTH-04 | Pass | Wrong 8-digit recovery code rejected (error=invalid_otp) | [AUTH-04-wrong-recovery-code.png](screenshots/AUTH-04-wrong-recovery-code.png) |
| AUTH-05 | Pass | Sign out -> /login; protected page + API refused afterwards | [AUTH-05-logout.png](screenshots/AUTH-05-logout.png) |
| AUTH-06 | Pass | Curator and Developer sign in with valid credentials (entered by the user) | [CUR-01-dashboard.png](screenshots/CUR-01-dashboard.png) |
| CUR-SWEEP | Pass | 25 curator pages load with live data and no error state | [CUR-02-specimens.png](screenshots/CUR-02-specimens.png) |
| CUR-26 | Pass | Curator opening /developer is redirected to /dashboard | [CUR-26-curator-opens-developer.png](screenshots/CUR-26-curator-opens-developer.png) |
| DSH-01 | Pass | Dashboard counts, pending work, quick actions, Online state | [DSH-01-dashboard-full.png](screenshots/DSH-01-dashboard-full.png) |
| DSH-02 | Pass | Bell lists 12 inquiry/visit alerts; alert opens the record | [DSH-02b-notification-opens-record.png](screenshots/DSH-02b-notification-opens-record.png) |
| DSH-03 | **Fail** | No Mark as read / Dismiss controls (feature flag off in this backend) | [DSH-02-notifications.png](screenshots/DSH-02-notifications.png) |
| SRC-01 | Pass | Search by accession and common name; empty state | [SRC-01-search-common-name.png](screenshots/SRC-01-search-common-name.png) |
| SRC-02 | Pass | Cataloged tab shows only Cataloged rows | [SRC-02-filter-cataloged.png](screenshots/SRC-02-filter-cataloged.png) |
| SRC-03 | Pass | Sort by scientific name ascending | [SRC-03-sort-scientific-name.png](screenshots/SRC-03-sort-scientific-name.png) |
| SRC-04 | Pass | Filter by storage unit (with children) and family | [SRC-04-filter-storage.png](screenshots/SRC-04-filter-storage.png) |
| SPC-01 | Pass | Detail shows status, created/last edited stamps, total | [SPC-01-specimen-detail-uncataloged.png](screenshots/SPC-01-specimen-detail-uncataloged.png) |
| SPC-02 | Pass | 6 missing requirements listed; Catalog specimen disabled | [SPC-02-missing-requirements.png](screenshots/SPC-02-missing-requirements.png) |
| SPC-03 | Pass | Manual entry duplicate warning; save not blocked (not submitted) | [SPC-03-new-draft-duplicate-warning.png](screenshots/SPC-03-new-draft-duplicate-warning.png) |
| SPC-04 | Pass | Cataloged record shows public-eligibility control | [SPC-04-cataloged-public-display.png](screenshots/SPC-04-cataloged-public-display.png) |
| IMP-01 | Pass | CSV template downloads with 8 headers | [IMP-01-import-page-template.png](screenshots/IMP-01-import-page-template.png) |
| IMP-02 | Pass | Preview flags bad gender, used accession, same-species duplicate, empty row | [IMP-02-preview-invalid-and-duplicate.png](screenshots/IMP-02-preview-invalid-and-duplicate.png) |
| IMP-04 | Pass | Non-CSV/XLSX file rejected | [IMP-04-non-csv-rejected.png](screenshots/IMP-04-non-csv-rejected.png) |
| LOT-01 | Pass | New lot quantity 0 rejected (min 1), nothing sent | [LOT-01-quantity-zero.png](screenshots/LOT-01-quantity-zero.png) |
| LOT-02 | Pass | Lot location list offers only specimen-holding drawers | [LOT-01-quantity-zero.png](screenshots/LOT-01-quantity-zero.png) |
| LOT-03 | Pass | Moving 999999 of a lot of 2 rejected (max 2), nothing sent | [LOT-03-move-over-quantity.png](screenshots/LOT-03-move-over-quantity.png) |
| LOT-04 | Pass | Lot history lists transaction with actor and time | [LOT-04-lot-history.png](screenshots/LOT-04-lot-history.png) |
| INQM-01 | Pass | Inquiry search, status tabs, detail with reference + consent | [INQM-01-inquiry-detail.png](screenshots/INQM-01-inquiry-detail.png) |
| INQM-02 | Pass | Reply, Set to Reviewed, Turn into visit request, notes, history | [INQM-01-inquiry-detail.png](screenshots/INQM-01-inquiry-detail.png) |
| INQM-03 | Pass | Empty reply blocked before sending | — |
| VRM-01 | Pass | Approved visit: schedules, campus-entry summary, actions, history | [VRM-01-visit-approved-detail.png](screenshots/VRM-01-visit-approved-detail.png) |
| VRM-02 | **Fail** | 3/3 Completed visits show 'The summary could not be loaded' | [VRM-02-completed-visit-summary-error.png](screenshots/VRM-02-completed-visit-summary-error.png) |
| VRM-03 | Pass | 7 status tabs (6 SRS statuses + All); search | — |
| VRM-04 | Pass | Pending visit: per-option approval, other options kept | [VRM-04-pending-visit-approve-options.png](screenshots/VRM-04-pending-visit-approve-options.png) |
| EXH-01 | Pass | Exhibit: public URL, QR PNG download, Print Label / label SVG | [EXH-01-exhibit-detail-qr.png](screenshots/EXH-01-exhibit-detail-qr.png) |
| EXH-02 | **Fail** | Public URL host is a trycloudflare.com quick tunnel (backend PUBLIC_SITE_URL) | [EXH-01-exhibit-detail-qr.png](screenshots/EXH-01-exhibit-detail-qr.png) |
| EXH-03 | Pass | Create picker limited to Cataloged + public-approved specimens | [EXH-03-create-exhibit-picker.png](screenshots/EXH-03-create-exhibit-picker.png) |
| EXH-04 | Pass | AR selection 'Marked for AR' with reason + Withdraw | [EXH-01-exhibit-detail-qr.png](screenshots/EXH-01-exhibit-detail-qr.png) |
| FAQK-01 | Pass | FAQ entry: alt wording, keywords, category, deactivate/archive, audit link | [FAQK-01-faq-entry.png](screenshots/FAQK-01-faq-entry.png) |
| FAQK-02 | Pass | Create inactive entry blocked without question | [FAQK-02-create-empty.png](screenshots/FAQK-02-create-empty.png) |
| USR-01 | Pass | Users lists 8 curators (6 Active, 2 Pending Invite) | [USR-01-users.png](screenshots/USR-01-users.png) |
| USR-02 | Pass | Invite form rejects invalid email | [USR-02-invite-invalid-email.png](screenshots/USR-02-invite-invalid-email.png) |
| USR-03 | **Fail** | No activate/deactivate/handover controls for curators | [USR-01-users.png](screenshots/USR-01-users.png) |
| USR-05 | **Fail** | Profile menu has only Sign out (no change password) | [USR-05-profile-menu.png](screenshots/USR-05-profile-menu.png) |
| STO-01 | Pass | Unit detail: type, parent, holds specimens, capacity, children, moves | [STO-01-storage-cabinet.png](screenshots/STO-01-storage-cabinet.png) |
| STO-02 | Pass | Move-location parent list excludes self and descendants | [STO-02-storage-manage.png](screenshots/STO-02-storage-manage.png) |
| STO-03 | Pass | Add-location form requires label and type | [STO-03-add-location-form.png](screenshots/STO-03-add-location-form.png) |
| RPT-01 | Pass | 6 report types, period, DOCX/PDF formats | [RPT-01-export-dialog.png](screenshots/RPT-01-export-dialog.png) |
| RPT-02 | Pass | Inverted custom range -> 'start date must not be after the end date' | [RPT-02-invalid-date-range.png](screenshots/RPT-02-invalid-date-range.png) |
| RPT-03 | Pass | Report history listed (83 generated) | [CUR-19-reports.png](screenshots/CUR-19-reports.png) |
| AUD-01 | Pass | Failed sign-ins recorded; Failed filter; no edit/delete controls | [AUD-01-audit-failed-signins.png](screenshots/AUD-01-audit-failed-signins.png) |
| BAK-01 | Pass | Backup history lists 1 recorded backup; no backup/restore admin controls | [BAK-01-backup-history.png](screenshots/BAK-01-backup-history.png) |
| OFF-01 | Pass | Production build caches 102 records on the device | [OFF-02-offline-cached-search.png](screenshots/OFF-02-offline-cached-search.png) |
| OFF-02 | Pass | Offline state shown; cached search works; Sync now disabled | [OFF-02-offline-cached-search.png](screenshots/OFF-02-offline-cached-search.png) |
| OFF-03 | Pass | Cached records filter by status offline | [OFF-02-offline-cached-search.png](screenshots/OFF-02-offline-cached-search.png) |
| OFF-04 | Pass | Text-only draft saved locally as Pending Sync | [OFF-05-offline-draft-pending-sync.png](screenshots/OFF-05-offline-draft-pending-sync.png) |
| OFF-05 | Pass | Fresh offline navigation shows record-free fallback | [OFF-06-offline-fallback.png](screenshots/OFF-06-offline-fallback.png) |
| OFF-06 | Pass | Draft discarded locally; nothing reached the server | — |
| OFF-07 | Pass | Reconnect returns Online | — |
| DEV-01 | Pass | Developer UI shows only account controls + AR deployment | [DEV-01-developer-interface.png](screenshots/DEV-01-developer-interface.png) |
| DEV-02 | **Fail** | All 8 curators shown Active; /users shows 2 Pending Invite | [DEV-01-developer-interface.png](screenshots/DEV-01-developer-interface.png) |
| DEV-03 | Pass | Provision form rejects invalid email | [DEV-03-provision-invalid-email.png](screenshots/DEV-03-provision-invalid-email.png) |
| DEV-04 | Pass | Deactivate opens a formal-authorization form (server-enforced; not submitted) | [DEV-04-deactivate-needs-authorization.png](screenshots/DEV-04-deactivate-needs-authorization.png) |
| DEV-05 | Pass | AR upload: 34 AR-marked exhibits, GLB/USDZ, blocked when incomplete | [DEV-05-ar-upload-blocked.png](screenshots/DEV-05-ar-upload-blocked.png) |
| DEV-06 | Pass | Developer redirected from 12 curator pages to /developer | [DEV-06-developer-blocked-from-curator.png](screenshots/DEV-06-developer-blocked-from-curator.png) |
| DEV-07 | Pass | Developer session gets 403 from curator API handlers | — |

Additional curator screens captured by the route sweep: `CUR-01` to `CUR-26` in `screenshots/`.

## Limitations

- Writes were out of scope, so *prior* rows rely on the 27–28 Oct BBT (140 cases) and the 3–4 Nov BBT email checks. The code paths
  they cover did not change after those runs, except the 31 Oct curator redesign, which is checked by live page loads.
- The tests use mocked or in-memory APIs where noted, and the browser run used the shared development database. Neither proves deployed or
  production behaviour. Camera AR on a phone and mobile curator layouts were not tested (curator UI is laptop-only by decision).
- The last report's per-requirement statuses are reconstructed from its section scores and named gaps, as explained above.
- **Screenshots contain personal data** (team and test-visitor emails, names) from the shared database. Review or redact them
  before committing `docs/progress-report-frontend/screenshots/` or sharing it outside the team.

Companion files: [`charts.html`](charts.html) and [`progress-data.json`](progress-data.json).
