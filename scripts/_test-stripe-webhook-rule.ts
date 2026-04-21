/**
 * End-to-end test: Stripe invoice.payment_succeeded webhook fires the rule
 * engine and advances the deal. Bypasses Stripe signature construction by
 * calling the internal dispatcher directly — signature verification is
 * library-level and not where the W7 bug risk lives.
 *
 * Also exercises event.id idempotency: re-dispatching the same event should
 * NOT cause a second stage change.
 *
 * Run: npx tsx scripts/_test-stripe-webhook-rule.ts
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
const DEAL_PAYMENTS_COLUMNS = [
  "Payment_ID", "Deal_ID", "Type", "Invoice_ID",
  "Stripe_Invoice_ID", "Stripe_Payment_ID", "Amount", "Currency",
  "Stripe_Fees", "Net_Received", "Status", "Due_Date", "Paid_Date",
  "Installment_Num",
];

let passed = 0, failed = 0;
const assert = (cond: unknown, msg: string) => {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.error(`  ❌ ${msg}`); }
};

const main = async () => {
  const { appendRow, readSheet } = await import("../app/lib/dashboard-sheets");
  const { dispatchStripeEvent } = await import("../app/api/stripe/webhook/dispatcher");
  const { getDealEvents } = await import("../app/lib/deal-events");

  // seed deal at deposit-pending, $250K MXN (under pre-move threshold)
  const dealId = `__TEST_STRIPE_${Date.now()}`;
  const invoiceId = `in_test_${Date.now()}`;
  const paymentId = `PAY-TEST-${Date.now()}`;
  const stripeEventId = `evt_test_${Date.now()}`;

  console.log(`→ seed Pipeline + Deal_Payments rows`);
  const dealRow: Record<string, string> = {
    id: dealId, name: "Stripe test deal", company: "TestCo",
    stage: "deposit-pending", value: "250000", probability: "95",
    expected_close: "2026-06-30", owner: "test", source: "integration-test",
    created_at: new Date().toISOString(), notes: "",
    brand_slugs: "kohler", source_message_id: "",
    stage_entered_at: new Date().toISOString(),
    pending_move_to: "", pending_move_at: "",
    date_at_border: "", date_customs_cleared: "",
  };
  await appendRow("Pipeline", PIPELINE_COLUMNS.map((c) => dealRow[c]));

  const paymentRow: Record<string, string> = {
    Payment_ID: paymentId, Deal_ID: dealId, Type: "deposit",
    Invoice_ID: "", Stripe_Invoice_ID: invoiceId,
    Stripe_Payment_ID: "", Amount: "25000", Currency: "MXN",
    Stripe_Fees: "", Net_Received: "", Status: "sent",
    Due_Date: "", Paid_Date: "", Installment_Num: "1",
  };
  await appendRow("Deal_Payments", DEAL_PAYMENTS_COLUMNS.map((c) => paymentRow[c]));

  // dispatch synthetic event — bypass signature step
  console.log(`→ dispatch invoice.payment_succeeded (id=${stripeEventId})`);
  const syntheticEvent = {
    id: stripeEventId,
    type: "invoice.payment_succeeded",
    data: {
      object: {
        id: invoiceId,
        amount_paid: 25_000 * 100, // Stripe uses minor units
        customer_email: "test@example.com",
      },
    },
  } as const;
  const result1 = await dispatchStripeEvent(
    syntheticEvent as unknown as import("stripe").Stripe.Event
  );
  assert(result1 === "processed", `first dispatch = processed (got ${result1})`);

  // check Pipeline row advanced
  const pipelineRows = await readSheet<Record<string, string>>("Pipeline");
  const updated = pipelineRows.find((r) => r.id === dealId);
  assert(updated?.stage === "deposit-received", `stage → deposit-received`);

  // check Deal_Events has T-03 row with actor=stripe
  const events = await getDealEvents(dealId);
  const stageChange = events.find((e) => e.event_type === "stage_change");
  assert(stageChange?.trigger_rule_id === "T-03-deposit-received", `T-03 rule id`);
  assert(stageChange?.actor === "stripe", `actor=stripe`);

  // idempotency: same event dispatched again → skip
  console.log(`→ dispatch SAME event again (idempotency check)`);
  const result2 = await dispatchStripeEvent(
    syntheticEvent as unknown as import("stripe").Stripe.Event
  );
  assert(result2 === "duplicate", `second dispatch = duplicate (got ${result2})`);

  // no new stage_change events for this deal
  const eventsAfter = await getDealEvents(dealId);
  const stageChanges = eventsAfter.filter((e) => e.event_type === "stage_change");
  assert(stageChanges.length === 1, `still exactly 1 stage_change event (got ${stageChanges.length})`);

  console.log(`\n${failed === 0 ? "✅" : "❌"} stripe webhook rule-engine integration: ${passed} passed, ${failed} failed`);
  console.log(`   (left behind test rows for ${dealId} — v1 cleanup compromise)`);
  if (failed > 0) process.exit(1);
};

main().catch((e) => { console.error("\n❌ FAILED:", e?.stack || e?.message || e); process.exit(1); });
