import { NextResponse } from "next/server";
import { getHsCodes } from "@/app/lib/shipments-reference";

export const GET = async () => {
  try {
    const rows = await getHsCodes();
    return NextResponse.json({ rows });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "fetch_failed";
    console.error("[reference hs-codes]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
};
