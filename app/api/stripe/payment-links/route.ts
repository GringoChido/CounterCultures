import { NextResponse } from "next/server";
import { getStripe, isConfigured } from "@/app/lib/stripe";

export const GET = async () => {
  if (!isConfigured()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  try {
    const stripe = getStripe();
    const links = await stripe.paymentLinks.list({ limit: 25 });

    const formatted = links.data.map((l) => ({
      id: l.id,
      url: l.url,
      active: l.active,
    }));

    return NextResponse.json({ links: formatted });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch payment links" },
      { status: 500 }
    );
  }
};
