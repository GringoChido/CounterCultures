"use client";

import type { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}

const ChartCard = ({ title, subtitle, children, action }: ChartCardProps) => {
  return (
    <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-dash-text">{title}</h3>
          {subtitle && (
            <p className="text-xs text-dash-text-secondary mt-0.5">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
};

export { ChartCard };
