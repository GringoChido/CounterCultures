/**
 * Netlify scheduled function — fires a GET at /api/cron/odoo-sync.
 * Schedule declared in netlify.toml ([functions."odoo-sync"] schedule).
 *
 * Auth: pass-through sends `x-cron-probe-key` header sourced from the
 * CRON_PROBE_KEY env var. The route handler validates against the same
 * env var. The old `x-netlify-scheduled: 1` sentinel was removed because
 * any external caller could spoof it.
 */

export default async (): Promise<Response> => {
  const base = process.env.URL ?? process.env.DEPLOY_PRIME_URL ?? "";
  if (!base) {
    return new Response(
      JSON.stringify({ error: "No base URL in env (URL or DEPLOY_PRIME_URL)" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
  const probeKey = process.env.CRON_PROBE_KEY;
  if (!probeKey) {
    return new Response(
      JSON.stringify({ error: "CRON_PROBE_KEY env var not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
  const res = await fetch(`${base}/api/cron/odoo-sync`, {
    headers: { "x-cron-probe-key": probeKey },
  });
  return new Response(await res.text(), {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "application/json",
    },
  });
};
