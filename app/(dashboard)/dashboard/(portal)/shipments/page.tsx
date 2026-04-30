"use client";

/**
 * W7: /dashboard/shipments list page is now Traficos-backed.
 *
 * W6 detail view at /dashboard/shipments/[id] accepts TRF_IDs via the
 * hydrator; this page switches the list reads from the legacy flat
 * Shipments sheet to /api/dashboard/traficos. Flat Shipments writes
 * from PO/shipment flows remain untouched — that's a separate spec.
 *
 * Per-row data:
 *   - TRF_ID + Trafico_Number
 *   - Status pill (via customs-data TRAFICO_STATUS_CONFIG)
 *   - Aggregated vendor names from Trafico_Items
 *   - Total invoice value (USD + MXN calculo)
 *   - Initiated date
 *   - Days-in-customs (if still in a customs phase)
 *   - Deep-link to /dashboard/shipments/[TRF_ID]
 */

import { useState, useEffect } from "react";
import {
  Truck,
  Package,
  Loader2,
  Plus,
  Search,
  Ship,
  CheckCircle2,
  Clock,
  MessageCircle,
  Flag,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { KPICard } from "@/app/(dashboard)/components/kpi-card";
import {
  TRAFICO_STATUS_CONFIG,
  type TraficoStatus,
} from "@/app/lib/customs-data";

interface FlatTrafico {
  TRF_ID: string;
  Trafico_Number: string;
  Status: string;
  Invoice_Value_USD: string;
  Calculo_Total_MXN: string;
  Initiated_Date: string;
  Completed_Date: string;
  Status_History_JSON: string;
  Item_Count: string;
  Pedimento_Number: string;
  Broker_Name: string;
}

interface FlatItem {
  TRF_ID: string;
  Vendor_Name: string;
}

const CUSTOMS_PHASES: ReadonlySet<string> = new Set([
  "awaiting-documents",
  "calculo-received",
  "payment-pending",
  "payment-sent",
]);

const hoursInCustomsFromHistory = (raw: string): number => {
  if (!raw) return 0;
  try {
    const history = JSON.parse(raw) as { status: string; timestamp: string }[];
    const sorted = [...history].sort(
      (a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp)
    );
    let total = 0;
    const now = Date.now();
    for (let i = 0; i < sorted.length; i++) {
      const entry = sorted[i];
      const entryTs = Date.parse(entry.timestamp);
      if (!Number.isFinite(entryTs)) continue;
      if (!CUSTOMS_PHASES.has(entry.status)) continue;
      const nextTs = i < sorted.length - 1
        ? Date.parse(sorted[i + 1].timestamp)
        : now;
      if (!Number.isFinite(nextTs)) continue;
      total += Math.max(0, nextTs - entryTs);
    }
    return Math.round(total / (1000 * 60 * 60));
  } catch {
    return 0;
  }
};

const ShipmentsPage = () => {
  const [traficos, setTraficos] = useState<FlatTrafico[]>([]);
  const [items, setItems] = useState<FlatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [trafRes, itemsRes] = await Promise.all([
          fetch("/api/dashboard/traficos", { cache: "no-store" }),
          fetch("/api/dashboard/trafico-items", { cache: "no-store" }),
        ]);
        if (!trafRes.ok) throw new Error("Failed to fetch traficos");
        const trafData = await trafRes.json();
        setTraficos(trafData.traficos ?? []);
        if (itemsRes.ok) {
          const itemsData = await itemsRes.json();
          setItems(itemsData.items ?? []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const vendorsByTrf = new Map<string, string[]>();
  for (const item of items) {
    if (!item.TRF_ID || !item.Vendor_Name) continue;
    if (!vendorsByTrf.has(item.TRF_ID)) vendorsByTrf.set(item.TRF_ID, []);
    const list = vendorsByTrf.get(item.TRF_ID)!;
    if (!list.includes(item.Vendor_Name)) list.push(item.Vendor_Name);
  }

  const filtered = traficos.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const vendors = (vendorsByTrf.get(t.TRF_ID) ?? []).join(" ").toLowerCase();
    return (
      t.TRF_ID?.toLowerCase().includes(q) ||
      t.Trafico_Number?.toLowerCase().includes(q) ||
      t.Status?.toLowerCase().includes(q) ||
      t.Pedimento_Number?.toLowerCase().includes(q) ||
      t.Broker_Name?.toLowerCase().includes(q) ||
      vendors.includes(q)
    );
  });

  const inTransitOrCustoms = traficos.filter(
    (t) =>
      t.Status === "collecting" ||
      t.Status === "sent-to-broker" ||
      t.Status === "awaiting-documents" ||
      t.Status === "calculo-received" ||
      t.Status === "payment-pending" ||
      t.Status === "payment-sent"
  ).length;
  const cleared = traficos.filter(
    (t) =>
      t.Status === "crossing-approved" ||
      t.Status === "in-transit-domestic" ||
      t.Status === "delivered-to-cc" ||
      t.Status === "factura-received" ||
      t.Status === "expediente-pending" ||
      t.Status === "complete"
  ).length;
  const withIssue = traficos.filter((t) => t.Status === "issue").length;

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
          <h2 className="text-2xl font-bold text-dash-text">Shipments</h2>
          <p className="text-sm text-dash-text-secondary mt-1">
            Batch crossings (Traficos) — click a row for full detail
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dash-text-secondary" />
            <input
              type="text"
              placeholder="Search by TRF, pedimento, broker, vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper w-72"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-dash-danger/10 text-dash-danger border border-dash-danger/20 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Total Crossings" value={String(traficos.length)} icon={Package} accentColor="bg-brand-copper" />
        <KPICard label="In Transit / Customs" value={String(inTransitOrCustoms)} icon={Truck} accentColor="bg-dash-info" />
        <KPICard label="Cleared / Delivered" value={String(cleared)} icon={CheckCircle2} accentColor="bg-dash-success" />
        <KPICard label="Issues" value={String(withIssue)} icon={Clock} accentColor="bg-dash-danger" />
      </div>

      {/* Content */}
      {traficos.length === 0 ? (
        <div className="bg-dash-surface rounded-xl border border-dash-border p-12 text-center">
          <Ship className="w-14 h-14 text-dash-text-secondary/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-dash-text mb-2">
            No Crossings Yet
          </h3>
          <p className="text-sm text-dash-text-secondary max-w-md mx-auto mb-6">
            When you create a batch crossing (Tráfico) from the Customs tab of
            the Pipeline, it will appear here. Click any row to see the full
            detail view with timeline, documents, and items.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/dashboard/customs"
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-copper text-white text-sm rounded-lg hover:bg-brand-copper/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Go to Customs
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-dash-surface rounded-xl border border-dash-border">
          <div className="p-5 border-b border-dash-border">
            <h3 className="text-sm font-semibold text-dash-text">
              All Crossings ({filtered.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dash-border text-left text-xs text-dash-text-secondary uppercase tracking-wider">
                  <th className="px-5 pb-3 pt-4">TRF ID</th>
                  <th className="pb-3 pt-4">Vendors</th>
                  <th className="pb-3 pt-4">Pedimento</th>
                  <th className="pb-3 pt-4">Invoice (USD)</th>
                  <th className="pb-3 pt-4">Cálculo (MXN)</th>
                  <th className="pb-3 pt-4">Initiated</th>
                  <th className="pb-3 pt-4">Days in Customs</th>
                  <th className="pb-3 pt-4">Status</th>
                  <th className="pb-3 pt-4 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const cfg = TRAFICO_STATUS_CONFIG[t.Status as TraficoStatus];
                  const vendors = vendorsByTrf.get(t.TRF_ID) ?? [];
                  const hoursInCustoms = hoursInCustomsFromHistory(t.Status_History_JSON);
                  const daysInCustoms = Math.floor(hoursInCustoms / 24);

                  const detailHref = `/dashboard/shipments/${encodeURIComponent(t.TRF_ID)}`;
                  return (
                    <tr
                      key={t.TRF_ID}
                      className="group border-b border-dash-border/50 hover:bg-dash-bg/40 text-dash-text cursor-pointer transition-colors"
                      onClick={() => {
                        window.location.href = detailHref;
                      }}
                      role="link"
                    >
                      <td className="px-5 py-3 font-mono text-xs font-medium">
                        <Link
                          href={detailHref}
                          className="text-brand-copper hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {t.Trafico_Number || t.TRF_ID}
                        </Link>
                      </td>
                      <td className="py-3 text-dash-text-secondary">
                        {vendors.length === 0
                          ? "—"
                          : vendors.length <= 2
                            ? vendors.join(", ")
                            : `${vendors[0]}, ${vendors[1]} +${vendors.length - 2}`}
                      </td>
                      <td className="py-3 font-mono text-xs">
                        {t.Pedimento_Number || "—"}
                      </td>
                      <td className="py-3 text-xs text-dash-text-secondary">
                        {t.Invoice_Value_USD ? `$${Number(t.Invoice_Value_USD).toLocaleString("en-US")}` : "—"}
                      </td>
                      <td className="py-3 text-xs text-dash-text-secondary">
                        {t.Calculo_Total_MXN ? `$${Number(t.Calculo_Total_MXN).toLocaleString("es-MX")}` : "—"}
                      </td>
                      <td className="py-3 text-xs">
                        {t.Initiated_Date || "—"}
                      </td>
                      <td className="py-3 text-xs">
                        {daysInCustoms > 0 ? (
                          <span
                            className={
                              daysInCustoms > 7
                                ? "text-dash-danger font-medium"
                                : daysInCustoms > 3
                                  ? "text-dash-warn"
                                  : "text-dash-text-secondary"
                            }
                          >
                            {daysInCustoms}d
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            cfg?.bg ?? "bg-dash-text-muted/10"
                          } ${cfg?.text ?? "text-dash-text-muted"}`}
                        >
                          {cfg?.label.en ?? t.Status}
                        </span>
                      </td>
                      <td className="py-3 pr-5">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 md:opacity-100 transition-opacity">
                          <Link
                            href={detailHref}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center justify-center w-7 h-7 rounded-md hover:bg-brand-copper/10 text-dash-text-secondary hover:text-brand-copper transition-colors"
                            title="View detail"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          {t.Broker_Name ? (
                            <a
                              href={`https://wa.me/?text=${encodeURIComponent(
                                `Hi, checking on pedimento ${t.Pedimento_Number || t.TRF_ID}`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center justify-center w-7 h-7 rounded-md hover:bg-dash-success/10 text-dash-text-secondary hover:text-dash-success transition-colors"
                              title={`Message ${t.Broker_Name}`}
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          ) : null}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `${detailHref}?flag=1`;
                            }}
                            className="inline-flex items-center justify-center w-7 h-7 rounded-md hover:bg-dash-danger/10 text-dash-text-secondary hover:text-dash-danger transition-colors cursor-pointer"
                            title="Flag issue"
                          >
                            <Flag className="w-3.5 h-3.5" />
                          </button>
                        </div>
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

export default ShipmentsPage;
