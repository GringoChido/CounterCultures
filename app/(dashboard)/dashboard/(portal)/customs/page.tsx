"use client";

import { useState, useEffect } from "react";
import {
  FileCheck,
  Clock,
  DollarSign,
  Loader2,
  AlertTriangle,
  Plus,
  Search,
  Ship,
  Package,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { KPICard } from "@/app/(dashboard)/components/kpi-card";
import { TRAFICO_STATUS_CONFIG, type TraficoStatus } from "@/app/lib/customs-data";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types (matching Traficos sheet)
// ---------------------------------------------------------------------------

interface TraficoRecord {
  TRF_ID: string;
  Trafico_Number: string;
  Pedimento_Number: string;
  Status: string;
  Broker_Name: string;
  Broker_Email: string;
  Crossing_Agent: string;
  Warehouse_Name: string;
  Warehouse_Address: string;
  Invoice_Value_USD: string;
  Exchange_Rate: string;
  Customs_Value_MXN: string;
  Calculo_Total_MXN: string;
  Truck_Crossing_Fee: string;
  Total_Import_Cost: string;
  Initiated_Date: string;
  Completed_Date: string;
  Notes: string;
  Item_Count: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatMXN = (value: number) =>
  `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;

const formatUSD = (value: number) =>
  `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;

const parseNum = (val: string): number => {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const CustomsPage = () => {
  const [traficos, setTraficos] = useState<TraficoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<TraficoStatus | "">("");
  const [bulkUpdating, setBulkUpdating] = useState(false);

  const fetchTraficos = async () => {
    try {
      const res = await fetch("/api/dashboard/traficos", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch traficos");
      const data = await res.json();
      setTraficos(data.traficos ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTraficos();
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const applyBulkStatus = async () => {
    if (!bulkStatus || selectedIds.size === 0) return;
    setBulkUpdating(true);
    try {
      // Each PATCH writes through the existing /[id] route which auto-logs to
      // Trafico_Events on Status change (W5 wiring) — so each update gets its
      // own audit trail row.
      const results = await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch(`/api/dashboard/traficos/${encodeURIComponent(id)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ Status: bulkStatus }),
          }).then((r) => ({ id, ok: r.ok }))
        )
      );
      const failed = results.filter((r) => !r.ok);
      if (failed.length > 0) {
        toast.error(`Updated ${results.length - failed.length}/${results.length} — ${failed.length} failed`);
      } else {
        toast.success(`Updated ${results.length} tráfico${results.length === 1 ? "" : "s"} → ${bulkStatus}`);
      }
      setSelectedIds(new Set());
      setBulkStatus("");
      await fetchTraficos();
    } finally {
      setBulkUpdating(false);
    }
  };

  const filtered = traficos.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.TRF_ID?.toLowerCase().includes(q) ||
      t.Trafico_Number?.toLowerCase().includes(q) ||
      t.Broker_Name?.toLowerCase().includes(q) ||
      t.Pedimento_Number?.toLowerCase().includes(q)
    );
  });

  const active = traficos.filter(
    (t) => t.Status !== "complete" && t.Status !== "issue"
  ).length;
  const totalImportCosts = traficos.reduce(
    (s, t) => s + parseNum(t.Total_Import_Cost),
    0
  );
  const totalInvoiceUSD = traficos.reduce(
    (s, t) => s + parseNum(t.Invoice_Value_USD),
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-brand-copper animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-dash-text">
            Customs & Import
          </h2>
          <p className="text-sm text-dash-text-secondary mt-1">
            Manage tráficos, pedimentos, and import costs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dash-text-secondary" />
            <input
              type="text"
              placeholder="Search tráficos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper w-56"
            />
          </div>
          <Link
            href="/dashboard/finance"
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-dash-surface border border-dash-border rounded-lg hover:border-brand-copper/30 transition-colors"
          >
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">Finance</span>
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          label="Total Tráficos"
          value={String(traficos.length)}
          icon={FileCheck}
          accentColor="bg-brand-copper"
        />
        <KPICard
          label="Active Crossings"
          value={String(active)}
          icon={Ship}
          accentColor="bg-dash-info"
        />
        <KPICard
          label="Invoice Value"
          value={totalInvoiceUSD > 0 ? `$${Math.round(totalInvoiceUSD / 1000)}K` : "$0"}
          icon={DollarSign}
          accentColor="bg-dash-warn"
        />
        <KPICard
          label="Total Import Costs"
          value={totalImportCosts > 0 ? `$${Math.round(totalImportCosts / 1000)}K` : "$0"}
          icon={Package}
          accentColor="bg-dash-cat-violet"
        />
      </div>

      {/* Content */}
      {traficos.length === 0 ? (
        <div className="bg-dash-surface rounded-xl border border-dash-border p-12 text-center">
          <FileCheck className="w-14 h-14 text-dash-text-secondary/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-dash-text mb-2">
            No Tráficos Yet
          </h3>
          <p className="text-sm text-dash-text-secondary max-w-md mx-auto mb-6">
            Tráficos track the customs process for importing goods into Mexico.
            When you initiate a crossing with your customs broker, add it here to
            track documents, payments, and status through all 16 stages.
          </p>
          <p className="text-xs text-dash-text-secondary/60 mb-6">
            Add tráficos directly in your CRM spreadsheet under the
            &ldquo;Traficos&rdquo; and &ldquo;Trafico_Items&rdquo; tabs, or they&apos;ll
            be created automatically when POs ship to Mexico.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/dashboard/pipeline"
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-copper text-white text-sm rounded-lg hover:bg-brand-copper/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Go to Pipeline
            </Link>
            <a
              href={`https://docs.google.com/spreadsheets/d/1iXG4A6bzrRSodbendoi-IVy6gi1cqiKbDado_bH7Yt0/edit`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-dash-surface border border-dash-border text-dash-text text-sm rounded-lg hover:border-brand-copper/30 transition-colors"
            >
              Open CRM Sheet
            </a>
          </div>
        </div>
      ) : (
        <div className="bg-dash-surface rounded-xl border border-dash-border">
          <div className="p-5 border-b border-dash-border flex items-center justify-between gap-4 flex-wrap">
            <h3 className="text-sm font-semibold text-dash-text">
              All Tráficos ({filtered.length})
            </h3>
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-dash-text-secondary">
                  {selectedIds.size} selected
                </span>
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value as TraficoStatus | "")}
                  className="px-2 py-1 text-xs bg-dash-bg border border-dash-border rounded-md text-dash-text"
                >
                  <option value="">→ Set status…</option>
                  {(Object.keys(TRAFICO_STATUS_CONFIG) as TraficoStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {TRAFICO_STATUS_CONFIG[s].label.en}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={applyBulkStatus}
                  disabled={!bulkStatus || bulkUpdating}
                  className="px-2.5 py-1 text-xs font-medium bg-brand-copper text-white rounded-md hover:bg-brand-copper/90 disabled:opacity-50 cursor-pointer"
                >
                  {bulkUpdating ? "Applying…" : "Apply"}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  className="px-2.5 py-1 text-xs text-dash-text-secondary hover:text-dash-text cursor-pointer"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dash-border text-left text-xs text-dash-text-secondary uppercase tracking-wider">
                  <th className="px-5 pb-3 pt-4 w-8">
                    <input
                      type="checkbox"
                      aria-label="Select all"
                      checked={filtered.length > 0 && filtered.every((t) => selectedIds.has(t.TRF_ID))}
                      onChange={(e) =>
                        setSelectedIds(
                          e.target.checked ? new Set(filtered.map((t) => t.TRF_ID)) : new Set()
                        )
                      }
                      className="cursor-pointer"
                    />
                  </th>
                  <th className="pb-3 pt-4">Tráfico #</th>
                  <th className="pb-3 pt-4">Pedimento</th>
                  <th className="pb-3 pt-4">Broker</th>
                  <th className="pb-3 pt-4 text-right">Invoice USD</th>
                  <th className="pb-3 pt-4 text-right">Import Cost MXN</th>
                  <th className="pb-3 pt-4">Initiated</th>
                  <th className="pb-3 pt-4">Status</th>
                  <th className="pb-3 pt-4">Items</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const status = t.Status as TraficoStatus;
                  const cfg = TRAFICO_STATUS_CONFIG[status] ?? {
                    label: { en: t.Status || "Unknown", es: "" },
                    bg: "bg-dash-text-muted/10",
                    text: "text-dash-text-muted",
                  };
                  const checked = selectedIds.has(t.TRF_ID);
                  return (
                    <tr
                      key={t.TRF_ID}
                      className={`border-b border-dash-border/50 hover:bg-dash-bg/50 text-dash-text ${
                        checked ? "bg-brand-copper/5" : ""
                      }`}
                    >
                      <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSelect(t.TRF_ID)}
                          aria-label={`Select ${t.Trafico_Number || t.TRF_ID}`}
                          className="cursor-pointer"
                        />
                      </td>
                      <td className="py-3 font-medium">
                        <Link
                          href={`/dashboard/shipments/${encodeURIComponent(t.TRF_ID)}`}
                          className="hover:text-brand-copper hover:underline"
                        >
                          {t.Trafico_Number || t.TRF_ID}
                        </Link>
                      </td>
                      <td className="py-3 text-dash-text-secondary text-xs">
                        {t.Pedimento_Number || "—"}
                      </td>
                      <td className="py-3">{t.Broker_Name || "—"}</td>
                      <td className="py-3 text-right">
                        {parseNum(t.Invoice_Value_USD) > 0
                          ? formatUSD(parseNum(t.Invoice_Value_USD))
                          : "—"}
                      </td>
                      <td className="py-3 text-right font-medium">
                        {parseNum(t.Total_Import_Cost) > 0
                          ? formatMXN(parseNum(t.Total_Import_Cost))
                          : "—"}
                      </td>
                      <td className="py-3 text-xs">
                        {t.Initiated_Date || "—"}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${cfg.bg} ${cfg.text}`}
                        >
                          {cfg.label.en}
                        </span>
                      </td>
                      <td className="py-3 text-dash-text-secondary">
                        {t.Item_Count || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomsPage;
