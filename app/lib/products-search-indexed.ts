import { normalize, scoreProduct, matchesFinish } from "./search-utils";
import type { IndexedProduct, Cache } from "./products-mapping";
import type {
  SearchOptions,
  SearchResult,
  ProductFullWithSignals,
} from "./products-full";

// Return null to signal "fall through to legacy searchProducts".
// The wrapper in products-full.ts handles the fallback call,
// avoiding a circular import.

// ── Index types ──────────────────────────────────────────────────────

export interface InvertedIndex {
  buffer: Uint32Array;
  lookup: Map<string, [offset: number, length: number]>;
  sortedTokens: string[];
  droppedTokens: Set<string>;
  cacheTs: number;
}

export interface IndexBuildStats {
  totalTokens: number;
  indexedTokens: number;
  droppedSingleton: number;
  droppedHighFreq: number;
  totalPostings: number;
  buildMs: number;
  heapDeltaMB: number;
}

// ── Build parameters ─────────────────────────────────────────────────

const MIN_DOC_FREQ = 2;
const MAX_DOC_FREQ = 5_000;

// ── Tokenization ─────────────────────────────────────────────────────
// Reads the pre-normalized _sku/_skuParts/_name/_brand/_cat/_finishes
// fields from IndexedProduct. These are already normalize()'d in
// buildCacheFromProducts. Description intentionally excluded.

const tokenizeProduct = (p: IndexedProduct): string[] => {
  const tokens: string[] = [];

  if (p._sku) tokens.push(p._sku);

  for (const part of p._skuParts) {
    if (part) tokens.push(part);
  }

  if (p._name) {
    for (const t of p._name.split(/\s+/)) {
      if (t) tokens.push(t);
    }
  }

  if (p._brand) {
    for (const t of p._brand.split(/\s+/)) {
      if (t) tokens.push(t);
    }
  }

  if (p._cat) tokens.push(p._cat);

  if (p._finishes) {
    for (const t of p._finishes.split(/\s+/)) {
      if (t) tokens.push(t);
    }
  }

  return tokens;
};

// ── Index builder ────────────────────────────────────────────────────

export const buildInvertedIndex = (
  products: IndexedProduct[],
): { index: InvertedIndex; stats: IndexBuildStats } => {
  const heapBefore = process.memoryUsage().heapUsed;
  const t0 = Date.now();

  // Phase 1: count document frequency per token
  const docFreq = new Map<string, number>();
  for (let i = 0; i < products.length; i++) {
    const seen = new Set<string>();
    for (const token of tokenizeProduct(products[i])) {
      if (!seen.has(token)) {
        seen.add(token);
        docFreq.set(token, (docFreq.get(token) ?? 0) + 1);
      }
    }
  }

  // Phase 2: filter vocabulary by frequency cap
  let droppedSingleton = 0;
  let droppedHighFreq = 0;
  const droppedTokens = new Set<string>();
  const keptTokens = new Set<string>();

  for (const [token, freq] of docFreq) {
    if (freq < MIN_DOC_FREQ) {
      droppedSingleton++;
    } else if (freq > MAX_DOC_FREQ) {
      droppedHighFreq++;
      droppedTokens.add(token);
    } else {
      keptTokens.add(token);
    }
  }

  // Phase 3: build posting lists for kept tokens
  const postings = new Map<string, number[]>();
  for (const token of keptTokens) {
    postings.set(token, []);
  }
  for (let i = 0; i < products.length; i++) {
    const seen = new Set<string>();
    for (const token of tokenizeProduct(products[i])) {
      if (keptTokens.has(token) && !seen.has(token)) {
        seen.add(token);
        postings.get(token)!.push(i);
      }
    }
  }

  // Phase 4: pack into flat buffer
  let totalPostings = 0;
  for (const list of postings.values()) {
    totalPostings += list.length;
  }

  const buffer = new Uint32Array(totalPostings);
  const lookup = new Map<string, [number, number]>();
  let offset = 0;
  for (const [token, list] of postings) {
    buffer.set(list, offset);
    lookup.set(token, [offset, list.length]);
    offset += list.length;
  }

  // Phase 5: sorted tokens for prefix binary search
  const sortedTokens = [...keptTokens].sort();

  const buildMs = Date.now() - t0;
  const heapDeltaMB = Math.round(
    (process.memoryUsage().heapUsed - heapBefore) / 1024 / 1024,
  );

  const stats: IndexBuildStats = {
    totalTokens: docFreq.size,
    indexedTokens: keptTokens.size,
    droppedSingleton,
    droppedHighFreq,
    totalPostings,
    buildMs,
    heapDeltaMB,
  };

  console.warn(
    `[products-search-indexed] Index built: ${stats.indexedTokens} tokens, ` +
      `${stats.totalPostings} postings, ${stats.droppedSingleton} singleton dropped, ` +
      `${stats.droppedHighFreq} high-freq dropped, ` +
      `${stats.buildMs}ms, +${stats.heapDeltaMB}MB heap`,
  );

  return {
    index: {
      buffer,
      lookup,
      sortedTokens,
      droppedTokens,
      cacheTs: Date.now(),
    },
    stats,
  };
};

// ── Prefix binary search ─────────────────────────────────────────────

const lowerBound = (arr: string[], prefix: string): number => {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (arr[mid] < prefix) lo = mid + 1;
    else hi = mid;
  }
  return lo;
};

const getPostingListsForPrefix = (
  index: InvertedIndex,
  prefix: string,
): Uint32Array[] => {
  const { sortedTokens, lookup, buffer } = index;
  const start = lowerBound(sortedTokens, prefix);
  const lists: Uint32Array[] = [];
  for (let i = start; i < sortedTokens.length; i++) {
    const token = sortedTokens[i];
    if (!token.startsWith(prefix)) break;
    const entry = lookup.get(token);
    if (entry) {
      const [off, len] = entry;
      lists.push(buffer.subarray(off, off + len));
    }
  }
  return lists;
};

// ── Set operations ───────────────────────────────────────────────────

const unionPostingLists = (lists: Uint32Array[]): Set<number> => {
  const out = new Set<number>();
  for (const list of lists) {
    for (let i = 0; i < list.length; i++) {
      out.add(list[i]);
    }
  }
  return out;
};

const intersectSets = (a: Set<number>, b: Set<number>): Set<number> => {
  const [small, big] = a.size <= b.size ? [a, b] : [b, a];
  const out = new Set<number>();
  for (const v of small) {
    if (big.has(v)) out.add(v);
  }
  return out;
};

// ── Search function ──────────────────────────────────────────────────

const DEFAULT_SCAN_BUDGET_MS = 4_000;

const imageWeight = (p: IndexedProduct) => (p.imageSrc ? 1 : 0);

const stripIndex = (p: IndexedProduct) => ({
  id: p.id,
  name: p.name,
  sku: p.sku,
  brand: p.brand,
  category: p.category,
  listPrice: p.listPrice,
  currency: p.currency,
  uom: p.uom,
  active: p.active,
  saleOk: p.saleOk,
  satCode: p.satCode,
  stockQty: p.stockQty,
  inStock: p.inStock,
  descriptionEs: p.descriptionEs,
  descriptionEn: p.descriptionEn,
  features: p.features,
  gallery: p.gallery,
  variantLabels: p.variantLabels,
  specSheetUrl: p.specSheetUrl,
  specSheetLocal: p.specSheetLocal,
  hasImage: p.hasImage,
  imageSrc: p.imageSrc,
  slug: p.slug,
  tradePrice: p.tradePrice,
  shippingClass: p.shippingClass,
});

export const searchProductsIndexed = async (
  opts: SearchOptions = {},
  getCache: () => Promise<Cache>,
): Promise<SearchResult | null> => {
  const t0 = Date.now();
  const {
    q = "",
    brand,
    category = "all",
    activeOnly,
    saleOnly,
    inStockOnly,
    finish,
    limit = 100,
    offset = 0,
    sort = "relevance",
    specScores,
    inShowroomIds,
  } = opts;

  const c = await getCache();
  const query = normalize(q);
  const finishNorm = finish ? normalize(finish) : "";

  // Index not ready yet → legacy fallthrough
  if (!c.invertedIndex) return null;

  // No query → legacy (filter/sort only, index not useful)
  if (!query) return null;

  const tokens = query.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return null;

  const index = c.invertedIndex;

  // ── Brand pre-filter ───────────────────────────────────────────
  // If a query token exactly matches a normalized brand name in
  // byBrandIndices, use that brand's product indices as the candidate
  // seed. The matched token is "satisfied" and removed from further
  // index lookup — it won't trigger the high-freq bailout even if
  // it was dropped from the inverted index.

  let brandSeed: Set<number> | null = null;
  const remainingTokens: string[] = [];

  for (const token of tokens) {
    if (!brandSeed) {
      const brandIndices = c.byBrandIndices.get(token);
      if (brandIndices) {
        brandSeed = new Set<number>();
        for (let i = 0; i < brandIndices.length; i++) {
          brandSeed.add(brandIndices[i]);
        }
        continue;
      }
    }
    remainingTokens.push(token);
  }

  // High-freq bailout: only bail if a remaining token is dropped
  // AND we have no brand seed to narrow with. With a brand seed,
  // dropped remaining tokens are handled by scoreProduct on the
  // narrowed candidate set.
  if (!brandSeed && remainingTokens.some((t) => index.droppedTokens.has(t))) {
    return null;
  }

  // ── Indexed candidate retrieval ──────────────────────────────────

  const perTokenSets: Set<number>[] = [];
  let emptyToken = false;
  for (const token of remainingTokens) {
    if (index.droppedTokens.has(token)) continue;
    const lists = getPostingListsForPrefix(index, token);
    if (lists.length === 0) {
      emptyToken = true;
      break;
    }
    perTokenSets.push(unionPostingLists(lists));
  }

  let candidateIndices: Set<number>;
  if (emptyToken) {
    candidateIndices = new Set<number>();
  } else if (perTokenSets.length === 0 && brandSeed) {
    candidateIndices = brandSeed;
  } else if (perTokenSets.length === 0) {
    candidateIndices = new Set<number>();
  } else {
    perTokenSets.sort((a, b) => a.size - b.size);
    candidateIndices = perTokenSets[0];
    for (let i = 1; i < perTokenSets.length; i++) {
      candidateIndices = intersectSets(candidateIndices, perTokenSets[i]);
      if (candidateIndices.size === 0) break;
    }
    if (brandSeed && candidateIndices.size > 0) {
      candidateIndices = intersectSets(candidateIndices, brandSeed);
    }
  }

  // ── Score indexed candidates ─────────────────────────────────────

  const scored: Array<{ p: IndexedProduct; s: number }> = [];
  for (const idx of candidateIndices) {
    const p = c.products[idx];
    if (!p) continue;
    if (brand && p.brand !== brand) continue;
    if (category !== "all" && p.category !== category) continue;
    if (activeOnly && !p.active) continue;
    if (saleOnly && !p.saleOk) continue;
    if (inStockOnly && !p.inStock) continue;
    if (finishNorm && !matchesFinish(p, finishNorm)) continue;
    const s = scoreProduct(query, p);
    if (s > 0) scored.push({ p, s });
  }

  // ── Widened fallback ─────────────────────────────────────────────
  // For multi-token queries (2+), always run a bounded linear scan.
  // Multi-token AND-intersection can miss products where one token
  // matches only as a substring (not prefix), causing the index to
  // exclude them even though scoreProduct would score them > 0.
  // For single-token queries, the index's prefix scan is complete
  // for the startsWith tier; substring-only matches are low-relevance.
  // Same 4s budget as the legacy path.

  const pool =
    brand && c.byBrand.has(brand) ? c.byBrand.get(brand)! : c.products;

  if (tokens.length >= 2 || scored.length < limit) {
    const seen = new Set(scored.map((x) => x.p.id));
    const scanStart = Date.now();
    let iter = 0;
    for (const p of pool) {
      if (++iter % 5000 === 0 && Date.now() - scanStart > DEFAULT_SCAN_BUDGET_MS) break;
      if (seen.has(p.id)) continue;
      if (category !== "all" && p.category !== category) continue;
      if (activeOnly && !p.active) continue;
      if (saleOnly && !p.saleOk) continue;
      if (inStockOnly && !p.inStock) continue;
      if (finishNorm && !matchesFinish(p, finishNorm)) continue;
      const s = scoreProduct(query, p);
      if (s > 0) {
        scored.push({ p, s });
        seen.add(p.id);
      }
    }
  }

  // ── Sort (mirrors searchProducts exactly) ────────────────────────

  if (sort === "most_specified" && specScores) {
    scored.sort((a, b) => {
      const sA = a.s * (1 + Math.log(1 + (specScores.get(a.p.id)?.projectCount ?? 0)));
      const sB = b.s * (1 + Math.log(1 + (specScores.get(b.p.id)?.projectCount ?? 0)));
      return sB - sA || a.p._sku.localeCompare(b.p._sku);
    });
  } else if (sort === "alpha") {
    scored.sort((a, b) => (a.p.name || a.p.sku).localeCompare(b.p.name || b.p.sku));
  } else if (sort === "price_asc") {
    scored.sort((a, b) => a.p.listPrice - b.p.listPrice);
  } else if (sort === "price_desc") {
    scored.sort((a, b) => b.p.listPrice - a.p.listPrice);
  } else {
    scored.sort(
      (a, b) =>
        b.s - a.s ||
        imageWeight(b.p) - imageWeight(a.p) ||
        a.p._sku.localeCompare(b.p._sku),
    );
  }

  // ── Paginate + decorate (mirrors searchProducts exactly) ─────────

  const matched = scored.map((x) => x.p);
  const page = matched.slice(offset, offset + limit);
  const items: ProductFullWithSignals[] = page.map((p) => {
    const base: ProductFullWithSignals = stripIndex(p);
    if (inShowroomIds?.has(p.id)) base.inShowroom = true;
    const spec = specScores?.get(p.id);
    if (spec && spec.projectCount > 0) base.projectCount = spec.projectCount;
    return base;
  });

  return {
    items,
    total: matched.length,
    offset,
    limit,
    elapsedMs: Date.now() - t0,
    cacheAgeMs: Date.now() - c.ts,
  };
};
