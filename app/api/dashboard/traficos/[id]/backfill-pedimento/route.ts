/**
 * POST /api/dashboard/traficos/[id]/backfill-pedimento
 *
 * Writes the pedimento # to the `ref` field of every Odoo invoice/bill
 * linked to this tráfico's items. Rule 20 in CLAUDE-FINANCE-RULES.
 */

import { NextResponse, type NextRequest } from "next/server";
import { requireFeature, FeatureDeniedError } from "@/app/lib/auth";
import { readSheet, appendRow } from "@/app/lib/dashboard-sheets";
import { backfillPedimentoNumber } from "@/app/lib/odoo/write";

interface FlatTraficoRow extends Record<string, string> {
  TRF_ID: string;
  Pedimento_Number: string;
}

interface FlatItemRow extends Record<string, string> {
  TRF_ID: string;
  Vendor_Invoice_Number: string;
}

interface OdooInvoiceRow extends Record<string, string> {
  id: string;
  name: string;
  ref: string;
  invoice_origin: string;
}

export const POST = async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> => {
  try {
    const user = await requireFeature("view_shipments");
    const { id } = await params;

    const traficos = await readSheet<FlatTraficoRow>("Traficos");
    const trafico = traficos.find((t) => t.TRF_ID === id);
    if (!trafico) {
      return NextResponse.json({ error: "Trafico not found" }, { status: 404 });
    }
    if (!trafico.Pedimento_Number) {
      return NextResponse.json(
        { error: "No pedimento number set on this tráfico" },
        { status: 400 }
      );
    }

    const items = (await readSheet<FlatItemRow>("Trafico_Items")).filter(
      (i) => i.TRF_ID === id
    );
    const vendorInvoiceNumbers = items
      .map((i) => i.Vendor_Invoice_Number)
      .filter(Boolean);

    const odooInvoices = await readSheet<OdooInvoiceRow>("Odoo_Invoices");
    const matchedIds = odooInvoices
      .filter((inv) => {
        const origin = inv.invoice_origin || "";
        const ref = inv.ref || "";
        const name = inv.name || "";
        return vendorInvoiceNumbers.some(
          (vn) => origin.includes(vn) || ref.includes(vn) || name.includes(vn)
        );
      })
      .map((inv) => parseInt(inv.id, 10))
      .filter((n) => !isNaN(n));

    if (matchedIds.length === 0) {
      return NextResponse.json({
        success: true,
        updatedCount: 0,
        message: "No matching Odoo invoices/bills found for this tráfico's items",
      });
    }

    const result = await backfillPedimentoNumber(
      matchedIds,
      trafico.Pedimento_Number
    );

    const logId = `EA-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    appendRow("Activity_Log", [
      logId,
      new Date().toISOString(),
      user.email,
      "backfill_pedimento",
      "trafico",
      id,
      JSON.stringify({
        pedimento_number: trafico.Pedimento_Number,
        updated_invoice_ids: result.invoiceIds,
        matched_count: matchedIds.length,
      }),
    ]).catch((err) =>
      console.error("[backfill-pedimento] Activity_Log append failed:", err)
    );

    return NextResponse.json({
      success: true,
      updatedCount: result.updatedCount,
      matchedCount: matchedIds.length,
      pedimentoNumber: trafico.Pedimento_Number,
    });
  } catch (err) {
    if (err instanceof FeatureDeniedError) {
      return NextResponse.json(
        { error: "Forbidden", feature: err.feature },
        { status: 403 }
      );
    }
    console.error("[backfill-pedimento] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "backfill_failed" },
      { status: 500 }
    );
  }
};
