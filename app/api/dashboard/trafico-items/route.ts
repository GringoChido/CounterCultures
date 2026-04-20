import { NextResponse, type NextRequest } from "next/server";
import { readSheet } from "@/app/lib/dashboard-sheets";

// Global list of every Trafico_Item row. Used by the Pipeline page to
// build a Map<dealId, riskFlag> in one fetch (instead of N+1 per-Trafico
// items calls). Optional ?dealId filter.
export const GET = async (request: NextRequest) => {
  const dealId = request.nextUrl.searchParams.get("dealId");
  try {
    let items = await readSheet<Record<string, string>>("Trafico_Items");
    if (dealId) {
      items = items.filter((i) => i.Deal_ID === dealId);
    }
    return NextResponse.json({ items });
  } catch (err) {
    console.error("[Trafico Items List API] GET error:", err);
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
  }
};
