import type Stripe from "stripe";
import { getStripe, isConfigured } from "@/app/lib/stripe";
import {
  readSheet,
  findRowIndex,
  updateRow,
  appendRow,
} from "@/app/lib/dashboard-sheets";
import { calculateStripeFees } from "@/app/lib/deal-automation";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";

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

const handlePaymentSucceeded = async (invoice: Stripe.Invoice): Promise<void> => {
  const stripeInvoiceId = invoice.id;
  const amountPaid = (invoice.amount_paid ?? 0) / 100;

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
};

const handlePaymentFailed = async (invoice: Stripe.Invoice): Promise<void> => {
  const stripeInvoiceId = invoice.id;

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

export async function POST(request: Request): Promise<Response> {
  if (!isConfigured() || !WEBHOOK_SECRET) {
    return new Response(
      JSON.stringify({ error: "Stripe webhook not configured" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return new Response(
      JSON.stringify({ error: "Missing stripe-signature header" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Signature verification failed";
    console.error("[Stripe Webhook] Signature verification failed:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    switch (event.type) {
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }
      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error(`[Stripe Webhook] Error processing ${event.type}:`, err);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
