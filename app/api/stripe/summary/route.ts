import { NextResponse } from "next/server";
import { getStripe, isConfigured } from "@/app/lib/stripe";

export const maxDuration = 30;

export const GET = async () => {
  if (!isConfigured()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  try {
    const stripe = getStripe();

    // Get balance
    const balance = await stripe.balance.retrieve();

    // Get recent charges count & volume (last 30 days)
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;

    const [recentCharges, recentRefunds, customerCount] = await Promise.all([
      stripe.charges.list({ limit: 100, created: { gte: thirtyDaysAgo } }),
      stripe.refunds.list({ limit: 100, created: { gte: thirtyDaysAgo } }),
      stripe.customers.list({ limit: 1 }),
    ]);

    const successfulCharges = recentCharges.data.filter((c) => c.status === "succeeded");
    const totalVolume = successfulCharges.reduce((sum, c) => sum + c.amount, 0);
    const totalRefunded = recentRefunds.data.reduce((sum, r) => sum + r.amount, 0);

    // Get available and pending balances
    const availableBalance = balance.available.reduce((sum, b) => sum + b.amount, 0);
    const pendingBalance = balance.pending.reduce((sum, b) => sum + b.amount, 0);

    // Get primary currency
    const primaryCurrency = balance.available[0]?.currency?.toUpperCase() ?? "MXN";

    const summary = {
      balance: {
        available: availableBalance,
        pending: pendingBalance,
        currency: primaryCurrency,
      },
      last30Days: {
        charges: successfulCharges.length,
        volume: totalVolume,
        refunds: recentRefunds.data.length,
        refundedAmount: totalRefunded,
        currency: primaryCurrency,
      },
      customers: {
        total: customerCount.data.length > 0 ? "1+" : "0",
      },
    };

    return NextResponse.json(summary);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
};
