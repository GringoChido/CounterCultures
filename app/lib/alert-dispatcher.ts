/**
 * Alert dispatcher — fires after every rule-engine stage transition.
 *
 * For each of the 14 rules, ALERT_ROUTES maps the right audience → channel
 * → template. The dispatcher then:
 *
 *   1. Idempotency check (6h window): skip if same {rule_id, deal_id,
 *      channel, recipient} already has an alert_fired event recently
 *   2. Rate-limit check (per-recipient + per-template + per-channel)
 *   3. Quiet-hours check (customer channels only)
 *   4. Send via the right channel (email, whatsapp, dashboard)
 *   5. Write Deal_Events { event_type: "alert_fired", payload: { channel,
 *      template_id, recipient, status } }
 *
 * Fire-and-forget from the rule engine — failures log but do NOT propagate
 * so Resend/Meta outages never fail a stage transition.
 */

import type { PipelineDeal, PipelineStage } from "./sample-dashboard-data";
import { appendDealEvent, getDealEvents } from "./deal-events";
import { appendNotification } from "./notifications";
import {
  renderAlertTemplate,
  guessFirstNameFromEmail,
  ALERT_TEMPLATES,
} from "./email-templates";
import { checkRateLimit } from "./alert-rate-limiter";
import { nextAllowedDelivery, type AlertAudience } from "./alert-quiet-hours";
import {
  sendWhatsAppTemplate,
  sendWhatsAppFreeText,
  isWhatsAppEnabled,
} from "./whatsapp";
import { Resend } from "resend";

// ---------------------------------------------------------------------------
// Config / env helpers
// ---------------------------------------------------------------------------

const FROM_ADDRESS =
  process.env.ALERT_FROM_ADDRESS ?? "Counter Cultures <noreply@countercultures.com.mx>";
const ROGER_EMAIL =
  process.env.NOTIFY_EMAIL ?? "roger@countercultures.com.mx";
const ROGER_WA =
  process.env.WHATSAPP_NOTIFY_NUMBER ?? "";
const FINANCE_EMAIL =
  process.env.FINANCE_EMAIL ?? "finance@countercultures.com.mx";

const IDEMPOTENCY_WINDOW_MS = 6 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AlertChannel = "email" | "whatsapp" | "dashboard";
export type DeliveryStatus =
  | "sent"
  | "dry_run"
  | "queued"           // deferred to next 8am via deliver_after
  | "skipped"          // rate limit / idempotency / no recipient
  | "failed";

export interface AlertDispatchInput {
  ruleId: string;
  dealId: string;
  fromStage: PipelineStage;
  toStage: PipelineStage;
  deal: PipelineDeal;
  actor: string;
  /** Event payload from the rule-engine tick — merged with derived deal vars */
  extraVars?: Record<string, string | number>;
  /** Override locale for customer (defaults to "es" for MX). Roger/Finance always EN. */
  customerLocale?: "en" | "es";
  /** Test hooks */
  __testing?: {
    now?: Date;
    skipIdempotency?: boolean;
    /** When true, bypasses the quiet-hours queueing step so real-now tests
     *  aren't flaky across wall-clock hours. Idempotency + rate-limit
     *  checks still run. */
    skipQuietHours?: boolean;
  };
}

export interface ChannelResult {
  channel: AlertChannel;
  status: DeliveryStatus;
  templateId?: string;
  recipient?: string;
  error?: string;
  alertEventId?: string;
  retryAfterSec?: number;
  deliverAfter?: string;
}

export interface AlertDispatchResult {
  ruleId: string;
  dealId: string;
  customer: ChannelResult[];
  roger: ChannelResult[];
  finance: ChannelResult[];
}

// ---------------------------------------------------------------------------
// ALERT_ROUTES — one row per rule id, lists audiences + templates + channels
// ---------------------------------------------------------------------------

interface AudienceRoute {
  templateId?: string;          // undefined → use generic fallback (Roger only)
  channels: AlertChannel[];
}

interface AlertRoute {
  ruleId: string;
  customer?: AudienceRoute;
  roger?: AudienceRoute;
  finance?: AudienceRoute;
}

// Design §4.2 — Roger gets dashboard on every transition (14 total).
// Customer routes: 10 templates covering the visible journey.
// Finance routes: 7 — CFDI + AR + FX + customs + CFDI-final.
export const ALERT_ROUTES: Record<string, AlertRoute> = {
  // T-01 close → quote-approved
  "T-01a-manual-approved": {
    ruleId: "T-01a-manual-approved",
    customer: { templateId: "C-01-quote-approved", channels: ["email", "whatsapp"] },
    roger: { templateId: "R-01-quote-approved", channels: ["dashboard", "whatsapp"] },
  },
  "T-01b-signed-quote-doc": {
    ruleId: "T-01b-signed-quote-doc",
    customer: { templateId: "C-01-quote-approved", channels: ["email", "whatsapp"] },
    roger: { templateId: "R-01-quote-approved", channels: ["dashboard", "whatsapp"] },
  },
  // T-02 quote-approved → deposit-pending (deposit CFDI issued)
  "T-02-deposit-cfdi": {
    ruleId: "T-02-deposit-cfdi",
    customer: { templateId: "C-02-deposit-invoice", channels: ["email", "whatsapp"] },
    roger: { channels: ["dashboard"] }, // generic fallback body
    finance: { templateId: "F-01-deposit-cfdi-request", channels: ["email"] },
  },
  // T-03 deposit-pending → deposit-received
  "T-03-deposit-received": {
    ruleId: "T-03-deposit-received",
    customer: { templateId: "C-03-deposit-received", channels: ["email", "whatsapp"] },
    roger: { templateId: "R-03-deposit-received", channels: ["dashboard", "whatsapp"] },
    finance: { templateId: "F-02-deposit-received-ar-update", channels: ["email"] },
  },
  // T-04 deposit-received → ordering
  "T-04-po-attached": {
    ruleId: "T-04-po-attached",
    customer: { templateId: "C-04-order-placed", channels: ["email", "whatsapp"] },
    roger: { channels: ["dashboard"] },
    finance: { templateId: "F-03-po-fx-prep", channels: ["email"] },
  },
  // T-05 ordering → in-production
  "T-05-production-confirmed": {
    ruleId: "T-05-production-confirmed",
    customer: { templateId: "C-05-production-confirmed", channels: ["email", "whatsapp"] },
    roger: { templateId: "R-05-in-production", channels: ["dashboard"] },
  },
  // T-06 in-production → shipping
  "T-06-shipped": {
    ruleId: "T-06-shipped",
    customer: { templateId: "C-06-shipped", channels: ["email", "whatsapp"] },
    roger: { templateId: "R-06-shipped", channels: ["dashboard", "whatsapp"] },
    finance: { templateId: "F-04-fx-processing", channels: ["email"] },
  },
  // T-07 shipping → in-customs
  "T-07a-at-border-field": {
    ruleId: "T-07a-at-border-field",
    customer: { templateId: "C-07-in-customs", channels: ["email", "whatsapp"] },
    roger: { templateId: "R-07-in-customs", channels: ["dashboard", "whatsapp"] },
    finance: { templateId: "F-05-customs-duties-due", channels: ["email"] },
  },
  "T-07b-trafico-at-broker": {
    ruleId: "T-07b-trafico-at-broker",
    customer: { templateId: "C-07-in-customs", channels: ["email", "whatsapp"] },
    roger: { templateId: "R-07-in-customs", channels: ["dashboard", "whatsapp"] },
    finance: { templateId: "F-05-customs-duties-due", channels: ["email"] },
  },
  // T-08 in-customs → customs-cleared
  "T-08a-cleared-field": {
    ruleId: "T-08a-cleared-field",
    customer: { templateId: "C-08-customs-cleared", channels: ["email", "whatsapp"] },
    roger: { templateId: "R-08-customs-cleared", channels: ["dashboard"] },
    finance: { templateId: "F-06-broker-invoice-expected", channels: ["email"] },
  },
  "T-08b-trafico-crossing-approved": {
    ruleId: "T-08b-trafico-crossing-approved",
    customer: { templateId: "C-08-customs-cleared", channels: ["email", "whatsapp"] },
    roger: { templateId: "R-08-customs-cleared", channels: ["dashboard"] },
    finance: { templateId: "F-06-broker-invoice-expected", channels: ["email"] },
  },
  // T-09 customs-cleared → received
  "T-09a-received-at-cc": {
    ruleId: "T-09a-received-at-cc",
    roger: { templateId: "R-09-received-at-cc", channels: ["dashboard"] },
  },
  "T-09b-domestic-skip": {
    ruleId: "T-09b-domestic-skip",
    roger: { templateId: "R-09-received-at-cc", channels: ["dashboard"] },
  },
  // T-10 received → delivery-scheduled
  "T-10-scheduled": {
    ruleId: "T-10-scheduled",
    roger: { templateId: "R-10-delivery-scheduled", channels: ["dashboard"] },
  },
  // T-11 delivery-scheduled → delivered
  "T-11-pod-attached": {
    ruleId: "T-11-pod-attached",
    customer: { templateId: "C-09-delivered", channels: ["email", "whatsapp"] },
    roger: { templateId: "R-11-delivered", channels: ["dashboard", "whatsapp"] },
  },
  // T-12 delivered → balance-pending
  "T-12-balance-cfdi": {
    ruleId: "T-12-balance-cfdi",
    roger: { channels: ["dashboard"] },
    finance: { templateId: "F-07-balance-cfdi-request", channels: ["email"] },
  },
  // T-13 balance-pending → complete
  // R4 Note 8: customer template was C-10 (thank-you only). C-11-feedback
  // folds the thank-you, the satisfaction ask, and the installer-reach-out
  // line into a single message. C-10 stays in the registry for backwards
  // compat / manual sends but is no longer triggered automatically.
  "T-13-final-payment": {
    ruleId: "T-13-final-payment",
    customer: { templateId: "C-11-feedback", channels: ["email", "whatsapp"] },
    roger: { templateId: "R-13-complete", channels: ["dashboard"] },
  },
  // T-14 any → issue
  "T-14-critical-customs-hold": {
    ruleId: "T-14-critical-customs-hold",
    roger: { templateId: "R-14-issue", channels: ["dashboard", "whatsapp"] },
  },

  // =========================================================================
  // Cart Lifecycle Routes (T-15 → T-20)
  // =========================================================================

  // T-15 cart_submitted (quote path)
  "T-15-cart-submitted-quote": {
    ruleId: "T-15-cart-submitted-quote",
    customer: { templateId: "C-12-cart-received", channels: ["email", "whatsapp"] },
    roger: { templateId: "R-15-cart-submitted", channels: ["email", "whatsapp", "dashboard"] },
  },
  "T-15b-cart-submitted-buy": {
    ruleId: "T-15b-cart-submitted-buy",
    roger: { templateId: "R-15-cart-submitted", channels: ["email", "whatsapp", "dashboard"] },
  },

  // T-16 payment_initiated
  "T-16-payment-initiated": {
    ruleId: "T-16-payment-initiated",
    customer: { templateId: "C-13-complete-purchase", channels: ["email"] },
  },

  // T-17 payment_received (cart purchase)
  "T-17-payment-received": {
    ruleId: "T-17-payment-received",
    customer: { templateId: "C-14-payment-confirmed", channels: ["email", "whatsapp"] },
    roger: { templateId: "R-16-payment-received", channels: ["whatsapp", "dashboard"] },
    finance: { templateId: "F-08-cart-payment-recorded", channels: ["email", "dashboard"] },
  },

  // T-18 cart_abandoned (nightly sweep, 24h)
  "T-18-cart-abandoned": {
    ruleId: "T-18-cart-abandoned",
    customer: { templateId: "C-15-cart-abandoned", channels: ["email"] },
    roger: { templateId: "R-17-cart-abandoned", channels: ["dashboard"] },
  },

  // T-19 review_window_open (+7d post-delivery)
  "T-19-review-window": {
    ruleId: "T-19-review-window",
    customer: { templateId: "C-16-review-request", channels: ["email", "whatsapp"] },
  },

  // T-20 delivery_confirmed
  "T-20-delivery-confirmed": {
    ruleId: "T-20-delivery-confirmed",
    customer: { templateId: "C-21-delivered", channels: ["email", "whatsapp"] },
    roger: { templateId: "R-11-delivered", channels: ["dashboard"] },
  },
};

// ---------------------------------------------------------------------------
// Resend lazy singleton
// ---------------------------------------------------------------------------

let _resend: Resend | null = null;
const getResend = (): Resend | null => {
  if (_resend) return _resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[alert-dispatcher] RESEND_API_KEY not set — emails dry-run");
    return null;
  }
  _resend = new Resend(key);
  return _resend;
};

// ---------------------------------------------------------------------------
// Helpers — var extraction + recipient resolution
// ---------------------------------------------------------------------------

const formatBrandList = (slugs?: string[]): string =>
  !slugs || slugs.length === 0
    ? "your selection"
    : slugs.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(", ");

const guessCustomerEmail = (deal: PipelineDeal): string | null => {
  // W8 note: PipelineDeal doesn't carry a first-class customer email field.
  // We look for `deal.customerEmail` (optional, added W8) or fall back to
  // the `{contactName}@{company}` heuristic. In production Joshua populates
  // the deal's customer email via the Deals sheet.
  const maybe = (deal as unknown as { customerEmail?: string }).customerEmail;
  return typeof maybe === "string" && maybe.includes("@") ? maybe : null;
};

const guessCustomerPhone = (deal: PipelineDeal): string | null => {
  const maybe = (deal as unknown as { customerPhone?: string }).customerPhone;
  return typeof maybe === "string" && maybe.startsWith("+") ? maybe : null;
};

const buildBaseVars = (
  input: AlertDispatchInput
): Record<string, string> => {
  const { deal, extraVars = {} } = input;
  const vars: Record<string, string> = {
    deal_id: deal.id.replace(/^DEAL-?/, ""),
    project_name: deal.name,
    customer_name: deal.contactName,
    customer_first_name:
      deal.contactName?.split(/\s+/)[0] ?? guessFirstNameFromEmail(guessCustomerEmail(deal)),
    brand_list: formatBrandList(deal.brandSlugs),
    total_value: String(deal.value),
  };
  for (const [k, v] of Object.entries(extraVars)) {
    vars[k] = String(v);
  }
  return vars;
};

// ---------------------------------------------------------------------------
// Idempotency — has this {rule, deal, channel, recipient} already fired?
// ---------------------------------------------------------------------------

/**
 * Idempotency check against a pre-fetched event list — callers fetch
 * Deal_Events once at the top of dispatchAlertsForTransition and pass the
 * snapshot to every per-channel check, saving 4-5x Sheets reads per rule.
 */
const alreadyFired = (
  events: Awaited<ReturnType<typeof getDealEvents>>,
  ruleId: string,
  channel: AlertChannel,
  recipient: string,
  now: Date
): boolean => {
  const cutoff = new Date(now.getTime() - IDEMPOTENCY_WINDOW_MS).getTime();
  return events.some((e) => {
    if (e.event_type !== "alert_fired") return false;
    if (e.trigger_rule_id !== ruleId) return false;
    const ts = Date.parse(e.timestamp);
    if (!Number.isFinite(ts) || ts < cutoff) return false;
    try {
      const p = JSON.parse(e.payload_json || "{}") as {
        channel?: string;
        recipient?: string;
      };
      return p.channel === channel && p.recipient === recipient;
    } catch {
      return false;
    }
  });
};

// ---------------------------------------------------------------------------
// Per-channel send
// ---------------------------------------------------------------------------

const sendEmail = async (
  to: string,
  subject: string,
  body: string
): Promise<{ status: DeliveryStatus; error?: string }> => {
  const resend = getResend();
  if (!resend) return { status: "dry_run" };
  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject,
      text: body,
    });
    if (error) return { status: "failed", error: error.message };
    return { status: "sent" };
  } catch (err) {
    return { status: "failed", error: err instanceof Error ? err.message : String(err) };
  }
};

// ---------------------------------------------------------------------------
// Single-audience dispatch
// ---------------------------------------------------------------------------

interface DispatchOneInput {
  audience: AlertAudience;
  route: AudienceRoute;
  recipientEmail: string;
  recipientPhone: string;
  input: AlertDispatchInput;
  vars: Record<string, string>;
  now: Date;
  /** Pre-fetched Deal_Events for this deal (idempotency lookup) */
  existingEvents: Awaited<ReturnType<typeof getDealEvents>>;
}

const dispatchOne = async (
  opts: DispatchOneInput
): Promise<ChannelResult[]> => {
  const { audience, route, recipientEmail, recipientPhone, input, vars, now } = opts;
  const results: ChannelResult[] = [];
  const locale =
    audience === "customer" ? (input.customerLocale ?? "es") : "en";

  for (const channel of route.channels) {
    const recipient =
      channel === "email" ? recipientEmail :
      channel === "whatsapp" ? recipientPhone :
      audience;

    if (channel !== "dashboard" && !recipient) {
      results.push({ channel, status: "skipped", error: "no recipient" });
      continue;
    }

    // Idempotency
    if (!input.__testing?.skipIdempotency) {
      const dup = alreadyFired(opts.existingEvents, input.ruleId, channel, recipient, now);
      if (dup) {
        results.push({ channel, status: "skipped", error: "idempotent", recipient });
        continue;
      }
    }

    // Rate limit
    const rl = checkRateLimit(`${audience}:${recipient}`, route.templateId ?? "generic", channel);
    if (!rl.allowed) {
      results.push({
        channel,
        status: "skipped",
        error: "rate_limited",
        recipient,
        retryAfterSec: rl.retryAfterSec,
      });
      continue;
    }

    // Quiet hours (customer only)
    const deferUntil = input.__testing?.skipQuietHours
      ? null
      : nextAllowedDelivery(audience, now);
    if (deferUntil && (channel === "email" || channel === "whatsapp")) {
      const event = await appendDealEvent({
        deal_id: input.dealId,
        actor: input.actor,
        event_type: "alert_fired",
        from_stage: input.fromStage,
        to_stage: input.toStage,
        trigger_rule_id: input.ruleId,
        payload: {
          channel,
          template_id: route.templateId ?? "generic",
          recipient,
          status: "queued",
          audience,
          deliver_after: deferUntil,
          locale,
        },
      });
      await appendNotification({
        severity: "normal",
        audience:
          audience === "customer" ? "customer" :
          audience === "roger" ? "roger" : "finance",
        title: `Queued ${channel} alert for ${input.ruleId}`,
        body: `Deferred until ${deferUntil}`,
        source_entity_type: "deal_event",
        source_entity_id: input.dealId,
        deliver_after: deferUntil,
        delivery_channel: channel,
        recipient_email: channel === "email" ? recipient : undefined,
        recipient_phone: channel === "whatsapp" ? recipient : undefined,
      });
      results.push({
        channel,
        status: "queued",
        templateId: route.templateId,
        recipient,
        alertEventId: event.event_id,
        deliverAfter: deferUntil,
      });
      continue;
    }

    // Render
    const rendered = route.templateId
      ? renderAlertTemplate(route.templateId, vars, locale, channel)
      : null;
    // Fallback body for Roger when no template (generic transition note)
    const body =
      rendered && "body" in rendered
        ? rendered.body
        : `DEAL-${input.deal.id.replace(/^DEAL-?/, "")} moved ${input.fromStage} → ${input.toStage}`;
    const subject =
      rendered && "subject" in rendered
        ? (rendered as { subject: string }).subject
        : `DEAL-${input.deal.id.replace(/^DEAL-?/, "")} · ${input.toStage}`;

    // Send
    let status: DeliveryStatus = "failed";
    let error: string | undefined;

    if (channel === "email") {
      const r = await sendEmail(recipient, subject, body);
      status = r.status;
      error = r.error;
    } else if (channel === "whatsapp") {
      // Customer WA → template send (Meta-approved template name required in prod)
      // Roger WA → free-text (within his active 24h session window)
      if (audience === "customer") {
        const t = route.templateId
          ? ALERT_TEMPLATES[route.templateId]
          : undefined;
        const metaName = t?.whatsapp?.metaTemplateName;
        if (!metaName) {
          // No Meta-approved name yet; WhatsApp send is dry-run until Joshua
          // registers + approves the templates. The dispatcher still records
          // the attempt so counts line up.
          console.log(
            `[alert-dispatcher WA stub] metaTemplateName missing for ${route.templateId} — dry-run`
          );
          status = isWhatsAppEnabled() ? "skipped" : "dry_run";
          if (status === "skipped") error = "meta_template_not_registered";
        } else {
          const r = await sendWhatsAppTemplate({
            to: recipient,
            templateName: metaName,
            languageCode: locale === "es" ? "es_MX" : "en",
            components: [{ type: "body", parameters: Object.values(vars).map((v) => ({ type: "text", text: v })) }],
          });
          status = r.status;
          error = r.error;
        }
      } else {
        const r = await sendWhatsAppFreeText(recipient, body);
        status = r.status;
        error = r.error;
      }
    } else {
      // dashboard: write a Notifications row — bell UI picks up within 60s
      try {
        await appendNotification({
          severity: input.ruleId === "T-14-critical-customs-hold" ? "critical" : "normal",
          audience: audience === "roger" ? "roger" : audience === "finance" ? "finance" : "customer",
          title: subject,
          body,
          source_entity_type: "deal_event",
          source_entity_id: input.dealId,
          delivery_channel: "dashboard",
        });
        status = "sent";
      } catch (err) {
        status = "failed";
        error = err instanceof Error ? err.message : String(err);
      }
    }

    const event = await appendDealEvent({
      deal_id: input.dealId,
      actor: input.actor,
      event_type: "alert_fired",
      from_stage: input.fromStage,
      to_stage: input.toStage,
      trigger_rule_id: input.ruleId,
      payload: {
        channel,
        template_id: route.templateId ?? "generic",
        recipient,
        status,
        audience,
        locale,
        error,
      },
    });

    results.push({
      channel,
      status,
      templateId: route.templateId,
      recipient,
      alertEventId: event.event_id,
      error,
    });
  }

  return results;
};

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

const IS_STAGING = Boolean(process.env.STAGING_EMAIL_REDIRECT);
const TEST_DEAL_PATTERN = /\btest\b/i;

const isTestDeal = (deal: PipelineDeal): boolean =>
  IS_STAGING &&
  (TEST_DEAL_PATTERN.test(deal.name) ||
    TEST_DEAL_PATTERN.test(deal.contactName));

export const dispatchAlertsForTransition = async (
  input: AlertDispatchInput
): Promise<AlertDispatchResult> => {
  if (isTestDeal(input.deal)) {
    console.info(
      `[alert-dispatcher] Skipping alerts for test deal ${input.dealId} (${input.ruleId})`
    );
    return {
      ruleId: input.ruleId,
      dealId: input.dealId,
      customer: [],
      roger: [],
      finance: [],
    };
  }

  const route = ALERT_ROUTES[input.ruleId];
  if (!route) {
    // Unknown rule → no-op but still return a well-formed empty result
    return {
      ruleId: input.ruleId,
      dealId: input.dealId,
      customer: [],
      roger: [],
      finance: [],
    };
  }

  const vars = buildBaseVars(input);
  const now = input.__testing?.now ?? new Date();

  const customerEmail = guessCustomerEmail(input.deal) ?? "";
  const customerPhone = guessCustomerPhone(input.deal) ?? "";

  // Fetch Deal_Events ONCE for idempotency across all three audiences —
  // otherwise we'd do 3 parallel reads × N rules during the nightly sweep
  // and blow through Google Sheets' per-minute read quota.
  const existingEvents = input.__testing?.skipIdempotency
    ? []
    : await getDealEvents(input.dealId);

  // Run audiences sequentially (not Promise.all) so that the same rule's
  // multiple channels to the same recipient (e.g. customer email + WA)
  // don't both pass idempotency before the first one's alert_fired row
  // is written. This also stretches Sheets writes over time, reducing the
  // chance of a per-minute quota breach.
  const customer = route.customer
    ? await dispatchOne({
        audience: "customer",
        route: route.customer,
        recipientEmail: customerEmail,
        recipientPhone: customerPhone,
        input, vars, now, existingEvents,
      })
    : [];
  const roger = route.roger
    ? await dispatchOne({
        audience: "roger",
        route: route.roger,
        recipientEmail: ROGER_EMAIL,
        recipientPhone: ROGER_WA,
        input, vars, now, existingEvents,
      })
    : [];
  const finance = route.finance
    ? await dispatchOne({
        audience: "finance",
        route: route.finance,
        recipientEmail: FINANCE_EMAIL,
        recipientPhone: "",
        input, vars, now, existingEvents,
      })
    : [];

  return { ruleId: input.ruleId, dealId: input.dealId, customer, roger, finance };
};
