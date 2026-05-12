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
