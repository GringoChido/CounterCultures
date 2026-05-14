"use client";

/**
 * Twelve-stage customs tracker matching Roger's spec walkthrough at
 * /how-it-works (Stage 8). The 12 dots represent the full import
 * lifecycle from origin pickup to released-to-deal. Roger sees one
 * row that says where the goods actually are.
 *
 * Pure presentation — caller passes the current stage (1-12) and a
 * map of optional metadata (dates, file ids) per stage.
 */

import { Check } from "lucide-react";

export const CUSTOMS_STAGES = [
  { num: 1, label: { en: "Pickup", es: "Recolección" } },
  { num: 2, label: { en: "In transit · Origin", es: "Tránsito · Origen" } },
  { num: 3, label: { en: "Origin port", es: "Puerto de origen" } },
  { num: 4, label: { en: "Ocean / Air freight", es: "Flete marítimo / aéreo" } },
  { num: 5, label: { en: "Customs broker", es: "Agente aduanal" } },
  { num: 6, label: { en: "Manzanillo", es: "Manzanillo" } },
  { num: 7, label: { en: "Pedimento", es: "Pedimento" } },
  { num: 8, label: { en: "Calculo received", es: "Cálculo recibido" } },
  { num: 9, label: { en: "Liberación SAT", es: "Liberación SAT" } },
  { num: 10, label: { en: "Trucking", es: "Trucking" } },
  { num: 11, label: { en: "Warehouse · CC", es: "Bodega · CC" } },
  { num: 12, label: { en: "Released", es: "Liberado" } },
] as const;

export type CustomsStageNum = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

interface TwelveStageTrackerProps {
  /** 1-12 — the active stage. 0 means not-yet-started. */
  current: number;
  locale?: "en" | "es";
}

export const TwelveStageTracker = ({
  current,
  locale = "en",
}: TwelveStageTrackerProps) => {
  const cur = Math.max(0, Math.min(12, Math.round(current)));
  const activeStage = CUSTOMS_STAGES.find((s) => s.num === cur);

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-copper">
          Customs · 12 stages
        </h4>
        {activeStage && (
          <p className="text-[11px] text-dash-text-secondary">
            Stage {cur} ·{" "}
            <span className="text-dash-text font-medium">
              {activeStage.label[locale]}
            </span>
          </p>
        )}
      </div>

      <div className="flex gap-1">
        {CUSTOMS_STAGES.map((s) => {
          const done = s.num < cur;
          const active = s.num === cur;
          return (
            <div key={s.num} className="flex flex-col items-start gap-1.5 flex-1 min-w-0">
              <div
                className={`h-[3px] w-full rounded ${
                  done
                    ? "bg-dash-success"
                    : active
                    ? "bg-brand-copper"
                    : "bg-dash-border"
                }`}
              />
              <span
                className={`text-[9px] font-mono leading-none ${
                  active ? "text-brand-copper" : "text-dash-text-secondary"
                }`}
              >
                {String(s.num).padStart(2, "0")}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-[11px]">
        {CUSTOMS_STAGES.map((s) => {
          const done = s.num < cur;
          const active = s.num === cur;
          return (
            <div key={s.num} className="flex items-center gap-1.5">
              {done ? (
                <Check className="w-3 h-3 text-dash-success shrink-0" />
              ) : (
                <span
                  className={`font-mono text-[10px] shrink-0 ${
                    active ? "text-brand-copper" : "text-dash-text-secondary"
                  }`}
                >
                  {String(s.num).padStart(2, "0")}
                </span>
              )}
              <span
                className={`truncate ${
                  active
                    ? "text-dash-text font-medium"
                    : done
                    ? "text-dash-text-secondary line-through"
                    : "text-dash-text-secondary"
                }`}
              >
                {s.label[locale]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
