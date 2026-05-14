# [P3] Admin portal access — admin@countercultures.com.mx rejected

> **Status:** DONE · **Priority:** P3 · **Effort:** 1 hr · **Branch:** `fix/admin-portal-access`
> **Last updated:** 2026-05-14

## Why this matters

Joshua signs into the Counter Portal as `admin@countercultures.com.mx` (his Workspace alias). After the P0 bootstrap fix removed the permissive fallback, sign-in requires a row in the Users sheet. The original P0 seed list (`docs/fixes/p0-portal-users-bootstrap.md`) listed `joshua@untold.works` but not `admin@`. The seed script (`scripts/seed-users.ts`) was later updated to include it, but the silent rejection made diagnosing the gap harder than it needed to be.

## Root cause

1. The `signIn` callback in `app/lib/auth-options.ts` returned `false` with no log output when a user was missing from the sheet or deactivated. Three distinct rejection paths (no email, wrong domain, not in sheet) all looked identical in Netlify logs.
2. The login error page showed a generic message that didn't distinguish "not in sheet" from "deactivated" and offered no way to try a different account.

## What was done

### Data fix (already in place)
- `admin@countercultures.com.mx` was already seeded into the Users sheet (row 06) with `role=owner`, `active=true` by a prior run of `scripts/seed-users.ts`. No sheet edit needed.

### Code hardening
1. **Structured auth logging** (`app/lib/auth-options.ts`) — each rejection path now logs a `[auth] signIn rejected:` warning with the specific reason (no email / wrong domain / not in sheet / deactivated) and the email address. Surfaces in Netlify function logs.
2. **Better login error copy** (`app/(dashboard)/dashboard/login/page.tsx`) — the AccessDenied message now explains both possible causes (not in sheet OR deactivated) and shows a "Try a different Google account" link that re-triggers OAuth with account selection.
3. **Diagnostic script** (`scripts/list-portal-users.ts`) — CLI tool to list all portal users and their active status without needing the dashboard UI. Run: `npx tsx scripts/list-portal-users.ts`.

### Documentation
4. **STAFF-LOGIN.md** — updated with the actual current seed list (including admin@), a "How to add a new staff user" runbook, and a "How to revoke access" section.

## Files touched

- `app/lib/auth-options.ts` — structured rejection logging, cleaned stale module comment
- `app/(dashboard)/dashboard/login/page.tsx` — better AccessDenied copy + "try different account" link
- `scripts/list-portal-users.ts` — new diagnostic script
- `docs/staff/STAFF-LOGIN.md` — seed list + runbook
- `docs/fixes/p3-admin-portal-access.md` — this file

## Verification

- [ ] `admin@countercultures.com.mx` signs in → reaches `/dashboard/overview`
- [ ] A bad-domain attempt (personal gmail) → AccessDenied with improved message
- [ ] Netlify logs show `[auth] signIn rejected:` with the specific reason
- [ ] `npm run typecheck` and `npm run lint` pass
- [ ] `npx tsx scripts/list-portal-users.ts` prints the current user list
