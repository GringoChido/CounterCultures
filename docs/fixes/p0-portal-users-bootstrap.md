# [P0] Portal Users bootstrap mode is open — close auth hole

> **Status:** PENDING · **Priority:** P0 · **Effort:** 30 min · **Branch:** `claude/fix-portal-users-bootstrap`
> **Last updated:** 2026-05-12

## Why this matters

The portal is currently in "bootstrap mode" — the Users sheet tab is empty, so the `signIn` callback in `app/lib/auth-options.ts` falls through to a permissive fallback that accepts any `@countercultures.com.mx` email. Combined with the domain-match check, this means anyone at the company (or anyone with a spoofed/typosquatted Google Workspace identity on that domain) can sign in to the dashboard unrestricted right now. Role-gating in production is not real until the Users sheet is seeded and the bootstrap fallback is removed.

## The problem (evidence)

- `/dashboard/settings/users` shows: *"No users yet. Add the first one — bootstrap mode is active until then, so anyone with an @countercultures.com.mx email can sign in."*
- Counter Cultures CRM → `Users` tab is empty (no header row, no data rows).
- `app/lib/auth-options.ts` `signIn` callback returns `true` if the Users sheet returns 0 rows (the bootstrap fallback).
- Net effect: any Google account on the `countercultures.com.mx` domain authenticates with full access, ignoring role gating.

## Scope

**In scope:**
- Seed Users sheet with the 5 operator rows
- Confirm correct emails / names with the team
- Remove (or feature-flag) the bootstrap fallback in `signIn` callback
- Verify sign-in / access-denied flows

**Out of scope:**
- Building a UI to manage Users (already exists at `/dashboard/settings/users`)
- Role-permission matrix changes (separate fix)
- Audit-logging of failed sign-ins (separate fix)

## Files to touch

- Counter Cultures CRM → `Users` tab — seed 5 rows
- `app/lib/auth-options.ts` — remove bootstrap fallback in `signIn` callback
- `app/lib/users-sheet.ts` — no code change needed (read-only verification)

## The fix (step by step)

1. Open the Counter Cultures CRM sheet, navigate to the `Users` tab (create the tab if missing).
2. Add the header row: `email | name | role | active | feature_overrides`
3. Add the 5 seed rows:
   - `joshua@untold.works | Joshua Semolik | owner | true | `
   - `roger@countercultures.com.mx | Roger Floyd Williams | owner | true | `
   - `antonia@countercultures.com.mx | Antonia | finance | true | `
   - `javier@countercultures.com.mx | Javier Medina | sales | true | `
   - `ian@countercultures.com.mx | Ian (last name TBD) | sales | true | `
4. Confirm Antonia's email address and Ian's full name with the team — update rows if needed.
5. Open `app/lib/auth-options.ts`. Locate the `signIn` callback. Remove the bootstrap-mode fallback that returns `true` when the Users sheet is empty. (Optionally gate it behind an env flag like `AUTH_BOOTSTRAP_ALLOW=1` so a future admin can re-enable it deliberately — but default OFF.)
6. Commit on branch `claude/fix-portal-users-bootstrap`, push, deploy.
7. Test:
   - Sign out, sign in as a seeded user → succeeds, lands on `/dashboard`.
   - Sign in with an unauthorized `@countercultures.com.mx` Google account → denied (`AccessDenied` error page).
   - Sign in with a non-domain account → denied.

## Acceptance criteria

- [ ] Users sheet has 5 seeded rows with correct headers
- [ ] Sign-in as a known seeded user → succeeds
- [ ] Sign-in as an unauthorized `@countercultures.com.mx` email → denied with `AccessDenied`
- [ ] Bootstrap fallback removed from `signIn` callback (or kept only behind explicit env flag, default off)
- [ ] `/dashboard/settings/users` shows the 5 seeded rows (no "bootstrap mode active" banner)

## Verification

```bash
# Local: tail dev logs while testing
pnpm dev
# Browser: sign out, attempt sign-in as an unauthorized domain user
# Expect: AccessDenied
```

Expected: `/dashboard/settings/users` renders 5 rows. Bootstrap banner gone. Unauthorized sign-in denied at NextAuth callback level (visible in server log as `signIn returned false`).

## Dependencies

**Requires:** P0.5 (CRM moved to Shared Drive) ONLY if Antonia / Roger don't already have edit access to the Users tab today. If they do, this can ship independently.
**Blocks:** Nothing strictly, but role-gating in production is not real until this is done — every downstream "owner-only" or "finance-only" route is currently bypassable.

## Notes

- The bootstrap fallback was deliberate during initial setup so that the first admin could sign in before the Users sheet existed. With 5 seeded rows, it's a liability.
- If an admin later clears the Users sheet by accident, sign-in will start denying everyone — that's the correct failure mode (fail closed). To recover, an admin with direct Sheet access can re-seed the row for themselves.
- See `docs/finance/CLAUDE-FINANCE-RULES.md` for role definitions (`owner` vs `finance` vs `sales`).
