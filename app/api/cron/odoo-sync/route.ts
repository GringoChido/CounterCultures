/**
 * GET /api/cron/odoo-sync — pulls deltas from Odoo into the Sheets mirror.
 *
 * Auth: matches the existing cron pattern — either Netlify's
 * `x-netlify-scheduled: 1` sentinel OR a manual probe with
 * `x-cron-probe-key: <CRON_PROBE_KEY>`.
 *
 * Query params:
 *   models   = comma-separated subset of `invoices,payments,sale_orders`
 *              (default: all three)
 *   limit    = max rows per model per run (default: 250, capped at 1000)
 *
 * Cursor: NOT stored externally. Each model's cursor is derived from
 * `max(write_date)` already in the corresponding mirror tab. First run pulls
 * everything; steady state pulls only deltas. Self-healing — if the mirror
 * was wiped, the next run rebuilds from Odoo.
 *
 * Time budget: Netlify functions have a 10s synchronous timeout (26s on
 * Pro). 250 rows × 3 models is comfortably under that for steady-state.
 *
 * Schedule: configure in `netlify.toml`:
 *   [[functions]]
 *   path = "/api/cron/odoo-sync"
 *   schedule = "0 * * * *"   # hourly at :00
 *   (or use Netlify's scheduled functions UI; same auth pattern.)
 */

import { NextResponse, type NextRequest } from "next/server";
import {
  syncInvoicesIncremental,
  syncPaymentsIncremental,
  syncSaleOrdersIncremental,
  type SyncSummary,
} from "@/app/lib/odoo/sync";

type ModelKey = "invoices" | "payments" | "sale_orders";

const ALL_MODELS: ModelKey[] = ["invoices", "payments", "sale_orders"];

const isAuthorized = (req: NextRequest): boolean => {
  const sentinel = req.headers.get("x-netlify-scheduled");
  const probeKey = req.headers.get("x-cron-probe-key");
  if (sentinel === "1") return true;
  if (probeKey && probeKey === process.env.CRON_PROBE_KEY) return true;
  return false;
};

const parseModels = (raw: string | null): ModelKey[] => {
  if (!raw) return ALL_MODELS;
  const wanted = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is ModelKey =>
      (ALL_MODELS as string[]).includes(s)
    );
  return wanted.length > 0 ? wanted : ALL_MODELS;
};

const clampLimit = (raw: string | null): number => {
  const n = raw ? Number(raw) : 250;
  if (!Number.isFinite(n) || n <= 0) return 250;
  return Math.min(1000, Math.floor(n));
};

const runForModel = async (
  model: ModelKey,
  limit: number
): Promise<SyncSummary | { model: string; error: string }> => {
  try {
    if (model === "invoices") return await syncInvoicesIncremental(limit);
    if (model === "payments") return await syncPaymentsIncremental(limit);
    return await syncSaleOrdersIncremental(limit);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown_error";
    console.error(`[cron/odoo-sync] ${model} failed:`, msg);
    return { model, error: msg };
  }
};

export const GET = async (req: NextRequest): Promise<Response> => {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const t0 = Date.now();
  const models = parseModels(req.nextUrl.searchParams.get("models"));
  const limit = clampLimit(req.nextUrl.searchParams.get("limit"));

  // Run sequentially so concurrent Sheet writes don't trample each other.
  const summaries: (SyncSummary | { model: string; error: string })[] = [];
  for (const m of models) {
    summaries.push(await runForModel(m, limit));
  }

  const totals = summaries.reduce(
    (acc, s) => {
      if ("error" in s) {
        acc.errors += 1;
        return acc;
      }
      acc.fetched += s.fetched;
      acc.inserted += s.inserted;
      acc.updated += s.updated;
      return acc;
    },
    { fetched: 0, inserted: 0, updated: 0, errors: 0 }
  );

  return NextResponse.json({
    ok: true,
    durationMs: Date.now() - t0,
    summaries,
    totals,
  });
};
