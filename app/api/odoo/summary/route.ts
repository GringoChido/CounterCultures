import { NextResponse } from "next/server";
import { searchCount, authenticate, execute, isConfigured } from "@/app/lib/odoo";
import type { OdooDashboardSummary } from "@/app/lib/odoo";

export const maxDuration = 30;

export const GET = async () => {
  if (!isConfigured()) {
    return NextResponse.json({ error: "Odoo not configured" }, { status: 500 });
  }

  try {
    const uid = await authenticate();

    const readGroup = async (
      model: string,
      domain: unknown[][],
      fields: string[]
    ): Promise<Record<string, unknown>[]> => {
      const result = await execute(
        uid, model, "read_group",
        [domain, fields, []],
        { lazy: false }
      );
      return result as Record<string, unknown>[];
    };

    // Batch 1: contact counts
    const [customerCount, supplierCount, contactTotal] = await Promise.all([
      searchCount("res.partner", [["customer_rank", ">", 0]]),
      searchCount("res.partner", [["supplier_rank", ">", 0]]),
      searchCount("res.partner", []),
    ]);

    // Batch 2: sales counts
    const [salesDraft, salesConfirmed, salesDone, salesTotal] = await Promise.all([
      searchCount("sale.order", [["state", "=", "draft"]]),
      searchCount("sale.order", [["state", "=", "sale"]]),
      searchCount("sale.order", [["state", "=", "done"]]),
      searchCount("sale.order", []),
    ]);

    // Batch 3: invoice counts
    const [invoicesPaid, invoicesNotPaid, invoicesOverdue, invoicesTotal] = await Promise.all([
      searchCount("account.move", [["move_type", "=", "out_invoice"], ["payment_state", "=", "paid"]]),
      searchCount("account.move", [["move_type", "=", "out_invoice"], ["payment_state", "=", "not_paid"]]),
      searchCount("account.move", [["move_type", "=", "out_invoice"], ["payment_state", "=", "not_paid"], ["invoice_date_due", "<", new Date().toISOString().split("T")[0]]]),
      searchCount("account.move", [["move_type", "=", "out_invoice"]]),
    ]);

    // Batch 4: purchase counts
    const [purchasesDraft, purchasesConfirmed, purchasesTotal] = await Promise.all([
      searchCount("purchase.order", [["state", "=", "draft"]]),
      searchCount("purchase.order", [["state", "=", "purchase"]]),
      searchCount("purchase.order", []),
    ]);

    // Batch 5: aggregated totals
    let totalRevenue = 0;
    let totalReceivable = 0;
    let totalSpend = 0;

    try {
      const [salesAgg, invoiceAgg, purchaseAgg] = await Promise.all([
        readGroup("sale.order", [["state", "in", ["sale", "done"]]], ["amount_total"]),
        readGroup("account.move", [["move_type", "=", "out_invoice"], ["payment_state", "in", ["not_paid", "partial"]]], ["amount_residual"]),
        readGroup("purchase.order", [["state", "in", ["purchase", "done"]]], ["amount_total"]),
      ]);

      if (salesAgg?.[0]) totalRevenue = (salesAgg[0].amount_total as number) ?? 0;
      if (invoiceAgg?.[0]) totalReceivable = (invoiceAgg[0].amount_residual as number) ?? 0;
      if (purchaseAgg?.[0]) totalSpend = (purchaseAgg[0].amount_total as number) ?? 0;
    } catch {
      // read_group failed — totals stay 0
    }

    const summary: OdooDashboardSummary = {
      contacts: { total: contactTotal, customers: customerCount, suppliers: supplierCount },
      sales: { total: salesTotal, draft: salesDraft, confirmed: salesConfirmed, done: salesDone, totalRevenue, currency: "MXN" },
      invoices: { total: invoicesTotal, paid: invoicesPaid, unpaid: invoicesNotPaid, overdue: invoicesOverdue, totalReceivable, currency: "MXN" },
      purchases: { total: purchasesTotal, draft: purchasesDraft, confirmed: purchasesConfirmed, totalSpend, currency: "MXN" },
    };

    return NextResponse.json(summary);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
};
