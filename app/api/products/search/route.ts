export const runtime = "nodejs";

import { NextResponse, type NextRequest } from "next/server";
import {
  searchProducts,
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

    const t0 = Date.now();
    const resultOrTimeout = await raceTimeout<SearchResult | TimeoutSentinel>(
      searchProducts({
        q,
        brand,
        category,
        inStockOnly,
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

    const res = NextResponse.json(resultOrTimeout);
    res.headers.set("Cache-Control", "private, no-store");
    return res;
  } catch (err) {
    console.error("[products/search] error:", err);
    const message = err instanceof Error ? err.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
};
