/**
 * Stripe event dispatcher — library-level (no signature verification, no
 * HTTP framing). Wrapped by the route.ts POST handler and called directly
 * from tests with synthetic events.
 *
 * Handles:
 *   - invoice.payment_succeeded → update Deal_Payments, fire rule engine
 *     (stripe_payment trigger) so the deal advances per T-03/T-13
 *   - invoice.payment_failed → mark Deal_Payments row failed
 *
 * Idempotency: event.id-keyed in-memory LRU (bounded to 1000 entries).
 * Stripe retries same event.id within minutes so in-memory is sufficient
 * at CC's volume; for higher volume, swap to a Stripe_Events_Processed
 * sheet (noted in design §7).
 */

import type Stripe from "stripe";
import {
  readSheet,
  findRowIndex,
  updateRow,
  appendRow,
} from "@/app/lib/dashboard-sheets";
import { calculateStripeFees } from "@/app/lib/deal-automation";
import { evaluateAndTransition } from "@/app/lib/rule-engine";

// ---------------------------------------------------------------------------
// Event-id idempotency LRU
// ---------------------------------------------------------------------------

const MAX_EVENTS = 1000;
const processedEventIds = new Map<string, number>();

const isProcessed = (id: string): boolean => processedEventIds.has(id);
const markProcessed = (id: string): void => {
  processedEventIds.set(id, Date.now());
  if (processedEventIds.size > MAX_EVENTS) {
    // Evict oldest (insertion order == oldest first in Map)
    const oldestKey = processedEventIds.keys().next().value;
    if (oldestKey !== undefined) processedEventIds.delete(oldestKey);
  }
};

// ---------------------------------------------------------------------------
// Audit logger — unchanged from the original route
// ---------------------------------------------------------------------------

const logActivity = async (action: string, details: string): Promise<void> => {
  const now = new Date().toISOString();
  await appendRow("Activity_Log", [
    `LOG-${Date.now()}`,
    "system",
    "Stripe Webhook",
    action,
    details,
    now,
  ]);
};

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

const handlePaymentSucceeded = async (
  invoice: Stripe.Invoice
): Promise<void> => {
  const stripeInvoiceId = invoice.id ?? "";
  const amountPaid = (invoice.amount_paid ?? 0) / 100;

  if (!stripeInvoiceId) {
    console.warn("[Stripe Webhook] invoice.id missing on payment_succeeded event");
    return;
  }

  const rowIndex = await findRowIndex(
    "Deal_Payments",
    "Stripe_Invoice_ID",
    stripeInvoiceId
  );

  if (rowIndex === null) {
    console.warn(
      `[Stripe Webhook] No Deal_Payments row found for invoice ${stripeInvoiceId}`
    );
    await logActivity(
      "payment_received_unmatched",
      `Stripe invoice ${stripeInvoiceId} paid ($${amountPaid}) but no matching Deal_Payments row found`
    );
    return;
  }

  const rows = await readSheet<Record<string, string>>("Deal_Payments");
  const row = rows[rowIndex];
  if (!row) return;

  const headers = Object.keys(row);
  const stripeFees = calculateStripeFees(amountPaid);
  const paidDate = new Date().toISOString().split("T")[0];

  const updatedRow: Record<string, string> = {
    ...row,
    Status: "paid",
    Paid_Date: paidDate,
    Stripe_Fees: String(stripeFees),
    Net_Received: String(amountPaid - stripeFees),
  };

  const values = headers.map((h) => updatedRow[h] ?? "");
  await updateRow("Deal_Payments", rowIndex, values);

  await logActivity(
    "payment_received",
    `Invoice ${stripeInvoiceId} paid: $${amountPaid} MXN (fees: $${stripeFees}, net: $${amountPaid - stripeFees})`
  );

  // W7: fire rule engine so T-03 / T-13 advance the deal.
  const dealId = row.Deal_ID;
  const type = row.Type; // "deposit" | "balance" | "full"
  if (dealId && type) {
    try {
      await evaluateAndTransition(
        "stripe_payment",
        dealId,
        { allocated_to: type, amount: amountPaid, invoice_id: stripeInvoiceId },
        "stripe"
      );
    } catch (err) {
      console.error(
        `[Stripe Webhook] rule engine failed for ${dealId}:`,
        err instanceof Error ? err.message : err
      );
    }
  }
};

// V3: payment_intent.succeeded — fires for checkout/payment-link flows that
// don't produce invoices. If the PaymentIntent carries metadata.deal_id, we
// advance that deal via the rule engine using metadata.allocated_to (deposit
// | balance | full). Invoice-driven payments still go through
// handlePaymentSucceeded above.
const handlePaymentIntentSucceeded = async (
  pi: Stripe.PaymentIntent
): Promise<void> => {
  const dealId = pi.metadata?.deal_id;
  if (!dealId) {
    // Not a portal-initiated payment intent — ignore silently (common: one-off
    // Stripe charges from dashboard).
    return;
  }

  const amount = (pi.amount_received ?? pi.amount ?? 0) / 100;
  const allocated = pi.metadata?.allocated_to ?? "full";

  await logActivity(
    "payment_intent_succeeded",
    `PI ${pi.id} succeeded for deal ${dealId}: $${amount} MXN (${allocated})`
  );

  try {
    await evaluateAndTransition(
      "stripe_payment",
      dealId,
      {
        allocated_to: allocated,
        amount,
        invoice_id: pi.id,
      },
      "stripe"
    );
  } catch (err) {
    console.error(
      `[Stripe Webhook] rule engine failed for PI ${pi.id}/${dealId}:`,
      err instanceof Error ? err.message : err
    );
  }
};

const handlePaymentFailed = async (invoice: Stripe.Invoice): Promise<void> => {
  const stripeInvoiceId = invoice.id ?? "";
  if (!stripeInvoiceId) return;

  const rowIndex = await findRowIndex(
    "Deal_Payments",
    "Stripe_Invoice_ID",
    stripeInvoiceId
  );

  if (rowIndex === null) {
    console.warn(
      `[Stripe Webhook] No Deal_Payments row found for failed invoice ${stripeInvoiceId}`
    );
    return;
  }

  const rows = await readSheet<Record<string, string>>("Deal_Payments");
  const row = rows[rowIndex];
  if (!row) return;

  const headers = Object.keys(row);
  const updatedRow: Record<string, string> = { ...row, Status: "failed" };
  const values = headers.map((h) => updatedRow[h] ?? "");
  await updateRow("Deal_Payments", rowIndex, values);

  await logActivity(
    "payment_failed",
    `Invoice ${stripeInvoiceId} payment failed for customer ${invoice.customer_email ?? "unknown"}`
  );
};

// ---------------------------------------------------------------------------
// Checkout Session → Quote Deposit paid
// ---------------------------------------------------------------------------

/**
 * Fires when a customer pays their quote deposit via the Stripe payment link
 * minted by /api/dashboard/deals/[id]/share. The link carries metadata
 * {dealId, kind:"quote_deposit"}, which we use here to advance the deal
 * past Discovery and log the payment.
 */
const handleCheckoutSessionCompleted = async (
  session: Stripe.Checkout.Session
): Promise<void> => {
  const dealId = (session.metadata?.dealId ?? "").toString().trim();
  const kind = (session.metadata?.kind ?? "").toString();
  if (!dealId || kind !== "quote_deposit") {
    // Not our deposit flow — ignore quietly.
    return;
  }

  const amount = (session.amount_total ?? 0) / 100;
  const currency = (session.currency ?? "mxn").toUpperCase();
  const email =
    session.customer_details?.email ?? session.customer_email ?? "";
  const sessionId = session.id;
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? "";

  // Append a Deal_Payments row so the payment shows in deal history.
  try {
    await appendRow("Deal_Payments", [
      `PAY-${Date.now()}`,
      dealId,
      amount.toString(),
      currency,
      "paid",
      "quote_deposit",
      new Date().toISOString(),
      sessionId,
      paymentIntentId,
      email,
    ]);
  } catch (err) {
    console.error("[Stripe Webhook] Failed to append Deal_Payments row:", err);
  }

  // Fire rule engine so any configured stage transitions apply automatically.
  try {
    await evaluateAndTransition(
      "stripe_payment",
      dealId,
      { kind: "quote_deposit", amount, currency, sessionId },
      "stripe-webhook"
    );
  } catch (err) {
    console.error("[Stripe Webhook] rule engine failed:", err);
  }

  await logActivity(
    "quote_deposit_paid",
    `Deal ${dealId}: ${currency} ${amount} deposit paid${
      email ? ` by ${email}` : ""
    } (session ${sessionId})`
  );
};

// ---------------------------------------------------------------------------
// Public: dispatch
// ---------------------------------------------------------------------------

export type DispatchResult = "processed" | "duplicate" | "unhandled";

export const dispatchStripeEvent = async (
  event: Stripe.Event
): Promise<DispatchResult> => {
  if (isProcessed(event.id)) return "duplicate";

  try {
    switch (event.type) {
      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        markProcessed(event.id);
        return "processed";
      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        markProcessed(event.id);
        return "processed";
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent
        );
        markProcessed(event.id);
        return "processed";
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        markProcessed(event.id);
        return "processed";
      default:
        console.warn(`[Stripe Webhook] Unhandled event type: ${event.type}`);
        return "unhandled";
    }
  } catch (err) {
    console.error(`[Stripe Webhook] Error processing ${event.type}:`, err);
    return "unhandled";
  }
};

// Test-only: reset the idempotency cache between runs so the same event
// can be re-dispatched in a fresh test. Not used in production.
export const __resetProcessedIdsForTests = (): void => {
  processedEventIds.clear();
};
