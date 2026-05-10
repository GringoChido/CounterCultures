/**
 * GET /api/dashboard/fx — returns FX rate.
 * Accepts optional query params: ?from=USD&to=MXN&date=YYYY-MM-DD
 * Defaults to USD→MXN for today when no params given.
 */

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentFXRate, getFXRateForDate } from "@/app/lib/fx";

export const GET = async (req: NextRequest): Promise<Response> => {
  try {
    const sp = req.nextUrl.searchParams;
    const from = sp.get("from");
    const to = sp.get("to");
    const date = sp.get("date") ?? undefined;

    if (from && to) {
      const result = await getFXRateForDate(from, to, date);
      return NextResponse.json({ rate: result });
    }

    const rate = await getCurrentFXRate();
    return NextResponse.json({ rate });
  } catch (err) {
    console.error("[/api/dashboard/fx]", err);
    return NextResponse.json({ rate: null });
  }
};
