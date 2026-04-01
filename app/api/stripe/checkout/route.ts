import { NextRequest, NextResponse } from "next/server";
import { getStripe, isConfigured } from "@/app/lib/stripe";

export const POST = async (req: NextRequest) => {
  if (!isConfigured()) {
    return NextResponse.json({ error: "Online payments not available" }, { status: 503 });
  }

  const { productName, productSku, amount, currency = "mxn", locale = "en", depositPercent } = await req.json();

  const stripe = getStripe();

  const chargeAmount = depositPercent
    ? Math.round(amount * (depositPercent / 100))
    : amount;

  const description = depositPercent
    ? `${depositPercent}% deposit for ${productName} (SKU: ${productSku})`
    : `SKU: ${productSku}`;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [{
      price_data: {
        currency,
        product_data: {
          name: depositPercent ? `${productName} — ${depositPercent}% Deposit` : productName,
          description,
        },
        unit_amount: Math.round(chargeAmount * 100),
      },
      quantity: 1,
    }],
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://countercultures.mx"}/${locale}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://countercultures.mx"}/${locale}/shop?payment=cancelled`,
    metadata: { sku: productSku, source: "website", depositPercent: depositPercent?.toString() ?? "" },
  });

  return NextResponse.json({ url: session.url });
};
