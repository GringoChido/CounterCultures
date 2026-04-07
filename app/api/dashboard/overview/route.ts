import { NextResponse } from "next/server";
import { readSheet } from "@/app/lib/dashboard-sheets";

export const GET = async () => {
  try {
    const [leads, pipeline, salesMetrics] = await Promise.all([
      readSheet<Record<string, string>>("Leads"),
      readSheet<Record<string, string>>("Pipeline"),
      readSheet<Record<string, string>>("Sales_Metrics"),
    ]);

    // Lead counts by status
    const leadCounts: Record<string, number> = {};
    leads.forEach((l) => {
      const status = l.status || "unknown";
      leadCounts[status] = (leadCounts[status] || 0) + 1;
    });

    // Pipeline totals by stage
    const pipelineByStage: Record<string, { count: number; value: number }> = {};
    let totalPipelineValue = 0;
    pipeline.forEach((d) => {
      const stage = d.stage || "unknown";
      const value = parseFloat(d.value) || 0;
      if (!pipelineByStage[stage]) pipelineByStage[stage] = { count: 0, value: 0 };
      pipelineByStage[stage].count++;
      pipelineByStage[stage].value += value;
      totalPipelineValue += value;
    });

    // Latest sales metric row
    const latestSales = salesMetrics.length > 0
      ? salesMetrics[salesMetrics.length - 1]
      : null;

    return NextResponse.json({
      totalLeads: leads.length,
      leadCounts,
      totalDeals: pipeline.length,
      totalPipelineValue,
      pipelineByStage,
      latestSales,
    });
  } catch (err) {
    console.error("[Overview API] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch overview data" },
      { status: 500 }
    );
  }
};
