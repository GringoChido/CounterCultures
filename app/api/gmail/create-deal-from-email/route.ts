/**
 * POST /api/gmail/create-deal-from-email
 *
 * Body: { messageId, threadId, value?, stage?, company? }
 *
 * Parses the Gmail message, detects brand mentions from the Brand Kit, and
 * creates a new Pipeline deal in stage "discovery" by default. Email_Activity
 * row is logged with action=created_deal for audit.
 */

import { NextResponse, type NextRequest } from "next/server";
import { getGmailClient } from "@/app/lib/gmail";
import { getBrands } from "@/app/lib/brand-kit-sheets";
import { appendRow } from "@/app/lib/dashboard-sheets";
import { logEmailActivity } from "@/app/lib/email-activity";

const PIPELINE_COLUMNS = [
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
  "last_activity",
  "brand_slugs",
  "source_message_id",
] as const;

const escapeFormula = (v: string) =>
  typeof v === "string" && /^[+=\-@]/.test(v) ? `'${v}` : v;

const parseFrom = (raw: string): { name: string; email: string } => {
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
    const { messageId, threadId, value, stage, company } = await request.json();
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
    const { name, email } = parseFrom(headers.from || "");
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
      .filter((b) =>
        new RegExp(`\\b${escapeRegExp(b.name.toLowerCase())}\\b`).test(scanText)
      )
      .map((b) => b.slug);

    const dealId = `DEAL-${Date.now()}`;
    const now = new Date().toISOString();
    const snippet = (msg.data.snippet ?? plain.slice(0, 200)).slice(0, 200);

    const row: Record<(typeof PIPELINE_COLUMNS)[number], string> = {
      id: dealId,
      name: subject,
      company: company || name || email || "Unknown",
      stage: stage || "discovery",
      value: value ? String(value) : "0",
      probability: "10",
      expected_close: "",
      owner: "",
      source: "Email",
      created_at: now,
      last_activity: now,
      brand_slugs: matchedSlugs.join("|"),
      source_message_id: messageId,
    };

    await appendRow(
      "Pipeline",
      PIPELINE_COLUMNS.map((c) => escapeFormula(row[c]))
    );

    await logEmailActivity({
      userEmail: client.gmailAddress,
      gmailMessageId: messageId,
      gmailThreadId: threadId || msg.data.threadId || "",
      direction: "inbound",
      action: "created_deal",
      relatedDealId: dealId,
      senderEmail: email,
      subject,
      snippet,
    }).catch((err) => console.error("[create-deal] activity log failed:", err));

    return NextResponse.json({ dealId, matchedBrandSlugs: matchedSlugs });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "create_failed";
    console.error("[create-deal-from-email]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
};
