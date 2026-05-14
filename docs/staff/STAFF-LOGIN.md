# Staff Login — How It Works

## Access point
Footer utility row → "Staff" (en) / "Equipo" (es) → `/dashboard/login`

## Auth method
NextAuth + Google OAuth, domain-locked to `@countercultures.com.mx`. **No exceptions.** The `PORTAL_EMAIL_ALLOWLIST` env var has been removed from Netlify — do not re-introduce it. Contractors (incl. Joshua / Untold Works) sign in via a `@countercultures.com.mx` Workspace alias (e.g. `admin@countercultures.com.mx`), not an external domain.

## Two-gate auth flow

1. **Domain gate** — Google OAuth `hd` param restricts to `@countercultures.com.mx`. Non-domain emails are rejected before they hit the app.
2. **Users-sheet gate** — the `signIn` callback in `app/lib/auth-options.ts` looks up the email in the `Users` tab of the Counter Cultures CRM Google Sheet. If no row exists, or `active=false`, sign-in is rejected with `AccessDenied`. Both rejection reasons are logged as structured `[auth]` warnings in the server logs.

**Exception:** `admin@countercultures.com.mx` is hardcoded as a break-glass superadmin. It always gets through, even if the Users sheet row is missing, deactivated, or the Sheets API is down. Falls back to `owner` role when the sheet is unavailable.

## Current seed list

| Email | Name | Role | Active |
|-------|------|------|--------|
| `roger@countercultures.com.mx` | Roger Floyd Williams | owner | true |
| `admin@countercultures.com.mx` | Joshua Semolik (admin alias) | owner | true |
| `control@countercultures.com.mx` | Antonina Trischitta | finance | true |
| `javier@countercultures.com.mx` | Javier Medina | sales | true |
| `ian@countercultures.com.mx` | Ian | sales | true |
| `joshua@untold.works` | Joshua Semolik | owner | **false** (audit trail only) |

## How to add a new staff user

1. Open the **Counter Cultures CRM** Google Sheet (Shared Drive).
2. Go to the **Users** tab.
3. Add a row: `email | name | role | true | ` (leave `feature_overrides` empty).
   - `role` must be one of: `owner`, `finance`, `sales`.
   - Email must be `@countercultures.com.mx`.
4. Wait ~60 seconds for the auth cache to expire (or deploy a code change to trigger a cold start).
5. The new user can now sign in at `/dashboard/login`.

To verify who currently has access from the CLI:
```bash
npx tsx scripts/list-portal-users.ts
```

## How to revoke access

Set `active=false` on the user's row in the Users tab. **Do NOT delete the row** — it preserves audit trail and prevents accidental email reuse.

## What NOT to do
- Do not surface the login button in the main navigation.
- Do not create public-facing account or registration flows.
- Do not add `joshua@untold.works` to the allowlist or re-activate it — use `admin@countercultures.com.mx` instead.

## Redirect rules
| Source | Destination | Type |
|--------|-------------|------|
| `/portal` | `/dashboard/login` | 307 |
| `/:locale/portal` | `/dashboard/login` | 307 |

## Search exclusion
`robots.txt` disallows `/dashboard` and `/api`.
