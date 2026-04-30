"use client";

import Link from "next/link";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string;
  href?: string;
  change?: number;
  changeLabel?: string;
  variant?: "hero" | "compact";
  // Legacy props from KPICard v1 — accepted but ignored (icon + accent visuals
  // were dropped in v2 in favor of Cormorant numbers on a clean surface).
  icon?: React.ElementType;
  accentColor?: string;
}

const KpiCard = ({ label, value, href, change, changeLabel = "vs last month", variant = "hero" }: KpiCardProps) => {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
  const deltaTone = isPositive ? "text-dash-success" : isNegative ? "text-dash-danger" : "text-dash-text-secondary";

  const valueClass =
    variant === "hero"
      ? "font-display text-3xl text-dash-text leading-none"
      : "font-body font-semibold text-xl text-dash-text tabular-nums";

  const labelClass = "text-[11px] uppercase tracking-[0.08em] text-dash-text-muted font-medium";
  const padding = variant === "hero" ? "p-5" : "p-4";

  const surfaceClasses = `block bg-dash-surface rounded-md border border-dash-border ${padding} transition-colors hover:border-dash-border-strong`;

  const inner = (
    <>
      <p className={labelClass}>{label}</p>
      <p className={`${valueClass} mt-2`}>{value}</p>
      {change !== undefined && (
        <div className="flex items-center gap-1.5 mt-2">
          <TrendIcon className={`w-3.5 h-3.5 ${deltaTone}`} />
          <span className={`text-xs font-medium tabular-nums ${deltaTone}`}>
            {isPositive && "+"}
            {change}%
          </span>
          <span className="text-xs text-dash-text-muted">{changeLabel}</span>
        </div>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={surfaceClasses}>
        {inner}
      </Link>
    );
  }
  return <div className={surfaceClasses}>{inner}</div>;
};

// New code should import { KpiCard } directly. KPICard is a grandfathered alias.
export { KpiCard, KpiCard as KPICard };
export type { KpiCardProps };
