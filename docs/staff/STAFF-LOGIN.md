# Staff Login — How It Works

## Access point
Footer utility row → "Staff" (en) / "Equipo" (es) → `/dashboard/login`

## Auth method
NextAuth + Google OAuth, domain-locked to `@countercultures.com.mx`. **No exceptions.** The `PORTAL_EMAIL_ALLOWLIST` env var has been removed from Netlify — do not re-introduce it. Contractors (incl. Joshua / Untold Works) sign in via a `@countercultures.com.mx` Workspace alias (e.g. `admin@countercultures.com.mx`), not an external domain.

## What NOT to do
- Do not surface the login button in the main navigation.
- Do not create public-facing account or registration flows.

## Redirect rules
| Source | Destination | Type |
|--------|-------------|------|
| `/portal` | `/dashboard/login` | 307 |
| `/:locale/portal` | `/dashboard/login` | 307 |

## Search exclusion
`robots.txt` disallows `/dashboard` and `/api`.
