/**
 * Stage automation rule engine — pure matcher + I/O executor.
 *
 * Per design doc §4.2:
 *   - matchRule() is pure: takes trigger + deal + context, returns first
 *     StageRule whose fromStages, trigger and predicate all match. No I/O.
 *   - evaluateAndTransition() is the I/O wrapper: loads the deal, builds
 *     context, calls matchRule, writes the outcome (transition, pending_move,
 *     or no-match) and appends the corresponding Deal_Events row.
 *   - rollback() reverts a prior stage_change within the 24h window.
 *
 * Exposed to unit tests:
 *   matchRule, shouldRequirePreMove (pure — no I/O)
 */

import { appendDealEvent } from "./deal-events";
import { readSheet, updateRow, findRowIndex } from "./dashboard-sheets";
import {
  STAGE_RULES,
  PREMOVE_THRESHOLD_MXN,
  type StageRule,
  type StageRuleTrigger,
  type StageRuleContext,
} from "./stage-rules";
import type {
  PipelineDeal,
  PipelineStage,
} from "./sample-dashboard-data";

// ---------------------------------------------------------------------------
// RuleResult
// ---------------------------------------------------------------------------

export type RuleResult =
  | { type: "no_match" }
  | {
      type: "moved";
      ruleId: string;
      fromStage: PipelineStage;
      toStage: PipelineStage;
      eventId: string;
    }
  | {
      type: "pending_move";
      ruleId: string;
      toStage: PipelineStage;
      executeAt: string;
      eventId: string;
    };

// ---------------------------------------------------------------------------
// Pure matcher — callable from unit tests without any I/O.
// ---------------------------------------------------------------------------

export const matchRule = (
  trigger: StageRuleTrigger,
  deal: PipelineDeal,
  ctx: StageRuleContext
): StageRule | null => {
  for (const rule of STAGE_RULES) {
    if (rule.trigger !== trigger) continue;
    if (!rule.fromStages.includes(deal.stage)) continue;
    try {
      if (rule.predicate(ctx)) return rule;
    } catch {
      // predicate errored (bad payload shape, etc) — treat as non-match
      continue;
    }
  }
  return null;
};

export const shouldRequirePreMove = (deal: PipelineDeal): boolean =>
  deal.value > PREMOVE_THRESHOLD_MXN;

// ---------------------------------------------------------------------------
// I/O executor — called from API routes + webhook + cron.
// ---------------------------------------------------------------------------

const PREMOVE_COOLOFF_MS = 2 * 60 * 60 * 1000; // 2 hours

/**
 * Evaluate rules for a given trigger and execute the matching transition
 * (or queue a pending_move for high-value deals). Writes a Deal_Events row
 * regardless of outcome category so every evaluation is auditable.
 */
export const evaluateAndTransition = async (
  trigger: StageRuleTrigger,
  dealId: string,
  payload: Record<string, unknown>,
  actor: string
): Promise<RuleResult> => {
  const deal = await loadDeal(dealId);
  if (!deal) return { type: "no_match" };

  const ctx: StageRuleContext = {
    deal,
    event: { trigger, payload, actor },
    payments: deal.payments ?? [],
    purchaseOrders: deal.purchaseOrders ?? [],
    trafico: undefined,
  };

  const rule = matchRule(trigger, deal, ctx);
  if (!rule) return { type: "no_match" };

  // Pre-move threshold — high-value deals wait 2h before executing.
  // Bypass when caller passes premoveConfirmed (e.g. explicit UI override
  // or nightly sweep re-running a queued transition past the cool-off).
  const premoveConfirmed = payload.premoveConfirmed === true;
  if (shouldRequirePreMove(deal) && !premoveConfirmed) {
    return await markPendingMove(deal, rule, actor, payload);
  }

  return await executeTransition(deal, rule, actor, payload);
};

const markPendingMove = async (
  deal: PipelineDeal,
  rule: StageRule,
  actor: string,
  payload: Record<string, unknown>
): Promise<RuleResult> => {
  const now = new Date();
  const pendingAt = now.toISOString();
  const executeAt = new Date(now.getTime() + PREMOVE_COOLOFF_MS).toISOString();

  await writePipelineFields(deal.id, {
    pending_move_to: rule.toStage,
    pending_move_at: pendingAt,
  });

  const event = await appendDealEvent({
    deal_id: deal.id,
    actor,
    event_type: "pending_move",
    from_stage: deal.stage,
    to_stage: rule.toStage,
    trigger_rule_id: rule.id,
    payload: { ...payload, execute_at: executeAt },
  });

  return {
    type: "pending_move",
    ruleId: rule.id,
    toStage: rule.toStage,
    executeAt,
    eventId: event.event_id,
  };
};

const executeTransition = async (
  deal: PipelineDeal,
  rule: StageRule,
  actor: string,
  payload: Record<string, unknown>
): Promise<RuleResult> => {
  const now = new Date().toISOString();

  await writePipelineFields(deal.id, {
    stage: rule.toStage,
    stage_entered_at: now,
    pending_move_to: "",
    pending_move_at: "",
  });

  const event = await appendDealEvent({
    deal_id: deal.id,
    actor,
    event_type: "stage_change",
    from_stage: deal.stage,
    to_stage: rule.toStage,
    trigger_rule_id: rule.id,
    payload,
  });

  return {
    type: "moved",
    ruleId: rule.id,
    fromStage: deal.stage,
    toStage: rule.toStage,
    eventId: event.event_id,
  };
};

// ---------------------------------------------------------------------------
// Rollback
// ---------------------------------------------------------------------------

const ROLLBACK_WINDOW_MS = 24 * 60 * 60 * 1000;

export const rollback = async (
  dealId: string,
  eventId: string,
  actor: string
): Promise<{ ok: true; newEventId: string } | { ok: false; reason: string }> => {
  const { getDealEvents } = await import("./deal-events");
  const events = await getDealEvents(dealId);
  const original = events.find((e) => e.event_id === eventId);
  if (!original) return { ok: false, reason: "event not found" };
  if (original.event_type !== "stage_change") {
    return { ok: false, reason: "only stage_change events are rollback-able" };
  }

  const elapsed = Date.now() - Date.parse(original.timestamp);
  if (elapsed > ROLLBACK_WINDOW_MS) {
    return { ok: false, reason: "24h rollback window elapsed" };
  }

  await writePipelineFields(dealId, {
    stage: original.from_stage as PipelineStage,
    stage_entered_at: original.timestamp, // best guess — prior stage_entered_at
    pending_move_to: "",
    pending_move_at: "",
  });

  const rollbackEvent = await appendDealEvent({
    deal_id: dealId,
    actor,
    event_type: "rollback",
    from_stage: original.to_stage,
    to_stage: original.from_stage,
    reverted_event_id: original.event_id,
  });

  return { ok: true, newEventId: rollbackEvent.event_id };
};

// ---------------------------------------------------------------------------
// Internal I/O helpers
// ---------------------------------------------------------------------------

type PipelineRow = Record<string, string>;

const PIPELINE_CAMEL_MAP: Array<[keyof PipelineDeal, string]> = [
  ["id", "id"],
  ["name", "name"],
  ["contactCompany", "company"],
  ["stage", "stage"],
  ["value", "value"],
  ["probability", "probability"],
  ["expectedClose", "expected_close"],
  ["assignedRep", "owner"],
  ["leadSource", "source"],
  ["createdAt", "created_at"],
  ["notes", "notes"],
  ["brandSlugs", "brand_slugs"],
  ["stageEnteredAt", "stage_entered_at"],
  ["pendingMoveTo", "pending_move_to"],
  ["pendingMoveAt", "pending_move_at"],
  ["dateAtBorder", "date_at_border"],
  ["dateCustomsCleared", "date_customs_cleared"],
];

const rowToDeal = (row: PipelineRow): PipelineDeal => {
  const deal: Partial<PipelineDeal> = {
    id: row.id,
    name: row.name,
    contactName: "",
    value: Number(row.value) || 0,
    currency: "MXN",
    stage: row.stage as PipelineStage,
    probability: Number(row.probability) || 0,
    expectedClose: row.expected_close,
    assignedRep: row.owner,
    products: "",
    createdAt: row.created_at,
    notes: row.notes,
    contactCompany: row.company,
    leadSource: row.source,
    brandSlugs: row.brand_slugs ? row.brand_slugs.split("|").filter(Boolean) : undefined,
    stageEnteredAt: row.stage_entered_at,
    pendingMoveTo: (row.pending_move_to || undefined) as PipelineStage | undefined,
    pendingMoveAt: row.pending_move_at || undefined,
    dateAtBorder: row.date_at_border || undefined,
    dateCustomsCleared: row.date_customs_cleared || undefined,
    requiresCustoms: undefined,
  };
  return deal as PipelineDeal;
};

const loadDeal = async (dealId: string): Promise<PipelineDeal | null> => {
  const rows = await readSheet<PipelineRow>("Pipeline");
  const match = rows.find((r) => r.id === dealId);
  return match ? rowToDeal(match) : null;
};

/**
 * Writes a partial field map to the Pipeline row for a given deal_id.
 * Preserves unspecified columns; updates only what's in `fields`.
 */
const writePipelineFields = async (
  dealId: string,
  fields: Record<string, string>
): Promise<void> => {
  const rows = await readSheet<PipelineRow>("Pipeline");
  const dataRowIdx = rows.findIndex((r) => r.id === dealId);
  if (dataRowIdx < 0) throw new Error(`Pipeline row not found: ${dealId}`);

  const rowIdxInSheet = await findRowIndex("Pipeline", "id", dealId);
  if (rowIdxInSheet === null) {
    throw new Error(`findRowIndex returned null for deal ${dealId}`);
  }

  const existing = rows[dataRowIdx];
  const merged = { ...existing, ...fields };
  // preserve original header order — pull it from the first row's key order
  const headerKeys = Object.keys(existing);
  const values = headerKeys.map((k) => merged[k] ?? "");
  await updateRow("Pipeline", rowIdxInSheet, values);
};
