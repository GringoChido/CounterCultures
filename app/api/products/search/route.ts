export const runtime = "nodejs";

import { NextResponse, type NextRequest } from "next/server";
import {
  searchProducts,
  searchProductsIndexed,
  getCache,
  type ProductCategory,
  type SearchSort,
  type SearchResult,
} from "@/app/lib/products-full";
import {
  getMostSpecifiedScores,
  getInShowroomIds,
} from "@/app/lib/catalog-signals";

const VALID_CATEGORIES: ProductCategory[] = ["bathroom", "kitchen", "hardware"];
const VALID_SORTS: SearchSort[] = [
  "relevance",
  "most_specified",
  "alpha",
  "price_asc",
  "price_desc",
];

const TIMEOUT_SENTINEL = { __timeout: true } as const;
type TimeoutSentinel = typeof TIMEOUT_SENTINEL;

const raceTimeout = <T>(p: Promise<T>, ms: number, fallback: T): Promise<T> =>
  Promise.race([p, new Promise<T>((r) => setTimeout(() => r(fallback), ms))]);

const isTimeout = (v: SearchResult | TimeoutSentinel): v is TimeoutSentinel =>
  "__timeout" in v && (v as TimeoutSentinel).__timeout === true;

const TIMEOUT_MESSAGE = {
  en: "Your search is too broad. Try adding a brand or model number.",
  es: "Tu búsqueda es demasiado amplia. Prueba con una marca o número de modelo.",
} as const;

const makeTimeoutResponse = () =>
  NextResponse.json({
    items: [],
    totalCount: 0,
    brandCounts: [],
    categoryCounts: { bathroom: 0, kitchen: 0, hardware: 0 },
    timedOut: true,
    error: "search_timeout",
    message: TIMEOUT_MESSAGE,
  });

// Pre-warm: kick off snapshot hydration at module-load time so the first
// request doesn't pay the full cold-start cost sequentially. On warm
// Lambdas this is a no-op (~0ms). On cold start the hydration runs in
// parallel with the incoming request's own processing.
void getCache();

export const GET = async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q") ?? "";
  const brand = sp.get("brand") || undefined;
  const rawCat = sp.get("category");
  const category: ProductCategory | "all" | undefined =
    rawCat && VALID_CATEGORIES.includes(rawCat as ProductCategory)
      ? (rawCat as ProductCategory)
      : rawCat === "all"
        ? "all"
        : undefined;
  const inStockOnly = sp.get("inStock") === "true";
  const finish = sp.get("finish") || undefined;
  const limit = Math.min(Math.max(Number(sp.get("limit") ?? 60), 1), 200);
  const offset = Math.max(Number(sp.get("offset") ?? 0), 0);
  const rawSort = sp.get("sort") ?? "relevance";
  const sort: SearchSort = VALID_SORTS.includes(rawSort as SearchSort)
    ? (rawSort as SearchSort)
    : "relevance";

  try {
    const needSignals = !brand && !q && sort === "most_specified";
    let specScores: Map<string, { weightedScore: number; projectCount: number }> | undefined;
    let inShowroomIds: Set<string> | undefined;

    if (needSignals) {
      const emptyScores = new Map<string, { weightedScore: number; projectCount: number }>();
      const [ss, si] = await Promise.all([
        raceTimeout(getMostSpecifiedScores(), 2000, emptyScores),
        raceTimeout(getInShowroomIds(), 2000, new Set<string>()),
      ]);
      specScores = ss.size > 0 ? ss : undefined;
      inShowroomIds = si.size > 0 ? si : undefined;
    }

    const searchFn =
      process.env.PRODUCT_SEARCH_BACKEND === "legacy"
        ? searchProducts
        : searchProductsIndexed;

    // Pre-hydrate cache so cold-start time doesn't eat the search timeout.
    // getCache() is a no-op when warm (~0ms); on cold start it loads the
    // 354K-product snapshot (~3-9s on Netlify). Without this, the 6s race
    // timer includes hydration and search always times out on cold Lambdas.
    await getCache();

    const t0 = Date.now();
    const resultOrTimeout = await raceTimeout<SearchResult | TimeoutSentinel>(
      searchFn({
        q,
        brand,
        category,
        inStockOnly,
        finish,
        limit,
        offset,
        sort,
        specScores,
        inShowroomIds,
      }),
      6000,
      TIMEOUT_SENTINEL,
    );

    if (isTimeout(resultOrTimeout)) {
      console.warn(`[products/search] timeout: q="${q}" elapsed=${Date.now() - t0}ms`);
      const res = makeTimeoutResponse();
      res.headers.set("Cache-Control", "private, no-store");
      return res;
    }

    if (resultOrTimeout.partial) {
      console.warn(`[products/search] partial (scan budget): q="${q}" elapsed=${resultOrTimeout.elapsedMs}ms`);
      const res = makeTimeoutResponse();
      res.headers.set("Cache-Control", "private, no-store");
      return res;
    }

    const degradedSort = needSignals && sort === "most_specified" && !specScores;
    const body = degradedSort
      ? { ...resultOrTimeout, degradedSort: true }
      : resultOrTimeout;
    const res = NextResponse.json(body);
    res.headers.set("Cache-Control", "private, no-store");
    return res;
  } catch (err) {
    console.error(
      JSON.stringify({
        where: "api/products/search",
        q,
        brand,
        category,
        ua: req.headers.get("user-agent"),
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      })
    );
    const message = err instanceof Error ? err.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
};
