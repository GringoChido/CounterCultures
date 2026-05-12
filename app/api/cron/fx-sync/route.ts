/**
 * GET /api/cron/fx-sync — pulls today's USD→MXN rate and appends to
 * FX_Rates. Auth: requires `x-cron-probe-key` header matching the
 * CRON_PROBE_KEY env var. Netlify scheduled functions send this header
 * via the pass-through in `netlify/functions/fx-sync.ts`.
 *
 * Note: the old `x-netlify-scheduled: 1` sentinel was removed (P0 security
 * fix). External callers could spoof the header trivially. The probe key
 * is now the single source of authorization.
 *
 * Schedule: daily at 17:00 UTC (~11:00 CT / 13:00 ECB-close-ish).
 * Frankfurter publishes ECB rates around 16:00 CET on weekdays, so a
 * UTC 17:00 run reliably gets the day's value before any page hit.
 */

import { NextResponse, type NextRequest } from "next/server";
import { fetchTodaysRate, recordRate } from "@/app/lib/fx";

const isAuthorized = (req: NextRequest): boolean => {
  const expected = process.env.CRON_PROBE_KEY;
  if (!expected) return false; // refuse when not configured — fail-closed
  const probeKey = req.headers.get("x-cron-probe-key");
  return !!probeKey && probeKey === expected;
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
