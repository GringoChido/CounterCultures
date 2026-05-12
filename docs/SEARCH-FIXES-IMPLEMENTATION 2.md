# Search Fixes — Implementation Guide (DO NOT SKIP STEPS)

Companion to `docs/SEARCH-AUDIT-2026-05-11.md`. The audit explains *why*; this doc gives you the *exact* edits.

> **Operating rules for the agent reading this:**
> 1. Treat the master checklist below as a CONTRACT. Every box must be ticked.
> 2. Apply fixes in the listed order. They have implicit dependencies.
> 3. After each fix, run the `VERIFY` command for that fix. If it fails, STOP and re-apply.
> 4. After every phase, run `bash scripts/verify-search-fixes.sh`. If it exits non-zero, STOP.
> 5. NEVER paraphrase a snippet. Copy the AFTER block character-for-character.
> 6. NEVER mark a fix complete because "it looks right." Mark it complete because the VERIFY command passed.

---

## Master checklist

### Phase 0 — Prerequisite (already done)
- [x] **PRE-1** — Create `app/lib/search-utils.ts` (created by this guide; do not skip the import in later patches)

### Phase 1 — P0 fixes (stop the bleeding)
- [ ] **FIX-001** — Dashboard ⌘K: point product search at the full Odoo catalog (`app/lib/search.ts`)
- [ ] **FIX-002** — Dashboard ⌘K: stop swallowing errors silently (`app/lib/search.ts`)
- [ ] **FIX-003** — Dashboard ⌘K: stop hard-coding `score: 100` for products (`app/lib/search.ts`)
- [ ] **FIX-004** — Public catalog: add `inStockOnly` to URL-sync deps (`catalog-view.tsx`)
- [ ] **FIX-005** — Public catalog: add `inStockOnly` to offset-reset deps (`catalog-view.tsx`)
- [ ] **FIX-006** — Public catalog: add request-id race guard to fetch effect (`catalog-view.tsx`)
- [ ] **FIX-007** — Public catalog: render an inline error band for non-401 failures (`catalog-view.tsx`)
- [ ] **FIX-008** — Public ⌘K: stop merging products with `score: 0` (`search-palette.tsx`)
- [ ] **FIX-009** — Public ⌘K: surface index-load errors with retry (`search-palette.tsx`)

### Phase 2 — P1 fixes (make results correct)
- [ ] **FIX-010** — Replace `cachedFetch` with URL-keyed LRU version (`app/lib/search.ts`)
- [ ] **FIX-011** — Replace `score()` with tokenized `scoreTokens` (`app/lib/search.ts`)
- [ ] **FIX-012** — Tokenize + accent-strip `scoreRow` in `products-full.ts`
- [ ] **FIX-013** — Tier SAT-code search (`app/lib/sat-codes.ts`)
- [ ] **FIX-014** — Locale-aware MiniSearch boosts (`search-palette.tsx`)
- [ ] **FIX-015** — Clamp `selectedIndex` against `flatList.length` (`command-palette.tsx`)
- [ ] **FIX-016** — Customer combobox: add `useDebouncedFetch` race guard (`customer-combobox.tsx`)

### Phase 3 — Verification
- [ ] **VERIFY-ALL** — Run `bash scripts/verify-search-fixes.sh` and confirm exit code 0
- [ ] **MANUAL-1** — Run the manual acceptance tests at the bottom of this doc
- [ ] **TYPE-CHECK** — Run `npx tsc --noEmit` and confirm no new errors
- [ ] **BUILD** — Run `npm run build` and confirm success

---

# PHASE 1 — P0 fixes

## FIX-001 — Dashboard ⌘K: point product search at the full Odoo catalog
**Severity:** P0 · **File:** `app/lib/search.ts` · **Lines:** 290–357
**Why:** Currently calls `/api/dashboard/products?q=` (curated sheet, ~200 rows) instead of `/api/dashboard/products/search` (354k Odoo cache). Users see almost nothing.

### BEFORE — find this exact block (lines 290–357)
```ts
interface ProductRow extends Record<string, string> {
  sku: string;
  brand: string;
  name: string;
  nameEn: string;
  price: string;
  tradePrice: string;
  currency: string;
  images: string;
  finishes: string;
  category: string;
  subcategory: string;
  availability: string;
  slug: string;
  description: string;
  descriptionEn: string;
  artisanal: string;
  id: string;
  featured: string;
}

const productRowToData = (p: ProductRow): SearchProductData => ({
  sku: p.sku,
  brand: p.brand,
  name: p.name,
  nameEn: p.nameEn,
  price: parseFloat(p.price) || 0,
  tradePrice: p.tradePrice ? parseFloat(p.tradePrice) : undefined,
  currency: p.currency || "MXN",
  images: p.images ? p.images.split(",").map((u) => u.trim()) : [],
  finishes: p.finishes ? p.finishes.split(",").map((f) => f.trim()) : [],
  category: p.category,
  subcategory: p.subcategory,
  availability: p.availability || "in-stock",
  slug: p.slug,
  description: p.description || "",
  descriptionEn: p.descriptionEn || "",
  artisanal: p.artisanal === "true",
  id: p.id,
  featured: p.featured === "true",
});

const searchProducts = async (q: string): Promise<SearchResult[]> => {
  try {
    const url = `/api/dashboard/products?q=${encodeURIComponent(q)}&limit=8`;
    const data = await cachedFetch<{ products?: ProductRow[] }>(`products:${q}`, url);
    return (data.products ?? []).map<SearchResult>((p) => {
      const productData = productRowToData(p);
      const priceNum = parseFloat(p.price);
      const priceStr = !Number.isNaN(priceNum) && priceNum > 0
        ? `$${priceNum.toLocaleString()} ${p.currency || "MXN"}`
        : "";
      return {
        id: `product-${p.slug || p.sku}`,
        type: "product",
        title: p.name || p.sku,
        subtitle: [p.brand, `${p.category}/${p.subcategory.replace(/-/g, " ")}`, priceStr]
          .filter(Boolean)
          .join(" · "),
        href: "#",
        score: 100, // server already filtered, treat all hits as relevant
        productData,
      };
    });
  } catch {
    return [];
  }
};
```

### AFTER — replace with this exact block
```ts
// Shape returned by /api/dashboard/products/search (full Odoo catalog).
// Matches ProductFull from app/lib/products-full.ts. Do NOT reuse the
// curated `Products` sheet shape — that endpoint sees ~200 SKUs, this one
// sees ~354,000.
interface FullProductRow {
  id: string;
  sku: string;
  brand: string;
  name: string;
  category: string;
  listPrice: number;
  currency: string;
  imageSrc?: string;
  inStock?: boolean;
  stockQty?: number;
}

interface FullProductSearchResponse {
  items?: FullProductRow[];
  total?: number;
}

const fullProductToData = (p: FullProductRow): SearchProductData => ({
  sku: p.sku,
  brand: p.brand,
  name: p.name,
  nameEn: p.name,
  price: p.listPrice || 0,
  tradePrice: undefined,
  currency: p.currency || "MXN",
  images: p.imageSrc ? [p.imageSrc] : [],
  finishes: [],
  category: p.category,
  subcategory: "",
  availability: p.inStock ? "in-stock" : "quote-only",
  slug: `p-${p.id}`,
  description: "",
  descriptionEn: "",
  artisanal: false,
  id: p.id,
  featured: false,
});

const searchProducts = async (q: string): Promise<SearchResult[]> => {
  // FIX-001: hit the full-catalog endpoint, not the curated CRUD route.
  // FIX-003: derive a real relevance score from match position; do NOT
  // hard-code 100 (which always outranks brands/leads/deals).
  const url = `/api/dashboard/products/search?q=${encodeURIComponent(q)}&limit=8`;
  const data = await cachedFetch<FullProductSearchResponse>(url);
  return (data.items ?? []).map<SearchResult>((p, idx) => {
    const productData = fullProductToData(p);
    const priceStr = p.listPrice > 0
      ? `$${p.listPrice.toLocaleString()} ${p.currency || "MXN"}`
      : "";
    // Server returns hits in relevance order. Map position → score so the
    // top hit beats brand/lead matches but the 8th is roughly comparable.
    const positionScore = Math.max(10, 50 - idx * 4);
    return {
      id: `product-${p.id}`,
      type: "product",
      title: p.name || p.sku,
      subtitle: [p.brand, p.category, priceStr].filter(Boolean).join(" · "),
      href: `/dashboard/products?selected=${encodeURIComponent(p.id)}`,
      score: positionScore,
      productData,
    };
  });
};
```

> **Note:** This block also applies FIX-003 (no more `score: 100`) and depends on FIX-010 (URL-keyed `cachedFetch`). The new `cachedFetch` signature is `cachedFetch<T>(url)` — single arg.

### VERIFY
```bash
# Should return 0 — the broken endpoint is gone
grep -n "/api/dashboard/products?q=" /Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures/app/lib/search.ts | wc -l

# Should return 0 — no more hard-coded 100
grep -n "score: 100" /Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures/app/lib/search.ts | wc -l

# Should return 1 — the new endpoint is wired
grep -c "/api/dashboard/products/search?q=" /Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures/app/lib/search.ts
```

---

## FIX-002 — Dashboard ⌘K: stop swallowing errors silently
**Severity:** P0 · **File:** `app/lib/search.ts` · **Lines:** 380–392 (and signature export)
**Why:** A backend outage looks identical to "no matches." Users have no idea the system is broken.

### BEFORE — find this exact block
```ts
export const searchAllEntities = async (query: string): Promise<SearchResult[]> => {
  if (query.trim().length < 2) return [];
  const groups = await Promise.all([
    searchLeads(query),
    searchDeals(query),
    searchTraficos(query),
    searchShipments(query),
    searchBrands(query),
    searchProducts(query),
    searchBlogPosts(query),
  ]);
  return rankResults(groups.flat());
};
```

### AFTER — replace with this exact block
```ts
export interface SearchAllResult {
  results: SearchResult[];
  /** Per-entity errors. Render these to the user — silent failures hide
   *  outages and make search look "broken with no signal". */
  errors: Array<{ entity: SearchResultType; message: string }>;
}

const safeSearch = async <T extends SearchResultType>(
  entity: T,
  fn: () => Promise<SearchResult[]>
): Promise<{ results: SearchResult[]; error: { entity: T; message: string } | null }> => {
  try {
    return { results: await fn(), error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error(`[search] ${entity} failed:`, message);
    return { results: [], error: { entity, message } };
  }
};

export const searchAllEntities = async (query: string): Promise<SearchAllResult> => {
  if (query.trim().length < 2) return { results: [], errors: [] };
  const groups = await Promise.all([
    safeSearch("lead", () => searchLeads(query)),
    safeSearch("deal", () => searchDeals(query)),
    safeSearch("trafico", () => searchTraficos(query)),
    safeSearch("shipment", () => searchShipments(query)),
    safeSearch("brand", () => searchBrands(query)),
    safeSearch("product", () => searchProducts(query)),
    safeSearch("blog", () => searchBlogPosts(query)),
  ]);
  const errors = groups
    .map((g) => g.error)
    .filter((e): e is { entity: SearchResultType; message: string } => e !== null);
  const results = rankResults(groups.flatMap((g) => g.results));
  return { results, errors };
};
```

> **Also:** Remove the inner `try/catch` blocks from `searchLeads`, `searchDeals`, `searchTraficos`, `searchShipments`, `searchBrands`, `searchProducts`, `searchBlogPosts` — `safeSearch` now handles them. Each function should just throw on fetch failure. (See sub-step below.)

### Sub-step 002a — strip inner try/catch from per-entity searchers
For EACH of `searchLeads`, `searchDeals`, `searchTraficos`, `searchShipments`, `searchBrands`, `searchProducts` in `app/lib/search.ts`:

1. Find the function body wrapped in `try { ... } catch { return []; }`
2. Remove the outer `try {` line
3. Remove the matching `} catch { return []; }` line
4. The function body stays exactly the same; it now naturally throws if `cachedFetch` throws.

`searchBlogPosts` has no try/catch — leave it alone.

### Caller update — `app/(dashboard)/components/command-palette.tsx`
The signature changed from `Promise<SearchResult[]>` to `Promise<SearchAllResult>`. Update the call site at lines 199–219:

#### BEFORE
```ts
useEffect(() => {
  if (!open) return;
  const q = query.trim();
  if (q.length < 2) {
    setResults([]);
    setLoading(false);
    return;
  }
  setLoading(true);
  const timer = setTimeout(async () => {
    try {
      const live = await searchAllEntities(q);
      setResults(live.map(searchResultToPalette));
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, SEARCH_DEBOUNCE_MS);
  return () => clearTimeout(timer);
}, [query, open]);
```

#### AFTER
```ts
const [searchErrors, setSearchErrors] = useState<
  Array<{ entity: string; message: string }>
>([]);

useEffect(() => {
  if (!open) return;
  const q = query.trim();
  if (q.length < 2) {
    setResults([]);
    setSearchErrors([]);
    setLoading(false);
    return;
  }
  setLoading(true);
  const timer = setTimeout(async () => {
    try {
      const live = await searchAllEntities(q);
      setResults(live.results.map(searchResultToPalette));
      setSearchErrors(live.errors);
    } catch (e) {
      setResults([]);
      setSearchErrors([
        { entity: "all", message: e instanceof Error ? e.message : "Search failed" },
      ]);
    } finally {
      setLoading(false);
    }
  }, SEARCH_DEBOUNCE_MS);
  return () => clearTimeout(timer);
}, [query, open]);
```

Then add the error band to the JSX. In the same file, insert this BEFORE the `{showRecent && ...}` line (around line 405):

```tsx
{searchErrors.length > 0 && (
  <div
    role="alert"
    className="mx-2 my-2 px-3 py-2 text-[11px] rounded border border-amber-500/40 bg-amber-500/10 text-amber-700"
  >
    Search partially unavailable: {searchErrors.map((e) => e.entity).join(", ")}.
    Results below may be incomplete.
  </div>
)}
```

### VERIFY
```bash
# Should return 0 — no swallowed catches in per-entity searchers
grep -n "} catch { return \[\]; }" /Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures/app/lib/search.ts | wc -l

# Should return 1 — the new return shape exists
grep -c "SearchAllResult" /Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures/app/lib/search.ts

# Should return 1 — caller renders errors
grep -c "Search partially unavailable" /Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures/app/\(dashboard\)/components/command-palette.tsx
```

---

## FIX-003 — Dashboard ⌘K: stop hard-coding `score: 100` for products
**Severity:** P0 · **Already applied as part of FIX-001.**
This fix is rolled into FIX-001 because the file regions overlap. Tick the box only after FIX-001 verify passes.

### VERIFY
```bash
# Should return 0
grep -n "score: 100" /Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures/app/lib/search.ts | wc -l
```

---

## FIX-004 — Public catalog: add `inStockOnly` to URL-sync deps
**Severity:** P0 · **File:** `app/[locale]/shop/catalog/catalog-view.tsx` · **Line:** 225
**Why:** Toggling "in stock" doesn't update the URL until some other filter changes. Refresh = filter lost.

### BEFORE — find this exact line (line 225)
```ts
  }, [query, brand, category, sortKey, viewMode, offset, router, pathname]);
```

### AFTER
```ts
  }, [query, brand, category, sortKey, viewMode, offset, inStockOnly, router, pathname]);
```

### VERIFY
```bash
# Should return 1 — the deps array now contains inStockOnly
grep -n "query, brand, category, sortKey, viewMode, offset, inStockOnly, router, pathname" /Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures/app/\[locale\]/shop/catalog/catalog-view.tsx | wc -l
```

---

## FIX-005 — Public catalog: add `inStockOnly` to offset-reset deps
**Severity:** P0 · **File:** `app/[locale]/shop/catalog/catalog-view.tsx` · **Line:** 230
**Why:** Toggling "in stock" doesn't reset pagination. Result: empty page on a populated filter.

### BEFORE — find this exact line (line 230)
```ts
  }, [query, brand, category, sortKey]);
```

### AFTER
```ts
  }, [query, brand, category, sortKey, inStockOnly]);
```

### VERIFY
```bash
# Should return 1
grep -n "}, \[query, brand, category, sortKey, inStockOnly\]);" /Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures/app/\[locale\]/shop/catalog/catalog-view.tsx | wc -l
```

---

## FIX-006 — Public catalog: add request-id race guard to fetch effect
**Severity:** P0 · **File:** `app/[locale]/shop/catalog/catalog-view.tsx` · **Lines:** 234–257
**Why:** No `reqIdRef` guard → fast typing renders whichever response lands last, not the most recent.

### Step 1 — add the ref to component body
Find the existing `useState/useTransition` block (around line 206–211) and add ONE line at the bottom of that block:

```ts
  const reqIdRef = useRef(0);
```

(`useRef` is already imported at the top of the file.)

### Step 2 — replace the fetch effect

#### BEFORE — find this exact block (lines 234–257)
```ts
  useEffect(() => {
    const id = setTimeout(() => {
      startTransition(async () => {
        const p = new URLSearchParams();
        if (query.trim().length >= MIN_QUERY) p.set("q", query.trim());
        if (brand) p.set("brand", brand);
        if (category !== "all") p.set("category", category);
        if (inStockOnly) p.set("inStock", "true");
        p.set("sort", sortKey);
        p.set("limit", String(PAGE_SIZE));
        p.set("offset", String(offset));
        const res = await fetch(`/api/products/search?${p}`);
        if (res.status === 401) {
          setNeedsAccess(true);
          setResult(null);
          return;
        }
        if (!res.ok) return;
        setNeedsAccess(false);
        setResult(await res.json());
      });
    }, 180);
    return () => clearTimeout(id);
  }, [query, brand, category, sortKey, offset, inStockOnly]);
```

#### AFTER
```ts
  // FIX-006: req-id guard — drop responses superseded by a newer query.
  // FIX-007: track error state instead of returning silently.
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const id = setTimeout(() => {
      const myReq = ++reqIdRef.current;
      startTransition(async () => {
        const p = new URLSearchParams();
        if (query.trim().length >= MIN_QUERY) p.set("q", query.trim());
        if (brand) p.set("brand", brand);
        if (category !== "all") p.set("category", category);
        if (inStockOnly) p.set("inStock", "true");
        p.set("sort", sortKey);
        p.set("limit", String(PAGE_SIZE));
        p.set("offset", String(offset));
        try {
          const res = await fetch(`/api/products/search?${p}`);
          if (myReq !== reqIdRef.current) return; // superseded
          if (res.status === 401) {
            setNeedsAccess(true);
            setResult(null);
            setFetchError(null);
            return;
          }
          if (!res.ok) {
            setFetchError(`Catalog search failed (HTTP ${res.status}). Retry below.`);
            return;
          }
          setNeedsAccess(false);
          setFetchError(null);
          setResult(await res.json());
        } catch (e) {
          if (myReq !== reqIdRef.current) return;
          setFetchError(
            e instanceof Error ? e.message : "Catalog search failed. Retry below."
          );
        }
      });
    }, 180);
    return () => clearTimeout(id);
  }, [query, brand, category, sortKey, offset, inStockOnly]);
```

### VERIFY
```bash
grep -c "reqIdRef = useRef(0)" /Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures/app/\[locale\]/shop/catalog/catalog-view.tsx
# Should return 1

grep -c "if (myReq !== reqIdRef.current) return" /Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures/app/\[locale\]/shop/catalog/catalog-view.tsx
# Should return at least 1
```

---

## FIX-007 — Public catalog: render an inline error band for non-401 failures
**Severity:** P0 · **File:** `app/[locale]/shop/catalog/catalog-view.tsx` · **Lines:** ~617 (just before the grid render)
**Why:** Without it, 500 responses leave the spinner spinning forever.

### Step 1 — confirm `fetchError` state exists
This state was added by FIX-006. If you skipped FIX-006, go back and do it.

### Step 2 — add the error UI
In the render block, find the line that begins the results grid. It looks like:
```tsx
            {/* Grid or table */}
            {result && sortedItems.length > 0 && viewMode === "grid" ? (
```

Insert this block IMMEDIATELY ABOVE that comment:

```tsx
            {fetchError && (
              <div
                role="alert"
                className="px-4 py-3 rounded border border-red-500/40 bg-red-500/10 text-red-700 text-sm flex items-center justify-between gap-3"
              >
                <span>{fetchError}</span>
                <button
                  type="button"
                  onClick={() => {
                    // Bump offset to itself to retrigger the fetch effect
                    setOffset((o) => o);
                    setFetchError(null);
                  }}
                  className="px-3 py-1 text-xs font-medium border border-red-500/40 rounded hover:bg-red-500/10 cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Grid or table */}
```

> **Note:** the simpler retry pattern of `setOffset(o => o)` works because React still triggers the effect when `setState` is called with a new function reference. If you want a more deterministic retry, add a separate `retryToken` state and include it in the effect's deps array.

### VERIFY
```bash
grep -c "fetchError" /Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures/app/\[locale\]/shop/catalog/catalog-view.tsx
# Should return at least 4
```

---

## FIX-008 — Public ⌘K: stop merging products with `score: 0`
**Severity:** P0 · **File:** `app/components/search/search-palette.tsx` · **Lines:** 195–206
**Why:** Products always appear above brands/articles because they're listed first AND have `score: 0` while brand/article scores are positive. The visual ordering is array order, not relevance.

### BEFORE — find this exact block (lines 195–206)
```tsx
  // Merge all results into a single navigable list: products first, then brands, then articles
  const allResults = useMemo<DisplayResult[]>(() => {
    const productDisplayResults: DisplayResult[] = productResults.map((p) => ({
      id: `product:${p.id}`,
      type: "product" as const,
      slug: p.id,
      name: p.name || p.sku,
      subtitle: `${p.brand} · ${p.sku}`,
      hrefSuffix: `/shop/catalog?q=${encodeURIComponent(p.sku || p.name)}`,
      score: 0,
    }));
    return [...productDisplayResults, ...brandArticleResults];
  }, [productResults, brandArticleResults]);
```

### AFTER
```tsx
  // FIX-008: derive a real score per product from its position in the
  // server-ranked list, then merge & sort with brand/article hits so the
  // most relevant result wins regardless of source.
  const allResults = useMemo<DisplayResult[]>(() => {
    const productDisplayResults: DisplayResult[] = productResults.map((p, idx) => ({
      id: `product:${p.id}`,
      type: "product" as const,
      slug: p.id,
      name: p.name || p.sku,
      subtitle: `${p.brand} · ${p.sku}`,
      hrefSuffix: `/shop/catalog?q=${encodeURIComponent(p.sku || p.name)}`,
      // MiniSearch scores typically range 0.3 – 5+. Map product position to
      // the same scale so cross-type sort is meaningful.
      score: Math.max(0.5, 5 - idx * 0.6),
    }));
    return [...productDisplayResults, ...brandArticleResults].sort(
      (a, b) => b.score - a.score
    );
  }, [productResults, brandArticleResults]);
```

> **Note:** The grouped-section render below still groups by type, which is fine — the section ORDER comes from `SECTION_ORDER`, but row order WITHIN each section now reflects relevance.

### VERIFY
```bash
grep -c "score: 0," /Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures/app/components/search/search-palette.tsx
# Should return 0

grep -c "Math.max(0.5, 5 - idx" /Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures/app/components/search/search-palette.tsx
# Should return 1
```

---

## FIX-009 — Public ⌘K: surface index-load errors with retry
**Severity:** P0 · **File:** `app/components/search/search-palette.tsx` · **Lines:** 108–121
**Why:** If `/api/search-index` fails, the spinner clears but no results ever appear. Silent failure.

### BEFORE — find this exact block (lines 108–121)
```ts
  useEffect(() => {
    if (!open || hasFetched) return;
    setLoading(true);
    fetch("/api/search-index")
      .then((r) => r.json())
      .then((payload: SearchIndexPayload) => {
        setIndex(buildMiniSearch(payload.documents));
        setHasFetched(true);
      })
      .catch((err) => {
        console.error("[SearchPalette] failed to load index", err);
      })
      .finally(() => setLoading(false));
  }, [open, hasFetched]);
```

### AFTER
```ts
  const [indexError, setIndexError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    if (!open || hasFetched) return;
    setLoading(true);
    setIndexError(null);
    fetch("/api/search-index")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((payload: SearchIndexPayload) => {
        setIndex(buildMiniSearch(payload.documents));
        setHasFetched(true);
      })
      .catch((err) => {
        console.error("[SearchPalette] failed to load index", err);
        setIndexError(err instanceof Error ? err.message : "Failed to load search");
      })
      .finally(() => setLoading(false));
  }, [open, hasFetched, retryToken]);
```

### Step 2 — add the error UI in the dialog body
Find the section that renders results (around line 319, the `<div ref={resultsRef}` line). Insert this block IMMEDIATELY INSIDE that div, ABOVE the `{!hasQuery ? ...` ternary:

```tsx
          {indexError && (
            <div
              role="alert"
              className="m-3 px-3 py-2 text-[11px] rounded border border-red-500/40 bg-red-500/10 text-red-700 flex items-center justify-between gap-3"
            >
              <span>Search index failed to load: {indexError}</span>
              <button
                type="button"
                onClick={() => {
                  setHasFetched(false);
                  setRetryToken((t) => t + 1);
                }}
                className="px-2 py-0.5 text-[10px] font-medium border border-red-500/40 rounded hover:bg-red-500/10 cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}
```

### VERIFY
```bash
grep -c "indexError" /Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures/app/components/search/search-palette.tsx
# Should return at least 4

grep -c "Search index failed to load" /Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures/app/components/search/search-palette.tsx
# Should return 1
```

---

# PHASE 2 — P1 fixes

## FIX-010 — Replace `cachedFetch` with URL-keyed LRU version
**Severity:** P1 · **File:** `app/lib/search.ts` · **Lines:** 54–66
**Why:** Cache keys collide across queries (`"leads"` always returns the same payload regardless of params). Per-keystroke product cache never expires (memory leak).

### BEFORE — find this exact block (lines 54–66)
```ts
const CACHE_TTL_MS = 60_000;
type CacheEntry<T> = { at: number; data: T };
const cache: Record<string, CacheEntry<unknown>> = {};

const cachedFetch = async <T>(key: string, url: string): Promise<T> => {
  const hit = cache[key];
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.data as T;
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  const data = (await res.json()) as T;
  cache[key] = { at: Date.now(), data };
  return data;
};
```

### AFTER — delete the BEFORE block entirely and replace with a single import line at the TOP of the file (just under the existing import block):
```ts
import { cachedFetch } from "./search-utils";
```

Then update every call site in this file. Find every `cachedFetch<X>("some-key", "/some/url")` and rewrite as `cachedFetch<X>("/some/url")`.

The five call sites (line numbers approximate after earlier edits):
- `searchLeads` — `cachedFetch<{ leads?: LeadRow[] }>("leads", "/api/dashboard/leads")` → `cachedFetch<{ leads?: LeadRow[] }>("/api/dashboard/leads")`
- `searchDeals` — `cachedFetch<{ deals?: DealRow[] }>("deals", "/api/dashboard/pipeline")` → `cachedFetch<{ deals?: DealRow[] }>("/api/dashboard/pipeline")`
- `searchTraficos` — `cachedFetch<{ traficos?: TraficoRow[] }>("traficos", "/api/dashboard/traficos")` → `cachedFetch<{ traficos?: TraficoRow[] }>("/api/dashboard/traficos")`
- `searchShipments` — `cachedFetch<{ shipments?: ShipmentRow[] }>("shipments", "/api/dashboard/shipments")` → `cachedFetch<{ shipments?: ShipmentRow[] }>("/api/dashboard/shipments")`
- `searchBrands` — `cachedFetch<{ brands?: BrandRow[] }>("brands", "/api/dashboard/brands")` → `cachedFetch<{ brands?: BrandRow[] }>("/api/dashboard/brands")`
- `searchProducts` — already uses single-arg form per FIX-001 ✓

### VERIFY
```bash
# Should return 0 — no two-arg calls remain
grep -nE "cachedFetch<[^>]+>\(\"[a-z]+\"" /Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures/app/lib/search.ts | wc -l

# Should return 1 — the import was added
grep -c "from \"./search-utils\"" /Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures/app/lib/search.ts

# Should return 0 — local cache definition removed
grep -c "const cache: Record<string, CacheEntry<unknown>>" /Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures/app/lib/search.ts
```

---

## FIX-011 — Replace `score()` with tokenized `scoreTokens`
**Severity:** P1 · **File:** `app/lib/search.ts` · **Lines:** 68–85 + every call site
**Why:** Single-substring scoring kills multi-word queries. "matte black brizo" returns 0 against "Brizo Rook in Matte Black".

### Step 1 — delete the local `score` function

#### BEFORE — find this exact block (lines 68–85)
```ts
/**
 * Score a query against ordered fields. Earlier fields weigh more.
 * Exact match > prefix > substring. Returns 0 for no match in any field.
 */
export const score = (query: string, ...fields: (string | undefined)[]): number => {
  const ql = query.trim().toLowerCase();
  if (!ql) return 0;
  let total = 0;
  fields.forEach((f, i) => {
    if (!f) return;
    const fl = f.toLowerCase();
    const positionWeight = Math.max(1, 5 - i);
    if (fl === ql) total += 10 * positionWeight;
    else if (fl.startsWith(ql)) total += 5 * positionWeight;
    else if (fl.includes(ql)) total += 2 * positionWeight;
  });
  return total;
};
```

#### AFTER — delete the BEFORE block entirely and add to the existing import:
```ts
import { cachedFetch, scoreTokens } from "./search-utils";
```

### Step 2 — update every call site

Find every `const s = score(q, ...fields)` and rewrite as:
```ts
const s = scoreTokens(q, [...fields], { weights: [...derived from position...] });
```

Concretely (approximate line numbers — search by context):

**searchLeads** — `score(q, l.name, l.email, l.id, l.phone, l.brand_slugs)` →
```ts
scoreTokens(q, [l.name, l.email, l.id, l.phone, l.brand_slugs], { weights: [4, 3, 3, 2, 1] })
```

**searchDeals** — `score(q, d.name, d.id, d.company, d.brand_slugs, d.owner)` →
```ts
scoreTokens(q, [d.name, d.id, d.company, d.brand_slugs, d.owner], { weights: [4, 3, 3, 1, 1] })
```

**searchTraficos** — `score(q, t.Trafico_Number, t.TRF_ID, t.Pedimento_Number, t.Broker_Name, t.Status)` →
```ts
scoreTokens(q, [t.Trafico_Number, t.TRF_ID, t.Pedimento_Number, t.Broker_Name, t.Status], { weights: [4, 4, 3, 2, 1] })
```

**searchShipments** — `score(q, sh.Shipment_ID, sh.Tracking, sh.Brand, sh.Carrier, sh.Destination)` →
```ts
scoreTokens(q, [sh.Shipment_ID, sh.Tracking, sh.Brand, sh.Carrier, sh.Destination], { weights: [4, 4, 2, 1, 2] })
```

**searchBrands** — `score(q, b.name, b.slug, b.taglineEn, b.taglineEs)` →
```ts
scoreTokens(q, [b.name, b.slug, b.taglineEn, b.taglineEs], { weights: [4, 3, 1, 1] })
```

**searchBlogPosts** — `score(q, a.title.en, a.title.es, a.slug, a.excerpt.en)` →
```ts
scoreTokens(q, [a.title.en, a.title.es, a.slug, a.excerpt.en], { weights: [4, 4, 2, 1] })
```

### VERIFY
```bash
# Should return 0 — old function gone
grep -c "export const score = " /Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures/app/lib/search.ts

# Should return at least 6 — every per-entity searcher uses the new fn
grep -c "scoreTokens(" /Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures/app/lib/search.ts
```

---

## FIX-012 — Tokenize + accent-strip `scoreRow` in `products-full.ts`
**Severity:** P1 · **File:** `app/lib/products-full.ts` · **Lines:** 250–252 (index build) + 391–399 (scoreRow) + 419–420 (search entry)
**Why:** Same single-substring bug at the catalog-API layer. Also no accent stripping → "baño" misses "bano".

### Step 1 — add the normalize import
At the top of `app/lib/products-full.ts`, add:
```ts
import { normalize, scoreTokens } from "./search-utils";
```

### Step 2 — normalize at index time

#### BEFORE — find these three lines inside the row-build loop (around lines 250–252)
```ts
      _sku: sku.toLowerCase(),
      _name: name.toLowerCase(),
      _brand: brand.toLowerCase(),
```

#### AFTER
```ts
      _sku: normalize(sku),
      _name: normalize(name),
      _brand: normalize(brand),
```

### Step 3 — replace `scoreRow` with multi-token version

#### BEFORE — find this exact block (lines 391–399)
```ts
const scoreRow = (p: IndexedProduct, q: string): number => {
  if (p._sku === q) return 100;
  if (p._sku.startsWith(q)) return 80;
  if (p._name.startsWith(q)) return 60;
  if (p._sku.includes(q)) return 40;
  if (p._name.includes(q)) return 30;
  if (p._brand.includes(q)) return 20;
  return 0;
};
```

#### AFTER
```ts
// FIX-012: tokenize the query so multi-word searches like "matte black brizo"
// score against EACH token, summed with field weights. Also fixes the original
// short-circuit bug where the first matching tier returned and skipped the rest.
// SKU still gets the highest weight because architects search by SKU constantly.
const scoreRow = (p: IndexedProduct, q: string): number =>
  scoreTokens(q, [p._sku, p._name, p._brand], { weights: [4, 3, 1] });
```

### Step 4 — normalize the query at the search entry

#### BEFORE — find this line (line 420)
```ts
  const query = q.trim().toLowerCase();
```

#### AFTER
```ts
  const query = normalize(q);
```

### VERIFY
```bash
# Should return 1
grep -c "from \"./search-utils\"" /Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures/app/lib/products-full.ts

# Should return 0 — old short-circuit body is gone
grep -c "if (p._sku === q) return 100" /Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures/app/lib/products-full.ts

# Should return 1
grep -c "scoreTokens(q, \[p._sku, p._name, p._brand\]" /Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures/app/lib/products-full.ts

# Should return 1
grep -c "const query = normalize(q);" /Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures/app/lib/products-full.ts
```

---

## FIX-013 — Tier SAT-code search
**Severity:** P1 · **File:** `app/lib/sat-codes.ts` · **Lines:** 99–105
**Why:** Naive substring → typing "30" returns half the catalog.

### BEFORE — find this exact block (lines 99–105)
```ts
export const searchSATCodes = (query: string, limit = 20): SATCode[] => {
  if (!query) return SAT_CODES.slice(0, limit);
  const q = query.toLowerCase();
  return SAT_CODES.filter(
    (c) => c.code.includes(q) || c.description.toLowerCase().includes(q)
  ).slice(0, limit);
};
```

### AFTER
```ts
import { normalize, scoreTokens } from "./search-utils";

export const searchSATCodes = (query: string, limit = 20): SATCode[] => {
  if (!query) return SAT_CODES.slice(0, limit);
  // FIX-013: tier the score so an exact code match outranks any description
  // hit, and prefix matches outrank substring matches. Also normalize so
  // "baño" matches "bano".
  const scored = SAT_CODES.map((c) => ({
    c,
    s: scoreTokens(query, [c.code, c.description], { weights: [5, 1] }),
  }));
  return scored
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.c);
};
```

> Note: `normalize` import is currently unused but reserved for any future field-level normalization (e.g. `normalize(c.code)` if SAT ever adds non-ASCII). Keeping it imported avoids a second edit later. If your linter complains, remove `normalize` from the import.

### VERIFY
```bash
grep -c "scoreTokens(query, \[c.code, c.description\]" /Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures/app/lib/sat-codes.ts
# Should return 1
```

---

## FIX-014 — Locale-aware MiniSearch boosts
**Severity:** P1 · **File:** `app/components/search/search-palette.tsx` · **Lines:** 63–92
**Why:** Same boost weights for EN and ES means English wins by default for users browsing in Spanish.

### BEFORE — find this exact block (lines 63–92)
```ts
const buildMiniSearch = (docs: SearchDoc[]): MiniSearch<SearchDoc> => {
  const ms = new MiniSearch<SearchDoc>({
    fields: [
      "nameEn",
      "nameEs",
      "subtitleEn",
      "subtitleEs",
      "bodyEn",
      "bodyEs",
      "keywords",
    ],
    storeFields: [
      "type",
      "slug",
      "nameEn",
      "nameEs",
      "subtitleEn",
      "subtitleEs",
      "hrefSuffix",
      "external",
    ],
    searchOptions: {
      boost: { nameEn: 4, nameEs: 4, subtitleEn: 2, subtitleEs: 2 },
      fuzzy: 0.2,
      prefix: true,
    },
  });
  ms.addAll(docs);
  return ms;
};
```

### AFTER
```ts
const buildMiniSearch = (
  docs: SearchDoc[],
  locale: "en" | "es"
): MiniSearch<SearchDoc> => {
  // FIX-014: boost the user's locale fields so Spanish browsers see Spanish
  // results first. fuzzy 0.15 instead of 0.2 to stop "matte" matching
  // "metal" / "patio".
  const isEs = locale === "es";
  const ms = new MiniSearch<SearchDoc>({
    fields: [
      "nameEn",
      "nameEs",
      "subtitleEn",
      "subtitleEs",
      "bodyEn",
      "bodyEs",
      "keywords",
    ],
    storeFields: [
      "type",
      "slug",
      "nameEn",
      "nameEs",
      "subtitleEn",
      "subtitleEs",
      "hrefSuffix",
      "external",
    ],
    searchOptions: {
      boost: isEs
        ? { nameEs: 5, nameEn: 2, subtitleEs: 2, subtitleEn: 1 }
        : { nameEn: 5, nameEs: 2, subtitleEn: 2, subtitleEs: 1 },
      fuzzy: 0.15,
      prefix: true,
    },
  });
  ms.addAll(docs);
  return ms;
};
```

### Update the call site (line 114)

#### BEFORE
```ts
        setIndex(buildMiniSearch(payload.documents));
```

#### AFTER
```ts
        setIndex(buildMiniSearch(payload.documents, locale));
```

### VERIFY
```bash
grep -c "buildMiniSearch(payload.documents, locale)" /Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures/app/components/search/search-palette.tsx
# Should return 1

grep -c "fuzzy: 0.15" /Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures/app/components/search/search-palette.tsx
# Should return 1
```

---

## FIX-015 — Clamp `selectedIndex` against `flatList.length`
**Severity:** P1 · **File:** `app/(dashboard)/components/command-palette.tsx` · **Lines:** 236–245
**Why:** Hover row 8, type a letter that shrinks the list to 3, Enter does nothing.

### Step 1 — add a clamp effect
Find the existing effects block (around lines 247–267). Insert this NEW effect immediately after the `flatList` `useMemo`:

```ts
  // FIX-015: clamp selectedIndex when the result set shrinks below the
  // current selection (e.g. user hovers row 8, then types a letter that
  // narrows to 3 results — Enter would have done nothing).
  useEffect(() => {
    if (selectedIndex >= flatList.length) {
      setSelectedIndex(Math.max(0, flatList.length - 1));
    }
  }, [flatList.length, selectedIndex]);
```

### VERIFY
```bash
grep -c "if (selectedIndex >= flatList.length)" /Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures/app/\(dashboard\)/components/command-palette.tsx
# Should return 1
```

---

## FIX-016 — Customer combobox: add `useDebouncedFetch` race guard
**Severity:** P1 · **File:** `app/(dashboard)/components/customer-combobox.tsx` · **Lines:** 44–66
**Why:** No req-id guard → fast typers see results from earlier queries.

### Step 1 — add the import
At the top of the file (under the existing imports):
```ts
import { useDebouncedFetch } from "@/app/lib/search-utils";
```

### Step 2 — replace the fetch effect

#### BEFORE — find this exact block (lines 36–66 — note: `loading` state declaration on line 39 stays)
```tsx
  const [open, setOpen] = useState(false);
  const [hits, setHits] = useState<CustomerHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [matchedId, setMatchedId] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    const q = value.trim();
    if (q.length < 2) {
      setHits([]);
      return;
    }
    const h = setTimeout(() => {
      setLoading(true);
      fetch(
        `/api/dashboard/customers?q=${encodeURIComponent(q)}&limit=8&sort=name&type=customer`,
        { cache: "no-store" }
      )
        .then((r) => (r.ok ? r.json() : { customers: [] }))
        .then((d) => {
          const rows = (d.customers ?? d.rows ?? []) as CustomerHit[];
          setHits(rows.slice(0, 8));
        })
        .catch(() => setHits([]))
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(h);
  }, [value, open]);
```

#### AFTER
```tsx
  const [open, setOpen] = useState(false);
  const [matchedId, setMatchedId] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // FIX-016: useDebouncedFetch handles req-id race guard, AbortController,
  // and error state. Replaces hand-rolled debounce that dropped requests
  // out of order on fast typers.
  const trimmed = value.trim();
  const fetchUrl =
    open && trimmed.length >= 2
      ? `/api/dashboard/customers?q=${encodeURIComponent(trimmed)}&limit=8&sort=name&type=customer`
      : null;
  const { data: hitsResponse, loading } = useDebouncedFetch<{
    customers?: CustomerHit[];
    rows?: CustomerHit[];
  }>(fetchUrl, 200);
  const hits: CustomerHit[] = (hitsResponse?.customers ?? hitsResponse?.rows ?? []).slice(0, 8);
```

> **Cleanup:** delete the `setHits` calls and the `useState<CustomerHit[]>([])` declaration — `hits` is now derived. Search the file for `setHits` and remove any remaining references.

### VERIFY
```bash
grep -c "useDebouncedFetch" /Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures/app/\(dashboard\)/components/customer-combobox.tsx
# Should return 2 (import + call)

grep -c "setHits" /Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures/app/\(dashboard\)/components/customer-combobox.tsx
# Should return 0
```

---

# PHASE 3 — Verification

## VERIFY-ALL — run the verification script

```bash
cd /Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures
bash scripts/verify-search-fixes.sh
```

The script (created alongside this doc) greps for every old broken pattern and exits non-zero if any survive. **Do not mark fixes complete until exit code is 0.**

## TYPE-CHECK

```bash
cd /Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures
npx tsc --noEmit
```

Should produce no errors. If it does, the most likely cause is a type mismatch from FIX-001 (the `searchProducts` return shape changed) or FIX-002 (the `searchAllEntities` return shape changed). Re-check the AFTER blocks for those fixes.

## BUILD

```bash
cd /Users/joshuasemolik/Desktop/_PROJECTS/counter-cultures
npm run build
```

## MANUAL-1 — manual acceptance tests

For each scenario, run through it in the dev server (`npm run dev`) and confirm the listed expected behavior. **Tick the box only after observing the behavior with your own eyes.**

- [ ] **AT-1 (FIX-001):** In the dashboard, hit `⌘K`. Type `kohler`. Confirm at least 5 product hits with real Odoo IDs (the URL on the row should be `/dashboard/products?selected=...`, not `#`).
- [ ] **AT-2 (FIX-002):** Disconnect from the network. Hit `⌘K`. Type `test`. Confirm an amber "Search partially unavailable" banner appears listing the failed entities.
- [ ] **AT-3 (FIX-003):** In dashboard `⌘K`, type the name of an existing rep (e.g. `roger`). Confirm the rep/lead result appears ABOVE any product results that happen to contain "roger" in their name.
- [ ] **AT-4 (FIX-004):** On `/en/shop/catalog`, toggle "In stock only". Confirm `?inStock=true` appears in the URL immediately. Refresh — confirm the toggle stays on.
- [ ] **AT-5 (FIX-005):** Page through to page 3 of an unfiltered catalog. Toggle "In stock only". Confirm you snap back to page 1 (`?offset=` removed from URL or set to 0).
- [ ] **AT-6 (FIX-006):** Type `kohler` quickly, then immediately type `brizo`. Confirm only Brizo results render (no flash of stale Kohler results).
- [ ] **AT-7 (FIX-007):** Stop the dev server. With the page open, change a filter. Confirm a red error band appears with a "Retry" button. Restart the server, click Retry. Results should appear.
- [ ] **AT-8 (FIX-008):** On the public site, hit `⌘K`. Type a brand name (e.g. `kohler`). Confirm the Kohler BRAND row appears at the top, not buried below 6 product rows.
- [ ] **AT-9 (FIX-009):** Block `/api/search-index` in DevTools (Network → Block request URL). Hit `⌘K`. Confirm a red error band with "Retry" appears (not just an empty palette).
- [ ] **AT-10 (FIX-011):** In dashboard `⌘K`, type a multi-word query like `kohler tap`. Confirm matching products appear (previously returned 0).
- [ ] **AT-11 (FIX-012):** On `/en/shop/catalog`, search for `baño`. Confirm bathroom products appear (previously returned 0 because no SKU contains "ñ").
- [ ] **AT-12 (FIX-013):** In an invoice line item, click the SAT-code picker. Type `30`. Confirm only ~10–15 most-relevant codes appear (not 30+). Type `lavabo` — confirm the Lavabo entry is at top.
- [ ] **AT-13 (FIX-014):** Switch site to `/es/`. Hit `⌘K`. Type a brand or article term. Confirm Spanish names render in the results, not English fallbacks (when both exist).
- [ ] **AT-14 (FIX-015):** In dashboard `⌘K`, type `p` (matches many pages). Hover the 5th row. Type `pi` so the list shrinks to 2 rows. Press Enter — should navigate, not no-op.
- [ ] **AT-15 (FIX-016):** Open a deal. In the customer field, type `Constructora` quickly then delete back to `Const`. Confirm the dropdown shows results matching "Const" (not stale "Constructora" results).

---

# Anti-pattern detector

After all fixes are in, these patterns should NOT exist anywhere in `app/`. The verification script greps for them — if any return non-zero, you've regressed:

| Pattern | Why it's banned |
|---|---|
| `cachedFetch<X>("literal", "/url")` (two args) | FIX-010 — collides on shared keys |
| `} catch { return [\]; }` in search.ts | FIX-002 — silent failure |
| `score: 100,` in search.ts | FIX-003 — no hard-coded scores |
| `/api/dashboard/products?q=` | FIX-001 — wrong endpoint |
| `query.trim().toLowerCase()` in search code | FIX-012 — use `normalize()` instead |
| `f.toLowerCase().includes(q)` (raw substring) | FIX-011/13 — use `scoreTokens()` |

---

# If you only have 30 minutes

Apply FIX-001, FIX-004, FIX-005, FIX-008. These are the four most-visible defects and they total fewer than 50 lines of edits. Then run `VERIFY-ALL` and `MANUAL-1` items AT-1, AT-4, AT-5, AT-8.
