/**
 * Pre-move control surface for deals with value > PREMOVE_THRESHOLD_MXN.
 *
 *   DELETE  /api/dashboard/pipeline/pending-move/[dealId]    — cancel
 *           Clears pending_move_to / pending_move_at and emits a
 *           pending_move_cancelled Deal_Events row. Roger uses this when
 *           a queued auto-move is wrong.
 *
 *   POST    /api/dashboard/pipeline/pending-move/[dealId]    — execute now
 *           Forces immediate execution of the queued transition, bypassing
 *           the 2h cool-off. Body: { trigger: StageRuleTrigger } — defaults
 *           to "manual" when omitted.
 */

import { NextResponse, type NextRequest } from "next/server";
import {
  readSheet,
  findRowIndex,
  updateRow,
} from "@/app/lib/dashboard-sheets";
import { writePipelineFields } from "@/app/lib/rule-engine";
import { appendDealEvent, getDealEvents } from "@/app/lib/deal-events";
import { getCurrentUserEmailFromRequest } from "@/app/lib/auth";
import { dispatchAlertsForTransition } from "@/app/lib/alert-dispatcher";
import type { PipelineStage, PipelineDeal } from "@/app/lib/sample-dashboard-data";

type PipelineRow = Record<string, string>;

const loadDeal = async (dealId: string): Promise<PipelineRow | null> => {
  const rows = await readSheet<PipelineRow>("Pipeline");
  return rows.find((r) => r.id === dealId) ?? null;
};

// Cancel a pending move: clear the pending_* fields + audit
export const DELETE = async (
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string }> }
) => {
  const { dealId } = await params;
  const actor =
    (await getCurrentUserEmailFromRequest(request)) ??
    request.headers.get("x-actor") ??
    "portal";

  const deal = await loadDeal(dealId);
  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }
  if (!deal.pending_move_to) {
    return NextResponse.json(
      { error: "No pending move to cancel" },
      { status: 409 }
    );
  }

  const targetStage = deal.pending_move_to;
  await writePipelineFields(dealId, {
    pending_move_to: "",
    pending_move_at: "",
  });

  const event = await appendDealEvent({
    deal_id: dealId,
    actor,
    event_type: "pending_move_cancelled",
    from_stage: deal.stage,
    to_stage: targetStage,
    payload: { cancelled_at: new Date().toISOString() },
  });

  return NextResponse.json({ ok: true, newEventId: event.event_id });
};

// Execute the queued transition immediately. We commit whatever the
// pending_move_to field currently says, using the original rule_id from the
// latest pending_move Deal_Events row (so the audit chain stays coherent).
export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string }> }
) => {
  const { dealId } = await params;
  const actor =
    (await getCurrentUserEmailFromRequest(request)) ??
    request.headers.get("x-actor") ??
    "portal";

  const deal = await loadDeal(dealId);
  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }
  if (!deal.pending_move_to) {
    return NextResponse.json(
      { error: "No pending move to execute" },
      { status: 409 }
    );
  }

  // Find the most recent pending_move event for this deal to preserve
  // the original rule_id. If nothing found (unusual: pending field set
  // without a corresponding audit row), fall back to a generic id.
  const history = await getDealEvents(dealId);
  const latestPending = [...history]
    .reverse()
    .find((e) => e.event_type === "pending_move");
  const originalRuleId = latestPending?.trigger_rule_id ?? "premove-execute";
  const fromStage = deal.stage as PipelineStage;
  const toStage = deal.pending_move_to as PipelineStage;
  const now = new Date().toISOString();

  // Commit the transition directly
  await writePipelineFields(dealId, {
    stage: toStage,
    stage_entered_at: now,
    pending_move_to: "",
    pending_move_at: "",
  });

  const event = await appendDealEvent({
    deal_id: dealId,
    actor,
    event_type: "stage_change",
    from_stage: fromStage,
    to_stage: toStage,
    trigger_rule_id: originalRuleId,
    payload: { executed_early: true, original_queue_event: latestPending?.event_id },
  });

  // W8: same fire-and-forget alert dispatch as the rule engine path.
  // The flat Pipeline row we loaded is a PipelineRecord; we coerce it to
  // the minimal PipelineDeal shape the dispatcher needs.
  const minimalDeal: PipelineDeal = {
    id: deal.id,
    name: deal.name ?? "",
    contactName: deal.company ?? "",
    value: Number(deal.value) || 0,
    currency: "MXN",
    stage: toStage,
    probability: Number(deal.probability) || 0,
    expectedClose: deal.expected_close ?? "",
    assignedRep: deal.owner ?? "",
    products: "",
    createdAt: deal.created_at ?? "",
    notes: deal.notes ?? "",
    contactCompany: deal.company ?? undefined,
    brandSlugs: deal.brand_slugs ? deal.brand_slugs.split("|").filter(Boolean) : undefined,
  };
  dispatchAlertsForTransition({
    ruleId: originalRuleId,
    dealId,
    fromStage,
    toStage,
    deal: minimalDeal,
    actor,
  }).catch((err) => console.error("[pending-move execute] alert dispatch failed:", err));

  return NextResponse.json({
    ok: true,
    result: {
      type: "moved",
      ruleId: originalRuleId,
      fromStage,
      toStage,
      eventId: event.event_id,
    },
  });
};
