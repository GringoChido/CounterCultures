import { NextResponse } from "next/server";
import { getBrandNomStatus } from "@/app/lib/shipments-reference";

export const GET = async () => {
  try {
    const rows = await getBrandNomStatus();
    return NextResponse.json({ rows });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "fetch_failed";
    console.error("[reference brand-nom-status]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
};
