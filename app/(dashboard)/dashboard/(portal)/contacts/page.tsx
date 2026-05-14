"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Loader2,
  Building2,
  User,
} from "lucide-react";
import { DataTable } from "@/app/(dashboard)/components/data-table";
import { ClassificationBadge } from "@/app/(dashboard)/components/classification-badge";
import { createColumnHelper } from "@tanstack/react-table";
import {
  CONTACT_CLASSIFICATIONS,
  CLASSIFICATION_COLORS,
  type ContactClassification,
  type CrmContact,
} from "@/app/lib/contact-classifications";

const columnHelper = createColumnHelper<CrmContact>();

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
          {row.company ? (
            <Building2 className="w-4 h-4 text-dash-text-secondary shrink-0" />
          ) : (
            <User className="w-4 h-4 text-dash-text-secondary shrink-0" />
          )}
          <div className="min-w-0">
            <span className="font-medium block truncate">{info.getValue()}</span>
            {row.company && (
              <span className="text-[11px] text-dash-text-secondary block truncate">
                {row.company}
              </span>
            )}
          </div>
        </Link>
      );
    },
  }),
  columnHelper.accessor("classifications", {
    header: "Classifications",
    cell: (info) => {
      const classifications = info.getValue();
      if (!classifications.length) {
        return (
          <span className="text-xs text-dash-text-muted italic">Unclassified</span>
        );
      }
      return (
        <div className="flex flex-wrap gap-1">
          {classifications.map((c) => (
            <ClassificationBadge key={c} classification={c} size="xs" />
          ))}
        </div>
      );
    },
  }),
  columnHelper.accessor("email", {
    header: "Email",
    cell: (info) => (
      <span className="text-xs text-dash-text-secondary truncate block max-w-[200px]">
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
  columnHelper.accessor("type", {
    header: "Type",
    cell: (info) => (
      <span className="text-xs text-dash-text-secondary">
        {info.getValue() || "—"}
      </span>
    ),
  }),
];

const ContactsPage = () => {
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [classFilters, setClassFilters] = useState<ContactClassification[]>([]);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (classFilters.length > 0) params.set("classifications", classFilters.join(","));
      const res = await fetch(`/api/dashboard/contacts?${params.toString()}`);
      const data = await res.json();
      setContacts(data.contacts ?? []);
    } finally {
      setLoading(false);
    }
  }, [query, classFilters]);

  useEffect(() => {
    const id = setTimeout(fetchContacts, 200);
    return () => clearTimeout(id);
  }, [fetchContacts]);

  const toggleClassFilter = (c: ContactClassification) => {
    setClassFilters((prev) =>
      prev.includes(c) ? prev.filter((f) => f !== c) : [...prev, c]
    );
  };

  const columns = useMemo(() => buildColumns(), []);

  const classifiedCount = contacts.filter((c) => c.classifications.length > 0).length;

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-6 h-6 text-dash-accent" />
          <h1 className="font-display text-2xl">Contacts</h1>
        </div>
        <p className="text-sm text-dash-text-secondary">
          CRM contacts with classifications. {contacts.length} contact{contacts.length !== 1 ? "s" : ""} shown, {classifiedCount} classified.
        </p>
      </header>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dash-text-secondary" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, phone, company…"
            className="w-full pl-10 pr-4 py-2 border border-dash-border bg-dash-surface text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:border-dash-accent rounded"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dash-text-secondary animate-spin" />
          )}
        </div>
      </div>

      {/* Classification filter chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-xs text-dash-text-muted self-center mr-1">Filter:</span>
        {CONTACT_CLASSIFICATIONS.map((c) => {
          const active = classFilters.includes(c);
          const colors = CLASSIFICATION_COLORS[c];
          return (
            <button
              key={c}
              type="button"
              onClick={() => toggleClassFilter(c)}
              className={`px-2.5 py-1 text-xs rounded-full border transition-colors cursor-pointer ${
                active
                  ? `${colors.bg} ${colors.text} border-current font-medium`
                  : "bg-dash-surface text-dash-text-secondary border-dash-border hover:border-dash-accent"
              }`}
            >
              {c}
            </button>
          );
        })}
        {classFilters.length > 0 && (
          <button
            type="button"
            onClick={() => setClassFilters([])}
            className="px-2.5 py-1 text-xs text-dash-text-muted hover:text-dash-text transition-colors cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      <div className="bg-dash-surface border border-dash-border rounded">
        <DataTable columns={columns} data={contacts} pageSize={25} />
      </div>
    </div>
  );
};

export default ContactsPage;
