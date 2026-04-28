/**
 * Currency awareness layer.
 *
 * One job: surface today's USD↔MXN rate to every component that displays
 * mixed-currency totals. Not a calculator. Not a converter page. Ambient.
 *
 * Architecture:
 *   1. Cron at /api/cron/fx-sync pulls daily rate from Frankfurter (free,
 *      no token, sources from ECB). Writes to FX_Rates sheet tab.
 *   2. getCurrentFXRate() reads the most recent row from the sheet, with
 *      a 5-min in-memory cache so every page hit doesn't read Sheets.
 *   3. Components consume via <MoneyEquiv> for the equivalent display.
 *
 * Schema (FX_Rates sheet tab — caller must seed the header row once):
 *   date | base | quote | rate | source | fetched_at
 *
 * Source default is Frankfurter (frankfurter.app) — public, no auth, ECB-
 * sourced. Roger or finance can swap to Banxico (more authoritative for
 * Mexican accounting) once a Banxico SIE token is set in env. The schema
 * accommodates either source.
 */

import { readSheet, appendRow } from "./dashboard-sheets";

const FRANKFURTER_URL = "https://api.frankfurter.app/latest?from=USD&to=MXN";

interface FXRateRow extends Record<string, string> {
  date: string;
  base: string;
  quote: string;
  rate: string;
  source: string;
  fetched_at: string;
}

export interface FXRate {
  /** ISO date (YYYY-MM-DD) the rate is for. */
  date: string;
  /** "USD" by default. */
  base: string;
  /** "MXN" by default. */
  quote: string;
  /** Decimal rate — e.g. 19.45 means 1 USD = 19.45 MXN. */
  rate: number;
  source: string;
  fetchedAt: string;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
let cache: { at: number; rate: FXRate | null } | null = null;

/**
 * Returns the most recently stored USD→MXN rate, or null if the FX_Rates
 * tab is empty/missing. Callers must handle the null case (display the
 * raw amount without an equivalent).
 */
export const getCurrentFXRate = async (): Promise<FXRate | null> => {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL_MS) return cache.rate;

  let rows: FXRateRow[] = [];
  try {
    rows = await readSheet<FXRateRow>("FX_Rates");
  } catch (err) {
    console.warn(
      "[fx] FX_Rates tab read failed; treating as no rate available:",
      err instanceof Error ? err.message : err
    );
    cache = { at: now, rate: null };
    return null;
  }

  if (rows.length === 0) {
    cache = { at: now, rate: null };
    return null;
  }

  // Most recent row by date desc, then fetched_at desc.
  const sorted = [...rows].sort((a, b) => {
    const d = (b.date ?? "").localeCompare(a.date ?? "");
    if (d !== 0) return d;
    return (b.fetched_at ?? "").localeCompare(a.fetched_at ?? "");
  });
  const top = sorted[0];
  const rateNum = Number(top.rate);
  if (!Number.isFinite(rateNum) || rateNum <= 0) {
    cache = { at: now, rate: null };
    return null;
  }

  const rate: FXRate = {
    date: top.date,
    base: top.base || "USD",
    quote: top.quote || "MXN",
    rate: rateNum,
    source: top.source || "unknown",
    fetchedAt: top.fetched_at,
  };
  cache = { at: now, rate };
  return rate;
};

/**
 * Convert an amount in the source currency to the target. Returns null
 * when no FX rate is available or the source/target pair isn't supported
 * (only USD↔MXN today).
 */
export const convert = (
  amount: number,
  from: string,
  to: string,
  fx: FXRate
): number | null => {
  if (!Number.isFinite(amount)) return null;
  const F = from.toUpperCase();
  const T = to.toUpperCase();
  if (F === T) return amount;
  // We only store USD→MXN; derive both directions from it.
  if (F === fx.base && T === fx.quote) return amount * fx.rate;
  if (F === fx.quote && T === fx.base) return amount / fx.rate;
  return null;
};

/** Sums a `{currency: amount}` map into a single equivalent in `target`. */
export const consolidateToCurrency = (
  byCurrency: Record<string, number>,
  target: string,
  fx: FXRate
): { total: number; mixed: boolean; missing: string[] } => {
  let total = 0;
  let mixed = false;
  const missing: string[] = [];
  for (const [cur, amt] of Object.entries(byCurrency)) {
    if (!Number.isFinite(amt) || amt === 0) continue;
    if (cur.toUpperCase() !== target.toUpperCase()) mixed = true;
    const converted = convert(amt, cur, target, fx);
    if (converted === null) missing.push(cur);
    else total += converted;
  }
  return { total, mixed, missing };
};

// ── Writer (cron only) ────────────────────────────────────────────

interface FetchedRate {
  date: string;
  base: string;
  quote: string;
  rate: number;
  source: string;
}

/**
 * Pulls today's rate from the configured source. Throws on network/parse
 * error; caller (cron route) handles + logs.
 */
export const fetchTodaysRate = async (): Promise<FetchedRate> => {
  const res = await fetch(FRANKFURTER_URL, {
    headers: { Accept: "application/json" },
    // Don't cache cron fetches — the whole point is to get today's value.
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Frankfurter ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as {
    base: string;
    date: string;
    rates: Record<string, number>;
  };
  const rate = data.rates?.MXN;
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error("Frankfurter response missing MXN rate");
  }
  return {
    date: data.date,
    base: data.base || "USD",
    quote: "MXN",
    rate,
    source: "frankfurter",
  };
};

/**
 * Stores today's rate as a new row in FX_Rates. Append-only — the read
 * path picks the most recent row, so re-running on the same day just adds
 * a redundant row (cheap, traceable, no upsert race).
 */
export const recordRate = async (rate: FetchedRate): Promise<void> => {
  await appendRow("FX_Rates", [
    rate.date,
    rate.base,
    rate.quote,
    String(rate.rate),
    rate.source,
    new Date().toISOString(),
  ]);
  // Bust the read cache so the next page hit picks up the fresh value.
  cache = null;
};
