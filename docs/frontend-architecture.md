# Frontend Architecture Notes

Decided 2026-08-27. This repo (`biosphere-frontend`) is the single frontend for the whole
BioSphere system — it serves the **public website**, the **curator PWA**, and the **restricted
developer interface** all in one Next.js app (BioSphere is split into exactly two repos total:
this frontend and a separate NestJS backend). See `CLAUDE.md` for the product scope and
`BioSphere-SRS.pdf` / `BioSphere-Final-Capstone-1.pdf` for the source requirements.

## 1. Top-level structure

Three audiences are separated with Next.js **route groups** (`(name)` folders — organizational
only, don't affect the URL). Each group gets its own root layout, which is what lets the
curator/developer groups load the PWA manifest and register the offline service worker while
the public site never ships either.

```text
src/
├── proxy.ts                      # optimistic auth gate (Next 16 renamed middleware.ts -> proxy.ts)
├── app/
│   ├── (public)/                 # unauthenticated — own root layout, no PWA manifest
│   │   ├── layout.tsx
│   │   ├── page.tsx               # Home "/"
│   │   ├── gallery/page.tsx
│   │   ├── visit/page.tsx         # visitor guidelines + Visit Request form
│   │   ├── about/page.tsx
│   │   ├── inquiry/page.tsx       # General Inquiry form
│   │   └── exhibits/[slug]/page.tsx  # unlisted QR exhibit page, WebAR + fallback
│   │
│   ├── (curator)/                # authenticated — own root layout WITH manifest + SW registration
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── specimens/
│   │   │   ├── page.tsx           # list/search/filter
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx      # detail + lots + history
│   │   ├── storage/page.tsx
│   │   ├── inquiries/page.tsx
│   │   ├── visit-requests/page.tsx
│   │   ├── reports/page.tsx
│   │   ├── exhibits/page.tsx      # QR + FAQ knowledge management
│   │   └── account/page.tsx       # onboarding/succession, password change
│   │
│   ├── (developer)/               # restricted, separate from (curator)
│   │   ├── layout.tsx
│   │   ├── curator-access/page.tsx
│   │   └── ar-assets/page.tsx
│   │
│   └── login/page.tsx             # shared entry point for curator+developer auth
│
├── features/                      # mirrors the backend's NestJS modules, see §3
│   ├── specimens/
│   ├── storage-locations/
│   ├── inquiries/
│   ├── visit-requests/
│   ├── exhibits-qr/
│   ├── faq/
│   ├── reports/
│   ├── curator-accounts/
│   ├── developer/
│   ├── auth/
│   └── offline/                   # Dexie schema, draft queue, sync engine
│
├── components/
│   ├── ui/                        # shadcn/ui primitives
│   └── layout/                    # shared header/nav/footer pieces
│
├── lib/
│   ├── api-client.ts              # the ONLY place fetch() to the backend happens
│   ├── session.ts                 # server-only: verifySession() over Supabase
│   ├── supabase/{client,server}.ts
│   └── env.ts                     # zod-validated process.env
│
└── types/
    └── api.ts                     # DTOs — hand-written for now, ideally generated later from the
                                    # backend's OpenAPI/Swagger spec so the two repos can't drift
```

## 2. Talking to the backend

Backend is a separate NestJS REST API (see the other repo) with Supabase-managed auth
(`auth.users`). This is the "external HTTP API" case — call it with `fetch`, attach the session
token, keep it to one chokepoint.

**`lib/api-client.ts`** — every backend call goes through this:

```ts
import 'server-only'
import { getAccessToken } from './session'

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL!

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAccessToken()
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...init?.headers,
    },
  })
  if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => null))
  return res.json()
}
```

Each feature wraps it, e.g. `features/specimens/api.ts`:

```ts
import { apiFetch } from '@/lib/api-client'
import type { Specimen, SpecimenListParams } from './types'

export const listSpecimens = (params: SpecimenListParams) =>
  apiFetch<Specimen[]>(`/specimens?${new URLSearchParams(params)}`)

export const getSpecimen = (id: string) => apiFetch<Specimen>(`/specimens/${id}`)
```

Reads happen directly in Server Components; writes go through `'use server'` Server Actions in
`features/<x>/actions.ts` that call the same `api.ts` then `revalidatePath`.

**Two layers of auth checking** (both needed — neither is sufficient alone):

1. `proxy.ts` (root) — cheap cookie-presence redirect so an unauthenticated visitor never reaches
   `(curator)`/`(developer)`.
2. `lib/session.ts`'s `verifySession()` — the real check, re-run inside every Server Action/data
   call, because proxy matchers can drift out of sync with real routes.

Env vars: only `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SUPABASE_URL` /
`NEXT_PUBLIC_SUPABASE_ANON_KEY` are client-safe. No service-role key or backend secret ever
belongs in this repo.

## 3. Mirroring the backend's NestJS modules

A NestJS module (backend repo) looks like:

```text
backend/src/specimens/
├── specimens.module.ts
├── specimens.controller.ts
├── specimens.service.ts
├── dto/{create,update}-specimen.dto.ts
└── entities/specimen.entity.ts
```

The frontend has no controller/service layer, but the same domain shape — so `features/<x>/`
mirrors it feature-for-feature by name (`specimens` ↔ `specimens`, `visit-requests` ↔
`visit-request`, etc.), purely so a bug in one domain is easy to find in both repos:

```text
features/specimens/
├── api.ts          # one function per backend endpoint
├── actions.ts       # 'use server' mutations -> api.ts -> revalidation
├── types.ts         # kept in sync with the backend's dto/*.dto.ts
├── schema.ts         # zod mirror of the backend's class-validator rules, for client-side feedback
├── components/
└── hooks/
```

Once the backend has real endpoints, generate `types/api.ts` from its Swagger/OpenAPI spec
(`openapi-typescript` or similar) instead of hand-syncing DTOs.

## Open items / not yet decided

- Exact Dexie schema and sync-conflict handling for `features/offline/`.
- Whether report exports (DOCX/PDF/CSV) are generated client-side or requested from the backend.
- OpenAPI-based type generation isn't wired up yet — `types/api.ts` is hand-written until the
  backend has stable endpoints to generate from.
