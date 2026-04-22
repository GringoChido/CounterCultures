import { NextResponse, type NextRequest } from "next/server";
import { searchQuoteCatalog, type ProductCategory } from "@/app/lib/products-full";

const VALID_CATEGORIES: ProductCategory[] = ["bathroom", "kitchen", "hardware"];

export const GET = async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q") ?? "";
  const brand = sp.get("brand") || undefined;
  const rawCat = sp.get("category");
  const category =
    rawCat && VALID_CATEGORIES.includes(rawCat as ProductCategory)
      ? (rawCat as ProductCategory)
      : undefined;
  const limit = Math.min(Number(sp.get("limit") ?? 48), 100);
  const offset = Math.max(Number(sp.get("offset") ?? 0), 0);

  try {
    const result = await searchQuoteCatalog({ q, brand, category, limit, offset });
    return NextResponse.json({ ...result, source: "cache" as const });
  } catch (err) {
    console.error("[quote-search] error:", err);
    const message = err instanceof Error ? err.message : "Quote search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
};
