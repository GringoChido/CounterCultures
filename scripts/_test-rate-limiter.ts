/**
 * Unit test for alert-rate-limiter (pure, in-memory, no I/O).
 *
 * Run: npx tsx scripts/_test-rate-limiter.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

let passed = 0, failed = 0;
const assert = (cond: unknown, msg: string) => {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.error(`  ❌ ${msg}`); }
};

const main = async () => {
  const { checkRateLimit, __resetBucketsForTests, RATE_CAPS } = await import("../app/lib/alert-rate-limiter");

  // ----- WhatsApp: 1/hour/template/recipient -----
  console.log("\n→ WhatsApp cap: 1/hour/recipient/template");
  {
    __resetBucketsForTests();
    const r1 = checkRateLimit("customer:test@countercultures.com.mx", "C-03-deposit-received", "whatsapp");
    assert(r1.allowed === true, `1st — allowed`);
    const r2 = checkRateLimit("customer:test@countercultures.com.mx", "C-03-deposit-received", "whatsapp");
    assert(r2.allowed === false, `2nd within hour — blocked`);
    if (!r2.allowed) {
      assert(r2.retryAfterSec > 0 && r2.retryAfterSec <= 3600, `retryAfterSec in (0, 3600] — got ${r2.retryAfterSec}`);
    }
  }

  // ----- Different recipient — independent bucket -----
  console.log("\n→ Independent buckets per recipient");
  {
    __resetBucketsForTests();
    checkRateLimit("customer:a@a.com", "C-03", "whatsapp");
    const r = checkRateLimit("customer:b@b.com", "C-03", "whatsapp");
    assert(r.allowed === true, `different recipient same template — allowed`);
  }

  // ----- Different template — independent bucket -----
  console.log("\n→ Independent buckets per template");
  {
    __resetBucketsForTests();
    checkRateLimit("customer:a@a.com", "C-03", "whatsapp");
    const r = checkRateLimit("customer:a@a.com", "C-04", "whatsapp");
    assert(r.allowed === true, `same recipient different template — allowed`);
  }

  // ----- Email: 5/day/recipient/template -----
  console.log("\n→ Email cap: 5/day/recipient/template");
  {
    __resetBucketsForTests();
    for (let i = 1; i <= 5; i++) {
      const r = checkRateLimit("customer:a@a.com", "C-03", "email");
      assert(r.allowed === true, `email ${i}/5 — allowed`);
    }
    const r6 = checkRateLimit("customer:a@a.com", "C-03", "email");
    assert(r6.allowed === false, `6th email — blocked`);
  }

  // ----- Dashboard: effectively unlimited -----
  console.log("\n→ Dashboard cap: effectively unlimited (100/hour)");
  {
    __resetBucketsForTests();
    for (let i = 1; i <= 50; i++) {
      const r = checkRateLimit("roger", "R-03", "dashboard");
      assert(r.allowed === true, `dashboard ${i}/50 — allowed`, );
      // NOTE: assertion count will be 50; we only log every 10th to keep output clean
      if (i % 10 !== 0) passed--, passed++; // no-op; keep assert() contract simple
    }
  }

  // ----- RATE_CAPS shape sanity -----
  console.log("\n→ RATE_CAPS shape");
  {
    assert(RATE_CAPS.whatsapp.max === 1, `whatsapp.max = 1`);
    assert(RATE_CAPS.whatsapp.windowMs === 3600_000, `whatsapp window = 1h`);
    assert(RATE_CAPS.email.max === 5, `email.max = 5`);
    assert(RATE_CAPS.email.windowMs === 24 * 3600_000, `email window = 24h`);
  }

  console.log(`\n${failed === 0 ? "✅" : "❌"} rate-limiter: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
};

main().catch((e) => { console.error("\n❌ FAILED:", e?.stack || e?.message || e); process.exit(1); });
