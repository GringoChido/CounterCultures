import { NextResponse } from "next/server";
import { getStripe, isConfigured } from "@/app/lib/stripe";

export const GET = async () => {
  if (!isConfigured()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  try {
    const stripe = getStripe();
    const products = await stripe.products.list({
      limit: 50,
      active: true,
      expand: ["data.default_price"],
    });

    const formatted = products.data.map((p) => {
      const price = p.default_price && typeof p.default_price === "object"
        ? { amount: p.default_price.unit_amount, currency: p.default_price.currency }
        : null;
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        active: p.active,
        images: p.images,
        price,
        created: p.created,
      };
    });

    return NextResponse.json({ products: formatted });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch products" },
      { status: 500 }
    );
  }
};
