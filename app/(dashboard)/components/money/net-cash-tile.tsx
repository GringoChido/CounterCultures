"use client";

import { useEffect, useState } from "react";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";

interface FXRate {
  date: string;
  base: string;
  quote: string;
  rate: number;
  source: string;
  fetchedAt: string;
}

interface NetCashTileProps {
  arOpenByCurrency: Record<string, number>;
  apOpenByCurrency: Record<string, number>;
}

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

const consolidate = (
  byCurrency: Record<string, number>,
  target: string,
  fx: FXRate
): number => {
  let total = 0;
  for (const [cur, amt] of Object.entries(byCurrency)) {
    if (!Number.isFinite(amt) || Math.abs(amt) < 0.01) continue;
    const v = convertOne(amt, cur, target, fx);
    if (v !== null) total += v;
  }
  return total;
};

const fmtMxn = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n);

const compact = (n: number) => {
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${Math.round(n)}`;
};

/**
 * Single-tile cash-flow snapshot. Consolidates all open AR and AP into MXN
 * at today's FX rate so the answer to "are we net positive or net underwater
 * right now?" is one glance, not mental arithmetic across two currencies.
 *
 * Hides itself when no FX rate is available (cron hasn't run yet) — the
 * dual-currency tiles next to it still convey the raw numbers.
 */
const NetCashTile = ({ arOpenByCurrency, apOpenByCurrency }: NetCashTileProps) => {
  const [fx, setFx] = useState<FXRate | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dashboard/fx", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { rate: null }))
      .then((data: { rate: FXRate | null }) => {
        if (cancelled) return;
        setFx(data.rate);
        setReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready || !fx) return null;

  const arMxn = consolidate(arOpenByCurrency, "MXN", fx);
  const apMxn = consolidate(apOpenByCurrency, "MXN", fx);
  const net = arMxn - apMxn;
  const positive = net >= 0;

  return (
    <section className="bg-dash-surface border border-dash-border rounded-md p-5 mb-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-dash-text-muted font-medium">
          <Wallet className="w-3.5 h-3.5" />
          Net cash position
        </div>
        <span
          className="text-[10px] text-dash-text-muted"
          title={`USD→MXN ${fx.rate.toFixed(4)} (${fx.date}, ${fx.source})`}
        >
          @ {fx.rate.toFixed(2)} MXN/USD
        </span>
      </div>
      <div className="flex items-baseline gap-3 flex-wrap">
        <div
          className={`font-display text-3xl tabular-nums ${
            positive ? "text-brand-sage" : "text-brand-terracotta"
          }`}
        >
          {fmtMxn(net)}
        </div>
        <div className="flex items-center gap-1 text-xs text-dash-text-secondary">
          {positive ? (
            <TrendingUp className="w-3.5 h-3.5 text-brand-sage" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-brand-terracotta" />
          )}
          {positive ? "AR exceeds AP" : "AP exceeds AR"}
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-dash-text-muted">
            Open AR (incoming)
          </div>
          <div className="text-dash-text font-medium">{compact(arMxn)} MXN</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-dash-text-muted">
            Open AP (outgoing)
          </div>
          <div className="text-dash-text font-medium">{compact(apMxn)} MXN</div>
        </div>
      </div>
      <p className="text-[10px] text-dash-text-muted mt-2">
        Snapshot consolidated to MXN at today's FX. Real settlement happens at
        the rate of the day each invoice is paid — this is for planning, not
        the GL.
      </p>
    </section>
  );
};

export { NetCashTile };
