import { NextResponse, type NextRequest } from "next/server";
import {
  searchProducts,
  type ProductCategory,
  type SearchSort,
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

const raceTimeout = <T>(p: Promise<T>, ms: number, fallback: T): Promise<T> =>
  Promise.race([p, new Promise<T>((r) => setTimeout(() => r(fallback), ms))]);

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

    const result = await searchProducts({
      q,
      brand,
      category,
      inStockOnly,
      limit,
      offset,
      sort,
      specScores,
      inShowroomIds,
    });

    const res = NextResponse.json(result);
    res.headers.set("Cache-Control", "private, no-store");
    return res;
  } catch (err) {
    console.error("[products/search] error:", err);
    const message = err instanceof Error ? err.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
};
