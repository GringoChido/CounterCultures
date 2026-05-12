# [P2] Stub Route Removal (Design / Odoo / Content-Calendar / Website-Analytics)

> **Status:** PENDING · **Priority:** P2 · **Effort:** 30 min · **Branch:** `claude/fix-stub-routes-removal`
> **Last updated:** 2026-05-12

## Why this matters
Four sidebar entries lead to dead or developer-only pages. Every "click → broken/redirect/error" interaction trains the team to distrust the dashboard. Removing them is a 30-minute polish item that materially improves perceived quality.

## The problem (evidence)
- `/dashboard/design` — dev-only EntityCard preview using mock IDs. Should not be in production navigation.
- `/dashboard/odoo` — self-labels "Retiring" + every endpoint returns 429.
- `/dashboard/content-calendar` — silently redirects to `/dashboard/social`.
- `/dashboard/website-analytics` — silently redirects to `/marketing-analytics`.

## Scope
**In scope:**
- Remove all four entries from the sidebar.
- Delete `/dashboard/design` page entirely OR move behind a `?dev=1` flag.
- Delete the two redirect-only pages (`content-calendar`, `website-analytics`).
- Add Netlify redirects so external/bookmark links still land somewhere reasonable.
- Update Odoo entry to a deprecation note or remove (P1.16 owns the full retirement).

**Out of scope:**
- Odoo backend removal (P1.16).
- New Design preview tooling (will live in Storybook eventually).

## Files to touch
- `app/(dashboard)/components/sidebar.tsx`
- `app/(dashboard)/dashboard/design/page.tsx` (delete or `?dev=1` gate)
- `app/(dashboard)/dashboard/odoo/page.tsx` (coordinate with P1.16)
- `app/(dashboard)/dashboard/content-calendar/page.tsx` (delete)
- `app/(dashboard)/dashboard/website-analytics/page.tsx` (delete)
- `netlify.toml` (add 301 redirects: `/dashboard/content-calendar → /dashboard/social`, `/dashboard/website-analytics → /marketing-analytics`)

## The fix (step by step)
1. Open `sidebar.tsx`; remove the four nav entries (Design, Odoo, Content Calendar, Website Analytics).
2. Delete `app/(dashboard)/dashboard/content-calendar/` and `.../website-analytics/` directories.
3. For Design: either delete the directory, or wrap the page in `if (!searchParams.dev) notFound()` so it's behind `?dev=1`.
4. For Odoo: coordinate with P1.16. If P1.16 hasn't shipped yet, leave the page but remove the nav link.
5. Add the two 301 redirects in `netlify.toml`.
6. `npm run build` to confirm no orphan imports.
7. Verify `/dashboard` sidebar no longer shows the four entries.

## Acceptance criteria
- [ ] Sidebar contains zero of the four removed entries.
- [ ] `/dashboard/design` is either gone or only accessible with `?dev=1`.
- [ ] `/dashboard/content-calendar` and `/dashboard/website-analytics` 301 to their real destinations.
- [ ] Build passes.

## Verification
```bash
curl -I https://counter-cultures.netlify.app/dashboard/content-calendar
```
Expected: `HTTP/2 301` with `location: /dashboard/social`.

## Dependencies
**Requires:** coordinate with P1.16 for Odoo specifically.
**Blocks:** none.

## Notes
Bundle with P2-11 (soon-badges-fix) if shipping the same week — both touch `sidebar.tsx`.
