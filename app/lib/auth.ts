import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const SESSION_COOKIE = "cc-portal-session";
const SESSION_MAX_AGE = 60 * 60 * 24; // 24 hours

const getSecret = () => {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET env var is required");
  return secret;
};

const sign = (payload: string): string => {
  const hmac = createHmac("sha256", getSecret());
  hmac.update(payload);
  return hmac.digest("hex");
};

const verify = (payload: string, signature: string): boolean => {
  const expected = sign(payload);
  if (expected.length !== signature.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
};

// ---------------------------------------------------------------------------
// Session payload parsing
// ---------------------------------------------------------------------------
//
// Session token format:
//   V1 (legacy):  "authenticated:<timestamp>.<hmac>"
//   V2 (W7):      "authenticated:<timestamp>:<base64url(email)>.<hmac>"
//
// V2 adds an email segment so audit logs can attribute actions to a specific
// user. V1 tokens remain valid until they expire — `parseSession` returns
// a session whose email is `null`; callers use PORTAL_EMAIL env as fallback.

interface SessionPayload {
  valid: boolean;
  email: string | null; // null for V1 legacy tokens
  timestamp: number;
}

const toBase64Url = (s: string): string =>
  Buffer.from(s, "utf8").toString("base64url");

const fromBase64Url = (s: string): string | null => {
  try {
    return Buffer.from(s, "base64url").toString("utf8");
  } catch {
    return null;
  }
};

const parseToken = (token: string): SessionPayload | null => {
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return null;

  const payload = token.slice(0, lastDot);
  const signature = token.slice(lastDot + 1);

  if (!verify(payload, signature)) return null;

  const parts = payload.split(":");
  if (parts[0] !== "authenticated") return null;

  const timestamp = Number(parts[1]);
  if (Number.isNaN(timestamp)) return null;

  const age = (Date.now() - timestamp) / 1000;
  if (age >= SESSION_MAX_AGE) return null;

  // V2 if a 3rd segment exists; otherwise V1 legacy
  const email = parts.length >= 3 ? fromBase64Url(parts[2]) : null;

  return { valid: true, email, timestamp };
};

// ---------------------------------------------------------------------------
// Public surface
// ---------------------------------------------------------------------------

export const createSession = async (email: string): Promise<void> => {
  const emailSegment = toBase64Url(email);
  const payload = `authenticated:${Date.now()}:${emailSegment}`;
  const signature = sign(payload);
  const token = `${payload}.${signature}`;

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
};

export const destroySession = async (): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
};

export const validateSession = async (): Promise<boolean> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  const parsed = parseToken(token);
  return parsed?.valid === true;
};

/**
 * Returns the current user's email from the session cookie. Falls back to
 * PORTAL_EMAIL env var when the session is V1 legacy (no email segment).
 * Returns null when there is no valid session at all.
 */
export const getCurrentUserEmail = async (): Promise<string | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const parsed = parseToken(token);
  if (!parsed?.valid) return null;
  return parsed.email ?? process.env.PORTAL_EMAIL ?? null;
};

/**
 * Request-based variant for API routes that receive NextRequest/Request.
 * Parses the cookie from the request headers rather than calling
 * `cookies()` (which is scoped to route handlers).
 */
export const getCurrentUserEmailFromRequest = (
  req: { headers: { get(name: string): string | null } }
): string | null => {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookieValue = cookieHeader
    .split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);
  if (!cookieValue) return null;

  const parsed = parseToken(decodeURIComponent(cookieValue));
  if (!parsed?.valid) return null;
  return parsed.email ?? process.env.PORTAL_EMAIL ?? null;
};

/**
 * Lightweight check for middleware (no async cookies() call).
 * Reads the cookie value directly from the request.
 */
export const validateSessionFromCookie = (
  cookieValue: string | undefined
): boolean => {
  if (!cookieValue) return false;
  const parsed = parseToken(cookieValue);
  return parsed?.valid === true;
};

export const verifyCredentials = (email: string, password: string): boolean => {
  const expectedEmail = process.env.PORTAL_EMAIL;
  const expectedPassword = process.env.PORTAL_PASSWORD;

  if (!expectedEmail || !expectedPassword) return false;

  const emailMatch =
    email.length === expectedEmail.length &&
    timingSafeEqual(Buffer.from(email), Buffer.from(expectedEmail));

  const passwordMatch =
    password.length === expectedPassword.length &&
    timingSafeEqual(Buffer.from(password), Buffer.from(expectedPassword));

  return emailMatch && passwordMatch;
};
