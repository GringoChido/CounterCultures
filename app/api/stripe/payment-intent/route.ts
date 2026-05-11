import { NextResponse, type NextRequest } from "next/server";
import { getStripe, isConfigured } from "@/app/lib/stripe";

export async function POST(req: NextRequest) {
  if (!isConfigured()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  try {
    const { dealId, cartSessionId, amount, currency = "mxn", customerEmail } = await req.json();

    if (!dealId || !amount || amount <= 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const stripe = getStripe();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata: {
        kind: "cart_purchase",
        deal_id: dealId,
        cart_session_id: cartSessionId ?? "",
      },
      receipt_email: customerEmail,
      description: `Counter Cultures order ${dealId}`,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err) {
    console.error("[stripe/payment-intent] Error:", err);
    return NextResponse.json({ error: "Failed to create payment intent" }, { status: 500 });
  }
}
