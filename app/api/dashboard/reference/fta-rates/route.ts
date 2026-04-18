import { NextResponse } from "next/server";
import { getFtaRates } from "@/app/lib/shipments-reference";

export const GET = async () => {
  try {
    const rows = await getFtaRates();
    return NextResponse.json({ rows });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "fetch_failed";
    console.error("[reference fta-rates]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
};
