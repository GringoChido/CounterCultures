"use client";

import { useState } from "react";
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
import { Plus, DollarSign, Calendar, User, AlertCircle, MessageCircle } from "lucide-react";
import { KPICard } from "@/app/(dashboard)/components/kpi-card";
import { SlideOut } from "@/app/(dashboard)/components/slide-out";
import { SAMPLE_PIPELINE, type PipelineDeal, type PipelineStage, type LostReason } from "@/app/lib/sample-dashboard-data";

const stageConfig: Record<PipelineStage, { label: string; color: string; bgColor: string }> = {
  // Original stages
  discovery: { label: "Discovery", color: "text-status-new", bgColor: "bg-status-new" },
  proposal: { label: "Proposal", color: "text-status-qualified", bgColor: "bg-status-qualified" },
  negotiation: { label: "Negotiation", color: "text-status-contacted", bgColor: "bg-status-contacted" },
  "closed-won": { label: "Closed Won", color: "text-status-won", bgColor: "bg-status-won" },
  "closed-lost": { label: "Closed Lost", color: "text-status-lost", bgColor: "bg-status-lost" },
  // New expanded stages
  "target-identified": { label: "Target Identified", color: "text-dash-text-secondary", bgColor: "bg-dash-text-secondary" },
  contacted: { label: "Contacted", color: "text-blue-400", bgColor: "bg-blue-400" },
  "conversation-started": { label: "Conversation", color: "text-cyan-400", bgColor: "bg-cyan-400" },
  "qualified-project": { label: "Qualified", color: "text-status-qualified", bgColor: "bg-status-qualified" },
  "design-scope": { label: "Design Scope", color: "text-violet-400", bgColor: "bg-violet-400" },
  "proposal-sent": { label: "Proposal Sent", color: "text-indigo-400", bgColor: "bg-indigo-400" },
  "follow-up-negotiation": { label: "Follow-Up", color: "text-amber-400", bgColor: "bg-amber-400" },
  "verbal-yes": { label: "Verbal Yes", color: "text-emerald-400", bgColor: "bg-emerald-400" },
  won: { label: "Won", color: "text-status-won", bgColor: "bg-status-won" },
  lost: { label: "Lost", color: "text-status-lost", bgColor: "bg-status-lost" },
};

const stages: PipelineStage[] = [
  "target-identified", "contacted", "conversation-started", "qualified-project",
  "discovery", "design-scope", "proposal", "proposal-sent",
  "negotiation", "follow-up-negotiation", "verbal-yes",
  "closed-won", "won", "closed-lost", "lost",
];

const lostStages: PipelineStage[] = ["closed-lost", "lost"];

const lostReasonOptions: { value: LostReason; label: string }[] = [
  { value: "price", label: "Price too high" },
  { value: "timeline", label: "Timeline didn't work" },
  { value: "competitor", label: "Went with competitor" },
  { value: "no-budget", label: "No budget" },
  { value: "ghost", label: "Ghost / No response" },
  { value: "other", label: "Other" },
];

const roleColors: Record<string, string> = {
  Architect: "bg-violet-500/10 text-violet-400",
  "Interior Designer": "bg-pink-500/10 text-pink-400",
  Developer: "bg-blue-500/10 text-blue-400",
  Builder: "bg-amber-500/10 text-amber-400",
  "Private Client": "bg-brand-copper/10 text-brand-copper",
  Supplier: "bg-cyan-500/10 text-cyan-400",
  Partner: "bg-emerald-500/10 text-emerald-400",
  "Hospitality Designer": "bg-rose-500/10 text-rose-400",
};

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
};

interface DealCardProps {
  deal: PipelineDeal;
  onClick: () => void;
}

const DealCard = ({ deal, onClick }: DealCardProps) => {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bg-dash-surface border border-dash-border rounded-lg p-3.5 cursor-grab active:cursor-grabbing hover:border-brand-copper/30 transition-colors"
    >
      <div className="flex items-start justify-between mb-2">
        <p className="text-sm font-medium text-dash-text leading-snug flex-1 mr-2">
          {deal.name}
        </p>
        <button
          onClick={handleWhatsApp}
          className="p-1 rounded hover:bg-green-500/10 text-dash-text-secondary hover:text-green-400 transition-colors cursor-pointer shrink-0"
          title={`WhatsApp ${deal.contactName}`}
        >
          <MessageCircle className="w-3.5 h-3.5" />
        </button>
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

      {/* Contact company */}
      {deal.contactCompany && (
        <p className="text-[10px] text-dash-text-secondary mb-1.5 truncate">
          {deal.contactCompany}
        </p>
      )}

      {/* Role badge */}
      {deal.contactRole && (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium mb-1.5 ${roleColors[deal.contactRole] ?? "bg-dash-bg text-dash-text-secondary"}`}>
          {deal.contactRole}
        </span>
      )}

      <div className="flex items-center justify-between text-[10px] text-dash-text-secondary">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {format(new Date(deal.expectedClose), "MMM d")}
        </div>
        <span>{deal.probability}%</span>
      </div>

      {/* Follow-up date with overdue indicator */}
      {deal.followUpDate && (
        <div className={`flex items-center gap-1 text-[10px] mt-1.5 ${isOverdue ? "text-red-400 font-medium" : "text-dash-text-secondary"}`}>
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

const PipelinePage = () => {
  const [deals, setDeals] = useState(SAMPLE_PIPELINE);
  const [activeDeal, setActiveDeal] = useState<PipelineDeal | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<PipelineDeal | null>(null);

  // Lost reason modal state
  const [lostModalOpen, setLostModalOpen] = useState(false);
  const [pendingLostDeal, setPendingLostDeal] = useState<{ dealId: string; targetStage: PipelineStage } | null>(null);
  const [selectedLostReason, setSelectedLostReason] = useState<LostReason | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const dealsByStage = (stage: PipelineStage) => deals.filter((d) => d.stage === stage);
  const stageValue = (stage: PipelineStage) =>
    dealsByStage(stage).reduce((sum, d) => sum + d.value, 0);

  const totalPipeline = deals
    .filter((d) => !["closed-won", "closed-lost", "won", "lost"].includes(d.stage))
    .reduce((sum, d) => sum + d.value, 0);
  const wonValue = deals
    .filter((d) => d.stage === "closed-won" || d.stage === "won")
    .reduce((sum, d) => sum + d.value, 0);
  const weightedValue = deals
    .filter((d) => !["closed-won", "closed-lost", "won", "lost"].includes(d.stage))
    .reduce((sum, d) => sum + d.value * (d.probability / 100), 0);

  const handleDragStart = (event: DragStartEvent) => {
    const deal = deals.find((d) => d.id === event.active.id);
    setActiveDeal(deal ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDeal(null);
    const { active, over } = event;
    if (!over) return;

    const overId = String(over.id);
    const targetStage = stages.find((s) => s === overId || dealsByStage(s).some((d) => d.id === overId));
    if (!targetStage) return;

    // If dragging to a lost stage, show lost reason modal
    if (lostStages.includes(targetStage)) {
      setPendingLostDeal({ dealId: String(active.id), targetStage });
      setSelectedLostReason(null);
      setLostModalOpen(true);
      return;
    }

    setDeals((prev) =>
      prev.map((d) => (d.id === active.id ? { ...d, stage: targetStage } : d))
    );
  };

  const confirmLostDeal = () => {
    if (!pendingLostDeal || !selectedLostReason) return;
    setDeals((prev) =>
      prev.map((d) =>
        d.id === pendingLostDeal.dealId
          ? { ...d, stage: pendingLostDeal.targetStage, lostReason: selectedLostReason, probability: 0 }
          : d
      )
    );
    setLostModalOpen(false);
    setPendingLostDeal(null);
    setSelectedLostReason(null);
  };

  const cancelLostDeal = () => {
    setLostModalOpen(false);
    setPendingLostDeal(null);
    setSelectedLostReason(null);
  };

  // Filter out stages with no deals and no stage config display importance
  // Show all stages so the full pipeline is visible
  const visibleStages = stages;

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
          value={String(
            deals.filter(
              (d) => !["closed-won", "closed-lost", "won", "lost"].includes(d.stage)
            ).length
          )}
        />
      </div>

      {/* Add Deal button */}
      <div className="flex justify-end">
        <button className="flex items-center gap-2 px-4 py-1.5 text-sm bg-brand-copper text-white rounded-lg hover:bg-brand-copper/90 transition-colors cursor-pointer">
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
          <div className="flex gap-4 min-h-[60vh]" style={{ minWidth: `${visibleStages.length * 236}px` }}>
            {visibleStages.map((stage) => {
              const config = stageConfig[stage];
              const stageDeals = dealsByStage(stage);

              return (
                <div
                  key={stage}
                  className="bg-dash-bg rounded-xl p-3 min-w-[220px] flex-1"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${config.bgColor}`} />
                      <span className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary">
                        {config.label}
                      </span>
                      <span className="text-[10px] bg-dash-border rounded-full px-1.5 py-0.5 text-dash-text-secondary">
                        {stageDeals.length}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-dash-text-secondary mb-3">
                    {formatCurrency(stageValue(stage))}
                  </p>

                  {/* Cards */}
                  <SortableContext
                    id={stage}
                    items={stageDeals.map((d) => d.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2 min-h-[100px]">
                      {stageDeals.map((deal) => (
                        <DealCard
                          key={deal.id}
                          deal={deal}
                          onClick={() => setSelectedDeal(deal)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </div>
              );
            })}
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
      >
        {selectedDeal && (
          <div className="space-y-6">
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
                    <span className="text-dash-text-secondary">Company:</span>{" "}
                    {selectedDeal.contactCompany}
                  </p>
                )}
                {selectedDeal.contactRole && (
                  <p>
                    <span className="text-dash-text-secondary">Role:</span>{" "}
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${roleColors[selectedDeal.contactRole] ?? "bg-dash-bg text-dash-text-secondary"}`}>
                      {selectedDeal.contactRole}
                    </span>
                  </p>
                )}
                <p>
                  <span className="text-dash-text-secondary">Value:</span>{" "}
                  <span className="font-semibold text-brand-copper">
                    ${selectedDeal.value.toLocaleString()} {selectedDeal.currency}
                  </span>
                </p>
                <p>
                  <span className="text-dash-text-secondary">Stage:</span>{" "}
                  {stageConfig[selectedDeal.stage]?.label ?? selectedDeal.stage}
                </p>
                <p>
                  <span className="text-dash-text-secondary">Probability:</span>{" "}
                  {selectedDeal.probability}%
                </p>
                <p>
                  <span className="text-dash-text-secondary">Expected Close:</span>{" "}
                  {format(new Date(selectedDeal.expectedClose), "MMMM d, yyyy")}
                </p>
                <p>
                  <span className="text-dash-text-secondary">Rep:</span>{" "}
                  {selectedDeal.assignedRep || "Unassigned"}
                </p>
                {selectedDeal.projectType && (
                  <p>
                    <span className="text-dash-text-secondary">Project Type:</span>{" "}
                    {selectedDeal.projectType}
                  </p>
                )}
                {selectedDeal.leadSource && (
                  <p>
                    <span className="text-dash-text-secondary">Lead Source:</span>{" "}
                    {selectedDeal.leadSource}
                  </p>
                )}
                {selectedDeal.competitor && (
                  <p>
                    <span className="text-dash-text-secondary">Competitor:</span>{" "}
                    {selectedDeal.competitor}
                  </p>
                )}
                {selectedDeal.lostReason && (
                  <p>
                    <span className="text-dash-text-secondary">Lost Reason:</span>{" "}
                    <span className="text-status-lost">{selectedDeal.lostReason}</span>
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
                Notes
              </h4>
              <p className="text-sm text-dash-text leading-relaxed">
                {selectedDeal.notes}
              </p>
            </div>

            <div className="flex gap-2 pt-4 border-t border-dash-border">
              <button className="flex-1 px-4 py-2 text-sm bg-brand-copper text-white rounded-lg hover:bg-brand-copper/90 transition-colors cursor-pointer">
                Edit Deal
              </button>
              <button className="flex-1 px-4 py-2 text-sm border border-dash-border rounded-lg hover:bg-dash-bg transition-colors cursor-pointer">
                Log Activity
              </button>
            </div>
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
    </div>
  );
};

export default PipelinePage;
