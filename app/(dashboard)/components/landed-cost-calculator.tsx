"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertTriangle, Calculator } from "lucide-react";
import type { LandedCostInput, LandedCostOutput } from "@/app/lib/landed-cost";
import type { Brand } from "@/app/lib/brand-kit-types";

type Variant = "preview" | "full";

interface Props {
  variant: Variant;
  defaultValues?: Partial<LandedCostInput>;
  onQuote?: (output: LandedCostOutput) => void;
}

const formatMxn = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })} MXN`;

const RISK_PILL: Record<LandedCostOutput["riskFlag"], { label: string; bg: string; text: string }> = {
  green:  { label: "Low risk",  bg: "bg-green-500/10",  text: "text-green-400" },
  yellow: { label: "Estimate — unverified", bg: "bg-amber-500/10", text: "text-amber-400" },
  red:    { label: "High risk", bg: "bg-red-500/10", text: "text-red-400" },
};

export const LandedCostCalculator = ({ variant, defaultValues, onQuote }: Props) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandId, setBrandId] = useState(defaultValues?.brandId ?? "");
  const [shopifyProductId, setShopifyProductId] = useState(defaultValues?.shopifyProductId ?? "");
  const [fobPriceUsd, setFobPriceUsd] = useState<string>(
    defaultValues?.fobPriceUsd?.toString() ?? ""
  );
  const [quantity, setQuantity] = useState<string>(
    defaultValues?.quantity?.toString() ?? "1"
  );
  const [hsCode, setHsCode] = useState(defaultValues?.hsCode ?? "");
  const [destinationType, setDestinationType] = useState<LandedCostInput["destinationType"]>(
    defaultValues?.destinationType ?? "warehouse_sma"
  );
  const [destinationCity, setDestinationCity] = useState(defaultValues?.destinationCity ?? "");
  const [fxRateUsdToMxn, setFxRateUsdToMxn] = useState<string>(
    defaultValues?.fxRateUsdToMxn?.toString() ?? "20"
  );

  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<LandedCostOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/brands", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { brands: [] }))
      .then((d) => setBrands((d.brands as Brand[]) ?? []))
      .catch(() => setBrands([]));
  }, []);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      const body: LandedCostInput = {
        brandId,
        shopifyProductId: shopifyProductId || "—",
        fobPriceUsd: parseFloat(fobPriceUsd) || 0,
        quantity: parseInt(quantity, 10) || 1,
        hsCode: hsCode || undefined,
        destinationType,
        destinationCity: destinationCity || undefined,
        fxRateUsdToMxn: fxRateUsdToMxn ? parseFloat(fxRateUsdToMxn) : undefined,
        quoteDate: new Date(),
      };
      const r = await fetch("/api/dashboard/landed-cost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || `HTTP ${r.status}`);
      }
      const d = (await r.json()) as LandedCostOutput;
      setOutput(d);
      onQuote?.(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to compute");
    } finally {
      setLoading(false);
    }
  };

  const compact = variant === "preview";
  const inputCls =
    "w-full px-3 py-1.5 bg-dash-bg border border-dash-border rounded-md text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper";
  const labelCls = "block text-[11px] font-medium text-dash-text-secondary uppercase tracking-wider mb-1";

  return (
    <div className={compact ? "space-y-3" : "space-y-5"}>
      {/* Form */}
      <div className={`grid gap-3 ${compact ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3"}`}>
        <div className={compact ? "col-span-2" : ""}>
          <label className={labelCls}>Brand</label>
          <select
            value={brandId}
            onChange={(e) => setBrandId(e.target.value)}
            className={inputCls}
          >
            <option value="">— Select brand —</option>
            {brands.map((b) => (
              <option key={b.slug} value={b.slug}>
                {b.name} ({b.originCountryName || b.originCountry || "—"})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>FOB price (USD/unit)</label>
          <input
            type="number"
            step="0.01"
            value={fobPriceUsd}
            onChange={(e) => setFobPriceUsd(e.target.value)}
            className={inputCls}
            placeholder="812"
          />
        </div>
        <div>
          <label className={labelCls}>Quantity</label>
          <input
            type="number"
            step="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className={inputCls}
          />
        </div>
        {!compact && (
          <>
            <div>
              <label className={labelCls}>HS code (optional)</label>
              <input
                type="text"
                value={hsCode}
                onChange={(e) => setHsCode(e.target.value)}
                className={inputCls}
                placeholder="7324.90.01"
              />
            </div>
            <div>
              <label className={labelCls}>Destination</label>
              <select
                value={destinationType}
                onChange={(e) =>
                  setDestinationType(e.target.value as LandedCostInput["destinationType"])
                }
                className={inputCls}
              >
                <option value="warehouse_sma">CC warehouse (SMA)</option>
                <option value="client_jobsite">Client jobsite</option>
              </select>
            </div>
            {destinationType === "client_jobsite" && (
              <div>
                <label className={labelCls}>Destination state</label>
                <input
                  type="text"
                  value={destinationCity}
                  onChange={(e) => setDestinationCity(e.target.value)}
                  className={inputCls}
                  placeholder="Querétaro"
                />
              </div>
            )}
            <div>
              <label className={labelCls}>FX rate (MXN/USD)</label>
              <input
                type="number"
                step="0.01"
                value={fxRateUsdToMxn}
                onChange={(e) => setFxRateUsdToMxn(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>SKU (optional)</label>
              <input
                type="text"
                value={shopifyProductId}
                onChange={(e) => setShopifyProductId(e.target.value)}
                className={inputCls}
                placeholder="K-2215-0"
              />
            </div>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={loading || !brandId || !fobPriceUsd}
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-copper text-white text-sm rounded-md hover:bg-brand-copper/90 disabled:opacity-50 transition-colors cursor-pointer"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
        {loading ? "Computing…" : "Compute landed cost"}
      </button>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-md p-2.5">
          {error}
        </div>
      )}

      {/* Results */}
      {output && (
        <div className="space-y-3">
          {/* Risk + warnings banner */}
          <div
            className={`flex items-start gap-2 rounded-md p-2.5 ${RISK_PILL[output.riskFlag].bg}`}
          >
            <AlertTriangle className={`w-4 h-4 mt-0.5 ${RISK_PILL[output.riskFlag].text}`} />
            <div className={`text-xs ${RISK_PILL[output.riskFlag].text}`}>
              <p className="font-medium">{RISK_PILL[output.riskFlag].label}</p>
              {output.warnings.length > 0 && (
                <ul className="mt-1 space-y-0.5 list-disc list-inside">
                  {output.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Headline */}
          <div className="bg-dash-bg rounded-md p-3 space-y-1">
            <p className={labelCls}>Landed cost</p>
            <p className="text-2xl font-bold text-dash-text">{formatMxn(output.landedCostMxn)}</p>
            <p className="text-[11px] text-dash-text-secondary">
              Suggested quote (with {((output.markupSuggestedMxn / output.landedCostMxn) * 100).toFixed(0)}% markup):{" "}
              <span className="text-brand-copper font-medium">{formatMxn(output.quotePriceMxn)}</span>
            </p>
            <p className="text-[11px] text-dash-text-secondary">
              ETA: {output.leadTimeDays.total}d ({output.leadTimeDays.production}d production +{" "}
              {output.leadTimeDays.internationalTransit}d intl + {output.leadTimeDays.customs}d customs +{" "}
              {output.leadTimeDays.domestic}d domestic)
            </p>
          </div>

          {/* Breakdown */}
          {!compact && (
            <div className="bg-dash-bg rounded-md p-3 space-y-1.5 text-[12px]">
              <p className={labelCls}>Breakdown</p>
              <Row label={`FOB (${output.fobUsd.toLocaleString()} USD × FX)`} value={formatMxn(output.fobMxn)} />
              <Row label="Freight estimate (15% of FOB)" value={formatMxn(output.freightEstimateMxn)} />
              <Row label="CIF" value={formatMxn(output.cifMxn)} bold />
              <Row label={`Duty (${output.dutyRateBasis})`} value={formatMxn(output.dutyMxn)} />
              {output.iepsMxn > 0 && <Row label="IEPS" value={formatMxn(output.iepsMxn)} />}
              <Row label="IVA (16%)" value={formatMxn(output.ivaMxn)} />
              <Row label="Broker fee" value={formatMxn(output.brokerFeeMxn)} />
              <Row label="Pedimento fee" value={formatMxn(output.pedimentoFeeMxn)} />
              <Row label="Domestic freight" value={formatMxn(output.domesticFreightMxn)} />
              <div className="border-t border-dash-border pt-1.5">
                <Row label="Landed cost" value={formatMxn(output.landedCostMxn)} bold />
              </div>
            </div>
          )}

          {/* NOM */}
          {output.nomCompliance.applicableNoms.length > 0 && (
            <div className="bg-dash-bg rounded-md p-3 text-[11px] space-y-1">
              <p className={labelCls}>NOM compliance</p>
              <p className="text-dash-text">
                Status: <span className="font-medium">{output.nomCompliance.status}</span>
                {output.nomCompliance.delayRiskDays > 0 && (
                  <> · Delay risk: {output.nomCompliance.delayRiskDays} days</>
                )}
              </p>
              <p className="text-dash-text-secondary">
                Applicable NOMs: {output.nomCompliance.applicableNoms.join(", ")}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Row = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <div className="flex items-center justify-between">
    <span className={bold ? "text-dash-text font-medium" : "text-dash-text-secondary"}>{label}</span>
    <span className={bold ? "text-dash-text font-semibold" : "text-dash-text"}>{value}</span>
  </div>
);
