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
import { format } from "date-fns";
import { Plus, DollarSign, Calendar, User } from "lucide-react";
import { KPICard } from "@/app/(dashboard)/components/kpi-card";
import { SlideOut } from "@/app/(dashboard)/components/slide-out";
import { SAMPLE_PIPELINE, type PipelineDeal } from "@/app/lib/sample-dashboard-data";

type Stage = "discovery" | "proposal" | "negotiation" | "closed-won" | "closed-lost";

const stageConfig: Record<Stage, { label: string; color: string; bgColor: string }> = {
  discovery: { label: "Discovery", color: "text-status-new", bgColor: "bg-status-new" },
  proposal: { label: "Proposal", color: "text-status-qualified", bgColor: "bg-status-qualified" },
  negotiation: { label: "Negotiation", color: "text-status-contacted", bgColor: "bg-status-contacted" },
  "closed-won": { label: "Closed Won", color: "text-status-won", bgColor: "bg-status-won" },
  "closed-lost": { label: "Closed Lost", color: "text-status-lost", bgColor: "bg-status-lost" },
};

const stages: Stage[] = ["discovery", "proposal", "negotiation", "closed-won", "closed-lost"];

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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bg-dash-surface border border-dash-border rounded-lg p-3.5 cursor-grab active:cursor-grabbing hover:border-brand-copper/30 transition-colors"
    >
      <p className="text-sm font-medium text-dash-text mb-2 leading-snug">
        {deal.name}
      </p>
      <div className="flex items-center justify-between text-xs text-dash-text-secondary mb-2">
        <div className="flex items-center gap-1">
          <User className="w-3 h-3" />
          {deal.contactName}
        </div>
        <span className="font-semibold text-brand-copper">
          {formatCurrency(deal.value)}
        </span>
      </div>
      <div className="flex items-center justify-between text-[10px] text-dash-text-secondary">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {format(new Date(deal.expectedClose), "MMM d")}
        </div>
        <span>{deal.probability}%</span>
      </div>
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const dealsByStage = (stage: Stage) => deals.filter((d) => d.stage === stage);
  const stageValue = (stage: Stage) =>
    dealsByStage(stage).reduce((sum, d) => sum + d.value, 0);

  const totalPipeline = deals
    .filter((d) => d.stage !== "closed-won" && d.stage !== "closed-lost")
    .reduce((sum, d) => sum + d.value, 0);
  const wonValue = deals
    .filter((d) => d.stage === "closed-won")
    .reduce((sum, d) => sum + d.value, 0);
  const weightedValue = deals
    .filter((d) => d.stage !== "closed-won" && d.stage !== "closed-lost")
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

    setDeals((prev) =>
      prev.map((d) => (d.id === active.id ? { ...d, stage: targetStage } : d))
    );
  };

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
              (d) => d.stage !== "closed-won" && d.stage !== "closed-lost"
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
        <div className="grid grid-cols-5 gap-4 min-h-[60vh]">
          {stages.map((stage) => {
            const config = stageConfig[stage];
            const stageDeals = dealsByStage(stage);

            return (
              <div
                key={stage}
                className="bg-dash-bg rounded-xl p-3"
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
                <p>
                  <span className="text-dash-text-secondary">Value:</span>{" "}
                  <span className="font-semibold text-brand-copper">
                    ${selectedDeal.value.toLocaleString()} {selectedDeal.currency}
                  </span>
                </p>
                <p>
                  <span className="text-dash-text-secondary">Stage:</span>{" "}
                  {stageConfig[selectedDeal.stage].label}
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
                  {selectedDeal.assignedRep}
                </p>
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
    </div>
  );
};

export default PipelinePage;
