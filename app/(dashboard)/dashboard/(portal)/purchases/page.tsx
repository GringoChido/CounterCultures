"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createColumnHelper } from "@tanstack/react-table";
import {
  Truck,
  Search,
  Loader2,
  CheckCircle2,
  Clock,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { DataTable } from "@/app/(dashboard)/components/data-table";
import { StatusBadge, type BadgeVariant } from "@/app/(dashboard)/components/status-badge";

type POStateFilter = "all" | "draft" | "sent" | "purchase" | "done" | "cancel";
type POInvoiceFilter = "all" | "no" | "to invoice" | "invoiced";
type SortBy = "date_desc" | "date_asc" | "total_desc" | "days_open_desc" | "vendor";

interface PORow {
  id: string;
  name: string;
  state: string;
  vendorId: string;
  vendorName: string;
  currency: string;
  dateOrder: string;
  amountTotal: number;
  invoiceStatus: string;
  daysOpen: number;
  isOverdue: boolean;
}

interface Pipeline {
  draft: { count: number; totalByCurrency: Record<string, number> };
  sent: { count: number; totalByCurrency: Record<string, number> };
  purchase: { count: number; totalByCurrency: Record<string, number> };
  done: { count: number; totalByCurrency: Record<string, number> };
  cancel: { count: number; totalByCurrency: Record<string, number> };
  awaitingInvoice: { count: number; totalByCurrency: Record<string, number> };
  stuck: { count: number; totalByCurrency: Record<string, number> };
}

const fmt = (n: number, cur = "USD") =>
  !n ? "—" : `$${Math.round(n).toLocaleString()} ${cur}`;

const sumAllCurrencies = (rec: Record<string, number>) =>
  Object.entries(rec)
    .filter(([, v]) => Math.abs(v) > 0.01)
    .map(([cur, amt]) => `$${Math.round(amt).toLocaleString()} ${cur}`)
    .join(" + ") || "—";

const stateVariant = (s: string): BadgeVariant => {
  if (s === "purchase" || s === "done") return "success";
  if (s === "sent") return "info";
  if (s === "draft") return "new";
  if (s === "cancel") return "danger";
  return "info";
};

const invoiceStatusVariant = (s: string): BadgeVariant => {
  if (s === "invoiced") return "success";
  if (s === "to invoice") return "warning";
  return "default";
};

const columnHelper = createColumnHelper<PORow>();

const columns = [
  columnHelper.accessor("name", {
    header: "PO #",
    cell: (info) => {
      const r = info.row.original;
      return (
        <Link
          href={`/dashboard/purchases/${r.id}`}
          className="font-mono text-xs hover:text-dash-accent"
        >
          {info.getValue()}
        </Link>
      );
    },
  }),
  columnHelper.accessor("vendorName", {
    header: "Vendor",
    cell: (info) => {
      const r = info.row.original;
      return r.vendorId ? (
        <Link
          href={`/dashboard/customers/${r.vendorId}`}
          className="text-sm hover:text-dash-accent line-clamp-1"
        >
          {info.getValue() || "—"}
        </Link>
      ) : (
        <span className="text-sm">{info.getValue() || "—"}</span>
      );
    },
  }),
  columnHelper.accessor("dateOrder", {
    header: "Ordered",
    cell: (info) => <span className="text-xs">{info.getValue() || "—"}</span>,
  }),
  columnHelper.accessor("state", {
    header: "State",
    cell: (info) => {
      const r = info.row.original;
      return (
        <div className="flex items-center gap-1.5">
          <StatusBadge label={info.getValue()} variant={stateVariant(info.getValue())} />
          {r.isOverdue && (
            <span
              title={`Open ${r.daysOpen} days`}
              className="text-[10px] text-brand-terracotta inline-flex items-center gap-0.5"
            >
              <AlertTriangle className="w-3 h-3" />
              stuck
            </span>
          )}
        </div>
      );
    },
  }),
  columnHelper.accessor("invoiceStatus", {
    header: "Billed",
    cell: (info) => {
      const v = info.getValue();
      if (!v) return <span className="text-xs text-dash-text-secondary">—</span>;
      return <StatusBadge label={v} variant={invoiceStatusVariant(v)} />;
    },
  }),
  columnHelper.accessor("amountTotal", {
    header: "Total",
    cell: (info) => {
      const r = info.row.original;
      return (
        <span className="text-right block font-medium">
          {fmt(r.amountTotal, r.currency)}
        </span>
      );
    },
  }),
];

const PipelineHero = ({
  pipeline,
  onBucketClick,
}: {
  pipeline: Pipeline;
  onBucketClick: (f: { state?: POStateFilter; invoiceStatus?: POInvoiceFilter; stuckOnly?: boolean }) => void;
}) => {
  const openCount = pipeline.draft.count + pipeline.sent.count + pipeline.purchase.count;
  const openTotal: Record<string, number> = {};
  for (const b of [pipeline.draft, pipeline.sent, pipeline.purchase]) {
    for (const [cur, amt] of Object.entries(b.totalByCurrency)) {
      openTotal[cur] = (openTotal[cur] ?? 0) + amt;
    }
  }

  const buckets = [
    {
      key: "open",
      label: "Open POs",
      count: openCount,
      total: openTotal,
      icon: Clock,
      iconClass: "text-brand-copper",
      description: `${pipeline.draft.count + pipeline.sent.count} drafts + ${pipeline.purchase.count} confirmed`,
      onClick: () => onBucketClick({}),
    },
    {
      key: "purchase",
      label: "Confirmed",
      count: pipeline.purchase.count,
      total: pipeline.purchase.totalByCurrency,
      icon: CheckCircle2,
      iconClass: "text-brand-sage",
      description: "En route / receiving",
      onClick: () => onBucketClick({ state: "purchase" }),
    },
    {
      key: "awaiting_invoice",
      label: "Awaiting Bill",
      count: pipeline.awaitingInvoice.count,
      total: pipeline.awaitingInvoice.totalByCurrency,
      icon: FileText,
      iconClass: "text-brand-terracotta",
      description: "Received but not billed",
      onClick: () => onBucketClick({ invoiceStatus: "to invoice" }),
    },
    {
      key: "stuck",
      label: "Stuck",
      count: pipeline.stuck.count,
      total: pipeline.stuck.totalByCurrency,
      icon: AlertTriangle,
      iconClass: "text-brand-terracotta",
      description: "Open > 60 days",
      onClick: () => onBucketClick({ stuckOnly: true }),
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {buckets.map((b) => {
        const Icon = b.icon;
        return (
          <button
            key={b.key}
            onClick={b.onClick}
            className="bg-dash-surface border border-dash-border p-4 rounded text-left hover:border-dash-accent transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${b.iconClass}`} />
              <span className="text-xs uppercase tracking-wider text-dash-text-secondary">
                {b.label}
              </span>
            </div>
            <div className="text-2xl font-semibold text-dash-text">{b.count.toLocaleString()}</div>
            <div className="text-xs text-dash-text-secondary mt-1 line-clamp-1">
              {sumAllCurrencies(b.total)}
            </div>
            <div className="text-[10px] text-dash-text-secondary mt-1">{b.description}</div>
          </button>
        );
      })}
    </div>
  );
};

const PurchasesPage = () => {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<POStateFilter>("all");
  const [invoiceStatus, setInvoiceStatus] = useState<POInvoiceFilter>("all");
  const [stuckOnly, setStuckOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>("date_desc");
  const [rows, setRows] = useState<PORow[]>([]);
  const [total, setTotal] = useState(0);
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const p = new URLSearchParams();
        if (query) p.set("q", query);
        p.set("state", state);
        p.set("invoiceStatus", invoiceStatus);
        if (stuckOnly) p.set("stuckOnly", "true");
        p.set("sort", sortBy);
        p.set("limit", "200");
        const res = await fetch(`/api/dashboard/purchases?${p.toString()}`);
        const data = await res.json();
        setRows(data.orders ?? []);
        setTotal(data.total ?? 0);
        setPipeline(data.pipeline ?? null);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query, state, invoiceStatus, stuckOnly, sortBy]);

  const applyBucket = (f: {
    state?: POStateFilter;
    invoiceStatus?: POInvoiceFilter;
    stuckOnly?: boolean;
  }) => {
    setState(f.state ?? "all");
    setInvoiceStatus(f.invoiceStatus ?? "all");
    setStuckOnly(!!f.stuckOnly);
  };

  const activeFilters = useMemo(() => {
    const out: string[] = [];
    if (state !== "all") out.push(state);
    if (invoiceStatus !== "all") out.push(`invoice:${invoiceStatus}`);
    if (stuckOnly) out.push("stuck only");
    return out;
  }, [state, invoiceStatus, stuckOnly]);

  return (
    <div className="p-6 max-w-[1500px] mx-auto">
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Truck className="w-6 h-6 text-dash-accent" />
          <h1 className="font-display text-2xl">Purchase Orders</h1>
        </div>
        <p className="text-sm text-dash-text-secondary">
          Vendor POs — what's ordered, received, billed — from the live Odoo snapshot.
        </p>
      </header>

      {pipeline && <PipelineHero pipeline={pipeline} onBucketClick={applyBucket} />}

      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dash-text-secondary" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search PO # or vendor…"
            className="w-full pl-10 pr-4 py-2 border border-dash-border bg-dash-surface text-sm focus:outline-none focus:border-dash-accent rounded"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dash-text-secondary animate-spin" />
          )}
        </div>
        <select
          value={state}
          onChange={(e) => setState(e.target.value as POStateFilter)}
          className="px-3 py-2 border border-dash-border bg-dash-surface text-sm focus:outline-none focus:border-dash-accent rounded"
        >
          <option value="all">All states</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent to vendor</option>
          <option value="purchase">Confirmed</option>
          <option value="done">Done</option>
          <option value="cancel">Cancelled</option>
        </select>
        <select
          value={invoiceStatus}
          onChange={(e) => setInvoiceStatus(e.target.value as POInvoiceFilter)}
          className="px-3 py-2 border border-dash-border bg-dash-surface text-sm focus:outline-none focus:border-dash-accent rounded"
        >
          <option value="all">All bill statuses</option>
          <option value="no">Nothing to bill</option>
          <option value="to invoice">To bill</option>
          <option value="invoiced">Billed</option>
        </select>
        <label className="inline-flex items-center gap-2 text-xs text-dash-text-secondary px-3 py-2 border border-dash-border bg-dash-surface rounded cursor-pointer">
          <input
            type="checkbox"
            checked={stuckOnly}
            onChange={(e) => setStuckOnly(e.target.checked)}
            className="cursor-pointer"
          />
          Stuck only
        </label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="px-3 py-2 border border-dash-border bg-dash-surface text-sm focus:outline-none focus:border-dash-accent rounded"
        >
          <option value="date_desc">Newest first</option>
          <option value="date_asc">Oldest first</option>
          <option value="total_desc">Largest total</option>
          <option value="days_open_desc">Open longest</option>
          <option value="vendor">Vendor A-Z</option>
        </select>
      </div>

      <div className="mb-2 text-xs text-dash-text-secondary">
        {total.toLocaleString()} PO{total === 1 ? "" : "s"}
        {activeFilters.length > 0 && <> · filtered: {activeFilters.join(", ")}</>}
      </div>

      <div className="bg-dash-surface border border-dash-border rounded">
        <DataTable columns={columns} data={rows} />
      </div>
    </div>
  );
};

export default PurchasesPage;
