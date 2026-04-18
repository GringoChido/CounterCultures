import { NextResponse } from "next/server";
import { getBrandLeadTimes } from "@/app/lib/shipments-reference";

export const GET = async () => {
  try {
    const rows = await getBrandLeadTimes();
    return NextResponse.json({ rows });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "fetch_failed";
    console.error("[reference brand-lead-times]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
};
