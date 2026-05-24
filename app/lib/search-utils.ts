/**
 * Shared search primitives: normalize, scoreTokens, cachedFetch.
 *
 * Server-safe — no React imports. For the React hook (useDebouncedFetch),
 * import from "./use-debounced-fetch" instead.
 *
 * Used by:
 *  - app/lib/search.ts (dashboard ⌘K)
 *  - app/lib/products-full.ts (catalog API)
 *  - app/lib/sat-codes.ts (SAT code picker)
 */

const CACHE_TTL_MS = 60_000;
const LRU_MAX = 64;

type CacheEntry<T> = { at: number; data: T };
const lru = new Map<string, CacheEntry<unknown>>();

/** Strip accents and lowercase. "Baño" → "bano". */
export const normalize = (s: string): string =>
  s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

/**
 * URL-keyed LRU fetch with 60s TTL.
 * Single-arg: the URL is both the cache key and the fetch target.
 */
export const cachedFetch = async <T>(url: string): Promise<T> => {
  const hit = lru.get(url);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.data as T;
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  const data = (await res.json()) as T;
  if (lru.size >= LRU_MAX) {
    const oldest = lru.keys().next().value;
    if (oldest !== undefined) lru.delete(oldest);
  }
  lru.set(url, { at: Date.now(), data });
  return data;
};

interface ScoreTokensOpts {
  weights?: number[];
}

/**
 * Multi-token scoring against ordered fields.
 * Each query token is scored independently; results are summed.
 * Within a field, exact > prefix > substring.
 */
export const scoreTokens = (
  query: string,
  fields: (string | undefined)[],
  opts: ScoreTokensOpts = {}
): number => {
  const nq = normalize(query);
  if (!nq) return 0;
  const tokens = nq.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return 0;
  const weights = opts.weights ?? fields.map((_, i) => Math.max(1, 5 - i));
  let total = 0;
  for (const token of tokens) {
    let bestForToken = 0;
    for (let i = 0; i < fields.length; i++) {
      const f = fields[i];
      if (!f) continue;
      const nf = normalize(f);
      const w = weights[i] ?? 1;
      if (nf === token) {
        bestForToken = Math.max(bestForToken, 10 * w);
      } else if (nf.startsWith(token)) {
        bestForToken = Math.max(bestForToken, 5 * w);
      } else if (nf.includes(token)) {
        bestForToken = Math.max(bestForToken, 2 * w);
      }
    }
    total += bestForToken;
  }
  return total;
};

/**
 * Same scoring logic as scoreTokens, but skips normalize() on both
 * query and fields. Use when both are already lowercased + NFD-stripped
 * (e.g. the pre-indexed _sku/_name/_brand fields in the catalog cache).
 */
export const scoreNormalized = (
  query: string,
  fields: (string | undefined)[],
  opts: ScoreTokensOpts = {}
): number => {
  if (!query) return 0;
  const tokens = query.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return 0;
  const weights = opts.weights ?? fields.map((_, i) => Math.max(1, 5 - i));
  let total = 0;
  for (const token of tokens) {
    let bestForToken = 0;
    for (let i = 0; i < fields.length; i++) {
      const f = fields[i];
      if (!f) continue;
      const w = weights[i] ?? 1;
      if (f === token) {
        bestForToken = Math.max(bestForToken, 10 * w);
      } else if (f.startsWith(token)) {
        bestForToken = Math.max(bestForToken, 5 * w);
      } else if (f.includes(token)) {
        bestForToken = Math.max(bestForToken, 2 * w);
      }
    }
    total += bestForToken;
  }
  return total;
};

// ── Product-specific scorer with AND semantics + SKU-part awareness ───

export interface ProductFields {
  _sku: string;
  _name: string;
  _brand: string;
  _skuParts: string[];
  _cat: string;
  _finishes: string;
  _desc: string;
}

const FIELD_WEIGHTS = {
  sku: 6,
  skuParts: 5,
  name: 4,
  brand: 3,
  cat: 2,
  finishes: 2,
  desc: 1,
} as const;

const scoreTokenAgainstField = (
  token: string,
  field: string,
  weight: number
): number => {
  if (!field) return 0;
  if (field === token) return 10 * weight;
  if (field.startsWith(token)) return 5 * weight;
  if (field.includes(token)) return 2 * weight;
  return 0;
};

const scoreTokenAgainstSkuParts = (
  token: string,
  parts: string[],
  weight: number
): number => {
  let best = 0;
  for (const part of parts) {
    if (part === token) return 10 * weight;
    if (part.startsWith(token)) best = Math.max(best, 5 * weight);
    else if (part.includes(token)) best = Math.max(best, 2 * weight);
  }
  return best;
};

/**
 * Product-aware scorer. AND semantics: every query token must match at
 * least one field, otherwise returns 0. Whole-query exact match on SKU
 * or name short-circuits to a high score.
 *
 * Weight order: sku/skuParts > name > brand > category/finishes > description.
 */
export const scoreProduct = (query: string, p: ProductFields): number => {
  if (!query) return 0;
  const tokens = query.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return 0;

  // Whole-query exact match short-circuits
  if (p._sku === query) return 200;
  if (p._name === query) return 180;

  let total = 0;
  for (const token of tokens) {
    let best = 0;
    best = Math.max(best, scoreTokenAgainstField(token, p._sku, FIELD_WEIGHTS.sku));
    best = Math.max(best, scoreTokenAgainstSkuParts(token, p._skuParts, FIELD_WEIGHTS.skuParts));
    best = Math.max(best, scoreTokenAgainstField(token, p._name, FIELD_WEIGHTS.name));
    best = Math.max(best, scoreTokenAgainstField(token, p._brand, FIELD_WEIGHTS.brand));
    best = Math.max(best, scoreTokenAgainstField(token, p._cat, FIELD_WEIGHTS.cat));
    best = Math.max(best, scoreTokenAgainstField(token, p._finishes, FIELD_WEIGHTS.finishes));
    best = Math.max(best, scoreTokenAgainstField(token, p._desc, FIELD_WEIGHTS.desc));
    if (best === 0) return 0; // AND: token matched nothing → exclude
    total += best;
  }
  return total;
};
