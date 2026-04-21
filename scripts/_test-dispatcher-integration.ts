/**
 * Integration test: rule engine's executeTransition now fires the alert
 * dispatcher. Seed a deal, trigger a rule, assert both Deal_Events
 * (stage_change + alert_fired) AND Notifications (bell bridge row) appear.
 *
 * Run: npx tsx scripts/_test-dispatcher-integration.ts
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

let passed = 0, failed = 0;
const assert = (cond: unknown, msg: string) => {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.error(`  ❌ ${msg}`); }
};

const main = async () => {
  const { appendRow, readSheet } = await import("../app/lib/dashboard-sheets");
  const { evaluateAndTransition } = await import("../app/lib/rule-engine");
  const { getDealEvents } = await import("../app/lib/deal-events");

  const dealId = `__TEST_DISP_INT_${Date.now()}`;
  console.log(`→ seed deal ${dealId} at deposit-pending, 200K MXN`);
  const seed: Record<string, string> = {
    id: dealId, name: "Dispatcher integration", company: "TestCo",
    stage: "deposit-pending", value: "200000", probability: "90",
    expected_close: "2026-07-01", owner: "test", source: "integration",
    created_at: new Date().toISOString(), notes: "",
    brand_slugs: "kohler", source_message_id: "",
    stage_entered_at: new Date().toISOString(),
    pending_move_to: "", pending_move_at: "", date_at_border: "", date_customs_cleared: "",
  };
  await appendRow("Pipeline", PIPELINE_COLUMNS.map((c) => seed[c]));

  // Fire T-03 via rule engine
  console.log(`→ evaluateAndTransition(stripe_payment)`);
  const r = await evaluateAndTransition(
    "stripe_payment",
    dealId,
    { allocated_to: "deposit", amount: 20000 },
    "stripe"
  );
  assert(r.type === "moved", `rule engine result = moved (got ${r.type})`);

  // Fire-and-forget dispatcher settle time — the dispatcher kicks off
  // customer + Roger + Finance in parallel, each channel writes to Sheets
  // (getDealEvents for idempotency check + appendDealEvent for the audit
  // row + in some cases appendNotification). 5s is a conservative ceiling.
  await new Promise((res) => setTimeout(res, 5000));

  // Deal_Events should have: 1 stage_change + >=2 alert_fired
  // (The Pipeline sheet has no customer email/phone columns, so customer
  // channels are skipped with "no recipient" — no audit row written.
  // Roger dashboard + Finance email are the 2 that fire for T-03.)
  const events = await getDealEvents(dealId);
  const stageChange = events.filter((e) => e.event_type === "stage_change");
  const alertFired = events.filter((e) => e.event_type === "alert_fired");
  assert(stageChange.length === 1, `1 stage_change row (got ${stageChange.length})`);
  assert(alertFired.length >= 2, `>=2 alert_fired rows (got ${alertFired.length})`);

  // Confirm Roger + Finance specifically fired
  const audiences = alertFired.map((e) => {
    try {
      return (JSON.parse(e.payload_json || "{}") as { audience?: string }).audience;
    } catch { return undefined; }
  });
  assert(audiences.includes("roger"), `Roger alert fired`);
  assert(audiences.includes("finance"), `Finance alert fired`);

  // Notifications sheet: bell bridge row for Roger
  const notifs = await readSheet<Record<string, string>>("Notifications");
  const bellEntry = notifs.find(
    (n) => n.source_entity_type === "deal_event" && n.source_entity_id === dealId
  );
  assert(!!bellEntry, `Notifications has a deal_event row for ${dealId}`);
  if (bellEntry) {
    assert(bellEntry.delivery_channel === "dashboard", `bell row delivery_channel=dashboard (got ${bellEntry.delivery_channel})`);
    assert(bellEntry.audience === "roger", `bell row audience=roger`);
  }

  console.log(`\n${failed === 0 ? "✅" : "❌"} dispatcher-integration: ${passed} passed, ${failed} failed`);
  console.log(`   (left behind ${dealId} — v1 cleanup compromise)`);
  if (failed > 0) process.exit(1);
};

main().catch((e) => { console.error("\n❌ FAILED:", e?.stack || e?.message || e); process.exit(1); });
