"use client";

import { useState, useEffect } from "react";
import {
  Truck,
  Package,
  Loader2,
  AlertCircle,
  Plus,
  Search,
  Ship,
  CheckCircle2,
  Clock,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { KPICard } from "@/app/(dashboard)/components/kpi-card";

// ---------------------------------------------------------------------------
// Types (matching Shipments sheet)
// ---------------------------------------------------------------------------

interface ShipmentRecord {
  Shipment_ID: string;
  Deal_ID: string;
  PO_ID: string;
  Brand: string;
  Carrier: string;
  Tracking: string;
  Status: string;
  Ship_Date: string;
  Est_Arrival: string;
  Actual_Arrival: string;
  Destination: string;
  Items_JSON: string;
  Inspection_Status: string;
  Inspection_Notes: string;
  Photo_IDs: string;
}

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  "label-created": { label: "Label Created", bg: "bg-gray-500/10", text: "text-gray-400" },
  "in-transit": { label: "In Transit", bg: "bg-blue-500/10", text: "text-blue-400" },
  customs: { label: "Customs", bg: "bg-amber-500/10", text: "text-amber-400" },
  "out-for-delivery": { label: "Out for Delivery", bg: "bg-cyan-500/10", text: "text-cyan-400" },
  "delivered-to-cc": { label: "At CC Showroom", bg: "bg-teal-500/10", text: "text-teal-400" },
  "delivered-to-customer": { label: "Delivered", bg: "bg-green-500/10", text: "text-green-400" },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ShipmentsPage = () => {
  const [shipments, setShipments] = useState<ShipmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        const res = await fetch("/api/dashboard/shipments");
        if (!res.ok) throw new Error("Failed to fetch shipments");
        const data = await res.json();
        setShipments(data.shipments ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    fetchShipments();
  }, []);

  const filtered = shipments.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.Shipment_ID?.toLowerCase().includes(q) ||
      s.Brand?.toLowerCase().includes(q) ||
      s.Carrier?.toLowerCase().includes(q) ||
      s.Tracking?.toLowerCase().includes(q) ||
      s.Destination?.toLowerCase().includes(q)
    );
  });

  const inTransit = shipments.filter(
    (s) => s.Status === "in-transit" || s.Status === "customs"
  ).length;
  const delivered = shipments.filter(
    (s) => s.Status === "delivered-to-cc" || s.Status === "delivered-to-customer"
  ).length;

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
            Track incoming shipments from manufacturers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dash-text-secondary" />
            <input
              type="text"
              placeholder="Search shipments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper w-56"
            />
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Total Shipments" value={String(shipments.length)} icon={Package} accentColor="bg-brand-copper" />
        <KPICard label="In Transit" value={String(inTransit)} icon={Truck} accentColor="bg-blue-500" />
        <KPICard label="Delivered" value={String(delivered)} icon={CheckCircle2} accentColor="bg-green-500" />
        <KPICard label="Pending Inspection" value={String(shipments.filter((s) => s.Inspection_Status === "pending").length)} icon={Clock} accentColor="bg-amber-500" />
      </div>

      {/* Content */}
      {shipments.length === 0 ? (
        <div className="bg-dash-surface rounded-xl border border-dash-border p-12 text-center">
          <Ship className="w-14 h-14 text-dash-text-secondary/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-dash-text mb-2">
            No Shipments Yet
          </h3>
          <p className="text-sm text-dash-text-secondary max-w-md mx-auto mb-6">
            When you create purchase orders from deals in the Pipeline, shipments
            will be tracked here automatically. You can also add shipments
            manually from the &ldquo;Shipments&rdquo; tab in your CRM spreadsheet.
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
              href={`https://docs.google.com/spreadsheets/d/${process.env.NEXT_PUBLIC_SHEETS_ID || "1iXG4A6bzrRSodbendoi-IVy6gi1cqiKbDado_bH7Yt0"}/edit#gid=0`}
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
          <div className="p-5 border-b border-dash-border">
            <h3 className="text-sm font-semibold text-dash-text">
              All Shipments ({filtered.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dash-border text-left text-xs text-dash-text-secondary uppercase tracking-wider">
                  <th className="px-5 pb-3 pt-4">ID</th>
                  <th className="pb-3 pt-4">Brand</th>
                  <th className="pb-3 pt-4">Carrier</th>
                  <th className="pb-3 pt-4">Tracking</th>
                  <th className="pb-3 pt-4">Destination</th>
                  <th className="pb-3 pt-4">Ship Date</th>
                  <th className="pb-3 pt-4">Est. Arrival</th>
                  <th className="pb-3 pt-4">Status</th>
                  <th className="pb-3 pt-4">Inspection</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const sCfg = statusConfig[s.Status] ?? {
                    label: s.Status || "Unknown",
                    bg: "bg-gray-500/10",
                    text: "text-gray-400",
                  };
                  return (
                    <tr
                      key={s.Shipment_ID}
                      className="border-b border-dash-border/50 hover:bg-dash-bg/50 text-dash-text"
                    >
                      <td className="px-5 py-3 font-mono text-xs font-medium">
                        {s.Shipment_ID}
                      </td>
                      <td className="py-3">{s.Brand || "—"}</td>
                      <td className="py-3 text-dash-text-secondary">
                        {s.Carrier || "—"}
                      </td>
                      <td className="py-3 font-mono text-xs">
                        {s.Tracking || "—"}
                      </td>
                      <td className="py-3 text-dash-text-secondary">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {s.Destination || "—"}
                        </div>
                      </td>
                      <td className="py-3 text-xs">{s.Ship_Date || "—"}</td>
                      <td className="py-3 text-xs">
                        {s.Est_Arrival || "—"}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${sCfg.bg} ${sCfg.text}`}
                        >
                          {sCfg.label}
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            s.Inspection_Status === "passed"
                              ? "bg-green-500/10 text-green-400"
                              : s.Inspection_Status === "damaged"
                                ? "bg-red-500/10 text-red-400"
                                : "bg-gray-500/10 text-gray-400"
                          }`}
                        >
                          {s.Inspection_Status || "—"}
                        </span>
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
