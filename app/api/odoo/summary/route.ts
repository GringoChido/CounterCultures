import { NextResponse } from "next/server";
import { searchRead, searchCount, isConfigured } from "@/app/lib/odoo";
import type { OdooDashboardSummary } from "@/app/lib/odoo";

export const GET = async () => {
  if (!isConfigured()) {
    return NextResponse.json({ error: "Odoo not configured" }, { status: 500 });
  }

  try {
    const [
      customerCount,
      supplierCount,
      contactTotal,
      salesDraft,
      salesConfirmed,
      salesDone,
      salesTotal,
      recentSales,
      invoicesPaid,
      invoicesNotPaid,
      invoicesOverdue,
      invoicesTotal,
      unpaidInvoices,
      purchasesDraft,
      purchasesConfirmed,
      purchasesTotal,
      recentPurchases,
    ] = await Promise.all([
      searchCount("res.partner", [["customer_rank", ">", 0]]),
      searchCount("res.partner", [["supplier_rank", ">", 0]]),
      searchCount("res.partner", []),
      searchCount("sale.order", [["state", "=", "draft"]]),
      searchCount("sale.order", [["state", "=", "sale"]]),
      searchCount("sale.order", [["state", "=", "done"]]),
      searchCount("sale.order", []),
      searchRead(
        "sale.order",
        [["state", "in", ["sale", "done"]]],
        ["amount_total", "currency_id"],
        500,
        0,
        "date_order desc"
      ),
      searchCount("account.move", [
        ["move_type", "=", "out_invoice"],
        ["payment_state", "=", "paid"],
      ]),
      searchCount("account.move", [
        ["move_type", "=", "out_invoice"],
        ["payment_state", "=", "not_paid"],
      ]),
      searchCount("account.move", [
        ["move_type", "=", "out_invoice"],
        ["payment_state", "=", "not_paid"],
        ["invoice_date_due", "<", new Date().toISOString().split("T")[0]],
      ]),
      searchCount("account.move", [["move_type", "=", "out_invoice"]]),
      searchRead(
        "account.move",
        [
          ["move_type", "=", "out_invoice"],
          ["payment_state", "in", ["not_paid", "partial"]],
        ],
        ["amount_residual", "currency_id"],
        500
      ),
      searchCount("purchase.order", [["state", "=", "draft"]]),
      searchCount("purchase.order", [["state", "=", "purchase"]]),
      searchCount("purchase.order", []),
      searchRead(
        "purchase.order",
        [["state", "in", ["purchase", "done"]]],
        ["amount_total", "currency_id"],
        500,
        0,
        "date_order desc"
      ),
    ]);

    const totalRevenue = (recentSales as Record<string, unknown>[]).reduce(
      (sum, o) => sum + (o.amount_total as number),
      0
    );

    const totalReceivable = (unpaidInvoices as Record<string, unknown>[]).reduce(
      (sum, o) => sum + (o.amount_residual as number),
      0
    );

    const totalSpend = (recentPurchases as Record<string, unknown>[]).reduce(
      (sum, o) => sum + (o.amount_total as number),
      0
    );

    const summary: OdooDashboardSummary = {
      contacts: {
        total: contactTotal,
        customers: customerCount,
        suppliers: supplierCount,
      },
      sales: {
        total: salesTotal,
        draft: salesDraft,
        confirmed: salesConfirmed,
        done: salesDone,
        totalRevenue,
        currency: "MXN",
      },
      invoices: {
        total: invoicesTotal,
        paid: invoicesPaid,
        unpaid: invoicesNotPaid,
        overdue: invoicesOverdue,
        totalReceivable,
        currency: "MXN",
      },
      purchases: {
        total: purchasesTotal,
        draft: purchasesDraft,
        confirmed: purchasesConfirmed,
        totalSpend,
        currency: "MXN",
      },
    };

    return NextResponse.json(summary);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
};
