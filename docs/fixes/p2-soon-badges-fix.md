# [P2] Sidebar SOON Badges — Accuracy Fix

> **Status:** PENDING · **Priority:** P2 · **Effort:** 30 min · **Branch:** `claude/fix-soon-badges`
> **Last updated:** 2026-05-12

## Why this matters
Sidebar SOON badges are lying to users. Email Campaigns is shown as SOON but is fully built and running real campaigns (6 campaigns, 44.2% open rate, real data). Social Hub is shown as SOON but is actually in Demo Mode. Wrong labels train the team to ignore badges entirely, which makes future genuine "SOON" markers worthless.

## The problem (evidence)
- `/dashboard/email-campaigns` is fully wired (6 campaigns, 44.2% avg open rate) but sidebar shows SOON.
- `/dashboard/social` is functional but explicitly in demo mode (mock data, no API), and sidebar shows SOON.
- Source: `app/(dashboard)/components/sidebar.tsx`.

## Scope
**In scope:**
- Remove SOON badge from the Email Campaigns nav item.
- Replace SOON on Social Hub with a "Demo" badge in a different color (e.g., amber rather than gray) so users know it's not production data.
- Audit all other SOON badges in the same pass — confirm they still apply.

**Out of scope:**
- Moving Social Hub out of demo mode (separate work).
- Refactoring the badge component itself.

## Files to touch
- `app/(dashboard)/components/sidebar.tsx`
- Possibly `app/(dashboard)/components/sidebar-badge.tsx` (if a new "Demo" variant is needed)

## The fix (step by step)
1. Open `sidebar.tsx`. Find the nav items collection.
2. Remove `badge: 'SOON'` from the Email Campaigns entry.
3. Change Social Hub's `badge: 'SOON'` to `badge: 'DEMO'`.
4. If the badge component is a simple string render, add a variant prop (`'soon' | 'demo'` → gray vs amber) so the colors are distinct.
5. Visually inspect the sidebar on `/dashboard` to confirm.
6. Sweep the file once more: any other nav item with SOON that is actually shipped? If yes, fix and note in PR.

## Acceptance criteria
- [ ] Email Campaigns has no badge in the sidebar.
- [ ] Social Hub shows a "DEMO" badge (amber or similar) — clearly distinct from SOON gray.
- [ ] No other false-SOON badges remain.
- [ ] No visual regressions to sidebar layout.

## Verification
```bash
npm run dev
# navigate to /dashboard and inspect sidebar
```
Expected: Email Campaigns clean, Social Hub shows DEMO badge in non-gray color.

## Dependencies
**Requires:** none.
**Blocks:** none.

## Notes
Tiny ticket, low risk. Bundle into a "sidebar cleanup" PR alongside P2-12 (stub-routes-removal) if those land in the same week — both touch `sidebar.tsx`.
