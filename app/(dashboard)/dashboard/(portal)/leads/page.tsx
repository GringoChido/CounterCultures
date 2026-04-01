"use client";

import { useState, useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { format, differenceInDays, isPast, parseISO } from "date-fns";
import { Plus, Filter, Download, Phone, Mail, MessageCircle, ClipboardList } from "lucide-react";
import { DataTable } from "@/app/(dashboard)/components/data-table";
import { StatusBadge, type BadgeVariant } from "@/app/(dashboard)/components/status-badge";
import { SlideOut } from "@/app/(dashboard)/components/slide-out";
import { KPICard } from "@/app/(dashboard)/components/kpi-card";
import { SAMPLE_LEADS, type Lead, type ContactRole } from "@/app/lib/sample-dashboard-data";

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
const contactTypeOptions: ("all" | ContactRole)[] = [
  "all", "Architect", "Interior Designer", "Developer", "Builder",
  "Private Client", "Supplier", "Partner", "Hospitality Designer",
];

const columnHelper = createColumnHelper<Lead>();

const DaysAgoIndicator = ({ dateStr }: { dateStr?: string }) => {
  if (!dateStr) return <span className="text-dash-text-secondary">&mdash;</span>;
  const days = differenceInDays(new Date(), parseISO(dateStr));
  const color = days <= 7 ? "text-status-won" : days <= 30 ? "text-status-contacted" : days <= 60 ? "text-amber-400" : "text-status-lost";
  return <span className={`text-xs ${color}`}>{days}d ago</span>;
};

const FollowUpIndicator = ({ dateStr }: { dateStr?: string }) => {
  if (!dateStr) return <span className="text-dash-text-secondary">&mdash;</span>;
  const overdue = isPast(parseISO(dateStr));
  return (
    <span className={`text-xs ${overdue ? "text-red-400 font-medium" : "text-dash-text-secondary"}`}>
      {format(parseISO(dateStr), "MMM d")}
      {overdue && " (overdue)"}
    </span>
  );
};

const columns = [
  columnHelper.accessor("name", {
    header: "Name",
    cell: (info) => (
      <div>
        <p className="font-medium">{info.getValue()}</p>
        <p className="text-xs text-dash-text-secondary">{info.row.original.email}</p>
        {info.row.original.companyName && (
          <p className="text-[10px] text-dash-text-secondary">{info.row.original.companyName}</p>
        )}
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
  columnHelper.accessor("contactType", {
    header: "Type",
    cell: (info) => {
      const val = info.getValue();
      return val ? <span className="text-xs text-dash-text-secondary">{val}</span> : <span className="text-dash-text-secondary">&mdash;</span>;
    },
  }),
  columnHelper.accessor("assignedRep", {
    header: "Rep",
    cell: (info) => info.getValue() || <span className="text-dash-text-secondary">&mdash;</span>,
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
  columnHelper.accessor("lastContactDate", {
    header: "Last Contact",
    cell: (info) => <DaysAgoIndicator dateStr={info.getValue()} />,
  }),
  columnHelper.accessor("nextFollowUp", {
    header: "Follow-Up",
    cell: (info) => <FollowUpIndicator dateStr={info.getValue()} />,
  }),
  columnHelper.accessor("budget", {
    header: "Budget",
  }),
  columnHelper.display({
    id: "actions",
    header: "Actions",
    cell: (info) => {
      const lead = info.row.original;
      const waPhone = (lead.whatsapp ?? lead.phone).replace(/\s+/g, "").replace(/^\+/, "");
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
  const headers = ["Name", "Email", "Phone", "Source", "Status", "Rep", "Score", "Budget", "Project Type", "Contact Type", "Company", "Created"];
  const rows = leads.map((l) => [
    l.name,
    l.email,
    l.phone,
    l.source,
    l.status,
    l.assignedRep,
    String(l.score),
    l.budget,
    l.projectType,
    l.contactType ?? "",
    l.companyName ?? "",
    l.createdAt,
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
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [contactTypeFilter, setContactTypeFilter] = useState<string>("all");
  const [showStale, setShowStale] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const filteredLeads = useMemo(() => {
    return SAMPLE_LEADS.filter((lead) => {
      if (statusFilter !== "all" && lead.status !== statusFilter) return false;
      if (sourceFilter !== "all" && lead.source !== sourceFilter) return false;
      if (contactTypeFilter !== "all" && lead.contactType !== contactTypeFilter) return false;
      if (showStale) {
        if (!lead.lastContactDate) return true;
        return differenceInDays(new Date(), parseISO(lead.lastContactDate)) > 60;
      }
      return true;
    });
  }, [statusFilter, sourceFilter, contactTypeFilter, showStale]);

  const counts = useMemo(() => {
    const c = { total: SAMPLE_LEADS.length, new: 0, qualified: 0, won: 0, stale: 0 };
    SAMPLE_LEADS.forEach((l) => {
      if (l.status === "new") c.new++;
      if (l.status === "qualified") c.qualified++;
      if (l.status === "won") c.won++;
      if (l.lastContactDate && differenceInDays(new Date(), parseISO(l.lastContactDate)) > 60) c.stale++;
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
            {contactTypeOptions.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All Contact Types" : s}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowStale(!showStale)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
              showStale
                ? "border-brand-copper bg-brand-copper/10 text-brand-copper"
                : "border-dash-border text-dash-text-secondary hover:text-dash-text"
            }`}
          >
            Stale Leads ({counts.stale})
          </button>
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
                {selectedLead.companyName && (
                  <p>
                    <span className="text-dash-text-secondary">Company:</span>{" "}
                    {selectedLead.companyName}
                  </p>
                )}
                {selectedLead.contactType && (
                  <p>
                    <span className="text-dash-text-secondary">Contact Type:</span>{" "}
                    {selectedLead.contactType}
                  </p>
                )}
                {selectedLead.city && (
                  <p>
                    <span className="text-dash-text-secondary">City:</span>{" "}
                    {selectedLead.city}
                  </p>
                )}
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

            {/* Follow-up Info */}
            {(selectedLead.lastContactDate || selectedLead.nextFollowUp) && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary mb-3">
                  Follow-Up
                </h4>
                <div className="space-y-2 text-sm">
                  {selectedLead.lastContactDate && (
                    <p>
                      <span className="text-dash-text-secondary">Last Contact:</span>{" "}
                      {format(parseISO(selectedLead.lastContactDate), "MMM d, yyyy")} (<DaysAgoIndicator dateStr={selectedLead.lastContactDate} />)
                    </p>
                  )}
                  {selectedLead.nextFollowUp && (
                    <p>
                      <span className="text-dash-text-secondary">Next Follow-Up:</span>{" "}
                      <FollowUpIndicator dateStr={selectedLead.nextFollowUp} />
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Tags */}
            {selectedLead.tags && selectedLead.tags.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary mb-3">
                  Tags
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedLead.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-dash-bg text-dash-text-secondary border border-dash-border">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

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
