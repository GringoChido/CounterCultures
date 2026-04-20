/**
 * Smoke test: /api/dashboard/traficos/[id]/rich is registered and
 * auth-gated. Same pattern as W5's _test-reference-apis.ts — assert 401
 * (route registered + middleware-gated) rather than the 200 happy path
 * (which would need a valid session cookie; verified via browser preview).
 *
 * Requires the Next dev server to be running.
 *
 * Run: PORTAL_BASE_URL=http://localhost:55556 npx tsx scripts/_test-rich-route.ts
 */

const BASE = process.env.PORTAL_BASE_URL || "http://localhost:3000";

const main = async () => {
  const url = `${BASE}/api/dashboard/traficos/FOO/rich`;
  const r = await fetch(url);
  const data = await r.json();

  const ok = r.status === 401 && data.error === "Unauthorized";
  if (ok) {
    console.log(`✓ /traficos/[id]/rich — registered + auth-gated (${r.status})`);
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
