/**
 * Unit tests for sla-timers. Pure, no I/O.
 *
 * Run: npx tsx scripts/_test-sla-timers.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

let passed = 0, failed = 0;
const assert = (cond: unknown, msg: string) => {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.error(`  ❌ ${msg}`); }
};

const dayAgo = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
};

const main = async () => {
  const { getSlaColor, getStageSla, classifySla } = await import("../app/lib/sla-timers");

  console.log("→ static SLAs — deposit-pending (g≤7, y≤10, r>10)");
  {
    const now = new Date();
    // day 1 in stage → green
    const day1 = getSlaColor(
      { stage: "deposit-pending", stageEnteredAt: dayAgo(1), brandSlugs: [] },
      [],
      now
    );
    assert(day1.color === "green", `day 1 → green`);
    assert(day1.daysInStage === 1, `daysInStage = 1`);
    assert(day1.sla?.green === 7, `sla.green = 7`);

    const day9 = getSlaColor(
      { stage: "deposit-pending", stageEnteredAt: dayAgo(9), brandSlugs: [] },
      [],
      now
    );
    assert(day9.color === "yellow", `day 9 → yellow`);

    const day15 = getSlaColor(
      { stage: "deposit-pending", stageEnteredAt: dayAgo(15), brandSlugs: [] },
      [],
      now
    );
    assert(day15.color === "red", `day 15 → red`);
  }

  console.log("\n→ brand-dependent — in-production with Dornbracht lead times");
  {
    const brandRows = [
      { brand_slug: "dornbracht", production_days: "42" },
    ];
    const sla = getStageSla("in-production", "dornbracht", brandRows);
    assert(sla?.green === 42, `green = 42 from brand`);
    assert(sla?.yellow === 45, `yellow = green + 3`);
    assert(sla?.red === 49, `red = green + 7`);

    const now = new Date();
    const r1 = getSlaColor(
      { stage: "in-production", stageEnteredAt: dayAgo(40), brandSlugs: ["dornbracht"] },
      brandRows,
      now
    );
    assert(r1.color === "green", `day 40 / 42 → green`);
    const r2 = getSlaColor(
      { stage: "in-production", stageEnteredAt: dayAgo(50), brandSlugs: ["dornbracht"] },
      brandRows,
      now
    );
    assert(r2.color === "red", `day 50 → red`);
  }

  console.log("\n→ brand fallback — Brand_Lead_Times empty, use spec defaults");
  {
    const sla = getStageSla("in-production", "unknown-brand", []);
    assert(sla?.green === 28, `fallback production = 28`);
    const slaShipping = getStageSla("shipping", "unknown-brand", []);
    assert(slaShipping?.green === 22, `fallback shipping = 22`);
    const slaCustoms = getStageSla("in-customs", "unknown-brand", []);
    assert(slaCustoms?.green === 7, `fallback customs = 7`);
  }

  console.log("\n→ unknown stage — no SLA");
  {
    const r = getSlaColor(
      { stage: "discovery", stageEnteredAt: dayAgo(100), brandSlugs: [] }
    );
    assert(r.color === "unknown", `discovery stage → unknown`);
  }

  console.log("\n→ missing stageEnteredAt → unknown");
  {
    const r = getSlaColor(
      { stage: "deposit-pending", stageEnteredAt: undefined, brandSlugs: [] }
    );
    assert(r.color === "unknown", `missing stageEnteredAt → unknown`);
  }

  console.log("\n→ classifySla boundary cases");
  {
    const sla = { green: 7, yellow: 10, red: 14 };
    assert(classifySla(0, sla) === "green", "0 days → green");
    assert(classifySla(7, sla) === "green", "7 days → green (inclusive)");
    assert(classifySla(8, sla) === "yellow", "8 days → yellow");
    assert(classifySla(10, sla) === "yellow", "10 days → yellow (inclusive)");
    assert(classifySla(11, sla) === "red", "11 days → red");
  }

  console.log(`\n${failed === 0 ? "✅" : "❌"} sla-timers: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
};

main().catch((e) => { console.error("\n❌ FAILED:", e?.stack || e?.message || e); process.exit(1); });
