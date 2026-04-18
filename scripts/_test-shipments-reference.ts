/**
 * Round-trip test: each of the 4 reference read helpers returns an
 * Array (likely empty since the sheets are scaffolded but unpopulated).
 *
 * Run: npx tsx scripts/_test-shipments-reference.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

const main = async () => {
  const lib = await import("../app/lib/shipments-reference");
  const checks: [string, unknown[]][] = [
    ["Brand_NOM_Status", await lib.getBrandNomStatus()],
    ["Brand_Lead_Times", await lib.getBrandLeadTimes()],
    ["HS_Code_Lookup", await lib.getHsCodes()],
    ["FTA_Rates", await lib.getFtaRates()],
  ];

  let fail = 0;
  for (const [name, rows] of checks) {
    const ok = Array.isArray(rows);
    if (ok) {
      console.log(`✓ ${name} — ${rows.length} rows`);
    } else {
      console.log(`✗ ${name} — not an array (got ${typeof rows})`);
      fail++;
    }
  }
  console.log(fail === 0 ? "\n✅ All 4 reference reads OK." : `\n❌ ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
};

main().catch((e) => {
  console.error("\n❌ FAILED:", e?.message || e);
  process.exit(1);
});
