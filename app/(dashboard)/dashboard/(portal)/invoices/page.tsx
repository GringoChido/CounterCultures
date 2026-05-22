"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createColumnHelper } from "@tanstack/react-table";
import {
  Receipt,
  Search,
  Loader2,
  AlertCircle,
  FileCheck,
  FileX,
  FileClock,
  MessageCircle,
} from "lucide-react";
import { DataTable } from "@/app/(dashboard)/components/data-table";
import { StatusBadge, type BadgeVariant } from "@/app/(dashboard)/components/status-badge";

import { useFeatures } from "@/app/lib/use-features";

type MoveTypeFilter = "all" | "customer" | "vendor" | "refund";
type PaymentStateFilter = "all" | "open" | "paid" | "overdue";
type AgingBucket = "current" | "0-30" | "30-60" | "60-90" | "90+";
type SortBy = "date_desc" | "date_asc" | "residual_desc" | "days_overdue_desc" | "partner";

interface InvoiceRow {
  id: string;
  name: string;
  moveType: string;
  state: string;
  partnerId: string;
  partnerName: string;
  salesperson: string;
  date: string;
  dueDate: string;
  total: number;
  residual: number;
  currency: string;
  paymentState: string;
  cfdiUuid: string;
  cfdiPolicy: string;
  cfdiState: string;
  origin: string;
  daysOverdue: number;
  agingBucket: AgingBucket | null;
  isOverdue: boolean;
}

interface ARAging {
  current: Record<string, number>;
  "0-30": Record<string, number>;
  "30-60": Record<string, number>;
  "60-90": Record<string, number>;
  "90+": Record<string, number>;
  totalOpen: Record<string, number>;
  invoiceCount: number;
  overdueCount: number;
}

const fmt = (n: number, cur = "MXN") =>
  !n ? "—" : `$${Math.round(n).toLocaleString()} ${cur}`;

const sumAllCurrencies = (rec: Record<string, number>) =>
  Object.entries(rec)
    .map(([cur, amt]) => `$${Math.round(amt).toLocaleString()} ${cur}`)
    .join(" + ") || "—";

const paymentStateVariant = (ps: string): BadgeVariant => {
  if (ps === "paid") return "success";
  if (ps === "partial") return "warning";
  if (ps === "not_paid") return "danger";
  if (ps === "reversed") return "info";
  if (ps === "in_payment") return "info";
  return "info";
};

const agingColor = (bucket: AgingBucket) => {
  if (bucket === "current") return "text-brand-sage";
  if (bucket === "0-30") return "text-brand-copper";
  if (bucket === "30-60") return "text-brand-terracotta";
  if (bucket === "60-90") return "text-brand-terracotta";
  return "text-status-lost"; // 90+
};

const columnHelper = createColumnHelper<InvoiceRow>();

const columns = [
  columnHelper.accessor("name", {
    header: "Invoice #",
    cell: (info) => {
      const r = info.row.original;
      return (
        <Link
          href={`/dashboard/invoices/${r.id}`}
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
  columnHelper.accessor("date", {
    header: "Issued",
    cell: (info) => <span className="text-xs">{info.getValue() || "—"}</span>,
  }),
  columnHelper.accessor("dueDate", {
    header: "Due",
    cell: (info) => {
      const r = info.row.original;
      const v = info.getValue();
      if (!v) return <span className="text-xs text-dash-text-secondary">—</span>;
      return (
        <span className={`text-xs ${r.isOverdue ? "text-brand-terracotta font-medium" : ""}`}>
          {v}
          {r.isOverdue && (
            <span className="ml-1 text-[10px]">({r.daysOverdue}d late)</span>
          )}
        </span>
      );
    },
  }),
  columnHelper.accessor("paymentState", {
    header: "Payment",
    cell: (info) => {
      const v = info.getValue();
      if (!v) return <span className="text-xs text-dash-text-secondary">—</span>;
      return (
        <StatusBadge
          label={v.replace("_", " ")}
          variant={paymentStateVariant(v)}
        />
      );
    },
  }),
  columnHelper.accessor("cfdiPolicy", {
    header: "CFDI",
    cell: (info) => {
      const r = info.row.original;
      if (!r.cfdiUuid) return <span className="text-xs text-dash-text-secondary">—</span>;
      return (
        <span
          title={r.cfdiUuid}
          className="font-mono text-[10px] text-dash-text-secondary"
        >
          {r.cfdiPolicy || "?"} · {r.cfdiUuid.slice(0, 8)}
        </span>
      );
    },
  }),
  columnHelper.accessor("total", {
    header: "Total",
    cell: (info) => {
      const r = info.row.original;
      const neg = r.moveType === "out_refund" || r.moveType === "in_refund";
      return (
        <span className={`text-right block ${neg ? "text-brand-terracotta" : ""}`}>
          {fmt(r.total, r.currency)}
        </span>
      );
    },
  }),
  columnHelper.accessor("residual", {
    header: "Balance",
    cell: (info) => {
      const r = info.row.original;
      if (r.residual <= 0.01) return <span className="text-xs text-dash-text-secondary">—</span>;
      return (
        <span className="text-right block font-medium text-brand-terracotta">
          {fmt(r.residual, r.currency)}
        </span>
      );
    },
  }),
];

const AgingHero = ({ aging }: { aging: ARAging }) => {
  const buckets: { key: AgingBucket; label: string; description: string }[] = [
    { key: "current", label: "Current", description: "Not yet due" },
    { key: "0-30", label: "0–30d", description: "Overdue 1–30 days" },
    { key: "30-60", label: "30–60d", description: "Overdue 31–60 days" },
    { key: "60-90", label: "60–90d", description: "Overdue 61–90 days" },
    { key: "90+", label: "90d+", description: "Overdue 90+ days" },
  ];
  return (
    <div className="bg-dash-surface border border-dash-border rounded p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-sm uppercase tracking-wider text-dash-text-secondary">
            Accounts Receivable Aging
          </h2>
          <p className="text-2xl font-semibold text-dash-text mt-1">
            {sumAllCurrencies(aging.totalOpen)}
          </p>
          <p className="text-xs text-dash-text-secondary mt-1">
            {aging.invoiceCount} open invoice{aging.invoiceCount === 1 ? "" : "s"}
            {aging.overdueCount > 0 && (
              <>
                {" · "}
                <span className="text-brand-terracotta">{aging.overdueCount} overdue</span>
              </>
            )}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {buckets.map((b) => (
          <Link
            key={b.key}
            href={`/dashboard/invoices?paymentState=open&agingBucket=${b.key}`}
            className="bg-dash-bg border border-dash-border p-3 rounded hover:border-dash-accent transition-colors"
          >
            <div className={`text-[10px] uppercase tracking-wider ${agingColor(b.key)}`}>
              {b.label}
            </div>
            <div className="text-sm font-semibold text-dash-text mt-1 leading-tight">
              {sumAllCurrencies(aging[b.key])}
            </div>
            <div className="text-[10px] text-dash-text-secondary mt-1">{b.description}</div>
          </Link>
        ))}
      </div>
    </div>
  );
};

const InvoicesPage = () => {
  const [query, setQuery] = useState("");
  const [moveType, setMoveType] = useState<MoveTypeFilter>("customer");
  const [paymentState, setPaymentState] = useState<PaymentStateFilter>("all");
  const [agingBucket, setAgingBucket] = useState<AgingBucket | "">("");
  const [sortBy, setSortBy] = useState<SortBy>("date_desc");
  const [mineOnly, setMineOnly] = useState(false);
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [total, setTotal] = useState(0);
  const [aging, setAging] = useState<ARAging | null>(null);
  const [loading, setLoading] = useState(true);
  const features = useFeatures();
  const [mineDefaultApplied, setMineDefaultApplied] = useState(false);
  useEffect(() => {
    if (mineDefaultApplied || !features.ready) return;
    if (features.role === "sales") setMineOnly(true);
    setMineDefaultApplied(true);
  }, [features.ready, features.role, mineDefaultApplied]);

  // Initialize filter state from URL query params on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const urlPs = sp.get("paymentState") as PaymentStateFilter | null;
    const urlAging = sp.get("agingBucket") as AgingBucket | null;
    const urlMove = sp.get("moveType") as MoveTypeFilter | null;
    if (urlPs && ["all", "open", "paid", "overdue"].includes(urlPs)) setPaymentState(urlPs);
    if (urlAging && ["current", "0-30", "30-60", "60-90", "90+"].includes(urlAging))
      setAgingBucket(urlAging);
    if (urlMove && ["all", "customer", "vendor", "refund"].includes(urlMove)) setMoveType(urlMove);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const p = new URLSearchParams();
        if (query) p.set("q", query);
        p.set("moveType", moveType);
        p.set("paymentState", paymentState);
        if (agingBucket) p.set("agingBucket", agingBucket);
        p.set("sort", sortBy);
        p.set("limit", "200");
        const res = await fetch(`/api/dashboard/invoices?${p.toString()}`);
        const data = await res.json();
        setRows(data.invoices ?? []);
        setTotal(data.total ?? 0);
        setAging(data.aging ?? null);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query, moveType, paymentState, agingBucket, sortBy]);

  const activeFilters = useMemo(() => {
    const out: string[] = [];
    if (moveType !== "all") out.push(moveType);
    if (paymentState !== "all") out.push(paymentState);
    if (agingBucket) out.push(agingBucket);
    if (mineOnly && features.name) out.push(`mine (${features.name})`);
    return out;
  }, [moveType, paymentState, agingBucket, mineOnly, features.name]);

  // Client-side "mine only" filter — exact-then-token-overlap match against
  // invoice_user_id (salesperson display name).
  const visibleRows = useMemo(() => {
    if (!mineOnly || !features.name) return rows;
    const me = features.name.toLowerCase();
    const meParts = me.split(/\s+/).filter(Boolean);
    return rows.filter((r) => {
      const sp = (r.salesperson ?? "").toLowerCase();
      if (!sp) return false;
      if (sp === me) return true;
      return meParts.every((part) => sp.includes(part));
    });
  }, [rows, mineOnly, features.name]);

  return (
    <div className="p-6 max-w-[1500px] mx-auto">
      <header className="mb-6">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <Receipt className="w-6 h-6 text-dash-accent" />
            <h1 className="font-display text-2xl">Invoices</h1>
          </div>

        </div>
        <p className="text-sm text-dash-text-secondary">
          Customer invoices, vendor bills, credit notes — from the live Odoo snapshot.
        </p>
      </header>

      {aging && <AgingHero aging={aging} />}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dash-text-secondary" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search invoice #, customer, CFDI, origin…"
            className="w-full pl-10 pr-4 py-2 border border-dash-border bg-dash-surface text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:border-dash-accent rounded"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dash-text-secondary animate-spin" />
          )}
        </div>
        <select
          value={moveType}
          onChange={(e) => setMoveType(e.target.value as MoveTypeFilter)}
          className="px-3 py-2 border border-dash-border bg-dash-surface text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:border-dash-accent rounded"
        >
          <option value="customer">Customer invoices</option>
          <option value="vendor">Vendor bills</option>
          <option value="refund">Refunds / credit notes</option>
          <option value="all">All</option>
        </select>
        <select
          value={paymentState}
          onChange={(e) => setPaymentState(e.target.value as PaymentStateFilter)}
          className="px-3 py-2 border border-dash-border bg-dash-surface text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:border-dash-accent rounded"
        >
          <option value="all">All payment statuses</option>
          <option value="open">Open (not paid / partial)</option>
          <option value="overdue">Overdue</option>
          <option value="paid">Paid</option>
        </select>
        <select
          value={agingBucket}
          onChange={(e) => setAgingBucket(e.target.value as AgingBucket | "")}
          className="px-3 py-2 border border-dash-border bg-dash-surface text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:border-dash-accent rounded"
        >
          <option value="">All ages</option>
          <option value="current">Current</option>
          <option value="0-30">0–30 days</option>
          <option value="30-60">30–60 days</option>
          <option value="60-90">60–90 days</option>
          <option value="90+">90+ days</option>
        </select>
        {features.ready && features.name && (
          <label
            className="inline-flex items-center gap-2 text-xs text-dash-text-secondary px-3 py-2 border border-dash-border bg-dash-surface rounded cursor-pointer"
            title={`Filter to invoices where salesperson matches "${features.name}"`}
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
          className="px-3 py-2 border border-dash-border bg-dash-surface text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:border-dash-accent rounded"
        >
          <option value="date_desc">Newest first</option>
          <option value="date_asc">Oldest first</option>
          <option value="days_overdue_desc">Most overdue</option>
          <option value="residual_desc">Largest balance</option>
          <option value="partner">Customer A-Z</option>
        </select>
      </div>

      <div className="mb-2 text-xs text-dash-text-secondary">
        {visibleRows.length.toLocaleString()} of {total.toLocaleString()} invoice
        {total === 1 ? "" : "s"}
        {activeFilters.length > 0 && <> · filtered: {activeFilters.join(", ")}</>}
      </div>

      <div className="bg-dash-surface border border-dash-border rounded">
        <DataTable columns={columns} data={visibleRows} />
      </div>
    </div>
  );
};

export default InvoicesPage;
