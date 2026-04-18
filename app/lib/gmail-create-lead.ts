/**
 * Shared "Create Lead from Gmail message" pipeline used by both the
 * single-thread route and the bulk-thread route. Extracted so adding
 * fields (e.g. brand_count, source_user_email) only happens in one
 * place.
 */

import { getGmailClient } from "./gmail";
import { getBrands } from "./brand-kit-sheets";
import { appendRow } from "./dashboard-sheets";
import { logEmailActivity } from "./email-activity";

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

const decodeBody = (data: string | null | undefined): string => {
  if (!data) return "";
  const fixed = data.replace(/-/g, "+").replace(/_/g, "/");
  try {
    return Buffer.from(fixed, "base64").toString("utf-8");
  } catch {
    return "";
  }
};

const parseFromAddress = (raw: string): { name: string; email: string } => {
  if (!raw) return { name: "", email: "" };
  const m = raw.match(/^(.*?)\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1].replace(/"/g, "").trim(), email: m[2].trim() };
  return { name: "", email: raw.trim() };
};

const escapeFormula = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/^[=+\-@]/.test(str)) return `'${str}`;
  return str;
};

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export interface CreateLeadResult {
  leadId: string;
  matchedBrandSlugs: string[];
  senderEmail: string;
  subject: string;
}

/**
 * Read a Gmail message, scan for brand mentions, append a Leads row,
 * and write an Email_Activity audit row. Throws on Gmail-not-connected
 * or Sheets failure.
 */
export const createLeadFromMessage = async (
  messageId: string,
  threadIdHint?: string
): Promise<CreateLeadResult> => {
  const client = await getGmailClient();
  if (!client) throw new Error("Gmail not connected");

  const msg = await client.gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full",
  });

  const headers: Record<string, string> = {};
  for (const h of msg.data.payload?.headers ?? []) {
    if (h.name) headers[h.name.toLowerCase()] = h.value ?? "";
  }
  const { name, email } = parseFromAddress(headers.from || "");
  const subject = headers.subject || "(no subject)";

  let plain = "";
  const walk = (p: NonNullable<typeof msg.data.payload>) => {
    if (p.mimeType === "text/plain" && p.body?.data) {
      plain += (plain ? "\n" : "") + decodeBody(p.body.data);
    }
    for (const child of p.parts ?? []) walk(child);
  };
  if (msg.data.payload) walk(msg.data.payload);

  const scanText = `${subject}\n${plain}`.toLowerCase();
  const brands = await getBrands();
  const matchedSlugs = brands
    .filter((b) => b.name && b.slug)
    .filter((b) => {
      const pattern = new RegExp(`\\b${escapeRegExp(b.name.toLowerCase())}\\b`);
      return pattern.test(scanText);
    })
    .map((b) => b.slug);

  const leadId = `LEAD-${Date.now()}-${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")}`;
  const now = new Date().toISOString();
  const snippet = (msg.data.snippet ?? plain.slice(0, 200)).slice(0, 200);

  const row: Record<(typeof LEAD_COLUMNS)[number], string> = {
    id: leadId,
    name: name || email || "Unknown sender",
    email,
    phone: "",
    source: "Email",
    status: "new",
    contact_type: "",
    interest: subject,
    value: "",
    created_at: now,
    next_followup: "",
    last_contact_date: now,
    brand_slugs: matchedSlugs.join("|"),
    notes: `From email: ${snippet}`,
    source_message_id: messageId,
  };

  await appendRow(
    "Leads",
    LEAD_COLUMNS.map((c) => escapeFormula(row[c]))
  );

  await logEmailActivity({
    userEmail: client.gmailAddress,
    gmailMessageId: messageId,
    gmailThreadId: threadIdHint || msg.data.threadId || "",
    direction: "inbound",
    action: "created_lead",
    relatedLeadId: leadId,
    senderEmail: email,
    subject,
    snippet,
  }).catch((err) => console.error("[createLeadFromMessage] activity log failed:", err));

  return { leadId, matchedBrandSlugs: matchedSlugs, senderEmail: email, subject };
};
