"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createColumnHelper } from "@tanstack/react-table";
import { Users, Search, Loader2, Building2, User } from "lucide-react";
import { DataTable } from "@/app/(dashboard)/components/data-table";

interface PartnerDirectoryRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  isCompany: boolean;
  customerRank: number;
  supplierRank: number;
  vat: string;
  category: string;
}

const columnHelper = createColumnHelper<PartnerDirectoryRow>();

const buildColumns = () => [
  columnHelper.accessor("name", {
    header: "Name",
    cell: (info) => {
      const row = info.row.original;
      return (
        <Link
          href={`/dashboard/contacts/${row.id}`}
          className="flex items-center gap-2 hover:text-dash-accent"
        >
          {row.isCompany ? (
            <Building2 className="w-4 h-4 text-dash-text-secondary shrink-0" />
          ) : (
            <User className="w-4 h-4 text-dash-text-secondary shrink-0" />
          )}
          <span className="font-medium">{info.getValue()}</span>
        </Link>
      );
    },
  }),
  columnHelper.accessor("email", {
    header: "Email",
    cell: (info) => (
      <span className="text-xs text-dash-text-secondary truncate block max-w-[220px]">
        {info.getValue() || "—"}
      </span>
    ),
  }),
  columnHelper.accessor("phone", {
    header: "Phone",
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
  columnHelper.display({
    id: "role",
    header: "Role",
    cell: (info) => {
      const r = info.row.original;
      const tags: string[] = [];
      if (r.customerRank > 0) tags.push("Customer");
      if (r.supplierRank > 0) tags.push("Vendor");
      if (tags.length === 0) return <span className="text-xs text-dash-text-muted italic">—</span>;
      return (
        <div className="flex gap-1">
          {tags.map((t) => (
            <span
              key={t}
              className="px-1.5 py-0.5 text-[11px] rounded bg-dash-surface-2 text-dash-text-secondary"
            >
              {t}
            </span>
          ))}
        </div>
      );
    },
  }),
];

const ContactsPage = () => {
  const [rows, setRows] = useState<PartnerDirectoryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const id = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        const res = await fetch(`/api/dashboard/partners?${params.toString()}`);
        const data = await res.json();
        setRows(data.partners ?? []);
        setTotal(data.total ?? 0);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(id);
  }, [query]);

  const columns = useMemo(() => buildColumns(), []);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-6 h-6 text-dash-accent" />
          <h1 className="font-display text-2xl">Contacts</h1>
        </div>
        <p className="text-sm text-dash-text-secondary">
          Full partner directory from Odoo — {total.toLocaleString()} contacts.
        </p>
      </header>

      {/* Search */}
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
      </div>

      <div className="bg-dash-surface border border-dash-border rounded">
        <DataTable columns={columns} data={rows} pageSize={50} />
      </div>
    </div>
  );
};

export default ContactsPage;
