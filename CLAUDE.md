# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## About this repo

BioSphere Frontend is a Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4 project, currently at the freshly-scaffolded `create-next-app` stage — `src/app/` contains only the default layout/page/globals.css. There is no test runner configured yet.

**Before writing any code**, read the relevant guide under `node_modules/next/dist/docs/` — this Next.js version (16.3.2) has breaking changes vs. training data. See AGENTS.md above for details on why and how this docs block is maintained.

This repo is one piece of a larger system (see below). Its scaffold doesn't yet indicate whether it will become the **public website** or the **curator PWA** (the SRS calls for two separate frontends) — confirm which before assuming routes/pages. Full source docs live in `docs/`: `BioSphere-Final-Capstone-1.pdf` (capstone manuscript — rationale, related-systems review, conceptual framework, ERD, use cases) and `BioSphere-SRS.pdf` (IEEE 830/ISO 29148 Software Requirements Specification — the authoritative `REQ-*`/`NFR-*`/`BR-*` requirement IDs). This section is a summary for quick orientation, not a replacement — check the PDFs for anything requirement-critical.

## About BioSphere (the product)

BioSphere is an **offline-first web-based biological museum management system** being built as a capstone project for the University of San Carlos Biological Museum (USC-BM). It replaces the museum's paper-based/spreadsheet specimen records with a centralized, searchable, audited system, while adding a public-facing website, QR-based exhibits, and selective WebAR.

### Three platforms, one system

|Platform|Users|Purpose|
|---|---|---|
|Curator PWA (authenticated)|Museum curators|Specimen cataloging, storage-location management, inquiries/visit-requests, reports, QR/FAQ content, audit log, backup|
|Public website|Unauthenticated visitors|Home/Gallery/Visit/About pages, General Inquiry & Visit Request forms, Controlled Knowledge-Based FAQ Assistant, unlisted QR exhibit pages, selected WebAR|
|Restricted developer interface|Developers (technical, infrequent)|Onboard the initial curator, enable/disable curator access when formally authorized, deploy/update approved AR assets only — **not** a general admin dashboard|

### MVP scope (in)

- Curator auth, email-invite onboarding, password recovery, curator succession/handover, RBAC.
- Specimen cataloging: taxonomy/descriptive fields, images, Uncataloged → Cataloged → Archived states, CSV/spreadsheet import with possible-duplicate warnings.
- Specimen **lots**: one specimen record can have multiple lots (quantity + condition + one storage location each); moves/condition changes preserve total quantity.
- Hierarchical storage locations (rooms/galleries → cabinets → drawers/shelves → boxes/vials → ...).
- Search/filter/sort, 5 report types, DOCX/PDF/CSV/print export, audit history.
- General Inquiry + Visit Request workflows: in-system curator alerts, outbound-only email notifications/replies (curator-initiated).
- Controlled Knowledge-Based FAQ Assistant — answers **only** from curator-approved knowledge; falls back to the General Inquiry form otherwise (never generates/invents answers).
- Unlisted QR exhibit pages + optional WebAR for curator-selected specimens (~20 initially), each with a human-readable direct-URL fallback and non-AR fallback.
- Limited offline support in the curator PWA: read-only viewing/search of previously-synced specimen records, plus creating new **text-only Uncataloged drafts** that sync after reconnection.
- Audit logging, configurable backup/recovery with restore testing, turnover documentation.

### MVP scope (out — don't build these)

Student OJT module, direct ISMIS/campus-entry integration or auto-approval, native mobile apps, a searchable public specimen catalog, AR for every specimen, other USC museum units, unrestricted/generative chatbot behavior, a general-purpose admin dashboard, SMS integration, external mailbox sync (no reading Gmail/Outlook replies — outbound email only), offline editing of *existing* records, an online/offline conflict-resolution engine, a curator-facing CMS for the Home/Gallery/Visit/About pages (those are static frontend content — changes go through source-code redeployment, not a curator UI).

### Key business rules worth internalizing

- **BR-10 Public approval**: only curator-approved info may ever reach the public site/Gallery/FAQ/QR/AR.
- **BR-11 Storage confidentiality**: detailed storage locations never appear outside authenticated curator functions.
- **BR-16 Offline position**: offline = read-only cache + new Uncataloged drafts only; never offline edits to existing records.
- **BR-18 FAQ boundary**: FAQ assistant is rule-based against curator-approved content only; unmatched → General Inquiry form.
- **BR-21/22 Outbound email boundary**: BioSphere sends email but never connects to/reads an external mailbox.
- **BR-12 Developer restriction**: Developer role ≠ curator; strictly limited to onboarding/access-admin + AR asset deploy.

### Target architecture (per SRS)

- **Frontends**: two separate Next.js + TypeScript apps (public website, curator PWA), Tailwind CSS + shadcn/ui, consistent USC-inspired white-and-green branding.
- **Backend**: NestJS (TypeScript) modular monolith exposing a documented REST API (OpenAPI/Swagger).
- **Database**: PostgreSQL via Prisma ORM.
- **Object storage**: Supabase Storage (or equivalent S3-compatible) for images, exhibit media, 3D/AR assets.
- **Offline (curator PWA only)**: IndexedDB via Dexie + a service worker (Workbox) — caches specimen records read-only and queues new Uncataloged drafts until sync.
- **Email**: SendGrid, outbound-only (curator alerts, inquiry/visit-request replies, onboarding, password recovery).
- **Deployment**: Docker + Docker Compose, Nginx reverse proxy, targeting a USC/DCISM-approved Linux/cloud environment; Git/GitHub + GitHub Actions for CI/CD.
- **3D asset pipeline**: Tripo 3D and Meshy AI for AI-assisted generation of initial specimen 3D models, used as an approved-AR-asset source for the developer-deployment step.

### Non-functional requirements to keep in mind

- **Performance**: 95% of standard page loads/searches/saves < 3s; paginated search over 60k records returns first page < 3s; 3+ concurrent curators / 25+ concurrent visitors in test env.
- **Security**: authenticated + RBAC-enforced access to every protected op, salted password hashing (no plaintext), HTTPS/TLS in production, input/file validation and sanitization, rate limiting on auth/recovery/public forms/FAQ, time-limited single-use recovery tokens, no secrets in the repo or client-side code, public interfaces never expose internal specimen/storage/visitor/audit data.
- **Safety**: confirm before archive/deactivate/discard-offline-changes; archive (never hard-delete) official specimen records; never silently overwrite conflicting synced data; never report a failed save/import/sync/backup as successful.
- **Privacy**: Philippine Data Privacy Act (RA 10173) — collect minimum visitor data necessary, documented retention/consent, private data excluded from public reports/pages.
- **Accessibility/Compatibility**: keyboard navigation, visible focus, alt text, sufficient contrast; current major browsers; AR must degrade gracefully to the non-AR exhibit page when unsupported/denied/failing.

## Commands

```bash
npm run dev      # start dev server (http://localhost:3000)
npm run build    # production build
npm run start    # serve production build
npm run lint     # eslint (flat config, eslint-config-next core-web-vitals + typescript)
```

There is no test suite in this repo yet.

## Architecture notes

- App Router lives under `src/app/`; the `@/*` path alias maps to `src/*` (see `tsconfig.json`).
- Styling is Tailwind CSS v4 via the `@tailwindcss/postcss` plugin (`postcss.config.mjs`) — no `tailwind.config.*` file (v4 is CSS-first; theme config belongs in `globals.css`).
- `next.config.ts` is currently empty (default config).
- CI (`.github/workflows/ci.yml`) runs `npm ci`, `npm run lint`, and `npm run build` on PRs/pushes to `main`.
