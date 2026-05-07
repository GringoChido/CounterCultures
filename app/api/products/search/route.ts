import { NextResponse, type NextRequest } from "next/server";
import { searchProducts } from "@/app/lib/products-full";

export const GET = async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q") ?? "";
  if (q.trim().length < 2) {
    return NextResponse.json({ items: [], total: 0 });
  }
  const limit = Math.min(Math.max(Number(sp.get("limit") ?? 6), 1), 20);

  const result = await searchProducts({ q, limit, offset: 0, sort: "relevance" });

  const items = result.items.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    brand: p.brand,
    category: p.category,
    listPrice: p.listPrice,
    currency: p.currency,
  }));

  return NextResponse.json({ items, total: result.total });
};
