/**
 * Asserts the 14-stage Ops Pipeline has in-customs + customs-cleared present
 * and mapped to the "fulfillment" journey phase.
 *
 * Run: npx tsx scripts/_test-ops-stages.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

const main = async () => {
  const { getJourneyPhase } = await import(
    "../app/lib/sample-dashboard-data"
  );
  type PipelineStage = Parameters<typeof getJourneyPhase>[0];

  const OPS_FULFILLMENT_STAGES: PipelineStage[] = [
    "quote-approved", "deposit-pending", "deposit-received",
    "ordering", "in-production", "shipping",
    "in-customs",        // W7 new
    "customs-cleared",   // W7 new
    "received",
  ];

  const OPS_DELIVERED_STAGES: PipelineStage[] = [
    "delivery-scheduled", "delivered",
    "balance-pending", "complete", "post-delivery-issue",
  ];

  let failed = false;

  for (const stage of OPS_FULFILLMENT_STAGES) {
    const phase = getJourneyPhase(stage);
    if (phase !== "fulfillment") {
      console.error(`❌ ${stage} mapped to ${phase}, expected fulfillment`);
      failed = true;
    } else {
      console.log(`✓ ${stage} → fulfillment`);
    }
  }
  for (const stage of OPS_DELIVERED_STAGES) {
    const phase = getJourneyPhase(stage);
    if (phase !== "delivered") {
      console.error(`❌ ${stage} mapped to ${phase}, expected delivered`);
      failed = true;
    } else {
      console.log(`✓ ${stage} → delivered`);
    }
  }

  if (failed) process.exit(1);
  console.log(`\n✅ 14-stage Ops Pipeline has all stages incl. in-customs + customs-cleared`);
};

main().catch((e) => {
  console.error("\n❌ FAILED:", e?.message || e);
  process.exit(1);
});
