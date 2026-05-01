import { NextResponse, type NextRequest } from "next/server";
import { readSheet } from "@/app/lib/dashboard-sheets";
import {
  generateOwnerBrief,
  type BriefDealRow,
  type BriefTraficoRow,
} from "@/app/lib/morning-brief";
import type { PipelineStage } from "@/app/lib/sample-dashboard-data";

/**
 * GET /api/dashboard/morning-brief
 *
 * Generates Roger's morning brief on demand from current Pipeline +
 * Deal_Payments + Purchase_Orders + Traficos state. v0 doesn't yet
 * persist to a Morning_Briefs sheet — Roger pulls fresh on each load,
 * which keeps the surface trivially correct while we tune the content.
 * Once the content is approved we'll add the cron + sheet persistence
 * so the brief becomes a real day-stamped artifact (and so the email
 * delivery can read from the same source).
 */

type PipelineRow = Record<string, string>;
type PaymentRow = Record<string, string>;
type PoRow = Record<string, string>;
type TraficoRow = Record<string, string>;

export const GET = async (_request: NextRequest) => {
  try {
    const [pipelineRows, paymentRows, poRows, traficoRows] = await Promise.all([
      readSheet<PipelineRow>("Pipeline").catch(() => [] as PipelineRow[]),
      readSheet<PaymentRow>("Deal_Payments").catch(() => [] as PaymentRow[]),
      readSheet<PoRow>("Purchase_Orders").catch(() => [] as PoRow[]),
      readSheet<TraficoRow>("Traficos").catch(() => [] as TraficoRow[]),
    ]);

    // Index per-deal: any paid deposit + any PO row
    const paidDealIds = new Set(
      paymentRows
        .filter((p) => p.Status === "paid")
        .map((p) => p.Deal_ID),
    );
    const poDealIds = new Set(poRows.map((p) => p.Deal_ID));

    // Detect whether brief-only columns exist on the Pipeline sheet.
    // readSheet seeds every header as a row key, so a missing column
    // means the key never appears. Without this guard, a missing
    // `requires_cfdi` column would flood "Needs you" with a CFDI-question
    // action on every deal older than 24h.
    const sample = pipelineRows[0];
    const hasCfdiColumn = sample ? "requires_cfdi" in sample : true;
    if (!hasCfdiColumn) {
      console.warn(
        "[Morning brief] Pipeline sheet missing 'requires_cfdi' column — CFDI-question rule disabled",
      );
    }

    const deals: BriefDealRow[] = pipelineRows.map((r) => ({
      id: r.id,
      name: r.name || "(untitled)",
      contactName: r.company || "",
      stage: (r.stage as PipelineStage) || "discovery",
      value: parseFloat(r.value) || 0,
      currency: "MXN",
      source: r.source || "",
      createdAt: r.created_at || new Date().toISOString(),
      stageEnteredAt: r.stage_entered_at || r.created_at || undefined,
      // `??` not `||` so we preserve the difference between
      // "column present, cell empty" (rule should fire) and
      // "column absent" (rule should be inert).
      requiresCfdi: hasCfdiColumn ? (r.requires_cfdi ?? "") : undefined,
      constanciaDriveFileId: r.constancia_drive_file_id || undefined,
      hasPaidDeposit: paidDealIds.has(r.id),
      hasPo: poDealIds.has(r.id),
      deliveryWindowStart: r.delivery_window_start || undefined,
      deliveryPhoneConfirmedAt: r.delivery_phone_confirmed_at || undefined,
    }));

    const traficos: BriefTraficoRow[] = traficoRows.map((t) => ({
      id: t.TRF_ID,
      traficoNumber: t.Trafico_Number,
      status: t.Status,
      initiatedDate: t.Initiated_Date || undefined,
    }));

    // v0: hardcoded owner role. When we expand to finance + sales, look
    // up the current user's role from the session and dispatch on it.
    const brief = generateOwnerBrief({
      generatedAt: new Date().toISOString(),
      user: { email: "roger@countercultures.com.mx", name: "Roger", role: "owner" },
      deals,
      traficos,
    });

    return NextResponse.json({ brief });
  } catch (err) {
    console.error("[Morning brief API] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate brief" },
      { status: 500 },
    );
  }
};
