/**
 * Unit test for alert-quiet-hours (pure, no I/O).
 *
 * Run: npx tsx scripts/_test-quiet-hours.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

let passed = 0, failed = 0;
const assert = (cond: unknown, msg: string) => {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.error(`  ❌ ${msg}`); }
};

// Mexico City is UTC-6 year-round (no DST). We use a "now" that's clearly
// inside vs outside quiet hours regardless of the host machine's tz.
const mkNowAtMexicoHour = (hour: number, min = 0): Date => {
  // hour in Mexico time → UTC hour = hour + 6 (mod 24)
  const utcHour = (hour + 6) % 24;
  // Pick a fixed date well past any DST weirdness, use explicit UTC construction
  const d = new Date(Date.UTC(2026, 4, 15, utcHour, min, 0));
  return d;
};

const main = async () => {
  const { nextAllowedDelivery } = await import("../app/lib/alert-quiet-hours");

  // ----- Customer during business hours (2pm MX) → allowed now -----
  console.log("\n→ Customer @ 2pm MX");
  {
    const now = mkNowAtMexicoHour(14);
    const r = nextAllowedDelivery("customer", now);
    assert(r === null, `returns null (deliver now) — got ${r}`);
  }

  // ----- Customer during quiet hours (11pm MX) → next 8am MX -----
  console.log("\n→ Customer @ 11pm MX");
  {
    const now = mkNowAtMexicoHour(23);
    const r = nextAllowedDelivery("customer", now);
    assert(r !== null, `returns ISO timestamp — got ${r}`);
    if (r) {
      const d = new Date(r);
      const mxHour = (d.getUTCHours() - 6 + 24) % 24;
      assert(mxHour === 8, `next window is 8am MX (got hour ${mxHour})`);
    }
  }

  // ----- Customer @ 3am MX → same-day 8am MX -----
  console.log("\n→ Customer @ 3am MX");
  {
    const now = mkNowAtMexicoHour(3);
    const r = nextAllowedDelivery("customer", now);
    assert(r !== null, `returns ISO timestamp`);
    if (r) {
      const d = new Date(r);
      const mxHour = (d.getUTCHours() - 6 + 24) % 24;
      assert(mxHour === 8, `next window is 8am MX (got hour ${mxHour})`);
      // Same calendar day in MX
      const sameDay = Math.abs(d.getTime() - now.getTime()) < 12 * 3600 * 1000;
      assert(sameDay, `within the next 12h`);
    }
  }

  // ----- Roger always null -----
  console.log("\n→ Roger always exempt");
  {
    assert(nextAllowedDelivery("roger", mkNowAtMexicoHour(23)) === null, `Roger @ 11pm — null`);
    assert(nextAllowedDelivery("roger", mkNowAtMexicoHour(3)) === null, `Roger @ 3am — null`);
    assert(nextAllowedDelivery("roger", mkNowAtMexicoHour(14)) === null, `Roger @ 2pm — null`);
  }

  // ----- Finance always null -----
  console.log("\n→ Finance always exempt");
  {
    assert(nextAllowedDelivery("finance", mkNowAtMexicoHour(23)) === null, `Finance @ 11pm — null`);
    assert(nextAllowedDelivery("finance", mkNowAtMexicoHour(3)) === null, `Finance @ 3am — null`);
  }

  // ----- Customer edge cases: exact boundary -----
  console.log("\n→ Customer boundary cases");
  {
    // 10pm MX is start of quiet hours (22:00) → should queue
    assert(nextAllowedDelivery("customer", mkNowAtMexicoHour(22)) !== null, `10pm — quiet`);
    // 8am MX is end of quiet hours (08:00) → should deliver
    assert(nextAllowedDelivery("customer", mkNowAtMexicoHour(8)) === null, `8am — deliver`);
    // 7:59am → still quiet
    assert(nextAllowedDelivery("customer", mkNowAtMexicoHour(7, 59)) !== null, `7:59am — quiet`);
  }

  console.log(`\n${failed === 0 ? "✅" : "❌"} quiet-hours: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
};

main().catch((e) => { console.error("\n❌ FAILED:", e?.stack || e?.message || e); process.exit(1); });
