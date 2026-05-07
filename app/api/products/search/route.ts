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
    const [specScores, inShowroomIds] = await Promise.all([
      getMostSpecifiedScores(),
      getInShowroomIds(),
    ]);

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

    return NextResponse.json(result);
  } catch (err) {
    console.error("[products/search] error:", err);
    const message = err instanceof Error ? err.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
};
