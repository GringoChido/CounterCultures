# [P2] Cold Lambda TTFB Mitigation

> **Status:** PENDING · **Priority:** P2 · **Effort:** 1 day · **Branch:** `claude/fix-cold-lambda-mitigation`
> **Last updated:** 2026-05-12

## Why this matters
Cold lambda TTFB on the homepage measures at 10.7 seconds. Anything over 3s is a visible drop-off cliff — at 10s a meaningful fraction of organic visitors bounce before paint. The 354K-row catalog fetch on cold start dominates the budget; every Lambda instance pays that cost independently.

## The problem (evidence)
- Synthetic measurement: homepage cold TTFB = 10.7s; warm TTFB = 280ms.
- `app/lib/products/load-catalog.ts` pulls the entire `CC_Products_Full` sheet via Google API on first hit per Lambda instance.
- No persistent shared cache — each Lambda boots cold and refetches.

## Scope
**In scope:**
- Pick exactly one of (a) or (b) below, ship it:
  - **(a)** Move catalog fetch to Netlify Edge Functions + Netlify Blobs / KV cache (shared across edges, TTL 30 min).
  - **(b)** Precompute catalog snapshot at build time, bundle as `public/_catalog/snapshot.json`, fetch via CDN (immutable, cache-busted by build hash).
- Add a warmup cron pinging `/`, `/insights`, `/catalogo`, `/dashboard/today` every 5 min on prod.

**Out of scope:**
- Search infra migration (covered by P1.11 — coordinate timeline).
- Full SSG conversion of marketing pages.

## Files to touch
- `app/lib/products/load-catalog.ts`
- `netlify/edge-functions/catalog.ts` (new, if option a)
- `scripts/build-catalog-snapshot.ts` (new, if option b)
- `netlify.toml` (edge function config or build step)
- `app/api/cron/warmup/route.ts` (new)
- `netlify.toml` cron schedule entry

## The fix (step by step)
1. Decide (a) vs (b) with Joshua. Default to **(b)** if P1.11 is shipping within 30 days (cheaper, simpler, gets ripped out soon anyway).
2. **If (b):** add `scripts/build-catalog-snapshot.ts` that runs in `prebuild`, writes `public/_catalog/snapshot.json` + a `snapshot.meta.json` with hash + count. Update `load-catalog.ts` to read the snapshot first and only hit Sheets on miss or staleness.
3. **If (a):** create edge function that reads from Netlify Blobs; populate blob on first request; set TTL 30 min; update all catalog callers to hit the edge route.
4. Build `/api/cron/warmup/route.ts` calling four key URLs with `?warmup=1`. Schedule every 5 min in `netlify.toml`.
5. Re-measure cold TTFB on three test deploys.

## Acceptance criteria
- [ ] Cold homepage TTFB < 3s on Netlify production.
- [ ] Warmup cron runs every 5 min and logs success.
- [ ] Catalog data is still fresh (max 30 min lag for option a, rebuild cadence for option b).
- [ ] No regression in warm TTFB.

## Verification
```bash
curl -w "TTFB: %{time_starttransfer}s\n" -o /dev/null https://counter-cultures.netlify.app/
```
Expected: under 3s cold, under 500ms warm.

## Dependencies
**Requires:** none.
**Blocks:** none. **Coordinate with:** P1.11 (search platform migration) — likely supersedes this. If P1.11 lands first, this ticket may be cancelled.

## Notes
See `AGENTS.md` for Netlify deployment notes. Refer to Next.js 16 Edge docs for runtime constraints (no Node APIs in edge functions). Warmup cron should authenticate via `x-cron-secret`.
