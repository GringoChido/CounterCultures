"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { FileText, AlertCircle } from "lucide-react";
import { CompanyBadge } from "@/app/(dashboard)/components/company-badge";
import { formatDate } from "@/app/lib/format-date";

interface BillRow {
  id: string;
  name: string;
  partnerName: string;
  date: string;
  dueDate: string;
  daysOverdue: number;
  isOverdue: boolean;
  residual: number;
  total: number;
  currency: string;
  paymentState: string;
  company: string;
}

const fmt = (n: number, cur = "MXN") =>
  !n ? "—" : `$${Math.round(n).toLocaleString()} ${cur}`;

const OpenBillsSection = () => {
  const [bills, setBills] = useState<BillRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams({
      moveType: "vendor",
      paymentState: "open",
      limit: "200",
      sort: "date_desc",
    });
    fetch(`/api/dashboard/invoices?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setBills(data.invoices ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const totalByCurrency: Record<string, number> = {};
    const overdueByCurrency: Record<string, number> = {};
    let overdueCount = 0;
    for (const b of bills) {
      totalByCurrency[b.currency] = (totalByCurrency[b.currency] ?? 0) + b.residual;
      if (b.isOverdue) {
        overdueCount++;
        overdueByCurrency[b.currency] = (overdueByCurrency[b.currency] ?? 0) + b.residual;
      }
    }
    return { totalByCurrency, overdueByCurrency, overdueCount };
  }, [bills]);

  if (loading) {
    return (
      <div className="mb-6">
        <div className="h-4 w-48 bg-dash-bg rounded animate-pulse mb-3" />
        <div className="bg-dash-surface border border-dash-border rounded-md">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 bg-dash-bg/50 animate-pulse border-b border-dash-border last:border-b-0" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6 bg-dash-surface border border-dash-border rounded-md p-5">
        <p className="text-xs text-dash-text-secondary">
          No se pudieron cargar las facturas. / Could not load vendor bills.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-4 h-4 text-brand-copper" />
        <h2 className="font-display text-sm uppercase tracking-wider text-dash-text">
          Facturas de proveedor abiertas / Open Vendor Bills
        </h2>
        <span className="text-[10px] text-dash-text-secondary">
          {bills.length} open
          {stats.overdueCount > 0 && (
            <span className="text-brand-terracotta ml-1">
              · {stats.overdueCount} overdue
            </span>
          )}
        </span>
      </div>

      {Object.keys(stats.totalByCurrency).length > 0 && (
        <div className="flex gap-4 mb-3">
          {Object.entries(stats.totalByCurrency).map(([cur, amt]) => (
            <div key={cur} className="bg-dash-surface border border-dash-border rounded-md px-4 py-2">
              <p className="text-[10px] uppercase tracking-wider text-dash-text-secondary">
                Pendiente / Open ({cur})
              </p>
              <p className="font-display text-lg text-dash-text">{fmt(amt, cur)}</p>
            </div>
          ))}
          {Object.entries(stats.overdueByCurrency).map(([cur, amt]) => (
            <div key={`ov-${cur}`} className="bg-brand-terracotta/5 border border-brand-terracotta/20 rounded-md px-4 py-2">
              <p className="text-[10px] uppercase tracking-wider text-brand-terracotta">
                Vencido / Overdue ({cur})
              </p>
              <p className="font-display text-lg text-brand-terracotta">{fmt(amt, cur)}</p>
            </div>
          ))}
        </div>
      )}

      {bills.length === 0 ? (
        <div className="bg-dash-surface border border-dash-border rounded-md p-5">
          <p className="text-xs text-dash-text-secondary">
            Sin facturas abiertas. / No open bills.
          </p>
        </div>
      ) : (
        <div className="bg-dash-surface border border-dash-border rounded overflow-hidden">
          <div className="grid grid-cols-[1fr_1.2fr_auto_0.7fr_0.7fr_0.6fr_0.8fr_0.6fr_auto] gap-px text-[10px] uppercase tracking-wider text-dash-text-secondary px-4 py-2 border-b border-dash-border bg-dash-bg">
            <div>Factura / Bill #</div>
            <div>Proveedor / Vendor</div>
            <div>Entidad / Entity</div>
            <div>Fecha / Date</div>
            <div>Vencimiento / Due</div>
            <div>Días / Days</div>
            <div>Monto / Amount</div>
            <div>Moneda / Cur.</div>
            <div>Estado / Status</div>
          </div>
          {bills.map((b) => (
            <div
              key={b.id}
              className={`grid grid-cols-[1fr_1.2fr_auto_0.7fr_0.7fr_0.6fr_0.8fr_0.6fr_auto] gap-px px-4 py-2.5 text-sm border-b border-dash-border last:border-b-0 ${
                b.isOverdue ? "bg-brand-terracotta/5" : ""
              }`}
            >
              <div>
                <Link
                  href={`/dashboard/invoices/${b.id}`}
                  className="font-mono text-xs hover:text-dash-accent"
                >
                  {b.name}
                </Link>
              </div>
              <div className="text-xs text-dash-text font-medium truncate">{b.partnerName}</div>
              <div><CompanyBadge company={b.company} size="xs" /></div>
              <div className="text-xs text-dash-text-secondary">{formatDate(b.date)}</div>
              <div className="text-xs text-dash-text-secondary">{formatDate(b.dueDate)}</div>
              <div className="text-xs">
                {b.isOverdue ? (
                  <span className="inline-flex items-center gap-1 text-brand-terracotta">
                    <AlertCircle className="w-3 h-3" />
                    {b.daysOverdue}d
                  </span>
                ) : (
                  <span className="text-dash-text-secondary">{b.daysOverdue > 0 ? `${b.daysOverdue}d` : "—"}</span>
                )}
              </div>
              <div className="font-mono text-xs text-dash-text">{fmt(b.residual, b.currency)}</div>
              <div className="text-[10px] text-dash-text-secondary">{b.currency}</div>
              <div className="text-[10px] text-dash-text-secondary capitalize">{b.paymentState}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OpenBillsSection;
