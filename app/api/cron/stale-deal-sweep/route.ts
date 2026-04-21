/**
 * Nightly stale-deal sweep.
 *
 * Runs at 8am Mexico time (14:00 UTC) via the Netlify scheduled function
 * at netlify/functions/stale-deal-sweep.ts which fires a GET against this
 * route. The sentinel `x-netlify-scheduled` header guards against direct
 * callers.
 *
 * For each active Pipeline deal:
 *   1. Compute SLA color from stage_entered_at + Brand_Lead_Times
 *   2. If color transitioned into yellow/red since the last breach event,
 *      emit a Deal_Events { event_type: "sla_breach", payload: { color } }
 *   3. If pending_move_at + 2h has passed, execute the queued transition
 *      (ending the pending_move state)
 *   4. Apply the hard-threshold T-14 rule (customs hold > 7d → issue)
 */

import { NextResponse, type NextRequest } from "next/server";
import { readSheet, findRowIndex, updateRow } from "@/app/lib/dashboard-sheets";
import { getSlaColor } from "@/app/lib/sla-timers";
import { appendDealEvent, getDealEvents } from "@/app/lib/deal-events";
import { evaluateAndTransition } from "@/app/lib/rule-engine";
import { dispatchAlertsForTransition } from "@/app/lib/alert-dispatcher";
import type { PipelineDeal, PipelineStage } from "@/app/lib/sample-dashboard-data";
import type { Notification } from "@/app/lib/notifications";

const COOLOFF_MS = 2 * 60 * 60 * 1000;

type PipelineRow = Record<string, string>;
type BrandLeadTimeRow = Parameters<typeof getSlaColor>[1] extends (infer T)[] ? T : never;

const rowToDeal = (r: PipelineRow): PipelineDeal => ({
  id: r.id,
  name: r.name,
  contactName: r.company ?? "",
  value: Number(r.value) || 0,
  currency: "MXN",
  stage: r.stage as PipelineStage,
  probability: Number(r.probability) || 0,
  expectedClose: r.expected_close,
  assignedRep: r.owner,
  products: "",
  createdAt: r.created_at,
  notes: r.notes ?? "",
  contactCompany: r.company,
  leadSource: r.source,
  brandSlugs: r.brand_slugs ? r.brand_slugs.split("|").filter(Boolean) : undefined,
  stageEnteredAt: r.stage_entered_at,
  pendingMoveTo: (r.pending_move_to || undefined) as PipelineStage | undefined,
  pendingMoveAt: r.pending_move_at || undefined,
  dateAtBorder: r.date_at_border || undefined,
  dateCustomsCleared: r.date_customs_cleared || undefined,
});

// Stages considered "active" — excludes terminal stages so we don't
// emit breach events for long-complete deals.
const TERMINAL: Set<PipelineStage> = new Set<PipelineStage>([
  "complete",
  "closed-won",
  "closed-lost",
  "won",
  "lost",
]);

export const GET = async (request: NextRequest) => {
  // Gate: only fire from Netlify's scheduler OR a verified admin probe.
  const sentinel = request.headers.get("x-netlify-scheduled");
  const probeKey = request.headers.get("x-cron-probe-key");
  const allowed = sentinel === "1" || (!!probeKey && probeKey === process.env.CRON_PROBE_KEY);
  if (!allowed) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const [pipelineRows, brandLeadTimes] = await Promise.all([
    readSheet<PipelineRow>("Pipeline"),
    readSheet<BrandLeadTimeRow>("Brand_Lead_Times").catch(() => [] as BrandLeadTimeRow[]),
  ]);

  const now = new Date();
  let swept = 0;
  let yellowCount = 0;
  let redCount = 0;
  let breachEventsEmitted = 0;
  let pendingMovesExecuted = 0;
  let issuesFlagged = 0;
  let alertsReplayed = 0;
  let queuedDeliveriesReleased = 0;
  const errors: string[] = [];

  for (const row of pipelineRows) {
    if (!row.id) continue;
    const deal = rowToDeal(row);
    if (TERMINAL.has(deal.stage)) continue;
    swept++;

    // (1) SLA color compute + breach-event emission
    try {
      const sla = getSlaColor(deal, brandLeadTimes, now);
      if (sla.color === "yellow") yellowCount++;
      if (sla.color === "red") redCount++;

      if (sla.color === "yellow" || sla.color === "red") {
        const history = await getDealEvents(deal.id);
        const lastBreach = [...history]
          .reverse()
          .find((e) => e.event_type === "sla_breach");
        let lastColor: string | undefined;
        try {
          lastColor = lastBreach?.payload_json
            ? (JSON.parse(lastBreach.payload_json) as { color?: string }).color
            : undefined;
        } catch {
          lastColor = undefined;
        }
        if (lastColor !== sla.color) {
          await appendDealEvent({
            deal_id: deal.id,
            actor: "system",
            event_type: "sla_breach",
            payload: {
              color: sla.color,
              days_in_stage: sla.daysInStage,
              stage: deal.stage,
            },
          });
          breachEventsEmitted++;
        }
      }
    } catch (err) {
      errors.push(`sla ${deal.id}: ${err instanceof Error ? err.message : String(err)}`);
    }

    // (2) Execute queued pending_move if 2h cool-off elapsed
    if (deal.pendingMoveTo && deal.pendingMoveAt) {
      const queuedAt = Date.parse(deal.pendingMoveAt);
      if (Number.isFinite(queuedAt) && now.getTime() - queuedAt >= COOLOFF_MS) {
        try {
          // evaluateAndTransition with premoveConfirmed=true bypasses the
          // cool-off check; we pass the most likely trigger (the queue was
          // for some rule — we don't have trigger persistence yet, so we
          // re-fire via manual; the pending_move_to field is authoritative).
          await evaluateAndTransition(
            "manual",
            deal.id,
            { premoveConfirmed: true, target: deal.pendingMoveTo },
            "system"
          );
          pendingMovesExecuted++;
        } catch (err) {
          errors.push(`pending_move ${deal.id}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }

    // (3) Rule-14 hard threshold: customs hold > 7 days auto-flags to issue
    if (deal.stage === "in-customs" && deal.stageEnteredAt) {
      const enteredAt = Date.parse(deal.stageEnteredAt);
      if (Number.isFinite(enteredAt)) {
        const days = (now.getTime() - enteredAt) / (1000 * 60 * 60 * 24);
        if (days > 7) {
          try {
            const result = await evaluateAndTransition(
              "nightly_sweep",
              deal.id,
              { customs_hold_days: Math.floor(days) },
              "system"
            );
            if (result.type === "moved" || result.type === "pending_move") {
              issuesFlagged++;
            }
          } catch (err) {
            errors.push(`t14 ${deal.id}: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // (4) W8: Replay missed alerts — find stage_change events older than 6h
  //     with no matching alert_fired follow-up, and re-dispatch.
  //     Catches Resend / Meta outages during the original transition.
  // -------------------------------------------------------------------------
  try {
    const allEvents = await getDealEvents();
    const sixHoursAgo = now.getTime() - 6 * 60 * 60 * 1000;
    const oneWeekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;

    const staleStageChanges = allEvents.filter((e) => {
      if (e.event_type !== "stage_change") return false;
      const ts = Date.parse(e.timestamp);
      if (!Number.isFinite(ts)) return false;
      return ts < sixHoursAgo && ts > oneWeekAgo;
    });

    const pipelineById = new Map(pipelineRows.map((r) => [r.id, rowToDeal(r)]));

    for (const sc of staleStageChanges) {
      const dealRow = pipelineById.get(sc.deal_id);
      if (!dealRow) continue;

      // Any alert_fired for this deal newer than the stage_change?
      const scTs = Date.parse(sc.timestamp);
      const followUp = allEvents.some(
        (e) =>
          e.event_type === "alert_fired" &&
          e.deal_id === sc.deal_id &&
          e.trigger_rule_id === sc.trigger_rule_id &&
          Date.parse(e.timestamp) >= scTs
      );
      if (followUp) continue;

      try {
        await dispatchAlertsForTransition({
          ruleId: sc.trigger_rule_id,
          dealId: sc.deal_id,
          fromStage: sc.from_stage as PipelineStage,
          toStage: sc.to_stage as PipelineStage,
          deal: dealRow,
          actor: "system-replay",
        });
        alertsReplayed++;
      } catch (err) {
        errors.push(`replay ${sc.deal_id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  } catch (err) {
    errors.push(`replay-scan: ${err instanceof Error ? err.message : String(err)}`);
  }

  // -------------------------------------------------------------------------
  // (5) W8: Release queued quiet-hour deliveries — Notifications rows with
  //     deliver_after ≤ now and status="unread" and delivery_channel set.
  //     We mark them acked (status="acked") to prevent re-processing.
  //     Per-channel re-send is out of scope for this pass — the row staying
  //     in Notifications is surfaced via the bell; full re-send to email
  //     / WhatsApp lands once Meta approval is in (W8 follow-up).
  // -------------------------------------------------------------------------
  try {
    const notifs = await readSheet<Notification>("Notifications");
    for (const n of notifs) {
      if (n.status !== "unread") continue;
      if (!n.deliver_after) continue;
      if (!n.delivery_channel || n.delivery_channel === "dashboard") continue;
      const deliverAt = Date.parse(n.deliver_after);
      if (!Number.isFinite(deliverAt) || deliverAt > now.getTime()) continue;

      try {
        const rowIdx = await findRowIndex("Notifications", "notification_id", n.notification_id);
        if (rowIdx === null) continue;

        const ackedRow: Notification = {
          ...n,
          status: "acked",
          acked_at: now.toISOString(),
        };
        const headers = Object.keys(n);
        await updateRow(
          "Notifications",
          rowIdx,
          headers.map((h) => ackedRow[h] ?? "")
        );
        queuedDeliveriesReleased++;
      } catch (err) {
        errors.push(
          `release ${n.notification_id}: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
  } catch (err) {
    errors.push(`release-scan: ${err instanceof Error ? err.message : String(err)}`);
  }

  return NextResponse.json({
    swept,
    yellow: yellowCount,
    red: redCount,
    breachEventsEmitted,
    pendingMovesExecuted,
    issuesFlagged,
    alertsReplayed,
    queuedDeliveriesReleased,
    errors: errors.length > 0 ? errors : undefined,
    ranAt: now.toISOString(),
  });
};
