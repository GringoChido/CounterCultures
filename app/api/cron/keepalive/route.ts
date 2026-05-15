/**
 * GET /api/cron/keepalive — pings a tiny internal endpoint on a short
 * cadence to keep server-side caches (`products-full.ts`) and the Lambda
 * warm. No user-visible side effects; observable only via response time.
 *
 * Auth: requires `x-cron-probe-key` header matching the CRON_PROBE_KEY
 * env var. Netlify scheduled functions send this header via the
 * pass-through in `netlify/functions/keepalive.ts`. Pattern matches the
 * other three scheduled functions (fx-sync, odoo-sync, stale-deal-sweep)
 * exactly — same fail-closed env-var check, same 403 response, same
 * NextRequest shape.
 *
 * Schedule: every 3 minutes (see netlify.toml). At ~14,400 invocations
 * per month this is comfortably within Pro-tier scheduled-function
 * limits and keeps the products-full LRU + Lambda warm enough that
 * the first user hit of the day doesn't pay a multi-second cold start.
 *
 * Targets are best-effort — a target failure is logged and recorded in
 * the response but never crashes the cron. Each probe has a 5s timeout
 * so a hung backend can't blow past Netlify's 10s sync budget.
 */

import { NextResponse, type NextRequest } from "next/server";

const isAuthorized = (req: NextRequest): boolean => {
  const expected = process.env.CRON_PROBE_KEY;
  if (!expected) return false; // refuse when not configured — fail-closed
  const probeKey = req.headers.get("x-cron-probe-key");
  return !!probeKey && probeKey === expected;
};

interface ProbeResult {
  path: string;
  status: number | null;
  ms: number;
  error?: string;
}

// Tiny search query — warms products-full.ts' in-memory cache without
// returning a meaningful payload. `q=a&limit=1` is the cheapest hit
// that still exercises the search path end-to-end.
const TARGETS: readonly string[] = ["/api/products/search?q=a&limit=1"];

const TIMEOUT_MS = 5000;

const probe = async (baseUrl: string, path: string): Promise<ProbeResult> => {
  const t0 = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${baseUrl}${path}`, { signal: ctrl.signal });
    // Drain the body so the connection can be released; we don't care
    // about the payload, only that the route handler ran to completion.
    await res.text().catch(() => "");
    return { path, status: res.status, ms: Date.now() - t0 };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "probe_failed";
    return { path, status: null, ms: Date.now() - t0, error: msg };
  } finally {
    clearTimeout(timer);
  }
};

export const GET = async (req: NextRequest): Promise<Response> => {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // On Netlify `URL` is the canonical site URL; NEXT_PUBLIC_SITE_URL is
  // a stable fallback we already set in prod env. `req.nextUrl.origin`
  // covers local `next dev` so the route is also exercisable in tests.
  const baseUrl =
    process.env.URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? req.nextUrl.origin;

  const results: ProbeResult[] = [];
  for (const path of TARGETS) {
    try {
      results.push(await probe(baseUrl, path));
    } catch (err) {
      // Defensive: probe() already swallows errors, but keep keepalive
      // crash-proof so a transient target failure never trips the cron
      // run as a whole.
      const msg = err instanceof Error ? err.message : "probe_threw";
      console.error("[cron/keepalive]", path, msg);
      results.push({ path, status: null, ms: 0, error: msg });
    }
  }

  return NextResponse.json({ ok: true, results });
};
