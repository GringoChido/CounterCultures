"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format, isPast, parseISO } from "date-fns";
import {
  Plus,
  DollarSign,
  Calendar,
  User,
  AlertCircle,
  MessageCircle,
  FileText,
  FilePlus,
  Loader2,
  Send,
  Download,
  Package,
  Truck,
  Wallet,
  BarChart3,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  FileCheck,
  Shield,
  Calculator,
  AlertTriangle,
  ClipboardList,
  Trash2,
  Share2,
  FileUp,
} from "lucide-react";
import { KPICard } from "@/app/(dashboard)/components/kpi-card";
import { PipelineJourneyPlayer } from "@/app/(dashboard)/components/pipeline-journey-player";
import { SlideOut } from "@/app/(dashboard)/components/slide-out";
import DealHistoryPanel from "@/app/(dashboard)/components/deal-history-panel";
import PendingMoveBanner from "@/app/(dashboard)/components/pending-move-banner";
import { DocumentGenerator } from "@/app/(dashboard)/components/document-generator";
import { SendDialog } from "@/app/(dashboard)/components/send-dialog";
import { PreviewPanel, type PreviewFile } from "@/app/(dashboard)/components/preview-panel";
import { NotesPanel } from "@/app/(dashboard)/components/notes-panel";
import { ShareButton } from "@/app/(dashboard)/components/share-button";
import { ThreadOnDealPanel } from "@/app/(dashboard)/components/thread-on-deal-panel";
import { ProductPicker } from "@/app/(dashboard)/components/product-picker";
import { ShareQuoteModal } from "@/app/(dashboard)/components/share-quote-modal";
import { PdfDropModal, type PdfDropResult } from "@/app/components/pdf-drop-modal";
import type { ProductFull } from "@/app/lib/products-full";
import {
  SAMPLE_PIPELINE,
  LOST_STAGES,
  CLOSED_STAGES,
  SALES_PHASES,
  getJourneyPhase,
  getJourneyPhaseIndex,
  type PipelineDeal,
  type PipelineStage,
  type LostReason,
  type DealLineItem,
  type DealPayment,
  type PurchaseOrder,
  type DealShipment,
} from "@/app/lib/sample-dashboard-data";
import type { DocumentType } from "@/app/lib/document-numbers";
import { getDocumentTypeLabel } from "@/app/lib/document-numbers";
import type { DocumentRecord } from "@/app/lib/document-numbers";
import {
  calculateDealFinancials,
  calculateStripeFees,
  getDealCompletionChecklist,
} from "@/app/lib/deal-automation";
import { useActivityStore } from "@/app/lib/stores/activity-store";
import { usePageContextStore } from "@/app/lib/stores/page-context-store";
import { TRAFICO_STATUS_CONFIG, type TraficoStatus, getDocumentChecklist } from "@/app/lib/customs-data";
import type { HydratedTrafico } from "@/app/lib/trafico-hydrator";
import { LandedCostCalculator } from "@/app/(dashboard)/components/landed-cost-calculator";

// Slim live shape from /api/dashboard/traficos (flat sheet row).
// Rich shape (items[], documents, calculoBreakdown) loaded separately
// via /api/dashboard/traficos/[id]/rich and merged into richMap below.
interface TraficoSummary {
  TRF_ID: string;
  Trafico_Number: string;
  Pedimento_Number: string;
  Status: string;
  Item_Count: string;
  Total_Import_Cost: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const stageConfig: Record<
  PipelineStage,
  { label: string; color: string; bgColor: string }
> = {
  // Original stages
  discovery: { label: "Discovery", color: "text-status-new", bgColor: "bg-status-new" },
  proposal: { label: "Proposal", color: "text-status-qualified", bgColor: "bg-status-qualified" },
  negotiation: { label: "Negotiation", color: "text-status-contacted", bgColor: "bg-status-contacted" },
  "closed-won": { label: "Closed Won", color: "text-status-won", bgColor: "bg-status-won" },
  "closed-lost": { label: "Closed Lost", color: "text-status-lost", bgColor: "bg-status-lost" },
  // New expanded stages
  "target-identified": { label: "Target Identified", color: "text-dash-text-secondary", bgColor: "bg-dash-text-secondary" },
  contacted: { label: "Contacted", color: "text-dash-info", bgColor: "bg-dash-info" },
  "conversation-started": { label: "Conversation", color: "text-dash-info", bgColor: "bg-dash-info" },
  "qualified-project": { label: "Qualified", color: "text-status-qualified", bgColor: "bg-status-qualified" },
  "design-scope": { label: "Design Scope", color: "text-dash-cat-violet", bgColor: "bg-dash-cat-violet" },
  "proposal-sent": { label: "Proposal Sent", color: "text-dash-info", bgColor: "bg-dash-info" },
  "follow-up-negotiation": { label: "Follow-Up", color: "text-dash-warn", bgColor: "bg-dash-warn" },
  "verbal-yes": { label: "Verbal Yes", color: "text-dash-success", bgColor: "bg-dash-success" },
  won: { label: "Won", color: "text-status-won", bgColor: "bg-status-won" },
  lost: { label: "Lost", color: "text-status-lost", bgColor: "bg-status-lost" },
  // Post-sale fulfillment stages
  "quote-approved":      { label: "Quote Approved",    color: "text-dash-success", bgColor: "bg-dash-success" },
  "deposit-pending":     { label: "Deposit Pending",   color: "text-dash-warn",   bgColor: "bg-dash-warn" },
  "deposit-received":    { label: "Deposit Received",  color: "text-dash-success",   bgColor: "bg-dash-success" },
  "ordering":            { label: "Ordering",          color: "text-dash-info",    bgColor: "bg-dash-info" },
  "in-production":       { label: "In Production",     color: "text-dash-cat-violet",  bgColor: "bg-dash-cat-violet" },
  "shipping":            { label: "Shipping",          color: "text-dash-info",    bgColor: "bg-dash-info" },
  "in-customs":          { label: "In Customs",        color: "text-dash-warn",  bgColor: "bg-dash-warn" },
  "customs-cleared":     { label: "Customs Cleared",   color: "text-dash-cat-lime",    bgColor: "bg-dash-cat-lime" },
  "received":            { label: "Received at CC",    color: "text-dash-cat-teal",    bgColor: "bg-dash-cat-teal" },
  "delivery-scheduled":  { label: "Delivery Scheduled", color: "text-dash-info", bgColor: "bg-dash-info" },
  "delivered":           { label: "Delivered",         color: "text-dash-success",   bgColor: "bg-dash-success" },
  "balance-pending":     { label: "Balance Pending",   color: "text-dash-warn",   bgColor: "bg-dash-warn" },
  "complete":            { label: "Complete",          color: "text-dash-success", bgColor: "bg-dash-success" },
  "post-delivery-issue": { label: "Issue",             color: "text-dash-danger",     bgColor: "bg-dash-danger" },
};

type PipelineView = "sales" | "operations";

const salesStages: PipelineStage[] = [
  "target-identified", "contacted", "conversation-started", "qualified-project",
  "discovery", "design-scope", "proposal", "proposal-sent",
  "negotiation", "follow-up-negotiation", "verbal-yes",
  "closed-won", "won", "closed-lost", "lost",
];

const opsStages: PipelineStage[] = [
  "quote-approved", "deposit-pending", "deposit-received",
  "ordering", "in-production", "shipping",
  "in-customs", "customs-cleared", "received",
  "delivery-scheduled", "delivered", "balance-pending",
  "complete", "post-delivery-issue",
];

const stages: PipelineStage[] = [...salesStages, ...opsStages];

const lostStages: PipelineStage[] = LOST_STAGES;

const lostReasonOptions: { value: LostReason; label: string }[] = [
  { value: "price", label: "Price too high" },
  { value: "timeline", label: "Timeline didn't work" },
  { value: "competitor", label: "Went with competitor" },
  { value: "no-budget", label: "No budget" },
  { value: "ghost", label: "Ghost / No response" },
  { value: "other", label: "Other" },
];

const roleColors: Record<string, string> = {
  Architect: "bg-dash-cat-violet/10 text-dash-cat-violet",
  "Interior Designer": "bg-dash-cat-pink/10 text-dash-cat-pink",
  Developer: "bg-dash-info/10 text-dash-info",
  Builder: "bg-dash-warn/10 text-dash-warn",
  "Private Client": "bg-brand-copper/10 text-brand-copper",
  Supplier: "bg-dash-info/10 text-dash-info",
  Partner: "bg-dash-success/10 text-dash-success",
  "Hospitality Designer": "bg-dash-cat-rose/10 text-dash-cat-rose",
};

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
};

const DOC_TYPE_ICONS: Record<string, string> = {
  quote: "text-dash-info",
  invoice: "text-dash-success",
  po: "text-dash-warn",
  receipt: "text-dash-cat-violet",
};

const DOC_STATUS_STYLES: Record<string, string> = {
  Draft: "bg-dash-text-secondary/10 text-dash-text-secondary",
  Sent: "bg-dash-info/10 text-dash-info",
  Paid: "bg-status-won/10 text-status-won",
  Signed: "bg-dash-success/10 text-dash-success",
};

// ---------------------------------------------------------------------------
// DealCard
// ---------------------------------------------------------------------------

type ShipmentRisk = "green" | "yellow" | "red";

type SlaDisplay = {
  color: "green" | "yellow" | "red" | "unknown";
  daysInStage: number;
  green: number;
  yellow: number;
  red: number;
} | null;

interface DealCardProps {
  deal: PipelineDeal;
  onClick: () => void;
  shipmentRisk?: ShipmentRisk;
  sla?: SlaDisplay;
}

const SLA_BORDER: Record<"green" | "yellow" | "red" | "unknown", string> = {
  green: "border-dash-success/40",
  yellow: "border-dash-warn/60",
  red: "border-dash-danger/70",
  unknown: "border-dash-border",
};

const DealCard = ({ deal, onClick, shipmentRisk, sla }: DealCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isOverdue = deal.followUpDate && isPast(parseISO(deal.followUpDate));

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const msg = `Hi ${deal.contactName}, following up on ${deal.name}. Could we schedule a time to discuss?`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleQuickNote = (e: React.MouseEvent) => {
    e.stopPropagation();
    const note = window.prompt(`Log activity for ${deal.id}:`, "");
    if (!note) return;
    void fetch("/api/dashboard/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "note",
        description: note,
        contactName: deal.contactName,
        dealId: deal.id,
      }),
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(() => toast.success("Activity logged"))
      .catch((err) =>
        toast.error(err instanceof Error ? err.message : "Failed to log")
      );
  };

  const riskTitle = {
    red: "Linked Tráfico has an issue or critical hold",
    yellow: "Linked Tráfico awaiting documents or payment",
    green: "Linked Tráfico tracking on plan",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`bg-dash-surface border-2 ${SLA_BORDER[sla?.color ?? "unknown"]} rounded-lg p-3.5 cursor-grab active:cursor-grabbing hover:border-brand-copper/30 transition-colors`}
    >
      <div className="flex items-start justify-between mb-2">
        <p className="text-sm font-medium text-dash-text leading-snug flex-1 mr-2">
          {deal.name}
        </p>
        <div className="flex items-center gap-1 shrink-0">
          {shipmentRisk && shipmentRisk !== "green" && (
            <span title={riskTitle[shipmentRisk]}>
              <AlertTriangle
                className={`w-3.5 h-3.5 ${
                  shipmentRisk === "red" ? "text-dash-danger" : "text-dash-warn"
                }`}
              />
            </span>
          )}
          <button
            type="button"
            onClick={handleWhatsApp}
            className="p-1 rounded hover:bg-dash-success/10 text-dash-text-secondary hover:text-dash-success transition-colors cursor-pointer"
            title={`WhatsApp ${deal.contactName}`}
            aria-label={`WhatsApp ${deal.contactName}`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleQuickNote}
            className="p-1 rounded hover:bg-brand-copper/10 text-dash-text-secondary hover:text-brand-copper transition-colors cursor-pointer"
            title="Log activity"
            aria-label="Log activity"
          >
            <ClipboardList className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-dash-text-secondary mb-2">
        <div className="flex items-center gap-1">
          <User className="w-3 h-3" />
          {deal.contactName}
        </div>
        <span className="font-semibold text-brand-copper">
          {formatCurrency(deal.value)}
        </span>
      </div>

      {deal.contactCompany && (
        <p className="text-[10px] text-dash-text-secondary mb-1.5 truncate">
          {deal.contactCompany}
        </p>
      )}

      {deal.contactRole && (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium mb-1.5 ${roleColors[deal.contactRole] ?? "bg-dash-bg text-dash-text-secondary"}`}
        >
          {deal.contactRole}
        </span>
      )}

      {deal.brandSlugs && deal.brandSlugs.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1.5">
          {deal.brandSlugs.slice(0, 3).map((slug) => (
            <Link
              key={slug}
              href={`/dashboard/brands/${slug}`}
              onClick={(e) => e.stopPropagation()}
              className="px-1.5 py-0.5 bg-brand-copper/10 text-brand-copper border border-brand-copper/20 rounded text-[9px] leading-tight hover:bg-brand-copper/20 transition-colors"
            >
              {slug}
            </Link>
          ))}
          {deal.brandSlugs.length > 3 && (
            <span className="text-[9px] text-dash-text-secondary self-center">
              +{deal.brandSlugs.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-[10px] text-dash-text-secondary">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {format(new Date(deal.expectedClose), "MMM d")}
        </div>
        <span>{deal.probability}%</span>
      </div>

      {sla && sla.color !== "unknown" && (
        <div
          className={`mt-1.5 text-[10px] ${
            sla.color === "red"
              ? "text-dash-danger font-medium"
              : sla.color === "yellow"
                ? "text-dash-warn"
                : "text-dash-success/80"
          }`}
          title={`SLA — green ≤ ${sla.green}d · yellow ≤ ${sla.yellow}d · red > ${sla.yellow}d`}
        >
          Day {sla.daysInStage} / {sla.green}
          {sla.color === "yellow" && ` · over by ${sla.daysInStage - sla.green}d`}
          {sla.color === "red" && ` · ${sla.daysInStage - sla.yellow}d past red`}
        </div>
      )}

      {deal.followUpDate && (
        <div
          className={`flex items-center gap-1 text-[10px] mt-1.5 ${isOverdue ? "text-dash-danger font-medium" : "text-dash-text-secondary"}`}
        >
          {isOverdue && <AlertCircle className="w-3 h-3" />}
          <span>Follow-up: {format(parseISO(deal.followUpDate), "MMM d")}</span>
        </div>
      )}
    </div>
  );
};

const DealCardOverlay = ({ deal }: { deal: PipelineDeal }) => (
  <div className="bg-dash-surface border-2 border-brand-copper rounded-lg p-3.5 shadow-lg w-64">
    <p className="text-sm font-medium text-dash-text mb-2">{deal.name}</p>
    <span className="text-xs font-semibold text-brand-copper">
      {formatCurrency(deal.value)}
    </span>
  </div>
);

// ---------------------------------------------------------------------------
// Pipeline Page
// ---------------------------------------------------------------------------

type DealTabKey = "details" | "documents" | "line-items" | "payments" | "purchase-orders" | "shipments" | "customs" | "landed-cost" | "financial" | "history";

interface BrandOption {
  slug: string;
  name: string;
}

const emptyNewDealForm = {
  name: "",
  company: "",
  stage: "discovery" as PipelineStage,
  value: "",
  expectedClose: "",
  source: "Direct",
  brandSlugs: [] as string[],
};

// Inline editable number cell for line-item qty/price fields. Commits on
// blur or Enter; Escape reverts. Scoped to this file — not worth a shared
// component until a second caller appears.
const EditableNumber = ({
  value,
  prefix,
  suffix,
  onCommit,
  min = 0,
  step = 1,
  className = "",
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  onCommit: (next: number) => void;
  min?: number;
  step?: number;
  className?: string;
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  useEffect(() => {
    setDraft(String(value));
  }, [value]);
  const commit = () => {
    setEditing(false);
    const next = parseFloat(draft);
    if (!Number.isFinite(next) || next === value) return;
    if (next < min) return;
    onCommit(next);
  };
  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={`text-left hover:bg-dash-surface px-1 -mx-1 rounded cursor-text ${className}`}
        title="Click to edit"
      >
        {prefix ?? ""}
        {value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        {suffix ?? ""}
      </button>
    );
  }
  return (
    <input
      autoFocus
      type="number"
      step={step}
      min={min}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          (e.target as HTMLInputElement).blur();
        } else if (e.key === "Escape") {
          setDraft(String(value));
          setEditing(false);
        }
      }}
      className={`w-full bg-dash-surface border border-brand-copper rounded px-1 -mx-1 outline-none ${className}`}
    />
  );
};

const PipelinePageInner = () => {
  const [deals, setDeals] = useState(SAMPLE_PIPELINE);
  const [loading, setLoading] = useState(true);
  const [activeDeal, setActiveDeal] = useState<PipelineDeal | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<PipelineDeal | null>(null);
  const [shipmentRiskByDeal, setShipmentRiskByDeal] = useState<Record<string, ShipmentRisk>>({});
  const [slaByDeal, setSlaByDeal] = useState<Record<string, SlaDisplay>>({});

  // W7: per-card SLA. Fetch Brand_Lead_Times once + compute synchronously
  // per deal via getSlaColor. Recomputes whenever deals change.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/dashboard/reference/brand-lead-times", { cache: "no-store" });
        const brandLeadTimes = r.ok
          ? ((await r.json()).rows as Parameters<
              typeof import("@/app/lib/sla-timers").getSlaColor
            >[1])
          : [];
        if (cancelled) return;
        const { getSlaColor } = await import("@/app/lib/sla-timers");
        const next: Record<string, SlaDisplay> = {};
        for (const d of deals) {
          const r = getSlaColor(d, brandLeadTimes ?? []);
          if (r.color === "unknown" || !r.sla) continue;
          next[d.id] = {
            color: r.color,
            daysInStage: r.daysInStage,
            green: r.sla.green,
            yellow: r.sla.yellow,
            red: r.sla.red,
          };
        }
        if (!cancelled) setSlaByDeal(next);
      } catch {
        // silent — cards render without SLA row
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [deals]);

  // W7: real shipment risk via deriveShipmentRiskMetrics + computeShipmentRisk.
  // Batch-fetch Trafico_Items + flat Traficos (for Status_History_JSON +
  // Initiated_Date) + Brand_NOM_Status; compute per-deal worst-case risk.
  // Falls back silently if any endpoint is unavailable.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [itemsRes, traficosRes, nomRes] = await Promise.all([
          fetch("/api/dashboard/trafico-items", { cache: "no-store" }),
          fetch("/api/dashboard/traficos", { cache: "no-store" }),
          fetch("/api/dashboard/reference/brand-nom-status", { cache: "no-store" }),
        ]);
        if (cancelled) return;

        const items = itemsRes.ok
          ? ((await itemsRes.json()).items as { TRF_ID: string; Deal_ID: string }[])
          : [];
        const flatTraficos = traficosRes.ok
          ? ((await traficosRes.json()).traficos as Record<string, string>[])
          : [];
        const nomRows = nomRes.ok
          ? ((await nomRes.json()).rows as { brand_slug: string; status: string }[])
          : [];

        // Parse each flat Trafico into enough rich shape for the risk derivation.
        const trfById = new Map<
          string,
          { id: string; status: string; initiatedDate: string; statusHistory: { status: string; timestamp: string }[] }
        >();
        for (const t of flatTraficos) {
          let history: { status: string; timestamp: string }[] = [];
          try {
            const raw = t.Status_History_JSON;
            history = raw ? (JSON.parse(raw) as { status: string; timestamp: string }[]) : [];
          } catch {
            history = [];
          }
          trfById.set(t.TRF_ID, {
            id: t.TRF_ID,
            status: t.Status ?? "",
            initiatedDate: t.Initiated_Date ?? "",
            statusHistory: history,
          });
        }

        const { deriveShipmentRiskMetrics, computeShipmentRisk } = await import(
          "@/app/lib/shipment-risk"
        );

        const dealById = new Map<string, PipelineDeal>(deals.map((d) => [d.id, d]));
        const riskRank = { green: 0, yellow: 1, red: 2 } as const;
        const next: Record<string, ShipmentRisk> = {};

        for (const it of items) {
          if (!it.Deal_ID) continue;
          const trafico = trfById.get(it.TRF_ID);
          const deal = dealById.get(it.Deal_ID);
          if (!trafico || !deal) continue;

          const metrics = deriveShipmentRiskMetrics(
            // deriveShipmentRiskMetrics types expect the rich Trafico but
            // only reads .status, .initiatedDate, .statusHistory — our
            // light shape satisfies that subset.
            trafico as unknown as Parameters<typeof deriveShipmentRiskMetrics>[0],
            deal,
            nomRows
          );
          const r = computeShipmentRisk(metrics);
          const prev = next[it.Deal_ID];
          if (!prev || riskRank[r] > riskRank[prev]) next[it.Deal_ID] = r;
        }

        if (!cancelled) setShipmentRiskByDeal(next);
      } catch {
        // Silent failure — card just renders without the badge
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [deals]);

  // Publish open deal to the page-context store so the AI chat widget
  // can resolve "this deal" without the user re-typing the ID.
  const setPageDeal = usePageContextStore((s) => s.setSelectedDeal);
  useEffect(() => {
    if (selectedDeal) {
      setPageDeal({
        id: selectedDeal.id,
        name: selectedDeal.name || selectedDeal.id,
        company: selectedDeal.contactCompany || selectedDeal.contactName || "",
        stage: selectedDeal.stage || "",
      });
    } else {
      setPageDeal(null);
    }
    return () => setPageDeal(null);
  }, [selectedDeal, setPageDeal]);
  const [pipelineView, setPipelineView] = useState<PipelineView>("sales");
  const [activityLogDeal, setActivityLogDeal] = useState<PipelineDeal | null>(null);
  const [activityNote, setActivityNote] = useState("");
  const [activityType, setActivityType] = useState<"call" | "email" | "meeting" | "note" | "whatsapp">("call");
  const addActivity = useActivityStore((s) => s.addActivity);

  // Option A — New Deal SlideOut state
  const [newDealOpen, setNewDealOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const newDealActionParam = searchParams.get("action");
  const dealDeepLinkParam = searchParams.get("deal");
  useEffect(() => {
    if (newDealActionParam === "new") {
      setNewDealOpen(true);
      router.replace("/dashboard/pipeline");
    }
  }, [newDealActionParam, router]);

  // Deep-link: /dashboard/pipeline?deal=<id> from Needs You panel, bell drop-down,
  // etc. Opens the slideout for that deal once deals are loaded, then strips the
  // param so a refresh doesn't re-trigger the open.
  useEffect(() => {
    if (!dealDeepLinkParam || deals.length === 0) return;
    const hit = deals.find((d) => d.id === dealDeepLinkParam);
    if (hit) {
      setSelectedDeal(hit);
      router.replace("/dashboard/pipeline");
    }
  }, [dealDeepLinkParam, deals, router]);
  const [newDealForm, setNewDealForm] = useState(emptyNewDealForm);
  const [newDealSaving, setNewDealSaving] = useState(false);
  const [brandOptions, setBrandOptions] = useState<BrandOption[]>([]);

  useEffect(() => {
    if (!newDealOpen || brandOptions.length > 0) return;
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
      .catch((err) => console.error("[PipelinePage] brand fetch failed", err));
  }, [newDealOpen, brandOptions.length]);

  const resetNewDealForm = () => setNewDealForm(emptyNewDealForm);

  const toggleNewDealBrand = (slug: string) => {
    setNewDealForm((prev) => ({
      ...prev,
      brandSlugs: prev.brandSlugs.includes(slug)
        ? prev.brandSlugs.filter((s) => s !== slug)
        : [...prev.brandSlugs, slug],
    }));
  };

  const createNewDeal = async () => {
    if (!newDealForm.name.trim()) return;
    try {
      setNewDealSaving(true);
      const id = `DEAL-${Date.now()}`;
      const now = new Date().toISOString();
      const expected =
        newDealForm.expectedClose ||
        new Date(Date.now() + 30 * 86400000).toISOString();

      const body = {
        id,
        name: newDealForm.name.trim(),
        company: newDealForm.company.trim(),
        stage: newDealForm.stage,
        value: newDealForm.value || "0",
        probability: "50",
        expected_close: expected,
        owner: "Roger",
        source: newDealForm.source,
        created_at: now,
        last_activity: now,
        brand_slugs: newDealForm.brandSlugs.join("|"),
      };

      const res = await fetch("/api/dashboard/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to create deal");

      const created: PipelineDeal = {
        id,
        name: body.name,
        contactName: body.company,
        contactCompany: body.company,
        value: parseFloat(body.value) || 0,
        currency: "MXN",
        stage: newDealForm.stage,
        probability: 50,
        expectedClose: expected,
        assignedRep: "Roger",
        products: "",
        createdAt: now,
        notes: "",
        leadSource: body.source,
        brandSlugs: newDealForm.brandSlugs,
      };
      setDeals((prev) => [created, ...prev]);
      setNewDealOpen(false);
      resetNewDealForm();
      setSelectedDeal(created);
    } catch (err) {
      console.error("[PipelinePage] createNewDeal failed", err);
    } finally {
      setNewDealSaving(false);
    }
  };

  // Fetch pipeline deals from CRM — merge with sample data structure
  useEffect(() => {
    const fetchPipeline = async () => {
      try {
        const res = await fetch("/api/dashboard/pipeline");
        if (res.ok) {
          const data = await res.json();
          const sheetDeals = data.deals as Array<Record<string, string>>;
          if (sheetDeals.length > 0) {
            const mapped: PipelineDeal[] = sheetDeals.map((d) => ({
              id: d.id || `DEAL-${crypto.randomUUID()}`,
              name: d.name || "Untitled Deal",
              contactName: d.company || "",
              contactCompany: d.company,
              value: parseFloat(d.value) || 0,
              currency: "MXN",
              stage: (d.stage as PipelineStage) || "discovery",
              probability: parseInt(d.probability) || 50,
              expectedClose: d.expected_close || new Date().toISOString(),
              assignedRep: d.owner || "",
              products: "",
              createdAt: d.created_at || new Date().toISOString(),
              notes: "",
              leadSource: d.source || "",
              brandSlugs: (d.brand_slugs ?? "")
                .split("|")
                .map((s) => s.trim())
                .filter(Boolean),
              // W7 fields (Pipeline sheet has them after the migration)
              stageEnteredAt: d.stage_entered_at || d.created_at || new Date().toISOString(),
              pendingMoveTo: (d.pending_move_to || undefined) as PipelineStage | undefined,
              pendingMoveAt: d.pending_move_at || undefined,
              dateAtBorder: d.date_at_border || undefined,
              dateCustomsCleared: d.date_customs_cleared || undefined,
            }));
            setDeals(mapped);
          }
        }
      } catch {
        // Keep sample data on error
      } finally {
        setLoading(false);
      }
    };
    fetchPipeline();
  }, []);

  // Lost reason modal state
  const [lostModalOpen, setLostModalOpen] = useState(false);
  const [pendingLostDeal, setPendingLostDeal] = useState<{
    dealId: string;
    targetStage: PipelineStage;
  } | null>(null);
  const [selectedLostReason, setSelectedLostReason] =
    useState<LostReason | null>(null);

  // Documents tab state
  const [dealTab, setDealTab] = useState<DealTabKey>("details");
  const [dealDocs, setDealDocs] = useState<DocumentRecord[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);

  // Line Items tab state — lazy-loaded from Deal_Line_Items sheet
  const [lineItemsLoading, setLineItemsLoading] = useState(false);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [pdfDropOpen, setPdfDropOpen] = useState(false);
  const [pdfImporting, setPdfImporting] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Purchase Orders tab state — lazy-loaded from Purchase_Orders sheet
  const [posLoading, setPosLoading] = useState(false);
  const [generatingPos, setGeneratingPos] = useState(false);

  // Customs tab state — Traficos linked to this deal via Trafico_Items
  const [dealTraficos, setDealTraficos] = useState<TraficoSummary[]>([]);
  const [traficosLoading, setTraficosLoading] = useState(false);
  const [creatingTrafico, setCreatingTrafico] = useState(false);
  const [richMap, setRichMap] = useState<Record<string, HydratedTrafico | null>>({});

  // Lazy-load line items from Deal_Line_Items when the Line Items tab
  // is opened. Stored separately from the Pipeline row so multi-row items
  // don't need a JSON column and can be reconciled with POs cleanly.
  useEffect(() => {
    if (!selectedDeal?.id || dealTab !== "line-items") return;
    const dealId = selectedDeal.id;
    setLineItemsLoading(true);
    fetch(`/api/dashboard/deals/${encodeURIComponent(dealId)}/line-items`, {
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => {
        const items: DealLineItem[] = ((d.items ?? []) as Array<{
          id: string;
          sku: string;
          productName: string;
          brand: string;
          finish: string;
          quantity: number;
          dealerCost: number;
          quotedPrice: number;
          msrp: number;
          shippingCost: number;
          leadTime: string;
          status: string;
          marginAmount: number;
          marginPercent: number;
          hsCode: string;
          countryOfOrigin: string;
        }>).map((r) => ({
          id: r.id,
          productName: r.productName,
          sku: r.sku,
          brand: r.brand,
          finish: r.finish || undefined,
          quantity: r.quantity,
          dealerCost: r.dealerCost,
          quotedPrice: r.quotedPrice,
          msrp: r.msrp,
          shippingCost: r.shippingCost,
          leadTime: r.leadTime || undefined,
          status: (r.status as DealLineItem["status"]) || "current",
          marginAmount: r.marginAmount,
          marginPercent: r.marginPercent,
          hsCode: r.hsCode || undefined,
          countryOfOrigin: (r.countryOfOrigin as DealLineItem["countryOfOrigin"]) || undefined,
        }));
        setSelectedDeal((cur) => (cur && cur.id === dealId ? { ...cur, lineItems: items } : cur));
      })
      .catch((e) => console.error("[Pipeline] lineItems fetch failed", e))
      .finally(() => setLineItemsLoading(false));
  }, [selectedDeal?.id, dealTab]);

  // Lazy-load Purchase_Orders when the PO tab opens. Items_JSON is the
  // canonical line-item snapshot per PO; the in-memory shape mirrors what
  // sample data renders so the existing PO card UI just works.
  useEffect(() => {
    if (!selectedDeal?.id || dealTab !== "purchase-orders") return;
    const dealId = selectedDeal.id;
    setPosLoading(true);
    fetch(
      `/api/dashboard/purchase-orders?dealId=${encodeURIComponent(dealId)}`,
      { cache: "no-store" }
    )
      .then((r) => (r.ok ? r.json() : { purchaseOrders: [] }))
      .then((d) => {
        const rows = (d.purchaseOrders ?? []) as Array<{
          PO_ID: string;
          Deal_ID: string;
          Brand: string;
          Manufacturer: string;
          Items_JSON: string;
          Total_Amount: string;
          Currency: string;
          Status: string;
          Sent_Date: string;
          Confirmed_Date: string;
          Payment_Date: string;
          Payment_Method: string;
          Payment_Ref: string;
          Payment_Amount: string;
          Ship_To: string;
          Carrier: string;
          Tracking: string;
          Received_Date: string;
        }>;
        const pos: PurchaseOrder[] = rows.map((r) => {
          let items: PurchaseOrder["items"] = [];
          try {
            items = JSON.parse(r.Items_JSON || "[]");
          } catch {
            items = [];
          }
          const po: PurchaseOrder = {
            id: r.PO_ID,
            dealId: r.Deal_ID,
            brand: r.Brand,
            manufacturerName: r.Manufacturer || r.Brand,
            items,
            totalAmount: parseFloat(r.Total_Amount) || 0,
            currency: r.Currency || "MXN",
            status: (r.Status as PurchaseOrder["status"]) || "draft",
            shipTo: (r.Ship_To as PurchaseOrder["shipTo"]) || "cc-showroom",
          };
          if (r.Sent_Date) po.sentDate = r.Sent_Date;
          if (r.Confirmed_Date) po.confirmedDate = r.Confirmed_Date;
          if (r.Carrier) po.trackingCarrier = r.Carrier;
          if (r.Tracking) po.trackingNumber = r.Tracking;
          if (r.Received_Date) po.receivedDate = r.Received_Date;
          if (r.Payment_Date && r.Payment_Amount) {
            po.paymentToMfr = {
              date: r.Payment_Date,
              amount: parseFloat(r.Payment_Amount) || 0,
              method: r.Payment_Method || "",
              reference: r.Payment_Ref || "",
            };
          }
          return po;
        });
        setSelectedDeal((cur) =>
          cur && cur.id === dealId ? { ...cur, purchaseOrders: pos } : cur
        );
      })
      .catch((e) => console.error("[Pipeline] purchaseOrders fetch failed", e))
      .finally(() => setPosLoading(false));
  }, [selectedDeal?.id, dealTab]);

  const handleGeneratePos = useCallback(async () => {
    if (!selectedDeal?.id || generatingPos) return;
    const dealId = selectedDeal.id;
    setGeneratingPos(true);
    try {
      const res = await fetch(
        `/api/dashboard/deals/${encodeURIComponent(dealId)}/generate-pos`,
        { method: "POST" }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to generate POs");
      }
      const data = (await res.json()) as {
        created: PurchaseOrder[];
        skipped: number;
      };
      setSelectedDeal((cur) =>
        cur && cur.id === dealId
          ? {
              ...cur,
              purchaseOrders: [...(cur.purchaseOrders ?? []), ...data.created],
            }
          : cur
      );
      const n = data.created.length;
      if (n === 0) {
        toast(`Already up to date — ${data.skipped} POs already exist.`);
      } else {
        toast.success(
          `Created ${n} draft purchase order${n === 1 ? "" : "s"}.`
        );
      }
    } catch (e) {
      console.error("[Pipeline] generate POs failed", e);
      toast.error(e instanceof Error ? e.message : "Could not generate POs");
    } finally {
      setGeneratingPos(false);
    }
  }, [selectedDeal?.id, generatingPos]);

  const handleAddProduct = useCallback(
    async (product: ProductFull) => {
      if (!selectedDeal?.id) return;
      const dealId = selectedDeal.id;
      setAddingItem(true);
      try {
        const res = await fetch(
          `/api/dashboard/deals/${encodeURIComponent(dealId)}/line-items`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId: product.id, quantity: 1 }),
          }
        );
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        const r = data.item as {
          id: string;
          sku: string;
          productName: string;
          brand: string;
          finish: string;
          quantity: number;
          dealerCost: number;
          quotedPrice: number;
          msrp: number;
          shippingCost: number;
          leadTime: string;
          status: string;
          marginAmount: number;
          marginPercent: number;
        };
        const added: DealLineItem = {
          id: r.id,
          productName: r.productName,
          sku: r.sku,
          brand: r.brand,
          finish: r.finish || undefined,
          quantity: r.quantity,
          dealerCost: r.dealerCost,
          quotedPrice: r.quotedPrice,
          msrp: r.msrp,
          shippingCost: r.shippingCost,
          leadTime: r.leadTime || undefined,
          status: (r.status as DealLineItem["status"]) || "current",
          marginAmount: r.marginAmount,
          marginPercent: r.marginPercent,
        };
        setSelectedDeal((cur) =>
          cur && cur.id === dealId
            ? { ...cur, lineItems: [...(cur.lineItems ?? []), added] }
            : cur
        );
        toast.success(`Added ${r.sku || r.productName} to deal`);
        setProductPickerOpen(false);
      } catch (e) {
        console.error("[Pipeline] add line item failed", e);
        toast.error("Could not add product");
      } finally {
        setAddingItem(false);
      }
    },
    [selectedDeal?.id]
  );

  /**
   * Bulk-add confirmed PDF matches to the deal. Sequential to avoid Sheets
   * write conflicts; failure on any one row leaves the others applied.
   */
  const handlePdfImport = useCallback(
    async (results: PdfDropResult[]) => {
      if (!selectedDeal?.id || results.length === 0) return;
      const dealId = selectedDeal.id;
      setPdfImporting(true);
      const added: DealLineItem[] = [];
      let failures = 0;
      for (const r of results) {
        try {
          const res = await fetch(
            `/api/dashboard/deals/${encodeURIComponent(dealId)}/line-items`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                productId: r.product.id,
                quantity: r.quantity,
                ...(r.finish && { finish: r.finish }),
              }),
            }
          );
          if (!res.ok) {
            failures++;
            continue;
          }
          const data = await res.json();
          const row = data.item as {
            id: string;
            sku: string;
            productName: string;
            brand: string;
            finish: string;
            quantity: number;
            dealerCost: number;
            quotedPrice: number;
            msrp: number;
            shippingCost: number;
            leadTime: string;
            status: string;
            marginAmount: number;
            marginPercent: number;
          };
          added.push({
            id: row.id,
            productName: row.productName,
            sku: row.sku,
            brand: row.brand,
            finish: row.finish || undefined,
            quantity: row.quantity,
            dealerCost: row.dealerCost,
            quotedPrice: row.quotedPrice,
            msrp: row.msrp,
            shippingCost: row.shippingCost,
            leadTime: row.leadTime || undefined,
            status: (row.status as DealLineItem["status"]) || "current",
            marginAmount: row.marginAmount,
            marginPercent: row.marginPercent,
          });
        } catch {
          failures++;
        }
      }
      if (added.length > 0) {
        setSelectedDeal((cur) =>
          cur && cur.id === dealId
            ? { ...cur, lineItems: [...(cur.lineItems ?? []), ...added] }
            : cur
        );
      }
      setPdfImporting(false);
      if (failures === 0) {
        toast.success(`Imported ${added.length} line items from PDF`);
      } else {
        toast.warning(
          `Imported ${added.length}; ${failures} failed — retry or add manually`
        );
      }
    },
    [selectedDeal?.id]
  );

  const handleRemoveLineItem = useCallback(
    async (itemId: string) => {
      if (!selectedDeal?.id) return;
      const dealId = selectedDeal.id;
      const prev = selectedDeal.lineItems ?? [];
      // Optimistic
      setSelectedDeal((cur) =>
        cur && cur.id === dealId
          ? { ...cur, lineItems: prev.filter((i) => i.id !== itemId) }
          : cur
      );
      try {
        const res = await fetch(
          `/api/dashboard/deals/${encodeURIComponent(dealId)}/line-items`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ itemId }),
          }
        );
        if (!res.ok) throw new Error("Failed");
        toast.success("Removed");
      } catch (e) {
        console.error("[Pipeline] remove line item failed", e);
        // Roll back
        setSelectedDeal((cur) =>
          cur && cur.id === dealId ? { ...cur, lineItems: prev } : cur
        );
        toast.error("Could not remove");
      }
    },
    [selectedDeal?.id, selectedDeal?.lineItems]
  );

  // PATCH a line item field. Optimistic update — local recompute of margin
  // keeps the UI snappy; server response replaces with authoritative row.
  const handleUpdateLineItem = useCallback(
    async (
      itemId: string,
      patch: { quantity?: number; dealerCost?: number; quotedPrice?: number; shippingCost?: number }
    ) => {
      if (!selectedDeal?.id) return;
      const dealId = selectedDeal.id;
      const prev = selectedDeal.lineItems ?? [];
      // Optimistic local recompute
      setSelectedDeal((cur) =>
        cur && cur.id === dealId
          ? {
              ...cur,
              lineItems: prev.map((i) => {
                if (i.id !== itemId) return i;
                const qty = patch.quantity ?? i.quantity;
                const dc = patch.dealerCost ?? i.dealerCost;
                const qp = patch.quotedPrice ?? i.quotedPrice;
                const ship = patch.shippingCost ?? i.shippingCost;
                const marginAmount = (qp - dc) * qty;
                const marginPercent = qp > 0 ? Math.round(((qp - dc) / qp) * 1000) / 10 : 0;
                return { ...i, quantity: qty, dealerCost: dc, quotedPrice: qp, shippingCost: ship, marginAmount, marginPercent };
              }),
            }
          : cur
      );
      try {
        const res = await fetch(
          `/api/dashboard/deals/${encodeURIComponent(dealId)}/line-items`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ itemId, ...patch }),
          }
        );
        if (!res.ok) throw new Error("Failed");
      } catch (e) {
        console.error("[Pipeline] update line item failed", e);
        setSelectedDeal((cur) =>
          cur && cur.id === dealId ? { ...cur, lineItems: prev } : cur
        );
        toast.error("Could not update");
      }
    },
    [selectedDeal?.id, selectedDeal?.lineItems]
  );

  useEffect(() => {
    if (!selectedDeal?.id || dealTab !== "customs") return;
    const dealId = selectedDeal.id;
    setTraficosLoading(true);
    fetch(`/api/dashboard/traficos?dealId=${encodeURIComponent(dealId)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { traficos: [] }))
      .then((d) => {
        const list = (d.traficos as TraficoSummary[]) ?? [];
        setDealTraficos(list);
        // Background-fetch rich shape for each Trafico in parallel; failures
        // leave the entry as null and the UI falls back to the slim card.
        list.forEach((t) => {
          fetch(`/api/dashboard/traficos/${encodeURIComponent(t.TRF_ID)}/rich`, { cache: "no-store" })
            .then((r) => (r.ok ? r.json() : null))
            .then((rich: HydratedTrafico | null) =>
              setRichMap((m) => ({ ...m, [t.TRF_ID]: rich }))
            )
            .catch(() => setRichMap((m) => ({ ...m, [t.TRF_ID]: null })));
        });
      })
      .catch((e) => {
        console.error("[Pipeline] dealTraficos fetch failed", e);
        setDealTraficos([]);
      })
      .finally(() => setTraficosLoading(false));
  }, [selectedDeal?.id, dealTab]);

  const startNewTrafico = async () => {
    if (!selectedDeal?.id || creatingTrafico) return;
    setCreatingTrafico(true);
    // CC-TRF-{YYYY}-{ms}-{rand3} — collision-resistant, sortable
    const now = new Date();
    const trfId = `CC-TRF-${now.getFullYear()}-${Date.now()}-${Math.floor(
      Math.random() * 1000
    )
      .toString()
      .padStart(3, "0")}`;
    try {
      const r = await fetch("/api/dashboard/traficos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          TRF_ID: trfId,
          Trafico_Number: "",
          Status: "collecting",
          Initiated_Date: now.toISOString().slice(0, 10),
          Item_Count: "0",
        }),
        cache: "no-store",
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        toast.error(data.error || "Couldn't create Trafico");
        return;
      }
      toast.success("Trafico stub created", {
        description: `${trfId} — assign items in Customs to link to this deal`,
        action: {
          label: "Open Customs",
          onClick: () => router.push(`/dashboard/customs?trafico=${encodeURIComponent(trfId)}`),
        },
      });
      // Trafico won't appear in this deal's list yet (no Trafico_Items
      // link). Roger needs to assign items in /dashboard/customs.
    } catch (err) {
      console.error("[Pipeline] startNewTrafico failed", err);
      toast.error("Couldn't create Trafico");
    } finally {
      setCreatingTrafico(false);
    }
  };

  // Document generator state
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [generatorDocType, setGeneratorDocType] = useState<DocumentType>("quote");

  // Send dialog state
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sendDocId, setSendDocId] = useState("");
  const [sendDocType, setSendDocType] = useState("");

  // Preview panel state
  const [previewFile, setPreviewFile] = useState<PreviewFile | null>(null);

  // New doc menu
  const [newDocMenuOpen, setNewDocMenuOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const dealsByStage = (stage: PipelineStage) =>
    deals.filter((d) => d.stage === stage);

  const activeDeals = deals.filter((d) => !CLOSED_STAGES.includes(d.stage));
  const totalPipeline = activeDeals.reduce((sum, d) => sum + d.value, 0);
  const wonValue = deals
    .filter((d) => d.stage === "closed-won" || d.stage === "won")
    .reduce((sum, d) => sum + d.value, 0);
  const weightedValue = activeDeals.reduce(
    (sum, d) => sum + d.value * (d.probability / 100), 0
  );

  // Top deal for Pipeline Journey — selected deal takes priority, else highest-value active deal
  const journeyDeal = selectedDeal ?? activeDeals.sort((a, b) => b.value - a.value)[0] ?? null;

  // Fetch documents for selected deal
  const fetchDealDocs = useCallback(async (dealId: string) => {
    setDocsLoading(true);
    try {
      const res = await fetch(
        `/api/dashboard/documents?dealId=${dealId}`
      );
      if (res.ok) {
        const data = await res.json();
        setDealDocs(data.documents ?? []);
      }
    } catch {
      setDealDocs([]);
    } finally {
      setDocsLoading(false);
    }
  }, []);

  // When deal is selected or tab changes to documents, fetch docs
  useEffect(() => {
    if (selectedDeal && dealTab === "documents") {
      fetchDealDocs(selectedDeal.id);
    }
  }, [selectedDeal, dealTab, fetchDealDocs]);

  // Reset tab when deal changes
  useEffect(() => {
    setDealTab("details");
  }, [selectedDeal?.id]);

  const handleDragStart = (event: DragStartEvent) => {
    const deal = deals.find((d) => d.id === event.active.id);
    setActiveDeal(deal ?? null);
  };

  // Persists a stage change to the Pipeline sheet via PATCH. Optimistic
  // UI is already applied by the caller; we only handle rollback +
  // notification here. The PATCH route also fires the rule engine on
  // stage transitions, so this is the trigger point for any downstream
  // automation (SLA, alerts, deal_events).
  const persistStageChange = useCallback(
    async (dealId: string, newStage: PipelineStage, oldStage: PipelineStage) => {
      try {
        const res = await fetch("/api/dashboard/pipeline", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: dealId,
            stage: newStage,
            stage_entered_at: new Date().toISOString(),
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } catch (err) {
        // Roll back the optimistic UI update
        setDeals((prev) =>
          prev.map((d) =>
            d.id === dealId ? { ...d, stage: oldStage } : d
          )
        );
        setSelectedDeal((cur) =>
          cur && cur.id === dealId ? { ...cur, stage: oldStage } : cur
        );
        toast.error(
          `Couldn't save stage change: ${err instanceof Error ? err.message : "network error"}`
        );
      }
    },
    []
  );

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDeal(null);
    const { active, over } = event;
    if (!over) return;

    const overId = String(over.id);
    const movedDeal = deals.find((d) => d.id === active.id);

    // Sales view: columns are phases (discovery / design / close).
    // Resolve drop target: if dropped on a phase column or on a card in that phase,
    // pick the phase's default stage unless the deal is already in this phase (reorder, no change).
    let targetStage: PipelineStage | undefined;
    if (pipelineView === "sales") {
      const phase = SALES_PHASES.find(
        (p) =>
          p.id === overId ||
          p.stages.some((s) =>
            deals.some((d) => d.id === overId && d.stage === s)
          )
      );
      if (phase && movedDeal) {
        if (getJourneyPhase(movedDeal.stage) === phase.id) return;
        targetStage = phase.defaultStage;
      }
    } else {
      targetStage = stages.find(
        (s) => s === overId || dealsByStage(s).some((d) => d.id === overId)
      );
    }
    if (!targetStage) return;

    if (lostStages.includes(targetStage)) {
      setPendingLostDeal({ dealId: String(active.id), targetStage });
      setSelectedLostReason(null);
      setLostModalOpen(true);
      return;
    }

    const oldStage = movedDeal?.stage;
    setDeals((prev) =>
      prev.map((d) => {
        if (d.id !== active.id) return d;
        return { ...d, stage: targetStage };
      })
    );
    if (movedDeal && oldStage && oldStage !== targetStage) {
      addActivity({
        type: "deal",
        description: `Moved "${movedDeal.name}" from ${stageConfig[oldStage].label} → ${stageConfig[targetStage].label}`,
        contactName: movedDeal.contactName,
        dealId: movedDeal.id,
      });
      void persistStageChange(movedDeal.id, targetStage, oldStage);
    }
  };

  const confirmLostDeal = () => {
    if (!pendingLostDeal || !selectedLostReason) return;
    const lostDeal = deals.find((d) => d.id === pendingLostDeal.dealId);
    setDeals((prev) =>
      prev.map((d) =>
        d.id === pendingLostDeal.dealId
          ? {
              ...d,
              stage: pendingLostDeal.targetStage,
              lostReason: selectedLostReason,
              probability: 0,
            }
          : d
      )
    );
    if (lostDeal) {
      addActivity({
        type: "deal",
        description: `Marked "${lostDeal.name}" as ${stageConfig[pendingLostDeal.targetStage].label} — ${selectedLostReason}`,
        contactName: lostDeal.contactName,
        dealId: lostDeal.id,
      });
    }
    setLostModalOpen(false);
    setPendingLostDeal(null);
    setSelectedLostReason(null);
  };

  const cancelLostDeal = () => {
    setLostModalOpen(false);
    setPendingLostDeal(null);
    setSelectedLostReason(null);
  };

  const openNewDocument = (type: DocumentType) => {
    setGeneratorDocType(type);
    setGeneratorOpen(true);
    setNewDocMenuOpen(false);
  };

  const openSendDialog = (docId: string, docType?: string) => {
    setSendDocId(docId);
    setSendDocType(docType ?? "Document");
    setSendDialogOpen(true);
  };

  // Kanban columns — phase-grouped for Sales (3 cols), per-stage for Operations.
  type KanbanColumn = {
    id: string;
    label: string;
    accentClass: string;
    deals: PipelineDeal[];
    valueMxn: number;
  };

  const salesColumns: KanbanColumn[] = SALES_PHASES.map((phase) => {
    const phaseDeals = deals.filter(
      (d) =>
        getJourneyPhase(d.stage) === phase.id &&
        !CLOSED_STAGES.includes(d.stage)
    );
    return {
      id: phase.id,
      label: phase.label,
      accentClass: stageConfig[phase.defaultStage].bgColor,
      deals: phaseDeals,
      valueMxn: phaseDeals.reduce((sum, d) => sum + d.value, 0),
    };
  });

  const opsColumns: KanbanColumn[] = opsStages.map((stage) => {
    const stageDeals = dealsByStage(stage);
    return {
      id: stage,
      label: stageConfig[stage].label,
      accentClass: stageConfig[stage].bgColor,
      deals: stageDeals,
      valueMxn: stageDeals.reduce((sum, d) => sum + d.value, 0),
    };
  });

  const kanbanColumns: KanbanColumn[] =
    pipelineView === "sales" ? salesColumns : opsColumns;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          label="Active Pipeline"
          value={formatCurrency(totalPipeline)}
          icon={DollarSign}
          accentColor="bg-brand-copper"
        />
        <KPICard
          label="Weighted Value"
          value={formatCurrency(weightedValue)}
          change={12}
        />
        <KPICard
          label="Closed Won"
          value={formatCurrency(wonValue)}
          change={-10}
        />
        <KPICard
          label="Active Deals"
          value={String(activeDeals.length)}
        />
      </div>

      {/* Deal Journey — animated pipeline visualization */}
      <PipelineJourneyPlayer
        dealLabel={journeyDeal?.name}
        dealId={journeyDeal?.id}
        clientName={journeyDeal?.contactName}
        dealValue={journeyDeal ? formatCurrency(journeyDeal.value) : undefined}
        targetPhase={journeyDeal ? getJourneyPhaseIndex(journeyDeal.stage) : undefined}
      />

      {/* View Toggle + Add Deal */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-dash-bg rounded-lg p-1">
          <button
            onClick={() => setPipelineView("sales")}
            className={`px-4 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              pipelineView === "sales"
                ? "bg-dash-surface text-dash-text shadow-sm"
                : "text-dash-text-secondary hover:text-dash-text"
            }`}
          >
            Sales Pipeline
          </button>
          <button
            onClick={() => setPipelineView("operations")}
            className={`px-4 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              pipelineView === "operations"
                ? "bg-dash-surface text-dash-text shadow-sm"
                : "text-dash-text-secondary hover:text-dash-text"
            }`}
          >
            Operations
          </button>
        </div>
        <button
          onClick={() => {
            resetNewDealForm();
            setNewDealOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-1.5 text-sm bg-brand-copper text-white rounded-lg hover:bg-brand-copper/90 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Deal
        </button>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="overflow-x-auto pb-4">
          <div
            className="flex gap-4 min-h-[60vh]"
            style={{ minWidth: `${kanbanColumns.length * 236}px` }}
          >
            {kanbanColumns.map((col) => (
              <div
                key={col.id}
                className="bg-dash-bg rounded-xl p-3 min-w-[220px] flex-1"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${col.accentClass}`} />
                    <span className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">
                      {col.label}
                    </span>
                    <span className="text-[10px] bg-dash-border rounded-full px-1.5 py-0.5 text-dash-text-secondary">
                      {col.deals.length}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-dash-text-secondary mb-3">
                  {formatCurrency(col.valueMxn)}
                </p>

                <SortableContext
                  id={col.id}
                  items={col.deals.map((d) => d.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2 min-h-[100px]">
                    {col.deals.map((deal) => (
                      <DealCard
                        key={deal.id}
                        deal={deal}
                        onClick={() => setSelectedDeal(deal)}
                        shipmentRisk={shipmentRiskByDeal[deal.id]}
                        sla={slaByDeal[deal.id]}
                      />
                    ))}
                  </div>
                </SortableContext>
              </div>
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeDeal && <DealCardOverlay deal={activeDeal} />}
        </DragOverlay>
      </DndContext>

      {/* Deal Detail Slide-out */}
      <SlideOut
        open={!!selectedDeal}
        onClose={() => setSelectedDeal(null)}
        title={selectedDeal?.name ?? "Deal Detail"}
        width="w-[520px]"
      >
        {selectedDeal && (
          <div className="space-y-6">
            {/* W8: Pending-move banner shown when a high-value auto-move is queued */}
            {selectedDeal.pendingMoveTo && selectedDeal.pendingMoveAt && (
              <PendingMoveBanner
                dealId={selectedDeal.id}
                toStage={selectedDeal.pendingMoveTo}
                queuedAt={selectedDeal.pendingMoveAt}
                onAction={() => {
                  // Refetch the deal so the banner disappears / updates
                  setSelectedDeal(null);
                }}
              />
            )}

            {/* Tab switcher */}
            <div className="flex gap-1 bg-dash-bg rounded-lg p-1 overflow-x-auto">
              {([
                { key: "details" as DealTabKey, label: "Details", icon: User },
                { key: "line-items" as DealTabKey, label: "Line Items", icon: Package },
                { key: "payments" as DealTabKey, label: "Payments", icon: Wallet },
                { key: "purchase-orders" as DealTabKey, label: "POs", icon: FileText },
                { key: "shipments" as DealTabKey, label: "Shipments", icon: Truck },
                { key: "customs" as DealTabKey, label: "Customs", icon: FileCheck },
                { key: "landed-cost" as DealTabKey, label: "Landed Cost", icon: Calculator },
                { key: "financial" as DealTabKey, label: "P&L", icon: BarChart3 },
                { key: "documents" as DealTabKey, label: "Docs", icon: FileText },
                { key: "history" as DealTabKey, label: "History", icon: Circle },
              ]).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setDealTab(tab.key)}
                  className={`px-2.5 py-2 text-[11px] font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                    dealTab === tab.key
                      ? "bg-dash-surface text-dash-text shadow-sm"
                      : "text-dash-text-secondary hover:text-dash-text"
                  }`}
                >
                  <tab.icon className="w-3 h-3" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Details Tab */}
            {dealTab === "details" && (
              <>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary mb-3">
                    Deal Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-dash-text-secondary">Contact:</span>{" "}
                      {selectedDeal.contactName}
                    </p>
                    {selectedDeal.contactCompany && (
                      <p>
                        <span className="text-dash-text-secondary">
                          Company:
                        </span>{" "}
                        {selectedDeal.contactCompany}
                      </p>
                    )}
                    {selectedDeal.contactRole && (
                      <p>
                        <span className="text-dash-text-secondary">Role:</span>{" "}
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${roleColors[selectedDeal.contactRole] ?? "bg-dash-bg text-dash-text-secondary"}`}
                        >
                          {selectedDeal.contactRole}
                        </span>
                      </p>
                    )}
                    <p>
                      <span className="text-dash-text-secondary">Value:</span>{" "}
                      <span className="font-semibold text-brand-copper">
                        ${selectedDeal.value.toLocaleString()}{" "}
                        {selectedDeal.currency}
                      </span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-dash-text-secondary">Stage:</span>
                      <select
                        value={selectedDeal.stage}
                        onChange={(e) => {
                          const newStage = e.target.value as PipelineStage;
                          const oldStage = selectedDeal.stage;
                          if (newStage === oldStage) return;
                          setDeals((prev) =>
                            prev.map((d) =>
                              d.id === selectedDeal.id
                                ? { ...d, stage: newStage }
                                : d
                            )
                          );
                          setSelectedDeal((d) =>
                            d ? { ...d, stage: newStage } : d
                          );
                          addActivity({
                            type: "deal",
                            description: `Moved "${selectedDeal.name}" from ${stageConfig[oldStage].label} → ${stageConfig[newStage].label}`,
                            contactName: selectedDeal.contactName,
                            dealId: selectedDeal.id,
                          });
                          toast.success(
                            `Stage changed to ${stageConfig[newStage].label}`
                          );
                          void persistStageChange(
                            selectedDeal.id,
                            newStage,
                            oldStage
                          );
                        }}
                        className="text-xs bg-dash-bg border border-dash-border rounded px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30"
                      >
                        {stages.map((s) => (
                          <option key={s} value={s}>
                            {stageConfig[s]?.label ?? s}
                          </option>
                        ))}
                      </select>
                    </p>
                    <p>
                      <span className="text-dash-text-secondary">
                        Probability:
                      </span>{" "}
                      {selectedDeal.probability}%
                    </p>
                    <p>
                      <span className="text-dash-text-secondary">
                        Expected Close:
                      </span>{" "}
                      {format(
                        new Date(selectedDeal.expectedClose),
                        "MMMM d, yyyy"
                      )}
                    </p>
                    <p>
                      <span className="text-dash-text-secondary">Rep:</span>{" "}
                      {selectedDeal.assignedRep || "Unassigned"}
                    </p>
                    {selectedDeal.projectType && (
                      <p>
                        <span className="text-dash-text-secondary">
                          Project Type:
                        </span>{" "}
                        {selectedDeal.projectType}
                      </p>
                    )}
                    {selectedDeal.leadSource && (
                      <p>
                        <span className="text-dash-text-secondary">
                          Lead Source:
                        </span>{" "}
                        {selectedDeal.leadSource}
                      </p>
                    )}
                    {selectedDeal.competitor && (
                      <p>
                        <span className="text-dash-text-secondary">
                          Competitor:
                        </span>{" "}
                        {selectedDeal.competitor}
                      </p>
                    )}
                    {selectedDeal.lostReason && (
                      <p>
                        <span className="text-dash-text-secondary">
                          Lost Reason:
                        </span>{" "}
                        <span className="text-status-lost">
                          {selectedDeal.lostReason}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary mb-3">
                    Products
                  </h4>
                  <p className="text-sm">{selectedDeal.products}</p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary mb-3">
                    Context
                  </h4>
                  <p className="text-sm text-dash-text leading-relaxed">
                    {selectedDeal.notes}
                  </p>
                </div>

                <div className="pt-4 border-t border-dash-border">
                  <ThreadOnDealPanel dealId={selectedDeal.id} />
                </div>

                <div className="pt-4 border-t border-dash-border">
                  <NotesPanel
                    entityType="deal"
                    entityId={selectedDeal.id}
                    title="Activity Notes"
                  />
                </div>

                <div className="flex gap-2 pt-4 border-t border-dash-border">
                  <button className="flex-1 px-4 py-2 text-sm bg-brand-copper text-white rounded-lg hover:bg-brand-copper/90 transition-colors cursor-pointer">
                    Edit Deal
                  </button>
                  <button
                    onClick={() => {
                      setActivityLogDeal(selectedDeal);
                      setActivityNote("");
                      setActivityType("call");
                      setSelectedDeal(null);
                    }}
                    className="flex-1 px-4 py-2 text-sm border border-dash-border rounded-lg hover:bg-dash-bg transition-colors cursor-pointer"
                  >
                    Log Activity
                  </button>
                  <ShareButton
                    entityType="deal"
                    entityId={selectedDeal.id}
                    summary={`Deal: ${selectedDeal.name} — $${selectedDeal.value.toLocaleString()} ${selectedDeal.currency}`}
                    deepLink={`/dashboard/pipeline#${selectedDeal.id}`}
                    compact
                  />
                </div>
              </>
            )}

            {/* Documents Tab */}
            {/* W8: History tab — Deal_Events timeline + rollback UX */}
            {dealTab === "history" && (
              <DealHistoryPanel dealId={selectedDeal.id} />
            )}

            {dealTab === "documents" && (
              <div className="space-y-4">
                {/* New Document dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setNewDocMenuOpen(!newDocMenuOpen)}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-brand-copper text-white rounded-lg hover:bg-brand-copper/90 transition-colors cursor-pointer"
                  >
                    <FilePlus className="w-4 h-4" />
                    New Document
                  </button>
                  {newDocMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setNewDocMenuOpen(false)}
                      />
                      <div className="absolute top-full left-0 mt-1 z-20 bg-dash-surface border border-dash-border rounded-lg shadow-lg py-1 min-w-[180px]">
                        {(
                          ["quote", "invoice", "po", "receipt"] as DocumentType[]
                        ).map((type) => (
                          <button
                            key={type}
                            onClick={() => openNewDocument(type)}
                            className="w-full text-left px-4 py-2 text-sm text-dash-text hover:bg-dash-bg transition-colors cursor-pointer"
                          >
                            New {getDocumentTypeLabel(type)}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Documents list */}
                {docsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-dash-text-secondary" />
                  </div>
                ) : dealDocs.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-10 h-10 text-dash-text-secondary/30 mx-auto mb-2" />
                    <p className="text-sm text-dash-text-secondary">
                      No documents yet
                    </p>
                    <p className="text-xs text-dash-text-secondary/60 mt-1">
                      Create a quote, invoice, or PO for this deal
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dealDocs.map((doc) => (
                      <div
                        key={doc.Doc_ID}
                        className="flex items-center gap-3 p-3 bg-dash-bg rounded-lg hover:bg-dash-bg/80 transition-colors"
                      >
                        <div
                          className={`w-8 h-8 rounded-lg bg-dash-surface border border-dash-border flex items-center justify-center shrink-0 ${DOC_TYPE_ICONS[doc.Type] ?? "text-dash-text-secondary"}`}
                        >
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-dash-text truncate">
                            {doc.Doc_ID}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-dash-text-secondary">
                            <span>
                              {getDocumentTypeLabel(
                                doc.Type as DocumentType
                              )}
                            </span>
                            <span className="text-dash-border">&bull;</span>
                            <span>{doc.Created_Date}</span>
                            {doc.Amount && (
                              <>
                                <span className="text-dash-border">
                                  &bull;
                                </span>
                                <span className="text-brand-copper">
                                  $
                                  {parseInt(doc.Amount).toLocaleString()}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${DOC_STATUS_STYLES[doc.Status] ?? DOC_STATUS_STYLES.Draft}`}
                        >
                          {doc.Status}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          {doc.Drive_File_ID && (
                            <button
                              onClick={() =>
                                setPreviewFile({
                                  id: doc.Drive_File_ID,
                                  name: doc.File_Name,
                                  mimeType: "application/pdf",
                                  webViewLink: `https://drive.google.com/file/d/${doc.Drive_File_ID}/view`,
                                })
                              }
                              className="p-1.5 rounded hover:bg-dash-surface text-dash-text-secondary hover:text-dash-text transition-colors cursor-pointer"
                              title="Preview"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() =>
                              openSendDialog(
                                doc.Doc_ID,
                                getDocumentTypeLabel(
                                  doc.Type as DocumentType
                                )
                              )
                            }
                            className="p-1.5 rounded hover:bg-dash-surface text-dash-text-secondary hover:text-brand-copper transition-colors cursor-pointer"
                            title="Send"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Line Items Tab */}
            {dealTab === "line-items" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">
                    Product Line Items
                  </h4>
                  <div className="flex items-center gap-2">
                    {(selectedDeal.lineItems ?? []).length > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setShareModalOpen(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-dash-border text-dash-text rounded-lg hover:bg-dash-bg transition-colors cursor-pointer"
                          title="Send to customer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          Share
                        </button>
                        <a
                          href={`/dashboard/quotes/${encodeURIComponent(selectedDeal.id)}/print?auto=1`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-dash-border text-dash-text rounded-lg hover:bg-dash-bg transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          PDF
                        </a>
                      </>
                    )}
                    <button
                      onClick={() => setPdfDropOpen(true)}
                      disabled={pdfImporting}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-dash-border text-dash-text rounded-lg hover:bg-dash-bg transition-colors cursor-pointer disabled:opacity-50"
                      title="Drop a spec PDF and we'll extract every product reference"
                    >
                      {pdfImporting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <FileUp className="w-3.5 h-3.5" />
                      )}
                      Drop PDF
                    </button>
                    <button
                      onClick={() => setProductPickerOpen(true)}
                      disabled={addingItem}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-brand-copper text-white rounded-lg hover:bg-brand-copper/90 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {addingItem ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                      Add product
                    </button>
                  </div>
                </div>
                {lineItemsLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-6 h-6 text-dash-text-secondary animate-spin mx-auto" />
                  </div>
                ) : (selectedDeal.lineItems ?? []).length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-10 h-10 text-dash-text-secondary/30 mx-auto mb-2" />
                    <p className="text-sm text-dash-text-secondary">No line items yet</p>
                    <p className="text-xs text-dash-text-secondary/60 mt-1">Click <span className="text-brand-copper">Add product</span> to search the 354k Odoo catalog</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      {(selectedDeal.lineItems ?? []).map((item) => (
                        <div key={item.id} className="bg-dash-bg rounded-lg p-3 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-dash-text">{item.productName}</p>
                              <p className="text-[11px] text-dash-text-secondary">{item.brand} &bull; SKU: {item.sku}{item.finish ? ` \u2022 ${item.finish}` : ""}</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                item.status === "current" ? "bg-dash-success/10 text-dash-success" :
                                item.status === "custom" ? "bg-dash-cat-violet/10 text-dash-cat-violet" :
                                item.status === "special-order" ? "bg-dash-warn/10 text-dash-warn" :
                                "bg-dash-danger/10 text-dash-danger"
                              }`}>
                                {item.status}
                              </span>
                              <button
                                onClick={() => handleRemoveLineItem(item.id)}
                                className="p-1 rounded hover:bg-dash-danger/10 text-dash-text-secondary hover:text-dash-danger transition-colors cursor-pointer"
                                title="Remove"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-[11px]">
                            <div>
                              <p className="text-dash-text-secondary">Qty</p>
                              <EditableNumber
                                value={item.quantity}
                                min={1}
                                onCommit={(q) => handleUpdateLineItem(item.id, { quantity: q })}
                                className="text-dash-text font-medium"
                              />
                            </div>
                            <div>
                              <p className="text-dash-text-secondary">Dealer Cost</p>
                              <EditableNumber
                                value={item.dealerCost}
                                prefix="$"
                                step={0.01}
                                onCommit={(v) => handleUpdateLineItem(item.id, { dealerCost: v })}
                                className="text-dash-text font-medium"
                              />
                            </div>
                            <div>
                              <p className="text-dash-text-secondary">Quoted</p>
                              <EditableNumber
                                value={item.quotedPrice}
                                prefix="$"
                                step={0.01}
                                onCommit={(v) => handleUpdateLineItem(item.id, { quotedPrice: v })}
                                className="text-brand-copper font-medium"
                              />
                            </div>
                            <div>
                              <p className="text-dash-text-secondary">Margin</p>
                              <p className={`font-medium ${item.marginPercent >= 35 ? "text-dash-success" : item.marginPercent >= 20 ? "text-dash-warn" : "text-dash-danger"}`}>
                                {item.marginPercent}%
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-dash-text-secondary">
                            <span>Shipping:</span>
                            <EditableNumber
                              value={item.shippingCost}
                              prefix="$"
                              step={0.01}
                              onCommit={(v) => handleUpdateLineItem(item.id, { shippingCost: v })}
                              className="text-dash-text"
                            />
                            {item.leadTime && <span>&bull; Lead time: {item.leadTime}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Totals — derived live from line items */}
                    {(() => {
                      const items = selectedDeal.lineItems ?? [];
                      const totalQuoted = items.reduce((s, i) => s + i.quotedPrice * i.quantity, 0);
                      const totalDealerCost = items.reduce((s, i) => s + i.dealerCost * i.quantity, 0);
                      const totalShipping = items.reduce((s, i) => s + i.shippingCost, 0);
                      const netMargin = totalQuoted - totalDealerCost - totalShipping;
                      const marginPercent = totalQuoted > 0 ? Math.round((netMargin / totalQuoted) * 1000) / 10 : 0;
                      const marginColor = marginPercent >= 35 ? "text-dash-success" : marginPercent >= 20 ? "text-dash-warn" : "text-dash-danger";
                      return (
                        <div className="bg-dash-bg rounded-lg p-3 border border-dash-border">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <p className="text-dash-text-secondary">Total Quoted</p>
                              <p className="text-dash-text font-semibold">${totalQuoted.toLocaleString(undefined, { maximumFractionDigits: 2 })} MXN</p>
                            </div>
                            <div>
                              <p className="text-dash-text-secondary">Total Dealer Cost</p>
                              <p className="text-dash-text font-semibold">${totalDealerCost.toLocaleString(undefined, { maximumFractionDigits: 2 })} MXN</p>
                            </div>
                            <div>
                              <p className="text-dash-text-secondary">Total Shipping</p>
                              <p className="text-dash-text font-semibold">${totalShipping.toLocaleString(undefined, { maximumFractionDigits: 2 })} MXN</p>
                            </div>
                            <div>
                              <p className="text-dash-text-secondary">Net Margin</p>
                              <p className={`${marginColor} font-semibold`}>{marginPercent}% <span className="text-[10px] text-dash-text-secondary font-normal">(${netMargin.toLocaleString(undefined, { maximumFractionDigits: 0 })})</span></p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
            )}

            {/* Payments Tab */}
            {dealTab === "payments" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">
                    Payments
                  </h4>
                  {selectedDeal.paymentStructure && (
                    <span className="text-[10px] px-2 py-0.5 bg-dash-bg rounded-full text-dash-text-secondary">
                      {selectedDeal.paymentStructure === "fifty-fifty" ? "50/50 Split" :
                       selectedDeal.paymentStructure === "full-upfront" ? "Full Upfront" :
                       selectedDeal.paymentStructure === "net-30" ? "Net 30" : "Custom"}
                    </span>
                  )}
                </div>
                {/* Payment summary */}
                {(selectedDeal.payments ?? []).length > 0 && (
                  <div className="bg-dash-bg rounded-lg p-3 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-dash-text-secondary">Total Due</p>
                      <p className="text-dash-text font-semibold">${(selectedDeal.payments ?? []).reduce((s, p) => s + p.amount, 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-dash-text-secondary">Collected</p>
                      <p className="text-dash-success font-semibold">${(selectedDeal.payments ?? []).filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-dash-text-secondary">Outstanding</p>
                      <p className="text-dash-warn font-semibold">${(selectedDeal.payments ?? []).filter(p => p.status !== "paid" && p.status !== "cancelled").reduce((s, p) => s + p.amount, 0).toLocaleString()}</p>
                    </div>
                  </div>
                )}
                {(selectedDeal.payments ?? []).length === 0 ? (
                  <div className="text-center py-8">
                    <Wallet className="w-10 h-10 text-dash-text-secondary/30 mx-auto mb-2" />
                    <p className="text-sm text-dash-text-secondary">No payments tracked</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(selectedDeal.payments ?? []).map((payment) => (
                      <div key={payment.id} className="bg-dash-bg rounded-lg p-3 flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          payment.status === "paid" ? "bg-dash-success/10 text-dash-success" :
                          payment.status === "overdue" ? "bg-dash-danger/10 text-dash-danger" :
                          payment.status === "sent" ? "bg-dash-info/10 text-dash-info" :
                          "bg-dash-surface text-dash-text-secondary"
                        }`}>
                          <DollarSign className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-dash-text">{payment.invoiceId}</p>
                          <div className="flex items-center gap-2 text-[11px] text-dash-text-secondary">
                            <span className="capitalize">{payment.type}{payment.installmentNumber ? ` ${payment.installmentNumber}` : ""}</span>
                            <span className="text-dash-border">&bull;</span>
                            <span className="text-brand-copper">${payment.amount.toLocaleString()} {payment.currency}</span>
                            {payment.stripeFees && (
                              <>
                                <span className="text-dash-border">&bull;</span>
                                <span>Fees: -${payment.stripeFees.toLocaleString()}</span>
                              </>
                            )}
                          </div>
                          {payment.dueDate && (
                            <p className="text-[10px] text-dash-text-secondary mt-0.5">
                              Due: {payment.dueDate}{payment.paidDate ? ` \u2022 Paid: ${payment.paidDate}` : ""}
                            </p>
                          )}
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${
                          payment.status === "paid" ? "bg-dash-success/10 text-dash-success" :
                          payment.status === "overdue" ? "bg-dash-danger/10 text-dash-danger" :
                          payment.status === "sent" ? "bg-dash-info/10 text-dash-info" :
                          payment.status === "draft" ? "bg-dash-text-secondary/10 text-dash-text-secondary" :
                          "bg-dash-warn/10 text-dash-warn"
                        }`}>
                          {payment.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Purchase Orders Tab */}
            {dealTab === "purchase-orders" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">
                    Purchase Orders
                  </h4>
                  {(selectedDeal.lineItems ?? []).length > 0 && (selectedDeal.purchaseOrders ?? []).length === 0 && (
                    <button
                      onClick={handleGeneratePos}
                      disabled={generatingPos}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-brand-copper text-white rounded-lg hover:bg-brand-copper/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <FilePlus className="w-3.5 h-3.5" />
                      {generatingPos ? "Generating…" : "Generate POs"}
                    </button>
                  )}
                </div>
                {posLoading ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-dash-text-secondary">Loading purchase orders…</p>
                  </div>
                ) : (selectedDeal.purchaseOrders ?? []).length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-10 h-10 text-dash-text-secondary/30 mx-auto mb-2" />
                    <p className="text-sm text-dash-text-secondary">No purchase orders yet</p>
                    <p className="text-xs text-dash-text-secondary/60 mt-1">Generate POs from line items to start ordering</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(selectedDeal.purchaseOrders ?? []).map((po) => (
                      <div key={po.id} className="bg-dash-bg rounded-lg p-3 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-dash-text">{po.id}</p>
                            <p className="text-[11px] text-dash-text-secondary">{po.brand} &bull; {po.manufacturerName}</p>
                          </div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            po.status === "received" ? "bg-dash-success/10 text-dash-success" :
                            po.status === "shipped" ? "bg-dash-info/10 text-dash-info" :
                            po.status === "in-production" ? "bg-dash-cat-violet/10 text-dash-cat-violet" :
                            po.status === "confirmed" || po.status === "paid-to-manufacturer" ? "bg-dash-info/10 text-dash-info" :
                            po.status === "sent" ? "bg-dash-warn/10 text-dash-warn" :
                            po.status === "issue" ? "bg-dash-danger/10 text-dash-danger" :
                            "bg-dash-text-secondary/10 text-dash-text-secondary"
                          }`}>
                            {po.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[11px]">
                          <div>
                            <p className="text-dash-text-secondary">Items</p>
                            <p className="text-dash-text font-medium">{po.items.length}</p>
                          </div>
                          <div>
                            <p className="text-dash-text-secondary">Total (Dealer)</p>
                            <p className="text-dash-text font-medium">${po.totalAmount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-dash-text-secondary">Mfr Paid</p>
                            <p className={`font-medium ${po.paymentToMfr ? "text-dash-success" : "text-dash-warn"}`}>
                              {po.paymentToMfr ? `\u2713 ${po.paymentToMfr.date}` : "Pending"}
                            </p>
                          </div>
                        </div>
                        {po.trackingNumber && (
                          <p className="text-[10px] text-dash-text-secondary">
                            {po.trackingCarrier}: {po.trackingNumber}
                          </p>
                        )}
                        {po.receivedCondition && po.receivedCondition !== "good" && (
                          <p className="text-[10px] text-dash-danger">
                            Condition: {po.receivedCondition}{po.receivedNotes ? ` \u2014 ${po.receivedNotes}` : ""}
                          </p>
                        )}
                        {/* Items list */}
                        <div className="border-t border-dash-border pt-2 mt-1">
                          {po.items.map((item, idx) => (
                            <p key={idx} className="text-[10px] text-dash-text-secondary">
                              {item.quantity}x {item.productName}{item.finish ? ` (${item.finish})` : ""} &mdash; ${item.dealerCost.toLocaleString()}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Shipments Tab */}
            {dealTab === "shipments" && (
              <div className="space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">
                  Shipments
                </h4>
                {selectedDeal.deliveryStrategy && (
                  <div className="bg-dash-bg rounded-lg p-2 text-[11px] text-dash-text-secondary flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5" />
                    Strategy: {selectedDeal.deliveryStrategy === "consolidate" ? "Consolidate & deliver once" : "Deliver as available"}
                  </div>
                )}
                {(selectedDeal.shipments ?? []).length === 0 ? (
                  <div className="text-center py-8">
                    <Truck className="w-10 h-10 text-dash-text-secondary/30 mx-auto mb-2" />
                    <p className="text-sm text-dash-text-secondary">No shipments yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(selectedDeal.shipments ?? []).map((shipment) => (
                      <div key={shipment.id} className="bg-dash-bg rounded-lg p-3 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-dash-text">{shipment.brand}</p>
                            <p className="text-[11px] text-dash-text-secondary">PO: {shipment.poId}</p>
                          </div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            shipment.status === "delivered-to-customer" ? "bg-dash-success/10 text-dash-success" :
                            shipment.status === "delivered-to-cc" ? "bg-dash-cat-teal/10 text-dash-cat-teal" :
                            shipment.status === "in-transit" ? "bg-dash-info/10 text-dash-info" :
                            shipment.status === "customs" ? "bg-dash-warn/10 text-dash-warn" :
                            "bg-dash-text-secondary/10 text-dash-text-secondary"
                          }`}>
                            {shipment.status.replace(/-/g, " ")}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          {shipment.carrier && (
                            <div>
                              <p className="text-dash-text-secondary">Carrier</p>
                              <p className="text-dash-text font-medium">{shipment.carrier}</p>
                            </div>
                          )}
                          {shipment.trackingNumber && (
                            <div>
                              <p className="text-dash-text-secondary">Tracking</p>
                              <p className="text-dash-text font-medium font-mono text-[10px]">{shipment.trackingNumber}</p>
                            </div>
                          )}
                          {shipment.estimatedArrival && (
                            <div>
                              <p className="text-dash-text-secondary">ETA</p>
                              <p className="text-dash-text font-medium">{shipment.estimatedArrival}</p>
                            </div>
                          )}
                          {shipment.actualArrival && (
                            <div>
                              <p className="text-dash-text-secondary">Arrived</p>
                              <p className="text-dash-text font-medium">{shipment.actualArrival}</p>
                            </div>
                          )}
                        </div>
                        {/* Inspection */}
                        {shipment.inspectionStatus && (
                          <div className={`flex items-center gap-1.5 text-[10px] ${
                            shipment.inspectionStatus === "passed" ? "text-dash-success" :
                            shipment.inspectionStatus === "damaged" ? "text-dash-danger" :
                            "text-dash-warn"
                          }`}>
                            {shipment.inspectionStatus === "passed" ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                            Inspection: {shipment.inspectionStatus}
                            {shipment.inspectionNotes && ` \u2014 ${shipment.inspectionNotes}`}
                          </div>
                        )}
                        {/* Items */}
                        <div className="border-t border-dash-border pt-2">
                          {shipment.items.map((item, idx) => (
                            <p key={idx} className="text-[10px] text-dash-text-secondary">
                              {item.quantity}x {item.productName}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Customs Tab */}
            {dealTab === "customs" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">
                    Import Crossings
                  </h4>
                  <button
                    type="button"
                    onClick={startNewTrafico}
                    disabled={creatingTrafico}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium bg-brand-copper text-white rounded-lg hover:bg-brand-copper/90 disabled:opacity-50 transition-colors cursor-pointer"
                    title="Create a new Trafico stub. You'll assign items in Customs to link it to this deal."
                  >
                    <Plus className="w-3 h-3" />
                    {creatingTrafico ? "Creating…" : "Start New Trafico"}
                  </button>
                </div>

                {traficosLoading ? (
                  <div className="text-center py-8 text-xs text-dash-text-secondary">Loading…</div>
                ) : dealTraficos.length === 0 ? (
                  <div className="text-center py-8">
                    <FileCheck className="w-10 h-10 text-dash-text-secondary/30 mx-auto mb-2" />
                    <p className="text-sm text-dash-text-secondary">No customs crossings linked</p>
                    <p className="text-xs text-dash-text-secondary/60 mt-1">
                      Items in this deal have not been assigned to a tráfico yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dealTraficos.map((t) => {
                      const cfg = TRAFICO_STATUS_CONFIG[t.Status as TraficoStatus];
                      const cost = Number(t.Total_Import_Cost || 0);
                      const rich = richMap[t.TRF_ID];
                      const items = rich?.trafico.items ?? [];
                      const checklist = rich ? getDocumentChecklist(rich.trafico) : [];
                      const uploaded = checklist.filter((c) => c.status === "uploaded").length;
                      const applicable = checklist.filter((c) => c.status !== "not-applicable").length;
                      const docsPct = applicable > 0 ? Math.round((uploaded / applicable) * 100) : 0;
                      const calc = rich?.trafico.calculoBreakdown;
                      const recentEvents = (rich?.events ?? [])
                        .slice()
                        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
                        .slice(0, 3);
                      return (
                        <div key={t.TRF_ID} className="bg-dash-bg rounded-lg p-3 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-medium text-dash-text">
                                Tráfico {t.Trafico_Number || t.TRF_ID}
                              </p>
                              {t.Pedimento_Number && (
                                <p className="text-[10px] text-dash-text-secondary font-mono">
                                  {t.Pedimento_Number}
                                </p>
                              )}
                            </div>
                            {cfg && (
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${cfg.bg} ${cfg.text}`}
                              >
                                {cfg.label.en}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-dash-text-secondary">Items in crossing</span>
                            <span className="text-dash-text">{items.length || t.Item_Count || "0"}</span>
                          </div>
                          {cost > 0 && (
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-dash-text-secondary">Total Import Cost</span>
                              <span className="text-brand-copper font-medium">
                                ${cost.toLocaleString()} MXN
                              </span>
                            </div>
                          )}
                          {rich && applicable > 0 && (
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-dash-text-secondary">Documents</span>
                              <span className="text-dash-text">
                                {uploaded}/{applicable} uploaded
                                <span className="text-dash-text-secondary ml-1">({docsPct}%)</span>
                              </span>
                            </div>
                          )}
                          {items.length > 0 && (
                            <div className="border-t border-dash-border pt-2 space-y-1">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-dash-text-secondary">
                                Vendors
                              </p>
                              {items.slice(0, 4).map((it) => (
                                <div
                                  key={it.id}
                                  className="flex items-center justify-between text-[11px]"
                                >
                                  <span className="text-dash-text">
                                    {it.vendorName}
                                    {it.usmcaStatus === "on-file" && (
                                      <span className="ml-1.5 text-[9px] text-dash-success">USMCA</span>
                                    )}
                                    {it.spanishManualsRequired &&
                                      it.spanishManualsStatus !== "on-file" && (
                                        <span className="ml-1.5 text-[9px] text-dash-warn">
                                          MANUAL
                                        </span>
                                      )}
                                  </span>
                                  <span className="text-dash-text-secondary">
                                    ${it.invoiceTotal.toLocaleString()}
                                  </span>
                                </div>
                              ))}
                              {items.length > 4 && (
                                <p className="text-[10px] text-dash-text-secondary">
                                  +{items.length - 4} more
                                </p>
                              )}
                            </div>
                          )}
                          {calc && (
                            <div className="border-t border-dash-border pt-2 space-y-1">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-dash-text-secondary">
                                Cálculo
                              </p>
                              <div className="grid grid-cols-3 gap-2 text-[10px]">
                                <div>
                                  <p className="text-dash-text-secondary">Taxes</p>
                                  <p className="text-dash-text">
                                    ${calc.taxSubtotal.toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-dash-text-secondary">Broker</p>
                                  <p className="text-dash-text">
                                    ${calc.brokerSubtotal.toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-dash-text-secondary">Warehouse</p>
                                  <p className="text-dash-text">
                                    ${calc.warehouseSubtotal.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          {recentEvents.length > 0 && (
                            <div className="border-t border-dash-border pt-2 space-y-1">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-dash-text-secondary">
                                Recent activity
                              </p>
                              {recentEvents.map((e) => (
                                <p key={e.event_id} className="text-[10px] text-dash-text-secondary">
                                  <span className="text-dash-text">{e.event_type}</span>
                                  {e.from_status && e.to_status && (
                                    <>
                                      {" "}
                                      <span className="text-dash-text-secondary">
                                        {e.from_status} → {e.to_status}
                                      </span>
                                    </>
                                  )}
                                  {e.message && <> · {e.message}</>}
                                </p>
                              ))}
                            </div>
                          )}
                          <Link
                            href={`/dashboard/shipments/${encodeURIComponent(t.TRF_ID)}`}
                            className="inline-block text-[11px] text-brand-copper hover:underline"
                          >
                            View full detail →
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Landed Cost Tab — quote-time computation per spec §Part 3 */}
            {dealTab === "landed-cost" && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">
                  Landed Cost Calculator
                </h4>
                <p className="text-[11px] text-dash-text-secondary">
                  Compute total cost (FOB → CIF → duty + IVA + broker + freight) for any
                  brand × product × quantity at quote time.
                </p>
                <LandedCostCalculator
                  variant="full"
                  defaultValues={{
                    brandId: selectedDeal.brandSlugs?.[0] ?? "",
                    destinationType: "warehouse_sma",
                  }}
                />
              </div>
            )}

            {/* Financial Summary Tab */}
            {dealTab === "financial" && (
              <div className="space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">
                  Deal P&L
                </h4>

                {/* Money In */}
                <div className="bg-dash-bg rounded-lg p-3 space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-dash-success">Money In</p>
                  {(selectedDeal.payments ?? []).map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-xs">
                      <span className="text-dash-text-secondary">
                        {p.invoiceId} ({p.type}{p.installmentNumber ? ` ${p.installmentNumber}` : ""}):
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="text-dash-text">${p.amount.toLocaleString()} MXN</span>
                        {p.status === "paid" ? (
                          <span className="text-dash-success">\u2705</span>
                        ) : p.status === "overdue" ? (
                          <span className="text-dash-danger">\u26a0\ufe0f</span>
                        ) : (
                          <span className="text-dash-text-secondary">\u23f3</span>
                        )}
                      </span>
                    </div>
                  ))}
                  {(selectedDeal.totalStripeFees ?? 0) > 0 && (
                    <div className="flex items-center justify-between text-xs border-t border-dash-border pt-1">
                      <span className="text-dash-text-secondary">Stripe fees:</span>
                      <span className="text-dash-danger">-${(selectedDeal.totalStripeFees ?? 0).toLocaleString()} MXN</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs font-semibold border-t border-dash-border pt-1">
                    <span className="text-dash-text-secondary">Net collected:</span>
                    <span className="text-dash-text">${((selectedDeal.totalCollected ?? 0) - (selectedDeal.totalStripeFees ?? 0)).toLocaleString()} MXN</span>
                  </div>
                </div>

                {/* Money Out */}
                <div className="bg-dash-bg rounded-lg p-3 space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-dash-danger">Money Out</p>
                  {(selectedDeal.purchaseOrders ?? []).map((po) => (
                    <div key={po.id} className="flex items-center justify-between text-xs">
                      <span className="text-dash-text-secondary">
                        {po.id} ({po.brand}):
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="text-dash-text">${po.totalAmount.toLocaleString()} MXN</span>
                        {po.paymentToMfr ? (
                          <span className="text-dash-success">\u2705</span>
                        ) : (
                          <span className="text-dash-text-secondary">\u23f3</span>
                        )}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-xs font-semibold border-t border-dash-border pt-1">
                    <span className="text-dash-text-secondary">Total manufacturer cost:</span>
                    <span className="text-dash-text">${(selectedDeal.totalDealerCost ?? 0).toLocaleString()} MXN</span>
                  </div>
                </div>

                {/* Deal P&L */}
                <div className="bg-dash-bg rounded-lg p-3 space-y-1.5 border border-dash-border">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-copper">Deal P&L</p>
                  <div className="flex justify-between text-xs">
                    <span className="text-dash-text-secondary">Total quoted:</span>
                    <span className="text-dash-text">${(selectedDeal.totalQuoted ?? 0).toLocaleString()} MXN</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-dash-text-secondary">Stripe fees:</span>
                    <span className="text-dash-danger">-${(selectedDeal.totalStripeFees ?? 0).toLocaleString()} MXN</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-dash-text-secondary">Manufacturer costs:</span>
                    <span className="text-dash-danger">-${(selectedDeal.totalDealerCost ?? 0).toLocaleString()} MXN</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-dash-text-secondary">Shipping:</span>
                    <span className="text-dash-danger">-${(selectedDeal.totalShipping ?? 0).toLocaleString()} MXN</span>
                  </div>
                  {(selectedDeal.importCosts?.totalImportCost ?? 0) > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-dash-text-secondary">Import costs:</span>
                      <span className="text-dash-danger">-${(selectedDeal.importCosts?.totalImportCost ?? 0).toLocaleString()} MXN</span>
                    </div>
                  )}
                  <div className="border-t border-dash-border my-1" />
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-dash-text">Net profit:</span>
                    <span className="text-dash-success">
                      ${((selectedDeal.netMargin ?? 0) - (selectedDeal.importCosts?.totalImportCost ?? 0)).toLocaleString()} MXN
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-dash-text-secondary">Margin:</span>
                    <span className="text-dash-success font-semibold">{selectedDeal.marginPercent ?? 0}%</span>
                  </div>
                </div>

                {/* Completion Checklist */}
                <div className="bg-dash-bg rounded-lg p-3 space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-dash-text-secondary">Completion Checklist</p>
                  {getDealCompletionChecklist(selectedDeal).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      {item.checked ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-dash-success shrink-0" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-dash-text-secondary shrink-0" />
                      )}
                      <span className={item.checked ? "text-dash-text" : "text-dash-text-secondary"}>
                        {item.label.en}
                      </span>
                    </div>
                  ))}
                  {getDealCompletionChecklist(selectedDeal).every(i => i.checked) && (
                    <button className="w-full mt-2 px-4 py-2 text-sm bg-dash-success text-white rounded-lg hover:bg-dash-success/90 transition-colors cursor-pointer">
                      Mark Deal Complete
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </SlideOut>

      {/* Lost Reason Modal */}
      <SlideOut
        open={lostModalOpen}
        onClose={cancelLostDeal}
        title="Mark Deal as Lost"
        width="w-[400px]"
      >
        <div className="space-y-6">
          <p className="text-sm text-dash-text-secondary">
            Why was this deal lost? This helps improve our pipeline analysis.
          </p>
          <div className="space-y-2">
            {lostReasonOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedLostReason(option.value)}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm border transition-colors cursor-pointer ${
                  selectedLostReason === option.value
                    ? "border-brand-copper bg-brand-copper/10 text-brand-copper"
                    : "border-dash-border text-dash-text hover:border-brand-copper/30"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 pt-4">
            <button
              onClick={confirmLostDeal}
              disabled={!selectedLostReason}
              className="flex-1 px-4 py-2 text-sm bg-status-lost text-white rounded-lg hover:bg-status-lost/90 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Confirm Lost
            </button>
            <button
              onClick={cancelLostDeal}
              className="flex-1 px-4 py-2 text-sm border border-dash-border rounded-lg hover:bg-dash-bg transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </SlideOut>

      {/* Document Generator */}
      {generatorOpen && (
        <DocumentGenerator
          docType={generatorDocType}
          deal={selectedDeal}
          onClose={() => setGeneratorOpen(false)}
          onSaved={(docId) => {
            if (selectedDeal) fetchDealDocs(selectedDeal.id);
            setGeneratorOpen(false);
            openSendDialog(docId, getDocumentTypeLabel(generatorDocType));
          }}
          onSend={(docId) => {
            openSendDialog(docId, getDocumentTypeLabel(generatorDocType));
          }}
        />
      )}

      {/* Send Dialog */}
      <SendDialog
        open={sendDialogOpen}
        onClose={() => setSendDialogOpen(false)}
        docId={sendDocId}
        docType={sendDocType}
        customerName={selectedDeal?.contactName ?? ""}
        customerEmail=""
        dealName={selectedDeal?.name}
        onSent={() => {
          if (selectedDeal) {
            fetchDealDocs(selectedDeal.id);
            addActivity({
              type: "email",
              description: `Sent ${sendDocType || "document"} (${sendDocId}) to ${selectedDeal.contactName}`,
              contactName: selectedDeal.contactName,
              dealId: selectedDeal.id,
            });
          }
        }}
      />

      {/* Preview Panel */}
      <PreviewPanel
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        documentContext={
          previewFile
            ? {
                deal: selectedDeal,
                customerName: selectedDeal?.contactName,
              }
            : undefined
        }
        onSend={(docId) => {
          setPreviewFile(null);
          openSendDialog(docId);
        }}
      />

      {/* Activity Logger SlideOut */}
      <SlideOut
        open={!!activityLogDeal}
        onClose={() => setActivityLogDeal(null)}
        title={`Log Activity — ${activityLogDeal?.name ?? ""}`}
      >
        {activityLogDeal && (
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
                    contactName: activityLogDeal.contactName,
                    dealId: activityLogDeal.id,
                  });
                  setActivityLogDeal(null);
                }}
                disabled={!activityNote.trim()}
                className="flex-1 px-4 py-2 text-sm bg-brand-copper text-white rounded-lg hover:bg-brand-copper/90 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Log Activity
              </button>
              <button
                onClick={() => setActivityLogDeal(null)}
                className="px-4 py-2 text-sm border border-dash-border rounded-lg hover:bg-dash-bg transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </SlideOut>

      {/* New Deal — Option A direct entry (bypasses Lead form) */}
      <SlideOut
        open={newDealOpen}
        onClose={() => {
          if (!newDealSaving) {
            setNewDealOpen(false);
            resetNewDealForm();
          }
        }}
        title="New Deal"
        width="w-[520px]"
      >
        <div className="space-y-5">
          <p className="text-xs text-dash-text-secondary">
            For known customers — phone orders, walk-ins, WhatsApp, or
            referrals. For brand-new prospects, use a Lead instead.
          </p>

          <div>
            <label className="block text-xs font-medium text-dash-text-secondary mb-1.5">
              Deal name <span className="text-dash-danger">*</span>
            </label>
            <input
              type="text"
              value={newDealForm.name}
              onChange={(e) =>
                setNewDealForm((p) => ({ ...p, name: e.target.value }))
              }
              placeholder="Residencial San Antonio — 12 Units"
              className="w-full text-sm bg-dash-bg border border-dash-border rounded-lg px-3 py-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-dash-text-secondary mb-1.5">
              Customer / company
            </label>
            <input
              type="text"
              value={newDealForm.company}
              onChange={(e) =>
                setNewDealForm((p) => ({ ...p, company: e.target.value }))
              }
              placeholder="ARQ. Gabor Goded / Casa Atelier"
              className="w-full text-sm bg-dash-bg border border-dash-border rounded-lg px-3 py-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-dash-text-secondary mb-1.5">
                Stage
              </label>
              <select
                value={newDealForm.stage}
                onChange={(e) =>
                  setNewDealForm((p) => ({
                    ...p,
                    stage: e.target.value as PipelineStage,
                  }))
                }
                className="w-full text-sm bg-dash-bg border border-dash-border rounded-lg px-3 py-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30"
              >
                <option value="discovery">Discovery</option>
                <option value="design-scope">Design & Scope</option>
                <option value="proposal-sent">Proposal Sent</option>
                <option value="follow-up-negotiation">Negotiation</option>
                <option value="verbal-yes">Verbal Yes</option>
                <option value="won">Won</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-dash-text-secondary mb-1.5">
                Estimated value (MXN)
              </label>
              <input
                type="number"
                value={newDealForm.value}
                onChange={(e) =>
                  setNewDealForm((p) => ({ ...p, value: e.target.value }))
                }
                placeholder="450000"
                className="w-full text-sm bg-dash-bg border border-dash-border rounded-lg px-3 py-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-dash-text-secondary mb-1.5">
                Expected close
              </label>
              <input
                type="date"
                value={newDealForm.expectedClose}
                onChange={(e) =>
                  setNewDealForm((p) => ({
                    ...p,
                    expectedClose: e.target.value,
                  }))
                }
                className="w-full text-sm bg-dash-bg border border-dash-border rounded-lg px-3 py-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-dash-text-secondary mb-1.5">
                Source
              </label>
              <select
                value={newDealForm.source}
                onChange={(e) =>
                  setNewDealForm((p) => ({ ...p, source: e.target.value }))
                }
                className="w-full text-sm bg-dash-bg border border-dash-border rounded-lg px-3 py-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30"
              >
                <option value="Direct">Direct</option>
                <option value="Email">Email</option>
                <option value="Walk-in">Walk-in</option>
                <option value="Phone">Phone</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Referral">Referral</option>
                <option value="Trade Program">Trade Program</option>
                <option value="Instagram">Instagram</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-dash-text-secondary mb-1.5">
              Brands involved{" "}
              <span className="text-dash-text-secondary/70 font-normal">
                ({newDealForm.brandSlugs.length} selected)
              </span>
            </label>
            {brandOptions.length === 0 ? (
              <p className="text-xs text-dash-text-secondary">
                Loading brands…
              </p>
            ) : (
              <div className="max-h-40 overflow-y-auto border border-dash-border rounded-lg p-2 bg-dash-bg">
                <div className="flex flex-wrap gap-1.5">
                  {brandOptions.map((b) => {
                    const active = newDealForm.brandSlugs.includes(b.slug);
                    return (
                      <button
                        key={b.slug}
                        type="button"
                        onClick={() => toggleNewDealBrand(b.slug)}
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

          <div className="flex gap-3 pt-4 border-t border-dash-border">
            <button
              onClick={createNewDeal}
              disabled={!newDealForm.name.trim() || newDealSaving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-brand-copper text-white rounded-lg hover:bg-brand-copper/90 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {newDealSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {newDealSaving ? "Creating…" : "Create Deal"}
            </button>
            <button
              onClick={() => {
                if (newDealSaving) return;
                setNewDealOpen(false);
                resetNewDealForm();
              }}
              className="px-4 py-2.5 text-sm border border-dash-border rounded-lg hover:bg-dash-bg transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </SlideOut>

      {productPickerOpen && selectedDeal && (
        <ProductPicker
          onSelect={handleAddProduct}
          onClose={() => setProductPickerOpen(false)}
        />
      )}
      {selectedDeal && (
        <PdfDropModal
          open={pdfDropOpen}
          onClose={() => setPdfDropOpen(false)}
          onCommit={handlePdfImport}
          locale="en"
          theme="dashboard"
          ctaLabel={`Import to ${selectedDeal.id}`}
        />
      )}
      {shareModalOpen && selectedDeal && (
        <ShareQuoteModal
          dealId={selectedDeal.id}
          onClose={() => setShareModalOpen(false)}
        />
      )}
    </div>
  );
};

// useSearchParams() requires a Suspense boundary at static prerender time.
const PipelinePage = () => (
  <Suspense fallback={null}>
    <PipelinePageInner />
  </Suspense>
);

export default PipelinePage;
