# Search Subsystem Audit — Counter Cultures

Date: 2026-05-11
Author: Claude (Cowork)
Scope: Every search/typeahead/filter surface in the Next.js app
Severity legend: P0 = silent data corruption / dead surface · P1 = wrong results · P2 = slow / fragile · P3 = polish

---

## 1. Surface inventory (what "search" actually is, today)

| # | Surface | Source file | Backing endpoint(s) | Mechanism |
|---|---|---|---|---|
| 1 | Public ⌘K palette (header search) | `app/components/search/search-palette.tsx` | `/api/search-index` (brands+articles) + `/api/products/search` | MiniSearch in-browser + per-keystroke fetch |
| 2 | Public shop hero search | `app/[locale]/shop/hero-search.tsx` | none (router.push) | Form submit → `/shop/catalog?q=` |
| 3 | Public catalog filter UI | `app/[locale]/shop/catalog/catalog-view.tsx` | `/api/products/search` | Debounced fetch, URL-synced filters |
| 4 | Public visual search | `app/components/visual-search-modal.tsx` | `/api/products/visual-search` | Image upload → attribute extraction |
| 5 | Dashboard ⌘K palette | `app/(dashboard)/components/command-palette.tsx` → `app/lib/search.ts` | `/api/dashboard/leads`, `/pipeline`, `/traficos`, `/shipments`, `/brands`, `/dashboard/products?q=` | Fan-out fetch + in-memory scoring |
| 6 | Dashboard product picker (deal slideout) | `app/(dashboard)/components/product-picker.tsx` | `/api/dashboard/products/search` | Debounced fetch |
| 7 | Dashboard catalog page | `app/(dashboard)/dashboard/(portal)/products/catalog-search.tsx` | `/api/dashboard/products/search` | Debounced fetch with `reqIdRef` |
| 8 | Customer combobox | `app/(dashboard)/components/customer-combobox.tsx` | `/api/dashboard/customers?q=` | Debounced fetch (no req-id guard) |
| 9 | SAT-code combobox | `app/(dashboard)/components/sat-code-combobox.tsx` | `searchSATCodes()` in-memory | Naive substring filter |
| 10 | Drive toolbar | `app/(dashboard)/components/drive/toolbar.tsx` | client filter on already-loaded list | substring `.includes()` |
| 11 | Quote catalog | `/api/quote-search` | `searchQuoteCatalog()` | Same pool as #6/#7, third copy |

There are **three** different code paths over the same 354k-row Odoo catalog (`/api/products/search`, `/api/dashboard/products/search`, `/api/quote-search`), **two** different ⌘K palettes (public + dashboard) using **two** different scoring engines, and **one** browser-side index that explicitly excludes products. That sprawl is the meta-cause; the rest of the report is the catalog of specific failures it produces.

---

## 2. Root causes by severity

### P0 — Surfaces that look broken to the user

**P0-1. Dashboard ⌘K silently swallows every backend error.**
`app/lib/search.ts` wraps each per-entity fetch in `try { ... } catch { return [] }` and `cachedFetch` throws on `!res.ok`. A 500 from the Sheets API, a network blip, an auth expiry — all surface as "No results for X". The user has no idea search is actually broken, just keeps typing.
*File:* `app/lib/search.ts:114-134, 146-170, 180-210, 221-251, 262-288, 332-357`
*Permanent fix:* Return `{ results, errors }` from `searchAllEntities`. Render an inline "Search partially unavailable: leads, deals" banner in the palette when `errors.length > 0`. Send to your error tracker (you already have `console.error` everywhere — wire it to Sentry/LogRocket).

**P0-2. Live cmd-K product results only see the curated `Products` sheet, not the 354k Odoo catalog.**
`searchProducts()` in `app/lib/search.ts:332-357` calls `/api/dashboard/products?q=...` (the curated CRUD route at `app/api/dashboard/products/route.ts`), not `/api/dashboard/products/search` (the full-catalog route). It then maps the response as if it were Odoo data. Net effect: the dashboard cmd-K palette finds maybe 200 products out of 354,000.
*Permanent fix:* Change line 334 to `` `/api/dashboard/products/search?q=${encodeURIComponent(q)}&limit=8` `` and rewrite `productRowToData()` to consume `ProductFull` (the actual response shape) instead of the curated `ProductRecord` shape. This is a one-line endpoint change plus a 30-line type re-mapping.

**P0-3. Product hits in the public ⌘K palette always outrank brands/articles regardless of relevance.**
`search-palette.tsx:195-206` merges product hits into `allResults` with `score: 0`, but `app/lib/search.ts:350` hard-codes `score: 100` on the dashboard side. In the public palette the merge is in array-order (products listed first → always shown first); in the dashboard palette, products always beat MiniSearch's relevance-tuned scores. Type `kohler` on the public site and the first 6 results are products that *contain* "kohler" somewhere; the actual Kohler brand page is below the fold.
*Permanent fix:* Score products with the same MiniSearch-style relevance the brand/article docs use. Server returns `score` per hit (already computed in `scoreRow`), client respects it. Then sort all groups together by normalized score, with a per-type display cap of e.g. 5.

**P0-4. The public catalog `inStockOnly` toggle does not survive a refresh and does not reset pagination.**
`catalog-view.tsx:225` URL-sync deps array is `[query, brand, category, sortKey, viewMode, offset, router, pathname]` — `inStockOnly` is missing. Same for the offset-reset deps at line 230. Toggle "in stock", land on a brand × stock combination with 8 products while `offset=120` still in state → empty results page, "no products match" displayed for what is actually a populated filter.
*Permanent fix:* Add `inStockOnly` to both deps arrays. Add a unit test that snapshots URL after each filter mutation.

**P0-5. Public catalog has no race-condition guard.**
`catalog-view.tsx:234-257` has no `reqIdRef` equivalent (compare to `catalog-search.tsx:198-228` which does). Fast typing or rapid filter clicks render whichever response lands last, not whichever is most recent. With 354k-row Sheet reads averaging 200ms and occasionally spiking to 2s, this is observable on every fast typer.
*Permanent fix:* Copy the `reqIdRef` pattern from the dashboard catalog. Better: extract a `useDebouncedFetch(url, 180)` hook that does this once and use it in all five surfaces (#1, #3, #6, #7, #8) — they have nearly-identical bug-prone re-implementations.

**P0-6. Catalog API silently returns nothing on non-401 errors.**
`catalog-view.tsx:246-253` only handles `401 → needsAccess`; on any other non-OK response it `return`s without setting state, leaving the spinner spinning forever. When the Google Sheets API throws a 503 (which the route forwards as 500), the user sees an infinite loader.
*Permanent fix:* Track `error` state and render an inline error band with a retry button. Stop relying on `console.error` being the only signal.

---

### P1 — Wrong / misleading results

**P1-1. Score function never tokenizes multi-word queries.**
`app/lib/search.ts:72-85` and `products-full.ts:391-399` both treat the entire query as one substring. "matte black brizo" → 0 score against "Brizo Rook in Matte Black" because no contiguous substring matches. Architects search this way constantly.
*Fix:* Tokenize on whitespace. Score each token independently per field; require ≥1 token match per field for a contribution; sum; multiply by `(matched_tokens / total_tokens)` so all-tokens-match outranks one-token-match.

**P1-2. No diacritic / accent normalization.**
"baño" vs "bano", "Pelícano" vs "Pelicano", "ñoño" vs "nono" — none match. Critical in a bilingual catalog and customer database. SAT codes (`sat-codes.ts:99-105`), customer search, product search all affected.
*Fix:* Normalize both query and indexed strings via `s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase()` at insert and query time. One-line helper, add to `app/lib/search-utils.ts`.

**P1-3. MiniSearch config is internally contradictory.**
`search-palette.tsx:84-89` sets `fuzzy: 0.2, prefix: true, combineWith: "AND"`. With 0.2 fuzziness, "matte" matches "metal" and "patio". With AND combiner, multi-word queries miss legitimate hits. With prefix on, "tap" matches "tape", "tapir", "tapestry". The three options chained together produce both false positives AND false negatives.
*Fix:* `fuzzy: 0.15, prefix: true, combineWith: "AND"` is acceptable for SHORT brand names but for body content you want `OR` with token-coverage scoring. Best: drop the AND, switch to a custom `searchFn` that scores per-token then sums.

**P1-4. Boost weights double-count for monolingual brand docs.**
Most brand docs have `nameEn === nameEs`. With `boost: { nameEn: 4, nameEs: 4 }` an English-only-named brand scores 8x while a properly bilingual brand scores 4x+4x=8x — same. Effectively no boost differentiation between bilingual and monolingual content. Articles get 1x because their bodies are different per locale.
*Fix:* Pick the boost based on the requested locale at query time: `searchOptions.boost = isEs ? { nameEs: 4, subtitleEs: 2 } : { nameEn: 4, subtitleEn: 2 }`.

**P1-5. `scoreRow()` in `products-full.ts` returns at the first matching tier.**
A product whose SKU starts with `Q` returns 80 even if its brand is the user's query and its name is exact-match. The function should sum tier contributions, not short-circuit. As-is, ranking is order-of-conditions in the function body.
*Fix:* Compute all five contributions, sum, return.

**P1-6. Per-keystroke product cache key never expires.**
`cachedFetch` at `app/lib/search.ts:54-66` is keyed `products:${q}`. Every keystroke creates a new cache entry. After 30 minutes of palette use the in-memory cache balloons to thousands of entries. Module-scope, so it survives navigations but doesn't deduplicate across tabs.
*Fix:* LRU cap (e.g. 50 entries), TTL eviction sweep on insert. Or — better — drop the per-query cache entirely; debounce already protects the server, the cache only protects against re-typing the exact same string.

**P1-7. Cache key collisions across queries with the same first arg.**
`cachedFetch("leads", "/api/dashboard/leads")` always returns the same payload regardless of any future filters added to the leads endpoint. If anyone ever adds `?status=open` it'll be silently ignored for 60s.
*Fix:* Key on the URL, not a static string. Trivial.

**P1-8. Cmd-K palette `flatList` and `selectedIndex` desync.**
`command-palette.tsx:236-245` recomputes `flatList` from `recent + pageItems` when query is empty and from `grouped` otherwise. `selectedIndex` resets on query change but not on result-set change. Hover row 8 → type a letter → result set shrinks to 3 → Enter does nothing because `flatList[8]` is undefined.
*Fix:* Clamp `selectedIndex` against `flatList.length - 1` whenever the list changes.

**P1-9. Customer combobox loses race-condition battle on fast typers.**
`customer-combobox.tsx:44-66` has 200ms debounce but no req-id guard. The last-completing fetch wins, which is usually but not always the most recent. Roger types "Constructora" then deletes "tora" → you can land on results for "Construc" with a stale in-flight from "Constructora" arriving after.
*Fix:* Add the same `reqIdRef` pattern from dashboard catalog. Or — better — extract a shared `useDebouncedFetch` hook and use it everywhere (5 components currently re-implementing this).

**P1-10. Three divergent product-search APIs return different results for the same query.**
`/api/products/search` (public) defaults `limit=60`, signals via `raceTimeout(2000ms)` fallback to empty, no `activeOnly`/`saleOnly` filters exposed.
`/api/dashboard/products/search` defaults `limit=100`, signals always-on (no timeout), exposes `activeOnly`/`saleOnly`/`facets`.
`/api/quote-search` forces `saleOnly: true`, defaults `limit=48`.
The palette uses #1, the dashboard uses #2, the quote builder uses #3. Same query → three different result sets, three different orderings (because spec-score signal availability differs).
*Fix:* Single endpoint `/api/products/search` with explicit query params for `audience` (`public` | `dashboard` | `quote`) that pre-applies the right defaults server-side. Delete the duplicate routes.

**P1-11. SAT-code search matches on raw substring of digit sequences.**
`sat-codes.ts:99-105`: `c.code.includes(q) || c.description.toLowerCase().includes(q)`. Type "30" → returns 30+ codes whose code starts with 30 or 31, plus any whose description has the digit "30". Useless.
*Fix:* Tier the score: exact code match > code prefix > description-token starts-with > description-substring. Same shape as the global score function.

---

### P2 — Slow / fragile

**P2-1. Cold cmd-K fan-out fetches whole tables for every entity.**
None of `/api/dashboard/leads`, `/pipeline`, `/traficos`, `/shipments`, `/brands` accept `?q=`. The palette pulls full tables (potentially hundreds of MB combined for established CRM data) and filters in browser memory. First keystroke = 6 parallel sheet reads.
*Permanent fix:* Add `?q=&limit=N` to each of those endpoints (server-side filter against the same fields the client-side score function uses). Cache responses for 60s. The palette then hits a single combined `/api/dashboard/search?q=` that fans out server-side and returns ranked top-N.

**P2-2. `app/api/dashboard/products/route.ts` reads three sheets per call.**
`Products`, `Products_Odoo`, `Products_Quote` concatenated and substring-filtered in memory on every request. With `cachedFetch` keyed `products:${q}` it triggers per-keystroke. Sheets API quota burn waiting to happen.
*Fix:* Either deprecate this route in favor of `/api/dashboard/products/search` (which uses the cached `products-full.ts` reader with 30-min TTL), or add the same caching shape used by `products-full.ts`.

**P2-3. Search index over-cached AND ISR-revalidated AND HTTP-cached.**
`app/api/search-index/route.ts` sets `export const revalidate = 300` AND `cache-control: max-age=300, s-maxage=300, stale-while-revalidate=600`. Three competing TTL layers (Next ISR, browser HTTP cache, CDN s-maxage). Reports of "I updated a brand and it took an hour to surface" are explained by the layered cache stampede.
*Fix:* Pick one layer. Recommended: `revalidate = 60` server-side, `cache-control: no-cache` to the browser. Add a manual purge endpoint to bust ISR after Brand Kit edits (you already revalidate other paths from the editor — extend the same hook).

**P2-4. SearchPalette never refetches the index after first mount.**
Once `hasFetched = true`, the in-memory MiniSearch instance is frozen for the life of the page. A user who keeps a tab open all day searches against morning's data.
*Fix:* Re-fetch in the background every 5 minutes when the palette is open, or on `visibilitychange` from hidden→visible.

**P2-5. SearchPalette `fetch` failures silently set `loading=false`.**
`search-palette.tsx:108-121`: catch logs, finally clears loading, but `hasFetched` stays false. So next open re-fires the failing request. There's no error UI; the palette just looks empty forever.
*Fix:* Track `indexError` state, render an inline error with retry. Set `hasFetched` to true on first failure with a 30s backoff before retry.

**P2-6. Public catalog three competing useEffects.**
`catalog-view.tsx:214` (URL-sync), `:228` (offset reset), `:234` (fetch). All three run on every filter change. Every keystroke schedules a debounced fetch + a router.replace + a setOffset. Even when the network is fast, the URL flickers and React re-renders 3-4 times per keystroke.
*Fix:* Collapse to one `useEffect([allFilters])` that does both URL sync and fetch. Move offset reset into the setter (`setBrand(b) { setBrand(b); setOffset(0) }`).

---

### P3 — Polish / coverage gaps

**P3-1. Dashboard cmd-K only covers 6 entity types.**
Missing from the palette: invoices, payments, customers, vendors, purchase orders, AR requests, shipments-by-tracking-number, notes. Roger probably reaches for cmd-K to find an invoice number and finds nothing. `/api/dashboard/customers?q=` already exists; wire it in.

**P3-2. Hero search and shop catalog don't share a synonym layer.**
ES "lavabo" ↔ EN "sink", ES "regadera" ↔ EN "shower", ES "llave" ↔ EN "faucet". Hardcoded vocabulary divergence. Add a synonym table in `app/lib/search-synonyms.ts` and apply at query expansion time on the server.

**P3-3. Drive search filters only the already-loaded list.**
`drive/toolbar.tsx` is just an `<input>`; the actual filtering is done by parent components against whatever subset of files Drive's API returned. Search "invoice" and you'll only find files in the currently-loaded folder. Move to a server-side Drive query (`q=name contains 'invoice'`).

**P3-4. Visual search has no error retry, no fallback ranking.**
`visual-search-modal.tsx:116-144`: a single-shot fetch with no retry; if the model misclassifies, the user has to re-upload. Add `Try as different category` chips that re-search with explicit overrides.

**P3-5. No telemetry on what users search for.**
Zero queries logged. We can't measure zero-result rate, can't see emerging vocabulary, can't validate the "kohler tap" failure case I described above. Wire all six surfaces through `app/lib/track.ts` (or whatever you have) with `event: "search", surface, query, resultCount, locale`.

**P3-6. No keyboard support in customer combobox.**
Arrow keys don't move the selection; Enter doesn't pick the highlighted row. Compare to dashboard cmd-K (`command-palette.tsx:294-311`) which has full keyboard nav. Reuse that handler.

**P3-7. Empty-state copy is inconsistent.**
"No results", "No matches", "No products match these filters", "No catalog matches", "Sin coincidencias", "Keep typing — minimum 2 characters", "Type at least 3 characters". Each component invents its own copy. Centralize in a `SEARCH_COPY` const.

---

## 3. Permanent fix plan (phased)

### Phase 1 — Stop the bleeding (1-2 days)

1. **Fix P0-2** — change one URL in `app/lib/search.ts:334` and the response mapper. Restores 354k-product coverage in dashboard cmd-K. This alone resolves the most common "search is broken" complaint.
2. **Fix P0-4** — add `inStockOnly` to two deps arrays in `catalog-view.tsx`. 30-second fix.
3. **Fix P0-5** — copy `reqIdRef` pattern into `catalog-view.tsx`. Prevents stale-result rendering.
4. **Fix P0-6** — add `error` state and inline retry to `catalog-view.tsx`. Stops the infinite-spinner failure mode.
5. **Fix P0-1** — change `searchAllEntities` return shape to surface per-entity errors. Render them in the palette.

### Phase 2 — Make results correct (3-5 days)

6. **Build `app/lib/search-utils.ts`** — single normalize function (lowercase + NFKD strip diacritics + collapse whitespace), single tokenize function, single tier-scoring function. Adopt across all surfaces. Resolves P1-1, P1-2, P1-5, P1-11.
7. **Locale-aware boosts** in MiniSearch config (P1-4) and a synonym layer (P3-2) in `search-utils.ts`.
8. **Fix `cachedFetch`** — key on URL, LRU cap 50, evict on TTL (P1-6, P1-7).
9. **Fix `selectedIndex` clamp** (P1-8) — one line in `command-palette.tsx`.
10. **Extract `useDebouncedFetch(url, ms)` hook** that bakes in `reqIdRef` + `AbortController`. Adopt in customer-combobox (P1-9) and the other four sites currently re-implementing it.
11. **Score products consistently with brand/article hits** (P0-3) — server returns numeric score, client respects it across all sources, sort all groups together with a per-type cap.

### Phase 3 — Consolidate the architecture (1-2 weeks)

12. **Single product search API** (P1-10) — pick `/api/products/search`, add an `audience` param, delete the other two routes. Update three callers.
13. **Server-side fan-out for dashboard cmd-K** (P2-1) — new `/api/dashboard/search?q=` endpoint that delegates to per-entity searchers (each accepts `?q=`). Each per-entity endpoint gains a `q` param + `limit`. Removes 6 parallel full-table fetches.
14. **Deprecate `/api/dashboard/products` substring-filter path** (P2-2) — point everything to `/api/dashboard/products/search` with its 30-minute TTL cache.
15. **Single cache layer for `/api/search-index`** (P2-3) — drop ISR, keep HTTP cache, wire a manual revalidate from Brand Kit editor.
16. **Coalesce catalog-view useEffects** (P2-6) — one effect, one router.replace per filter change.

### Phase 4 — Coverage + observability (ongoing)

17. **Add telemetry** (P3-5) — `event: "search"` on every surface. Build a "zero-result queries" weekly report.
18. **Extend cmd-K coverage** (P3-1) — add invoices, payments, customers, vendors, purchase orders.
19. **Drive server-side search** (P3-3).
20. **Centralize empty-state copy** (P3-7).

---

## 4. Quick reference — which file fixes which symptom

| Symptom user reports | Root-cause file:line |
|---|---|
| "Cmd-K finds 5 products when there are thousands" | `app/lib/search.ts:334` (P0-2) |
| "I searched 'matte black brizo' and got nothing" | `app/lib/search.ts:72`, `products-full.ts:391` (P1-1) |
| "Cmd-K shows products instead of the brand I typed" | `app/lib/search.ts:350`, `search-palette.tsx:204` (P0-3) |
| "I refreshed the catalog page and lost my in-stock filter" | `catalog-view.tsx:225` (P0-4) |
| "Search results jump around as I type" | `catalog-view.tsx:234` (P0-5) — no req-id guard |
| "Search palette spinner never stops when there's an error" | `catalog-view.tsx:246`, `search-palette.tsx:108` (P0-6, P2-5) |
| "Search palette gave me NO results for what I know exists" | `app/lib/search.ts:131,168,...` swallowed errors (P0-1) |
| "Spanish queries miss accented matches" | every score function (P1-2) |
| "First keystroke into cmd-K takes 3 seconds" | `app/lib/search.ts:114-251` whole-table fan-out (P2-1) |
| "Brand Kit edits don't show up in search for an hour" | `app/api/search-index/route.ts:12,19` triple cache (P2-3) |

---

## 5. Where to start

If you only do one thing this week: **Phase 1, item 1** (P0-2 — five lines in `app/lib/search.ts`). It restores dashboard cmd-K product coverage from ~200 to ~354,000 SKUs, which is the highest-leverage single fix in this audit.

If you have a day: **Phase 1 in full**. Five focused fixes, all <30 lines each, that turn "search is broken" into "search is OK".

If you have a sprint: **Phase 1 + Phase 2**. Resolves every P0 and P1, makes the results meaningfully better in both languages, and builds the shared utilities the rest of the work depends on.
