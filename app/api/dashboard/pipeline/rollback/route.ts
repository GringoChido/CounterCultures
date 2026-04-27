/**
 * Rollback a prior stage_change within the 24h window.
 *
 * Body: { dealId: string, eventId: string }
 * Success: 200 { ok: true, newEventId }
 * 24h elapsed: 409 { error: "24h rollback window elapsed" }
 * Missing: 404 { error: "event not found" }
 */

import { NextResponse, type NextRequest } from "next/server";
import { rollback } from "@/app/lib/rule-engine";
import { getCurrentUserEmailFromRequest } from "@/app/lib/auth";

export const POST = async (request: NextRequest) => {
  try {
    const body: { dealId?: string; eventId?: string } = await request.json();
    if (!body.dealId || !body.eventId) {
      return NextResponse.json(
        { error: "dealId and eventId are required" },
        { status: 400 }
      );
    }

    const actor =
      (await getCurrentUserEmailFromRequest(request)) ??
      request.headers.get("x-actor") ??
      "portal";

    const result = await rollback(body.dealId, body.eventId, actor);
    if (!result.ok) {
      const status = result.reason.includes("not found")
        ? 404
        : result.reason.includes("window")
          ? 409
          : 400;
      return NextResponse.json({ error: result.reason }, { status });
    }

    return NextResponse.json({ ok: true, newEventId: result.newEventId });
  } catch (err) {
    console.error("[Rollback] error:", err);
    return NextResponse.json({ error: "Rollback failed" }, { status: 500 });
  }
};
