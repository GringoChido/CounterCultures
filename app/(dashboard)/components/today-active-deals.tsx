"use client";

import { useEffect, useState } from "react";
import { Briefcase } from "lucide-react";
import { EntityCard, type StatusTone } from "./entity-card";
import { EmptyState } from "./empty-state";

interface PipelineDeal {
  id: string;
  name: string;
  company?: string;
  stage: string;
  value: string;
  probability?: string;
  expected_close?: string;
  owner?: string;
  brand_slugs?: string;
  last_activity?: string;
  created_at?: string;
}

interface BrandRow {
  slug?: string;
  name?: string;
  display_name?: string;
}

const CLOSED_STAGES = new Set(["closed-won", "closed-lost", "won", "lost"]);

const stageToToneMap: Record<string, StatusTone> = {
  discovery: "new",
  "design-scope": "in-progress",
  proposal: "in-progress",
  "proposal-sent": "in-progress",
  "proposal-negotiation": "in-progress",
  negotiation: "warning",
};

const stageLabel = (stage: string): string => {
  const map: Record<string, string> = {
    discovery: "Discovery",
    "design-scope": "Design Scope",
    proposal: "Proposal",
    "proposal-sent": "Proposal Sent",
    "proposal-negotiation": "Proposal · Negotiation",
    negotiation: "Negotiation",
  };
  return map[stage] ?? stage;
};

const formatCurrency = (value: number): string => {
  if (!Number.isFinite(value) || value <= 0) return "—";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M MXN`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K MXN`;
  return `$${value} MXN`;
};

const daysSince = (iso?: string): number => {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.floor((Date.now() - t) / (1000 * 60 * 60 * 24)));
};

const TodayActiveDeals = () => {
  const [deals, setDeals] = useState<PipelineDeal[] | null>(null);
  const [brandLookup, setBrandLookup] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.allSettled([
      fetch("/api/dashboard/pipeline").then((r) => (r.ok ? r.json() : { deals: [] })),
      fetch("/api/dashboard/brands").then((r) => (r.ok ? r.json() : { brands: [] })),
    ]).then(([pipelineRes, brandsRes]) => {
      const allDeals: PipelineDeal[] =
        pipelineRes.status === "fulfilled" ? pipelineRes.value.deals ?? [] : [];
      const active = allDeals.filter((d) => !CLOSED_STAGES.has((d.stage || "").toLowerCase()));
      // Sort by SLA risk descending: dayInStage / threshold (default 14)
      const ranked = active
        .slice()
        .sort((a, b) => {
          const aDays = daysSince(a.last_activity || a.created_at);
          const bDays = daysSince(b.last_activity || b.created_at);
          return bDays - aDays;
        })
        .slice(0, 5);
      setDeals(ranked);

      const brandRows: BrandRow[] =
        brandsRes.status === "fulfilled" ? brandsRes.value.brands ?? [] : [];
      const lookup: Record<string, string> = {};
      brandRows.forEach((b) => {
        if (b.slug) lookup[b.slug.toLowerCase()] = b.display_name || b.name || b.slug;
      });
      setBrandLookup(lookup);
    });
  }, []);

  if (deals === null) {
    return (
      <div className="bg-dash-surface border border-dash-border rounded-md p-5">
        <div className="h-4 w-48 bg-dash-bg rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 w-full bg-dash-bg rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <div className="bg-dash-surface border border-dash-border rounded-md">
        <EmptyState
          icon={Briefcase}
          title="Pipeline is empty"
          description="No active deals at the moment."
          cta={{ label: "Create one", href: "/dashboard/pipeline" }}
        />
      </div>
    );
  }

  return (
    <div className="bg-dash-surface border border-dash-border rounded-md p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-dash-text-secondary" />
          <h2 className="text-[11px] uppercase tracking-[0.08em] text-dash-text-muted font-semibold">
            Today&apos;s active deals
          </h2>
        </div>
        <span className="text-[10px] text-dash-text-muted">top {deals.length}</span>
      </div>

      <div className="space-y-2">
        {deals.map((deal) => {
          const slugs = (deal.brand_slugs || "")
            .split("|")
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean);
          const brandChips = slugs.map((s) => brandLookup[s] ?? s);
          const valueNumber = Number(deal.value || 0);
          const dayInStage = daysSince(deal.last_activity || deal.created_at);
          return (
            <EntityCard
              key={deal.id}
              variant="deal"
              id={deal.id}
              value={valueNumber > 0 ? formatCurrency(valueNumber) : undefined}
              title={deal.name || deal.company || "(untitled deal)"}
              contact={deal.company ? { name: deal.company, subtitle: deal.owner } : undefined}
              brandChips={brandChips.length > 0 ? brandChips : undefined}
              status={{ label: stageLabel(deal.stage), tone: stageToToneMap[deal.stage] ?? "neutral" }}
              sla={{ dayInStage, threshold: 14 }}
              href={`/dashboard/pipeline?deal=${deal.id}`}
            />
          );
        })}
      </div>
    </div>
  );
};

export { TodayActiveDeals };
