import { NextRequest, NextResponse } from "next/server";
import { searchRead, searchCount, isConfigured } from "@/app/lib/odoo";

export const GET = async (req: NextRequest) => {
  if (!isConfigured()) {
    return NextResponse.json({ error: "Odoo not configured" }, { status: 500 });
  }

  const params = req.nextUrl.searchParams;
  const state = params.get("state");
  const limit = Number(params.get("limit") ?? "50");
  const offset = Number(params.get("offset") ?? "0");

  const domain: unknown[][] = [];
  if (state && state !== "all") domain.push(["state", "=", state]);

  try {
    const [orders, total] = await Promise.all([
      searchRead(
        "purchase.order",
        domain,
        [
          "name", "partner_id", "date_order", "date_planned",
          "amount_total", "amount_untaxed", "amount_tax",
          "currency_id", "state", "receipt_status", "user_id",
          "create_date",
        ],
        limit,
        offset,
        "date_order desc"
      ),
      searchCount("purchase.order", domain),
    ]);

    return NextResponse.json({ orders, total, limit, offset });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
};
