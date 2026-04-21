/**
 * W8 test — nightly sweep replays missed alerts + releases queued quiet-hour
 * Notifications rows.
 *
 *   1. Seed a deal with a stage_change Deal_Events row timestamped 8h ago
 *      and NO alert_fired follow-up → sweep should replay dispatch
 *   2. Seed a Notifications row with deliver_after 2h in the past, channel=email,
 *      status=unread → sweep should flip status to acked
 *
 * Run: npx tsx scripts/_test-sweep-retries.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

const PIPELINE_COLUMNS = [
  "id", "name", "company", "stage", "value", "probability",
  "expected_close", "owner", "source", "created_at", "notes",
  "brand_slugs", "source_message_id",
  "stage_entered_at", "pending_move_to", "pending_move_at",
  "date_at_border", "date_customs_cleared",
];

const DEAL_EVENTS_COLUMNS = [
  "event_id", "deal_id", "timestamp", "actor", "event_type",
  "from_stage", "to_stage", "trigger_rule_id", "payload_json",
  "reverted_event_id",
];

const NOTIFICATIONS_COLUMNS = [
  "notification_id", "severity", "audience", "title", "body",
  "source_entity_type", "source_entity_id", "status", "created_at", "acked_at",
  "deliver_after", "delivery_channel", "recipient_email", "recipient_phone",
];

let passed = 0, failed = 0;
const assert = (cond: unknown, msg: string) => {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.error(`  ❌ ${msg}`); }
};

const mkReq = (headers: Record<string, string>): Request =>
  new Request("http://localhost/api/cron/stale-deal-sweep", {
    method: "GET",
    headers,
  });

const iso = (offsetMs: number): string =>
  new Date(Date.now() + offsetMs).toISOString();

const main = async () => {
  const { appendRow, readSheet } = await import("../app/lib/dashboard-sheets");
  const cron = await import("../app/api/cron/stale-deal-sweep/route");

  const stamp = Date.now();
  const dealId = `__TEST_SWEEP_REPLAY_${stamp}`;
  const notifId = `__TEST_SWEEP_RELEASE_${stamp}`;

  console.log(`→ seed Pipeline deal at in-production (stage stable, not red)`);
  await appendRow(
    "Pipeline",
    PIPELINE_COLUMNS.map((c) => ({
      id: dealId, name: "Sweep replay test", company: "TestCo",
      stage: "in-production", value: "150000", probability: "80",
      expected_close: "2026-08-01", owner: "test", source: "test",
      created_at: iso(-2 * 24 * 3600 * 1000), notes: "",
      brand_slugs: "kohler", source_message_id: "",
      stage_entered_at: iso(-2 * 24 * 3600 * 1000),
      pending_move_to: "", pending_move_at: "",
      date_at_border: "", date_customs_cleared: "",
    }[c] ?? ""))
  );

  console.log(`→ seed stage_change Deal_Event 8h ago (no alert_fired follow-up)`);
  await appendRow(
    "Deal_Events",
    DEAL_EVENTS_COLUMNS.map((c) => ({
      event_id: `DE-SWEEP-${stamp}`,
      deal_id: dealId,
      timestamp: iso(-8 * 3600 * 1000),
      actor: "test",
      event_type: "stage_change",
      from_stage: "ordering",
      to_stage: "in-production",
      trigger_rule_id: "T-05-production-confirmed",
      payload_json: JSON.stringify({ production_eta_date: "2026-06-01" }),
      reverted_event_id: "",
    }[c] ?? ""))
  );

  console.log(`→ seed Notifications queued row (deliver_after 2h ago, unread)`);
  await appendRow(
    "Notifications",
    NOTIFICATIONS_COLUMNS.map((c) => ({
      notification_id: notifId,
      severity: "normal",
      audience: "customer",
      title: "Queued email test",
      body: "body",
      source_entity_type: "deal_event",
      source_entity_id: dealId,
      status: "unread",
      created_at: iso(-3 * 3600 * 1000),
      acked_at: "",
      deliver_after: iso(-2 * 3600 * 1000),
      delivery_channel: "email",
      recipient_email: "queued@example.com",
      recipient_phone: "",
    }[c] ?? ""))
  );

  // -------- sweep call --------
  console.log(`\n→ GET /api/cron/stale-deal-sweep (with sentinel)`);
  const res = await cron.GET(mkReq({ "x-netlify-scheduled": "1" }) as never);
  assert(res.status === 200, `status 200`);
  const body = await (res as Response).json();
  console.log(`  response: ${JSON.stringify(body)}`);
  assert(typeof body.alertsReplayed === "number", `alertsReplayed field present`);
  assert(typeof body.queuedDeliveriesReleased === "number", `queuedDeliveriesReleased field present`);
  assert(body.alertsReplayed >= 1, `>=1 alert replayed (got ${body.alertsReplayed})`);
  assert(body.queuedDeliveriesReleased >= 1, `>=1 queued delivery released (got ${body.queuedDeliveriesReleased})`);

  // -------- Deal_Events replayed → now has alert_fired for T-05 --------
  // Fire-and-forget dispatcher — wait for writes to settle
  await new Promise((r) => setTimeout(r, 5000));
  const { getDealEvents } = await import("../app/lib/deal-events");
  const events = await getDealEvents(dealId);
  const alertFired = events.filter(
    (e) => e.event_type === "alert_fired" && e.trigger_rule_id === "T-05-production-confirmed"
  );
  assert(alertFired.length >= 1, `alert_fired row for T-05 after replay (got ${alertFired.length})`);

  // -------- Notifications row flipped to acked --------
  const notifs = await readSheet<Record<string, string>>("Notifications");
  const released = notifs.find((n) => n.notification_id === notifId);
  assert(released?.status === "acked", `notification status=acked (got ${released?.status})`);
  assert(!!released?.acked_at, `notification acked_at populated`);

  console.log(`\n${failed === 0 ? "✅" : "❌"} sweep retries + release: ${passed} passed, ${failed} failed`);
  console.log(`   (left behind ${dealId} + notif ${notifId} — v1 cleanup)`);
  if (failed > 0) process.exit(1);
};

main().catch((e) => { console.error("\n❌ FAILED:", e?.stack || e?.message || e); process.exit(1); });
