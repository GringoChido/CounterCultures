import { NextResponse } from "next/server";
import {
  getInvoiceList,
  getOrderList,
  getPurchaseOrderList,
  getInventoryList,
  getPaymentList,
} from "@/app/lib/odoo-sheets";

export const GET = async () => {
  try {
    const [invoices, vendorBills, orders, purchases, inventory, payments] = await Promise.all([
      getInvoiceList({ moveType: "customer", limit: 1 }),
      getInvoiceList({ moveType: "vendor", limit: 1 }),
      getOrderList({ limit: 1 }),
      getPurchaseOrderList({ limit: 1 }),
      getInventoryList({ limit: 1 }),
      getPaymentList({ limit: 1 }),
    ]);

    const { aging } = invoices;
    const { aging: apAging } = vendorBills;
    const { pipeline: orderPipeline } = orders;
    const { pipeline: poPipeline } = purchases;
    const { summary: inventorySummary } = inventory;
    const { summary: paymentSummary } = payments;

    return NextResponse.json({
      ar: {
        openByCurrency: aging.totalOpen,
        overdueCount: aging.overdueCount,
        invoiceCount: aging.invoiceCount,
        ninetyPlusByCurrency: aging["90+"],
      },
      ap: {
        openByCurrency: apAging.totalOpen,
        overdueCount: apAging.overdueCount,
        billCount: apAging.invoiceCount,
        ninetyPlusByCurrency: apAging["90+"],
      },
      orders: {
        staleQuoteCount: orderPipeline.staleQuotes.count,
        staleQuoteByCurrency: orderPipeline.staleQuotes.totalByCurrency,
        toInvoiceCount: orderPipeline.toInvoice.count,
        toInvoiceByCurrency: orderPipeline.toInvoice.totalByCurrency,
      },
      purchases: {
        awaitingInvoiceCount: poPipeline.awaitingInvoice.count,
        awaitingInvoiceByCurrency: poPipeline.awaitingInvoice.totalByCurrency,
        stuckCount: poPipeline.stuck.count,
        stuckByCurrency: poPipeline.stuck.totalByCurrency,
      },
      inventory: {
        lowStock: inventorySummary.lowStock,
        outOfStock: inventorySummary.outOfStock,
        totalProducts: inventorySummary.totalProducts,
      },
      payments: {
        last30InboundByCurrency: paymentSummary.last30Inbound,
        last30OutboundByCurrency: paymentSummary.last30Outbound,
      },
    });
  } catch (err) {
    console.error("[Command Center API] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch command center data" },
      { status: 500 }
    );
  }
};
