import { NextResponse } from "next/server";
import { readSheet } from "@/app/lib/dashboard-sheets";

type MarketingMetricRecord = {
  date: string;
  website_visits: string;
  unique_visitors: string;
  bounce_rate: string;
  avg_session: string;
  top_pages: string;
  conversion_rate: string;
};

export const GET = async () => {
  try {
    const metrics = await readSheet<MarketingMetricRecord>("Marketing_Metrics");
    return NextResponse.json({ metrics });
  } catch (err) {
    console.error("[Marketing Analytics API] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch marketing metrics" },
      { status: 500 }
    );
  }
};
