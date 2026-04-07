"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { format, differenceInDays, isPast, parseISO } from "date-fns";
import { Plus, Filter, Download, Mail, MessageCircle, ClipboardList, Loader2 } from "lucide-react";
import { DataTable } from "@/app/(dashboard)/components/data-table";
import { StatusBadge, type BadgeVariant } from "@/app/(dashboard)/components/status-badge";
import { SlideOut } from "@/app/(dashboard)/components/slide-out";
import { KPICard } from "@/app/(dashboard)/components/kpi-card";

// Shape matching Google Sheets Leads tab
interface SheetLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  contact_type: string;
  interest: string;
  value: string;
  created_at: string;
  next_followup: string;
}

// UI-friendly lead derived from sheet data
interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  contactType: string;
  interest: string;
  value: string;
  createdAt: string;
  nextFollowUp: string;
}

const mapSheetLead = (s: SheetLead): Lead => ({
  id: s.id,
  name: s.name,
  email: s.email,
  phone: s.phone,
  source: s.source,
  status: s.status || "new",
  contactType: s.contact_type,
  interest: s.interest,
  value: s.value,
  createdAt: s.created_at,
  nextFollowUp: s.next_followup,
});

const statusVariants: Record<string, BadgeVariant> = {
  new: "new",
  contacted: "contacted",
  qualified: "qualified",
  proposal: "proposal",
  won: "won",
  lost: "lost",
};

const statusOptions = ["all", "new", "contacted", "qualified", "proposal", "won", "lost"] as const;
const sourceOptions = ["all", "Showroom Walk-in", "Website Contact Form", "Instagram", "WhatsApp", "Trade Program", "Referral"] as const;

const columnHelper = createColumnHelper<Lead>();

const FollowUpIndicator = ({ dateStr }: { dateStr?: string }) => {
  if (!dateStr) return <span className="text-dash-text-secondary">&mdash;</span>;
  try {
    const overdue = isPast(parseISO(dateStr));
    return (
      <span className={`text-xs ${overdue ? "text-red-400 font-medium" : "text-dash-text-secondary"}`}>
        {format(parseISO(dateStr), "MMM d")}
        {overdue && " (overdue)"}
      </span>
    );
  } catch {
    return <span className="text-xs text-dash-text-secondary">{dateStr}</span>;
  }
};

const columns = [
  columnHelper.accessor("name", {
    header: "Name",
    cell: (info) => (
      <div>
        <p className="font-medium">{info.getValue()}</p>
        <p className="text-xs text-dash-text-secondary">{info.row.original.email}</p>
      </div>
    ),
  }),
  columnHelper.accessor("source", {
    header: "Source",
    cell: (info) => (
      <span className="text-xs text-dash-text-secondary">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => (
      <StatusBadge
        label={info.getValue()}
        variant={statusVariants[info.getValue()] ?? "new"}
      />
    ),
  }),
  columnHelper.accessor("contactType", {
    header: "Type",
    cell: (info) => {
      const val = info.getValue();
      return val ? <span className="text-xs text-dash-text-secondary">{val}</span> : <span className="text-dash-text-secondary">&mdash;</span>;
    },
  }),
  columnHelper.accessor("interest", {
    header: "Interest",
    cell: (info) => info.getValue() || <span className="text-dash-text-secondary">&mdash;</span>,
  }),
  columnHelper.accessor("value", {
    header: "Value",
    cell: (info) => info.getValue() || <span className="text-dash-text-secondary">&mdash;</span>,
  }),
  columnHelper.accessor("nextFollowUp", {
    header: "Follow-Up",
    cell: (info) => <FollowUpIndicator dateStr={info.getValue()} />,
  }),
  columnHelper.display({
    id: "actions",
    header: "Actions",
    cell: (info) => {
      const lead = info.row.original;
      const waPhone = lead.phone.replace(/\s+/g, "").replace(/^\+/, "");
      return (
        <div className="flex items-center gap-1.5">
          <a
            href={`https://wa.me/${waPhone}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-emerald-500/10 text-emerald-400 transition-colors"
            title="WhatsApp"
          >
            <MessageCircle className="w-3.5 h-3.5" />
          </a>
          <a
            href={`mailto:${lead.email}`}
            onClick={(e) => e.stopPropagation()}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-blue-500/10 text-blue-400 transition-colors"
            title="Email"
          >
            <Mail className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={(e) => e.stopPropagation()}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-brand-copper/10 text-brand-copper transition-colors cursor-pointer"
            title="Log Activity"
          >
            <ClipboardList className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    },
  }),
];

function exportLeadsToCSV(leads: Lead[]) {
  const headers = ["Name", "Email", "Phone", "Source", "Status", "Type", "Interest", "Value", "Follow-Up", "Created"];
  const rows = leads.map((l) => [
    l.name, l.email, l.phone, l.source, l.status,
    l.contactType, l.interest, l.value, l.nextFollowUp, l.createdAt,
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${(cell || "").replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `counter-cultures-leads-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const LeadsPage = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [contactTypeFilter, setContactTypeFilter] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/dashboard/leads");
      if (!res.ok) throw new Error("Failed to fetch leads");
      const data = await res.json();
      setLeads((data.leads as SheetLead[]).map(mapSheetLead));
    } catch (err) {
      console.error(err);
      setError("Unable to load leads from CRM. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (statusFilter !== "all" && lead.status !== statusFilter) return false;
      if (sourceFilter !== "all" && lead.source !== sourceFilter) return false;
      if (contactTypeFilter !== "all" && lead.contactType !== contactTypeFilter) return false;
      return true;
    });
  }, [leads, statusFilter, sourceFilter, contactTypeFilter]);

  // Derive unique contact types from data
  const contactTypes = useMemo(() => {
    const types = new Set(leads.map((l) => l.contactType).filter(Boolean));
    return ["all", ...Array.from(types)];
  }, [leads]);

  const counts = useMemo(() => {
    const c = { total: leads.length, new: 0, qualified: 0, won: 0 };
    leads.forEach((l) => {
      if (l.status === "new") c.new++;
      if (l.status === "qualified") c.qualified++;
      if (l.status === "won") c.won++;
    });
    return c;
  }, [leads]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-copper" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-400">{error}</p>
        <button
          onClick={fetchLeads}
          className="px-4 py-2 text-sm bg-brand-copper text-white rounded-lg hover:bg-brand-copper/90 transition-colors cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Total Leads" value={String(counts.total)} />
        <KPICard label="New" value={String(counts.new)} />
        <KPICard label="Qualified" value={String(counts.qualified)} />
        <KPICard label="Won" value={String(counts.won)} />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-dash-text-secondary" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm bg-dash-surface border border-dash-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-copper/30"
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "All Status" : s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="text-sm bg-dash-surface border border-dash-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-copper/30"
          >
            {sourceOptions.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All Sources" : s}
              </option>
            ))}
          </select>
          <select
            value={contactTypeFilter}
            onChange={(e) => setContactTypeFilter(e.target.value)}
            className="text-sm bg-dash-surface border border-dash-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-copper/30"
          >
            {contactTypes.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All Contact Types" : s}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportLeadsToCSV(filteredLeads)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm border border-dash-border rounded-lg hover:bg-dash-bg transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-1.5 text-sm bg-brand-copper text-white rounded-lg hover:bg-brand-copper/90 transition-colors cursor-pointer">
            <Plus className="w-4 h-4" />
            Add Lead
          </button>
        </div>
      </div>

      {/* Table */}
      <DataTable
        data={filteredLeads}
        columns={columns}
        searchKey="name"
        searchPlaceholder="Search leads..."
        onRowClick={(lead) => setSelectedLead(lead)}
      />

      {/* Slide-out Detail */}
      <SlideOut
        open={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        title={selectedLead?.name ?? "Lead Detail"}
      >
        {selectedLead && (
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary mb-3">
                Contact Information
              </h4>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-dash-text-secondary">Email:</span>{" "}
                  <a href={`mailto:${selectedLead.email}`} className="text-brand-copper">
                    {selectedLead.email}
                  </a>
                </p>
                <p>
                  <span className="text-dash-text-secondary">Phone:</span>{" "}
                  {selectedLead.phone}
                </p>
                <p>
                  <span className="text-dash-text-secondary">Source:</span>{" "}
                  {selectedLead.source}
                </p>
                {selectedLead.contactType && (
                  <p>
                    <span className="text-dash-text-secondary">Contact Type:</span>{" "}
                    {selectedLead.contactType}
                  </p>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary mb-3">
                Status
              </h4>
              <StatusBadge
                label={selectedLead.status}
                variant={statusVariants[selectedLead.status] ?? "new"}
              />
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary mb-3">
                Details
              </h4>
              <div className="space-y-2 text-sm">
                {selectedLead.interest && (
                  <p>
                    <span className="text-dash-text-secondary">Interest:</span>{" "}
                    {selectedLead.interest}
                  </p>
                )}
                {selectedLead.value && (
                  <p>
                    <span className="text-dash-text-secondary">Value:</span>{" "}
                    {selectedLead.value}
                  </p>
                )}
              </div>
            </div>

            {selectedLead.nextFollowUp && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary mb-3">
                  Follow-Up
                </h4>
                <FollowUpIndicator dateStr={selectedLead.nextFollowUp} />
              </div>
            )}

            <div className="text-sm space-y-1 text-dash-text-secondary">
              {selectedLead.createdAt && (
                <p>Created: {selectedLead.createdAt}</p>
              )}
            </div>

            <div className="flex gap-2 pt-4 border-t border-dash-border">
              <button className="flex-1 px-4 py-2 text-sm bg-brand-copper text-white rounded-lg hover:bg-brand-copper/90 transition-colors cursor-pointer">
                Edit Lead
              </button>
              <button className="flex-1 px-4 py-2 text-sm border border-dash-border rounded-lg hover:bg-dash-bg transition-colors cursor-pointer">
                Log Activity
              </button>
            </div>
          </div>
        )}
      </SlideOut>
    </div>
  );
};

export default LeadsPage;
