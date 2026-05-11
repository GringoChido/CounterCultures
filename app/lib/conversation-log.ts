import { appendRow, readSheet } from "./dashboard-sheets";

export type MessageDirection = "inbound" | "outbound";
export type MessageChannel = "email" | "whatsapp" | "dashboard" | "sms";
export type MessageStatus = "queued" | "sent" | "delivered" | "failed" | "read";

export interface ConversationMessage {
  message_id: string;
  deal_id: string;
  customer_email: string;
  direction: MessageDirection;
  channel: MessageChannel;
  template_id?: string;
  locale: "en" | "es";
  subject?: string;
  body_snippet: string;
  attachment_urls?: string;
  status: MessageStatus;
  external_id?: string;
  created_at: string;
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  error_message?: string;
}

interface ConversationLogRow extends Record<string, string> {
  message_id: string;
  deal_id: string;
  customer_email: string;
  direction: string;
  channel: string;
  template_id: string;
  locale: string;
  subject: string;
  body_snippet: string;
  attachment_urls: string;
  status: string;
  external_id: string;
  created_at: string;
  sent_at: string;
  delivered_at: string;
  read_at: string;
  error_message: string;
}

function generateMessageId(): string {
  return `MSG-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function appendMessage(
  input: Omit<ConversationMessage, "message_id" | "created_at">
): Promise<string> {
  const messageId = generateMessageId();
  const now = new Date().toISOString();

  await appendRow("Conversation_Log", [
    messageId,
    input.deal_id,
    input.customer_email,
    input.direction,
    input.channel,
    input.template_id ?? "",
    input.locale,
    input.subject ?? "",
    input.body_snippet.slice(0, 200),
    input.attachment_urls ?? "",
    input.status,
    input.external_id ?? "",
    now,
    input.sent_at ?? "",
    input.delivered_at ?? "",
    input.read_at ?? "",
    input.error_message ?? "",
  ]);

  return messageId;
}

export async function updateMessageStatus(
  messageId: string,
  status: MessageStatus,
  fields?: { external_id?: string; delivered_at?: string; read_at?: string; error_message?: string }
): Promise<void> {
  const rows = await readSheet<ConversationLogRow>("Conversation_Log");
  const idx = rows.findIndex((r) => r.message_id === messageId);
  if (idx === -1) return;

  // For now, re-append a status-update row. Full updateRow integration
  // deferred until the updateRow helper supports Conversation_Log.
  // The read functions will use the latest row per message_id.
  const row = rows[idx];
  const now = new Date().toISOString();

  await appendRow("Conversation_Log", [
    messageId,
    row.deal_id,
    row.customer_email,
    row.direction,
    row.channel,
    row.template_id,
    row.locale,
    row.subject,
    row.body_snippet,
    row.attachment_urls,
    status,
    fields?.external_id ?? row.external_id,
    row.created_at,
    status === "sent" ? now : row.sent_at,
    fields?.delivered_at ?? (status === "delivered" ? now : row.delivered_at),
    fields?.read_at ?? (status === "read" ? now : row.read_at),
    fields?.error_message ?? row.error_message,
  ]);
}

export async function listMessagesForDeal(dealId: string): Promise<ConversationLogRow[]> {
  const rows = await readSheet<ConversationLogRow>("Conversation_Log");
  return rows.filter((r) => r.deal_id === dealId);
}

export async function listMessagesForCustomer(email: string): Promise<ConversationLogRow[]> {
  const rows = await readSheet<ConversationLogRow>("Conversation_Log");
  return rows.filter((r) => r.customer_email === email);
}
