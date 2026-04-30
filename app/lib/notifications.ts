/**
 * Notifications — Roger-facing alerts surfaced in the bell + Today widget.
 *
 * Schema (10 cols) approved by Joshua on 2026-04-19; rationale in
 * docs/superpowers/specs/2026-04-19-dashboard-redesign-phase2.md §3
 * and the plan §1.3.
 *
 * Public surface:
 *   - appendNotification(input): upserts by deterministic notification_id
 *   - listNotifications(opts): filtered read
 *   - ackNotification(id): flips status → acked, sets acked_at
 *   - syncNotificationsFromSources(): aggregates 3 sources, upserts all,
 *     60s in-memory throttle (self-healing on read; no cron required)
 *   - notificationToNeedsYouItem(n): adapter for the existing widget shape
 */

import { google } from "googleapis";
import { getGooglePrivateKey } from "./google-private-key";
import { appendRow, readSheet } from "./dashboard-sheets";
import { getTraficoEvents } from "./trafico-events";

export type NotificationSeverity = "critical" | "high" | "normal";
export type NotificationAudience = "roger" | "finance" | "customer";
export type NotificationStatus = "unread" | "acked";
export type NotificationSource =
  | "trafico"
  | "lead"
  | "shipment"
  | "deal_payment"
  | "deal_event";  // W8: R-*/F-* alerts fired by the rule engine

export type DeliveryChannel = "email" | "whatsapp" | "dashboard" | "";

export type Notification = Record<string, string> & {
  notification_id: string;
  severity: NotificationSeverity;
  audience: NotificationAudience;
  title: string;
  body: string;
  source_entity_type: NotificationSource;
  source_entity_id: string;
  status: NotificationStatus;
  created_at: string;
  acked_at: string;
  // W8 columns
  deliver_after: string;
  delivery_channel: string;
  recipient_email: string;
  recipient_phone: string;
};

export interface AppendNotificationInput {
  /** Auto-generated when omitted. Callers pass an explicit ID for upsert semantics. */
  notification_id?: string;
  severity: NotificationSeverity;
  audience: NotificationAudience;
  title: string;
  body?: string;
  source_entity_type: NotificationSource;
  source_entity_id: string;
  // W8 additions (all optional)
  deliver_after?: string;
  delivery_channel?: DeliveryChannel;
  recipient_email?: string;
  recipient_phone?: string;
}

const COLUMNS: (keyof Notification)[] = [
  "notification_id",
  "severity",
  "audience",
  "title",
  "body",
  "source_entity_type",
  "source_entity_id",
  "status",
  "created_at",
  "acked_at",
  "deliver_after",
  "delivery_channel",
  "recipient_email",
  "recipient_phone",
];

const newNotificationId = (): string =>
  `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;

export const appendNotification = async (
  input: AppendNotificationInput
): Promise<Notification> => {
  // Upsert semantics only when a stable id is supplied by the caller
  // (the 3 sync sources use deterministic ids so dedupe works across runs).
  // Ad-hoc alerts from the dispatcher get a fresh id each call.
  const hasExplicitId = typeof input.notification_id === "string" && input.notification_id.length > 0;
  if (hasExplicitId) {
    const existing = await readSheet<Notification>("Notifications");
    const hit = existing.find((n) => n.notification_id === input.notification_id);
    if (hit) return hit;
  }

  const row: Notification = {
    notification_id: hasExplicitId ? (input.notification_id as string) : newNotificationId(),
    severity: input.severity,
    audience: input.audience,
    title: input.title,
    body: input.body ?? "",
    source_entity_type: input.source_entity_type,
    source_entity_id: input.source_entity_id,
    status: "unread",
    created_at: new Date().toISOString(),
    acked_at: "",
    deliver_after: input.deliver_after ?? "",
    delivery_channel: input.delivery_channel ?? "",
    recipient_email: input.recipient_email ?? "",
    recipient_phone: input.recipient_phone ?? "",
  };
  await appendRow(
    "Notifications",
    COLUMNS.map((c) => row[c])
  );
  return row;
};

export interface ListNotificationsOpts {
  status?: NotificationStatus | "all";
  audience?: NotificationAudience;
  severity?: NotificationSeverity;
  source?: NotificationSource;
  limit?: number;
}

const SEVERITY_RANK: Record<NotificationSeverity, number> = {
  critical: 0,
  high: 1,
  normal: 2,
};

export const listNotifications = async (
  opts: ListNotificationsOpts = {}
): Promise<Notification[]> => {
  const all = await readSheet<Notification>("Notifications");
  const filtered = all.filter((n) => {
    if (opts.status && opts.status !== "all" && n.status !== opts.status) return false;
    if (opts.audience && n.audience !== opts.audience) return false;
    if (opts.severity && n.severity !== opts.severity) return false;
    if (opts.source && n.source_entity_type !== opts.source) return false;
    return true;
  });
  filtered.sort((a, b) => {
    const sa = SEVERITY_RANK[a.severity as NotificationSeverity] ?? 3;
    const sb = SEVERITY_RANK[b.severity as NotificationSeverity] ?? 3;
    if (sa !== sb) return sa - sb;
    return b.created_at.localeCompare(a.created_at);
  });
  return opts.limit ? filtered.slice(0, opts.limit) : filtered;
};

const getSheetsClient = () => {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: getGooglePrivateKey(),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
};

export const ackNotification = async (notification_id: string): Promise<void> => {
  const all = await readSheet<Notification>("Notifications");
  const idx = all.findIndex((n) => n.notification_id === notification_id);
  if (idx === -1) throw new Error(`notification not found: ${notification_id}`);
  if (all[idx].status === "acked") return;

  const sheetRow = idx + 2;
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.GOOGLE_SHEETS_ID,
    range: `Notifications!H${sheetRow}:J${sheetRow}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [["acked", all[idx].created_at, new Date().toISOString()]],
    },
  });
};

// ---------------------------------------------------------------------------
// Sync — aggregate from the 3 active sources, upsert into sheet.
// 60s in-memory throttle so a busy header doesn't hammer Sheets API.
// Self-healing on read; no cron required for v1.
// ---------------------------------------------------------------------------

const SYNC_THROTTLE_MS = 60_000;
let lastSyncAt = 0;
let inflight: Promise<{ added: number; total_unread: number }> | null = null;

const HOURS = 1000 * 60 * 60;
const DAYS = HOURS * 24;

interface LeadRow extends Record<string, string> {
  id: string;
  name: string;
  status: string;
  next_followup: string;
}

interface TraficoRow extends Record<string, string> {
  TRF_ID: string;
  Trafico_Number: string;
  Domestic_Est_Arrival: string;
  Domestic_Actual_Arrival: string;
  Completed_Date: string;
}

const aggregate = async (): Promise<AppendNotificationInput[]> => {
  const out: AppendNotificationInput[] = [];

  // Source 1: customs holds (Trafico_Events.event_type=issue_logged, > 24h old)
  try {
    const events = await getTraficoEvents();
    for (const e of events) {
      if (e.event_type !== "issue_logged") continue;
      const t = new Date(e.timestamp).getTime();
      if (Number.isNaN(t)) continue;
      const ageHours = (Date.now() - t) / HOURS;
      if (ageHours < 24) continue;
      out.push({
        notification_id: `trafico-${e.event_id}`,
        severity: ageHours >= 48 ? "critical" : "high",
        audience: "roger",
        title: `${e.trafico_id} customs issue ${Math.round(ageHours)}h old`,
        body: e.message || "",
        source_entity_type: "trafico",
        source_entity_id: e.trafico_id,
      });
    }
  } catch {
    /* skip source if it fails — partial sync is fine */
  }

  // Source 2: overdue follow-ups (Leads.next_followup < now, status not in [won, lost, closed])
  try {
    const leads = await readSheet<LeadRow>("Leads");
    const closed = new Set(["won", "lost", "closed"]);
    for (const l of leads) {
      if (!l.next_followup) continue;
      if (closed.has((l.status || "").toLowerCase())) continue;
      const t = new Date(l.next_followup).getTime();
      if (Number.isNaN(t) || t >= Date.now()) continue;
      const ageHours = (Date.now() - t) / HOURS;
      out.push({
        notification_id: `lead-${l.id}`,
        severity: ageHours >= 72 ? "critical" : "high",
        audience: "roger",
        title: `${l.name || l.id} follow-up overdue`,
        body: `next_followup: ${l.next_followup}`,
        source_entity_type: "lead",
        source_entity_id: l.id,
      });
    }
  } catch {
    /* skip */
  }

  // Source 3: shipment delays (Traficos with Domestic_Est_Arrival > 3d ago,
  // no actual/completed)
  try {
    const traficos = await readSheet<TraficoRow>("Traficos");
    for (const t of traficos) {
      if (t.Completed_Date) continue;
      if (t.Domestic_Actual_Arrival) continue;
      if (!t.Domestic_Est_Arrival) continue;
      const eta = new Date(t.Domestic_Est_Arrival).getTime();
      if (Number.isNaN(eta)) continue;
      const delayDays = (Date.now() - eta) / DAYS;
      if (delayDays < 3) continue;
      out.push({
        notification_id: `shipment-${t.TRF_ID}`,
        severity: delayDays >= 7 ? "critical" : "high",
        audience: "roger",
        title: `${t.Trafico_Number || t.TRF_ID} delayed ${Math.floor(delayDays)}d`,
        body: `ETA missed: ${t.Domestic_Est_Arrival}`,
        source_entity_type: "shipment",
        source_entity_id: t.TRF_ID,
      });
    }
  } catch {
    /* skip */
  }

  return out;
};

export const syncNotificationsFromSources = async (
  opts: { force?: boolean } = {}
): Promise<{ added: number; total_unread: number }> => {
  if (inflight) return inflight;
  if (!opts.force && Date.now() - lastSyncAt < SYNC_THROTTLE_MS) {
    const all = await readSheet<Notification>("Notifications");
    return { added: 0, total_unread: all.filter((n) => n.status === "unread").length };
  }
  const work = (async () => {
    try {
      const derived = await aggregate();
      let added = 0;
      const before = await readSheet<Notification>("Notifications");
      const existingIds = new Set(before.map((n) => n.notification_id));
      for (const input of derived) {
        const id = input.notification_id;
        if (id && existingIds.has(id)) continue;
        await appendNotification(input);
        if (id) existingIds.add(id);
        added++;
      }
      lastSyncAt = Date.now();
      const after = added > 0 ? await readSheet<Notification>("Notifications") : before;
      return { added, total_unread: after.filter((n) => n.status === "unread").length };
    } finally {
      inflight = null;
    }
  })();
  inflight = work;
  return work;
};

// ---------------------------------------------------------------------------
// Adapter for /api/dashboard/needs-you compatibility (preserves widget shape)
// ---------------------------------------------------------------------------

export type NeedsYouItem = {
  id: string;
  source: "customs" | "followup" | "shipment-delay";
  message: string;
  href: string;
  severity: "warning" | "danger";
  ageHours: number;
};

const SOURCE_TO_NEEDS_YOU: Record<NotificationSource, NeedsYouItem["source"]> = {
  trafico: "customs",
  lead: "followup",
  shipment: "shipment-delay",
  deal_payment: "shipment-delay",
  deal_event: "followup",
};

/**
 * Map a notification to the "Needs You" widget row. The href is the
 * precise fix-this-item destination — NOT a list page. Each source type
 * has its own deep-link pattern:
 *   trafico / shipment → /dashboard/shipments/<TRF_ID> (W6 detail view)
 *   lead               → /dashboard/leads?lead=<id>   (Leads page deep-link)
 *   deal_event /
 *   deal_payment       → /dashboard/pipeline?deal=<id> (Pipeline slideout)
 */
export const notificationToNeedsYouItem = (n: Notification): NeedsYouItem => {
  const sourceType = n.source_entity_type as NotificationSource;
  const ageHours = (Date.now() - new Date(n.created_at).getTime()) / HOURS;
  const id = encodeURIComponent(n.source_entity_id);
  const href =
    sourceType === "trafico" || sourceType === "shipment"
      ? `/dashboard/shipments/${id}`
      : sourceType === "lead"
        ? `/dashboard/leads?lead=${id}`
        : sourceType === "deal_event" || sourceType === "deal_payment"
          ? `/dashboard/pipeline?deal=${id}`
          : "/dashboard";
  return {
    id: n.notification_id,
    source: SOURCE_TO_NEEDS_YOU[sourceType] ?? "customs",
    message: n.title,
    href,
    severity: n.severity === "critical" ? "danger" : "warning",
    ageHours,
  };
};
