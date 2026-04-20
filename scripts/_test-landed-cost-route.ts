/**
 * Smoke test: /api/dashboard/landed-cost is registered and auth-gated.
 * Same pattern as W5's _test-reference-apis.ts — assert 401 (route
 * registered + middleware-gated) rather than 200 happy path (verified
 * via browser preview).
 *
 * Run: PORTAL_BASE_URL=http://localhost:55556 npx tsx scripts/_test-landed-cost-route.ts
 */

const BASE = process.env.PORTAL_BASE_URL || "http://localhost:3000";

const main = async () => {
  const r = await fetch(`${BASE}/api/dashboard/landed-cost`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      brandId: "dornbracht",
      shopifyProductId: "x",
      fobPriceUsd: 100,
      quantity: 1,
      destinationType: "warehouse_sma",
      quoteDate: "2026-04-19",
    }),
  });
  const data = await r.json();
  const ok = r.status === 401 && data.error === "Unauthorized";
  if (ok) {
    console.log(`✓ /landed-cost — registered + auth-gated (${r.status})`);
    console.log("\n✅ Route registered. (200 happy path verified via browser preview.)");
    process.exit(0);
  } else {
    console.log(`✗ expected 401 Unauthorized, got ${r.status} ${JSON.stringify(data).slice(0, 200)}`);
    process.exit(1);
  }
};

main().catch((e) => {
  console.error("\n❌ FAILED:", e?.message || e);
  process.exit(1);
});
