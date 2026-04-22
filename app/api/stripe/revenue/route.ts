import { NextResponse } from "next/server";
import { getStripe, isConfigured } from "@/app/lib/stripe";

export const maxDuration = 30;

type Period = "today" | "week" | "month" | "quarter" | "year";

const periodStartSeconds = (period: Period): number => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  switch (period) {
    case "today":
      break;
    case "week": {
      const day = start.getDay();
      const diff = day === 0 ? 6 : day - 1;
      start.setDate(start.getDate() - diff);
      break;
    }
    case "month":
      start.setDate(1);
      break;
    case "quarter": {
      const q = Math.floor(start.getMonth() / 3);
      start.setMonth(q * 3, 1);
      break;
    }
    case "year":
      start.setMonth(0, 1);
      break;
  }

  return Math.floor(start.getTime() / 1000);
};

export const GET = async (request: Request) => {
  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const periodParam = (searchParams.get("period") ?? "today") as Period;
  const valid: Period[] = ["today", "week", "month", "quarter", "year"];
  const period = valid.includes(periodParam) ? periodParam : "today";

  try {
    const stripe = getStripe();
    const gte = periodStartSeconds(period);

    // Stripe pagination — iterate up to 5 pages of 100 charges each (500 max).
    // For CC's current volume this is more than enough for any period.
    let count = 0;
    let volume = 0;
    let refunds = 0;
    let currency = "mxn";
    let startingAfter: string | undefined;
    let pages = 0;

    do {
      const page = await stripe.charges.list({
        limit: 100,
        created: { gte },
        starting_after: startingAfter,
      });

      for (const charge of page.data) {
        if (charge.status !== "succeeded") continue;
        count += 1;
        volume += charge.amount;
        refunds += charge.amount_refunded;
        if (charge.currency) currency = charge.currency;
      }

      startingAfter = page.has_more
        ? page.data[page.data.length - 1]?.id
        : undefined;
      pages += 1;
    } while (startingAfter && pages < 5);

    return NextResponse.json({
      period,
      gte,
      count,
      volume,
      refunds,
      net: volume - refunds,
      currency: currency.toUpperCase(),
    });
  } catch (err) {
    console.error("[/api/stripe/revenue] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
};
