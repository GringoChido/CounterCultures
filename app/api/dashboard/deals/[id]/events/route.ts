/**
 * GET /api/dashboard/deals/[id]/events
 *
 * Returns the Deal_Events audit trail for a specific deal, newest first.
 * Powers the "History" tab in the Deal slideout.
 *
 * Query params:
 *   - filter: "all" | "internal" | "customer" (default "all")
 *     "internal" drops customer-facing alert_fired rows (those where
 *     payload.audience === "customer").
 *     "customer" shows only customer-facing rows.
 */

import { NextResponse, type NextRequest } from "next/server";
import { getDealEvents } from "@/app/lib/deal-events";

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const filter = request.nextUrl.searchParams.get("filter") ?? "all";

  try {
    const events = await getDealEvents(id);

    const filtered = events.filter((e) => {
      if (filter === "all") return true;
      if (e.event_type !== "alert_fired") {
        // Non-alert events (stage_change, rollback, pending_move, etc.) are
        // always "internal" — surface them in both internal + all filters.
        return filter === "internal";
      }
      try {
        const p = JSON.parse(e.payload_json || "{}") as { audience?: string };
        const isCustomer = p.audience === "customer";
        return filter === "customer" ? isCustomer : !isCustomer;
      } catch {
        return filter === "internal"; // defensive: malformed payload treated as internal
      }
    });

    // Newest first
    filtered.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    return NextResponse.json({ events: filtered });
  } catch (err) {
    console.error(`[deals/${id}/events] error:`, err);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
};
