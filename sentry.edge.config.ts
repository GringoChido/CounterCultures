/**
 * Sentry edge runtime config. Loaded for middleware + edge routes.
 * No-op until SENTRY_DSN is set.
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV || "development",
  });
}
