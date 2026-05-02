"use client";

/**
 * <VendorOverrideDropdown> — picker for which vendor a PO line item
 * routes through. Defaults to the brand's mapped vendor (BRAND_VENDORS
 * in app/lib/brand-vendors.ts). When Roger overrides the default, the
 * dropdown surfaces a reason textarea so the override is auditable.
 *
 * Decision context shown per option:
 *   · vendor name + "default" / alt label
 *   · lead time (days)
 *   · import-ease score (1–5)
 *   · vendor note (terms, gotchas)
 *   · stock pill (rendered when `stockByVendor[key]` is provided)
 *
 * R2-5.
 */

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Check, AlertTriangle } from "lucide-react";
import {
  vendorOptionsForBrand,
  vendorMapForBrand,
  isVendorOverride,
  type VendorOption,
} from "@/app/lib/brand-vendors";

interface Props {
  brand: string;
  /** Selected vendor key — undefined / "" means use the brand default. */
  value: string;
  onChange: (vendorKey: string) => void;
  /** Required when value !== brand default. */
  reason: string;
  onReasonChange: (reason: string) => void;
  /**
   * Optional per-vendor stock count pulled from /api/dashboard/inventory.
   * When omitted, the stock pill is hidden (not "0 on hand" — that would
   * misrepresent missing data as zero).
   */
  stockByVendor?: Record<string, number>;
  disabled?: boolean;
}

const easeBar = (n: 1 | 2 | 3 | 4 | 5): string =>
  "▓".repeat(n) + "░".repeat(5 - n);

export const VendorOverrideDropdown = ({
  brand,
  value,
  onChange,
  reason,
  onReasonChange,
  stockByVendor,
  disabled,
}: Props): React.ReactElement => {
  const options = useMemo(() => vendorOptionsForBrand(brand), [brand]);
  const map = useMemo(() => vendorMapForBrand(brand), [brand]);
  const [open, setOpen] = useState(false);

  const effectiveKey = value || map?.default.key || "";
  const overridden = isVendorOverride(brand, effectiveKey);
  const selected: VendorOption | undefined = options.find(
    (o) => o.key === effectiveKey
  );

  // Close the dropdown if disabled / no options
  useEffect(() => {
    if (disabled || options.length === 0) setOpen(false);
  }, [disabled, options.length]);

  if (options.length === 0) {
    return (
      <div className="text-xs text-dash-text-secondary italic">
        No vendor mapping for {brand || "this brand"} — set vendor manually.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div>
        <label className="block text-[10px] font-medium uppercase tracking-wider text-dash-text-secondary mb-1.5">
          Vendor
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((p) => !p)}
            disabled={disabled}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg hover:border-brand-copper/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <span className="flex items-baseline gap-2">
              <span className="text-dash-text font-medium">
                {selected?.name ?? "—"}
              </span>
              {overridden && (
                <span className="text-[9.5px] uppercase tracking-wider text-dash-warn">
                  override
                </span>
              )}
              {!overridden && map && selected?.key === map.default.key && (
                <span className="text-[9.5px] uppercase tracking-wider text-dash-text-secondary/80">
                  default
                </span>
              )}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-dash-text-secondary transition-transform ${
                open ? "rotate-180" : ""
              }`}
            />
          </button>
          {open && (
            <div className="absolute z-20 mt-1 w-full bg-dash-surface border border-dash-border rounded-lg shadow-lg overflow-hidden">
              {options.map((o) => {
                const isDefault = map?.default.key === o.key;
                const stock = stockByVendor?.[o.key];
                const isPicked = effectiveKey === o.key;
                return (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => {
                      onChange(o.key);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 text-xs hover:bg-dash-bg transition-colors cursor-pointer ${
                      isPicked ? "bg-brand-copper/5" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5">
                        {isPicked && <Check className="w-3 h-3 text-brand-copper" />}
                        <span className="text-dash-text font-medium">{o.name}</span>
                        {isDefault && (
                          <span className="text-[9px] uppercase tracking-wider text-dash-text-secondary/80">
                            default
                          </span>
                        )}
                      </span>
                      {typeof stock === "number" && (
                        <span
                          className={`text-[9.5px] uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            stock > 0
                              ? "bg-dash-success/10 text-dash-success"
                              : "bg-dash-warn/10 text-dash-warn"
                          }`}
                        >
                          {stock} on hand
                        </span>
                      )}
                    </div>
                    <div className="mt-1 grid grid-cols-2 gap-3 text-[10.5px] text-dash-text-secondary">
                      <span>Lead: {o.leadTimeDays}d</span>
                      <span className="font-mono">
                        Import: <span className="text-brand-copper">{easeBar(o.importEase)}</span>
                      </span>
                    </div>
                    {o.note && (
                      <div className="mt-1 text-[10px] text-dash-text-secondary/80 italic">
                        {o.note}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {overridden && (
        <div className="border border-dash-warn/30 bg-dash-warn/5 rounded-lg p-3">
          <label className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-dash-warn mb-1.5">
            <AlertTriangle className="w-3 h-3" />
            Override reason <span className="text-dash-danger">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            disabled={disabled}
            rows={2}
            placeholder="Why this vendor instead of the default? e.g. JCR has stock, faster lead time…"
            className="w-full text-xs bg-dash-bg border border-dash-border rounded-md px-2 py-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 resize-none"
          />
          <p className="mt-1 text-[10px] text-dash-text-secondary/80">
            Saved on the PO so this routing decision is auditable later.
          </p>
        </div>
      )}
    </div>
  );
};
