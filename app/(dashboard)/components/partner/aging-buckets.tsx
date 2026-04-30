"use client";

import { Calendar } from "lucide-react";
import { MoneyEquiv } from "@/app/(dashboard)/components/money/money-equiv";

interface AgingShape {
  current: Record<string, number>;
  "0-30": Record<string, number>;
  "30-60": Record<string, number>;
  "60-90": Record<string, number>;
  "90+": Record<string, number>;
  totalOpen: Record<string, number>;
}

interface AgingBucketsProps {
  aging: AgingShape;
  /** Customer = AR aging; Vendor = AP aging. Adjusts the heading + colors. */
  mode: "customer" | "vendor";
}

const fmtMoney = (rec: Record<string, number>): string => {
  const parts = Object.entries(rec)
    .filter(([, v]) => Math.abs(v) > 0.01)
    .map(([cur, amt]) => `$${Math.round(amt).toLocaleString()} ${cur}`);
  return parts.length === 0 ? "—" : parts.join(" + ");
};

const sumValues = (rec: Record<string, number>): number =>
  Object.values(rec).reduce((s, v) => s + Math.abs(v), 0);

const AgingBuckets = ({ aging, mode }: AgingBucketsProps) => {
  // Render nothing if the partner has no open balance — keeps the page tidy
  // for paid-up customers / fully-billed vendors.
  if (sumValues(aging.totalOpen) < 0.01) return null;

  // Pre-compute the bucket totals so we can scale the bar widths relative
  // to the largest bucket — gives a visual sense of where the weight is.
  const order: (keyof Omit<AgingShape, "totalOpen">)[] = [
    "current",
    "0-30",
    "30-60",
    "60-90",
    "90+",
  ];
  const labels: Record<(typeof order)[number], string> = {
    current: "Not yet due",
    "0-30": "1–30 days late",
    "30-60": "31–60 days late",
    "60-90": "61–90 days late",
    "90+": "90+ days late",
  };
  const bucketTones: Record<(typeof order)[number], string> = {
    current: "bg-brand-sage/70",
    "0-30": "bg-amber-400",
    "30-60": "bg-amber-500",
    "60-90": "bg-orange-500",
    "90+": "bg-red-500",
  };
  const totals = order.map((k) => sumValues(aging[k]));
  const max = Math.max(1, ...totals);

  return (
    <section className="bg-dash-surface border border-dash-border p-5 rounded">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="font-display text-sm uppercase tracking-wider text-dash-text-secondary flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {mode === "customer" ? "AR aging" : "AP aging"}
        </h2>
        <div className="text-xs text-dash-text-secondary text-right">
          <div>
            Total open:{" "}
            <span className="text-dash-text font-medium">{fmtMoney(aging.totalOpen)}</span>
          </div>
          <MoneyEquiv byCurrency={aging.totalOpen} target="MXN" className="block" />
        </div>
      </div>
      <div className="space-y-2">
        {order.map((k, idx) => {
          const total = totals[idx];
          const value = aging[k];
          const widthPct = (total / max) * 100;
          const isEmpty = total < 0.01;
          return (
            <div key={k} className="grid grid-cols-[120px_1fr_auto] gap-3 items-center">
              <div className="text-[11px] uppercase tracking-wider text-dash-text-secondary">
                {labels[k]}
              </div>
              <div className="h-2 bg-dash-bg-muted rounded-full overflow-hidden">
                {!isEmpty && (
                  <div
                    className={`h-full ${bucketTones[k]} transition-all`}
                    style={{ width: `${Math.max(2, widthPct)}%` }}
                  />
                )}
              </div>
              <div
                className={`text-xs whitespace-nowrap ${
                  isEmpty ? "text-dash-text-muted" : "text-dash-text font-medium"
                }`}
              >
                {fmtMoney(value)}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export { AgingBuckets };
