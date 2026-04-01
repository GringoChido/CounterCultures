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

    const payouts = await stripe.payouts.list({ limit });

    const data = payouts.data.map((p) => ({
      id: p.id,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      arrivalDate: p.arrival_date,
      created: p.created,
      method: p.method,
      type: p.type,
      description: p.description,
    }));

    return NextResponse.json({
      payouts: data,
      hasMore: payouts.has_more,
      total: data.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
};
