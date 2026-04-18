/**
 * Trafico_Events — append-only audit log for the Traficos sheet.
 *
 * Schema and rationale: docs/superpowers/specs/2026-04-18-week5-shipments-design.md §3.5
 *
 * Public surface:
 *   - appendTraficoEvent({ trafico_id, actor, event_type, ... })
 *   - getTraficoEvents(traficoId?) — all events, or filtered by trafico_id
 */

import { appendRow, readSheet } from "./dashboard-sheets";

export type TraficoEventType =
  | "status_change"
  | "doc_attached"
  | "payment_logged"
  | "note_added"
  | "alert_sent"
  | "issue_logged"
  | "reconciliation";

export type TraficoEvent = Record<string, string> & {
  event_id: string;
  trafico_id: string;
  timestamp: string;
  actor: string;
  event_type: string;
  from_status: string;
  to_status: string;
  doc_key: string;
  doc_drive_id: string;
  amount_mxn: string;
  delay_reason: string;
  alert_channel: string;
  message: string;
};

export interface AppendTraficoEventInput {
  trafico_id: string;
  actor: string;
  event_type: TraficoEventType;
  from_status?: string;
  to_status?: string;
  doc_key?: string;
  doc_drive_id?: string;
  amount_mxn?: number;
  delay_reason?: string;
  alert_channel?: string;
  message?: string;
}

const COLUMNS: (keyof TraficoEvent)[] = [
  "event_id",
  "trafico_id",
  "timestamp",
  "actor",
  "event_type",
  "from_status",
  "to_status",
  "doc_key",
  "doc_drive_id",
  "amount_mxn",
  "delay_reason",
  "alert_channel",
  "message",
];

const newEventId = (): string =>
  `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")}`;

export const appendTraficoEvent = async (
  input: AppendTraficoEventInput
): Promise<TraficoEvent> => {
  const row: TraficoEvent = {
    event_id: newEventId(),
    trafico_id: input.trafico_id,
    timestamp: new Date().toISOString(),
    actor: input.actor,
    event_type: input.event_type,
    from_status: input.from_status ?? "",
    to_status: input.to_status ?? "",
    doc_key: input.doc_key ?? "",
    doc_drive_id: input.doc_drive_id ?? "",
    amount_mxn: input.amount_mxn !== undefined ? String(input.amount_mxn) : "",
    delay_reason: input.delay_reason ?? "",
    alert_channel: input.alert_channel ?? "",
    message: input.message ?? "",
  };
  await appendRow(
    "Trafico_Events",
    COLUMNS.map((c) => row[c])
  );
  return row;
};

export const getTraficoEvents = async (
  traficoId?: string
): Promise<TraficoEvent[]> => {
  const all = await readSheet<TraficoEvent>("Trafico_Events");
  return traficoId ? all.filter((e) => e.trafico_id === traficoId) : all;
};
