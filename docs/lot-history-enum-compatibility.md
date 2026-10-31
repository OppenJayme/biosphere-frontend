# Retained temporary-absence history (DEF-030) - 2026-10-31

The reported Lots-page failure has two boundaries: the backend Prisma client
cannot read the database's extra enum value, and the old frontend response
schema rejects `TEMPORARY_ABSENCE` even after backend decoding is repaired.

This frontend change adds that one known category to recorded-history response
types and labels. It leaves the seven existing write choices/form rules intact;
it does not implement a new adjustment operation, change quantities/history,
accept arbitrary future enum strings, or swallow backend errors.

Tests use the real async page, API client, Zod contracts and static rendering,
with only HTTP/session/config boundaries synthetic. The original page test
failed with **The specimen lots could not be loaded** before the fix and now
renders the existing lots, summary and retained event. Four page cases cover
that value, ordinary additions, unknown-value rejection and private-error-body
containment. Another case verifies the friendly label, absent write choice,
and rejected command using all required fields plus a valid REMOVAL control.

Validation: full Vitest 450/450, focused lot/page contracts 20/20, then the
tightened write-guard group 12/12; no additive case-count claim. Lint and Next
type generation/TypeScript checks pass. The isolated Next 16.3.5 webpack build
passes using public CI placeholders and an unreachable loopback backend URL;
no real environment file, login or runtime server was used or copied.

Backend compatibility is required: add the known value to Prisma, regenerate
the client, carry the original idempotent enum migration without applying it to
shared data, and expose the recorded response contract independently of write
DTOs. See the paired backend's `docs/LOT_HISTORY_ENUM_COMPATIBILITY.md`.
Review/merge backend first, then frontend, and rebuild through the controlled
rollout before read-only retesting the reported accession. Source/fixture passes
are not a live repair or independent module sign-off. Existing browser windows,
servers, shared records and storage were untouched.
