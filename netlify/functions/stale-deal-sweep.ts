/**
 * Netlify scheduled function — fires a GET at the Next.js API route
 * /api/cron/stale-deal-sweep. Schedule is declared in netlify.toml
 * ([functions."stale-deal-sweep"] schedule = "0 14 * * *").
 *
 * Kept thin on purpose: all logic lives in the Next.js route so it's
 * testable standalone via fetch. This pass-through just injects the
 * `x-netlify-scheduled` sentinel header that the route gates on.
 */

export default async (): Promise<Response> => {
  const base = process.env.URL ?? process.env.DEPLOY_PRIME_URL ?? "";
  if (!base) {
    return new Response(
      JSON.stringify({ error: "No base URL in env (URL or DEPLOY_PRIME_URL)" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
  const res = await fetch(`${base}/api/cron/stale-deal-sweep`, {
    headers: { "x-netlify-scheduled": "1" },
  });
  return new Response(await res.text(), {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "application/json",
    },
  });
};
