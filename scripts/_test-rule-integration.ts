/**
 * End-to-end round-trip for the rule engine I/O path.
 *
 *   1. Seed a test deal on the Pipeline sheet at stage=shipping
 *   2. Fire evaluateAndTransition("deal_field_update", ...) with date_at_border
 *   3. Re-read Pipeline → expect stage=in-customs, stage_entered_at updated
 *   4. Read Deal_Events → expect 1 stage_change row with trigger T-07*
 *   5. Trafico bridge: seed a Trafico_Items row linking the deal to a test
 *      Trafico, fire onTraficoStatusChange("sent-to-broker"), assert the
 *      same bridge + rule fires.
 *
 * Run: npx tsx scripts/_test-rule-integration.ts
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

let passed = 0;
let failed = 0;
const assert = (cond: unknown, msg: string) => {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.error(`  ❌ ${msg}`); }
};

const main = async () => {
  const { appendRow, readSheet } = await import("../app/lib/dashboard-sheets");
  const { evaluateAndTransition } = await import("../app/lib/rule-engine");
  const { getDealEvents } = await import("../app/lib/deal-events");
  const { onTraficoStatusChange } = await import("../app/lib/trafico-deal-bridge");

  // ----- seed pipeline row ------------------------------------------------
  const dealId = `__TEST_DEAL_W7_${Date.now()}`;
  console.log(`→ seed Pipeline row ${dealId} at stage=shipping`);
  const row: Record<string, string> = {
    id: dealId,
    name: "W7 integration test",
    company: "TestCo",
    stage: "shipping",
    value: "250000",
    probability: "90",
    expected_close: "2026-06-30",
    owner: "test",
    source: "integration-test",
    created_at: new Date().toISOString(),
    notes: "",
    brand_slugs: "dornbracht",
    source_message_id: "",
    stage_entered_at: new Date().toISOString(),
    pending_move_to: "",
    pending_move_at: "",
    date_at_border: "",
    date_customs_cleared: "",
  };
  await appendRow("Pipeline", PIPELINE_COLUMNS.map((c) => row[c]));

  // ----- fire rule engine: shipping → in-customs -------------------------
  console.log(`→ evaluateAndTransition(deal_field_update, date_at_border)`);
  const result1 = await evaluateAndTransition(
    "deal_field_update",
    dealId,
    { date_at_border: "2026-04-18" },
    "test@countercultures.com.mx"
  );
  assert(result1.type === "moved", `result.type === "moved" (got ${result1.type})`);
  if (result1.type === "moved") {
    assert(result1.fromStage === "shipping", `from shipping`);
    assert(result1.toStage === "in-customs", `to in-customs`);
    assert(result1.ruleId.startsWith("T-07"), `ruleId starts with T-07 (${result1.ruleId})`);
  }

  // ----- confirm Pipeline row updated ------------------------------------
  const afterRows = await readSheet<Record<string, string>>("Pipeline");
  const updated = afterRows.find((r) => r.id === dealId);
  assert(updated?.stage === "in-customs", `Pipeline.stage is in-customs after eval`);
  assert(!!updated?.stage_entered_at, `stage_entered_at repopulated on transition`);

  // ----- confirm Deal_Events has the stage_change row --------------------
  const events = await getDealEvents(dealId);
  const stageChange = events.find((e) => e.event_type === "stage_change");
  assert(!!stageChange, `Deal_Events has a stage_change row for ${dealId}`);
  assert(
    stageChange?.trigger_rule_id.startsWith("T-07") ?? false,
    `Deal_Events.trigger_rule_id is T-07*`
  );

  // ----- Trafico bridge -------------------------------------------------
  console.log(`→ Trafico bridge: link test Trafico + flip to sent-to-broker`);
  const trfId = `__TEST_TRF_W7_${Date.now()}`;
  // seed Trafico_Items row — real header order is Item_ID, TRF_ID, Deal_ID, ...
  const itemId = `__TEST_ITEM_${Date.now()}`;
  await appendRow("Trafico_Items", [
    itemId,
    trfId,
    dealId,
    ...Array(22).fill(""), // pad out the remaining 22 columns (total 25)
  ]);

  // Reset deal to shipping so we can observe the bridge firing the same rule
  const { writePipelineFields } = await import("../app/lib/rule-engine");
  await writePipelineFields(dealId, {
    stage: "shipping",
    stage_entered_at: new Date().toISOString(),
    date_at_border: "",
  });

  await onTraficoStatusChange(trfId, "awaiting-documents", "sent-to-broker", "test");

  const afterBridge = (await readSheet<Record<string, string>>("Pipeline")).find(
    (r) => r.id === dealId
  );
  assert(afterBridge?.stage === "in-customs", `bridge: stage now in-customs`);
  assert(
    (afterBridge?.date_at_border ?? "").length > 0,
    `bridge: date_at_border written by bridge`
  );

  console.log(
    `\n${failed === 0 ? "✅" : "❌"} rule-integration: ${passed} passed, ${failed} failed`
  );
  console.log(
    `   (left behind ${dealId} + Trafico_Items row for ${trfId} — v1 cleanup compromise)`
  );
  if (failed > 0) process.exit(1);
};

main().catch((e) => {
  console.error("\n❌ FAILED:", e?.stack || e?.message || e);
  process.exit(1);
});
