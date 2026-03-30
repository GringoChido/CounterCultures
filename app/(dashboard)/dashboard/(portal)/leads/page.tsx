"use client";

import { useState, useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { format } from "date-fns";
import { Plus, Filter, Download } from "lucide-react";
import { DataTable } from "@/app/(dashboard)/components/data-table";
import { StatusBadge, type BadgeVariant } from "@/app/(dashboard)/components/status-badge";
import { SlideOut } from "@/app/(dashboard)/components/slide-out";
import { KPICard } from "@/app/(dashboard)/components/kpi-card";
import { SAMPLE_LEADS, type Lead } from "@/app/lib/sample-dashboard-data";

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
        variant={statusVariants[info.getValue()]}
      />
    ),
  }),
  columnHelper.accessor("assignedRep", {
    header: "Rep",
    cell: (info) => info.getValue() || <span className="text-dash-text-secondary">—</span>,
  }),
  columnHelper.accessor("score", {
    header: "Score",
    cell: (info) => {
      const score = info.getValue();
      const color =
        score >= 80
          ? "text-status-won"
          : score >= 50
            ? "text-status-contacted"
            : "text-status-lost";
      return <span className={`font-semibold ${color}`}>{score}</span>;
    },
  }),
  columnHelper.accessor("budget", {
    header: "Budget",
  }),
  columnHelper.accessor("createdAt", {
    header: "Created",
    cell: (info) => format(new Date(info.getValue()), "MMM d, yyyy"),
  }),
];

const LeadsPage = () => {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const filteredLeads = useMemo(() => {
    return SAMPLE_LEADS.filter((lead) => {
      if (statusFilter !== "all" && lead.status !== statusFilter) return false;
      if (sourceFilter !== "all" && lead.source !== sourceFilter) return false;
      return true;
    });
  }, [statusFilter, sourceFilter]);

  const counts = useMemo(() => {
    const c = { total: SAMPLE_LEADS.length, new: 0, qualified: 0, won: 0 };
    SAMPLE_LEADS.forEach((l) => {
      if (l.status === "new") c.new++;
      if (l.status === "qualified") c.qualified++;
      if (l.status === "won") c.won++;
    });
    return c;
  }, []);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Total Leads" value={String(counts.total)} />
        <KPICard label="New" value={String(counts.new)} change={25} />
        <KPICard label="Qualified" value={String(counts.qualified)} />
        <KPICard label="Won" value={String(counts.won)} change={-10} />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
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
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-dash-border rounded-lg hover:bg-dash-bg transition-colors cursor-pointer">
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
            {/* Contact Info */}
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
              </div>
            </div>

            {/* Status & Score */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary mb-3">
                Status
              </h4>
              <div className="flex items-center gap-4">
                <StatusBadge
                  label={selectedLead.status}
                  variant={statusVariants[selectedLead.status]}
                />
                <span className="text-sm">
                  Score: <span className="font-semibold">{selectedLead.score}</span>
                </span>
                {selectedLead.assignedRep && (
                  <span className="text-sm text-dash-text-secondary">
                    Rep: {selectedLead.assignedRep}
                  </span>
                )}
              </div>
            </div>

            {/* Project Info */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary mb-3">
                Project Details
              </h4>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-dash-text-secondary">Type:</span>{" "}
                  {selectedLead.projectType}
                </p>
                <p>
                  <span className="text-dash-text-secondary">Budget:</span>{" "}
                  {selectedLead.budget}
                </p>
              </div>
            </div>

            {/* Notes */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary mb-3">
                Notes
              </h4>
              <p className="text-sm text-dash-text leading-relaxed">
                {selectedLead.notes}
              </p>
            </div>

            {/* Timeline */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary mb-3">
                Timeline
              </h4>
              <div className="text-sm space-y-1 text-dash-text-secondary">
                <p>Created: {format(new Date(selectedLead.createdAt), "MMM d, yyyy 'at' h:mm a")}</p>
                <p>Updated: {format(new Date(selectedLead.updatedAt), "MMM d, yyyy 'at' h:mm a")}</p>
              </div>
            </div>

            {/* Actions */}
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
