"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";
import {
  computeSalesHealth,
  type CampaignRecord,
  type HealthCheckItem,
  type LeadRecord,
  type PipelineRecord,
} from "@/app/lib/sales-health";

const MorningSalesHealth = () => {
  const [items, setItems] = useState<HealthCheckItem[] | null>(null);

  useEffect(() => {
    Promise.allSettled([
      fetch("/api/dashboard/pipeline").then((r) => (r.ok ? r.json() : { deals: [] })),
      fetch("/api/dashboard/leads").then((r) => (r.ok ? r.json() : { leads: [] })),
      fetch("/api/dashboard/email-campaigns").then((r) => (r.ok ? r.json() : { campaigns: [] })),
    ]).then(([pipelineRes, leadsRes, campaignsRes]) => {
      const deals: PipelineRecord[] =
        pipelineRes.status === "fulfilled" ? pipelineRes.value.deals ?? [] : [];
      const leads: LeadRecord[] =
        leadsRes.status === "fulfilled" ? leadsRes.value.leads ?? [] : [];
      const campaigns: CampaignRecord[] =
        campaignsRes.status === "fulfilled" ? campaignsRes.value.campaigns ?? [] : [];
      try {
        setItems(computeSalesHealth(deals, leads, campaigns));
      } catch {
        setItems([]);
      }
    });
  }, []);

  if (items === null) {
    return (
      <div className="bg-dash-surface border border-dash-border rounded-md p-5">
        <div className="h-4 w-44 bg-dash-bg rounded animate-pulse mb-4" />
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-3 w-full bg-dash-bg rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const passing = items.filter((i) => i.pass).length;
  const total = items.length;
  const failing = items.filter((i) => !i.pass);
  const allClear = failing.length === 0 && total > 0;

  return (
    <div className="bg-dash-surface border border-dash-border rounded-md p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-dash-text-secondary" />
          <h2 className="text-[11px] uppercase tracking-[0.08em] text-dash-text-muted font-semibold">
            Morning sales health
          </h2>
        </div>
        <span className="text-xs font-medium tabular-nums text-dash-text-secondary">
          {passing}/{total}
        </span>
      </div>

      {allClear ? (
        <div className="flex items-center gap-2 py-2">
          <CheckCircle2 className="w-4 h-4 text-brand-sage" />
          <p className="text-sm text-brand-sage font-medium">All checks passing.</p>
        </div>
      ) : failing.length === 0 ? (
        <p className="text-xs text-dash-text-muted">No health checks computed.</p>
      ) : (
        <ul className="space-y-2">
          {failing.map((item) => (
            <li key={item.label} className="flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-brand-terracotta mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-dash-text leading-snug">{item.label}</p>
                <p className="text-xs text-dash-text-muted leading-snug">{item.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/dashboard/weekly-review"
        className="inline-block mt-4 text-xs font-medium text-brand-copper hover:text-brand-terracotta transition-colors"
      >
        Full weekly review →
      </Link>
    </div>
  );
};

export { MorningSalesHealth };
