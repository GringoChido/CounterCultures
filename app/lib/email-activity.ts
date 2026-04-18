/**
 * Email_Activity — audit log helper for every email-sourced action.
 * One row per received/sent/replied/archived/created_lead/created_deal/
 * attached_to_deal event. Schema per Gmail integration spec §5.2.
 */

import { appendRow } from "./dashboard-sheets";

export type EmailActivityAction =
  | "received"
  | "sent"
  | "replied"
  | "forwarded"
  | "archived"
  | "created_lead"
  | "created_deal"
  | "attached_to_deal";

export type EmailDirection = "inbound" | "outbound";

const COLUMNS = [
  "activity_id",
  "user_email",
  "gmail_message_id",
  "gmail_thread_id",
  "direction",
  "action",
  "related_lead_id",
  "related_deal_id",
  "sender_email",
  "recipient_emails",
  "subject",
  "snippet",
  "timestamp",
] as const;

export const logEmailActivity = async (input: {
  userEmail: string;
  gmailMessageId: string;
  gmailThreadId: string;
  direction: EmailDirection;
  action: EmailActivityAction;
  relatedLeadId?: string;
  relatedDealId?: string;
  senderEmail: string;
  recipientEmails?: string[];
  subject: string;
  snippet: string;
}): Promise<void> => {
  const activityId = `EA-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const row: Record<(typeof COLUMNS)[number], string> = {
    activity_id: activityId,
    user_email: input.userEmail,
    gmail_message_id: input.gmailMessageId,
    gmail_thread_id: input.gmailThreadId,
    direction: input.direction,
    action: input.action,
    related_lead_id: input.relatedLeadId ?? "",
    related_deal_id: input.relatedDealId ?? "",
    sender_email: input.senderEmail,
    recipient_emails: (input.recipientEmails ?? []).join("|"),
    subject: input.subject.slice(0, 500),
    snippet: input.snippet.slice(0, 200),
    timestamp: new Date().toISOString(),
  };

  await appendRow(
    "Email_Activity",
    COLUMNS.map((c) => row[c])
  );
};
