/**
 * Round-trip test for app/lib/deal-events.ts — appendDealEvent + getDealEvents.
 * Mirrors scripts/_test-trafico-events.ts pattern from W5.
 *
 * Run: npx tsx scripts/_test-deal-events.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

const main = async () => {
  const { appendDealEvent, getDealEvents } = await import(
    "../app/lib/deal-events"
  );

  const testDealId = `__TEST_DEAL_${Date.now()}`;
  console.log(`→ appendDealEvent (deal_id=${testDealId})`);
  const event = await appendDealEvent({
    deal_id: testDealId,
    actor: "test@untold.works",
    event_type: "stage_change",
    from_stage: "deposit-pending",
    to_stage: "deposit-received",
    trigger_rule_id: "T-03-deposit-pending-to-received",
    payload: { payment_id: "pi_test_123", amount_mxn: 25000 },
  });

  if (!event.event_id.startsWith("DE-")) {
    throw new Error(`event_id format wrong: ${event.event_id}`);
  }
  if (event.payload_json !== '{"payment_id":"pi_test_123","amount_mxn":25000}') {
    throw new Error(`payload_json serialization wrong: ${event.payload_json}`);
  }
  if (event.actor !== "test@untold.works") {
    throw new Error(`actor mismatch: ${event.actor}`);
  }
  console.log(`  wrote event ${event.event_id}`);

  console.log(`→ getDealEvents('${testDealId}')`);
  const back = await getDealEvents(testDealId);
  if (back.length !== 1) {
    throw new Error(`expected 1 event filtered by deal_id, got ${back.length}`);
  }
  if (back[0].to_stage !== "deposit-received") {
    throw new Error(`round-trip to_stage mismatch: ${back[0].to_stage}`);
  }
  if (back[0].trigger_rule_id !== "T-03-deposit-pending-to-received") {
    throw new Error(`round-trip rule_id mismatch: ${back[0].trigger_rule_id}`);
  }
  console.log(`  ✓ filtered read returns 1 event matching`);

  console.log(`→ getDealEvents() — full table`);
  const all = await getDealEvents();
  if (all.length < 1) throw new Error("full-table read empty");
  console.log(`  ✓ ${all.length} total events in Deal_Events`);

  // rollback event sanity
  console.log(`→ appendDealEvent (rollback, reverted_event_id)`);
  const rollback = await appendDealEvent({
    deal_id: testDealId,
    actor: "roger@countercultures.com.mx",
    event_type: "rollback",
    from_stage: "deposit-received",
    to_stage: "deposit-pending",
    reverted_event_id: event.event_id,
  });
  if (rollback.reverted_event_id !== event.event_id) {
    throw new Error(`reverted_event_id not persisted: ${rollback.reverted_event_id}`);
  }
  console.log(`  ✓ rollback references original event`);

  const backAfterRollback = await getDealEvents(testDealId);
  if (backAfterRollback.length !== 2) {
    throw new Error(`expected 2 events after rollback, got ${backAfterRollback.length}`);
  }

  console.log(
    `\n✅ Deal_Events round-trip OK. (2 test rows left in sheet for deal_id=${testDealId} — cleanup is a separate concern.)`
  );
};

main().catch((e) => {
  console.error("\n❌ FAILED:", e?.message || e);
  process.exit(1);
});
