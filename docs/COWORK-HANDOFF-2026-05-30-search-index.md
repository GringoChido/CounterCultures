# Cowork Handoff — Fix #2: Storefront Search Performance

**Date:** 2026-05-30
**From:** Cowork session that ran the optimizePackageImports / Suspense / React.cache / keepalive-audit pass
**To:** A fresh Cowork session whose ONLY job is to produce the surgical bulletproof prompt(s) for Claude Code to fix storefront search performance
**Status of repo:** 10 commits ahead of `origin/main`, working tree clean except 3 intentionally-skipped files (the two macOS Finder duplicates and the staging-noindex `public/robots.txt`)

---

## Why this exists

Storefront search is the single biggest customer-facing performance problem in this codebase, and it is showing up as a *correctness* failure, not just a slowness complaint. When the linear scan over 354,449 products can't finish in time, the customer sees:

> *"Your search is too broad. Try adding a brand or model number."*

That message is not a search-quality problem. It is a performance failure being **rendered as a UX message**. Roger has flagged search issues repeatedly (`docs/SEARCH-AUDIT-2026-05-11.md`, `docs/Roger-search-update-2026-05-28.md`, multiple `docs/fixes/p0-storefront-search-*.md` specs).

The site also feels slow on cold-start because the same 354k snapshot has to hydrate before the first hit returns. The fix for search and the fix for cold-start hydration are tightly related — both root-cause in the data layer in `app/lib/products-full.ts`.

This handoff exists because **Fix #2 is the only fix in the perf-audit punch list that is not a one-prompt fix.** It is a multi-day engineering project that needs its own planning loop and its own rollout. The previous Cowork session shipped the four small fixes (1, 3, 4, 5) and is handing this one off cleanly.

---

## What you (the new Cowork session) are being asked to produce

You produce **two prompts** that the user pastes into fresh Claude Code sessions. You do not write any code yourself. Your output is text the user pastes.

**Prompt A — Read-only audit + design (no writes).**
Pasted first. Reads the diagnosis below, measures the actual current search, designs the indexed approach, and returns a report. **Does not write code.** The user reviews the report and approves the direction before Prompt B is built.

**Prompt B — Build the indexed search path (additive only).**
Pasted after Prompt A's report is reviewed and approved. Writes a NEW file alongside the existing search path, behind a feature flag, with the old path untouched. The user can flip the flag in 30 seconds if anything goes wrong.

If the design discovered in Prompt A reveals a different shape of solution, Prompt B may need to be revised — that is fine. The point is you do not commit to Prompt B's exact wording until Prompt A's findings are in.

---

## The diagnosis (already verified — do not re-discover)

### Data layer

- 354,449 products are loaded from a 5.6 MB compressed snapshot at `app/lib/generated/products-snapshot.json.gz`
- Snapshot is read at module init (cold start) in `app/lib/products-full.ts:215-251` (`loadFromSnapshot`) and built into an in-memory cache via `buildCacheFromProducts` in `app/lib/products-mapping.ts`
- Cache TTL: 30 min (`TTL_MS = 30 * 60 * 1000` at `app/lib/products-full.ts:48`)
- Stale-while-revalidate is already implemented (`getCache` at `app/lib/products-full.ts:292-308`)
- Cold-start hydration: their own comment at line 264 says "~2.5s"; observed real-world keepalive duration after deploy: 13,930 ms (Netlify, 2026-05-30 13:12 CST, 122 MB)

### The search function

- Source: `app/lib/products-full.ts:385-496` — `searchProducts(opts: SearchOptions)`
- Algorithm: linear scan over the full product pool, calling `scoreProduct(query, p)` from `app/lib/search-utils.ts` on each one, keeping the non-zero scores
- Scan budget: `DEFAULT_SCAN_BUDGET_MS = 4000` at line 383
- Mid-scan budget check at line 419: `if (++iter % 5000 === 0 && Date.now() - scanStart > DEFAULT_SCAN_BUDGET_MS) { partial = true; break; }`
- Partial result is reported back to the caller — the API route surfaces it as a timeout to the user

### The API route

- Source: `app/api/products/search/route.ts`
- Outer timeout: 6 seconds (`raceTimeout(... , 6000, TIMEOUT_SENTINEL)` at line 84)
- Both the inner-partial flag and the outer timeout map to the same user-facing response: `{ timedOut: true, error: "search_timeout", message: TIMEOUT_MESSAGE }` (lines 100-112)
- `TIMEOUT_MESSAGE` (lines 33-36) is the bilingual "your search is too broad" text the user sees

### The scoring function

- `scoreProduct(query, p)` in `app/lib/search-utils.ts`
- Weighting order documented at `products-full.ts:378`: `sku/skuParts(6/5) > name(4) > brand(3) > cat/finishes(2) > desc(1)`
- AND semantics across query tokens
- SKU-prefix and SKU-contains matching is the strength — Counter Cultures' SKUs are first-class search keys for trade customers
- The team explicitly chose NOT to use Fuse.js (comment at `products-full.ts:11-15`): "SKU-heavy architectural hardware searches need exact substring matching, not fuzzy"

### Search consumers (all read the same `/api/products/search` route)

- `app/components/search/search-palette.tsx` — the global Cmd-K search palette (debounced 250ms, 6 results)
- `app/[locale]/shop/catalog/` — the public catalog page
- `app/[locale]/shop/[category]/` and `[subcategory]/` — category browse pages
- `app/(dashboard)/dashboard/(portal)/products/catalog-search.tsx` — internal product search (out of scope for this fix; do NOT touch)
- The MiniSearch client-side index (`app/lib/search-index.ts` + the `/api/search-index` route) handles brands + articles only (~163 docs). That code is fine and out of scope.

### Past attempts already in the tree

These exist as `docs/fixes/` specs. Read them — they document failure modes and prior fixes that should not be regressed:

- `docs/fixes/p0-search-containment-and-diagnostics.md`
- `docs/fixes/p0-storefront-search-502-and-timeout.md`
- `docs/fixes/p0-storefront-search-edge-runtime-fix.md`
- `docs/fixes/p0-storefront-search-product-model-fix.md`
- `docs/fixes/p1-storefront-search-results-presentation.md`
- `docs/SEARCH-AUDIT-2026-05-11.md`
- `docs/SEARCH-FIXES-IMPLEMENTATION.md`
- `docs/Roger-search-update-2026-05-28.md`

---

## The two viable approaches

Both options keep the existing snapshot file and the existing API response shape. The diagnosis prompt should measure both, but the recommendation is already strongly toward A.

### Option A — In-process inverted index (RECOMMENDED)

**Idea:** Build an inverted index at module init from the snapshot, in the same Lambda. Keys are normalized tokens (SKU parts, name tokens, brand). Values are sets of product indices. A query becomes:

1. Tokenize the query (reuse `normalize` from `search-utils.ts`)
2. Look up each token's set
3. Intersect (AND semantics, matching the current behavior)
4. Score only the survivors using the existing `scoreProduct`
5. Sort and slice as today

Search complexity drops from O(354k) to O(matches), which for typical queries is <500 products. Sub-50 ms p95.

**Why this fits Counter Cultures:**
- Reuses the existing scoring function — preserves SKU-prefix correctness
- No new infrastructure, no new service, no new ops surface
- The snapshot is already loaded into memory; the index is a derived view of it (~10-30 MB more)
- Same data lifecycle (30-min TTL, stale-while-revalidate already works)
- Ships in days, not weeks

**Trade-offs:**
- Extra memory (~10-30 MB for the index)
- Index-build time at cold start (~500ms - 2s for 354k products, parallelizable)
- Tokenization decisions need to match the scorer (or queries miss matches the linear scan would catch)

### Option B — External search service (Meilisearch / Typesense)

**Idea:** Run a sidecar service. Sync from the snapshot. Search becomes an HTTP call.

**Trade-offs:**
- Adds a service to deploy, monitor, secure, and pay for
- Adds a network dependency to a critical user path
- Typically 2-3 week project including infra setup, sync pipeline, and rollout
- Wins (typo tolerance, faceting) are not the user's current pain — their current pain is "search times out"

**Recommendation:** Park Option B as a future consideration. Ship Option A first.

---

## Hard constraints (the surgical line — do not cross)

1. **The existing `searchProducts` function must remain untouched in the rollout PR.** The new path is additive. The flag picks between them.
2. **The API response shape (`SearchResult` interface) must not change.** Every consumer of `/api/products/search` reads the same fields they read today.
3. **Feature flag required.** Env var `PRODUCT_SEARCH_BACKEND` with values `"legacy"` (default) and `"indexed"`. Read in the API route. Flip in Netlify env vars in <30s.
4. **The dashboard search (`app/api/dashboard/products/search`) is out of scope.** Do not touch it. Internal users are not the priority.
5. **Sacred Surface #7 and #8 (storefront search + catalog) are in effect.** Read `docs/SURGICAL-RULES.md` before designing.
6. **The snapshot file is not modified.** The index builds FROM the snapshot at runtime.
7. **No new external dependencies without approval.** No `flexsearch`, `lunr`, `meilisearch-js`, `typesense-js`, `algoliasearch`, etc. — pure TypeScript in-process is the target. If a tiny utility library is unavoidable, name it and ask before adding.
8. **The middleware auth gate, the API route auth, and the cache-control headers are unchanged.**
9. **Staging-first rollout.** Production (countercultures.com.mx) is on Squarespace and not affected. Staging (countercultures.netlify.app) is where this lives. Aggressive iteration is fine here, but the flag must default to `"legacy"` until the indexed path is proven on staging.
10. **The "search too broad" error message is the success metric.** When the indexed path is on, that message should never appear for any reasonable query.

---

## The phased plan

### Phase 1 — Audit + design (Prompt A)

Read-only. Output: a written report.

Required measurements:
- For 20 representative queries (mix of: short SKU prefixes like "MB", "US10B"; brand names like "kohler", "brizo"; Spanish search terms like "tina", "lavabo"; long descriptive phrases), record current p50/p95/p99 latency end-to-end
- Memory footprint of the proposed index (estimate or measure on snapshot subset)
- The exact tokenization strategy and how it maps to the existing `scoreProduct`
- The fallback chain when an index lookup returns zero matches that the linear scan would catch
- A correctness test plan: for the same 20 queries, the indexed path must return the same top-10 (or strictly better) as the linear path

Required design artifacts:
- The index data structure (TypeScript types)
- Where the index lives (`app/lib/products-search-index.ts` or similar — new file)
- How it's built (module-init? lazy on first query? in parallel with cache hydration?)
- How it stays in sync with cache refresh (rebuild on `getCache` swap)
- How it's flag-gated in the API route
- Estimated lines of new code and files touched

**Prompt A must not write any code.** Its output is the report. The user approves the direction before Prompt B is written.

### Phase 2 — Build (Prompt B)

Writes the new path. Additive only. The shape:

- New file: `app/lib/products-search-indexed.ts` containing:
  - The index types
  - The index build function (called from `loadFromSnapshot` / `buildCacheFromProducts`)
  - The `searchProductsIndexed` function with the same signature as `searchProducts`
- Minimal edit to `app/lib/products-full.ts` to:
  - Call the index build inside `buildCacheFromProducts` and attach to the cache
  - Export the new function alongside the old
- Minimal edit to `app/api/products/search/route.ts` to:
  - Read `process.env.PRODUCT_SEARCH_BACKEND`
  - Pick `searchProducts` or `searchProductsIndexed` based on the flag
  - All other logic (auth, timeouts, response shape) unchanged

Prompt B must include:
- A read-first list (SURGICAL-RULES, the diagnosis section of this handoff, the files in the diagnosis above)
- An explicit "do not modify these files" list
- A diff-first protocol: the agent produces the diff and asks for approval before writing
- A self-test plan (run a query against both paths and compare top-10 result sets)
- A rollback note: if anything looks off, the flag can revert in <30s

### Phase 3 — Staging rollout

Flag flipped to `"indexed"` in Netlify env vars (staging context only initially). Real customer queries logged from both paths (sample, not all) for a few days. Comparison shows parity or improvement on result quality.

### Phase 4 — Cutover

Default flag flipped to `"indexed"`. Legacy stays callable for 2 weeks via the flag.

### Phase 5 — Cleanup

After 2 weeks of `"indexed"` stable, the legacy path is removed in a separate PR.

---

## Success criteria

A query is considered "successful" if all of:
- Returns results in under 200 ms (p95) for typical 1-3 keyword queries
- Returns results in under 500 ms (p99) for any reasonable query
- Returns the same top-10 results as the legacy path (or strictly better — never worse)
- Never triggers the "your search is too broad" message
- SKU exact-match queries return the exact product as the #1 result

A rollout is considered "safe" if all of:
- Legacy path is untouched in the rollout PR
- Flag toggle reverts in <30s
- Dashboard search unaffected
- Catalog browse pages unaffected
- No new dependencies added without approval
- API response shape unchanged

---

## How to start

1. Read `docs/SURGICAL-RULES.md` first. Identify Sacred Surface #7 and #8 specifically.
2. Read this handoff doc end to end.
3. Open the files listed in the diagnosis. Skim, do not modify.
4. Skim the past `docs/fixes/p0-storefront-search-*` and `docs/SEARCH-*` files — these document failure modes you must not regress.
5. Produce Prompt A. Show it to the user.
6. Wait for the user to run Prompt A in Claude Code, paste the report back, and approve the direction.
7. Produce Prompt B based on what the report found. Show it to the user.
8. Wait for the user to run Prompt B, paste back the diff, and approve.
9. The user handles staging cutover and the post-rollout monitoring outside Cowork.

---

## What is explicitly out of scope for the new Cowork task

- The dashboard product search (internal users)
- The MiniSearch brands+articles index (`app/lib/search-index.ts`) — that part works
- The catalog grid layout, PDP page, cart, checkout, Stripe, Odoo sync, finance, staff portal — anything not in the diagnosis files
- Changing the snapshot file
- Adding external search services
- Touching the middleware
- Modifying the search palette UI (it's a consumer — if the API shape holds, it doesn't change)
- Production (Squarespace) — this is a staging-only change

---

## Companion fixes already shipped (for context only — not your scope)

These were committed locally this session (`origin/main` ahead by 10 as of 2026-05-30 13:15 CST, not yet pushed):

- `d6cabcd` — perf: `optimizePackageImports` for lucide-react, framer-motion, recharts, date-fns, dnd-kit, tanstack-table, sonner
- `01a5cbe` — perf: stream homepage featured-brands behind `<Suspense>`
- `552db15` — perf: wrap `getProductById` / `getProductBySlug` / `getRelatedProducts` in `React.cache()`
- Plus 7 docs/chore commits triaging the uncommitted work that had accumulated on main

These improve PDP and homepage load. They do NOT touch search.

The `keepalive` cron was verified in Netlify: scheduled `*/3 * * * *`, running in production, `CRON_PROBE_KEY` env var set across all scopes and contexts, last execution 13,930 ms (cold-Lambda warm-up — expected after a deploy). No code change was needed.

---

## A note on tone

This is a staging environment. The change carries less risk than it would in a live production cutover. But Roger has already lived through multiple "search broke" cycles documented in `docs/Roger-search-update-2026-05-28.md` and the various `p0-storefront-search-*` fix files. The bar is: when this ships, search just works — quietly, fast, and indistinguishable from a system Roger doesn't have to think about.

Surgical. Bulletproof. Side-by-side rollout. Flag-gated. Boring.

That's the assignment.
