import { NextRequest, NextResponse } from "next/server";
import { getStripe, isConfigured } from "@/app/lib/stripe";
import { getProducts } from "@/app/lib/sheets";

const VALID_CURRENCIES = new Set(["mxn", "usd"]);
const VALID_DEPOSIT_PERCENTS = new Set([30, 50, 100]);

export const POST = async (req: NextRequest) => {
  if (!isConfigured()) {
    return NextResponse.json({ error: "Online payments not available" }, { status: 503 });
  }

  const { productSku, currency = "mxn", locale = "en", depositPercent } = await req.json();

  if (!productSku || typeof productSku !== "string") {
    return NextResponse.json({ error: "Product SKU is required" }, { status: 400 });
  }

  if (!VALID_CURRENCIES.has(currency)) {
    return NextResponse.json({ error: "Invalid currency" }, { status: 400 });
  }

  if (depositPercent !== undefined && !VALID_DEPOSIT_PERCENTS.has(depositPercent)) {
    return NextResponse.json({ error: "Invalid deposit percentage" }, { status: 400 });
  }

  // Look up the product server-side — never trust client-supplied amounts
  const products = await getProducts();
  const product = products.find((p) => p.sku === productSku);

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const amount = product.price;
  const productName = product.nameEn || product.name;

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
