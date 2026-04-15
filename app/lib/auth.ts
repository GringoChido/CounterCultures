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

export const createSession = async (): Promise<void> => {
  const payload = `authenticated:${Date.now()}`;
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

  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return false;

  const payload = token.slice(0, lastDot);
  const signature = token.slice(lastDot + 1);

  if (!verify(payload, signature)) return false;

  // Check expiry
  const timestampStr = payload.split(":")[1];
  const timestamp = Number(timestampStr);
  if (Number.isNaN(timestamp)) return false;

  const age = (Date.now() - timestamp) / 1000;
  return age < SESSION_MAX_AGE;
};

/**
 * Lightweight check for middleware (no async cookies() call).
 * Reads the cookie value directly from the request.
 */
export const validateSessionFromCookie = (cookieValue: string | undefined): boolean => {
  if (!cookieValue) return false;

  const lastDot = cookieValue.lastIndexOf(".");
  if (lastDot === -1) return false;

  const payload = cookieValue.slice(0, lastDot);
  const signature = cookieValue.slice(lastDot + 1);

  if (!verify(payload, signature)) return false;

  const timestampStr = payload.split(":")[1];
  const timestamp = Number(timestampStr);
  if (Number.isNaN(timestamp)) return false;

  const age = (Date.now() - timestamp) / 1000;
  return age < SESSION_MAX_AGE;
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
