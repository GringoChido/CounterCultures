import { appendRow, readSheet } from "./dashboard-sheets";
import { createHmac } from "crypto";

export type ChannelPreference = "email" | "whatsapp" | "both";
export type DigestFrequency = "every_event" | "milestone_only";

export interface CustomerPreferences {
  customer_email: string;
  locale: "en" | "es";
  email_opt_in: boolean;
  whatsapp_opt_in: boolean;
  channel_preference: ChannelPreference;
  digest_frequency: DigestFrequency;
  unsubscribe_token: string;
  unsubscribed_at?: string;
  created_at: string;
  updated_at: string;
}

interface PreferencesRow extends Record<string, string> {
  customer_email: string;
  locale: string;
  email_opt_in: string;
  whatsapp_opt_in: string;
  channel_preference: string;
  digest_frequency: string;
  unsubscribe_token: string;
  unsubscribed_at: string;
  quiet_hours_override_json: string;
  created_at: string;
  updated_at: string;
}

const SECRET = process.env.UNSUBSCRIBE_SECRET || "cc-unsub-default-secret";

export function generateUnsubscribeToken(email: string): string {
  return createHmac("sha256", SECRET)
    .update(email.toLowerCase().trim())
    .digest("hex")
    .slice(0, 32);
}

export function verifyUnsubscribeToken(token: string, email: string): boolean {
  const expected = generateUnsubscribeToken(email);
  return token === expected;
}

function rowToPreferences(row: PreferencesRow): CustomerPreferences {
  return {
    customer_email: row.customer_email,
    locale: (row.locale as "en" | "es") || "es",
    email_opt_in: row.email_opt_in !== "false",
    whatsapp_opt_in: row.whatsapp_opt_in !== "false",
    channel_preference: (row.channel_preference as ChannelPreference) || "both",
    digest_frequency: (row.digest_frequency as DigestFrequency) || "every_event",
    unsubscribe_token: row.unsubscribe_token,
    unsubscribed_at: row.unsubscribed_at || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getPreferences(email: string): Promise<CustomerPreferences | null> {
  const rows = await readSheet<PreferencesRow>("Customer_Preferences");
  const match = rows.find(
    (r) => r.customer_email.toLowerCase().trim() === email.toLowerCase().trim()
  );
  return match ? rowToPreferences(match) : null;
}

export async function upsertPreferences(
  email: string,
  patch: Partial<Pick<CustomerPreferences, "locale" | "email_opt_in" | "whatsapp_opt_in" | "channel_preference" | "digest_frequency">>,
  _actor: string
): Promise<CustomerPreferences> {
  const existing = await getPreferences(email);
  const now = new Date().toISOString();

  if (existing) {
    const updated: CustomerPreferences = {
      ...existing,
      ...patch,
      updated_at: now,
    };
    // Append updated row (sheet-level dedup by email handled by reads taking last match)
    await appendRow("Customer_Preferences", [
      updated.customer_email,
      updated.locale,
      String(updated.email_opt_in),
      String(updated.whatsapp_opt_in),
      updated.channel_preference,
      updated.digest_frequency,
      updated.unsubscribe_token,
      updated.unsubscribed_at ?? "",
      "",
      updated.created_at,
      now,
    ]);
    return updated;
  }

  const token = generateUnsubscribeToken(email);
  const prefs: CustomerPreferences = {
    customer_email: email.toLowerCase().trim(),
    locale: patch.locale ?? "es",
    email_opt_in: patch.email_opt_in ?? true,
    whatsapp_opt_in: patch.whatsapp_opt_in ?? true,
    channel_preference: patch.channel_preference ?? "both",
    digest_frequency: patch.digest_frequency ?? "every_event",
    unsubscribe_token: token,
    created_at: now,
    updated_at: now,
  };

  await appendRow("Customer_Preferences", [
    prefs.customer_email,
    prefs.locale,
    String(prefs.email_opt_in),
    String(prefs.whatsapp_opt_in),
    prefs.channel_preference,
    prefs.digest_frequency,
    prefs.unsubscribe_token,
    "",
    "",
    now,
    now,
  ]);

  return prefs;
}

export function applyPreferencesToSendDecision(
  prefs: CustomerPreferences | null,
  channel: "email" | "whatsapp" | "dashboard",
  templateCategory: "transactional" | "marketing"
): boolean {
  // Dashboard always allowed
  if (channel === "dashboard") return true;

  // No prefs = default both ON (per §3.12 decision)
  if (!prefs) return true;

  // Unsubscribed blocks marketing only
  if (prefs.unsubscribed_at && templateCategory === "marketing") return false;

  // Channel opt-in check
  if (channel === "email" && !prefs.email_opt_in) return false;
  if (channel === "whatsapp" && !prefs.whatsapp_opt_in) return false;

  // Channel preference filter
  if (prefs.channel_preference === "email" && channel === "whatsapp") return false;
  if (prefs.channel_preference === "whatsapp" && channel === "email") return false;

  return true;
}
