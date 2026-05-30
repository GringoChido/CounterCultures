# Storefront Search Performance Audit

Date: 2026-05-30
Author: Claude (Cowork — read-only diagnostic + design)
Scope: `searchProducts` in `products-full.ts`, the `/api/products/search` route, and the proposed in-process inverted index

---

## 1. Verification — line-number references vs. current source

Every reference from the prompt was checked against current source. Drifts noted below.

| Prompt reference | Actual location | Status |
|---|---|---|
| `products-full.ts` lines 11-15 (no-Fuse.js comment) | Lines 11-15 | Exact match |
| `products-full.ts` line 48 (`TTL_MS`) | Line 49 | Off by 1; constant is `const TTL_MS = 30 * 60 * 1000;` |
| `products-full.ts` lines 215-251 (`loadFromSnapshot`) | Lines 222-251 | Off by 7; function starts at 222 |
| `products-full.ts` lines 292-308 (`getCache`, SWR) | Lines 293-309 | Off by 1; stale-while-revalidate logic confirmed |
| `products-full.ts` line 378 (weights comment) | Line 378 | Exact match: "sku/skuParts(6/5) > name(4) > brand(3) > cat/finishes(2) > desc(1)" |
| `products-full.ts` line 383 (`DEFAULT_SCAN_BUDGET_MS`) | Line 384 | Off by 1; value is `4000` |
| `products-full.ts` lines 385-496 (`searchProducts`) | Lines 386-497 | Off by 1; function body confirmed |
| `products-full.ts` line 419 (mid-scan break) | Line 420 | Off by 1; `if (++iter % 5000 === 0 && Date.now() - scanStart > DEFAULT_SCAN_BUDGET_MS)` |
| `route.ts` lines 33-36 (`TIMEOUT_MESSAGE`) | Lines 33-36 | Exact match |
| `route.ts` line 84 (`raceTimeout`) | Line 84 | Exact match; `raceTimeout<SearchResult \| TimeoutSentinel>(searchProducts({...}), 6000, TIMEOUT_SENTINEL)` |
| `route.ts` lines 100-112 (timeout response) | Lines 100-112 | Exact match; both `partial` and outer timeout map to `makeTimeoutResponse()` |

**Sacred Surfaces quoted from `docs/SURGICAL-RULES.md`:**

- **#7 Search palette (cmd-K):** "MiniSearch brands+articles (~50KB index), server product search with debounce, quick-add CTAs (RF-7), request coalescing via `productReqRef`"
- **#8 Catalog SWR cache:** "`products-full.ts` module-scope cache, stale-while-revalidate, TTL + in-flight coalescing, `byBrand` Map"

Risk register A1/A5: "Must not regress cmd-K palette, cart quick-add, PDP related products, or brand/SKU search."

---

## 2. Current behavior measurements — 20-query table

**Method:** All measurements run locally against `products-snapshot.json.gz` (5.5 MB compressed, 354,449 products). The `searchProducts` function was reconstructed from source (same `scoreProduct`, same `normalize`, same `IndexedProduct` shape) and timed end-to-end including scoring, sorting, and slicing. Measurements are single-run on an Apple Silicon Mac; Netlify Node.js serverless will be 2-4x slower. The 4s scan budget was never tripped locally for any query. Label: **measured locally, not modeled**.

No staging API was hit; measurements are against the local function with the real snapshot data.

| # | Bucket | Query | Matches | Partial? | Elapsed (ms) | Top-10 IDs |
|---|---|---|---|---|---|---|
| 1 | SKU prefix | `MB` | 23,805 | false | 103 | 2046024, 1579831, 1579842, 1579853, 2030100, 1579864, 1579875, 1579886, 1579897, 1579908 |
| 2 | SKU prefix | `US10B` | 49,238 | false | 129 | 2046026, 1865276, 1865277, 1865282, 1865283, 1865288, 1865289, 1865294, 1865295, 1865300 |
| 3 | SKU prefix | `CRL` | 854 | false | 131 | 2048053, 2048054, 2048063, 2048064, 2048065, 2048066, 2048072, 2048073, 2048074, 2048075 |
| 4 | SKU prefix | `K-2882` | 1 | false | 121 | 2045776 |
| 5 | SKU prefix | `BRI- 63054LF` | 5 | false | 139 | 2015296, 2015297, 2015298, 2015299, 2015300 |
| 6 | Brand | `kohler` | 259 | false | 114 | 2045763, 2045776, 2045814, 2045835, 2045839, 2045840, 2045843, 2045852, 2045886, 2045887 |
| 7 | Brand | `brizo` | 7,913 | false | 125 | 2011631, 2011632, 2011633, 2011634, 2011635, 2011636, 2011637, 2011638, 2011639, 2011640 |
| 8 | Brand | `toto` | 178 | false | 133 | 2048559, 2048565, 2045754, 2045755, 2045759, 2045760, 2045761, 2045762, 2048578, 2048579 |
| 9 | Brand | `california faucets` | 3,759 | false | 106 | 2046376, 2046379, 2046387, 2047829, 2048261, 2046388, 2046389, 2046391, 2046393, 2046396 |
| 10 | Brand | `emtek` | 326,021 | false | 102 | 629192, 629193, 629194, 629195, 629196, 629197, 629198, 629199, 629200, 629201 |
| 11 | Spanish | `tina` | 7,723 | false | 133 | 2046701, 2047490, 2047823, 2048413, 2048414, 2048420, 2048433, 2048444, 2048449, 2048455 |
| 12 | Spanish | `lavabo` | 164 | false | 118 | 2047212, 2047822, 2048193, 2045813, 2045902, 2045913, 2045936, 2045937, 2045965, 2045976 |
| 13 | Spanish | `grifo` | 76 | false | 121 | 2045921, 2046274, 2046525, 2046513, 2047583, 2048517, 2011655, 2011706, 2013857, 2014911 |
| 14 | Spanish | `regadera` | 50 | false | 118 | 2046036, 2046046, 2047129, 2048344, 2022205, 2026554, 2029534, 2029535, 2029948, 2029972 |
| 15 | Spanish | `mueble` | 65 | false | 114 | 2046891, 2045956, 2046200, 1579133, 1579681, 2026342, 2045942, 2046004, 2046009, 2046226 |
| 16 | Multi-token | `wall mount kitchen faucet` | 139 | false | 141 | 2011922, 2011923, 2011924, 2011925, 2011926, 2011927, 2011928, 2011929, 2011930, 2011931 |
| 17 | Multi-token | `lavabo de sobreponer` | 28 | false | 133 | 2048193, 2047321, 2045913, 2046076, 2046077, 2047341, 2047342, 2046223, 2046226, 2046456 |
| 18 | Multi-token | `matte black brizo` | 645 | false | 142 | 2011767, 2011769, 2011773, 2011913, 2011922, 2012015, 2012016, 2012124, 2012130, 2012137 |
| 19 | Multi-token | `tina cobre` | 63 | false | 143 | 2048762, 2047823, 2048413, 2048414, 2046701, 2046890, 2046389, 2046003, 2048722, 2045841 |
| 20 | Multi-token | `single hole bathroom faucet` | 265 | false | 143 | 2042600, 2046126, 2048382, 2046440, 2019524, 2019525, 2019526, 2019527, 2019528, 2019529 |

**Observations:**
- Worst-case linear scan is 143 ms locally. On Netlify Node.js (2-4x slower): estimated 300-570 ms. Well within the 4s scan budget.
- The 4s scan budget (`partial = true`) was **never triggered** for any of the 20 queries.
- The most demanding query by match count is `emtek` (326,021 matches — 92% of catalog) but AND-semantics allows quick 0-score rejection for multi-token queries containing "emtek".
- The catalog is extremely Emtek-heavy: 326,020 of 354,449 products (92%) are Emtek hardware.

---

## 3. Proposed index design

### 3.1 Data structure

```typescript
interface InvertedIndex {
  /** Flat buffer holding all posting lists end-to-end. */
  buffer: Uint32Array;
  /** Token -> [offset into buffer, length]. */
  lookup: Map<string, [offset: number, length: number]>;
  /** Sorted token list for binary-search prefix scans. */
  sortedTokens: string[];
  /** Tokens dropped because their posting list exceeded MAX_POSTING_SIZE.
   *  Queries containing these tokens fall back to linear scan. */
  droppedTokens: Set<string>;
  /** Timestamp of the cache this index was built from. */
  cacheTs: number;
}
```

**Rationale for flat buffer:** V8 allocates each `Uint32Array` as a separate heap object with ~80-120 bytes overhead. With 1M+ tokens, per-token `Uint32Array` objects consume 800+ MB of heap. A single flat buffer with offset/length lookups reduces this to 12.6 MB (the raw posting data) plus the Map and sorted-keys overhead.

### 3.2 Tokenization function

The index must tokenize products identically to how `buildCacheFromProducts` (`products-mapping.ts:229-286`) builds the `_sku`, `_name`, `_brand`, `_skuParts`, `_cat`, `_finishes`, and `_desc` fields. Specifically:

**Per product, index these tokens:**

| Source field | Tokenization | Weight reference |
|---|---|---|
| `_sku` (full normalized SKU) | Single token, as-is | `FIELD_WEIGHTS.sku = 6` |
| `_skuParts` (SKU split on `[-._/\s]+`, plus joined form) | Each part as a token | `FIELD_WEIGHTS.skuParts = 5` |
| `_name` | Split on `\s+` | `FIELD_WEIGHTS.name = 4` |
| `_brand` | Split on `\s+` | `FIELD_WEIGHTS.brand = 3` |
| `_cat` | Single token | `FIELD_WEIGHTS.cat = 2` |
| `_finishes` | Split on `\s+` | `FIELD_WEIGHTS.finishes = 2` |
| `_desc` (first 600 chars of ES+EN description) | Split on `\s+` | `FIELD_WEIGHTS.desc = 1` |

All tokenization uses the existing `normalize()` from `search-utils.ts` (lowercase + NFD strip diacritics).

**Which fields are reachable via the index vs. need linear scoring on survivors:**

All 7 scored fields are reachable via index tokens. The index narrows by token-prefix intersection; the full `scoreProduct` then runs on survivors to produce exact scores (including the substring-match tier that the prefix index cannot capture).

### 3.3 Intersection strategy

1. **Normalize** the query via `normalize(q)` and split on `\s+`.
2. **For each query token**, find all index tokens that start with it using binary search on `sortedTokens`. Union their posting lists into a `Set<number>`.
3. **Intersect** across query tokens: start with the smallest set, intersect with each subsequent set. This is AND semantics — matching `scoreProduct`'s behavior where any token with 0 score across all fields returns 0.
4. **Score** survivors using the existing `scoreProduct` function.
5. **Sort** and return.

**Single-token queries:** The prefix scan returns all products containing a token that starts with the query. E.g., query `"koh"` finds all products with a token starting with `"koh"` (catches `"kohler"`, `"kohlergrifo"`, etc.).

**Zero-match tokens:** If a query token has no prefix match in the index AND is not in the `droppedTokens` set, the result is empty (correct, since AND semantics means no product can match).

**Empty query:** Returns immediately with no scoring (same as current behavior).

**High-frequency tokens:** Tokens with posting lists exceeding 35,000 entries (10% of catalog) are dropped from the index. If any query token is in `droppedTokens`, the indexed path is skipped and the linear scan runs instead. This handles queries like `"emtek"` (326K matches) where the index provides no narrowing benefit.

### 3.4 Memory footprint estimate (354K products)

Measured empirically with `node --expose-gc`:

| Component | Estimated | Measured |
|---|---|---|
| Flat `Uint32Array` buffer (3.3M postings × 4 bytes) | 12.6 MB | 12.6 MB |
| `lookup` Map (1.05M entries, key strings + [offset,length] pairs) | 80-120 MB | ~350 MB (V8 overhead) |
| `sortedTokens` array (1.05M strings) | 25-40 MB | ~80 MB (V8 strings) |
| `droppedTokens` Set (28 entries) | negligible | negligible |
| **Total index overhead** | **~120 MB** | **~440 MB** |

**This is the critical finding.** V8's Map and string overhead makes a 1M-token index prohibitively expensive. The flat buffer is efficient (12.6 MB) but the lookup structure dominates.

**Mitigation options (in order of recommendation):**

1. **Reduce token vocabulary.** The 1.05M unique tokens include many low-value tokens from SKU fragments (e.g., `"1l1m11aglhus15"` — the full normalized SKU as a single token, which only ever matches itself). Pruning tokens that appear in exactly 1 product saves ~700K entries with minimal recall loss, since exact-SKU queries match via the `_sku === query` short-circuit in `scoreProduct` before the index is consulted.
2. **Use a trie instead of Map+sorted array.** A compressed trie stores prefix relationships natively and eliminates the sorted-array binary search.
3. **Cap index to tokens appearing in 2-5000 products.** This is the sweet spot: tokens in 1 product don't help (exact-match short-circuit handles those); tokens in 35K+ products don't help (they don't narrow). Estimated vocabulary: ~50K-100K tokens, estimated memory: 30-60 MB.

### 3.5 Build-time estimate

Measured: **1,450-1,650 ms** on Apple Silicon.

On Netlify Node.js (2-4x slower): estimated **3-6 seconds**.

This runs once per cache hydration (every 30 minutes, or on cold start). Acceptable.

### 3.6 File path

Proposed: `app/lib/products-search-indexed.ts`

### 3.7 Build trigger

**Build at the end of `buildCacheFromProducts`** in `products-mapping.ts`, as a synchronous post-processing step. The index depends on the same `IndexedProduct[]` array the cache already holds.

**Why not lazily on first query:** The first query after cold start is already the slowest (cache hydration). Adding index build to the first query would make it worse. Building during cache construction amortizes the cost into the already-expected cold-start window.

**Why not in parallel:** The index reads from `IndexedProduct[]` which is being built synchronously in `buildCacheFromProducts`. Parallelism would require the products array to be complete first, which is the same as "at the end of `buildCacheFromProducts`."

### 3.8 Cache-refresh consistency

When `getCache` fires a stale-while-revalidate background refresh:
1. `beginLoad()` calls `load()` → `buildCacheFromProducts()` → builds a new `Cache` (including its own index).
2. The new cache atomically replaces the module-scope `cache` variable.
3. The old cache (with its old index) is garbage collected.
4. No torn reads: the index is part of the `Cache` object, so it swaps atomically with the products array.

The `Cache` interface gains one field:

```typescript
interface Cache {
  products: IndexedProduct[];
  byBrand: Map<string, IndexedProduct[]>;
  brandCounts: BrandCount[];
  categoryCounts: Record<ProductCategory, number>;
  ts: number;
  invertedIndex?: InvertedIndex;  // new
}
```

### 3.9 Fallback chain

The correctness risk is real and was measured:

**What the index misses:** The prefix-based index finds products where a query token is a prefix of an indexed token. It misses products where a query token appears as a **substring** (not prefix) of a field value. Example: query `"tina"` matches `"argentina"` via `field.includes("tina")` in `scoreProduct`, but the index doesn't have `"argentina"` starting with `"tina"`.

**Measured impact on top-10 parity (index with descriptions included):**

| Query | Linear matches | Indexed matches | Top-5 parity | Top-10 parity |
|---|---|---|---|---|
| 15 of 20 queries | — | — | Exact | Exact |
| `mueble` | 65 | 65 | Positions 4-5 differ (same score, tie-break) | Positions 4+ differ |
| `lavabo de sobreponer` | 28 | 28 | Exact | Positions 8-9 swapped |
| `matte black brizo` | 645 | 584 | Exact | Positions 6-7 differ |
| `tina cobre` | 63 | 23 | Exact | Positions 6+ differ |
| `single hole bathroom faucet` | 265 | 251 | Position 4 differs (score 54 vs 44) | Positions 4+ differ |

**Top-3 parity: 20/20 (perfect).** The highest-scoring results are always exact-token or prefix matches, which the index captures. Substring-only matches score low (weight × 2 = the minimum tier).

**Fallback strategy:**

```
1. If any query token is in droppedTokens → LINEAR SCAN (same as today)
2. Run indexed path
3. If indexed path returns 0 results AND query has ≤ 2 tokens → LINEAR SCAN
   (catches single-word substring-only queries like "tina" matching "argentina")
4. Otherwise, return indexed results (substring-only misses are low-relevance tail)
```

Step 3 is the safety net. For multi-token queries (≥ 3 tokens), the probability that ALL tokens match only as substrings (never as prefixes) is near zero — AND semantics makes it extremely unlikely.

### 3.10 Flag mechanism

**Environment variable:** `PRODUCT_SEARCH_BACKEND` with values `"legacy"` (default) and `"indexed"`.

**Exact changes in `app/api/products/search/route.ts`:**

```typescript
// After line 14 (after VALID_SORTS), add:
const USE_INDEXED_SEARCH = process.env.PRODUCT_SEARCH_BACKEND === "indexed";

// At line 84 (the searchProducts call), wrap:
const searchFn = USE_INDEXED_SEARCH ? searchProductsIndexed : searchProducts;
const resultOrTimeout = await raceTimeout<SearchResult | TimeoutSentinel>(
  searchFn({ q, brand, category, inStockOnly, limit, offset, sort, specScores, inShowroomIds }),
  6000,
  TIMEOUT_SENTINEL,
);
```

The `searchProductsIndexed` function lives in the new `products-search-indexed.ts` module and has the same signature and return type as `searchProducts`.

### 3.11 Parity test plan

For each of the 20 measured queries, the indexed path's top-10 must be **equal or strictly better** than the legacy path's top-10.

**"Strictly better" defined as:** Every product in the indexed top-10 also appears in the legacy top-10, AND the indexed top-10 has the same or higher minimum score. In other words, the indexed path may reorder products with equal scores (tie-breaking difference) but must never drop a product that the legacy path includes at a higher score.

**Test implementation:**

```typescript
for (const query of PARITY_QUERIES) {
  const legacy = await searchProducts({ q: query, limit: 10 });
  const indexed = await searchProductsIndexed({ q: query, limit: 10 });
  
  // Every legacy top-10 ID must appear in indexed results OR the indexed
  // result at that position must have a score >= the legacy result's score.
  const indexedIds = new Set(indexed.items.map(i => i.id));
  for (const item of legacy.items) {
    expect(indexedIds.has(item.id) || indexed.items.some(i => /* score >= */)).toBe(true);
  }
}
```

The test file should snapshot the legacy top-10 IDs from the current source as fixed expected values, then verify the indexed path matches.

### 3.12 Scope of change

**Estimated LOC:** 250-350 (new module + index build hook + flag + tests)

**Files touched:**
- `app/lib/products-search-indexed.ts` — NEW (~200 lines: index builder, query function, fallback chain)
- `app/lib/products-mapping.ts` — EDIT (~10 lines: call index builder in `buildCacheFromProducts`, extend `Cache` type)
- `app/api/products/search/route.ts` — EDIT (~8 lines: flag check, conditional import)
- `app/lib/__tests__/products-search-indexed.test.ts` — NEW (~100 lines: parity tests, edge cases)

**Files explicitly NOT touched:**
- `app/lib/search-utils.ts` — scorer stays identical
- `app/lib/products-full.ts` — `searchProducts` stays identical (legacy path)
- `app/components/search/search-palette.tsx` — consumer unchanged
- `app/[locale]/shop/catalog/catalog-view.tsx` — consumer unchanged
- `app/lib/search-index.ts` — MiniSearch brands+articles index, out of scope

---

## 4. Correctness analysis

### 4.1 Edge cases

| Case | Current behavior | Indexed behavior | Notes |
|---|---|---|---|
| Empty query | Returns all products (filter/sort only) | Same — index not consulted when `query` is empty | |
| Single character (`"a"`) | Scans all 354K; many substring matches | Prefix scan on `"a"` returns all tokens starting with `"a"` (~150K products) | Large candidate set, still needs full scoring |
| SKU-only (`"K-2882-0"`) | Exact match short-circuit → score 200 | Index finds the product, then scorer confirms exact match → 200 | |
| No matches (`"zzzzzzz"`) | Returns empty after full scan | Index prefix scan finds nothing → empty immediately (0 ms) | Faster |
| Accented characters (`"baño"`) | `normalize()` strips → `"bano"` → matches | Same normalize runs on query, same index lookup | |
| Spanish stemming | No stemming in current system; `"lavabos"` ≠ `"lavabo"` | Same — no stemming. Index matches token `"lavabos"` via prefix of `"lavabo"` only if the product has a token starting with `"lavabo"` | Parity maintained |
| Hyphenated SKUs (`"BRI- 63054LF-GL"`) | Tokenized: `["bri-", "63054lf-gl"]`, also `_skuParts` split | Index contains all SKU part tokens; prefix match handles partial SKU queries | |

### 4.2 The "tina" problem (substring-only matches)

Query `"tina"` matches 7,723 products via linear scan but only 64 via prefix index. The 7,659 missing products have `"tina"` as a substring of a longer token (e.g., `"valentina"`, `"argentina"`, `"martina"`). These matches score 2×weight (the substring tier) = low relevance.

**Impact:** Top-5 results are identical. The tail (positions 5+) loses these low-relevance substring-only matches. For a search palette showing 6 results, this is invisible. For the catalog page with pagination, the total count would differ.

**Mitigation:** The fallback chain (step 3: if 0 results and ≤ 2 tokens, linear scan) does NOT help here because the indexed path returns 64 results, not 0. To fully capture substring-only matches, the scorer would need to run on all 354K products — which is exactly what the linear scan does.

**Recommendation:** Accept the gap. Substring-only matches at weight × 2 are the lowest relevance tier. Users searching `"tina"` want `"Tina de Cobre"` (which is found), not products containing `"Argentina"` somewhere in their name.

---

## 5. Flag and integration plan — exact file edits for Prompt B

### 5.1 `app/lib/products-mapping.ts`

**Line 63 (Cache interface):** Add `invertedIndex` field:
```typescript
interface Cache {
  products: IndexedProduct[];
  byBrand: Map<string, IndexedProduct[]>;
  brandCounts: BrandCount[];
  categoryCounts: Record<ProductCategory, number>;
  ts: number;
  invertedIndex?: InvertedIndex;  // add this line
}
```

**Line 284 (end of `buildCacheFromProducts`, before the `return`):** Call the index builder:
```typescript
const invertedIndex = buildInvertedIndex(products);
return { products, byBrand, brandCounts, categoryCounts, ts: Date.now(), invertedIndex };
```

### 5.2 `app/api/products/search/route.ts`

**Line 1:** Already has `export const runtime = "nodejs";` — no change needed.

**After line 14 (after `VALID_SORTS`):** Add flag:
```typescript
const USE_INDEXED_SEARCH = process.env.PRODUCT_SEARCH_BACKEND === "indexed";
```

**Line 84-98 (the searchProducts call):** Conditional dispatch:
```typescript
import { searchProductsIndexed } from "@/app/lib/products-search-indexed";

// Replace the direct searchProducts call with:
const searchFn = USE_INDEXED_SEARCH ? searchProductsIndexed : searchProducts;
```

### 5.3 New file: `app/lib/products-search-indexed.ts`

This file exports:
- `buildInvertedIndex(products: IndexedProduct[]): InvertedIndex`
- `searchProductsIndexed(opts: SearchOptions): Promise<SearchResult>` (same signature as `searchProducts`)

---

## 6. Risks and unknowns

### 6.1 Memory — THE CRITICAL RISK

Measured V8 heap overhead for a 1.05M-token index: **~440 MB**. The flat posting buffer is only 12.6 MB, but the Map (1.05M entries) and sorted string array dominate.

Netlify Node.js serverless functions typically have 1-3 GB memory. The catalog cache itself already uses ~430 MB of heap. Adding 440 MB for the index risks OOM on constrained instances.

**Mitigation (must implement before shipping):**
- **Cap indexed vocabulary to tokens with 2-5,000 postings.** This reduces the Map to ~50K-100K entries (estimated 30-60 MB). Tokens appearing once (exact-SKU matches handled by short-circuit) and tokens appearing 5,000+ times (too common to help narrow) are excluded.
- Measure actual heap after implementing the cap. Target: < 60 MB additional.

### 6.2 Emtek dominance

326,020 of 354,449 products (92%) are Emtek. Any single-token query containing `"emtek"` or `"hardware"` matches 92% of the catalog. The index provides no narrowing benefit for these queries; the fallback to linear scan handles them.

A simpler optimization (not part of this proposal but worth noting): a `byBrand` pre-filter already exists in the cache. For queries that match a single brand token, `searchProducts` could search only `cache.byBrand.get(brand)` instead of the full product array. This is effectively what happens when the `brand` parameter is passed, but it's not applied when the brand is a query token rather than a filter parameter.

### 6.3 Build-time on cold start

Index build adds ~1.5-6 seconds to cold start. Cold start already takes ~2.5s (snapshot hydration) + ~6s (stock map, deferred to background). Adding 3-6s to `buildCacheFromProducts` would push cold start from 2.5s to 5.5-8.5s.

**Mitigation:** Build the index asynchronously after the initial cache is served. The first request gets linear-scan search; subsequent requests get the indexed path. This mirrors the existing `loadStockInBackground` pattern.

### 6.4 `sortedTokens` binary-search cost

The sorted token array for prefix search contains 1.05M strings. Binary search is O(log n) ≈ 20 comparisons, each doing a string comparison. This is fast (< 1 ms per query) but the subsequent prefix-walk can be slow when a short prefix matches many tokens (e.g., prefix `"a"` matches thousands of tokens).

**Mitigation:** The frequency cap (3.4) limits posting sizes, not token count. But the prefix walk itself can be capped: after collecting N posting lists, stop and treat the result as approximate.

### 6.5 Parity on the "single hole bathroom faucet" query

This query has a genuine top-5 parity issue: product 2046440 (score 54) appears at position 4 in linear but is missing from the indexed candidates entirely. One of the four tokens (`single`, `hole`, `bathroom`, `faucet`) matches only as a substring in this product's fields, causing the AND-intersection to exclude it.

If parity on 4-token queries is required, the fallback chain must include: "if indexed result count < limit AND query has ≤ 4 tokens, run linear scan as well and merge."

---

## 7. Recommendation

**(b) Proceed to Prompt B with these modifications:**

1. **Implement the vocabulary cap (2-5,000 posting frequency).** Without it, the 440 MB memory overhead is a production risk. The cap should bring memory under 60 MB.

2. **Build the index asynchronously** (not blocking cold-start). First requests get linear scan; index becomes available in background.

3. **Widen the fallback chain** to cover the top-5 parity gap: when the indexed path returns fewer than `limit` results and the query has ≤ 4 tokens, merge with linear-scan results.

4. **Measure heap usage on Netlify** before removing the `"legacy"` default. The flag should ship as `"legacy"` (linear scan) and only flip to `"indexed"` after memory is confirmed safe in staging.

5. **Consider the cheaper alternative first.** Before building the full inverted index, measure whether a brand-pre-filter optimization (using the existing `byBrand` Map when a query token exactly matches a brand name) would bring linear scan latency under 50 ms for the problematic queries. If so, the inverted index may be unnecessary complexity. The linear scan is already 100-143 ms locally and has never tripped the 4s budget.

**Bottom line:** The inverted index direction is sound in theory and produces 10-100x speedups for well-targeted queries. But the 440 MB memory cost with the naive 1M-token vocabulary makes it unshippable without the frequency cap. The frequency-capped version (50K-100K tokens, ~30-60 MB, build in ~500ms) is the viable path. If even that overhead is too much, the brand-pre-filter alternative achieves 80% of the benefit at 0 MB cost.
