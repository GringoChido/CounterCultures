"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createColumnHelper } from "@tanstack/react-table";
import { Users, Search, Loader2, AlertCircle, Building2, User } from "lucide-react";
import { DataTable } from "@/app/(dashboard)/components/data-table";
import { StatusBadge, type BadgeVariant } from "@/app/(dashboard)/components/status-badge";

interface CustomerListRow {
  id: string;
  name: string;
  display_name: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  isCompany: boolean;
  customerRank: number;
  supplierRank: number;
  vat: string;
  fiscalRegime: string;
  invoiceCount: number;
  orderCount: number;
  quoteCount: number;
  outstanding: number;
  outstandingCurrency: string;
  totalInvoiced: number;
  lastActivity: string | null;
}

type TypeFilter = "all" | "customer" | "vendor" | "open_ar";
type SortBy = "activity" | "name" | "outstanding" | "invoiced";

const typeLabels: Record<TypeFilter, string> = {
  all: "All",
  customer: "Customers",
  vendor: "Vendors",
  open_ar: "Open AR",
};

const formatCurrency = (n: number, cur: string) => {
  if (!n) return "—";
  return `$${Math.round(n).toLocaleString()} ${cur}`;
};

const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  return iso.slice(0, 10);
};

const columnHelper = createColumnHelper<CustomerListRow>();

const buildColumns = () => [
  columnHelper.accessor("name", {
    header: "Name",
    cell: (info) => {
      const row = info.row.original;
      return (
        <Link
          href={`/dashboard/customers/${row.id}`}
          className="flex items-center gap-2 hover:text-dash-accent"
        >
          {row.isCompany ? (
            <Building2 className="w-4 h-4 text-dash-text-secondary" />
          ) : (
            <User className="w-4 h-4 text-dash-text-secondary" />
          )}
          <span className="font-medium">{info.getValue()}</span>
        </Link>
      );
    },
  }),
  columnHelper.accessor("email", {
    header: "Email",
    cell: (info) => (
      <span className="text-xs text-dash-text-secondary">
        {info.getValue() || "—"}
      </span>
    ),
  }),
  columnHelper.accessor("city", {
    header: "Location",
    cell: (info) => {
      const r = info.row.original;
      return (
        <span className="text-xs text-dash-text-secondary">
          {[r.city, r.country].filter(Boolean).join(", ") || "—"}
        </span>
      );
    },
  }),
  columnHelper.accessor("vat", {
    header: "RFC",
    cell: (info) => (
      <span className="font-mono text-xs">{info.getValue() || "—"}</span>
    ),
  }),
  columnHelper.accessor("orderCount", {
    header: "Orders",
    cell: (info) => {
      const r = info.row.original;
      return (
        <span className="text-xs">
          {r.orderCount}
          {r.quoteCount > 0 && (
            <span className="text-dash-text-secondary"> · {r.quoteCount}q</span>
          )}
        </span>
      );
    },
  }),
  columnHelper.accessor("totalInvoiced", {
    header: "Lifetime",
    cell: (info) => {
      const r = info.row.original;
      if (!r.totalInvoiced) return <span className="text-xs text-dash-text-secondary">—</span>;
      return (
        <span className="text-xs font-medium">
          ${Math.round(r.totalInvoiced).toLocaleString()}
        </span>
      );
    },
  }),
  columnHelper.accessor("outstanding", {
    header: "Open AR",
    cell: (info) => {
      const r = info.row.original;
      if (!r.outstanding) return <span className="text-xs text-dash-text-secondary">—</span>;
      const variant: BadgeVariant = r.outstanding > 50000 ? "danger" : "warning";
      return (
        <StatusBadge
          label={formatCurrency(r.outstanding, r.outstandingCurrency)}
          variant={variant}
        />
      );
    },
  }),
  columnHelper.accessor("lastActivity", {
    header: "Last Activity",
    cell: (info) => (
      <span className="text-xs text-dash-text-secondary">
        {formatDate(info.getValue())}
      </span>
    ),
  }),
];

const CustomersPage = () => {
  const [rows, setRows] = useState<CustomerListRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("customer");
  const [sortBy, setSortBy] = useState<SortBy>("activity");

  useEffect(() => {
    const id = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        params.set("type", typeFilter);
        params.set("sort", sortBy);
        params.set("limit", "500");
        const res = await fetch(`/api/dashboard/customers?${params.toString()}`);
        const data = await res.json();
        setRows(data.customers ?? []);
        setTotal(data.total ?? 0);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(id);
  }, [query, typeFilter, sortBy]);

  const columns = useMemo(() => buildColumns(), []);

  // Aggregate KPIs from what's loaded
  const totalOutstanding = rows.reduce((s, r) => s + r.outstanding, 0);
  const countWithAR = rows.filter((r) => r.outstanding > 0).length;
  const totalInvoiced = rows.reduce((s, r) => s + r.totalInvoiced, 0);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-6 h-6 text-dash-accent" />
          <h1 className="font-display text-2xl">Customers</h1>
        </div>
        <p className="text-sm text-dash-text-secondary">
          All {total.toLocaleString()} partners from Odoo, with full order + invoice + payment history.
        </p>
      </header>

      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-dash-surface border border-dash-border p-4 rounded">
          <div className="text-xs uppercase tracking-wider text-dash-text-secondary mb-1">
            Open AR (total)
          </div>
          <div className="text-2xl font-semibold text-dash-text">
            ${Math.round(totalOutstanding).toLocaleString()}
          </div>
          <div className="text-xs text-dash-text-secondary mt-1">
            {countWithAR} customers with balance
          </div>
        </div>
        <div className="bg-dash-surface border border-dash-border p-4 rounded">
          <div className="text-xs uppercase tracking-wider text-dash-text-secondary mb-1">
            Lifetime invoiced
          </div>
          <div className="text-2xl font-semibold text-dash-text">
            ${Math.round(totalInvoiced).toLocaleString()}
          </div>
          <div className="text-xs text-dash-text-secondary mt-1">
            Posted customer invoices (all time)
          </div>
        </div>
        <div className="bg-dash-surface border border-dash-border p-4 rounded">
          <div className="text-xs uppercase tracking-wider text-dash-text-secondary mb-1">
            Showing
          </div>
          <div className="text-2xl font-semibold text-dash-text">{rows.length.toLocaleString()}</div>
          <div className="text-xs text-dash-text-secondary mt-1">of {total.toLocaleString()} filtered</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dash-text-secondary" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, phone, RFC, city…"
            className="w-full pl-10 pr-4 py-2 border border-dash-border bg-dash-surface text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:border-dash-accent rounded"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dash-text-secondary animate-spin" />
          )}
        </div>
        <div className="flex gap-2">
          {(["all", "customer", "vendor", "open_ar"] as TypeFilter[]).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-2 text-xs uppercase tracking-wider rounded border transition-colors ${
                typeFilter === t
                  ? "bg-dash-accent text-white border-dash-accent"
                  : "bg-dash-surface text-dash-text-secondary border-dash-border hover:border-dash-accent"
              }`}
            >
              {typeLabels[t]}
            </button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="px-3 py-2 border border-dash-border bg-dash-surface text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:border-dash-accent rounded"
        >
          <option value="activity">Most recent activity</option>
          <option value="name">Name A-Z</option>
          <option value="outstanding">Largest open AR</option>
          <option value="invoiced">Lifetime value</option>
        </select>
      </div>

      {typeFilter === "open_ar" && countWithAR === 0 && !loading && (
        <div className="bg-dash-surface border border-dash-border p-4 rounded text-center text-sm text-dash-text-secondary mb-4 flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4" />
          No open AR matching current filter.
        </div>
      )}

      <div className="bg-dash-surface border border-dash-border rounded">
        <DataTable columns={columns} data={rows} />
      </div>
    </div>
  );
};

export default CustomersPage;
