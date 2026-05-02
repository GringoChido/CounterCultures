"use client";

import { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createColumnHelper } from "@tanstack/react-table";
import { format, differenceInDays, isPast, parseISO } from "date-fns";
import { Plus, Filter, Download, Mail, MessageCircle, ClipboardList, Loader2, Save, X, ChevronDown, AlertTriangle, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { useActivityStore } from "@/app/lib/stores/activity-store";
import { usePageContextStore } from "@/app/lib/stores/page-context-store";
import { DataTable } from "@/app/(dashboard)/components/data-table";
import { StatusBadge, type BadgeVariant } from "@/app/(dashboard)/components/status-badge";
import { SlideOut } from "@/app/(dashboard)/components/slide-out";
import { LandedCostCalculator } from "@/app/(dashboard)/components/landed-cost-calculator";
import { KPICard } from "@/app/(dashboard)/components/kpi-card";
import { NotesPanel } from "@/app/(dashboard)/components/notes-panel";
import { ShareButton } from "@/app/(dashboard)/components/share-button";
import { LEAD_SOURCE_OPTIONS, LEAD_SOURCE_PILL, normalizeLeadSource, isLeadSource } from "@/app/lib/lead-sources";
import { useCurrentUser } from "@/app/lib/use-current-user";
import {
  MineAllToggle,
  matchesUser,
  readPersistedMode,
  type MineAllMode,
} from "@/app/(dashboard)/components/mine-all-toggle";

// Shape matching Google Sheets Leads tab. `assigned_rep` is read-through —
// when the column is absent from the sheet, readSheet returns "" and the
// Mine/All filter (R2-2) treats the lead as unassigned.
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
  last_contact_date: string;
  brand_slugs: string;
  assigned_rep: string;
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
  lastContactDate: string;
  brandSlugs: string[];
  assignedRep: string;
}

const mapSheetLead = (s: SheetLead): Lead => ({
  id: s.id,
  name: s.name,
  email: s.email,
  phone: s.phone,
  source: normalizeLeadSource(s.source),
  status: s.status || "new",
  contactType: s.contact_type,
  interest: s.interest,
  value: s.value,
  createdAt: s.created_at,
  nextFollowUp: s.next_followup,
  lastContactDate: s.last_contact_date,
  brandSlugs: (s.brand_slugs ?? "")
    .split("|")
    .map((x) => x.trim())
    .filter(Boolean),
  assignedRep: s.assigned_rep ?? "",
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
const sourceOptions = LEAD_SOURCE_OPTIONS;
const contactTypeOptions = ["Homeowner", "Architect", "Interior Designer", "Builder/Contractor", "Developer", "Hotel/Hospitality", "Trade Program", "Other"] as const;

// ── Lead Form ────────────────────────────────────────────────────────
interface LeadFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editLead?: Lead | null;
  initialSource?: string;
}

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  source: "Website",
  status: "new",
  contact_type: "",
  interest: "",
  value: "",
  next_followup: "",
  last_contact_date: "",
  brand_slugs: "",
};

interface BrandOption {
  slug: string;
  name: string;
}

const LeadForm = ({ open, onClose, onSaved, editLead, initialSource }: LeadFormProps) => {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brandOptions, setBrandOptions] = useState<BrandOption[]>([]);

  useEffect(() => {
    if (!open) return;
    fetch("/api/dashboard/brands")
      .then((r) => r.json())
      .then((d) => {
        const brands = (d.brands ?? []) as BrandOption[];
        setBrandOptions(
          brands
            .map((b) => ({ slug: b.slug, name: b.name }))
            .sort((a, b) => a.name.localeCompare(b.name))
        );
      })
      .catch((err) => console.error("[LeadForm] brand fetch failed", err));
  }, [open]);

  useEffect(() => {
    if (editLead) {
      setForm({
        name: editLead.name,
        email: editLead.email,
        phone: editLead.phone,
        source: editLead.source,
        status: editLead.status,
        contact_type: editLead.contactType,
        interest: editLead.interest,
        value: editLead.value,
        next_followup: editLead.nextFollowUp,
        last_contact_date: editLead.lastContactDate,
        brand_slugs: editLead.brandSlugs.join("|"),
      });
    } else {
      setForm({ ...emptyForm, source: initialSource || emptyForm.source });
    }
    setError(null);
  }, [editLead, open, initialSource]);

  const selectedBrandSlugs = form.brand_slugs
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);

  const toggleBrand = (slug: string) => {
    setForm((prev) => {
      const current = prev.brand_slugs
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean);
      const next = current.includes(slug)
        ? current.filter((s) => s !== slug)
        : [...current, slug];
      return { ...prev, brand_slugs: next.join("|") };
    });
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    // R2-3: walk-ins almost never leave with a printed quote — Roger emails
    // it later. The email captured at the desk is the artifact that makes
    // that possible, so it's required.
    if (form.source === "Walk-in" && !form.email.trim()) {
      setError("Email is required for walk-ins — we email the quote later.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const method = editLead ? "PATCH" : "POST";
      const body = editLead ? { id: editLead.id, ...form } : form;

      const res = await fetch("/api/dashboard/leads", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to save lead");
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      setError("Failed to save lead. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full text-sm bg-dash-bg border border-dash-border rounded-lg px-3 py-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30 placeholder:text-dash-text-secondary/50";
  const labelClass = "block text-xs font-medium text-dash-text-secondary mb-1.5";

  return (
    <SlideOut
      open={open}
      onClose={onClose}
      title={editLead ? "Edit Lead" : "New Lead"}
      width="w-[520px]"
    >
      <div className="space-y-5">
        {error && (
          <div className="text-sm text-dash-danger bg-dash-danger/10 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {/* Name */}
        <div>
          <label className={labelClass}>
            Name <span className="text-dash-danger">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Full name"
            className={inputClass}
            autoFocus
          />
        </div>

        {/* Email & Phone */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>
              Email
              {form.source === "Walk-in" && (
                <span className="text-dash-danger"> *</span>
              )}
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="email@example.com"
              className={inputClass}
            />
            {form.source === "Walk-in" && (
              <p className="mt-1 text-[10.5px] text-dash-text-secondary/80">
                Required — walk-ins almost never leave with a printed quote, we email it the next day.
              </p>
            )}
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="+52 415 123 4567"
              className={inputClass}
            />
          </div>
        </div>

        {/* Source & Status */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Source</label>
            <select
              value={form.source}
              onChange={(e) => handleChange("source", e.target.value)}
              className={inputClass}
            >
              {sourceOptions.filter((s) => s !== "all").map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select
              value={form.status}
              onChange={(e) => handleChange("status", e.target.value)}
              className={inputClass}
            >
              {statusOptions.filter((s) => s !== "all").map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Contact Type */}
        <div>
          <label className={labelClass}>Contact Type</label>
          <select
            value={form.contact_type}
            onChange={(e) => handleChange("contact_type", e.target.value)}
            className={inputClass}
          >
            <option value="">Select type...</option>
            {contactTypeOptions.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Interest */}
        <div>
          <label className={labelClass}>Interest / Product</label>
          <input
            type="text"
            value={form.interest}
            onChange={(e) => handleChange("interest", e.target.value)}
            placeholder="e.g. Smart Toilet, Rainfall Shower System"
            className={inputClass}
          />
        </div>

        {/* Value & Follow-up */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Estimated Value</label>
            <input
              type="text"
              value={form.value}
              onChange={(e) => handleChange("value", e.target.value)}
              placeholder="$5,000 USD"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Next Follow-Up</label>
            <input
              type="date"
              value={form.next_followup}
              onChange={(e) => handleChange("next_followup", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* Brands of interest */}
        <div>
          <label className={labelClass}>
            Brands of interest{" "}
            <span className="text-dash-text-secondary/70 font-normal">
              ({selectedBrandSlugs.length} selected)
            </span>
          </label>
          {brandOptions.length === 0 ? (
            <p className="text-xs text-dash-text-secondary">Loading brands…</p>
          ) : (
            <div className="max-h-40 overflow-y-auto border border-dash-border rounded-lg p-2 bg-dash-bg">
              <div className="flex flex-wrap gap-1.5">
                {brandOptions.map((b) => {
                  const active = selectedBrandSlugs.includes(b.slug);
                  return (
                    <button
                      key={b.slug}
                      type="button"
                      onClick={() => toggleBrand(b.slug)}
                      className={`px-2 py-0.5 rounded-full text-xs border transition-colors cursor-pointer ${
                        active
                          ? "bg-brand-copper/15 text-brand-copper border-brand-copper/30"
                          : "bg-dash-surface text-dash-text-secondary border-dash-border hover:border-dash-text-secondary"
                      }`}
                    >
                      {b.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Landed-cost preview — only when ≥1 brand selected */}
        {selectedBrandSlugs.length > 0 && (
          <details className="border border-dash-border rounded-lg p-3 bg-dash-bg/50">
            <summary className="cursor-pointer text-xs font-semibold text-dash-text uppercase tracking-wider hover:text-brand-copper transition-colors">
              Estimate landed cost (optional)
            </summary>
            <div className="mt-3">
              <LandedCostCalculator
                variant="preview"
                defaultValues={{ brandId: selectedBrandSlugs[0] }}
              />
            </div>
          </details>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-dash-border">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-brand-copper text-white rounded-lg hover:bg-brand-copper/90 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Saving..." : editLead ? "Update Lead" : "Create Lead"}
          </button>
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2.5 text-sm border border-dash-border rounded-lg hover:bg-dash-bg transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </SlideOut>
  );
};

const columnHelper = createColumnHelper<Lead>();

const LastContactIndicator = ({ dateStr }: { dateStr?: string }) => {
  if (!dateStr) return <span className="text-dash-text-secondary">&mdash;</span>;
  try {
    const date = parseISO(dateStr);
    const days = differenceInDays(new Date(), date);
    let colorClass = "text-dash-success"; // contacted recently (< 14 days)
    if (days > 60) colorClass = "text-dash-danger font-medium"; // stale
    else if (days > 30) colorClass = "text-dash-warn"; // getting cold
    else if (days > 14) colorClass = "text-dash-text-secondary"; // ok
    return (
      <span className={`text-xs ${colorClass}`}>
        {days === 0 ? "Today" : days === 1 ? "Yesterday" : `${days}d ago`}
      </span>
    );
  } catch {
    return <span className="text-xs text-dash-text-secondary">{dateStr}</span>;
  }
};

const FollowUpIndicator = ({ dateStr }: { dateStr?: string }) => {
  if (!dateStr) return <span className="text-dash-text-secondary">&mdash;</span>;
  try {
    const overdue = isPast(parseISO(dateStr));
    return (
      <span className={`text-xs ${overdue ? "text-dash-danger font-medium" : "text-dash-text-secondary"}`}>
        {format(parseISO(dateStr), "MMM d")}
        {overdue && " (overdue)"}
      </span>
    );
  } catch {
    return <span className="text-xs text-dash-text-secondary">{dateStr}</span>;
  }
};

const BrandChips = ({ slugs }: { slugs: string[] }) => {
  if (slugs.length === 0) {
    return <span className="text-dash-text-secondary">&mdash;</span>;
  }
  const shown = slugs.slice(0, 3);
  const extra = slugs.length - shown.length;
  return (
    <div className="flex flex-wrap gap-1 items-center">
      {shown.map((s) => (
        <Link
          key={s}
          href={`/dashboard/brands/${s}`}
          onClick={(e) => e.stopPropagation()}
          className="px-1.5 py-0.5 bg-brand-copper/10 text-brand-copper border border-brand-copper/20 rounded text-[10px] leading-tight hover:bg-brand-copper/20 transition-colors"
        >
          {s}
        </Link>
      ))}
      {extra > 0 && (
        <span className="text-[10px] text-dash-text-secondary">+{extra}</span>
      )}
    </div>
  );
};

const columns = [
  columnHelper.display({
    id: "select",
    header: ({ table }) => (
      <input
        type="checkbox"
        checked={table.getIsAllRowsSelected()}
        aria-label="Select all rows"
        onChange={table.getToggleAllRowsSelectedHandler()}
        onClick={(e) => e.stopPropagation()}
        className="accent-brand-copper cursor-pointer"
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        aria-label={`Select ${row.original.name}`}
        onChange={row.getToggleSelectedHandler()}
        onClick={(e) => e.stopPropagation()}
        className="accent-brand-copper cursor-pointer"
      />
    ),
    enableSorting: false,
  }),
  columnHelper.accessor("name", {
    header: "Name",
    cell: (info) => (
      <div>
        <p className="font-medium">{info.getValue()}</p>
        <p className="text-xs text-dash-text-secondary">{info.row.original.email}</p>
      </div>
    ),
  }),
  columnHelper.accessor("brandSlugs", {
    header: "Brands",
    cell: (info) => <BrandChips slugs={info.getValue()} />,
    enableSorting: false,
  }),
  columnHelper.accessor("source", {
    header: "Source",
    cell: (info) => {
      const value = info.getValue();
      if (!value) return <span className="text-dash-text-secondary">&mdash;</span>;
      if (!isLeadSource(value)) {
        return <span className="text-xs text-dash-text-secondary">{value}</span>;
      }
      const pill = LEAD_SOURCE_PILL[value];
      return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] border ${pill.bg} ${pill.text} ${pill.border}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${pill.dot}`} />
          {value}
        </span>
      );
    },
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
  columnHelper.accessor("lastContactDate", {
    header: "Last Contact",
    cell: (info) => <LastContactIndicator dateStr={info.getValue()} />,
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

      const handleConvertToDeal = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const confirmed =
          typeof window === "undefined"
            ? true
            : window.confirm(
                `Create a new deal from ${lead.name}? Opens the pipeline after creation.`
              );
        if (!confirmed) return;
        try {
          const payload = {
            id: "",
            name: lead.name,
            company: "",
            stage: "Quote Approved",
            value: lead.value ?? "",
            probability: "20",
            expected_close: "",
            owner: "Roger",
            source: lead.source || "lead-conversion",
            notes: `Converted from lead ${lead.id} on ${new Date().toISOString().slice(0, 10)}`,
            brand_slugs: (lead.brandSlugs ?? []).join("|"),
            source_message_id: lead.id,
          };
          const res = await fetch("/api/dashboard/pipeline", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = (await res.json()) as { id: string };
          toast.success(`Deal ${data.id} created from lead`);
          // Update lead status in the background
          void fetch("/api/dashboard/leads", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: lead.id, status: "quoted" }),
          });
          window.location.href = `/dashboard/pipeline?deal=${encodeURIComponent(data.id)}`;
        } catch (err) {
          toast.error(
            err instanceof Error ? err.message : "Failed to create deal"
          );
        }
      };

      return (
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity md:opacity-100">
          <a
            href={`https://wa.me/${waPhone}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-dash-success/10 text-dash-success transition-colors"
            title="WhatsApp"
          >
            <MessageCircle className="w-3.5 h-3.5" />
          </a>
          <a
            href={`mailto:${lead.email}`}
            onClick={(e) => e.stopPropagation()}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-dash-info/10 text-dash-info transition-colors"
            title="Email"
          >
            <Mail className="w-3.5 h-3.5" />
          </a>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-brand-copper/10 text-brand-copper transition-colors cursor-pointer"
            title="Log Activity"
            aria-label="Log Activity"
          >
            <ClipboardList className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleConvertToDeal}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-dash-info/10 text-dash-info transition-colors cursor-pointer"
            title="Convert to Deal"
            aria-label="Convert to Deal"
          >
            <Briefcase className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    },
  }),
];

function exportLeadsToCSV(leads: Lead[]) {
  const headers = ["Name", "Email", "Phone", "Source", "Status", "Type", "Last Contact", "Interest", "Value", "Follow-Up", "Created"];
  const rows = leads.map((l) => [
    l.name, l.email, l.phone, l.source, l.status,
    l.contactType, l.lastContactDate, l.interest, l.value, l.nextFollowUp, l.createdAt,
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

const LeadsPageInner = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [contactTypeFilter, setContactTypeFilter] = useState<string>("all");
  const [viewFilter, setViewFilter] = useState<"all" | "stale">("all");
  const { user: currentUser } = useCurrentUser();
  const [repMode, setRepMode] = useState<MineAllMode>("all");
  // Once the current user resolves, hydrate the Mine/All preference from
  // localStorage (or fall back to the role default — sales=mine, owner=all).
  useEffect(() => {
    if (currentUser) setRepMode(readPersistedMode(currentUser, "leads"));
  }, [currentUser]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Publish open lead to page-context store for the AI chat widget.
  const setPageLead = usePageContextStore((s) => s.setSelectedLead);
  useEffect(() => {
    if (selectedLead) {
      setPageLead({
        id: selectedLead.id,
        name: selectedLead.name,
        status: selectedLead.status,
      });
    } else {
      setPageLead(null);
    }
    return () => setPageLead(null);
  }, [selectedLead, setPageLead]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [activityLogLead, setActivityLogLead] = useState<Lead | null>(null);
  const [activityNote, setActivityNote] = useState("");
  const [activityType, setActivityType] = useState<"call" | "email" | "meeting" | "note" | "whatsapp">("call");
  const addActivity = useActivityStore((s) => s.addActivity);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [bulkRunning, setBulkRunning] = useState(false);

  const selectedIds = useMemo(
    () => Object.keys(rowSelection).filter((id) => rowSelection[id]),
    [rowSelection]
  );

  const clearSelection = useCallback(() => setRowSelection({}), []);

  const bulkMarkContacted = useCallback(async () => {
    if (selectedIds.length === 0 || bulkRunning) return;
    setBulkRunning(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const results = await Promise.allSettled(
        selectedIds.map((id) =>
          fetch("/api/dashboard/leads", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id,
              status: "contacted",
              last_contact_date: today,
            }),
          }).then((r) => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
          })
        )
      );
      const failed = results.filter((r) => r.status === "rejected").length;
      const ok = selectedIds.length - failed;
      if (ok) toast.success(`Marked ${ok} as contacted`);
      if (failed) toast.error(`${failed} update${failed === 1 ? "" : "s"} failed`);
      // Optimistic local update
      setLeads((prev) =>
        prev.map((l) =>
          selectedIds.includes(l.id)
            ? { ...l, status: "contacted", lastContactDate: today }
            : l
        )
      );
      clearSelection();
    } finally {
      setBulkRunning(false);
    }
  }, [selectedIds, bulkRunning, clearSelection]);

  const bulkExport = useCallback(() => {
    if (selectedIds.length === 0) return;
    const subset = leads.filter((l) => selectedIds.includes(l.id));
    exportLeadsToCSV(subset);
    toast.success(`Exported ${subset.length} lead${subset.length === 1 ? "" : "s"}`);
  }, [selectedIds, leads]);

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

  const searchParams = useSearchParams();
  const router = useRouter();
  const actionParam = searchParams.get("action");
  const sourceParam = searchParams.get("source") ?? undefined;
  const leadDeepLinkParam = searchParams.get("lead");

  // Deep-link: /dashboard/leads?lead=<id> from Needs You panel / bell. Opens
  // the lead detail slideout once leads are loaded, then strips the param.
  useEffect(() => {
    if (!leadDeepLinkParam || leads.length === 0) return;
    const hit = leads.find((l) => l.id === leadDeepLinkParam);
    if (hit) {
      setSelectedLead(hit);
      router.replace("/dashboard/leads");
    }
  }, [leadDeepLinkParam, leads, router]);

  useEffect(() => {
    if (actionParam === "new") {
      setEditingLead(null);
      setFormOpen(true);
      // Strip the query so it doesn't re-open on remount
      router.replace("/dashboard/leads");
    }
  }, [actionParam, router]);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (statusFilter !== "all" && lead.status !== statusFilter) return false;
      if (sourceFilter !== "all" && lead.source !== sourceFilter) return false;
      if (contactTypeFilter !== "all" && lead.contactType !== contactTypeFilter) return false;
      if (repMode === "mine" && currentUser) {
        if (!matchesUser(lead.assignedRep ?? "", currentUser)) return false;
      }
      if (viewFilter === "stale") {
        if (!lead.lastContactDate) return true; // no contact date = stale
        try {
          return differenceInDays(new Date(), parseISO(lead.lastContactDate)) > 60;
        } catch {
          return false;
        }
      }
      return true;
    });
  }, [leads, statusFilter, sourceFilter, contactTypeFilter, viewFilter, repMode, currentUser]);

  const staleCount = useMemo(() => {
    return leads.filter((l) => {
      if (!l.lastContactDate) return true;
      try {
        return differenceInDays(new Date(), parseISO(l.lastContactDate)) > 60;
      } catch {
        return false;
      }
    }).length;
  }, [leads]);

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
        <p className="text-dash-danger">{error}</p>
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

      {/* View Tabs */}
      <div className="flex items-center gap-1 border-b border-dash-border pb-0">
        <button
          onClick={() => setViewFilter("all")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            viewFilter === "all"
              ? "border-brand-copper text-brand-copper"
              : "border-transparent text-dash-text-secondary hover:text-dash-text"
          }`}
        >
          All Leads
        </button>
        <button
          onClick={() => setViewFilter("stale")}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            viewFilter === "stale"
              ? "border-dash-danger text-dash-danger"
              : "border-transparent text-dash-text-secondary hover:text-dash-text"
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Stale Leads
          {staleCount > 0 && (
            <span className="ml-1 text-xs bg-dash-danger/15 text-dash-danger px-1.5 py-0.5 rounded-full">
              {staleCount}
            </span>
          )}
        </button>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <MineAllToggle
            user={currentUser}
            scope="leads"
            mode={repMode}
            onChange={setRepMode}
          />
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-dash-text-secondary" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm bg-dash-surface border border-dash-border rounded-lg px-3 py-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30"
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
            className="text-sm bg-dash-surface border border-dash-border rounded-lg px-3 py-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30"
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
            className="text-sm bg-dash-surface border border-dash-border rounded-lg px-3 py-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30"
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
          <button
            onClick={() => {
              setEditingLead(null);
              setFormOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-1.5 text-sm bg-brand-copper text-white rounded-lg hover:bg-brand-copper/90 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Lead
          </button>
        </div>
      </div>

      {selectedIds.length > 0 ? (
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-brand-copper/10 border border-brand-copper/20 rounded-xl">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-dash-text">
              {selectedIds.length} selected
            </span>
            <button
              type="button"
              onClick={clearSelection}
              className="text-xs text-dash-text-secondary hover:text-dash-text underline underline-offset-2 cursor-pointer"
            >
              Clear
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={bulkMarkContacted}
              disabled={bulkRunning}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-brand-copper text-white rounded-lg hover:bg-brand-copper/90 transition-colors cursor-pointer disabled:opacity-50"
            >
              {bulkRunning ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Mail className="w-3 h-3" />
              )}
              Mark as contacted
            </button>
            <button
              type="button"
              onClick={bulkExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-dash-border text-dash-text rounded-lg hover:bg-dash-bg transition-colors cursor-pointer"
            >
              <Download className="w-3 h-3" />
              Export CSV
            </button>
          </div>
        </div>
      ) : null}

      {/* Table */}
      <DataTable
        data={filteredLeads}
        columns={columns}
        searchKey="name"
        searchPlaceholder="Search leads..."
        onRowClick={(lead) => setSelectedLead(lead)}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        getRowId={(lead) => lead.id}
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
              <div className="flex items-center gap-2">
                <StatusBadge
                  label={selectedLead.status}
                  variant={statusVariants[selectedLead.status] ?? "new"}
                />
                <select
                  value={selectedLead.status}
                  onChange={async (e) => {
                    const newStatus = e.target.value;
                    try {
                      await fetch("/api/dashboard/leads", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: selectedLead.id, status: newStatus }),
                      });
                      setSelectedLead({ ...selectedLead, status: newStatus });
                      fetchLeads();
                    } catch (err) {
                      console.error("Failed to update status:", err);
                    }
                  }}
                  className="text-xs bg-dash-bg border border-dash-border rounded px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30"
                >
                  {statusOptions.filter((s) => s !== "all").map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
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

            {(selectedLead.lastContactDate || selectedLead.nextFollowUp) && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary mb-3">
                  Activity
                </h4>
                <div className="space-y-2 text-sm">
                  {selectedLead.lastContactDate && (
                    <p>
                      <span className="text-dash-text-secondary">Last Contact:</span>{" "}
                      <LastContactIndicator dateStr={selectedLead.lastContactDate} />
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

            <div className="text-sm space-y-1 text-dash-text-secondary">
              {selectedLead.createdAt && (
                <p>Created: {selectedLead.createdAt}</p>
              )}
            </div>

            <div className="pt-4 border-t border-dash-border">
              <NotesPanel entityType="lead" entityId={selectedLead.id} />
            </div>

            <div className="flex gap-2 pt-4 border-t border-dash-border">
              <button
                onClick={() => {
                  setEditingLead(selectedLead);
                  setSelectedLead(null);
                  setFormOpen(true);
                }}
                className="flex-1 px-4 py-2 text-sm bg-brand-copper text-white rounded-lg hover:bg-brand-copper/90 transition-colors cursor-pointer"
              >
                Edit Lead
              </button>
              <button
                onClick={() => {
                  setActivityLogLead(selectedLead);
                  setActivityNote("");
                  setActivityType("call");
                  setSelectedLead(null);
                }}
                className="flex-1 px-4 py-2 text-sm border border-dash-border rounded-lg hover:bg-dash-bg transition-colors cursor-pointer"
              >
                Log Activity
              </button>
              <ShareButton
                entityType="lead"
                entityId={selectedLead.id}
                summary={`Lead: ${selectedLead.name}${selectedLead.interest ? ` — ${selectedLead.interest}` : ""}`}
                deepLink={`/dashboard/leads#${selectedLead.id}`}
                compact
              />
            </div>
          </div>
        )}
      </SlideOut>

      {/* Activity Logger SlideOut */}
      <SlideOut
        open={!!activityLogLead}
        onClose={() => setActivityLogLead(null)}
        title={`Log Activity — ${activityLogLead?.name ?? ""}`}
      >
        {activityLogLead && (
          <div className="space-y-4">
            <div className="flex gap-2">
              {(["call", "email", "whatsapp", "meeting", "note"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActivityType(t)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                    activityType === t
                      ? "bg-brand-copper/10 text-brand-copper border-brand-copper/30"
                      : "border-dash-border text-dash-text-secondary hover:border-dash-text-secondary"
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <textarea
              value={activityNote}
              onChange={(e) => setActivityNote(e.target.value)}
              placeholder="What happened? Key takeaways, next steps..."
              className="w-full h-24 px-3 py-2 bg-dash-bg border border-dash-border rounded-lg text-sm text-dash-text placeholder-dash-text-secondary/50 resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:border-brand-copper/50"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (!activityNote.trim()) return;
                  addActivity({
                    type: activityType,
                    description: activityNote,
                    contactName: activityLogLead.name,
                  });
                  setActivityLogLead(null);
                }}
                disabled={!activityNote.trim()}
                className="flex-1 px-4 py-2 text-sm bg-brand-copper text-white rounded-lg hover:bg-brand-copper/90 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Log Activity
              </button>
              <button
                onClick={() => setActivityLogLead(null)}
                className="px-4 py-2 text-sm border border-dash-border rounded-lg hover:bg-dash-bg transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </SlideOut>

      {/* New / Edit Lead Form */}
      <LeadForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingLead(null);
        }}
        onSaved={fetchLeads}
        editLead={editingLead}
        initialSource={sourceParam}
      />
    </div>
  );
};

// useSearchParams() requires a Suspense boundary at static prerender time
// (Next.js client-component rule). The auth-gated dashboard page is dynamic
// in practice, but the build still does a prerender pass.
const LeadsPage = () => (
  <Suspense fallback={null}>
    <LeadsPageInner />
  </Suspense>
);

export default LeadsPage;
