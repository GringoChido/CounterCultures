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
    const search = params.get("search") ?? "";

    let customers;
    if (search) {
      customers = await stripe.customers.search({
        query: `name~"${search}" OR email~"${search}"`,
        limit,
      });
    } else {
      customers = await stripe.customers.list({ limit });
    }

    const data = customers.data.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      currency: c.currency,
      created: c.created,
      balance: c.balance,
      defaultSource: c.default_source,
    }));

    return NextResponse.json({
      customers: data,
      hasMore: customers.has_more,
      total: data.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
};
