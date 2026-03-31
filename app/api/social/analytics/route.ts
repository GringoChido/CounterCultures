import { NextRequest, NextResponse } from "next/server";
import { getFacebookInsights, getInstagramInsights } from "@/app/lib/social/meta-api";
import { sampleAnalytics } from "@/app/lib/social/sample-data";

export async function GET(request: NextRequest) {
  const period = request.nextUrl.searchParams.get("period") || "30d";
  const platform = request.nextUrl.searchParams.get("platform") || "all";

  // Try live API
  const apiPeriod = period === "7d" ? "week" : "days_28";
  const [fbResult, igResult] = await Promise.all([
    platform !== "instagram"
      ? getFacebookInsights(apiPeriod as "week" | "days_28")
      : Promise.resolve({ success: false as const, error: "skipped" }),
    platform !== "facebook"
      ? getInstagramInsights(apiPeriod as "week" | "days_28")
      : Promise.resolve({ success: false as const, error: "skipped" }),
  ]);

  if (fbResult.success || igResult.success) {
    return NextResponse.json({
      facebook: fbResult.success && "data" in fbResult ? fbResult.data : null,
      instagram: igResult.success && "data" in igResult ? igResult.data : null,
      source: "live",
    });
  }

  // Fall back to sample data
  const periodKey = period === "7d" ? "7d" : "30d";
  return NextResponse.json({
    instagram: sampleAnalytics[`instagram_${periodKey}`],
    facebook: sampleAnalytics[`facebook_${periodKey}`],
    source: "sample",
  });
}
