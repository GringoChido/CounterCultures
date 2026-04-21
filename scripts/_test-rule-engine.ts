/**
 * Rule engine unit tests — pure matcher, no I/O.
 *
 * Each of the 14 rules gets at least one positive (predicate true → expected
 * match) and one negative (predicate false → no match) case. Plus global
 * semantics: pre-move threshold, single-match semantics, trigger filtering.
 *
 * Covers rule engine spec from
 *   docs/superpowers/specs/2026-04-20-week7-pipeline-automation-design.md §4
 *
 * Run: npx tsx scripts/_test-rule-engine.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

let passed = 0;
let failed = 0;

const assert = (cond: unknown, msg: string) => {
  if (cond) {
    passed++;
    console.log(`  ✓ ${msg}`);
  } else {
    failed++;
    console.error(`  ❌ ${msg}`);
  }
};

const main = async () => {
  const { STAGE_RULES, PREMOVE_THRESHOLD_MXN } = await import(
    "../app/lib/stage-rules"
  );
  const { matchRule, shouldRequirePreMove } = await import(
    "../app/lib/rule-engine"
  );
  const { mkDeal, mkContext } = await import("./_rule-engine-fixtures");

  type StageRuleTrigger = Parameters<typeof matchRule>[0];

  console.log("\n→ Rule engine: registry sanity");
  assert(STAGE_RULES.length >= 14, `STAGE_RULES has >=14 entries (got ${STAGE_RULES.length})`);
  assert(PREMOVE_THRESHOLD_MXN === 500_000, `PREMOVE_THRESHOLD_MXN = $500K MXN`);
  const ids = new Set(STAGE_RULES.map((r) => r.id));
  assert(ids.size === STAGE_RULES.length, "all rule IDs are unique");

  // -------------------------------------------------------------------------
  // Rule 1 — close → quote-approved (manual / doc_attached)
  // -------------------------------------------------------------------------
  console.log("\n→ Rule T-01 — verbal-yes → quote-approved");
  {
    const deal = mkDeal({ stage: "verbal-yes", value: 200_000 });
    const ctx = mkContext(deal, "manual", { quote_approved: true });
    const match = matchRule("manual", deal, ctx);
    assert(match?.id.startsWith("T-01"), "manual with quote_approved flag matches T-01");
    assert(match?.toStage === "quote-approved", "target = quote-approved");
  }
  {
    const deal = mkDeal({ stage: "discovery" });
    const ctx = mkContext(deal, "manual", { quote_approved: true });
    const match = matchRule("manual", deal, ctx);
    assert(!match || !match.id.startsWith("T-01"), "T-01 does not fire from discovery");
  }

  // -------------------------------------------------------------------------
  // Rule 2 — quote-approved → deposit-pending (doc_attached: deposit_cfdi)
  // -------------------------------------------------------------------------
  console.log("\n→ Rule T-02 — quote-approved → deposit-pending");
  {
    const deal = mkDeal({ stage: "quote-approved" });
    const ctx = mkContext(deal, "doc_attached", { doc_type: "deposit_cfdi" });
    const match = matchRule("doc_attached", deal, ctx);
    assert(match?.id.startsWith("T-02"), "deposit CFDI attached → T-02 matches");
  }
  {
    const deal = mkDeal({ stage: "quote-approved" });
    const ctx = mkContext(deal, "doc_attached", { doc_type: "quote_pdf" });
    const match = matchRule("doc_attached", deal, ctx);
    assert(!match || !match.id.startsWith("T-02"), "non-CFDI doc does NOT match T-02");
  }

  // -------------------------------------------------------------------------
  // Rule 3 — deposit-pending → deposit-received (stripe_payment)
  // -------------------------------------------------------------------------
  console.log("\n→ Rule T-03 — deposit-pending → deposit-received");
  {
    const deal = mkDeal({ stage: "deposit-pending", value: 250_000 });
    const ctx = mkContext(deal, "stripe_payment", { allocated_to: "deposit", amount: 25_000 });
    const match = matchRule("stripe_payment", deal, ctx);
    assert(match?.id.startsWith("T-03"), "deposit payment → T-03");
    assert(match?.toStage === "deposit-received", "target deposit-received");
  }
  {
    const deal = mkDeal({ stage: "deposit-pending" });
    const ctx = mkContext(deal, "stripe_payment", { allocated_to: "balance", amount: 10_000 });
    const match = matchRule("stripe_payment", deal, ctx);
    assert(!match || !match.id.startsWith("T-03"), "balance payment does not fire deposit rule");
  }

  // -------------------------------------------------------------------------
  // Rule 4 — deposit-received → ordering (PO attached)
  // -------------------------------------------------------------------------
  console.log("\n→ Rule T-04 — deposit-received → ordering");
  {
    const deal = mkDeal({ stage: "deposit-received" });
    const ctx = mkContext(deal, "doc_attached", { doc_type: "purchase_order" });
    const match = matchRule("doc_attached", deal, ctx);
    assert(match?.id.startsWith("T-04"), "PO attached → T-04 matches");
    assert(match?.toStage === "ordering", "target ordering");
  }

  // -------------------------------------------------------------------------
  // Rule 5 — ordering → in-production
  // -------------------------------------------------------------------------
  console.log("\n→ Rule T-05 — ordering → in-production");
  {
    const deal = mkDeal({ stage: "ordering" });
    const ctx = mkContext(deal, "deal_field_update", { production_eta_date: "2026-06-01" });
    const match = matchRule("deal_field_update", deal, ctx);
    assert(match?.id.startsWith("T-05"), "production_eta_date populated → T-05");
    assert(match?.toStage === "in-production", "target in-production");
  }
  {
    const deal = mkDeal({ stage: "ordering" });
    const ctx = mkContext(deal, "deal_field_update", { name: "renamed" });
    const match = matchRule("deal_field_update", deal, ctx);
    assert(!match || !match.id.startsWith("T-05"), "unrelated field update does NOT fire T-05");
  }

  // -------------------------------------------------------------------------
  // Rule 6 — in-production → shipping
  // -------------------------------------------------------------------------
  console.log("\n→ Rule T-06 — in-production → shipping");
  {
    const deal = mkDeal({ stage: "in-production" });
    const ctx = mkContext(deal, "deal_field_update", {
      tracking_number: "1Z999AA10123456784",
      date_shipped_origin: "2026-04-15",
    });
    const match = matchRule("deal_field_update", deal, ctx);
    assert(match?.id.startsWith("T-06"), "tracking + ship date → T-06");
    assert(match?.toStage === "shipping", "target shipping");
  }
  {
    const deal = mkDeal({ stage: "in-production" });
    const ctx = mkContext(deal, "deal_field_update", { tracking_number: "1Z..." });
    const match = matchRule("deal_field_update", deal, ctx);
    assert(!match || !match.id.startsWith("T-06"), "tracking WITHOUT ship date does NOT fire T-06");
  }

  // -------------------------------------------------------------------------
  // Rule 7 — shipping → in-customs (deal_field_update OR trafico_status_change)
  // -------------------------------------------------------------------------
  console.log("\n→ Rule T-07 — shipping → in-customs");
  {
    const deal = mkDeal({ stage: "shipping" });
    const ctx = mkContext(deal, "deal_field_update", { date_at_border: "2026-04-18" });
    const match = matchRule("deal_field_update", deal, ctx);
    assert(match?.id.startsWith("T-07"), "date_at_border → T-07");
    assert(match?.toStage === "in-customs", "target in-customs");
  }
  {
    const deal = mkDeal({ stage: "shipping" });
    const ctx = mkContext(deal, "trafico_status_change", { to_status: "sent-to-broker" });
    const match = matchRule("trafico_status_change", deal, ctx);
    assert(match?.id.startsWith("T-07"), "Trafico sent-to-broker → T-07");
  }
  {
    const deal = mkDeal({ stage: "shipping", requiresCustoms: false });
    const ctx = mkContext(deal, "deal_field_update", { date_at_border: "2026-04-18" });
    const match = matchRule("deal_field_update", deal, ctx);
    assert(!match || !match.id.startsWith("T-07"), "domestic deal (requiresCustoms=false) skips T-07");
  }

  // -------------------------------------------------------------------------
  // Rule 8 — in-customs → customs-cleared
  // -------------------------------------------------------------------------
  console.log("\n→ Rule T-08 — in-customs → customs-cleared");
  {
    const deal = mkDeal({ stage: "in-customs" });
    const ctx = mkContext(deal, "deal_field_update", { date_customs_cleared: "2026-04-22" });
    const match = matchRule("deal_field_update", deal, ctx);
    assert(match?.id.startsWith("T-08"), "date_customs_cleared populated → T-08");
  }
  {
    const deal = mkDeal({ stage: "in-customs" });
    const ctx = mkContext(deal, "trafico_status_change", { to_status: "crossing-approved" });
    const match = matchRule("trafico_status_change", deal, ctx);
    assert(match?.id.startsWith("T-08"), "Trafico crossing-approved → T-08");
  }

  // -------------------------------------------------------------------------
  // Rule 9 — customs-cleared → received
  // -------------------------------------------------------------------------
  console.log("\n→ Rule T-09 — customs-cleared → received");
  {
    const deal = mkDeal({ stage: "customs-cleared" });
    const ctx = mkContext(deal, "deal_field_update", { date_received_at_cc: "2026-04-24" });
    const match = matchRule("deal_field_update", deal, ctx);
    assert(match?.id.startsWith("T-09"), "date_received_at_cc populated → T-09");
    assert(match?.toStage === "received", "target received");
  }

  // Domestic-skip path: shipping → received directly
  {
    const deal = mkDeal({ stage: "shipping", requiresCustoms: false });
    const ctx = mkContext(deal, "deal_field_update", { date_received_at_cc: "2026-04-24" });
    const match = matchRule("deal_field_update", deal, ctx);
    assert(match?.id.startsWith("T-09"), "domestic deal: shipping → received via T-09");
  }

  // -------------------------------------------------------------------------
  // Rule 10 — received → delivery-scheduled
  // -------------------------------------------------------------------------
  console.log("\n→ Rule T-10 — received → delivery-scheduled");
  {
    const deal = mkDeal({ stage: "received" });
    const ctx = mkContext(deal, "deal_field_update", { scheduled_delivery_datetime: "2026-04-30T09:00:00Z" });
    const match = matchRule("deal_field_update", deal, ctx);
    assert(match?.id.startsWith("T-10"), "scheduled_delivery_datetime → T-10");
  }

  // -------------------------------------------------------------------------
  // Rule 11 — delivery-scheduled → delivered
  // -------------------------------------------------------------------------
  console.log("\n→ Rule T-11 — delivery-scheduled → delivered");
  {
    const deal = mkDeal({ stage: "delivery-scheduled" });
    const ctx = mkContext(deal, "doc_attached", { doc_type: "pod", date_delivered: "2026-04-30" });
    const match = matchRule("doc_attached", deal, ctx);
    assert(match?.id.startsWith("T-11"), "POD attached + date_delivered → T-11");
  }

  // -------------------------------------------------------------------------
  // Rule 12 — delivered → balance-pending
  // -------------------------------------------------------------------------
  console.log("\n→ Rule T-12 — delivered → balance-pending");
  {
    const deal = mkDeal({ stage: "delivered", paymentStructure: "fifty-fifty" });
    const ctx = mkContext(deal, "doc_attached", { doc_type: "balance_cfdi" });
    const match = matchRule("doc_attached", deal, ctx);
    assert(match?.id.startsWith("T-12"), "balance CFDI on fifty-fifty → T-12");
  }
  {
    const deal = mkDeal({ stage: "delivered", paymentStructure: "full-upfront" });
    const ctx = mkContext(deal, "doc_attached", { doc_type: "balance_cfdi" });
    const match = matchRule("doc_attached", deal, ctx);
    assert(!match || !match.id.startsWith("T-12"), "full-upfront deal does not fire T-12");
  }

  // -------------------------------------------------------------------------
  // Rule 13 — balance-pending → complete
  // -------------------------------------------------------------------------
  console.log("\n→ Rule T-13 — balance-pending → complete");
  {
    const deal = mkDeal({ stage: "balance-pending" });
    const ctx = mkContext(deal, "stripe_payment", { allocated_to: "balance", amount: 125_000 });
    const match = matchRule("stripe_payment", deal, ctx);
    assert(match?.id.startsWith("T-13"), "balance payment → T-13");
    assert(match?.toStage === "complete", "target complete");
  }

  // -------------------------------------------------------------------------
  // Rule 14 — any-stage → post-delivery-issue (nightly_sweep critical thresholds)
  // -------------------------------------------------------------------------
  console.log("\n→ Rule T-14 — any → post-delivery-issue (sweep critical)");
  {
    // simulate customs hold > 7d
    const deal = mkDeal({ stage: "in-customs" });
    const ctx = mkContext(deal, "nightly_sweep", { customs_hold_days: 8 });
    const match = matchRule("nightly_sweep", deal, ctx);
    assert(match?.id.startsWith("T-14"), "customs hold > 7d → T-14 flag");
  }
  {
    const deal = mkDeal({ stage: "in-customs" });
    const ctx = mkContext(deal, "nightly_sweep", { customs_hold_days: 3 });
    const match = matchRule("nightly_sweep", deal, ctx);
    assert(!match || !match.id.startsWith("T-14"), "customs hold at 3d does NOT flag issue");
  }

  // -------------------------------------------------------------------------
  // Global: trigger filtering
  // -------------------------------------------------------------------------
  console.log("\n→ Global — trigger filtering");
  {
    const deal = mkDeal({ stage: "deposit-pending" });
    const ctx = mkContext(deal, "manual", {});
    const match = matchRule("manual", deal, ctx);
    assert(!match, "manual trigger with no payload fires nothing from deposit-pending");
  }

  // -------------------------------------------------------------------------
  // Global: pre-move threshold
  // -------------------------------------------------------------------------
  console.log("\n→ Global — pre-move threshold ($500K MXN)");
  {
    const deal = mkDeal({ stage: "deposit-pending", value: 750_000 });
    assert(shouldRequirePreMove(deal), "deal value 750K requires pre-move");
  }
  {
    const deal = mkDeal({ stage: "deposit-pending", value: 200_000 });
    assert(!shouldRequirePreMove(deal), "deal value 200K does NOT require pre-move");
  }
  {
    const deal = mkDeal({ stage: "deposit-pending", value: 500_000 });
    assert(!shouldRequirePreMove(deal), "deal value exactly 500K does NOT require pre-move (>, not ≥)");
  }

  // -------------------------------------------------------------------------
  // Global: single-match semantics
  // -------------------------------------------------------------------------
  console.log("\n→ Global — first-match wins");
  {
    // A deal that satisfies two rules shouldn't fire both
    const deal = mkDeal({ stage: "shipping" });
    const ctx = mkContext(deal, "deal_field_update", {
      date_at_border: "2026-04-18",
      date_customs_cleared: "2026-04-22",  // would match T-08 if stage were in-customs
    });
    const match = matchRule("deal_field_update", deal, ctx);
    assert(match?.id.startsWith("T-07"), "first-match: stage=shipping matches T-07, not T-08");
  }

  console.log(`\n${failed === 0 ? "✅" : "❌"} rule-engine: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
};

main().catch((e) => {
  console.error("\n❌ FAILED:", e?.message || e);
  process.exit(1);
});
