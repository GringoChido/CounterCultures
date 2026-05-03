"use client";

/**
 * Per-item + per-deal landed cost allocation panel.
 *
 * R4 Note 6 — sub-gap 6d. Once a tráfico has a totalImportCost set
 * (cálculo + truck-crossing fee + factura adjustments), each item
 * inherits a fair share weighted by its vendor invoice total, and
 * each linked deal sees a roll-up of "what these goods actually
 * cost landed."
 *
 * Sits below the reconciliation panel since it depends on the same
 * cost numbers.
 */

import { Calculator } from "lucide-react";
import Link from "next/link";
import type { Trafico } from "@/app/lib/customs-data";
import {
  allocateLandedCost,
  rollupByDeal,
} from "@/app/lib/landed-cost-allocation";

const fmtMxn = (n: number) =>
  `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })} MXN`;
const fmtUsd = (n: number) =>
  `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })} USD`;

interface LandedCostAllocationPanelProps {
  trafico: Trafico;
}

export const LandedCostAllocationPanel = ({
  trafico,
}: LandedCostAllocationPanelProps) => {
  const totalImportCost = trafico.totalImportCost ?? trafico.calculoTotal ?? 0;

  if (totalImportCost === 0 || (trafico.items ?? []).length === 0) {
    return (
      <div className="bg-dash-surface border border-dash-border rounded-xl p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-dash-text-secondary flex items-center gap-2 mb-2">
          <Calculator className="w-4 h-4" />
          Landed cost allocation
        </h3>
        <p className="text-xs text-dash-text-secondary">
          Allocation populates once a cálculo or factura is recorded for this tráfico.
        </p>
      </div>
    );
  }

  const allocations = allocateLandedCost(trafico);
  const dealRollups = rollupByDeal(trafico);

  return (
    <div className="bg-dash-surface border border-dash-border rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-dash-text-secondary flex items-center gap-2">
          <Calculator className="w-4 h-4" />
          Landed cost allocation
        </h3>
        <span className="text-[11px] text-dash-text-secondary">
          Total import cost: {fmtMxn(totalImportCost)}
        </span>
      </div>

      <div>
        <p className="text-[10.5px] uppercase tracking-wider text-dash-text-secondary mb-1.5">
          Per item · weighted by invoice total
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-[10px] uppercase tracking-wider text-dash-text-secondary border-b border-dash-border">
              <tr>
                <th className="text-left py-1.5 pr-3">Vendor</th>
                <th className="text-right py-1.5 pr-3">Invoice (USD)</th>
                <th className="text-right py-1.5 pr-3">% of trip</th>
                <th className="text-right py-1.5 pr-3">+ Allocated import (MXN)</th>
                <th className="text-right py-1.5 pr-3">= Landed (MXN)</th>
                <th className="text-right py-1.5">/ unit</th>
              </tr>
            </thead>
            <tbody>
              {allocations.map((a) => (
                <tr key={a.itemId} className="border-b border-dash-border/50 last:border-0">
                  <td className="py-1.5 pr-3 text-dash-text">{a.vendorName}</td>
                  <td className="py-1.5 pr-3 text-right font-mono">{fmtUsd(a.invoiceTotal)}</td>
                  <td className="py-1.5 pr-3 text-right text-dash-text-secondary">
                    {a.allocationPercent.toFixed(1)}%
                  </td>
                  <td className="py-1.5 pr-3 text-right font-mono">{fmtMxn(a.allocatedImportCost)}</td>
                  <td className="py-1.5 pr-3 text-right font-mono font-medium text-dash-text">
                    {fmtMxn(a.totalLandedCost)}
                  </td>
                  <td className="py-1.5 text-right font-mono text-dash-text-secondary">
                    {a.totalQty > 0 ? fmtMxn(a.perUnitLanded) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {dealRollups.length > 0 && (
        <div>
          <p className="text-[10.5px] uppercase tracking-wider text-dash-text-secondary mb-1.5">
            Per deal roll-up
          </p>
          <div className="space-y-1.5">
            {dealRollups.map((d) => (
              <div
                key={d.dealId}
                className="flex items-center justify-between bg-dash-bg/40 border border-dash-border rounded px-3 py-2 text-xs"
              >
                <Link
                  href={`/dashboard/pipeline/deals/${encodeURIComponent(d.dealId)}`}
                  className="font-mono text-brand-copper hover:underline"
                >
                  {d.dealId}
                </Link>
                <span className="text-dash-text-secondary">
                  {d.itemCount} item{d.itemCount === 1 ? "" : "s"}
                </span>
                <span className="font-mono text-dash-text">
                  {fmtUsd(d.invoiceSubtotal)} + {fmtMxn(d.allocatedImportCost)}
                </span>
                <span className="font-mono font-medium text-dash-text">
                  = {fmtMxn(d.totalLandedCost)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-[10.5px] text-dash-text-secondary/80 leading-snug">
        Allocation is invoice-total-weighted. Per-unit landed cost = (vendor invoice + allocated import cost) ÷ total quantity. Use this to confirm margin on deal line items vs. quoted price.
      </p>
    </div>
  );
};
