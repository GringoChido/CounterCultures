import type Stripe from "stripe";
import { getStripe, isConfigured } from "@/app/lib/stripe";
import { dispatchStripeEvent } from "./dispatcher";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";

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
