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
import { formatDate } from "@/app/lib/format-date";

import { useCurrentUser } from "@/app/lib/use-current-user";
import {
  MineAllToggle,
  matchesUser,
  readPersistedMode,
  type MineAllMode,
} from "@/app/(dashboard)/components/mine-all-toggle";

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
  isPaid: boolean;
  isDelivered: boolean;
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
    cell: (info) => <span className="text-xs">{formatDate(info.getValue())}</span>,
  }),
  columnHelper.accessor("state", {
    header: "Status",
    cell: (info) => {
      const r = info.row.original;
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          <StatusBadge label={info.getValue()} variant={stateVariant(info.getValue())} />
          {r.isPaid && <StatusBadge label="Paid" variant="success" />}
          {r.isDelivered && <StatusBadge label="Delivered" variant="in-progress" />}
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
  }) => void;
}) => {
  const quotesCount = pipeline.draft.count + pipeline.sent.count;
  const quotesTotal: Record<string, number> = {};
  for (const [cur, amt] of Object.entries(pipeline.draft.totalByCurrency)) {
    quotesTotal[cur] = (quotesTotal[cur] ?? 0) + amt;
  }
  for (const [cur, amt] of Object.entries(pipeline.sent.totalByCurrency)) {
    quotesTotal[cur] = (quotesTotal[cur] ?? 0) + amt;
  }

  const buckets = [
    {
      key: "quotes",
      label: "Quotes",
      count: quotesCount,
      total: quotesTotal,
      icon: Clock,
      iconClass: "text-brand-copper",
      description: `${pipeline.draft.count} draft + ${pipeline.sent.count} sent`,
      onClick: () => onBucketClick({ state: "quote" }),
    },
    {
      key: "sales",
      label: "Sales",
      count: pipeline.sale.count,
      total: pipeline.sale.totalByCurrency,
      icon: CheckCircle2,
      iconClass: "text-brand-sage",
      description: "Confirmed sales orders",
      onClick: () => onBucketClick({ state: "sale" }),
    },
    {
      key: "invoices",
      label: "Invoices",
      count: pipeline.toInvoice.count,
      total: pipeline.toInvoice.totalByCurrency,
      icon: FileText,
      iconClass: "text-brand-terracotta",
      description: "To invoice",
      onClick: () => onBucketClick({ invoiceStatus: "to invoice" }),
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
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
  const [sortBy, setSortBy] = useState<SortBy>("date_desc");
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useCurrentUser();
  const [repMode, setRepMode] = useState<MineAllMode>("all");
  // Hydrate Mine/All from localStorage once the user resolves; falls back to
  // the role default (sales=mine, owner/finance=all). Same scope/key pattern
  // as leads + pipeline so the choice persists per user.
  useEffect(() => {
    if (currentUser) setRepMode(readPersistedMode(currentUser, "orders"));
  }, [currentUser]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const urlState = sp.get("state");
    const urlInv = sp.get("invoiceStatus");
    if (urlState) setState(urlState as OrderStateFilter);
    if (urlInv) setInvoiceStatus(urlInv as InvoiceStatusFilter);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const p = new URLSearchParams();
        if (query) p.set("q", query);
        p.set("state", state);
        p.set("invoiceStatus", invoiceStatus);
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
  }, [query, state, invoiceStatus, sortBy]);

  const applyBucket = (f: {
    state?: OrderStateFilter;
    invoiceStatus?: InvoiceStatusFilter;
  }) => {
    setState(f.state ?? "all");
    setInvoiceStatus(f.invoiceStatus ?? "all");
  };

  const activeFilters = useMemo(() => {
    const out: string[] = [];
    if (state !== "all") out.push(state);
    if (invoiceStatus !== "all") out.push(`invoice:${invoiceStatus}`);
    if (repMode === "mine" && currentUser?.name) out.push(`mine (${currentUser.name})`);
    return out;
  }, [state, invoiceStatus, repMode, currentUser?.name]);

  // Apply Mine filter client-side. matchesUser handles the canonical email
  // and accent-normalized name match (consistent with leads + pipeline).
  // Word-overlap fallback stays in for orders specifically because the
  // salesperson string comes from Odoo and can drift from the portal user's
  // display name (e.g. "Roger F Williams" vs "Roger Williams").
  const visibleRows = useMemo(() => {
    if (repMode !== "mine" || !currentUser) return rows;
    const meName = (currentUser.name ?? "").toLowerCase();
    const meParts = meName.split(/\s+/).filter(Boolean);
    return rows.filter((r) => {
      const sp = r.salesperson ?? "";
      if (matchesUser(sp, currentUser)) return true;
      if (!meName) return false;
      const spLower = sp.toLowerCase();
      if (!spLower) return false;
      return meParts.length > 0 && meParts.every((part) => spLower.includes(part));
    });
  }, [rows, repMode, currentUser]);

  return (
    <div className="p-6 max-w-[1500px] mx-auto">
      <header className="mb-6">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-6 h-6 text-dash-accent" />
            <h1 className="font-display text-2xl">Orders & Quotes</h1>
          </div>

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
            className="w-full pl-10 pr-4 py-2 border border-dash-border bg-dash-surface text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:border-dash-accent rounded"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dash-text-secondary animate-spin" />
          )}
        </div>
        <select
          value={state}
          onChange={(e) => setState(e.target.value as OrderStateFilter)}
          className="px-3 py-2 border border-dash-border bg-dash-surface text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:border-dash-accent rounded"
        >
          <option value="all">All statuses</option>
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
          className="px-3 py-2 border border-dash-border bg-dash-surface text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:border-dash-accent rounded"
        >
          <option value="all">All invoice statuses</option>
          <option value="no">Nothing to invoice</option>
          <option value="to invoice">To invoice</option>
          <option value="invoiced">Fully invoiced</option>
          <option value="upselling">Upselling</option>
        </select>
        <MineAllToggle
          user={currentUser}
          scope="orders"
          mode={repMode}
          onChange={setRepMode}
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="px-3 py-2 border border-dash-border bg-dash-surface text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:border-dash-accent rounded"
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
