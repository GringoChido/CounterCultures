"use client";

import { useEffect, useState } from "react";

interface FXRate {
  date: string;
  base: string;
  quote: string;
  rate: number;
  source: string;
  fetchedAt: string;
}

interface MoneyEquivProps {
  /** Either a single amount in `currency`, OR a `{currency: amount}` map
   *  to consolidate (e.g. for AR aging that mixes USD + MXN). */
  amount?: number;
  currency?: string;
  byCurrency?: Record<string, number>;
  /** Display the equivalent in this currency. Defaults to MXN since CC's
   *  finance person works in pesos for cash-flow planning. */
  target?: "USD" | "MXN";
  className?: string;
}

let cachedFX: { at: number; rate: FXRate | null } | null = null;
const FX_CACHE_MS = 5 * 60 * 1000;

const fetchFX = async (): Promise<FXRate | null> => {
  const now = Date.now();
  if (cachedFX && now - cachedFX.at < FX_CACHE_MS) return cachedFX.rate;
  try {
    const r = await fetch("/api/dashboard/fx", { credentials: "include" });
    if (!r.ok) {
      cachedFX = { at: now, rate: null };
      return null;
    }
    const data = (await r.json()) as { rate: FXRate | null };
    cachedFX = { at: now, rate: data.rate ?? null };
    return data.rate ?? null;
  } catch {
    cachedFX = { at: now, rate: null };
    return null;
  }
};

const convertOne = (
  amount: number,
  from: string,
  to: string,
  fx: FXRate
): number | null => {
  if (!Number.isFinite(amount)) return null;
  const F = from.toUpperCase();
  const T = to.toUpperCase();
  if (F === T) return amount;
  if (F === fx.base && T === fx.quote) return amount * fx.rate;
  if (F === fx.quote && T === fx.base) return amount / fx.rate;
  return null;
};

const fmt = (n: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);

/**
 * Renders a small grayed-out "≈ $X target" subtitle. Self-hides when no FX
 * rate is available (FX_Rates sheet empty, cron hasn't run yet, etc.) so
 * the component is safe to drop next to any money display unconditionally.
 */
const MoneyEquiv = ({
  amount,
  currency = "MXN",
  byCurrency,
  target = "MXN",
  className,
}: MoneyEquivProps) => {
  const [fx, setFx] = useState<FXRate | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchFX().then((r) => {
      if (cancelled) return;
      setFx(r);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) return null;
  if (!fx) return null;

  // Build the equivalent — single amount or summed map.
  let equiv: number | null = null;
  let sourceMixed = false;

  if (byCurrency) {
    let sum = 0;
    let any = false;
    for (const [cur, amt] of Object.entries(byCurrency)) {
      if (!Number.isFinite(amt) || Math.abs(amt) < 0.01) continue;
      const v = convertOne(amt, cur, target, fx);
      if (v === null) continue;
      sum += v;
      any = true;
      if (cur.toUpperCase() !== target.toUpperCase()) sourceMixed = true;
    }
    if (any) equiv = sum;
  } else if (typeof amount === "number" && Number.isFinite(amount)) {
    if (currency.toUpperCase() === target.toUpperCase()) return null;
    equiv = convertOne(amount, currency, target, fx);
  }

  if (equiv === null) return null;

  return (
    <span
      className={`text-[10px] text-dash-text-muted tracking-wide ${className ?? ""}`}
      title={`${fx.base}→${fx.quote} ${fx.rate.toFixed(4)} (${fx.date}, ${fx.source})`}
    >
      ≈ {fmt(equiv, target)} {target}
      {sourceMixed && (
        <span className="ml-1 opacity-60">at {fx.rate.toFixed(2)}</span>
      )}
    </span>
  );
};

export { MoneyEquiv };
