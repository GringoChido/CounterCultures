# [P1] Search Platform — Replace MiniSearch + Substring Scan with Meilisearch

> **Status:** PENDING · **Priority:** P1 · **Effort:** 2-3 days · **Branch:** `claude/fix-search-platform`
> **Last updated:** 2026-05-12

## Why this matters
Counter Cultures runs TWO bad search systems in parallel. The article search uses MiniSearch (client-side, ~163 docs) and has a known duplicate bug (P0.4). The product search in `app/lib/products-full.ts` is a custom substring scan against 354K rows held entirely in lambda memory — every cold start re-pulls the sheet and rebuilds the haystack, leading to 10–20 s search latency on cold lambdas and silent OOMs on warm ones. Replacing both with Meilisearch (self-hosted on Render or Railway, ~$5-20/mo) eliminates cold-start search entirely, gives true tokenized + typo-tolerant search, and unifies the search surface across articles + products. Algolia would solve it too but costs ~$350/mo at our record count; Typesense is comparable but Meili has a slightly more polished hosted story.

## The problem (evidence)
- `app/lib/products-full.ts` `searchProducts(query)` loads 354K rows into memory and scans substrings — O(N×Q) per request.
- Cold lambda starts spend ~10-20 s on the first search request rehydrating from Sheets.
- MiniSearch index for articles is rebuilt on every page load (no shared index across navigation), and emits duplicates when an article appears in multiple categories (the P0.4 bug).
- Search palette UX is slow ("debounced 300ms is just hiding the latency").
- No analytics on what people are searching for.

## Scope
**In scope:**
- Provision Meilisearch on Render (or Railway) — small instance.
- Build an indexer (Node script) that pulls Products + Articles, transforms, pushes to Meili.
- Schedule the indexer: on-demand trigger + nightly cron.
- Replace `searchProducts()` in `products-full.ts` with a Meili query.
- Replace MiniSearch in client search palette with Meili search-as-you-type via the official SDK.
- Capture search analytics (what people typed, what they clicked).

**Out of scope:**
- Vector / semantic search (P3 — Meili has experimental vector but stick to keyword for v1).
- Faceted filter UI overhaul (use existing facets, just back them with Meili).
- Search personalization.

## Files to touch
- New `app/lib/meilisearch.ts` — admin + search client factories.
- Modify `app/lib/products-full.ts` — `searchProducts()` now hits Meili.
- Modify `app/components/search-palette.tsx` — use `meilisearch-js` SDK; remove MiniSearch import.
- New `scripts/index-meilisearch.ts` — full reindex job (products + articles).
- New `app/api/cron/reindex-search/route.ts` — nightly trigger.
- New `app/api/search/analytics/route.ts` — log queries + clicks.
- `.env.example` — add `MEILISEARCH_HOST`, `MEILISEARCH_ADMIN_KEY`, `MEILISEARCH_SEARCH_KEY`.
- Delete: stale MiniSearch helper module (after migration).

## Meilisearch indexes
Two indexes: `products`, `articles`.

**`products` schema:**
- `id` (primary key = product_id)
- `name`, `name_en`, `brand`, `category`, `description`, `description_en`
- `slug` (from P1.5)
- `sku`
- `price` (filterable + sortable)
- `in_stock` (filterable)
- `searchable_attributes`: `[name, brand, category, sku, description]`
- `filterable_attributes`: `[category, brand, in_stock, price]`
- `sortable_attributes`: `[price, name]`

**`articles` schema:**
- `id`, `title`, `slug`, `excerpt`, `body`, `tags`, `published_at`
- Filterable: `tags`, `published_at`

## The fix (step by step)
1. **Provision Meilisearch on Render.** Choose the $7/month "Starter" plan with 1 GB memory; enough for our scale. Get `MEILISEARCH_HOST` URL.
2. **Generate keys.** Master key set in Render env; derive `admin` and `search-only` API keys via Meili's `/keys` endpoint. Store in Netlify env.
3. **Implement `app/lib/meilisearch.ts`:**
   ```ts
   import { MeiliSearch } from 'meilisearch';
   export const meiliAdmin = () => new MeiliSearch({ host: process.env.MEILISEARCH_HOST!, apiKey: process.env.MEILISEARCH_ADMIN_KEY! });
   export const meiliSearch = () => new MeiliSearch({ host: process.env.MEILISEARCH_HOST!, apiKey: process.env.MEILISEARCH_SEARCH_KEY! });
   ```
4. **Indexer script `scripts/index-meilisearch.ts`:**
   - Pull all products from `CC_Products_Full` in chunks of 5000.
   - Transform each row into the products schema.
   - Push to Meili with `index.addDocuments(batch)`.
   - Update settings (searchable/filterable/sortable attributes) on first run.
   - Same flow for articles.
   - Run once for initial backfill; expected ~10 min for 354K products.
5. **Cron route `app/api/cron/reindex-search/route.ts`:** Netlify scheduled function at 03:00 local — reindex changed documents only (track `updated_at` watermark; full nightly safety reindex once a week).
6. **Replace `searchProducts()`:**
   ```ts
   export async function searchProducts(q: string, opts?: SearchOpts) {
     const index = meiliSearch().index('products');
     const res = await index.search(q, { limit: opts?.limit ?? 50, filter: opts?.filter });
     return res.hits;
   }
   ```
   Drop the in-memory haystack. Trade tier swap (P1.3) happens after the Meili hit returns.
7. **Search palette client:** install `meilisearch-js`, replace MiniSearch logic with:
   ```ts
   const client = new MeiliSearch({ host: NEXT_PUBLIC_MEILISEARCH_HOST, apiKey: NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY });
   const results = await client.index('products').search(q, { limit: 8 });
   ```
   The `search-only` key is safe to expose to the browser.
8. **Analytics:** every committed query logs `{query, ts, resultCount}` to a `Search_Analytics` sheet tab. Every result click logs `{query, resultId, position}`.
9. **Delete MiniSearch usage.** Verify with `grep -rn "minisearch" app/`.

## Acceptance criteria
- [ ] Meili instance running, healthcheck passes.
- [ ] Products index has 354K docs; articles index has all articles.
- [ ] Catalog/product search returns < 100 ms p95 (server-side).
- [ ] Search palette UX feels instant (< 50 ms client round-trip in dev).
- [ ] Typo tolerance works: "silaa" finds "sillas".
- [ ] Cold lambda no longer spends time rehydrating 354K rows.
- [ ] P0.4 article duplicate bug is resolved (each article appears once).
- [ ] Search analytics rows accumulate in the sheet.

## Verification
```bash
curl -s "$MEILISEARCH_HOST/indexes/products/search" \
  -H "Authorization: Bearer $MEILISEARCH_SEARCH_KEY" \
  -H "Content-Type: application/json" \
  -d '{"q":"silla eames","limit":3}' | jq '.hits | length'
```
Expected: 3, fast (<100 ms).

## Dependencies
**Requires:** P1.5 (Slugs — index needs slug to return navigable URLs).
**Blocks:** SEO improvements (canonicalized results), removing the cold-start tax, implementing P3 vector/semantic search.

## Notes
- Cost: Render Starter $7/mo + 1 GB plenty for 354K compact docs. If RAM tightens, $19/mo gets 2 GB.
- Algolia is great but cost-prohibitive at our record count. If we hit limitations with Meili, revisit.
- Meili's typo tolerance is on by default; tune via `typoTolerance` settings if matching is too loose.
- Search-only API key is safe to ship to the browser; admin key is server-only.
- Add `NEXT_PUBLIC_MEILISEARCH_HOST` + `NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY` to the public env explicitly.
- After this ships, cleanup pass: delete in-memory haystack + the `_loadAllProducts` warmer that exists today.
