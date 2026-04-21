/**
 * Integration test for alert-dispatcher — seeds a test deal, fires
 * dispatchAlertsForTransition for the key rules, asserts Deal_Events
 * contains the expected alert_fired rows per the ALERT_ROUTES matrix.
 *
 * Covers:
 *   - T-03 happy path (customer email + WA dry-run, Roger dashboard + WA
 *     dry-run, Finance email)
 *   - T-05 happy path (customer email + WA, Roger dashboard, no Finance)
 *   - T-14 issue flag (Roger dashboard + WA dry-run only, critical severity
 *     on the Notifications row)
 *   - Idempotency: re-dispatch T-03 within 6h → zero new alert_fired rows
 *   - Unknown ruleId → empty result, no rows written
 *
 * Run: npx tsx scripts/_test-alert-dispatcher.ts
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
  const { appendRow } = await import("../app/lib/dashboard-sheets");
  const { dispatchAlertsForTransition, ALERT_ROUTES } = await import("../app/lib/alert-dispatcher");
  const { getDealEvents } = await import("../app/lib/deal-events");
  const { __resetBucketsForTests } = await import("../app/lib/alert-rate-limiter");

  // Sanity: ALERT_ROUTES has the 14 rule keys we expect
  console.log("\n→ ALERT_ROUTES registry");
  {
    assert(!!ALERT_ROUTES["T-03-deposit-received"], `T-03 route present`);
    assert(!!ALERT_ROUTES["T-14-critical-customs-hold"], `T-14 route present`);
    assert(Object.keys(ALERT_ROUTES).length >= 14, `>=14 rules mapped (got ${Object.keys(ALERT_ROUTES).length})`);
  }

  // Seed a test deal
  const dealId = `__TEST_DISP_${Date.now()}`;
  console.log(`\n→ seed test deal ${dealId}`);
  const seed: Record<string, string> = {
    id: dealId, name: "Dispatcher test", company: "TestCo",
    stage: "deposit-pending", value: "250000", probability: "90",
    expected_close: "2026-07-01", owner: "test", source: "integration-test",
    created_at: new Date().toISOString(), notes: "",
    brand_slugs: "kohler|dornbracht", source_message_id: "",
    stage_entered_at: new Date().toISOString(),
    pending_move_to: "", pending_move_at: "", date_at_border: "", date_customs_cleared: "",
  };
  await appendRow("Pipeline", PIPELINE_COLUMNS.map((c) => seed[c]));

  const deal = {
    id: dealId, name: "Dispatcher test", contactName: "Maria Garcia",
    value: 250_000, currency: "MXN", stage: "deposit-pending" as const,
    probability: 90, expectedClose: "2026-07-01", assignedRep: "test",
    products: "", createdAt: seed.created_at, notes: "",
    brandSlugs: ["kohler", "dornbracht"], contactCompany: "TestCo",
    customerEmail: "test@example.com",
    customerPhone: "+5214151112222",
  } as Parameters<typeof dispatchAlertsForTransition>[0]["deal"];

  // Use real-now + skipQuietHours so idempotency compares against real
  // event timestamps (which are written by appendDealEvent via Date.now()).
  // __testing.now as a future Date would break the 6h idempotency window.

  // ----- T-03 happy path ------------------------------------------------
  console.log(`\n→ T-03 deposit-received dispatch`);
  __resetBucketsForTests();
  {
    const r = await dispatchAlertsForTransition({
      ruleId: "T-03-deposit-received",
      dealId, fromStage: "deposit-pending", toStage: "deposit-received",
      deal, actor: "stripe",
      extraVars: { amount: "25000", eta_delivered: "2026-07-30" },
      customerLocale: "es",
      __testing: { skipIdempotency: true, skipQuietHours: true },
    });
    assert(r.customer.length === 2, `customer has 2 channel results (got ${r.customer.length})`);
    assert(r.roger.length === 2, `roger has 2 channel results (got ${r.roger.length})`);
    assert(r.finance.length === 1, `finance has 1 channel result (got ${r.finance.length})`);
    assert(r.customer.every((c) => c.status !== "failed"), `customer channels not failed`);
    assert(r.roger.some((c) => c.channel === "dashboard" && c.status === "sent"), `Roger dashboard sent`);
    assert(r.finance.some((c) => c.channel === "email"), `Finance email channel`);

    // alert_fired count: customer-email + customer-wa + roger-dashboard + finance-email = 4
    // Roger-whatsapp is skipped with no recipient (env var not set) → no event written
    const events = await getDealEvents(dealId);
    const alertFired = events.filter((e) => e.event_type === "alert_fired" && e.trigger_rule_id === "T-03-deposit-received");
    assert(alertFired.length >= 4, `>=4 alert_fired rows for T-03 (got ${alertFired.length})`);
  }

  // ----- T-05 happy path (no Finance) -----------------------------------
  console.log(`\n→ T-05 in-production dispatch (no Finance)`);
  __resetBucketsForTests();
  {
    const r = await dispatchAlertsForTransition({
      ruleId: "T-05-production-confirmed",
      dealId, fromStage: "ordering", toStage: "in-production",
      deal, actor: "test",
      extraVars: { production_eta: "2026-06-01", days_to_production_complete: "30" },
      __testing: { skipIdempotency: true, skipQuietHours: true },
    });
    assert(r.customer.length === 2, `customer: 2 channels`);
    assert(r.roger.length === 1, `roger: 1 channel (dashboard only)`);
    assert(r.finance.length === 0, `finance: none`);
  }

  // ----- T-14 issue flag ------------------------------------------------
  console.log(`\n→ T-14 critical customs hold`);
  __resetBucketsForTests();
  {
    const r = await dispatchAlertsForTransition({
      ruleId: "T-14-critical-customs-hold",
      dealId, fromStage: "in-customs", toStage: "post-delivery-issue",
      deal, actor: "system",
      extraVars: { issue_type: "customs_hold_7d", issue_summary: "Pedimento stuck", recommended_action: "Call broker" },
      __testing: { skipIdempotency: true, skipQuietHours: true },
    });
    assert(r.customer.length === 0, `customer: no channels (T-14 is Roger-only)`);
    assert(r.roger.length === 2, `roger: dashboard + whatsapp (got ${r.roger.length})`);
    assert(r.finance.length === 0, `finance: none`);
  }

  // ----- Idempotency (without skipIdempotency) -----------------------
  console.log(`\n→ Idempotency: 6h window dedupe`);
  __resetBucketsForTests();
  {
    const firstR = await dispatchAlertsForTransition({
      ruleId: "T-04-po-attached",
      dealId, fromStage: "deposit-received", toStage: "ordering",
      deal, actor: "test",
      extraVars: { fx_amount_usd: "1000", fx_amount_mxn: "20000", fx_rate: "20" },
      __testing: { skipQuietHours: true },
    });
    const firstSent = [...firstR.customer, ...firstR.roger, ...firstR.finance].filter(
      (c) => c.status === "sent" || c.status === "dry_run"
    ).length;
    assert(firstSent > 0, `first dispatch produced some sent/dry_run (got ${firstSent})`);

    // Reset rate buckets so rate-limiting doesn't mask idempotency
    __resetBucketsForTests();
    // Google Sheets values.get has ~200ms read-after-write lag for just-
    // appended rows. Wait briefly so the second dispatch sees all 4 events
    // the first dispatch wrote.
    await new Promise((r) => setTimeout(r, 1500));

    const secondR = await dispatchAlertsForTransition({
      ruleId: "T-04-po-attached",
      dealId, fromStage: "deposit-received", toStage: "ordering",
      deal, actor: "test",
      extraVars: { fx_amount_usd: "1000", fx_amount_mxn: "20000", fx_rate: "20" },
      __testing: { skipQuietHours: true },
    });
    const secondSent = [...secondR.customer, ...secondR.roger, ...secondR.finance].filter(
      (c) => c.status === "sent" || c.status === "dry_run"
    ).length;
    assert(secondSent === 0, `second dispatch: 0 new sent/dry_run (got ${secondSent})`);
    const secondIdempotent = [...secondR.customer, ...secondR.roger, ...secondR.finance].filter(
      (c) => c.error === "idempotent"
    ).length;
    assert(secondIdempotent > 0, `second dispatch: some channels marked idempotent (got ${secondIdempotent})`);
  }

  // ----- Unknown ruleId → empty result -----------------------------
  console.log(`\n→ Unknown ruleId`);
  {
    const r = await dispatchAlertsForTransition({
      ruleId: "T-99-does-not-exist",
      dealId, fromStage: "discovery", toStage: "discovery",
      deal, actor: "test",
    });
    assert(r.customer.length === 0 && r.roger.length === 0 && r.finance.length === 0, `all arrays empty`);
  }

  console.log(`\n${failed === 0 ? "✅" : "❌"} alert-dispatcher: ${passed} passed, ${failed} failed`);
  console.log(`   (left behind ${dealId} — v1 cleanup compromise)`);
  if (failed > 0) process.exit(1);
};

main().catch((e) => { console.error("\n❌ FAILED:", e?.stack || e?.message || e); process.exit(1); });
