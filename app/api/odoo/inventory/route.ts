// DEPRECATED: Odoo integration is inactive. Retained for reference during
// migration to Google Sheets CRM. Safe to remove after 2026-07-01.
import { NextRequest, NextResponse } from "next/server";
import { searchRead, searchCount, isConfigured } from "@/app/lib/odoo";

export const GET = async (req: NextRequest) => {
  if (!isConfigured()) {
    return NextResponse.json({ error: "Odoo not configured" }, { status: 500 });
  }

  const params = req.nextUrl.searchParams;
  const limit = Number(params.get("limit") ?? "100");
  const offset = Number(params.get("offset") ?? "0");
  const search = params.get("search") ?? "";

  const domain: unknown[][] = [["active", "=", true]];
  if (search) domain.push(["name", "ilike", search]);

  try {
    const [products, total] = await Promise.all([
      searchRead(
        "product.product",
        domain,
        [
          "name", "default_code", "list_price", "standard_price",
          "qty_available", "virtual_available", "categ_id", "type",
          "active",
        ],
        limit,
        offset,
        "name asc"
      ),
      searchCount("product.product", domain),
    ]);

    return NextResponse.json({ products, total, limit, offset });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
};
