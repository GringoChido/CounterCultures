# Staff Login — How It Works

## Access point
Footer utility row → "Staff" (en) / "Equipo" (es) → `/dashboard/login`

## Auth method
NextAuth + Google OAuth, domain-locked to `@countercultures.com.mx`.
Contractors without that domain are added to `PORTAL_EMAIL_ALLOWLIST` (comma-separated env var).

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
