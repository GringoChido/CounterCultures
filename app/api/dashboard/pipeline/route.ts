import { NextResponse, type NextRequest } from "next/server";
import {
  readSheet,
  appendRow,
  updateRow,
  findRowIndex,
} from "@/app/lib/dashboard-sheets";
import { evaluateAndTransition } from "@/app/lib/rule-engine";
import type { StageRuleTrigger } from "@/app/lib/stage-rules";
import { getCurrentUserEmailFromRequest } from "@/app/lib/auth";

type PipelineRecord = {
  id: string;
  name: string;
  company: string;
  stage: string;
  value: string;
  probability: string;
  expected_close: string;
  owner: string;
  source: string;
  created_at: string;
  notes: string;
  brand_slugs: string; // pipe-separated ("kohler|dornbracht")
  source_message_id: string;
  stage_entered_at: string;
  pending_move_to: string;
  pending_move_at: string;
  date_at_border: string;
  date_customs_cleared: string;
};

const PIPELINE_COLUMNS: (keyof PipelineRecord)[] = [
  "id",
  "name",
  "company",
  "stage",
  "value",
  "probability",
  "expected_close",
  "owner",
  "source",
  "created_at",
  "notes",
  "brand_slugs",
  "source_message_id",
  "stage_entered_at",
  "pending_move_to",
  "pending_move_at",
  "date_at_border",
  "date_customs_cleared",
];

// Fields whose write should trigger a rule-engine evaluation. Anything else
// (name, notes, probability, contact edits) is pure data, not a state signal.
const RULE_TRIGGER_FIELDS = new Set([
  "stage",
  "date_at_border",
  "date_customs_cleared",
  "production_eta_date",
  "tracking_number",
  "date_shipped_origin",
  "date_received_at_cc",
  "scheduled_delivery_datetime",
]);

// GET — list all pipeline deals
export const GET = async (request: NextRequest) => {
  const stage = request.nextUrl.searchParams.get("stage");

  try {
    let deals = await readSheet<PipelineRecord>("Pipeline");

    if (stage && stage !== "all") {
      deals = deals.filter((d) => d.stage === stage);
    }

    return NextResponse.json({ deals });
  } catch (err) {
    console.error("[Pipeline API] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch pipeline deals" },
      { status: 500 }
    );
  }
};

// POST — create a new deal
export const POST = async (request: NextRequest) => {
  try {
    const body: PipelineRecord = await request.json();

    if (!body.id) {
      body.id = `DEAL-${Date.now()}`;
    }
    if (!body.created_at) {
      body.created_at = new Date().toISOString();
    }
    if (!body.stage_entered_at) {
      body.stage_entered_at = body.created_at;
    }

    const values = PIPELINE_COLUMNS.map((col) => body[col] ?? "");
    await appendRow("Pipeline", values);

    return NextResponse.json({ success: true, id: body.id });
  } catch (err) {
    console.error("[Pipeline API] POST error:", err);
    return NextResponse.json(
      { error: "Failed to create deal" },
      { status: 500 }
    );
  }
};

// PATCH — update a deal; fires the rule engine when a triggering field is
// touched (stage-change candidates, Trafico bridge fields, etc.)
export const PATCH = async (request: NextRequest) => {
  try {
    const body: Partial<PipelineRecord> & { id: string } = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const rowIdx = await findRowIndex("Pipeline", "id", body.id);
    if (rowIdx === null) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    const existing = await readSheet<PipelineRecord>("Pipeline");
    const current = existing[rowIdx];
    const merged = { ...current, ...body };
    if (body.stage && body.stage !== current.stage) {
      merged.stage_entered_at = new Date().toISOString();
    }

    const values = PIPELINE_COLUMNS.map((col) => merged[col] ?? "");
    await updateRow("Pipeline", rowIdx, values);

    // Fire rule engine if any triggering field was updated.
    const touchedFields = Object.keys(body).filter(
      (k) => k !== "id" && RULE_TRIGGER_FIELDS.has(k)
    );
    let ruleResult: Awaited<ReturnType<typeof evaluateAndTransition>> | null = null;
    if (touchedFields.length > 0) {
      const trigger: StageRuleTrigger = "deal_field_update";
      const payload: Record<string, unknown> = {};
      for (const k of touchedFields) {
        payload[k] = (body as Record<string, unknown>)[k];
      }
      const actor =
        (await getCurrentUserEmailFromRequest(request)) ??
        request.headers.get("x-actor") ??
        "portal";
      ruleResult = await evaluateAndTransition(trigger, body.id, payload, actor);
    }

    return NextResponse.json({ success: true, ruleResult });
  } catch (err) {
    console.error("[Pipeline API] PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to update deal" },
      { status: 500 }
    );
  }
};
