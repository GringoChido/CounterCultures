/**
 * Next.js instrumentation hook — loads the right Sentry config per
 * runtime. Register is called once at server startup.
 *
 * Sentry is a no-op unless the relevant DSN env var is set, so this
 * file has no runtime cost in development.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export async function onRequestError(
  ...args: Parameters<
    typeof import("@sentry/nextjs").captureRequestError
  >
) {
  const { captureRequestError } = await import("@sentry/nextjs");
  return captureRequestError(...args);
}
