/**
 * Netlify scheduled function — fires a GET at /api/cron/odoo-sync.
 * Schedule declared in netlify.toml ([functions."odoo-sync"] schedule).
 *
 * Mirrors the stale-deal-sweep pattern: all sync logic lives in the Next.js
 * route (testable standalone via fetch). This pass-through just injects the
 * `x-netlify-scheduled` sentinel header.
 */

export default async (): Promise<Response> => {
  const base = process.env.URL ?? process.env.DEPLOY_PRIME_URL ?? "";
  if (!base) {
    return new Response(
      JSON.stringify({ error: "No base URL in env (URL or DEPLOY_PRIME_URL)" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
  const res = await fetch(`${base}/api/cron/odoo-sync`, {
    headers: { "x-netlify-scheduled": "1" },
  });
  return new Response(await res.text(), {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "application/json",
    },
  });
};
