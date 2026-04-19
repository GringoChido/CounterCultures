"use client";

import Link from "next/link";

type EntityVariant = "lead" | "deal" | "shipment" | "trafico" | "trade-app";
type StatusTone = "new" | "in-progress" | "warning" | "danger" | "success" | "neutral";

interface EntityCardProps {
  variant: EntityVariant;
  id: string;
  value?: string;
  title: string;
  contact?: { name: string; subtitle?: string };
  brandChips?: string[];
  status?: { label: string; tone: StatusTone };
  sla?: { dayInStage: number; threshold: number; label?: string };
  href?: string;
  onClick?: () => void;
  actions?: React.ReactNode;
}

const toneToClasses: Record<StatusTone, string> = {
  new: "bg-brand-copper/10 text-brand-copper",
  "in-progress": "bg-brand-sage/15 text-brand-sage",
  warning: "bg-brand-terracotta/15 text-brand-terracotta",
  danger: "bg-brand-terracotta-dark/20 text-brand-terracotta-dark",
  success: "bg-brand-sage/20 text-brand-sage",
  neutral: "bg-dash-bg text-dash-text-secondary",
};

const variantToIdTone: Record<EntityVariant, string> = {
  lead: "text-dash-text-muted",
  deal: "text-brand-copper",
  shipment: "text-dash-info",
  trafico: "text-dash-info",
  "trade-app": "text-dash-text-muted",
};

const EntityCard = ({ variant, id, value, title, contact, brandChips, status, sla, href, onClick, actions }: EntityCardProps) => {
  const slaPct = sla ? Math.min(100, Math.round((sla.dayInStage / sla.threshold) * 100)) : 0;
  const slaTone = sla
    ? slaPct >= 100
      ? "bg-dash-danger"
      : slaPct >= 80
        ? "bg-dash-warn"
        : "bg-dash-success"
    : "";

  const body = (
    <div className="bg-dash-surface border border-dash-border rounded-md p-3 flex flex-col gap-2 transition-colors hover:border-dash-border-strong group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className={`font-mono text-[11px] ${variantToIdTone[variant]} shrink-0`}>{id}</span>
          {value && (
            <span className="font-body font-semibold text-sm text-dash-text tabular-nums truncate">{value}</span>
          )}
        </div>
        {actions && <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">{actions}</div>}
      </div>

      <h3 className="text-sm font-medium text-dash-text leading-tight line-clamp-2">{title}</h3>

      {contact && (
        <div className="text-xs text-dash-text-secondary leading-tight">
          <span className="font-medium">{contact.name}</span>
          {contact.subtitle && <span className="text-dash-text-muted"> · {contact.subtitle}</span>}
        </div>
      )}

      {brandChips && brandChips.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {brandChips.slice(0, 3).map((b) => (
            <span key={b} className="text-[10px] px-1.5 py-0.5 rounded bg-dash-surface-2 text-dash-text-secondary border border-dash-border">
              {b}
            </span>
          ))}
          {brandChips.length > 3 && (
            <span className="text-[10px] px-1.5 py-0.5 text-dash-text-muted">+{brandChips.length - 3}</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 mt-auto">
        {status && (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${toneToClasses[status.tone]}`}>
            {status.label}
          </span>
        )}
        {sla && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-[10px] text-dash-text-muted tabular-nums">{sla.label ?? `${sla.dayInStage}d`}</span>
            <div className="w-16 h-1 bg-dash-bg rounded-full overflow-hidden">
              <div className={`h-full ${slaTone} transition-all`} style={{ width: `${slaPct}%` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {body}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button onClick={onClick} className="block w-full text-left">
        {body}
      </button>
    );
  }
  return body;
};

export { EntityCard };
export type { EntityCardProps, EntityVariant, StatusTone };
