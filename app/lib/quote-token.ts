/**
 * Signed, time-limited tokens for public quote share links.
 *
 * Payload: {dealId, exp} as urlsafe-base64-encoded JSON, plus an HMAC-SHA256
 * signature over that payload using SESSION_SECRET. Customer clicks
 *   /quote/{dealId}?t=<payloadB64>.<signatureB64>
 * and we verify both the dealId match and the signature before rendering.
 *
 * No DB/sheet required — everything's in the token. Revoke by rotating the
 * secret or shortening exp on server-side config (rarely needed in practice).
 */
import crypto from "node:crypto";

const SECRET = process.env.SESSION_SECRET ?? "";

interface TokenPayload {
  dealId: string;
  exp: number; // ms-since-epoch
}

const b64url = (buf: Buffer | string): string =>
  Buffer.from(buf).toString("base64url");

const fromB64url = (s: string): Buffer => Buffer.from(s, "base64url");

const sign = (payload: string): string =>
  b64url(crypto.createHmac("sha256", SECRET).update(payload).digest());

/**
 * Mint a signed token for this deal, valid for `ttlDays` (default 60).
 * Returns the full `payload.signature` string safe for URL query params.
 */
export const signQuoteToken = (
  dealId: string,
  ttlDays = 60
): string => {
  if (!SECRET) throw new Error("SESSION_SECRET not configured");
  const payload: TokenPayload = {
    dealId,
    exp: Date.now() + ttlDays * 24 * 60 * 60 * 1000,
  };
  const payloadStr = b64url(JSON.stringify(payload));
  const sig = sign(payloadStr);
  return `${payloadStr}.${sig}`;
};

export interface TokenVerification {
  valid: boolean;
  reason?: "missing" | "malformed" | "signature" | "mismatch" | "expired";
  dealId?: string;
  expiresAt?: Date;
}

/**
 * Verify a token. Returns {valid: true, dealId} on success.
 * Constant-time signature comparison to prevent timing leaks.
 */
export const verifyQuoteToken = (
  token: string | null | undefined,
  expectedDealId: string
): TokenVerification => {
  if (!SECRET) return { valid: false, reason: "missing" };
  if (!token) return { valid: false, reason: "missing" };
  const [payloadStr, sig] = token.split(".");
  if (!payloadStr || !sig) return { valid: false, reason: "malformed" };
  const expectedSig = sign(payloadStr);
  const sigBuf = fromB64url(sig);
  const expBuf = fromB64url(expectedSig);
  if (
    sigBuf.length !== expBuf.length ||
    !crypto.timingSafeEqual(sigBuf, expBuf)
  ) {
    return { valid: false, reason: "signature" };
  }
  let parsed: TokenPayload;
  try {
    parsed = JSON.parse(fromB64url(payloadStr).toString("utf8")) as TokenPayload;
  } catch {
    return { valid: false, reason: "malformed" };
  }
  if (parsed.dealId !== expectedDealId) return { valid: false, reason: "mismatch" };
  if (Date.now() > parsed.exp) {
    return { valid: false, reason: "expired", expiresAt: new Date(parsed.exp) };
  }
  return { valid: true, dealId: parsed.dealId, expiresAt: new Date(parsed.exp) };
};

/** Build the customer-facing share URL for a deal. Defaults to English locale. */
export const buildQuoteShareUrl = (
  dealId: string,
  baseUrl: string,
  locale: "en" | "es" = "en"
): string => {
  const token = signQuoteToken(dealId);
  return `${baseUrl.replace(/\/$/, "")}/${locale}/quote/${encodeURIComponent(dealId)}?t=${encodeURIComponent(token)}`;
};
