import { NextResponse } from "next/server";
import { searchCount, authenticate, execute, isConfigured } from "@/app/lib/odoo";
import type { OdooDashboardSummary } from "@/app/lib/odoo";

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

    // All counts + aggregations in parallel
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
      salesAgg,
      invoiceAgg,
      purchaseAgg,
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
      readGroup("sale.order", [["state", "in", ["sale", "done"]]], ["amount_total"]),
      readGroup("account.move", [["move_type", "=", "out_invoice"], ["payment_state", "in", ["not_paid", "partial"]]], ["amount_residual"]),
      readGroup("purchase.order", [["state", "in", ["purchase", "done"]]], ["amount_total"]),
    ]);

    const totalRevenue = (salesAgg[0]?.amount_total as number) ?? 0;
    const totalReceivable = (invoiceAgg[0]?.amount_residual as number) ?? 0;
    const totalSpend = (purchaseAgg[0]?.amount_total as number) ?? 0;

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
