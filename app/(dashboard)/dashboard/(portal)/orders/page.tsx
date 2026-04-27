"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createColumnHelper } from "@tanstack/react-table";
import {
  ShoppingCart,
  Search,
  Loader2,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { DataTable } from "@/app/(dashboard)/components/data-table";
import { StatusBadge, type BadgeVariant } from "@/app/(dashboard)/components/status-badge";
import { useFeatures } from "@/app/lib/use-features";

type OrderStateFilter = "all" | "quote" | "draft" | "sent" | "sale" | "done" | "cancel";
type InvoiceStatusFilter = "all" | "no" | "to invoice" | "invoiced" | "upselling";
type SortBy = "date_desc" | "date_asc" | "total_desc" | "days_open_desc" | "partner";

interface OrderRow {
  id: string;
  name: string;
  state: string;
  partnerId: string;
  partnerName: string;
  salesperson: string;
  currency: string;
  dateOrder: string;
  validityDate: string;
  commitmentDate: string;
  amountTotal: number;
  invoiceStatus: string;
  linkedInvoiceCount: number;
  daysOpen: number;
  isStale: boolean;
}

interface Pipeline {
  draft: { count: number; totalByCurrency: Record<string, number> };
  sent: { count: number; totalByCurrency: Record<string, number> };
  sale: { count: number; totalByCurrency: Record<string, number> };
  done: { count: number; totalByCurrency: Record<string, number> };
  cancel: { count: number; totalByCurrency: Record<string, number> };
  toInvoice: { count: number; totalByCurrency: Record<string, number> };
  staleQuotes: { count: number; totalByCurrency: Record<string, number> };
}

const sumAllCurrencies = (rec: Record<string, number>) =>
  Object.entries(rec)
    .filter(([, v]) => Math.abs(v) > 0.01)
    .map(([cur, amt]) => `$${Math.round(amt).toLocaleString()} ${cur}`)
    .join(" + ") || "—";

const fmt = (n: number, cur = "MXN") =>
  !n ? "—" : `$${Math.round(n).toLocaleString()} ${cur}`;

const stateVariant = (s: string): BadgeVariant => {
  if (s === "sale" || s === "done") return "success";
  if (s === "sent") return "info";
  if (s === "draft") return "new";
  if (s === "cancel") return "danger";
  return "info";
};

const invoiceStatusVariant = (s: string): BadgeVariant => {
  if (s === "invoiced") return "success";
  if (s === "to invoice") return "warning";
  if (s === "upselling") return "info";
  if (s === "no") return "default";
  return "info";
};

const columnHelper = createColumnHelper<OrderRow>();

const columns = [
  columnHelper.accessor("name", {
    header: "Order #",
    cell: (info) => {
      const r = info.row.original;
      return (
        <Link
          href={`/dashboard/orders/${r.id}`}
          className="font-mono text-xs hover:text-dash-accent"
        >
          {info.getValue()}
        </Link>
      );
    },
  }),
  columnHelper.accessor("partnerName", {
    header: "Customer",
    cell: (info) => {
      const r = info.row.original;
      return (
        <Link
          href={`/dashboard/customers/${r.partnerId}`}
          className="text-sm hover:text-dash-accent line-clamp-1"
        >
          {info.getValue() || "—"}
        </Link>
      );
    },
  }),
  columnHelper.accessor("dateOrder", {
    header: "Date",
    cell: (info) => <span className="text-xs">{info.getValue() || "—"}</span>,
  }),
  columnHelper.accessor("state", {
    header: "State",
    cell: (info) => {
      const r = info.row.original;
      return (
        <div className="flex items-center gap-1.5">
          <StatusBadge label={info.getValue()} variant={stateVariant(info.getValue())} />
          {r.isStale && (
            <span
              title={`Quote open ${r.daysOpen} days`}
              className="text-[10px] text-brand-terracotta inline-flex items-center gap-0.5"
            >
              <AlertTriangle className="w-3 h-3" />
              stale
            </span>
          )}
        </div>
      );
    },
  }),
  columnHelper.accessor("invoiceStatus", {
    header: "Invoice",
    cell: (info) => {
      const v = info.getValue();
      if (!v) return <span className="text-xs text-dash-text-secondary">—</span>;
      return (
        <div className="flex items-center gap-1.5">
          <StatusBadge label={v} variant={invoiceStatusVariant(v)} />
          {info.row.original.linkedInvoiceCount > 0 && (
            <span className="text-[10px] text-dash-text-secondary">
              ({info.row.original.linkedInvoiceCount})
            </span>
          )}
        </div>
      );
    },
  }),
  columnHelper.accessor("salesperson", {
    header: "Salesperson",
    cell: (info) => (
      <span className="text-xs text-dash-text-secondary line-clamp-1">{info.getValue() || "—"}</span>
    ),
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
  onBucketClick: (filter: {
    state?: OrderStateFilter;
    invoiceStatus?: InvoiceStatusFilter;
    staleOnly?: boolean;
  }) => void;
}) => {
  const openQuotesCount = pipeline.draft.count + pipeline.sent.count;
  const openQuotesTotal: Record<string, number> = {};
  for (const [cur, amt] of Object.entries(pipeline.draft.totalByCurrency)) {
    openQuotesTotal[cur] = (openQuotesTotal[cur] ?? 0) + amt;
  }
  for (const [cur, amt] of Object.entries(pipeline.sent.totalByCurrency)) {
    openQuotesTotal[cur] = (openQuotesTotal[cur] ?? 0) + amt;
  }

  const buckets = [
    {
      key: "quotes",
      label: "Open Quotes",
      count: openQuotesCount,
      total: openQuotesTotal,
      icon: Clock,
      iconClass: "text-brand-copper",
      description: `${pipeline.draft.count} draft + ${pipeline.sent.count} sent`,
      onClick: () => onBucketClick({ state: "quote" }),
    },
    {
      key: "confirmed",
      label: "Confirmed",
      count: pipeline.sale.count,
      total: pipeline.sale.totalByCurrency,
      icon: CheckCircle2,
      iconClass: "text-brand-sage",
      description: "In fulfillment",
      onClick: () => onBucketClick({ state: "sale" }),
    },
    {
      key: "to_invoice",
      label: "To Invoice",
      count: pipeline.toInvoice.count,
      total: pipeline.toInvoice.totalByCurrency,
      icon: FileText,
      iconClass: "text-brand-terracotta",
      description: "Delivered, not billed",
      onClick: () => onBucketClick({ invoiceStatus: "to invoice" }),
    },
    {
      key: "stale",
      label: "Stale Quotes",
      count: pipeline.staleQuotes.count,
      total: pipeline.staleQuotes.totalByCurrency,
      icon: AlertTriangle,
      iconClass: "text-brand-terracotta",
      description: "Quote > 30 days old",
      onClick: () => onBucketClick({ staleOnly: true }),
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

const OrdersPage = () => {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<OrderStateFilter>("all");
  const [invoiceStatus, setInvoiceStatus] = useState<InvoiceStatusFilter>("all");
  const [staleOnly, setStaleOnly] = useState(false);
  const [mineOnly, setMineOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>("date_desc");
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [loading, setLoading] = useState(true);
  const features = useFeatures();
  // Default to "mine only" for sales reps so they don't see everyone's
  // pipeline by default; owners see all because that's their job.
  const [mineDefaultApplied, setMineDefaultApplied] = useState(false);
  useEffect(() => {
    if (mineDefaultApplied || !features.ready) return;
    if (features.role === "sales") setMineOnly(true);
    setMineDefaultApplied(true);
  }, [features.ready, features.role, mineDefaultApplied]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const urlState = sp.get("state");
    const urlInv = sp.get("invoiceStatus");
    const urlStale = sp.get("staleOnly");
    if (urlState) setState(urlState as OrderStateFilter);
    if (urlInv) setInvoiceStatus(urlInv as InvoiceStatusFilter);
    if (urlStale === "true") setStaleOnly(true);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const p = new URLSearchParams();
        if (query) p.set("q", query);
        p.set("state", state);
        p.set("invoiceStatus", invoiceStatus);
        if (staleOnly) p.set("staleOnly", "true");
        p.set("sort", sortBy);
        p.set("limit", "200");
        const res = await fetch(`/api/dashboard/orders?${p.toString()}`);
        const data = await res.json();
        setRows(data.orders ?? []);
        setTotal(data.total ?? 0);
        setPipeline(data.pipeline ?? null);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query, state, invoiceStatus, staleOnly, sortBy]);

  const applyBucket = (f: {
    state?: OrderStateFilter;
    invoiceStatus?: InvoiceStatusFilter;
    staleOnly?: boolean;
  }) => {
    setState(f.state ?? "all");
    setInvoiceStatus(f.invoiceStatus ?? "all");
    setStaleOnly(!!f.staleOnly);
  };

  const activeFilters = useMemo(() => {
    const out: string[] = [];
    if (state !== "all") out.push(state);
    if (invoiceStatus !== "all") out.push(`invoice:${invoiceStatus}`);
    if (staleOnly) out.push("stale only");
    if (mineOnly && features.name) out.push(`mine (${features.name})`);
    return out;
  }, [state, invoiceStatus, staleOnly, mineOnly, features.name]);

  // Apply "mine only" client-side over the already-fetched rows. We do an
  // exact-then-substring match against salesperson because Odoo display names
  // can drift slightly from the portal user's display name (e.g. "Roger F
  // Williams" vs "Roger Williams").
  const visibleRows = useMemo(() => {
    if (!mineOnly || !features.name) return rows;
    const me = features.name.toLowerCase();
    const meParts = me.split(/\s+/).filter(Boolean);
    return rows.filter((r) => {
      const sp = (r.salesperson ?? "").toLowerCase();
      if (!sp) return false;
      if (sp === me) return true;
      // First+last name overlap — handles "Roger F Williams" vs "Roger Williams"
      return meParts.every((part) => sp.includes(part));
    });
  }, [rows, mineOnly, features.name]);

  return (
    <div className="p-6 max-w-[1500px] mx-auto">
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <ShoppingCart className="w-6 h-6 text-dash-accent" />
          <h1 className="font-display text-2xl">Orders & Quotes</h1>
        </div>
        <p className="text-sm text-dash-text-secondary">
          Full sales pipeline — quotes, confirmed orders, and fulfillment status from the live Odoo snapshot.
        </p>
      </header>

      {pipeline && <PipelineHero pipeline={pipeline} onBucketClick={applyBucket} />}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dash-text-secondary" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search order #, customer, salesperson…"
            className="w-full pl-10 pr-4 py-2 border border-dash-border bg-dash-surface text-sm focus:outline-none focus:border-dash-accent rounded"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dash-text-secondary animate-spin" />
          )}
        </div>
        <select
          value={state}
          onChange={(e) => setState(e.target.value as OrderStateFilter)}
          className="px-3 py-2 border border-dash-border bg-dash-surface text-sm focus:outline-none focus:border-dash-accent rounded"
        >
          <option value="all">All states</option>
          <option value="quote">Quotes (draft + sent)</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="sale">Confirmed</option>
          <option value="done">Done</option>
          <option value="cancel">Cancelled</option>
        </select>
        <select
          value={invoiceStatus}
          onChange={(e) => setInvoiceStatus(e.target.value as InvoiceStatusFilter)}
          className="px-3 py-2 border border-dash-border bg-dash-surface text-sm focus:outline-none focus:border-dash-accent rounded"
        >
          <option value="all">All invoice statuses</option>
          <option value="no">Nothing to invoice</option>
          <option value="to invoice">To invoice</option>
          <option value="invoiced">Fully invoiced</option>
          <option value="upselling">Upselling</option>
        </select>
        <label className="inline-flex items-center gap-2 text-xs text-dash-text-secondary px-3 py-2 border border-dash-border bg-dash-surface rounded cursor-pointer">
          <input
            type="checkbox"
            checked={staleOnly}
            onChange={(e) => setStaleOnly(e.target.checked)}
            className="cursor-pointer"
          />
          Stale only
        </label>
        {features.ready && features.name && (
          <label
            className="inline-flex items-center gap-2 text-xs text-dash-text-secondary px-3 py-2 border border-dash-border bg-dash-surface rounded cursor-pointer"
            title={`Filter to orders where salesperson matches "${features.name}"`}
          >
            <input
              type="checkbox"
              checked={mineOnly}
              onChange={(e) => setMineOnly(e.target.checked)}
              className="cursor-pointer"
            />
            Mine only
          </label>
        )}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="px-3 py-2 border border-dash-border bg-dash-surface text-sm focus:outline-none focus:border-dash-accent rounded"
        >
          <option value="date_desc">Newest first</option>
          <option value="date_asc">Oldest first</option>
          <option value="total_desc">Largest total</option>
          <option value="days_open_desc">Open longest</option>
          <option value="partner">Customer A-Z</option>
        </select>
      </div>

      <div className="mb-2 text-xs text-dash-text-secondary">
        {visibleRows.length.toLocaleString()} of {total.toLocaleString()} order
        {total === 1 ? "" : "s"}
        {activeFilters.length > 0 && <> · filtered: {activeFilters.join(", ")}</>}
      </div>

      <div className="bg-dash-surface border border-dash-border rounded">
        <DataTable columns={columns} data={visibleRows} />
      </div>
    </div>
  );
};

export default OrdersPage;
