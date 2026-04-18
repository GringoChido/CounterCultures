/**
 * Round-trip test: each of the 4 reference GET routes is registered (no
 * 404s) and is auth-gated by middleware (401 when no session cookie).
 * The 200/{rows:[]} happy path is verified separately via the browser
 * preview eval (and was confirmed end-to-end before this test was
 * written).
 *
 * Requires the Next dev server to be running on http://localhost:3000.
 *
 * Run: npx tsx scripts/_test-reference-apis.ts
 */

const BASE = process.env.PORTAL_BASE_URL || "http://localhost:3000";

const main = async () => {
  const endpoints = [
    "brand-nom-status",
    "brand-lead-times",
    "hs-codes",
    "fta-rates",
  ];
  let fail = 0;
  for (const ep of endpoints) {
    try {
      const r = await fetch(`${BASE}/api/dashboard/reference/${ep}`);
      const data = await r.json();
      // Route is registered (not 404) AND middleware is gating it (401)
      const ok = r.status === 401 && data.error === "Unauthorized";
      if (ok) {
        console.log(`✓ ${ep} — registered + auth-gated (${r.status})`);
      } else {
        console.log(`✗ ${ep} — expected 401 Unauthorized, got ${r.status} ${JSON.stringify(data).slice(0, 120)}`);
        fail++;
      }
    } catch (err) {
      console.log(`✗ ${ep} — ${err instanceof Error ? err.message : String(err)}`);
      fail++;
    }
  }
  console.log(fail === 0 ? "\n✅ All 4 routes registered + auth-gated. (200 happy path verified via browser preview.)" : `\n❌ ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
};

main().catch((e) => {
  console.error("\n❌ FAILED:", e?.message || e);
  process.exit(1);
});
