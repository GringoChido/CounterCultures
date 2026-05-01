import { NextResponse, type NextRequest } from "next/server";
import { appendRow, readSheet } from "@/app/lib/dashboard-sheets";
import {
  generateOwnerBrief,
  type BriefDealRow,
  type BriefTraficoRow,
  type OwnerMorningBrief,
} from "@/app/lib/morning-brief";
import type { PipelineStage } from "@/app/lib/sample-dashboard-data";

/**
 * GET /api/dashboard/morning-brief
 *
 * Generates Roger's morning brief from current Pipeline + Deal_Payments +
 * Purchase_Orders + Traficos state. Cached in-process for 5 min — pass
 * `?refresh=1` to bypass (the UI's Refresh button does this). Each cache
 * miss appends a snapshot row to Morning_Briefs so the email job and a
 * future "yesterday's brief" view can read from the same source.
 */

type PipelineRow = Record<string, string>;
type PaymentRow = Record<string, string>;
type PoRow = Record<string, string>;
type TraficoRow = Record<string, string>;

const CACHE_TTL_MS = 5 * 60 * 1000;
let CACHE: { ts: number; brief: OwnerMorningBrief } | null = null;

const ROGER_EMAIL = "roger@countercultures.com.mx";

const persistBrief = async (brief: OwnerMorningBrief, userEmail: string) => {
  // Append-only. Latest row per (date, user) wins downstream.
  // Failures here must not break the user-facing response — log and move on.
  try {
    const ts = Date.now();
    const date = brief.generatedAt.slice(0, 10);
    await appendRow("Morning_Briefs", [
      `BRIEF-${date}-${ts}`,
      date,
      userEmail,
      brief.generatedAt,
      JSON.stringify(brief),
    ]);
  } catch (err) {
    console.error("[Morning brief API] persist failed:", err);
  }
};

export const GET = async (request: NextRequest) => {
  const bypass = request.nextUrl.searchParams.get("refresh") === "1";

  if (!bypass && CACHE && Date.now() - CACHE.ts < CACHE_TTL_MS) {
    return NextResponse.json(
      { brief: CACHE.brief, cached: true },
      { headers: { "Cache-Control": "private, max-age=300" } },
    );
  }

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
      user: { email: ROGER_EMAIL, name: "Roger", role: "owner" },
      deals,
      traficos,
    });

    CACHE = { ts: Date.now(), brief };
    // Don't await — persistence shouldn't gate the response. Errors are
    // logged inside persistBrief.
    void persistBrief(brief, ROGER_EMAIL);

    return NextResponse.json(
      { brief, cached: false },
      { headers: { "Cache-Control": "private, max-age=300" } },
    );
  } catch (err) {
    console.error("[Morning brief API] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate brief" },
      { status: 500 },
    );
  }
};
