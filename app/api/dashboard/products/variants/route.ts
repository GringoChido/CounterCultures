import { NextResponse, type NextRequest } from "next/server";
import {
  getVariants,
  getSameBrand,
  extractSkuRoot,
} from "@/app/lib/products-full";

/**
 * Returns product variants (same SKU root, different finish) and
 * same-brand recommendations. Both use the in-memory catalog cache.
 */
export const GET = async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams;
  const sku = sp.get("sku") ?? "";
  const brand = sp.get("brand") ?? "";
  const excludeId = sp.get("excludeId") ?? "";
  const sameBrandLimit = Math.min(Math.max(Number(sp.get("limit") ?? 10), 1), 50);

  try {
    const [variants, sameBrand] = await Promise.all([
      sku ? getVariants(sku, excludeId) : Promise.resolve([]),
      brand ? getSameBrand(brand, excludeId, sameBrandLimit) : Promise.resolve([]),
    ]);
    return NextResponse.json({
      skuRoot: sku ? extractSkuRoot(sku) : null,
      variants,
      sameBrand,
    });
  } catch (err) {
    console.error("[products/variants] error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
};
