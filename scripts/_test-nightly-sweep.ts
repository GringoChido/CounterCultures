/**
 * Integration test for the nightly stale-deal sweep.
 *
 *   1. Seed 3 test deals in Pipeline at different stage_entered_at offsets:
 *      - within green window
 *      - in yellow window
 *      - in red window
 *   2. Import the GET handler directly, call with the x-netlify-scheduled
 *      header, assert response shape (swept + yellow + red counts).
 *   3. Assert Deal_Events has sla_breach rows for the yellow + red deals.
 *   4. Call again — assert idempotency (no duplicate breach events since
 *      color hasn't changed since last run).
 *   5. Assert forbidden without the sentinel header.
 *
 * Run: npx tsx scripts/_test-nightly-sweep.ts
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

const daysAgoIso = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
};

const mkReq = (headers: Record<string, string>): Request =>
  new Request("http://localhost/api/cron/stale-deal-sweep", {
    method: "GET",
    headers,
  });

const main = async () => {
  const { appendRow } = await import("../app/lib/dashboard-sheets");
  const { getDealEvents } = await import("../app/lib/deal-events");
  const cronRoute = await import("../app/api/cron/stale-deal-sweep/route");

  // ----- seed 3 deals at deposit-pending (g≤7, y≤10, r>10) --------------
  console.log("→ seed 3 deals at deposit-pending");
  const stamp = Date.now();
  const ids = {
    green: `__TEST_SWEEP_GREEN_${stamp}`,
    yellow: `__TEST_SWEEP_YELLOW_${stamp}`,
    red: `__TEST_SWEEP_RED_${stamp}`,
  };
  const rows: Array<[string, string]> = [
    [ids.green, daysAgoIso(1)],  // green
    [ids.yellow, daysAgoIso(9)], // yellow
    [ids.red, daysAgoIso(20)],   // red
  ];
  for (const [id, stageEntered] of rows) {
    const row: Record<string, string> = {
      id, name: "Sweep test", company: "TestCo", stage: "deposit-pending",
      value: "100000", probability: "80",
      expected_close: "2026-07-01", owner: "test", source: "integration-test",
      created_at: new Date(stageEntered).toISOString(), notes: "",
      brand_slugs: "kohler", source_message_id: "",
      stage_entered_at: stageEntered, pending_move_to: "",
      pending_move_at: "", date_at_border: "", date_customs_cleared: "",
    };
    await appendRow("Pipeline", PIPELINE_COLUMNS.map((c) => row[c]));
  }

  // ----- forbidden without sentinel ---------------------------------------
  console.log("→ forbidden without x-netlify-scheduled sentinel");
  const forbid = await cronRoute.GET(mkReq({}) as never);
  assert(forbid.status === 403, `status=${forbid.status} (expected 403)`);

  // ----- first sweep ------------------------------------------------------
  console.log("→ GET /api/cron/stale-deal-sweep (first run)");
  const res1 = await cronRoute.GET(
    mkReq({ "x-netlify-scheduled": "1" }) as never
  );
  const body1 = await (res1 as Response).json();
  assert(res1.status === 200, `status=200`);
  assert(body1.swept >= 3, `swept >= 3 (got ${body1.swept})`);
  assert(body1.yellow >= 1, `yellow >= 1 (got ${body1.yellow})`);
  assert(body1.red >= 1, `red >= 1 (got ${body1.red})`);
  assert(body1.breachEventsEmitted >= 2, `at least 2 breach events emitted (got ${body1.breachEventsEmitted})`);

  // ----- Deal_Events breaches for yellow + red --------------------------
  const yEv = (await getDealEvents(ids.yellow)).filter((e) => e.event_type === "sla_breach");
  const rEv = (await getDealEvents(ids.red)).filter((e) => e.event_type === "sla_breach");
  const gEv = (await getDealEvents(ids.green)).filter((e) => e.event_type === "sla_breach");
  assert(yEv.length === 1, `yellow deal: 1 breach event (got ${yEv.length})`);
  assert(rEv.length === 1, `red deal: 1 breach event (got ${rEv.length})`);
  assert(gEv.length === 0, `green deal: no breach event (got ${gEv.length})`);

  // ----- idempotency: second sweep → color unchanged, no new breach ----
  console.log("→ second sweep (idempotency check)");
  const res2 = await cronRoute.GET(
    mkReq({ "x-netlify-scheduled": "1" }) as never
  );
  const body2 = await (res2 as Response).json();
  assert(res2.status === 200, `second sweep status=200`);
  assert(body2.breachEventsEmitted === 0, `no new breach events (got ${body2.breachEventsEmitted})`);

  const yEv2 = (await getDealEvents(ids.yellow)).filter((e) => e.event_type === "sla_breach");
  const rEv2 = (await getDealEvents(ids.red)).filter((e) => e.event_type === "sla_breach");
  assert(yEv2.length === 1, `still 1 yellow breach`);
  assert(rEv2.length === 1, `still 1 red breach`);

  console.log(
    `\n${failed === 0 ? "✅" : "❌"} nightly sweep: ${passed} passed, ${failed} failed`
  );
  console.log(`   (left behind ${Object.values(ids).join(", ")} — v1 cleanup compromise)`);
  if (failed > 0) process.exit(1);
};

main().catch((e) => {
  console.error("\n❌ FAILED:", e?.stack || e?.message || e);
  process.exit(1);
});
