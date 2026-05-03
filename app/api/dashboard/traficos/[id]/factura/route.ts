/**
 * R4 Note 6 — sub-gap 6c: 3-way reconciliation surface.
 *
 * POST: record the broker's final factura. Computes the variance vs.
 * the cálculo (broker's pre-import tax estimate) and surfaces a
 * pass/warning/error level. Persists facturaAmount + facturaDifference
 * + Drive doc id + new status to the Traficos sheet.
 *
 * The 3-way piece is: vendor invoice subtotals (per-item) →
 * cálculo total → broker's final factura. This route owns the last
 * leg (cálculo → factura). The vendor-invoice ↔ cálculo leg already
 * gets recorded as items land in Trafico_Items; the comparison is
 * derived in the UI.
 */

import { NextResponse, type NextRequest } from "next/server";
import {
  appendRow,
  findRowIndex,
  readSheet,
  updateRowByHeader,
} from "@/app/lib/dashboard-sheets";
import { requireFeature, FeatureDeniedError } from "@/app/lib/auth";

interface FlatTraficoRow extends Record<string, string> {
  TRF_ID: string;
  Status: string;
  Status_History_JSON: string;
  Calculo_Total_MXN: string;
  Factura_Amount: string;
  Factura_Difference: string;
  Factura_Drive_ID: string;
}

interface PostBody {
  facturaAmount: number;
  facturaDocId?: string;
}

const computeVariance = (
  facturaAmount: number,
  calculoTotal: number
): { variance: number; level: "pass" | "warning" | "error"; pct: number } => {
  const variance = facturaAmount - calculoTotal;
  const pct = calculoTotal > 0 ? Math.abs(variance / calculoTotal) : 0;
  let level: "pass" | "warning" | "error" = "pass";
  if (pct > 0.05) level = "error";
  else if (pct > 0.01) level = "warning";
  return { variance: Math.round(variance * 100) / 100, level, pct };
};

export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> => {
  try {
    const user = await requireFeature("view_shipments");
    const { id } = await params;
    const body = (await request.json()) as PostBody;
    if (!Number.isFinite(body.facturaAmount) || body.facturaAmount <= 0) {
      return NextResponse.json(
        { error: "facturaAmount must be a positive number" },
        { status: 400 }
      );
    }

    const flatTraficos = await readSheet<FlatTraficoRow>("Traficos");
    const flat = flatTraficos.find((t) => t.TRF_ID === id);
    if (!flat) {
      return NextResponse.json({ error: "Trafico not found" }, { status: 404 });
    }

    const calculoTotal = parseFloat(flat.Calculo_Total_MXN || "0") || 0;
    const { variance, level, pct } = computeVariance(body.facturaAmount, calculoTotal);

    const now = new Date().toISOString();
    let history: { status: string; timestamp: string; note?: string; actor?: string }[] = [];
    try {
      history = JSON.parse(flat.Status_History_JSON || "[]");
    } catch {
      history = [];
    }
    history.push({
      status: "factura-received",
      timestamp: now,
      actor: user.email,
      note: `Factura $${body.facturaAmount.toFixed(2)} MXN · variance ${variance >= 0 ? "+" : ""}${variance.toFixed(2)} (${level})`,
    });

    const rowIdx = await findRowIndex("Traficos", "TRF_ID", id);
    if (rowIdx === null) {
      return NextResponse.json({ error: "Trafico row not found" }, { status: 404 });
    }
    await updateRowByHeader("Traficos", rowIdx, {
      Status: "factura-received",
      Status_History_JSON: JSON.stringify(history),
      Factura_Amount: String(body.facturaAmount),
      Factura_Difference: String(variance),
      ...(body.facturaDocId ? { Factura_Drive_ID: body.facturaDocId } : {}),
    });

    const logId = `EA-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    appendRow("Activity_Log", [
      logId,
      now,
      user.email,
      "factura_received",
      "trafico",
      id,
      JSON.stringify({
        factura_amount: body.facturaAmount,
        calculo_total: calculoTotal,
        variance,
        variance_pct: Math.round(pct * 10000) / 100,
        level,
        factura_drive_id: body.facturaDocId ?? null,
      }),
    ]).catch((err) =>
      console.error("[factura] Activity_Log append failed:", err)
    );

    return NextResponse.json({
      success: true,
      facturaAmount: body.facturaAmount,
      calculoTotal,
      variance,
      level,
    });
  } catch (err) {
    if (err instanceof FeatureDeniedError) {
      return NextResponse.json(
        { error: "Forbidden", feature: err.feature },
        { status: 403 }
      );
    }
    console.error("[factura] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "factura_failed" },
      { status: 500 }
    );
  }
};
