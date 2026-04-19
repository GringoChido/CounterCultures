"use client";

import { useEffect, useState } from "react";
import { KpiCard } from "./kpi-card";

interface RailData {
  pipelineValue: string;
  revenueLast24h: string;
  newLeadsLast24h: string;
  activeDealCount: string;
  pipelineDelta?: number;
  revenueDelta?: number;
  leadsDelta?: number;
  dealsDelta?: number;
}

const TodayKpiRail = () => {
  const [data, setData] = useState<RailData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/today-kpis")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null));
  }, []);

  return (
    <div className="space-y-3">
      <h2 className="text-[11px] uppercase tracking-[0.08em] text-dash-text-muted font-semibold pl-1">
        More
      </h2>
      <KpiCard
        label="Pipeline Value"
        value={data?.pipelineValue ?? "—"}
        change={data?.pipelineDelta}
        variant="compact"
        href="/dashboard/pipeline"
        changeLabel="vs prior 7d"
      />
      <KpiCard
        label="Revenue (24h)"
        value={data?.revenueLast24h ?? "—"}
        change={data?.revenueDelta}
        variant="compact"
        href="/dashboard/stripe"
        changeLabel="vs prior 24h"
      />
      <KpiCard
        label="New Leads (24h)"
        value={data?.newLeadsLast24h ?? "—"}
        change={data?.leadsDelta}
        variant="compact"
        href="/dashboard/leads"
        changeLabel="vs prior 24h"
      />
      <KpiCard
        label="Active Deals"
        value={data?.activeDealCount ?? "—"}
        change={data?.dealsDelta}
        variant="compact"
        href="/dashboard/pipeline"
        changeLabel="vs prior 7d"
      />
    </div>
  );
};

export { TodayKpiRail };
