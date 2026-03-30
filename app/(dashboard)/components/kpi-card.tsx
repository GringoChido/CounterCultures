"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KPICardProps {
  label: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon?: React.ElementType;
  accentColor?: string;
}

const KPICard = ({
  label,
  value,
  change,
  changeLabel = "vs last month",
  icon: Icon,
  accentColor = "bg-brand-copper",
}: KPICardProps) => {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

  return (
    <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-dash-text-secondary font-medium">{label}</p>
        {Icon && (
          <div
            className={`${accentColor} w-9 h-9 rounded-lg flex items-center justify-center`}
          >
            <Icon className="w-4.5 h-4.5 text-white" />
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-dash-text">{value}</p>
      {change !== undefined && (
        <div className="flex items-center gap-1.5 mt-2">
          <TrendIcon
            className={`w-3.5 h-3.5 ${
              isPositive
                ? "text-status-won"
                : isNegative
                  ? "text-status-lost"
                  : "text-dash-text-secondary"
            }`}
          />
          <span
            className={`text-xs font-medium ${
              isPositive
                ? "text-status-won"
                : isNegative
                  ? "text-status-lost"
                  : "text-dash-text-secondary"
            }`}
          >
            {isPositive && "+"}
            {change}%
          </span>
          <span className="text-xs text-dash-text-secondary">{changeLabel}</span>
        </div>
      )}
    </div>
  );
};

export { KPICard };
export type { KPICardProps };
