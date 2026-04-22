import { NextResponse, type NextRequest } from "next/server";
import {
  searchProducts,
  getBrandCounts,
  getCatalogStats,
  type ProductCategory,
} from "@/app/lib/products-full";

const VALID_CATEGORIES: ProductCategory[] = ["bathroom", "kitchen", "hardware"];

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
  const limit = Math.min(Math.max(Number(sp.get("limit") ?? 100), 1), 500);
  const offset = Math.max(Number(sp.get("offset") ?? 0), 0);
  const includeFacets = sp.get("facets") === "true";

  try {
    const result = await searchProducts({
      q,
      brand,
      category,
      activeOnly,
      saleOnly,
      limit,
      offset,
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
