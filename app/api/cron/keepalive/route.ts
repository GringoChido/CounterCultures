/**
 * GET /api/cron/keepalive — pings internal endpoints on a short cadence
 * to keep server-side caches (`products-full.ts`) and the Lambda warm.
 * No user-visible side effects; observable only via response time.
 *
 * Targets:
 *   1. Search API — warms the products-full in-memory cache.
 *   2. PDP pages — warms the SSR render path and seeds ISR edge cache
 *      for 2 representative PDPs (both /en and /es). PDP slugs are
 *      resolved dynamically from the search response so they stay
 *      correct even when catalog data changes.
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

const TIMEOUT_MS = 5000;

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

interface SearchItem {
  slug?: string;
  category?: string;
  imageSrc?: string;
}

const resolvePdpPaths = async (baseUrl: string): Promise<string[]> => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(
      `${baseUrl}/api/products/search?q=&limit=10&sort=relevance`,
      { signal: ctrl.signal },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { items?: SearchItem[] };
    const items = data.items ?? [];
    return items
      .filter(
        (p): p is SearchItem & { slug: string; category: string } =>
          !!p.slug && !!p.category && !!p.imageSrc,
      )
      .slice(0, 2)
      .flatMap((p) => [
        `/en/shop/${p.category}/p/${p.slug}`,
        `/es/shop/${p.category}/p/${p.slug}`,
      ]);
  } catch {
    return [];
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

  // Step 1: warm the products-full in-memory cache via search API
  try {
    results.push(await probe(baseUrl, SEARCH_TARGET));
  } catch (err) {
    const msg = err instanceof Error ? err.message : "probe_threw";
    console.error("[cron/keepalive]", SEARCH_TARGET, msg);
    results.push({ path: SEARCH_TARGET, status: null, ms: 0, error: msg });
  }

  // Step 2: resolve 2 PDP slugs from the now-warm catalog, then probe
  // both /en and /es variants in parallel to warm the SSR path + ISR cache
  try {
    const pdpPaths = await resolvePdpPaths(baseUrl);
    if (pdpPaths.length > 0) {
      const pdpResults = await Promise.all(
        pdpPaths.map((path) =>
          probe(baseUrl, path).catch((err) => {
            const msg = err instanceof Error ? err.message : "probe_threw";
            console.error("[cron/keepalive]", path, msg);
            return { path, status: null, ms: 0, error: msg } as ProbeResult;
          }),
        ),
      );
      results.push(...pdpResults);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "pdp_resolve_failed";
    console.error("[cron/keepalive] PDP target resolution failed:", msg);
  }

  return NextResponse.json({ ok: true, results });
};
