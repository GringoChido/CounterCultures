import { NextResponse } from "next/server";
import { searchRead, searchCount, authenticate, execute, isConfigured } from "@/app/lib/odoo";
import type { OdooDashboardSummary } from "@/app/lib/odoo";

export const GET = async () => {
  if (!isConfigured()) {
    return NextResponse.json({ error: "Odoo not configured" }, { status: 500 });
  }

  try {
    const uid = await authenticate();

    // Use read_group for aggregated totals — much faster than fetching all records
    const readGroup = async (
      model: string,
      domain: unknown[][],
      fields: string[],
      groupby: string[] = []
    ) => execute(uid, model, "read_group", [domain, fields, groupby], {});

    // Batch 1: counts (lightweight)
    const [
      customerCount,
      supplierCount,
      contactTotal,
      salesDraft,
      salesConfirmed,
      salesDone,
      salesTotal,
      invoicesPaid,
      invoicesNotPaid,
      invoicesOverdue,
      invoicesTotal,
      purchasesDraft,
      purchasesConfirmed,
      purchasesTotal,
    ] = await Promise.all([
      searchCount("res.partner", [["customer_rank", ">", 0]]),
      searchCount("res.partner", [["supplier_rank", ">", 0]]),
      searchCount("res.partner", []),
      searchCount("sale.order", [["state", "=", "draft"]]),
      searchCount("sale.order", [["state", "=", "sale"]]),
      searchCount("sale.order", [["state", "=", "done"]]),
      searchCount("sale.order", []),
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
      searchCount("purchase.order", [["state", "=", "draft"]]),
      searchCount("purchase.order", [["state", "=", "purchase"]]),
      searchCount("purchase.order", []),
    ]);

    // Batch 2: aggregated totals via read_group (single query each)
    let totalRevenue = 0;
    let totalReceivable = 0;
    let totalSpend = 0;

    try {
      const [salesAgg, invoiceAgg, purchaseAgg] = await Promise.all([
        readGroup(
          "sale.order",
          [["state", "in", ["sale", "done"]]],
          ["amount_total:sum"],
          []
        ),
        readGroup(
          "account.move",
          [
            ["move_type", "=", "out_invoice"],
            ["payment_state", "in", ["not_paid", "partial"]],
          ],
          ["amount_residual:sum"],
          []
        ),
        readGroup(
          "purchase.order",
          [["state", "in", ["purchase", "done"]]],
          ["amount_total:sum"],
          []
        ),
      ]);

      const salesResult = salesAgg as Record<string, unknown>[];
      const invoiceResult = invoiceAgg as Record<string, unknown>[];
      const purchaseResult = purchaseAgg as Record<string, unknown>[];

      if (salesResult?.[0]) totalRevenue = (salesResult[0].amount_total as number) ?? 0;
      if (invoiceResult?.[0]) totalReceivable = (invoiceResult[0].amount_residual as number) ?? 0;
      if (purchaseResult?.[0]) totalSpend = (purchaseResult[0].amount_total as number) ?? 0;
    } catch {
      // Fallback: fetch limited records if read_group fails
      const [recentSales, unpaidInvoices, recentPurchases] = await Promise.all([
        searchRead("sale.order", [["state", "in", ["sale", "done"]]], ["amount_total"], 100, 0, "date_order desc"),
        searchRead("account.move", [["move_type", "=", "out_invoice"], ["payment_state", "in", ["not_paid", "partial"]]], ["amount_residual"], 100),
        searchRead("purchase.order", [["state", "in", ["purchase", "done"]]], ["amount_total"], 100, 0, "date_order desc"),
      ]);

      totalRevenue = (recentSales as Record<string, unknown>[]).reduce((s, o) => s + ((o.amount_total as number) ?? 0), 0);
      totalReceivable = (unpaidInvoices as Record<string, unknown>[]).reduce((s, o) => s + ((o.amount_residual as number) ?? 0), 0);
      totalSpend = (recentPurchases as Record<string, unknown>[]).reduce((s, o) => s + ((o.amount_total as number) ?? 0), 0);
    }

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
