/**
 * GET /api/dashboard/fx — returns the most recent USD→MXN rate stored in
 * the FX_Rates sheet tab. Used by the <MoneyEquiv> client component.
 *
 * Returns { rate: FXRate | null }. Always 200 — null indicates "no rate
 * available, hide the equivalent" rather than an error condition.
 *
 * No feature gate; every signed-in user gets to see the rate.
 */

import { NextResponse } from "next/server";
import { getCurrentFXRate } from "@/app/lib/fx";

export const GET = async (): Promise<Response> => {
  try {
    const rate = await getCurrentFXRate();
    return NextResponse.json({ rate });
  } catch (err) {
    console.error("[/api/dashboard/fx]", err);
    return NextResponse.json({ rate: null });
  }
};
