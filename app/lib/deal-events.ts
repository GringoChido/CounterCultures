/**
 * Deal_Events — append-only audit log for Pipeline deal transitions.
 *
 * Schema and rationale:
 * docs/superpowers/specs/2026-04-20-week7-pipeline-automation-design.md §3.2
 *
 * Mirrors trafico-events.ts. Every stage_change, pending_move,
 * pending_move_cancelled, rollback, field_update, alert_fired, and sla_breach
 * emitted by the rule engine (or the nightly sweep) lands here.
 *
 * Public surface:
 *   - appendDealEvent({ deal_id, actor, event_type, ... })
 *   - getDealEvents(dealId?) — all events, or filtered by deal_id
 */

import { appendRow, readSheet } from "./dashboard-sheets";

export type DealEventType =
  | "stage_change"
  | "pending_move"
  | "pending_move_cancelled"
  | "rollback"
  | "field_update"
  | "alert_fired"
  | "sla_breach";

export type DealEvent = Record<string, string> & {
  event_id: string;
  deal_id: string;
  timestamp: string;
  actor: string;
  event_type: string;
  from_stage: string;
  to_stage: string;
  trigger_rule_id: string;
  payload_json: string;
  reverted_event_id: string;
};

export interface AppendDealEventInput {
  deal_id: string;
  actor: string;
  event_type: DealEventType;
  from_stage?: string;
  to_stage?: string;
  trigger_rule_id?: string;
  payload?: Record<string, unknown>;
  reverted_event_id?: string;
}

const COLUMNS: (keyof DealEvent)[] = [
  "event_id",
  "deal_id",
  "timestamp",
  "actor",
  "event_type",
  "from_stage",
  "to_stage",
  "trigger_rule_id",
  "payload_json",
  "reverted_event_id",
];

const newEventId = (): string =>
  `DE-${Date.now()}-${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")}`;

export const appendDealEvent = async (
  input: AppendDealEventInput
): Promise<DealEvent> => {
  const row: DealEvent = {
    event_id: newEventId(),
    deal_id: input.deal_id,
    timestamp: new Date().toISOString(),
    actor: input.actor,
    event_type: input.event_type,
    from_stage: input.from_stage ?? "",
    to_stage: input.to_stage ?? "",
    trigger_rule_id: input.trigger_rule_id ?? "",
    payload_json: input.payload ? JSON.stringify(input.payload) : "",
    reverted_event_id: input.reverted_event_id ?? "",
  };
  await appendRow(
    "Deal_Events",
    COLUMNS.map((c) => row[c])
  );
  return row;
};

export const getDealEvents = async (
  dealId?: string
): Promise<DealEvent[]> => {
  const all = await readSheet<DealEvent>("Deal_Events");
  return dealId ? all.filter((e) => e.deal_id === dealId) : all;
};
