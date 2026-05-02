"use client";

/**
 * /dashboard/finance/cash-bucket — owner-gated view of off-books cash flow.
 * Sensitive surface: gated by `view_cash_bucket` feature on the API; this
 * page handles 403 with a quiet access-denied state (no leak of what's
 * behind the wall).
 *
 * R2-4 — see app/(dashboard)/components/payments/fiscal-bucket-picker.tsx
 * for the picker that produces these rows.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft, Coins, Lock } from "lucide-react";
import { earmarkLabel, type CashEarmark } from "@/app/(dashboard)/components/payments/fiscal-bucket-picker";

interface DealPaymentRow {
  Payment_ID: string;
  Deal_ID: string;
  Amount: string;
  Currency: string;
  Status: string;
  Paid_Date: string;
  Fiscal_Disposition: string;
  Cash_Earmark: string;
}

interface MonthSummary {
  month: string;
  byEarmark: Record<string, { count: number; total: number }>;
  totalMxn: number;
}

interface ApiResponse {
  payments: DealPaymentRow[];
  monthSummary: MonthSummary;
}

const formatMxn = (n: number): string =>
  `$${n.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} MXN`;

const formatMonthLabel = (key: string): string => {
  const [y, m] = key.split("-").map((s) => Number.parseInt(s, 10));
  if (!y || !m) return key;
  const d = new Date(Date.UTC(y, m - 1, 1));
  return d.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
};

export default function CashBucketPage(): React.ReactElement {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/dashboard/finance/cash-bucket")
      .then((res) => {
        if (res.status === 403) {
          if (alive) {
            setDenied(true);
            setLoading(false);
          }
          return null;
        }
        return res.ok ? res.json() : null;
      })
      .then((json) => {
        if (json && alive) setData(json as ApiResponse);
      })
      .catch(() => {
        // network error — leave data null
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-5 h-5 animate-spin text-dash-text-secondary" />
      </div>
    );
  }

  if (denied) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="inline-flex w-12 h-12 items-center justify-center rounded-full bg-dash-bg">
          <Lock className="w-5 h-5 text-dash-text-secondary" />
        </div>
        <h1 className="text-xl text-dash-text">Restricted view</h1>
        <p className="text-sm text-dash-text-secondary max-w-md mx-auto">
          The cash bucket is owner-gated. If you need access, ask Roger to add{" "}
          <code className="text-[12px] bg-dash-bg rounded px-1.5 py-0.5">+view_cash_bucket</code>{" "}
          to your row in the Users sheet.
        </p>
        <Link
          href="/dashboard/finance"
          className="inline-flex items-center gap-1.5 text-sm text-brand-copper hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to finance
        </Link>
      </div>
    );
  }

  const summary = data?.monthSummary;
  const earmarkRows = summary
    ? Object.entries(summary.byEarmark).sort((a, b) => b[1].total - a[1].total)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <div>
          <Link
            href="/dashboard/finance"
            className="inline-flex items-center gap-1 text-xs text-dash-text-secondary hover:text-dash-text mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Finance
          </Link>
          <h1 className="text-2xl text-dash-text flex items-center gap-2">
            <Coins className="w-5 h-5 text-brand-copper" />
            Cash bucket
          </h1>
          <p className="text-sm text-dash-text-secondary mt-1 max-w-2xl">
            Off-books cash held for same-month operating expenses Counter
            Cultures pays in cash — partial showroom + bodega rent, petty
            cash, salaries for bookkeeping and manager. Honest accounting,
            owner-gated.
          </p>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-dash-text-secondary">
            {summary ? formatMonthLabel(summary.month) : "—"}
          </div>
          <div className="text-2xl text-dash-text mt-1">
            {summary ? formatMxn(summary.totalMxn) : "—"}
          </div>
          <div className="text-[10.5px] text-dash-text-secondary">
            in this month
          </div>
        </div>
      </div>

      {/* By earmark */}
      <section>
        <h2 className="text-xs uppercase tracking-wider text-dash-text-secondary mb-3">
          By earmark · {summary ? formatMonthLabel(summary.month) : ""}
        </h2>
        {earmarkRows.length === 0 ? (
          <div className="border border-dashed border-dash-border rounded-lg p-6 text-center">
            <p className="text-sm text-dash-text-secondary">
              No cash-bucket entries this month.
            </p>
          </div>
        ) : (
          <div className="border border-dash-border rounded-lg overflow-hidden">
            {earmarkRows.map(([earmark, agg], idx) => (
              <div
                key={earmark}
                className={`grid grid-cols-[1fr_80px_1fr] items-center px-4 py-3 text-sm ${
                  idx > 0 ? "border-t border-dash-border" : ""
                }`}
              >
                <div className="text-dash-text">
                  {earmarkLabel(earmark as CashEarmark)}
                </div>
                <div className="text-xs text-dash-text-secondary">
                  {agg.count} {agg.count === 1 ? "entry" : "entries"}
                </div>
                <div className="text-right font-medium text-dash-text">
                  {formatMxn(agg.total)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent rows */}
      <section>
        <h2 className="text-xs uppercase tracking-wider text-dash-text-secondary mb-3">
          All rows
        </h2>
        {data && data.payments.length > 0 ? (
          <div className="border border-dash-border rounded-lg overflow-hidden">
            <div className="grid grid-cols-[110px_120px_1fr_140px_120px] bg-dash-bg px-4 py-2 text-[10px] uppercase tracking-wider text-dash-text-secondary">
              <div>Date</div>
              <div>Deal</div>
              <div>Earmark</div>
              <div>Status</div>
              <div className="text-right">Amount</div>
            </div>
            {data.payments
              .sort((a, b) => (b.Paid_Date ?? "").localeCompare(a.Paid_Date ?? ""))
              .map((p) => (
                <div
                  key={p.Payment_ID}
                  className="grid grid-cols-[110px_120px_1fr_140px_120px] items-center px-4 py-2.5 text-sm border-t border-dash-border"
                >
                  <div className="text-xs text-dash-text-secondary">
                    {p.Paid_Date ? p.Paid_Date.slice(0, 10) : "—"}
                  </div>
                  <Link
                    href={`/dashboard/pipeline?deal=${p.Deal_ID}`}
                    className="text-xs font-mono text-brand-copper hover:underline"
                  >
                    {p.Deal_ID || "—"}
                  </Link>
                  <div className="text-dash-text">
                    {earmarkLabel((p.Cash_Earmark || "") as CashEarmark)}
                  </div>
                  <div className="text-xs text-dash-text-secondary">{p.Status || "—"}</div>
                  <div className="text-right font-mono">
                    {formatMxn(Number.parseFloat(p.Amount ?? "0") || 0)}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="border border-dashed border-dash-border rounded-lg p-6 text-center">
            <p className="text-sm text-dash-text-secondary">
              No cash-bucket payments recorded yet.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
