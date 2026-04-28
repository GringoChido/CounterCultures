/**
 * Netlify scheduled function — fires a GET at /api/cron/fx-sync.
 * Schedule declared in netlify.toml ([functions."fx-sync"]).
 *
 * Mirrors the stale-deal-sweep + odoo-sync pattern: all logic lives in the
 * Next.js route. This thin pass-through just injects the sentinel header.
 */

export default async (): Promise<Response> => {
  const base = process.env.URL ?? process.env.DEPLOY_PRIME_URL ?? "";
  if (!base) {
    return new Response(
      JSON.stringify({ error: "No base URL in env (URL or DEPLOY_PRIME_URL)" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
  const res = await fetch(`${base}/api/cron/fx-sync`, {
    headers: { "x-netlify-scheduled": "1" },
  });
  return new Response(await res.text(), {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "application/json",
    },
  });
};
