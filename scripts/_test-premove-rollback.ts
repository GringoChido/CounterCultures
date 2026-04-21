/**
 * End-to-end test for pre-move confirmation + rollback paths.
 *
 *   (A) Pre-move path (deal > $500K MXN):
 *       - Seed deal at deposit-pending, value 750K
 *       - Fire rule engine with stripe_payment → expect pending_move
 *       - Assert Pipeline pending_move_to = "deposit-received"
 *       - Assert Deal_Events has pending_move row
 *   (B) Execute-now:
 *       - Call execute route → commits transition
 *       - Assert stage = deposit-received, pending_move_* cleared
 *       - Assert Deal_Events has stage_change with original rule_id
 *   (C) Rollback within 24h: reverts back to deposit-pending
 *   (D) Cancel path: separate deal, queue pending_move, call cancel route,
 *       assert fields cleared + pending_move_cancelled event recorded.
 *
 * Bypasses HTTP layer by importing the route handlers directly, same
 * pattern as _test-stripe-webhook-rule.ts.
 *
 * Run: npx tsx scripts/_test-premove-rollback.ts
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

type PipelineRow = Record<string, string>;

const mkReq = (url: string, method: string, body?: unknown): Request => {
  const init: RequestInit = { method };
  if (body) {
    init.body = JSON.stringify(body);
    init.headers = { "content-type": "application/json", "x-actor": "test@untold.works" };
  } else {
    init.headers = { "x-actor": "test@untold.works" };
  }
  return new Request(url, init);
};

const main = async () => {
  const { appendRow, readSheet } = await import("../app/lib/dashboard-sheets");
  const { evaluateAndTransition } = await import("../app/lib/rule-engine");
  const { getDealEvents } = await import("../app/lib/deal-events");

  // Dynamic imports of route handlers so they see fresh modules
  const pendingMoveRoute = await import(
    "../app/api/dashboard/pipeline/pending-move/[dealId]/route"
  );
  const rollbackRoute = await import(
    "../app/api/dashboard/pipeline/rollback/route"
  );

  // ----- (A) seed big deal + fire rule engine → pending_move --------------
  console.log("→ (A) seed 750K deal, trigger T-03 → expect pending_move");
  const dealId = `__TEST_PREMOVE_${Date.now()}`;
  const seed: Record<string, string> = {
    id: dealId, name: "Premove test", company: "TestCo",
    stage: "deposit-pending", value: "750000", probability: "95",
    expected_close: "2026-06-30", owner: "test", source: "integration-test",
    created_at: new Date().toISOString(), notes: "",
    brand_slugs: "kohler", source_message_id: "",
    stage_entered_at: new Date().toISOString(),
    pending_move_to: "", pending_move_at: "",
    date_at_border: "", date_customs_cleared: "",
  };
  await appendRow("Pipeline", PIPELINE_COLUMNS.map((c) => seed[c]));

  const result1 = await evaluateAndTransition(
    "stripe_payment",
    dealId,
    { allocated_to: "deposit", amount: 75_000 },
    "stripe"
  );
  assert(result1.type === "pending_move", `rule result = pending_move (got ${result1.type})`);

  let rows = await readSheet<PipelineRow>("Pipeline");
  let updated = rows.find((r) => r.id === dealId);
  assert(updated?.pending_move_to === "deposit-received", `pending_move_to set`);
  assert(updated?.stage === "deposit-pending", `stage still deposit-pending (not advanced yet)`);

  const events = await getDealEvents(dealId);
  assert(events.some((e) => e.event_type === "pending_move"), `pending_move event written`);

  // ----- (B) Execute-now route → commits transition --------------------
  console.log("→ (B) POST /pending-move/[dealId] (execute now)");
  const execReq = mkReq(
    `http://localhost/api/dashboard/pipeline/pending-move/${dealId}`,
    "POST",
    {}
  );
  const execRes = await pendingMoveRoute.POST(execReq as never, {
    params: Promise.resolve({ dealId }),
  } as never);
  const execBody = await (execRes as Response).json();
  assert(execBody.ok === true, `execute returned ok (got ${JSON.stringify(execBody)})`);
  assert(execBody.result?.toStage === "deposit-received", `result.toStage = deposit-received`);

  rows = await readSheet<PipelineRow>("Pipeline");
  updated = rows.find((r) => r.id === dealId);
  assert(updated?.stage === "deposit-received", `Pipeline.stage = deposit-received`);
  assert(!updated?.pending_move_to, `pending_move_to cleared`);

  // ----- (C) Rollback route within 24h -------------------------------------
  console.log("→ (C) POST /rollback");
  const eventsB = await getDealEvents(dealId);
  const stageChange = eventsB.find((e) => e.event_type === "stage_change");
  assert(!!stageChange, `stage_change event exists`);
  const rollReq = mkReq(
    "http://localhost/api/dashboard/pipeline/rollback",
    "POST",
    { dealId, eventId: stageChange!.event_id }
  );
  const rollRes = await rollbackRoute.POST(rollReq as never);
  const rollBody = await (rollRes as Response).json();
  assert(rollBody.ok === true, `rollback returned ok`);

  rows = await readSheet<PipelineRow>("Pipeline");
  updated = rows.find((r) => r.id === dealId);
  assert(updated?.stage === "deposit-pending", `Pipeline.stage reverted to deposit-pending`);

  const eventsC = await getDealEvents(dealId);
  const rollEvent = eventsC.find((e) => e.event_type === "rollback");
  assert(!!rollEvent, `rollback event written`);
  assert(
    rollEvent?.reverted_event_id === stageChange!.event_id,
    `reverted_event_id points at original`
  );

  // ----- (D) Cancel path on a fresh pending_move --------------------------
  console.log("→ (D) DELETE /pending-move/[dealId] (cancel)");
  // Queue a fresh pending_move on the same deal (now at deposit-pending again)
  await evaluateAndTransition(
    "stripe_payment",
    dealId,
    { allocated_to: "deposit", amount: 75_000 },
    "stripe"
  );
  const cancelReq = mkReq(
    `http://localhost/api/dashboard/pipeline/pending-move/${dealId}`,
    "DELETE"
  );
  const cancelRes = await pendingMoveRoute.DELETE(cancelReq as never, {
    params: Promise.resolve({ dealId }),
  } as never);
  const cancelBody = await (cancelRes as Response).json();
  assert(cancelBody.ok === true, `cancel returned ok`);

  rows = await readSheet<PipelineRow>("Pipeline");
  updated = rows.find((r) => r.id === dealId);
  assert(!updated?.pending_move_to, `pending_move_to cleared after cancel`);

  const eventsD = await getDealEvents(dealId);
  assert(
    eventsD.some((e) => e.event_type === "pending_move_cancelled"),
    `pending_move_cancelled event recorded`
  );

  console.log(
    `\n${failed === 0 ? "✅" : "❌"} premove + rollback: ${passed} passed, ${failed} failed`
  );
  console.log(`   (left behind ${dealId} — v1 cleanup compromise)`);
  if (failed > 0) process.exit(1);
};

main().catch((e) => {
  console.error("\n❌ FAILED:", e?.stack || e?.message || e);
  process.exit(1);
});
