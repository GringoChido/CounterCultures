"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import {
  Activity,
  Phone,
  Mail,
  Calendar,
  FileText,
  DollarSign,
  Users,
  MessageCircle,
} from "lucide-react";
import { EmptyState } from "./empty-state";

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  contactName?: string;
  rep?: string;
  timestamp: string;
  dealId?: string;
  contactId?: string;
}

const typeIcons: Record<string, React.ElementType> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  note: FileText,
  deal: DollarSign,
  lead: Users,
  whatsapp: MessageCircle,
};

const NewSinceLastCheck = () => {
  const [items, setItems] = useState<ActivityItem[] | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/activities?since=24h&limit=5")
      .then((r) => (r.ok ? r.json() : { activities: [] }))
      .then((d) => setItems(d.activities ?? []))
      .catch(() => setItems([]));
  }, []);

  if (items === null) {
    return (
      <div className="bg-dash-surface border border-dash-border rounded-md p-5">
        <div className="h-4 w-44 bg-dash-bg rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-3 w-full bg-dash-bg rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-dash-surface border border-dash-border rounded-md">
        <EmptyState
          icon={Activity}
          tone="muted"
          title="All quiet on the inbound"
          description={`Last checked ${format(new Date(), "h:mm a")}.`}
        />
      </div>
    );
  }

  return (
    <div className="bg-dash-surface border border-dash-border rounded-md p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-dash-text-secondary" />
          <h2 className="text-[11px] uppercase tracking-[0.08em] text-dash-text-muted font-semibold">
            New since last check
          </h2>
        </div>
        <span className="text-[10px] text-dash-text-muted">{items.length} in 24h</span>
      </div>

      <ul className="space-y-2">
        {items.map((item) => {
          const Icon = typeIcons[item.type] ?? Activity;
          const href = item.dealId
            ? `/dashboard/pipeline?deal=${item.dealId}`
            : item.contactId
              ? `/dashboard/leads?id=${item.contactId}`
              : "/dashboard/leads";
          return (
            <li key={item.id}>
              <Link
                href={href}
                className="flex items-start gap-2.5 py-1.5 px-2 -mx-2 rounded hover:bg-dash-bg transition-colors group"
              >
                <span className="w-7 h-7 rounded-full bg-dash-bg flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-3.5 h-3.5 text-dash-text-secondary" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-dash-text leading-snug group-hover:text-brand-copper transition-colors line-clamp-1">
                    {item.description || "(no description)"}
                  </p>
                  <p className="text-[10px] text-dash-text-muted mt-0.5">
                    {item.rep && `${item.rep} · `}
                    {(() => {
                      const t = new Date(item.timestamp);
                      return Number.isNaN(t.getTime()) ? "" : formatDistanceToNow(t, { addSuffix: true });
                    })()}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export { NewSinceLastCheck };
