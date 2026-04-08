// DEPRECATED: Odoo integration is inactive. Retained for reference during
// migration to Google Sheets CRM. Safe to remove after 2026-07-01.
import { NextRequest, NextResponse } from "next/server";
import { searchRead, searchCount, isConfigured } from "@/app/lib/odoo";

export const GET = async (req: NextRequest) => {
  if (!isConfigured()) {
    return NextResponse.json({ error: "Odoo not configured" }, { status: 500 });
  }

  const params = req.nextUrl.searchParams;
  const paymentState = params.get("payment_state");
  const type = params.get("type") ?? "out_invoice";
  const limit = Number(params.get("limit") ?? "50");
  const offset = Number(params.get("offset") ?? "0");

  const domain: unknown[][] = [["move_type", "=", type]];
  if (paymentState && paymentState !== "all") {
    domain.push(["payment_state", "=", paymentState]);
  }

  try {
    const [invoices, total] = await Promise.all([
      searchRead(
        "account.move",
        domain,
        [
          "name", "partner_id", "invoice_date", "invoice_date_due",
          "amount_total", "amount_residual", "amount_untaxed",
          "amount_tax", "currency_id", "state", "payment_state",
          "move_type", "create_date",
        ],
        limit,
        offset,
        "invoice_date desc"
      ),
      searchCount("account.move", domain),
    ]);

    return NextResponse.json({ invoices, total, limit, offset });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
};
