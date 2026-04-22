/**
 * Sentry client config. Loaded by Next.js on the browser side.
 *
 * No-op until NEXT_PUBLIC_SENTRY_DSN is set in .env.local. This keeps
 * the dev workflow clean (no traffic, no warnings) and lets us flip
 * monitoring on in production by only setting the env var.
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.5,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || "development",
  });
}
