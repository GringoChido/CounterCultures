"use client";

/**
 * 3-way reconciliation panel (R4 Note 6 — sub-gap 6c).
 *
 *   vendor invoice subtotals  →  cálculo (broker estimate)  →  factura (broker actual)
 *
 * Roger sees the three totals side by side, plus the deltas. When the
 * broker's factura arrives he punches the amount in (and optionally
 * the Drive doc id) and saves; the API computes variance + sets
 * status to factura-received. The variance level (pass / warning /
 * error) is derived from the percentage gap vs. cálculo.
 *
 * Pre-PR Roger had to eyeball this in the sheet. Post-PR it's one
 * panel on the shipment detail.
 */

import { useState } from "react";
import { Loader2, FileText, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { Trafico } from "@/app/lib/customs-data";

const fmtMxn = (n: number | undefined) =>
  n === undefined || n === null
    ? "—"
    : `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })} MXN`;

const fmtUsd = (n: number | undefined) =>
  n === undefined || n === null
    ? "—"
    : `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })} USD`;

interface ReconciliationPanelProps {
  trafico: Trafico;
  onSaved?: () => void;
}

const computeVarianceLevel = (
  facturaAmount: number,
  calculoTotal: number
): "pass" | "warning" | "error" => {
  const pct = calculoTotal > 0 ? Math.abs(facturaAmount - calculoTotal) / calculoTotal : 0;
  if (pct > 0.05) return "error";
  if (pct > 0.01) return "warning";
  return "pass";
};

const LEVEL_META: Record<
  "pass" | "warning" | "error",
  { Icon: typeof CheckCircle2; tone: string; label: string }
> = {
  pass: {
    Icon: CheckCircle2,
    tone: "text-brand-sage bg-brand-sage/10 border-brand-sage/30",
    label: "Within tolerance (≤1%)",
  },
  warning: {
    Icon: AlertTriangle,
    tone: "text-dash-warn bg-dash-warn-soft border-dash-warn/40",
    label: "Investigate (1–5%)",
  },
  error: {
    Icon: AlertCircle,
    tone: "text-dash-danger bg-dash-danger/10 border-dash-danger/30",
    label: "Significant variance (>5%)",
  },
};

export const ReconciliationPanel = ({ trafico, onSaved }: ReconciliationPanelProps) => {
  const vendorSubtotalUSD = trafico.items.reduce(
    (sum, it) => sum + (it.invoiceTotal ?? 0),
    0
  );
  const calculoTotal = trafico.calculoTotal ?? 0;
  const facturaAmount = trafico.facturaAmount;
  const facturaDifference = trafico.facturaDifference;
  const persistedLevel =
    facturaAmount && calculoTotal > 0
      ? computeVarianceLevel(facturaAmount, calculoTotal)
      : null;

  const [editing, setEditing] = useState(facturaAmount === undefined);
  const [draftAmount, setDraftAmount] = useState<string>(
    facturaAmount !== undefined ? String(facturaAmount) : ""
  );
  const [draftDocId, setDraftDocId] = useState<string>(
    trafico.documents?.brokerFacturaId ?? ""
  );
  const [saving, setSaving] = useState(false);

  const previewAmount = parseFloat(draftAmount);
  const previewLevel =
    Number.isFinite(previewAmount) && previewAmount > 0 && calculoTotal > 0
      ? computeVarianceLevel(previewAmount, calculoTotal)
      : null;

  const save = async () => {
    if (!Number.isFinite(previewAmount) || previewAmount <= 0) {
      toast.error("Enter a positive factura amount.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(
        `/api/dashboard/traficos/${encodeURIComponent(trafico.id)}/factura`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            facturaAmount: previewAmount,
            facturaDocId: draftDocId.trim() || undefined,
          }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? `HTTP ${res.status}`);
        return;
      }
      toast.success(
        `Variance ${data.variance >= 0 ? "+" : ""}${(data.variance as number).toFixed(2)} MXN (${data.level})`
      );
      setEditing(false);
      onSaved?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-dash-surface border border-dash-border rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-dash-text-secondary flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Reconciliation
        </h3>
        {!editing && facturaAmount !== undefined && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-[11px] text-brand-copper hover:underline"
          >
            Edit factura
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-dash-bg/40 border border-dash-border rounded p-3">
          <div className="text-[10px] uppercase tracking-wider text-dash-text-secondary">
            Vendor invoices ({trafico.items.length})
          </div>
          <div className="text-sm font-medium text-dash-text mt-1">
            {fmtUsd(vendorSubtotalUSD)}
          </div>
          <div className="text-[10.5px] text-dash-text-secondary/80 mt-0.5">
            sum of item invoice totals
          </div>
        </div>

        <div className="bg-dash-bg/40 border border-dash-border rounded p-3">
          <div className="text-[10px] uppercase tracking-wider text-dash-text-secondary">
            Cálculo (broker estimate)
          </div>
          <div className="text-sm font-medium text-dash-text mt-1">
            {fmtMxn(calculoTotal || undefined)}
          </div>
          <div className="text-[10.5px] text-dash-text-secondary/80 mt-0.5">
            pre-import tax estimate
          </div>
        </div>

        <div
          className={`border rounded p-3 ${
            persistedLevel ? LEVEL_META[persistedLevel].tone : "bg-dash-bg/40 border-dash-border"
          }`}
        >
          <div className="text-[10px] uppercase tracking-wider opacity-80">
            Factura (broker actual)
          </div>
          <div className="text-sm font-medium mt-1">
            {fmtMxn(facturaAmount)}
          </div>
          {facturaAmount !== undefined && facturaDifference !== undefined && (
            <div className="text-[10.5px] mt-0.5">
              Δ {facturaDifference >= 0 ? "+" : ""}
              {facturaDifference.toFixed(2)} MXN
            </div>
          )}
        </div>
      </div>

      {persistedLevel && !editing && (
        <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded border ${LEVEL_META[persistedLevel].tone}`}>
          {(() => {
            const { Icon, label } = LEVEL_META[persistedLevel];
            return (
              <>
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
              </>
            );
          })()}
        </div>
      )}

      {editing && (
        <div className="border-t border-dash-border pt-3 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-dash-text-secondary mb-1 block">
                Factura amount (MXN)
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                value={draftAmount}
                onChange={(e) => setDraftAmount(e.target.value)}
                placeholder="0.00"
                className="w-full text-sm font-mono px-2 py-1.5 rounded border border-dash-border bg-dash-bg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-dash-text-secondary mb-1 block">
                Drive file ID (optional)
              </label>
              <input
                type="text"
                value={draftDocId}
                onChange={(e) => setDraftDocId(e.target.value)}
                placeholder="paste from Drive URL"
                className="w-full text-xs font-mono px-2 py-1.5 rounded border border-dash-border bg-dash-bg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper"
              />
            </div>
          </div>

          {previewLevel && (
            <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded border ${LEVEL_META[previewLevel].tone}`}>
              {(() => {
                const { Icon, label } = LEVEL_META[previewLevel];
                const delta = previewAmount - calculoTotal;
                return (
                  <>
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>
                      Preview: Δ {delta >= 0 ? "+" : ""}
                      {delta.toFixed(2)} MXN — {label}
                    </span>
                  </>
                );
              })()}
            </div>
          )}

          <div className="flex justify-end gap-2">
            {facturaAmount !== undefined && (
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setDraftAmount(String(facturaAmount));
                }}
                disabled={saving}
                className="text-xs px-3 py-1.5 rounded border border-dash-border text-dash-text-secondary hover:text-dash-text"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-brand-copper text-white hover:bg-brand-copper/90 disabled:opacity-50"
            >
              {saving && <Loader2 className="w-3 h-3 animate-spin" />}
              Save factura
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
