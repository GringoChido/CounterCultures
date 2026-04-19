"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, Coffee } from "lucide-react";

interface NeedsYouItem {
  id: string;
  source: "customs" | "followup" | "shipment-delay";
  message: string;
  href: string;
  severity: "warning" | "danger";
  ageHours: number;
}

const NeedsYou = () => {
  const [items, setItems] = useState<NeedsYouItem[] | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/needs-you")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setItems(d.items ?? []))
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
      <div className="bg-dash-surface border border-dash-border rounded-md p-5 flex flex-col items-center text-center py-10">
        <div className="w-10 h-10 rounded-full bg-brand-sage/15 flex items-center justify-center mb-3">
          <Coffee className="w-5 h-5 text-brand-sage" />
        </div>
        <p className="text-sm font-medium text-brand-sage">No fires today.</p>
        <p className="text-xs text-dash-text-muted mt-1">Nicely done.</p>
      </div>
    );
  }

  return (
    <div className="bg-dash-surface border border-dash-border rounded-md p-5">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-4 h-4 text-brand-terracotta" />
        <h2 className="text-[11px] uppercase tracking-[0.08em] text-dash-text-muted font-semibold">
          Needs you
        </h2>
      </div>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="flex items-start gap-2 py-1.5 px-2 rounded hover:bg-dash-bg transition-colors text-sm group"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${
                  item.severity === "danger" ? "bg-brand-terracotta-dark" : "bg-brand-terracotta"
                }`}
              />
              <span className="text-dash-text leading-snug group-hover:text-brand-copper transition-colors">
                {item.message}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export { NeedsYou };
