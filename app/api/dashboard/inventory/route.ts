import { NextResponse, type NextRequest } from "next/server";
import { getInventoryList, type InventoryListFilters } from "@/app/lib/odoo-sheets";

export const GET = async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams;
  const filters: InventoryListFilters = {
    q: sp.get("q") ?? "",
    locationId: sp.get("locationId") ?? undefined,
    lowStockOnly: sp.get("lowStockOnly") === "true",
    outOfStockOnly: sp.get("outOfStockOnly") === "true",
    sort: (sp.get("sort") ?? "product") as InventoryListFilters["sort"],
    limit: Math.min(Number(sp.get("limit") ?? 500), 2000),
    offset: Math.max(Number(sp.get("offset") ?? 0), 0),
  };
  try {
    const result = await getInventoryList(filters);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[inventory API] error:", err);
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
};
