"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  FileClock,
  Receipt,
  Truck,
  PackageX,
  ArrowRight,
} from "lucide-react";

interface CommandCenterData {
  ar: {
    openByCurrency: Record<string, number>;
    overdueCount: number;
    invoiceCount: number;
    ninetyPlusByCurrency: Record<string, number>;
  };
  orders: {
    staleQuoteCount: number;
    staleQuoteByCurrency: Record<string, number>;
    toInvoiceCount: number;
    toInvoiceByCurrency: Record<string, number>;
  };
  purchases: {
    awaitingInvoiceCount: number;
    awaitingInvoiceByCurrency: Record<string, number>;
    stuckCount: number;
    stuckByCurrency: Record<string, number>;
  };
  inventory: {
    lowStock: number;
    outOfStock: number;
    totalProducts: number;
  };
  payments: {
    last30InboundByCurrency: Record<string, number>;
    last30OutboundByCurrency: Record<string, number>;
  };
}

type Severity = "danger" | "warning" | "info" | "calm";

const compactMoney = (n: number): string => {
  if (!Number.isFinite(n) || n <= 0) return "$0";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${Math.round(n)}`;
};

const byCurrencyCompact = (rec: Record<string, number>): string => {
  const entries = Object.entries(rec).filter(([, v]) => v > 0);
  if (entries.length === 0) return "—";
  return entries
    .map(([cur, amt]) => `${compactMoney(amt)} ${cur}`)
    .join(" + ");
};

const ringClass: Record<Severity, string> = {
  danger: "bg-brand-terracotta",
  warning: "bg-brand-copper/80",
  info: "bg-dash-accent/70",
  calm: "bg-brand-sage",
};

interface ActionCardProps {
  label: string;
  count: number | string;
  valueLine: string;
  subLine?: string;
  href: string;
  severity: Severity;
  icon: React.ElementType;
}

const ActionCard = ({
  label,
  count,
  valueLine,
  subLine,
  href,
  severity,
  icon: Icon,
}: ActionCardProps) => (
  <Link
    href={href}
    className="group relative bg-dash-surface border border-dash-border rounded-md p-5 transition-colors hover:border-dash-border-strong focus:outline-none focus:ring-2 focus:ring-dash-accent/40 flex flex-col"
  >
    <span
      aria-hidden
      className={`absolute left-0 top-4 bottom-4 w-0.5 rounded-full ${ringClass[severity]}`}
    />
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-dash-text-muted font-medium">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <ArrowRight className="w-4 h-4 text-dash-text-muted/60 group-hover:text-dash-text-secondary transition-colors" />
    </div>
    <p className="font-display text-3xl text-dash-text leading-none mt-3 tabular-nums">
      {count}
    </p>
    <p className="text-sm text-dash-text mt-2 tabular-nums">{valueLine}</p>
    {subLine && (
      <p className="text-xs text-dash-text-secondary mt-1">{subLine}</p>
    )}
  </Link>
);

const CommandCenter = () => {
  const [data, setData] = useState<CommandCenterData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard/command-center")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <section className="bg-dash-surface border border-dash-border rounded-md p-5">
        <p className="text-sm text-dash-text-secondary">
          Command Center unavailable. Check the Odoo mirror sheets.
        </p>
      </section>
    );
  }

  if (!data) {
    return (
      <section>
        <h2 className="text-[11px] uppercase tracking-[0.08em] text-dash-text-muted font-semibold pl-1 mb-3">
          Command Center
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-32 bg-dash-surface border border-dash-border rounded-md animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  const cards: ActionCardProps[] = [
    {
      label: "Overdue AR",
      count: data.ar.overdueCount,
      valueLine: byCurrencyCompact(data.ar.openByCurrency),
      subLine: `${data.ar.invoiceCount} open · 90d+: ${byCurrencyCompact(
        data.ar.ninetyPlusByCurrency
      )}`,
      href: "/dashboard/invoices?paymentState=overdue",
      severity: data.ar.overdueCount > 0 ? "danger" : "calm",
      icon: AlertCircle,
    },
    {
      label: "Stale quotes",
      count: data.orders.staleQuoteCount,
      valueLine: byCurrencyCompact(data.orders.staleQuoteByCurrency),
      subLine: "Draft or sent · >30 days old",
      href: "/dashboard/orders?staleOnly=true",
      severity: data.orders.staleQuoteCount > 0 ? "danger" : "calm",
      icon: FileClock,
    },
    {
      label: "Ready to invoice",
      count: data.orders.toInvoiceCount,
      valueLine: byCurrencyCompact(data.orders.toInvoiceByCurrency),
      subLine: "Confirmed orders, not yet billed",
      href: "/dashboard/orders?invoiceStatus=to+invoice",
      severity: data.orders.toInvoiceCount > 0 ? "warning" : "calm",
      icon: Receipt,
    },
    {
      label: "Awaiting vendor bill",
      count: data.purchases.awaitingInvoiceCount,
      valueLine: byCurrencyCompact(data.purchases.awaitingInvoiceByCurrency),
      subLine: "Received POs, no bill captured",
      href: "/dashboard/purchases?invoiceStatus=to+invoice",
      severity: data.purchases.awaitingInvoiceCount > 0 ? "warning" : "calm",
      icon: Truck,
    },
    {
      label: "POs stuck >60d",
      count: data.purchases.stuckCount,
      valueLine: byCurrencyCompact(data.purchases.stuckByCurrency),
      subLine: "Open and ordered >60 days",
      href: "/dashboard/purchases?stuckOnly=true",
      severity: data.purchases.stuckCount > 0 ? "warning" : "calm",
      icon: Truck,
    },
    {
      label: "Inventory gaps",
      count: data.inventory.outOfStock,
      valueLine: `${data.inventory.lowStock} low · ${data.inventory.outOfStock} out`,
      subLine: `${data.inventory.totalProducts} products tracked`,
      href: "/dashboard/inventory?outOfStockOnly=true",
      severity: data.inventory.outOfStock > 0 ? "danger" : "calm",
      icon: PackageX,
    },
  ];

  const inbound30 = byCurrencyCompact(data.payments.last30InboundByCurrency);

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between pl-1">
        <h2 className="text-[11px] uppercase tracking-[0.08em] text-dash-text-muted font-semibold">
          Command Center
        </h2>
        {inbound30 !== "—" && (
          <p className="text-xs text-dash-text-secondary tabular-nums">
            Last 30d inbound: <span className="text-dash-text">{inbound30}</span>
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {cards.map((c) => (
          <ActionCard key={c.label} {...c} />
        ))}
      </div>
    </section>
  );
};

export { CommandCenter };
