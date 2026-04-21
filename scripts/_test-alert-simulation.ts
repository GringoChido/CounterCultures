/**
 * W8 ship-criterion test — walk a simulated deal through the 14 Ops rules,
 * assert the aggregate alert counts per audience:
 *
 *   Customer touchpoints:  10   (visible to the customer via email + WA)
 *   Roger notifications:   14   (one per rule, dashboard channel)
 *   Finance notifications:  7   (CFDI requests, AR, FX, duties)
 *
 *   Zero duplicates (6h idempotency guard prevents double-firing)
 *
 * The customer count excludes rules whose ALERT_ROUTES entry has no
 * customer branch (T-09, T-10, T-12, T-14). For multi-variant rules
 * (T-01/T-07/T-08/T-09) the test fires just one variant per transition
 * so we don't double-count.
 *
 * Run: npx tsx scripts/_test-alert-simulation.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import type { PipelineDeal, PipelineStage } from "../app/lib/sample-dashboard-data";

const PIPELINE_COLUMNS = [
  "id", "name", "company", "stage", "value", "probability",
  "expected_close", "owner", "source", "created_at", "notes",
  "brand_slugs", "source_message_id",
  "stage_entered_at", "pending_move_to", "pending_move_at",
  "date_at_border", "date_customs_cleared",
];

interface RuleWalkStep {
  ruleId: string;
  fromStage: PipelineStage;
  toStage: PipelineStage;
  extraVars: Record<string, string | number>;
}

// Walk all 14 distinct transitions (one variant each for a/b-split rules).
const WALK: RuleWalkStep[] = [
  { ruleId: "T-01a-manual-approved", fromStage: "verbal-yes", toStage: "quote-approved",
    extraVars: { deposit_amount: "75000", deposit_pct: "30", payment_deadline: "2026-05-10" } },
  { ruleId: "T-02-deposit-cfdi", fromStage: "quote-approved", toStage: "deposit-pending",
    extraVars: { deposit_amount: "75000", stripe_link: "https://pay.stripe/test", bank_details: "BBVA 123" } },
  { ruleId: "T-03-deposit-received", fromStage: "deposit-pending", toStage: "deposit-received",
    extraVars: { amount: "75000", eta_delivered: "2026-08-15", po_amount_usd: "5000" } },
  { ruleId: "T-04-po-attached", fromStage: "deposit-received", toStage: "ordering",
    extraVars: { fx_amount_usd: "5000", fx_amount_mxn: "100000", fx_rate: "20", payment_terms: "NET-30" } },
  { ruleId: "T-05-production-confirmed", fromStage: "ordering", toStage: "in-production",
    extraVars: { production_eta: "2026-07-01", days_to_production_complete: "40" } },
  { ruleId: "T-06-shipped", fromStage: "in-production", toStage: "shipping",
    extraVars: { origin_port: "Hamburg", tracking_link: "https://t.test/X", eta_border: "2026-07-20", broker_firm: "TGR" } },
  { ruleId: "T-07a-at-border-field", fromStage: "shipping", toStage: "in-customs",
    extraVars: { nom_status: "on-file", broker_contact: "Jeanefer", days_to_eta: "14",
      duties_paid_mxn: "15000", iva_paid_mxn: "24000", pedimento_number: "26-43-8888",
      broker_firm: "TGR", payment_deadline: "2026-07-25" } },
  { ruleId: "T-08a-cleared-field", fromStage: "in-customs", toStage: "customs-cleared",
    extraVars: { pedimento_number: "26-43-8888" } },
  { ruleId: "T-09a-received-at-cc", fromStage: "customs-cleared", toStage: "received",
    extraVars: { customer_phone: "+5214151112222" } },
  { ruleId: "T-10-scheduled", fromStage: "received", toStage: "delivery-scheduled",
    extraVars: { scheduled_delivery_datetime: "2026-08-01T10:00:00-06:00",
      installer_name: "Equipo SMA", installer_phone: "+5214151234567" } },
  { ruleId: "T-11-pod-attached", fromStage: "delivery-scheduled", toStage: "delivered",
    extraVars: { delivery_location: "Residencia San Antonio", balance_amount_mxn: "175000" } },
  { ruleId: "T-12-balance-cfdi", fromStage: "delivered", toStage: "balance-pending",
    extraVars: { balance_amount_mxn: "175000" } },
  { ruleId: "T-13-final-payment", fromStage: "balance-pending", toStage: "complete",
    extraVars: { total_collected_mxn: "250000", testimonial_link: "https://cc.test/t",
      photo_upload_link: "https://cc.test/p", portfolio_url: "https://cc.test/portfolio" } },
  { ruleId: "T-14-critical-customs-hold", fromStage: "in-customs", toStage: "post-delivery-issue",
    extraVars: { issue_type: "customs_hold_7d", issue_summary: "Pedimento 26-43-8888 held",
      recommended_action: "Contact broker immediately" } },
];

let passed = 0, failed = 0;
const assert = (cond: unknown, msg: string) => {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.error(`  ❌ ${msg}`); }
};

const main = async () => {
  const { appendRow } = await import("../app/lib/dashboard-sheets");
  const { dispatchAlertsForTransition } = await import("../app/lib/alert-dispatcher");
  const { getDealEvents } = await import("../app/lib/deal-events");
  const { __resetBucketsForTests } = await import("../app/lib/alert-rate-limiter");

  __resetBucketsForTests();

  const dealId = `__TEST_SIM_${Date.now()}`;
  console.log(`→ seed simulation deal ${dealId}`);
  const seed: Record<string, string> = {
    id: dealId, name: "Residencial San Antonio — 12 Units", company: "AC Arquitectos",
    stage: "verbal-yes", value: "250000", probability: "100",
    expected_close: "2026-08-15", owner: "roger", source: "simulation",
    created_at: new Date().toISOString(), notes: "",
    brand_slugs: "kohler|dornbracht", source_message_id: "",
    stage_entered_at: new Date().toISOString(),
    pending_move_to: "", pending_move_at: "",
    date_at_border: "", date_customs_cleared: "",
  };
  await appendRow("Pipeline", PIPELINE_COLUMNS.map((c) => seed[c]));

  // Build a rich PipelineDeal — customerEmail + customerPhone ensures the
  // dispatcher doesn't skip customer channels with "no recipient".
  const deal: PipelineDeal = {
    id: dealId,
    name: "Residencial San Antonio — 12 Units",
    contactName: "ARQ. Gabor Goded",
    value: 250_000,
    currency: "MXN",
    stage: "verbal-yes",
    probability: 100,
    expectedClose: "2026-08-15",
    assignedRep: "roger",
    products: "",
    createdAt: seed.created_at,
    notes: "",
    brandSlugs: ["kohler", "dornbracht"],
    contactCompany: "AC Arquitectos",
    // W8 dispatcher-relevant fields (not in PipelineDeal type but read via unknown-cast)
  };
  (deal as unknown as { customerEmail: string }).customerEmail = "gabor@ac-arquitectos.test";
  (deal as unknown as { customerPhone: string }).customerPhone = "+5214159990000";

  console.log(`\n→ walk 14 rules, dispatching alerts for each`);
  // Aggregate directly from the dispatcher's synchronous return values.
  // This is authoritative (and free of Google Sheets read-after-write lag)
  // since dispatchAlertsForTransition awaits all channel sends + writes.
  const byAudience: Record<string, number> = { customer: 0, roger: 0, finance: 0 };

  for (const step of WALK) {
    process.stdout.write(`  ${step.ruleId.padEnd(42)} → `);
    const r = await dispatchAlertsForTransition({
      ruleId: step.ruleId,
      dealId,
      fromStage: step.fromStage,
      toStage: step.toStage,
      deal: { ...deal, stage: step.fromStage },
      actor: "simulation",
      extraVars: { ...step.extraVars, customer_name: "ARQ. Gabor Goded", project_name: deal.name },
      customerLocale: "es",
      __testing: { skipQuietHours: true },
    });
    const firedOk = (arr: typeof r.customer) =>
      arr.some((x) => x.status === "sent" || x.status === "dry_run");
    const c = firedOk(r.customer);
    const rg = firedOk(r.roger);
    const f = firedOk(r.finance);
    if (c) byAudience.customer++;
    if (rg) byAudience.roger++;
    if (f) byAudience.finance++;
    console.log(`customer=${c ? "✓" : "-"} roger=${rg ? "✓" : "-"} finance=${f ? "✓" : "-"}`);
  }

  // Settle before idempotency re-fire (Sheets read-after-write lag)
  await new Promise((r) => setTimeout(r, 5000));

  // Sanity read from Deal_Events for the log (not used for assertions)
  const events = await getDealEvents(dealId);
  const alertFired = events.filter((e) => e.event_type === "alert_fired");
  console.log(`\n→ Deal_Events alert_fired rows written: ${alertFired.length}`);

  console.log(`\n→ W8 ship criteria check`);
  assert(byAudience.customer === 10, `Customer touchpoints = 10 (got ${byAudience.customer})`);
  assert(byAudience.roger === 14, `Roger notifications = 14 (got ${byAudience.roger})`);
  assert(byAudience.finance === 7, `Finance notifications = 7 (got ${byAudience.finance})`);

  // Reset rate-limit buckets so idempotency (not rate-limiting) is the reason
  // the re-fire short-circuits. (Rate limits would also block, but the test
  // is specifically proving the 6h idempotency window works.)
  __resetBucketsForTests();

  // Zero duplicates: re-fire T-03 — should idempotent-skip
  console.log(`\n→ Idempotency: re-fire T-03, expect 0 new alert_fired`);
  const refireR = await dispatchAlertsForTransition({
    ruleId: "T-03-deposit-received",
    dealId,
    fromStage: "deposit-pending",
    toStage: "deposit-received",
    deal: { ...deal, stage: "deposit-pending" },
    actor: "simulation-refire",
    extraVars: WALK.find((s) => s.ruleId === "T-03-deposit-received")!.extraVars,
    customerLocale: "es",
    __testing: { skipQuietHours: true },
  });
  const refireFresh = [...refireR.customer, ...refireR.roger, ...refireR.finance].filter(
    (c) => c.status === "sent" || c.status === "dry_run"
  ).length;
  const refireIdempotent = [...refireR.customer, ...refireR.roger, ...refireR.finance].filter(
    (c) => c.error === "idempotent"
  ).length;
  assert(refireFresh === 0, `re-fire produced 0 fresh sends (got ${refireFresh})`);
  assert(refireIdempotent > 0, `re-fire channels marked idempotent (got ${refireIdempotent})`);

  console.log(`\n${failed === 0 ? "✅" : "❌"} alert simulation: ${passed} passed, ${failed} failed`);
  console.log(`   (left behind ${dealId} + ~31 alert_fired rows — v1 cleanup compromise)`);
  if (failed > 0) process.exit(1);
};

main().catch((e) => { console.error("\n❌ FAILED:", e?.stack || e?.message || e); process.exit(1); });
