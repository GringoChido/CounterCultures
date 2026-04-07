"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import {
  Truck,
  Package,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  MapPin,
  Search,
  FileCheck,
  Ship,
} from "lucide-react";
import Link from "next/link";
import { KPICard } from "@/app/(dashboard)/components/kpi-card";
import {
  SAMPLE_PIPELINE,
  type DealShipment,
} from "@/app/lib/sample-dashboard-data";
import { SAMPLE_TRAFICOS } from "@/app/lib/sample-customs-data";
import { TRAFICO_STATUS_CONFIG } from "@/app/lib/customs-data";

// ---------------------------------------------------------------------------
// Collect all shipments from pipeline deals
// ---------------------------------------------------------------------------

interface ShipmentWithDeal extends DealShipment {
  dealName: string;
}

const allShipments: ShipmentWithDeal[] = SAMPLE_PIPELINE.flatMap((deal) =>
  (deal.shipments ?? []).map((s) => ({ ...s, dealName: deal.name }))
);

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

type ShipmentStatus = DealShipment["status"];

const statusConfig: Record<
  ShipmentStatus,
  { label: string; bg: string; text: string }
> = {
  "label-created": { label: "Label Created", bg: "bg-gray-500/10", text: "text-gray-400" },
  "in-transit": { label: "In Transit", bg: "bg-blue-500/10", text: "text-blue-400" },
  customs: { label: "Customs", bg: "bg-amber-500/10", text: "text-amber-400" },
  "out-for-delivery": { label: "Out for Delivery", bg: "bg-cyan-500/10", text: "text-cyan-400" },
  "delivered-to-cc": { label: "At CC Showroom", bg: "bg-teal-500/10", text: "text-teal-400" },
  "delivered-to-customer": { label: "Delivered", bg: "bg-green-500/10", text: "text-green-400" },
};

const inspectionConfig: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: "Pending", bg: "bg-gray-500/10", text: "text-gray-400" },
  passed: { label: "Passed", bg: "bg-green-500/10", text: "text-green-400" },
  damaged: { label: "Damaged", bg: "bg-red-500/10", text: "text-red-400" },
  "wrong-item": { label: "Wrong Item", bg: "bg-red-500/10", text: "text-red-400" },
};

type FilterKey = "all" | "in-transit" | "at-showroom" | "delivered" | "issues";

const filterButtons: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "in-transit", label: "In Transit" },
  { key: "at-showroom", label: "At Showroom" },
  { key: "delivered", label: "Delivered" },
  { key: "issues", label: "Issues" },
];

const matchesFilter = (s: ShipmentWithDeal, filter: FilterKey): boolean => {
  switch (filter) {
    case "all":
      return true;
    case "in-transit":
      return s.status === "in-transit" || s.status === "customs";
    case "at-showroom":
      return s.status === "delivered-to-cc";
    case "delivered":
      return s.status === "delivered-to-customer";
    case "issues":
      return s.inspectionStatus === "damaged" || s.inspectionStatus === "wrong-item";
  }
};

// ---------------------------------------------------------------------------
// KPI counts
// ---------------------------------------------------------------------------

const inTransitCount = allShipments.filter(
  (s) => s.status === "in-transit" || s.status === "customs"
).length;

const atShowroomCount = allShipments.filter(
  (s) => s.status === "delivered-to-cc"
).length;

const deliveredCount = allShipments.filter(
  (s) => s.status === "delivered-to-customer"
).length;

const issuesCount = allShipments.filter(
  (s) => s.inspectionStatus === "damaged" || s.inspectionStatus === "wrong-item"
).length;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const ShipmentsPage = () => {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filtered = allShipments.filter((s) => matchesFilter(s, activeFilter));

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          label="In Transit"
          value={String(inTransitCount)}
          icon={Truck}
          accentColor="bg-blue-500"
        />
        <KPICard
          label="At CC Showroom"
          value={String(atShowroomCount)}
          icon={Package}
          accentColor="bg-teal-500"
        />
        <KPICard
          label="Delivered"
          value={String(deliveredCount)}
          icon={CheckCircle2}
          accentColor="bg-green-500"
        />
        <KPICard
          label="Issues"
          value={String(issuesCount)}
          icon={AlertTriangle}
          accentColor="bg-red-500"
        />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2">
        {filterButtons.map((btn) => (
          <button
            key={btn.key}
            onClick={() => setActiveFilter(btn.key)}
            className={`px-4 py-1.5 text-sm rounded-lg border transition-colors cursor-pointer ${
              activeFilter === btn.key
                ? "bg-brand-copper text-white border-brand-copper"
                : "bg-dash-surface text-dash-text-secondary border-dash-border hover:border-brand-copper/30"
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Active Shipments Table */}
      <div className="bg-dash-surface rounded-xl border border-dash-border overflow-hidden">
        <div className="px-5 py-4 border-b border-dash-border">
          <h2 className="text-lg font-semibold text-dash-text">Active Shipments</h2>
          <p className="text-sm text-dash-text-secondary mt-0.5">
            {filtered.length} shipment{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dash-border text-left">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary w-8" />
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">PO #</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Brand</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Customer / Deal</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Carrier</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Tracking #</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Status</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">ETA</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">Destination</th>
              </tr>
            </thead>
            {filtered.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center">
                    <Search className="w-8 h-8 text-dash-text-secondary/30 mx-auto mb-2" />
                    <p className="text-dash-text-secondary">No shipments match this filter</p>
                  </td>
                </tr>
              </tbody>
            ) : (
              filtered.map((shipment) => {
                const isExpanded = expandedRows.has(shipment.id);
                const sc = statusConfig[shipment.status];

                return (
                  <tbody key={shipment.id}>
                    <tr
                      onClick={() => toggleRow(shipment.id)}
                      className="border-b border-dash-border hover:bg-dash-bg/50 transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-3 text-dash-text-secondary">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </td>
                      <td className="px-5 py-3 text-dash-text font-medium">{shipment.poId}</td>
                      <td className="px-5 py-3 text-dash-text">{shipment.brand}</td>
                      <td className="px-5 py-3">
                        <span className="text-dash-text">{shipment.dealName}</span>
                      </td>
                      <td className="px-5 py-3 text-dash-text-secondary">{shipment.carrier ?? "—"}</td>
                      <td className="px-5 py-3 font-mono text-xs text-dash-text-secondary">
                        {shipment.trackingNumber ?? "—"}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-dash-text-secondary">
                        {shipment.estimatedArrival
                          ? format(parseISO(shipment.estimatedArrival), "MMM d, yyyy")
                          : shipment.actualArrival
                            ? format(parseISO(shipment.actualArrival), "MMM d, yyyy")
                            : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1 text-dash-text-secondary">
                          <MapPin className="w-3 h-3" />
                          {shipment.destination === "cc-showroom" ? "CC Showroom" : "Customer Direct"}
                        </span>
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {isExpanded && (
                      <tr className="bg-dash-bg/30 border-b border-dash-border">
                        <td colSpan={9} className="px-5 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Items */}
                            <div>
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary mb-3">
                                Items
                              </h4>
                              <div className="space-y-2">
                                {shipment.items.map((item) => (
                                  <div
                                    key={item.sku}
                                    className="flex items-center justify-between bg-dash-surface rounded-lg border border-dash-border px-3 py-2"
                                  >
                                    <div>
                                      <p className="text-sm text-dash-text font-medium">{item.productName}</p>
                                      <p className="text-xs text-dash-text-secondary">SKU: {item.sku}</p>
                                    </div>
                                    <span className="text-xs text-dash-text-secondary">
                                      Qty: {item.quantity}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Inspection & Details */}
                            <div className="space-y-4">
                              {/* Multi-leg tracking */}
                              {shipment.legs && shipment.legs.length > 0 && (
                                <div>
                                  <h4 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary mb-3">
                                    Multi-Leg Tracking
                                  </h4>
                                  <div className="space-y-2">
                                    {shipment.legs.map((leg, li) => (
                                      <div key={li} className="flex items-center gap-3 bg-dash-surface rounded-lg border border-dash-border px-3 py-2">
                                        <Ship className="w-3.5 h-3.5 text-dash-text-secondary shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-medium text-dash-text">
                                            {leg.leg === "us-to-border" ? "US → Border" : leg.leg === "domestic-to-sma" ? "Border → SMA" : "Direct"}
                                          </p>
                                          <p className="text-[10px] text-dash-text-secondary">
                                            {leg.carrier} &middot; {leg.trackingNumber}
                                          </p>
                                        </div>
                                        <span className="text-[10px] text-dash-text-secondary">{leg.status}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Customs sub-status */}
                              {shipment.status === "customs" && shipment.traficoId && (() => {
                                const trafico = SAMPLE_TRAFICOS.find((t) => t.id === shipment.traficoId);
                                if (!trafico) return null;
                                const tsc = TRAFICO_STATUS_CONFIG[trafico.status];
                                return (
                                  <div>
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary mb-3">
                                      Customs Status
                                    </h4>
                                    <div className="bg-dash-surface rounded-lg border border-dash-border px-3 py-2">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-medium text-dash-text">
                                          Trafico {trafico.traficoNumber}
                                        </span>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${tsc.bg} ${tsc.text}`}>
                                          {tsc.label.en}
                                        </span>
                                      </div>
                                      <Link
                                        href="/dashboard/customs"
                                        className="inline-flex items-center gap-1 text-[10px] text-brand-copper hover:text-brand-copper/80 transition-colors mt-1"
                                      >
                                        <FileCheck className="w-3 h-3" /> View in Customs
                                      </Link>
                                    </div>
                                  </div>
                                );
                              })()}

                              <div>
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary mb-3">
                                  Inspection Status
                                </h4>
                                {shipment.inspectionStatus ? (
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      inspectionConfig[shipment.inspectionStatus].bg
                                    } ${inspectionConfig[shipment.inspectionStatus].text}`}
                                  >
                                    {inspectionConfig[shipment.inspectionStatus].label}
                                  </span>
                                ) : (
                                  <span className="text-sm text-dash-text-secondary">Not inspected yet</span>
                                )}
                              </div>

                              {shipment.inspectionNotes && (
                                <div>
                                  <h4 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary mb-2">
                                    Inspection Notes
                                  </h4>
                                  <p className="text-sm text-dash-text leading-relaxed bg-dash-surface rounded-lg border border-dash-border px-3 py-2">
                                    {shipment.inspectionNotes}
                                  </p>
                                </div>
                              )}

                              <div className="space-y-1.5 text-sm">
                                {shipment.shipDate && (
                                  <p>
                                    <span className="text-dash-text-secondary">Shipped:</span>{" "}
                                    <span className="text-dash-text">
                                      {format(parseISO(shipment.shipDate), "MMM d, yyyy")}
                                    </span>
                                  </p>
                                )}
                                {shipment.actualArrival && (
                                  <p>
                                    <span className="text-dash-text-secondary">Arrived:</span>{" "}
                                    <span className="text-dash-text">
                                      {format(parseISO(shipment.actualArrival), "MMM d, yyyy")}
                                    </span>
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                );
              })
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default ShipmentsPage;
