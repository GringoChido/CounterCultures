"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import {
  FileCheck,
  Clock,
  DollarSign,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Check,
  AlertTriangle,
  Circle,
  ExternalLink,
  Send,
  Upload,
  PenLine,
  X,
  Ship,
  Package,
  FileText,
  MessageSquare,
  Calculator,
  BarChart3,
} from "lucide-react";
import { KPICard } from "@/app/(dashboard)/components/kpi-card";
import {
  SAMPLE_TRAFICOS,
  SAMPLE_BROKER_MESSAGES,
} from "@/app/lib/sample-customs-data";
import {
  TRAFICO_STATUS_CONFIG,
  getDocumentChecklist,
  type Trafico,
  type TraficoStatus,
  type DocumentCheckStatus,
  type PedimentoItem,
} from "@/app/lib/customs-data";
import { reconcileTrafico } from "@/app/lib/reconciliation";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatMXN = (value: number) =>
  `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;

const formatUSD = (value: number) =>
  `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;

const docStatusIcon = (status: DocumentCheckStatus) => {
  switch (status) {
    case "uploaded":
      return <Check className="w-3.5 h-3.5 text-green-400" />;
    case "in-progress":
      return <Clock className="w-3.5 h-3.5 text-amber-400" />;
    case "missing":
      return <X className="w-3.5 h-3.5 text-red-400" />;
    case "not-applicable":
      return <Circle className="w-3.5 h-3.5 text-dash-text-secondary/40" />;
  }
};

// ---------------------------------------------------------------------------
// KPI calculations
// ---------------------------------------------------------------------------

const activeTraficos = SAMPLE_TRAFICOS.filter(
  (t) => t.status !== "complete" && t.status !== "issue"
);

const awaitingDocsCount = SAMPLE_TRAFICOS.filter(
  (t) => t.status === "awaiting-documents"
).length;

const paymentPendingTotal = SAMPLE_TRAFICOS.filter(
  (t) => t.status === "calculo-received" || t.status === "payment-pending"
).reduce((sum, t) => sum + (t.calculoTotal ?? 0) + (t.truckCrossingFee ?? 0), 0);

const importCostMTD = SAMPLE_TRAFICOS.filter((t) => {
  if (t.status !== "complete" || !t.completedDate) return false;
  const completed = new Date(t.completedDate);
  const now = new Date();
  return completed.getMonth() === now.getMonth() && completed.getFullYear() === now.getFullYear();
}).reduce((sum, t) => sum + (t.totalImportCost ?? 0), 0);

// ---------------------------------------------------------------------------
// Filter
// ---------------------------------------------------------------------------

type FilterKey = "all" | "active" | "complete";

const filterButtons: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "complete", label: "Complete" },
];

// ---------------------------------------------------------------------------
// Status Stepper component
// ---------------------------------------------------------------------------

const STATUS_ORDER: TraficoStatus[] = [
  "collecting", "sent-to-broker", "at-warehouse", "import-open",
  "awaiting-documents", "import-closed", "calculo-received", "payment-pending",
  "payment-sent", "crossing-approved", "in-transit-domestic", "delivered-to-cc",
  "factura-received", "expediente-pending", "complete",
];

const StatusStepper = ({ status }: { status: TraficoStatus }) => {
  const currentStep = TRAFICO_STATUS_CONFIG[status]?.step ?? 0;

  return (
    <div className="flex items-center gap-0.5">
      {STATUS_ORDER.map((s, i) => {
        const step = i + 1;
        const isCurrent = s === status;
        const isPast = step < currentStep;

        return (
          <div
            key={s}
            className={`w-2 h-2 rounded-full transition-colors ${
              isCurrent
                ? "bg-brand-copper ring-2 ring-brand-copper/30"
                : isPast
                  ? "bg-green-400"
                  : "bg-dash-border"
            }`}
            title={TRAFICO_STATUS_CONFIG[s].label.en}
          />
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Trafico Detail SlideOut tabs
// ---------------------------------------------------------------------------

type DetailTab = "overview" | "items" | "financials" | "documents" | "reconciliation" | "communication";

const detailTabConfig: { key: DetailTab; label: string; icon: React.ElementType }[] = [
  { key: "overview", label: "Overview", icon: FileCheck },
  { key: "items", label: "Items", icon: Package },
  { key: "financials", label: "Financials", icon: Calculator },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "reconciliation", label: "Reconciliation", icon: BarChart3 },
  { key: "communication", label: "Messages", icon: MessageSquare },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const CustomsPage = () => {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [expandedTrafico, setExpandedTrafico] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");

  const filtered = SAMPLE_TRAFICOS.filter((t) => {
    switch (activeFilter) {
      case "active":
        return t.status !== "complete" && t.status !== "issue";
      case "complete":
        return t.status === "complete";
      default:
        return true;
    }
  });

  const selectedTrafico = expandedTrafico
    ? SAMPLE_TRAFICOS.find((t) => t.id === expandedTrafico)
    : null;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          label="Active Crossings"
          value={String(activeTraficos.length)}
          icon={Ship}
          accentColor="bg-blue-500"
        />
        <KPICard
          label="Awaiting Documents"
          value={String(awaitingDocsCount)}
          icon={Clock}
          accentColor="bg-amber-500"
        />
        <KPICard
          label="Payment Pending"
          value={paymentPendingTotal > 0 ? formatMXN(paymentPendingTotal) : "$0"}
          icon={DollarSign}
          accentColor="bg-orange-500"
        />
        <KPICard
          label="Import Cost MTD"
          value={importCostMTD > 0 ? formatMXN(importCostMTD) : "$0"}
          icon={TrendingUp}
          accentColor="bg-brand-copper"
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

      {/* Main Layout: List + Detail */}
      <div className="flex gap-6">
        {/* Trafico List */}
        <div className={`space-y-4 ${selectedTrafico ? "w-1/2" : "w-full"}`}>
          <div className="bg-dash-surface rounded-xl border border-dash-border overflow-hidden">
            <div className="px-5 py-4 border-b border-dash-border">
              <h2 className="text-lg font-semibold text-dash-text">Pedimento Tracker</h2>
              <p className="text-sm text-dash-text-secondary mt-0.5">
                {filtered.length} crossing{filtered.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="divide-y divide-dash-border">
              {filtered.map((trafico) => {
                const sc = TRAFICO_STATUS_CONFIG[trafico.status];
                const docChecklist = getDocumentChecklist(trafico);
                const uploadedDocs = docChecklist.filter((d) => d.status === "uploaded").length;
                const isSelected = expandedTrafico === trafico.id;

                return (
                  <div
                    key={trafico.id}
                    onClick={() => {
                      setExpandedTrafico(isSelected ? null : trafico.id);
                      setActiveTab("overview");
                    }}
                    className={`px-5 py-4 cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-brand-copper/5 border-l-2 border-l-brand-copper"
                        : "hover:bg-dash-bg/50"
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-dash-text">
                              {trafico.traficoNumber}
                            </h3>
                            {trafico.pedimentoNumber && (
                              <span className="text-xs text-dash-text-secondary font-mono">
                                {trafico.pedimentoNumber}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-dash-text-secondary mt-0.5">
                            {trafico.items.length} item{trafico.items.length !== 1 ? "s" : ""} &middot;{" "}
                            {trafico.invoiceValueUSD
                              ? formatUSD(trafico.invoiceValueUSD)
                              : "Value TBD"}
                          </p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>
                        {sc.label.en}
                      </span>
                    </div>

                    {/* Status Stepper */}
                    <div className="mb-3">
                      <StatusStepper status={trafico.status} />
                    </div>

                    {/* Vendor list */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {[...new Set(trafico.items.map((i) => i.vendorName))].map((vendor) => (
                        <span
                          key={vendor}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-dash-bg border border-dash-border text-dash-text-secondary"
                        >
                          {vendor}
                        </span>
                      ))}
                    </div>

                    {/* Document progress */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-dash-text-secondary">
                        <FileText className="w-3 h-3" />
                        <span>
                          {uploadedDocs}/{docChecklist.length} documents
                        </span>
                      </div>
                      {trafico.totalImportCost && (
                        <span className="text-xs font-medium text-dash-text">
                          {formatMXN(trafico.totalImportCost)}
                        </span>
                      )}
                    </div>

                    {/* Key dates */}
                    {trafico.initiatedDate && (
                      <div className="flex items-center gap-4 mt-2 text-[10px] text-dash-text-secondary">
                        {trafico.initiatedDate && (
                          <span>Initiated: {format(parseISO(trafico.initiatedDate), "MMM d")}</span>
                        )}
                        {trafico.paymentSentDate && (
                          <span>Paid: {format(parseISO(trafico.paymentSentDate), "MMM d")}</span>
                        )}
                        {trafico.completedDate && (
                          <span>Complete: {format(parseISO(trafico.completedDate), "MMM d")}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Detail Panel */}
        {selectedTrafico && (
          <div className="w-1/2 bg-dash-surface rounded-xl border border-dash-border overflow-hidden sticky top-4 max-h-[calc(100vh-120px)] flex flex-col">
            {/* Detail Header */}
            <div className="px-5 py-4 border-b border-dash-border shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-dash-text">
                    Trafico {selectedTrafico.traficoNumber}
                  </h3>
                  {selectedTrafico.pedimentoNumber && (
                    <p className="text-xs text-dash-text-secondary font-mono">
                      {selectedTrafico.pedimentoNumber}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setExpandedTrafico(null)}
                  className="p-1.5 rounded-md hover:bg-dash-bg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 text-dash-text-secondary" />
                </button>
              </div>

              {/* Tab Navigation */}
              <div className="flex gap-1 mt-3 -mb-4 overflow-x-auto">
                {detailTabConfig.map((tab) => {
                  const TabIcon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition-colors cursor-pointer whitespace-nowrap ${
                        activeTab === tab.key
                          ? "bg-dash-bg text-brand-copper border-b-2 border-brand-copper"
                          : "text-dash-text-secondary hover:text-dash-text"
                      }`}
                    >
                      <TabIcon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {activeTab === "overview" && (
                <OverviewTab trafico={selectedTrafico} />
              )}
              {activeTab === "items" && (
                <ItemsTab trafico={selectedTrafico} />
              )}
              {activeTab === "financials" && (
                <FinancialsTab trafico={selectedTrafico} />
              )}
              {activeTab === "documents" && (
                <DocumentsTab trafico={selectedTrafico} />
              )}
              {activeTab === "reconciliation" && (
                <ReconciliationTab trafico={selectedTrafico} />
              )}
              {activeTab === "communication" && (
                <CommunicationTab trafico={selectedTrafico} />
              )}
            </div>

            {/* Quick Actions Footer */}
            <div className="border-t border-dash-border px-5 py-3 shrink-0">
              <div className="flex flex-wrap gap-2">
                {selectedTrafico.status === "collecting" && (
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors cursor-pointer">
                    <Send className="w-3 h-3" /> Send to Broker
                  </button>
                )}
                {selectedTrafico.status === "calculo-received" && (
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors cursor-pointer">
                    <DollarSign className="w-3 h-3" /> Approve Calculo
                  </button>
                )}
                {(selectedTrafico.status === "payment-pending" || selectedTrafico.status === "calculo-received") && (
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors cursor-pointer">
                    <Upload className="w-3 h-3" /> Upload Payment Receipt
                  </button>
                )}
                {selectedTrafico.status === "expediente-pending" && (
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-brand-copper/10 text-brand-copper hover:bg-brand-copper/20 transition-colors cursor-pointer">
                    <PenLine className="w-3 h-3" /> Sign Expediente
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Tab: Overview
// ---------------------------------------------------------------------------

const OverviewTab = ({ trafico }: { trafico: Trafico }) => {
  const sc = TRAFICO_STATUS_CONFIG[trafico.status];

  return (
    <div className="space-y-6">
      {/* Status + Timeline */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary mb-3">
          Status Timeline
        </h4>
        <div className="space-y-2">
          {trafico.statusHistory.slice(-8).map((entry, i) => {
            const entryConfig = TRAFICO_STATUS_CONFIG[entry.status];
            return (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 ${entryConfig.text.replace("text-", "bg-")}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-dash-text font-medium">
                      {entryConfig.label.en}
                    </span>
                    {entry.actor && (
                      <span className="text-[10px] text-dash-text-secondary">
                        by {entry.actor}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-dash-text-secondary">
                    {format(parseISO(entry.timestamp), "MMM d, yyyy h:mm a")}
                  </p>
                  {entry.note && (
                    <p className="text-xs text-dash-text-secondary mt-0.5">{entry.note}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Broker Info */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary mb-3">
          Broker & Warehouse
        </h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-dash-text-secondary text-xs">Broker</p>
            <p className="text-dash-text">{trafico.brokerName}</p>
            <p className="text-xs text-dash-text-secondary">{trafico.brokerEmail}</p>
          </div>
          <div>
            <p className="text-dash-text-secondary text-xs">Crossing Agent</p>
            <p className="text-dash-text">{trafico.crossingAgent ?? "—"}</p>
          </div>
          <div className="col-span-2">
            <p className="text-dash-text-secondary text-xs">Warehouse</p>
            <p className="text-dash-text">{trafico.warehouseName}</p>
            <p className="text-xs text-dash-text-secondary">{trafico.warehouseAddress}</p>
          </div>
        </div>
      </div>

      {/* Domestic Tracking */}
      {trafico.domesticCarrier && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary mb-3">
            Domestic Shipping (MX)
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-dash-text-secondary text-xs">Carrier</p>
              <p className="text-dash-text">{trafico.domesticCarrier}</p>
            </div>
            <div>
              <p className="text-dash-text-secondary text-xs">Tracking</p>
              <p className="text-dash-text font-mono text-xs">{trafico.domesticTracking ?? "—"}</p>
            </div>
            {trafico.domesticActualArrival && (
              <div>
                <p className="text-dash-text-secondary text-xs">Arrived</p>
                <p className="text-dash-text">{format(parseISO(trafico.domesticActualArrival), "MMM d, yyyy")}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {trafico.notes && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary mb-2">
            Notes
          </h4>
          <p className="text-sm text-dash-text leading-relaxed bg-dash-bg rounded-lg border border-dash-border px-3 py-2">
            {trafico.notes}
          </p>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Tab: Items
// ---------------------------------------------------------------------------

const ItemsTab = ({ trafico }: { trafico: Trafico }) => (
  <div className="space-y-4">
    {trafico.items.map((item) => (
      <div
        key={item.id}
        className="bg-dash-bg rounded-lg border border-dash-border p-4"
      >
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-sm font-medium text-dash-text">{item.vendorName}</p>
            <p className="text-xs text-dash-text-secondary font-mono">{item.vendorInvoiceNumber}</p>
          </div>
          <span className="text-sm font-medium text-dash-text">
            {formatUSD(item.invoiceTotal)}
          </span>
        </div>

        {/* Products */}
        <div className="space-y-1 mb-3">
          {item.products.map((p, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-dash-text-secondary">
                {p.description} <span className="font-mono">({p.sku})</span> x{p.quantity}
              </span>
              <span className="text-dash-text-secondary">{formatUSD(p.amount)}</span>
            </div>
          ))}
        </div>

        {/* Item metadata */}
        <div className="flex flex-wrap gap-2 text-[10px]">
          {item.countryOfOrigin && (
            <span className="px-2 py-0.5 rounded-md bg-dash-surface border border-dash-border text-dash-text-secondary">
              Origin: {item.countryOfOrigin}
            </span>
          )}
          <span className={`px-2 py-0.5 rounded-md ${
            item.usmcaStatus === "on-file"
              ? "bg-green-500/10 text-green-400"
              : item.usmcaStatus === "requested"
                ? "bg-amber-500/10 text-amber-400"
                : "bg-dash-surface text-dash-text-secondary border border-dash-border"
          }`}>
            USMCA: {item.usmcaStatus}
          </span>
          <span className={`px-2 py-0.5 rounded-md ${
            item.spanishManualsStatus === "on-file"
              ? "bg-green-500/10 text-green-400"
              : item.spanishManualsStatus === "in-translation"
                ? "bg-amber-500/10 text-amber-400"
                : "bg-dash-surface text-dash-text-secondary border border-dash-border"
          }`}>
            Manual: {item.spanishManualsStatus}
          </span>
          {item.isReplacement && (
            <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400">Replacement</span>
          )}
          {item.isLateAddition && (
            <span className="px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-400">Late Add</span>
          )}
        </div>

        {/* Tracking */}
        <div className="mt-2 text-xs text-dash-text-secondary">
          {item.usCarrier} &middot; {item.usTracking}
        </div>
      </div>
    ))}
  </div>
);

// ---------------------------------------------------------------------------
// Tab: Financials
// ---------------------------------------------------------------------------

const FinancialsTab = ({ trafico }: { trafico: Trafico }) => {
  const breakdown = trafico.calculoBreakdown;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-dash-bg rounded-lg border border-dash-border p-3">
          <p className="text-[10px] text-dash-text-secondary uppercase tracking-wider">Invoice Value</p>
          <p className="text-lg font-semibold text-dash-text">
            {trafico.invoiceValueUSD ? formatUSD(trafico.invoiceValueUSD) : "—"}
          </p>
        </div>
        <div className="bg-dash-bg rounded-lg border border-dash-border p-3">
          <p className="text-[10px] text-dash-text-secondary uppercase tracking-wider">Total Import Cost</p>
          <p className="text-lg font-semibold text-dash-text">
            {trafico.totalImportCost ? formatMXN(trafico.totalImportCost) : "—"}
          </p>
        </div>
        <div className="bg-dash-bg rounded-lg border border-dash-border p-3">
          <p className="text-[10px] text-dash-text-secondary uppercase tracking-wider">Exchange Rate</p>
          <p className="text-lg font-semibold text-dash-text">
            {trafico.exchangeRate ? `$${trafico.exchangeRate.toFixed(4)}` : "—"}
          </p>
        </div>
        <div className="bg-dash-bg rounded-lg border border-dash-border p-3">
          <p className="text-[10px] text-dash-text-secondary uppercase tracking-wider">Customs Value</p>
          <p className="text-lg font-semibold text-dash-text">
            {trafico.customsValueMXN ? formatMXN(trafico.customsValueMXN) : "—"}
          </p>
        </div>
      </div>

      {/* Calculo Breakdown */}
      {breakdown && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary mb-3">
            Calculo Breakdown
          </h4>
          <div className="space-y-4">
            {/* Taxes */}
            <div className="bg-dash-bg rounded-lg border border-dash-border p-3">
              <p className="text-xs font-medium text-dash-text mb-2">Cuadro de Contribuciones (Taxes)</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-dash-text-secondary">IGI (Ad Valorem)</span><span className="text-dash-text">{formatMXN(breakdown.igi)}</span></div>
                <div className="flex justify-between"><span className="text-dash-text-secondary">PRV</span><span className="text-dash-text">{formatMXN(breakdown.prv)}</span></div>
                <div className="flex justify-between"><span className="text-dash-text-secondary">CNT</span><span className="text-dash-text">{formatMXN(breakdown.cnt)}</span></div>
                <div className="flex justify-between"><span className="text-dash-text-secondary">DTA</span><span className="text-dash-text">{formatMXN(breakdown.dta)}</span></div>
                <div className="flex justify-between"><span className="text-dash-text-secondary">IVA (16%)</span><span className="text-dash-text">{formatMXN(breakdown.iva)}</span></div>
                <div className="flex justify-between border-t border-dash-border pt-1 mt-1 font-medium"><span className="text-dash-text">Subtotal</span><span className="text-dash-text">{formatMXN(breakdown.taxSubtotal)}</span></div>
              </div>
            </div>

            {/* Broker Fees */}
            <div className="bg-dash-bg rounded-lg border border-dash-border p-3">
              <p className="text-xs font-medium text-dash-text mb-2">Cuenta Mexicana (Broker Fees)</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-dash-text-secondary">Honorarios</span><span className="text-dash-text">{formatMXN(breakdown.honorarios)}</span></div>
                <div className="flex justify-between"><span className="text-dash-text-secondary">Complementarios</span><span className="text-dash-text">{formatMXN(breakdown.complementarios)}</span></div>
                <div className="flex justify-between"><span className="text-dash-text-secondary">Prevalidacion</span><span className="text-dash-text">{formatMXN(breakdown.prevalidacion)}</span></div>
                <div className="flex justify-between"><span className="text-dash-text-secondary">Validacion</span><span className="text-dash-text">{formatMXN(breakdown.validacion)}</span></div>
                <div className="flex justify-between"><span className="text-dash-text-secondary">IVA Cuenta Mexicana</span><span className="text-dash-text">{formatMXN(breakdown.ivaCuentaMexicana)}</span></div>
                <div className="flex justify-between border-t border-dash-border pt-1 mt-1 font-medium"><span className="text-dash-text">Subtotal</span><span className="text-dash-text">{formatMXN(breakdown.brokerSubtotal)}</span></div>
              </div>
            </div>

            {/* Warehouse */}
            <div className="bg-dash-bg rounded-lg border border-dash-border p-3">
              <p className="text-xs font-medium text-dash-text mb-2">Cuenta Americana (Warehouse Handling)</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-dash-text-secondary">Revision y Clasificacion</span><span className="text-dash-text">{formatMXN(breakdown.revisionClasificacion)}</span></div>
                <div className="flex justify-between"><span className="text-dash-text-secondary">Carga y Descarga</span><span className="text-dash-text">{formatMXN(breakdown.cargaDescarga)}</span></div>
                <div className="flex justify-between"><span className="text-dash-text-secondary">Coordinacion y Manejo</span><span className="text-dash-text">{formatMXN(breakdown.coordinacionManejo)}</span></div>
                <div className="flex justify-between"><span className="text-dash-text-secondary">Etiquetas y Manuales</span><span className="text-dash-text">{formatMXN(breakdown.etiquetasManuales)}</span></div>
                <div className="flex justify-between"><span className="text-dash-text-secondary">Otros (VUCEM + Shipper)</span><span className="text-dash-text">{formatMXN(breakdown.otrosVUCEM)}</span></div>
                <div className="flex justify-between"><span className="text-dash-text-secondary">Re-Trabajo</span><span className="text-dash-text">{formatMXN(breakdown.reTrabajo)}</span></div>
                <div className="flex justify-between border-t border-dash-border pt-1 mt-1 font-medium"><span className="text-dash-text">Subtotal</span><span className="text-dash-text">{formatMXN(breakdown.warehouseSubtotal)}</span></div>
              </div>
            </div>

            {/* Grand total */}
            <div className="bg-brand-copper/10 rounded-lg border border-brand-copper/20 p-3">
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-dash-text">Total Calculo</span>
                <span className="text-brand-copper">{trafico.calculoTotal ? formatMXN(trafico.calculoTotal) : "—"}</span>
              </div>
              {trafico.truckCrossingFee && (
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-dash-text-secondary">+ Truck Crossing Fee</span>
                  <span className="text-dash-text">{formatMXN(trafico.truckCrossingFee)}</span>
                </div>
              )}
              {trafico.totalImportCost && (
                <div className="flex justify-between text-sm font-bold mt-2 pt-2 border-t border-brand-copper/20">
                  <span className="text-dash-text">Total Import Cost</span>
                  <span className="text-brand-copper">{formatMXN(trafico.totalImportCost)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Details */}
      {trafico.calculoPayment && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary mb-3">
            Payments
          </h4>
          <div className="space-y-2">
            <div className="bg-dash-bg rounded-lg border border-dash-border p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-dash-text">Import Taxes (PED)</span>
                <span className="text-sm font-medium text-dash-text">{formatMXN(trafico.calculoPayment.amount)}</span>
              </div>
              <div className="text-[10px] text-dash-text-secondary space-y-0.5">
                <p>To: {trafico.calculoPayment.payeeName}</p>
                <p>Bank: {trafico.calculoPayment.bank} &middot; Ref: {trafico.calculoPayment.reference}</p>
                <p>Date: {format(parseISO(trafico.calculoPayment.date), "MMM d, yyyy")}</p>
              </div>
            </div>
            {trafico.truckFeePayment && (
              <div className="bg-dash-bg rounded-lg border border-dash-border p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-dash-text">Truck Crossing Fee (CRUZ)</span>
                  <span className="text-sm font-medium text-dash-text">{formatMXN(trafico.truckFeePayment.amount)}</span>
                </div>
                <div className="text-[10px] text-dash-text-secondary space-y-0.5">
                  <p>To: {trafico.truckFeePayee ?? "Carlos Enrique Garza Roque"}</p>
                  <p>Bank: {trafico.truckFeePayment.bank} &middot; Ref: {trafico.truckFeePayment.reference}</p>
                  <p>Date: {format(parseISO(trafico.truckFeePayment.date), "MMM d, yyyy")}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Tab: Documents
// ---------------------------------------------------------------------------

const DocumentsTab = ({ trafico }: { trafico: Trafico }) => {
  const checklist = getDocumentChecklist(trafico);

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary mb-3">
        Document Checklist ({checklist.filter((d) => d.status === "uploaded").length}/{checklist.length})
      </h4>
      {checklist.map((doc) => (
        <div
          key={doc.key}
          className="flex items-center justify-between bg-dash-bg rounded-lg border border-dash-border px-3 py-2.5"
        >
          <div className="flex items-center gap-2.5">
            {docStatusIcon(doc.status)}
            <span className="text-sm text-dash-text">{doc.label.en}</span>
          </div>
          {doc.driveFileId && (
            <button className="text-xs text-brand-copper hover:text-brand-copper/80 transition-colors cursor-pointer">
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Tab: Reconciliation
// ---------------------------------------------------------------------------

const ReconciliationTab = ({ trafico }: { trafico: Trafico }) => {
  const result = reconcileTrafico(trafico);

  const levelConfig = {
    pass: { bg: "bg-green-500/10", text: "text-green-400", label: "Pass" },
    info: { bg: "bg-blue-500/10", text: "text-blue-400", label: "Info" },
    warning: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Warning" },
    error: { bg: "bg-red-500/10", text: "text-red-400", label: "Error" },
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-dash-bg rounded-lg border border-dash-border p-3 text-center">
          <p className="text-lg font-semibold text-dash-text">{result.checks.length}</p>
          <p className="text-[10px] text-dash-text-secondary uppercase">Checks</p>
        </div>
        <div className={`rounded-lg border p-3 text-center ${result.hasWarnings ? "bg-amber-500/10 border-amber-500/20" : "bg-green-500/10 border-green-500/20"}`}>
          <p className={`text-lg font-semibold ${result.hasWarnings ? "text-amber-400" : "text-green-400"}`}>
            {result.checks.filter((c) => c.level === "warning").length}
          </p>
          <p className="text-[10px] text-dash-text-secondary uppercase">Warnings</p>
        </div>
        <div className={`rounded-lg border p-3 text-center ${result.hasErrors ? "bg-red-500/10 border-red-500/20" : "bg-green-500/10 border-green-500/20"}`}>
          <p className={`text-lg font-semibold ${result.hasErrors ? "text-red-400" : "text-green-400"}`}>
            {result.checks.filter((c) => c.level === "error").length}
          </p>
          <p className="text-[10px] text-dash-text-secondary uppercase">Errors</p>
        </div>
      </div>

      {/* Individual Checks */}
      <div className="space-y-2">
        {result.checks.map((check) => {
          const config = levelConfig[check.level];
          return (
            <div
              key={check.id}
              className="bg-dash-bg rounded-lg border border-dash-border p-3"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-dash-text">{check.label.en}</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${config.bg} ${config.text}`}>
                  {config.label}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                <div>
                  <p className="text-dash-text-secondary">Expected</p>
                  <p className="text-dash-text font-mono">{formatMXN(check.expected)}</p>
                </div>
                <div>
                  <p className="text-dash-text-secondary">Actual</p>
                  <p className="text-dash-text font-mono">{formatMXN(check.actual)}</p>
                </div>
                <div>
                  <p className="text-dash-text-secondary">Variance</p>
                  <p className={`font-mono ${check.variance > 0 ? "text-amber-400" : check.variance < 0 ? "text-red-400" : "text-green-400"}`}>
                    {check.variance >= 0 ? "+" : ""}${check.variance.toFixed(2)}
                  </p>
                </div>
              </div>
              {check.note && (
                <p className="text-[10px] text-dash-text-secondary mt-2">{check.note}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Factura Difference */}
      {trafico.facturaDifference !== undefined && trafico.facturaDifference !== 0 && (
        <div className="bg-amber-500/5 rounded-lg border border-amber-500/20 p-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-medium text-amber-400">Calculo vs Factura Variance</span>
          </div>
          <p className="text-sm text-dash-text">
            {trafico.facturaDifference >= 0 ? "+" : ""}
            {formatMXN(trafico.facturaDifference)}
          </p>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Tab: Communication
// ---------------------------------------------------------------------------

const CommunicationTab = ({ trafico }: { trafico: Trafico }) => {
  const messages = SAMPLE_BROKER_MESSAGES.filter(
    (m) => m.traficoId === trafico.id
  );

  if (messages.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageSquare className="w-8 h-8 text-dash-text-secondary/30 mx-auto mb-2" />
        <p className="text-sm text-dash-text-secondary">No messages logged for this crossing</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`rounded-lg border p-3 ${
            msg.direction === "to-broker"
              ? "bg-blue-500/5 border-blue-500/20 ml-4"
              : "bg-dash-bg border-dash-border mr-4"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-medium text-dash-text-secondary uppercase">
              {msg.direction === "to-broker" ? "Sent to Broker" : "From Broker"}
            </span>
            <span className="text-[10px] text-dash-text-secondary">
              {format(parseISO(msg.timestamp), "MMM d, h:mm a")}
            </span>
          </div>
          {msg.subject && (
            <p className="text-sm font-medium text-dash-text mb-1">{msg.subject}</p>
          )}
          {msg.body && (
            <p className="text-xs text-dash-text-secondary">{msg.body}</p>
          )}
          {msg.attachmentIds && msg.attachmentIds.length > 0 && (
            <div className="flex items-center gap-1 mt-2">
              <FileText className="w-3 h-3 text-dash-text-secondary" />
              <span className="text-[10px] text-dash-text-secondary">
                {msg.attachmentIds.length} attachment{msg.attachmentIds.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CustomsPage;
