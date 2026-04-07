import { NextResponse } from "next/server";
import { readSheet } from "@/app/lib/dashboard-sheets";

type SalesMetricRecord = {
  date: string;
  total_revenue: string;
  deals_closed: string;
  avg_deal_size: string;
  conversion_rate: string;
  pipeline_value: string;
  new_leads: string;
};

export const GET = async () => {
  try {
    const metrics = await readSheet<SalesMetricRecord>("Sales_Metrics");
    return NextResponse.json({ metrics });
  } catch (err) {
    console.error("[Sales Analytics API] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch sales metrics" },
      { status: 500 }
    );
  }
};
