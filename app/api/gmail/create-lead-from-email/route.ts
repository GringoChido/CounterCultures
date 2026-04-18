/**
 * POST /api/gmail/create-lead-from-email
 *
 * Body: { messageId: string, threadId: string }
 *
 * - Reads the specified Gmail message (must be in the connected inbox)
 * - Extracts sender name/email, subject, and body snippet
 * - Scans subject + body for Brand Kit brand-name mentions (exact, case-
 *   insensitive, word-boundary) and pipe-joins the matching slugs
 * - Appends a new row to `Leads` with source="Email" and source_message_id
 * - Writes an `Email_Activity` audit row with action=created_lead
 * - Returns { leadId }
 */

import { NextResponse, type NextRequest } from "next/server";
import { getGmailClient } from "@/app/lib/gmail";
import { getBrands } from "@/app/lib/brand-kit-sheets";
import { appendRow } from "@/app/lib/dashboard-sheets";
import { logEmailActivity } from "@/app/lib/email-activity";

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

const escapeFormula = (v: string) =>
  typeof v === "string" && /^[+=\-@]/.test(v) ? `'${v}` : v;

const parseFromAddress = (raw: string): { name: string; email: string } => {
  if (!raw) return { name: "", email: "" };
  const m = raw.match(/^(.*?)\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1].replace(/"/g, "").trim(), email: m[2].trim() };
  return { name: "", email: raw.trim() };
};

const decodeBody = (data: string | null | undefined): string => {
  if (!data) return "";
  const fixed = data.replace(/-/g, "+").replace(/_/g, "/");
  try {
    return Buffer.from(fixed, "base64").toString("utf-8");
  } catch {
    return "";
  }
};

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const POST = async (request: NextRequest) => {
  try {
    const { messageId, threadId } = await request.json();
    if (!messageId) {
      return NextResponse.json({ error: "messageId required" }, { status: 400 });
    }

    const client = await getGmailClient();
    if (!client) {
      return NextResponse.json({ error: "Gmail not connected" }, { status: 409 });
    }

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

    // Walk parts collecting text/plain body for brand scanning
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

    const leadId = `LEAD-${Date.now()}`;
    const now = new Date().toISOString();
    const snippet = (msg.data.snippet ?? plain.slice(0, 200)).slice(0, 200);

    const row: Record<(typeof LEAD_COLUMNS)[number], string> = {
      id: leadId,
      name: name || email || "Unknown sender",
      email: email,
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
      gmailThreadId: threadId || msg.data.threadId || "",
      direction: "inbound",
      action: "created_lead",
      relatedLeadId: leadId,
      senderEmail: email,
      subject,
      snippet,
    }).catch((err) => console.error("[create-lead] activity log failed:", err));

    return NextResponse.json({ leadId, matchedBrandSlugs: matchedSlugs });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "create_failed";
    console.error("[create-lead-from-email]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
};
