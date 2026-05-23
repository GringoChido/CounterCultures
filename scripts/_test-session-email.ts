/**
 * Unit test for per-user actor on audit logs.
 *
 *   - createSession embeds the email into the cookie payload (V2 format)
 *   - getCurrentUserEmailFromRequest round-trips the email
 *   - Legacy V1 tokens (without email segment) fall back to PORTAL_EMAIL
 *   - Tampered signatures are rejected
 *
 * No I/O against Sheets. Just HMAC + base64 round-trip.
 *
 * Run: npx tsx scripts/_test-session-email.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { createHmac } from "crypto";

let passed = 0, failed = 0;
const assert = (cond: unknown, msg: string) => {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.error(`  ❌ ${msg}`); }
};

const makeReq = (token: string) => ({
  headers: {
    get: (name: string) =>
      name.toLowerCase() === "cookie"
        ? `cc-portal-session=${encodeURIComponent(token)}; other=foo`
        : null,
  },
});

const sign = (payload: string): string => {
  const secret = process.env.SESSION_SECRET!;
  const hmac = createHmac("sha256", secret);
  hmac.update(payload);
  return hmac.digest("hex");
};

const main = async () => {
  if (!process.env.SESSION_SECRET) {
    console.error("❌ SESSION_SECRET not set in .env.local");
    process.exit(1);
  }

  const { getCurrentUserEmailFromRequest } = await import("../app/lib/auth");

  // -------- V2 token: payload carries email --------
  const email = "admin@countercultures.com.mx";
  const b64 = Buffer.from(email, "utf8").toString("base64url");
  const v2payload = `authenticated:${Date.now()}:${b64}`;
  const v2token = `${v2payload}.${sign(v2payload)}`;
  const v2email = getCurrentUserEmailFromRequest(makeReq(v2token));
  assert(v2email === email, `V2 token → email=${v2email}`);

  // -------- V1 legacy token: payload has no email --------
  const v1payload = `authenticated:${Date.now()}`;
  const v1token = `${v1payload}.${sign(v1payload)}`;
  const v1email = getCurrentUserEmailFromRequest(makeReq(v1token));
  assert(
    v1email === (process.env.PORTAL_EMAIL ?? null),
    `V1 legacy token falls back to PORTAL_EMAIL (got ${v1email})`
  );

  // -------- tampered signature --------
  const tampered = `${v2payload}.000000deadbeef`;
  const tEmail = getCurrentUserEmailFromRequest(makeReq(tampered));
  assert(tEmail === null, `tampered signature → null`);

  // -------- no cookie --------
  const noCookie = getCurrentUserEmailFromRequest({
    headers: { get: () => null },
  });
  assert(noCookie === null, `no cookie → null`);

  // -------- expired (>24h) --------
  const expiredTs = Date.now() - 25 * 3600 * 1000;
  const expPayload = `authenticated:${expiredTs}:${b64}`;
  const expToken = `${expPayload}.${sign(expPayload)}`;
  const expEmail = getCurrentUserEmailFromRequest(makeReq(expToken));
  assert(expEmail === null, `expired token → null`);

  console.log(`\n${failed === 0 ? "✅" : "❌"} session email: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
};

main().catch((e) => { console.error("\n❌ FAILED:", e?.stack || e?.message || e); process.exit(1); });
