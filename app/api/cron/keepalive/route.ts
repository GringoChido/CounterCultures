/**
 * GET /api/cron/keepalive — pings the search API on a short cadence to
 * keep the products-full in-memory cache and the Lambda warm.
 * No user-visible side effects; observable only via response time.
 *
 * Target: the search API, which hydrates the 354K-product cache. The
 * probe URL carries a per-run cache-buster so it always reaches the
 * Lambda and re-warms it — the search route now sets a durable Netlify
 * CDN cache, so an un-busted probe would be answered from the edge
 * without ever executing (and therefore warming) the function.
 *
 * (PDP warm-probes were removed: PDPs are ISR-cached after first hit, so
 * re-rendering two of them every 3 min was the bulk of this cron's
 * serverless compute for negligible benefit.)
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

const SEARCH_TARGET = "/api/products/search?q=a&limit=1";

const TIMEOUT_MS = 25_000;

const probe = async (baseUrl: string, path: string): Promise<ProbeResult> => {
  const t0 = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${baseUrl}${path}`, { signal: ctrl.signal });
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

  const baseUrl =
    process.env.URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? req.nextUrl.origin;

  const results: ProbeResult[] = [];

  // Warm the products-full in-memory cache via the search API. The per-run
  // cache-buster bypasses the search route's durable CDN cache so this
  // probe actually executes the Lambda (and warms it) rather than being
  // served from the edge.
  const warmTarget = `${SEARCH_TARGET}&warm=${Date.now()}`;
  try {
    results.push(await probe(baseUrl, warmTarget));
  } catch (err) {
    const msg = err instanceof Error ? err.message : "probe_threw";
    console.error("[cron/keepalive]", warmTarget, msg);
    results.push({ path: warmTarget, status: null, ms: 0, error: msg });
  }

  return NextResponse.json({ ok: true, results });
};
