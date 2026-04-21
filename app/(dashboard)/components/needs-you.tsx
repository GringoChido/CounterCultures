"use client";

/**
 * Needs You — the single focused "what needs your attention" list on the
 * Overview page. Each row is a precise deep-link to the exact fix
 * destination (not a list page).
 *
 * Visual: quiet. Uses the calm end of the CC palette. Severity is conveyed
 * by a small left ring (amber for warning, terracotta for danger). No flame
 * icons, no uppercase caps-lock titles.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Check } from "lucide-react";

interface NeedsYouItem {
  id: string;
  source: "customs" | "followup" | "shipment-delay";
  message: string;
  href: string;
  severity: "warning" | "danger";
  ageHours: number;
}

const SOURCE_LABEL: Record<NeedsYouItem["source"], string> = {
  customs: "Customs",
  followup: "Follow-up",
  "shipment-delay": "Shipment",
};

const formatAge = (hours: number): string => {
  if (hours < 1) return "just now";
  if (hours < 24) return `${Math.round(hours)}h`;
  const days = Math.round(hours / 24);
  return `${days}d`;
};

// Filter out `__TEST_*` seed rows left behind by simulation scripts.
const isProductionItem = (item: NeedsYouItem): boolean =>
  !item.message.includes("__TEST_") && !item.href.includes("__TEST_");

const NeedsYou = () => {
  const [items, setItems] = useState<NeedsYouItem[] | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/needs-you")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setItems((d.items ?? []).filter(isProductionItem)))
      .catch(() => setItems([]));
  }, []);

  if (items === null) {
    return (
      <div className="bg-dash-surface border border-dash-border rounded-md p-5">
        <div className="h-4 w-32 bg-dash-bg rounded animate-pulse mb-4" />
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-3 w-full bg-dash-bg rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-dash-surface border border-dash-border rounded-md p-5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-brand-sage/10 flex items-center justify-center shrink-0">
          <Check className="w-4 h-4 text-brand-sage" />
        </div>
        <div>
          <p className="text-sm font-medium text-dash-text">All clear</p>
          <p className="text-xs text-dash-text-secondary">Nothing needs your attention.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dash-surface border border-dash-border rounded-md">
      <div className="px-5 pt-5 pb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-medium text-dash-text">Needs your attention</h2>
        <span className="text-xs text-dash-text-secondary">{items.length}</span>
      </div>
      <ul className="divide-y divide-dash-border/60">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="group flex items-center gap-3 px-5 py-2.5 hover:bg-dash-bg/70 transition-colors"
            >
              <span
                aria-hidden
                className={`w-1 h-8 rounded-full shrink-0 ${
                  item.severity === "danger"
                    ? "bg-brand-terracotta"
                    : "bg-brand-copper/70"
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-dash-text leading-snug truncate">
                  {item.message}
                </p>
                <p className="text-[11px] text-dash-text-secondary mt-0.5">
                  {SOURCE_LABEL[item.source]} · {formatAge(item.ageHours)}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-dash-text-secondary/60 shrink-0 group-hover:text-brand-copper transition-colors" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export { NeedsYou };
