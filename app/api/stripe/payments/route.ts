import { NextRequest, NextResponse } from "next/server";
import { getStripe, isConfigured } from "@/app/lib/stripe";

export const GET = async (req: NextRequest) => {
  if (!isConfigured()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  try {
    const stripe = getStripe();
    const params = req.nextUrl.searchParams;
    const limit = Number(params.get("limit") ?? "25");
    const startingAfter = params.get("starting_after") ?? undefined;

    const charges = await stripe.charges.list({
      limit,
      starting_after: startingAfter,
      expand: ["data.customer"],
    });

    const payments = charges.data.map((charge) => ({
      id: charge.id,
      amount: charge.amount,
      currency: charge.currency,
      status: charge.status,
      description: charge.description,
      customerEmail: typeof charge.customer === "object" && charge.customer && "email" in charge.customer
        ? charge.customer.email
        : charge.receipt_email,
      customerName: typeof charge.customer === "object" && charge.customer && "name" in charge.customer
        ? charge.customer.name
        : null,
      created: charge.created,
      receiptUrl: charge.receipt_url,
      refunded: charge.refunded,
      amountRefunded: charge.amount_refunded,
      paymentMethod: charge.payment_method_details?.type ?? null,
    }));

    return NextResponse.json({
      payments,
      hasMore: charges.has_more,
      total: payments.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
};
