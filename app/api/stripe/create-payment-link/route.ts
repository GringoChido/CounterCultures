import { NextRequest, NextResponse } from "next/server";
import { getStripe, isConfigured } from "@/app/lib/stripe";

export const POST = async (req: NextRequest) => {
  if (!isConfigured()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  try {
    const { priceId, customAmount, currency = "mxn", customerEmail } = await req.json();
    const stripe = getStripe();

    let resolvedPriceId: string;

    if (priceId) {
      resolvedPriceId = priceId;
    } else if (customAmount) {
      // Create an ad-hoc price for custom amounts
      const price = await stripe.prices.create({
        currency,
        unit_amount: Math.round(customAmount * 100),
        product_data: { name: "Custom Payment" },
      });
      resolvedPriceId = price.id;
    } else {
      return NextResponse.json({ error: "Provide priceId or customAmount" }, { status: 400 });
    }

    const params: Parameters<typeof stripe.paymentLinks.create>[0] = {
      line_items: [{ price: resolvedPriceId, quantity: 1 }],
    };

    if (customerEmail) {
      params.after_completion = {
        type: "redirect",
        redirect: { url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://countercultures.mx"}/en/shop?payment=success` },
      };
    }

    const link = await stripe.paymentLinks.create(params);

    return NextResponse.json({ url: link.url, id: link.id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create payment link" },
      { status: 500 }
    );
  }
};
