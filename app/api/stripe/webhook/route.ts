import type Stripe from "stripe";
import { getStripe, isConfigured } from "@/app/lib/stripe";
import { dispatchStripeEvent } from "./dispatcher";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";

// Boot-time validation: surface misconfiguration loudly instead of silently
// 503-ing every event. We don't throw (would break dev), but we log a loud
// warning that shows up on every cold start.
if (!WEBHOOK_SECRET) {
  console.warn(
    "[Stripe Webhook] STRIPE_WEBHOOK_SECRET is not set — every webhook " +
      "request will return 503 and Stripe events will be silently dropped. " +
      "Set the secret in .env.local (Stripe Dashboard > Webhooks > Signing secret)."
  );
}
if (!isConfigured()) {
  console.warn(
    "[Stripe Webhook] STRIPE_SECRET_KEY is not set — webhook cannot verify signatures."
  );
}

export async function POST(request: Request): Promise<Response> {
  if (!isConfigured() || !WEBHOOK_SECRET) {
    console.error(
      "[Stripe Webhook] Rejecting request: webhook not configured " +
        `(secretSet=${Boolean(WEBHOOK_SECRET)}, stripeConfigured=${isConfigured()})`
    );
    return new Response(
      JSON.stringify({
        error: "Stripe webhook not configured",
        missing: [
          !WEBHOOK_SECRET && "STRIPE_WEBHOOK_SECRET",
          !isConfigured() && "STRIPE_SECRET_KEY",
        ].filter(Boolean),
      }),
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
    const message =
      err instanceof Error ? err.message : "Signature verification failed";
    console.error("[Stripe Webhook] Signature verification failed:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const result = await dispatchStripeEvent(event);

  return new Response(JSON.stringify({ received: true, result }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
