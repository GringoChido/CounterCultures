"use client";

import { CreditCard, AlertTriangle } from "lucide-react";

interface CreditPanelProps {
  /** "customer" displays A/R + credit limit; "vendor" flips to A/P. */
  mode: "customer" | "vendor";
  /** partner.credit (Odoo) — receivable balance for customers. */
  credit: string;
  /** partner.debit (Odoo) — payable balance for vendors. */
  debit: string;
  /** partner.credit_limit — only meaningful on the customer side. */
  creditLimit: string;
  /** partner.total_invoiced — lifetime billed (customers only, in MXN base). */
  totalInvoiced: string;
}

const num = (s: string): number => {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};

const fmt = (n: number) =>
  `$${Math.round(n).toLocaleString()} ${n === 0 ? "" : "MXN"}`.trim();

const CreditPanel = ({
  mode,
  credit,
  debit,
  creditLimit,
  totalInvoiced,
}: CreditPanelProps) => {
  const balance = mode === "customer" ? num(credit) : num(debit);
  const limit = num(creditLimit);
  const utilization = limit > 0 ? (balance / limit) * 100 : 0;
  const overLimit = limit > 0 && balance > limit;
  const nearLimit = limit > 0 && utilization >= 80 && !overLimit;

  // Render nothing if there's literally no signal — avoids rendering an
  // empty card on partners Odoo never tracked credit for.
  if (balance === 0 && limit === 0 && num(totalInvoiced) === 0) return null;

  return (
    <section className="bg-dash-surface border border-dash-border p-5 rounded">
      <h2 className="font-display text-sm uppercase tracking-wider text-dash-text-secondary mb-3 flex items-center gap-2">
        <CreditCard className="w-4 h-4" />
        {mode === "customer" ? "Credit / A/R" : "Open A/P"}
      </h2>
      <dl className="space-y-2 text-sm">
        <div className="grid grid-cols-[140px_1fr] gap-2">
          <dt className="text-xs uppercase tracking-wider text-dash-text-secondary">
            {mode === "customer" ? "Outstanding" : "We owe"}
          </dt>
          <dd className={`font-semibold ${balance > 0 ? "text-brand-terracotta" : "text-dash-text"}`}>
            {fmt(balance)}
          </dd>
        </div>
        {mode === "customer" && limit > 0 && (
          <>
            <div className="grid grid-cols-[140px_1fr] gap-2">
              <dt className="text-xs uppercase tracking-wider text-dash-text-secondary">
                Limit
              </dt>
              <dd className="text-dash-text">{fmt(limit)}</dd>
            </div>
            <div className="pt-1">
              <div className="h-1.5 bg-dash-bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    overLimit
                      ? "bg-red-500"
                      : nearLimit
                        ? "bg-amber-500"
                        : "bg-brand-sage"
                  }`}
                  style={{ width: `${Math.min(100, utilization)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] mt-1">
                <span className="text-dash-text-secondary">
                  {utilization.toFixed(0)}% utilized
                </span>
                {overLimit && (
                  <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                    <AlertTriangle className="w-3 h-3" />
                    Over limit by {fmt(balance - limit)}
                  </span>
                )}
                {nearLimit && (
                  <span className="text-amber-600 font-medium">
                    Approaching limit
                  </span>
                )}
              </div>
            </div>
          </>
        )}
        {mode === "customer" && num(totalInvoiced) > 0 && (
          <div className="grid grid-cols-[140px_1fr] gap-2 pt-1">
            <dt className="text-xs uppercase tracking-wider text-dash-text-secondary">
              Lifetime billed
            </dt>
            <dd className="text-dash-text">{fmt(num(totalInvoiced))}</dd>
          </div>
        )}
      </dl>
    </section>
  );
};

export { CreditPanel };
