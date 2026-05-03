/**
 * WhatsApp inbound → lead pipeline (R4 Note 1).
 *
 * Roger lists WhatsApp first among his lead sources. Outbound was wired
 * up in W8; inbound (the customer pings first) was a manual data-entry
 * task. This helper closes that loop:
 *
 *   - Dedupe by wa_message_id so retries / replays don't double-write
 *   - If an open lead already exists for the phone (last 30d, status
 *     not won/lost), append the new message to the lead's notes
 *     instead of creating a duplicate row
 *   - Otherwise create a fresh lead with source="WhatsApp"
 *
 * Returns { leadId, created } so the webhook can attribute correctly
 * in the Email_Activity-like audit log.
 */

import { appendRow, readSheet, updateRowByHeader, findRowIndex } from "./dashboard-sheets";

const LEAD_COLUMNS = [
  "id",
  "name",
  "email",
  "phone",
  "source",
  "status",
  "contact_type",
  "interest",
  "value",
  "created_at",
  "next_followup",
  "last_contact_date",
  "brand_slugs",
  "notes",
  "source_message_id",
] as const;

const escapeFormula = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/^[=+\-@]/.test(str)) return `'${str}`;
  return str;
};

export interface InboundWhatsAppMessage {
  /** Meta-issued message ID — globally unique. Used for dedup. */
  waMessageId: string;
  /** Sender phone in E.164 (Meta gives this without the leading +). */
  from: string;
  /** Display name from Meta contacts payload, when present. */
  name: string;
  /** Message body. For non-text (image/audio/etc.) use a short summary. */
  body: string;
  /** ISO timestamp of when the message was sent. */
  timestamp: string;
}

interface ExistingLeadShape extends Record<string, string> {
  id: string;
  phone: string;
  status: string;
  source: string;
  created_at: string;
  notes: string;
  source_message_id: string;
}

const FRESH_LEAD_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const normalizePhone = (raw: string): string => {
  const digits = (raw ?? "").replace(/\D/g, "");
  return digits;
};

export interface CreateLeadFromWhatsAppResult {
  leadId: string;
  created: boolean;
  duplicateMessage: boolean;
}

/**
 * Idempotent: returns the existing leadId when the wa_message_id has
 * already been ingested, OR when a recent open lead for the same phone
 * exists. The webhook hits this on every retry / duplicate webhook —
 * we must not double-write.
 */
export const createLeadFromWhatsApp = async (
  msg: InboundWhatsAppMessage
): Promise<CreateLeadFromWhatsAppResult> => {
  const phoneE164 = msg.from.startsWith("+") ? msg.from : `+${msg.from}`;
  const phoneDigits = normalizePhone(phoneE164);

  const existing = await readSheet<ExistingLeadShape>("Leads");

  // Dedup #1: same wa_message_id → no-op.
  const dupById = existing.find(
    (r) => (r.source_message_id ?? "") === msg.waMessageId
  );
  if (dupById) {
    return { leadId: dupById.id, created: false, duplicateMessage: true };
  }

  // Dedup #2: open lead from same phone in the last 30d → append note,
  // don't create a sibling row.
  const cutoff = Date.now() - FRESH_LEAD_WINDOW_MS;
  const openLead = existing
    .filter((r) => {
      if (!r.phone) return false;
      const status = (r.status ?? "").toLowerCase();
      if (status === "won" || status === "lost") return false;
      const created = Date.parse(r.created_at);
      if (!Number.isFinite(created) || created < cutoff) return false;
      return normalizePhone(r.phone) === phoneDigits;
    })
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0];

  if (openLead) {
    const rowIdx = await findRowIndex("Leads", "id", openLead.id);
    if (rowIdx !== null) {
      const appended = `${openLead.notes ?? ""}\n[WA ${msg.timestamp}] ${msg.body}`.slice(
        -2000
      );
      await updateRowByHeader("Leads", rowIdx, {
        notes: escapeFormula(appended),
        last_contact_date: msg.timestamp,
      });
    }
    return { leadId: openLead.id, created: false, duplicateMessage: false };
  }

  // Fresh lead.
  const leadId = `LEAD-${Date.now()}-${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")}`;
  const now = msg.timestamp || new Date().toISOString();
  const snippet = msg.body.slice(0, 500);

  const row: Record<(typeof LEAD_COLUMNS)[number], string> = {
    id: leadId,
    name: msg.name || phoneE164,
    email: "",
    phone: phoneE164,
    source: "WhatsApp",
    status: "new",
    contact_type: "",
    interest: "",
    value: "",
    created_at: now,
    next_followup: "",
    last_contact_date: now,
    brand_slugs: "",
    notes: `From WhatsApp: ${snippet}`,
    source_message_id: msg.waMessageId,
  };

  await appendRow(
    "Leads",
    LEAD_COLUMNS.map((c) => escapeFormula(row[c]))
  );

  return { leadId, created: true, duplicateMessage: false };
};
