# [P2] Blog Analytics Wiring (GA4 + View Counts)

> **Status:** PENDING · **Priority:** P2 · **Effort:** 4 hrs · **Branch:** `claude/fix-blog-analytics`
> **Last updated:** 2026-05-12

## Why this matters
The Blog Manager shows 91 published posts with 0 total views — across every post. That's clearly tracking failure, not zero readership. Without analytics we can't tell what content is working, which topics to double down on, or whether SEO investment is paying off. This is foundational measurement, four hours of work.

## The problem (evidence)
- `/dashboard/blog` lists 91 posts; the views column is uniformly 0.
- No GA4 event fires from `/insights/[slug]` pages.
- No `Blog_Views` sheet or equivalent persistent counter.

## Scope
**In scope:**
- Fire a `blog_view` GA4 event on every `/insights/[slug]` page load with `{ post_slug, post_title }`.
- Read view counts back from GA4 Data API, OR write to a `Blog_Views` sheet per pageview (rate-limit aware) — pick one based on what GA4 access we already have.
- Surface view counts on `/dashboard/blog` post list.
- Cache the GA4 query (15 min) so we don't hammer the API.

**Out of scope:**
- Granular event tracking (scroll depth, reading time) — separate ticket.
- Per-post conversion attribution.

## Files to touch
- `app/insights/[slug]/page.tsx` (fire event)
- `app/components/analytics/blog-view-tracker.tsx` (new — client component that calls `gtag`)
- `app/lib/analytics/ga4-client.ts` (new — GA4 Data API wrapper, if route A)
- `app/api/blog/views/route.ts` (new — receives counts if route B)
- `app/(dashboard)/dashboard/blog/page.tsx` (display counts)
- `.env.example` (`GA4_PROPERTY_ID`, service-account credentials, if route A)

## The fix (step by step)
1. Confirm GA4 property is already wired on the public site (look for `gtag` init). If not, set up GA4 first.
2. Add `<BlogViewTracker postSlug postTitle />` to `/insights/[slug]/page.tsx` — a client component that fires `gtag('event', 'blog_view', { post_slug, post_title })` on mount.
3. **Decide route A vs B with Joshua.** Default to A (GA4 Data API) — it doesn't burn sheet write quota.
4. **Route A:** create `ga4-client.ts` with `runReport({ dimensions: ['eventName','customEvent:post_slug'], metrics: ['eventCount'] })`. Cache 15 min in memory + Netlify Blobs.
5. **Route B:** create `/api/blog/views` POST endpoint that appends to `Blog_Views` with throttling.
6. Display counts on `/dashboard/blog` list.
7. Deploy to staging, hit five test posts, confirm GA4 receives events.

## Acceptance criteria
- [ ] Every `/insights/[slug]` page fires `blog_view` to GA4.
- [ ] `/dashboard/blog` shows non-zero view counts within 24 hrs of deploy.
- [ ] GA4 Data API calls (or sheet writes) are rate-limit safe.
- [ ] Counts refresh on a 15-min cache cadence.

## Verification
```bash
# in browser devtools on /insights/<slug>:
window.dataLayer.filter(e => e[0] === 'event' && e[1] === 'blog_view')
```
Expected: array contains an entry with the current `post_slug`.

## Dependencies
**Requires:** GA4 property ID and (if route A) service account credentials with Data API access.
**Blocks:** none.

## Notes
See `AGENTS.md` for any pre-existing GA4 setup. If `gtag` isn't yet on the public site, this ticket grows by an hour to add it.
