import { NextResponse, type NextRequest } from "next/server";
import {
  searchProducts,
  getBrandCounts,
  getCatalogStats,
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
  const activeOnly = sp.get("active") === "true";
  const saleOnly = sp.get("sale") === "true";
  const inStockOnly = sp.get("inStock") === "true";
  const limit = Math.min(Math.max(Number(sp.get("limit") ?? 100), 1), 500);
  const offset = Math.max(Number(sp.get("offset") ?? 0), 0);
  const includeFacets = sp.get("facets") === "true";
  const rawSort = sp.get("sort") ?? "relevance";
  const sort: SearchSort = VALID_SORTS.includes(rawSort as SearchSort)
    ? (rawSort as SearchSort)
    : "relevance";
  // Signals are computed by default so the UI always has In-Showroom badges
  // and projectCount — they're cached, so the cost is one map lookup.
  const withSignals = sp.get("signals") !== "false";

  try {
    const [specScores, inShowroomIds] = withSignals
      ? await Promise.all([getMostSpecifiedScores(), getInShowroomIds()])
      : [undefined, undefined];

    const result = await searchProducts({
      q,
      brand,
      category,
      activeOnly,
      saleOnly,
      inStockOnly,
      limit,
      offset,
      sort,
      specScores,
      inShowroomIds,
    });

    if (!includeFacets) {
      return NextResponse.json(result);
    }

    const [brandCounts, stats] = await Promise.all([
      getBrandCounts(),
      getCatalogStats(),
    ]);
    return NextResponse.json({ ...result, brandCounts, stats });
  } catch (err) {
    console.error("[products/search] error:", err);
    const message = err instanceof Error ? err.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
};
