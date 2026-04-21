/**
 * Alert rate limiter — in-memory Map-based, per-channel caps.
 *
 * Keyed on `${recipientKey}:${templateId}:${channel}`. Windowed: first call
 * starts the window, subsequent calls within the window increment the count
 * and check against the cap.
 *
 * Persistence across deploys is not required — a restart briefly doubles
 * the cap, which is acceptable at CC's scale (Roger gets 1 extra DM, not
 * a deliverability catastrophe). Same design choice as the W7 Stripe
 * event-id LRU.
 */

export type AlertChannel = "email" | "whatsapp" | "dashboard";

export interface RateCap {
  max: number;
  windowMs: number;
}

export const RATE_CAPS: Record<AlertChannel, RateCap> = {
  whatsapp: { max: 1, windowMs: 60 * 60 * 1000 },        // 1/hour/recipient/template
  email: { max: 5, windowMs: 24 * 60 * 60 * 1000 },      // 5/day/recipient/template
  dashboard: { max: 100, windowMs: 60 * 60 * 1000 },     // effectively unlimited
};

interface Bucket {
  windowStart: number;
  count: number;
}

const buckets = new Map<string, Bucket>();

const bucketKey = (recipientKey: string, templateId: string, channel: AlertChannel): string =>
  `${channel}::${recipientKey}::${templateId}`;

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSec: number };

/**
 * Check if another send is allowed right now. If yes, increments the bucket
 * and returns `{ allowed: true }`. If no, returns `{ allowed: false,
 * retryAfterSec }` without incrementing — the caller should log + skip.
 *
 * Called on the hot path of every dispatch, so O(1) map operations only.
 */
export const checkRateLimit = (
  recipientKey: string,
  templateId: string,
  channel: AlertChannel,
  now: number = Date.now()
): RateLimitResult => {
  const cap = RATE_CAPS[channel];
  if (!cap) return { allowed: true }; // unknown channel → allow (defensive)

  const key = bucketKey(recipientKey, templateId, channel);
  const existing = buckets.get(key);

  if (!existing || now - existing.windowStart >= cap.windowMs) {
    buckets.set(key, { windowStart: now, count: 1 });
    return { allowed: true };
  }

  if (existing.count < cap.max) {
    existing.count++;
    return { allowed: true };
  }

  const retryAfterMs = cap.windowMs - (now - existing.windowStart);
  return { allowed: false, retryAfterSec: Math.ceil(retryAfterMs / 1000) };
};

/**
 * Test-only: reset all in-memory buckets. Production callers never invoke
 * this; tests do between independent cases.
 */
export const __resetBucketsForTests = (): void => {
  buckets.clear();
};

/**
 * Diagnostic — current bucket size. Used by ops health checks only.
 */
export const __bucketCountForDiagnostics = (): number => buckets.size;
