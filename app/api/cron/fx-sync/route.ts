/**
 * GET /api/cron/fx-sync — pulls today's USD→MXN rate and appends to
 * FX_Rates. Same auth pattern as the other cron routes (Netlify sentinel
 * OR x-cron-probe-key header).
 *
 * Schedule: daily at 17:00 UTC (~11:00 CT / 13:00 ECB-close-ish).
 * Frankfurter publishes ECB rates around 16:00 CET on weekdays, so a
 * UTC 17:00 run reliably gets the day's value before any page hit.
 */

import { NextResponse, type NextRequest } from "next/server";
import { fetchTodaysRate, recordRate } from "@/app/lib/fx";

const isAuthorized = (req: NextRequest): boolean => {
  const sentinel = req.headers.get("x-netlify-scheduled");
  const probeKey = req.headers.get("x-cron-probe-key");
  if (sentinel === "1") return true;
  if (probeKey && probeKey === process.env.CRON_PROBE_KEY) return true;
  return false;
};

export const GET = async (req: NextRequest): Promise<Response> => {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const t0 = Date.now();
  try {
    const rate = await fetchTodaysRate();
    await recordRate(rate);
    return NextResponse.json({
      ok: true,
      date: rate.date,
      rate: rate.rate,
      source: rate.source,
      durationMs: Date.now() - t0,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "fx_sync_failed";
    console.error("[cron/fx-sync]", msg);
    return NextResponse.json(
      { error: msg, durationMs: Date.now() - t0 },
      { status: 502 }
    );
  }
};
