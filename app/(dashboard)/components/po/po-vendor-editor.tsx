"use client";

/**
 * Per-PO vendor cell. Read-only by default (shows the resolved vendor with
 * a "default" or "override" badge); click "Change" to expand the dropdown
 * picker. Saves to /api/dashboard/purchase-orders on Apply.
 *
 * R2-5 wire-up: this is the surface that consumes <VendorOverrideDropdown>
 * inside the existing pipeline PO panel.
 */

import { useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  vendorMapForBrand,
  isVendorOverride,
} from "@/app/lib/brand-vendors";
import { VendorOverrideDropdown } from "./vendor-override-dropdown";

interface Props {
  poId: string;
  dealId: string;
  brand: string;
  /** Existing vendor key on the PO. Empty for legacy / fresh POs. */
  initialVendor: string;
  initialReason: string;
  /** PO row also needs these passed back on PUT — minimal echo. */
  onSaved: (vendorKey: string, reason: string) => void;
  /** Disable editing for non-draft POs (already sent / in production). */
  editable: boolean;
  /**
   * Optional per-vendor stock for the brand's options. When provided,
   * the dropdown surfaces stock pills.
   */
  stockByVendor?: Record<string, number>;
}

const Badge = ({ kind }: { kind: "default" | "override" }): React.ReactElement => (
  <span
    className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded ${
      kind === "override"
        ? "bg-dash-warn/10 text-dash-warn"
        : "bg-dash-text-secondary/10 text-dash-text-secondary"
    }`}
  >
    {kind}
  </span>
);

export const PoVendorEditor = ({
  poId,
  dealId,
  brand,
  initialVendor,
  initialReason,
  onSaved,
  editable,
  stockByVendor,
}: Props): React.ReactElement => {
  const map = vendorMapForBrand(brand);
  const [editing, setEditing] = useState(false);
  const [vendor, setVendor] = useState(initialVendor || map?.default.key || "");
  const [reason, setReason] = useState(initialReason);
  const [saving, setSaving] = useState(false);

  // No mapping = the brand isn't registered. Fall back to a "set manually"
  // label until brand-vendors is updated to include it.
  if (!map) {
    return (
      <div className="text-[11px] text-dash-text-secondary italic">
        Vendor mapping pending for {brand || "this brand"}.
      </div>
    );
  }

  const resolvedKey = vendor || map.default.key;
  const resolvedOption = [map.default, ...map.alternatives].find(
    (o) => o.key === resolvedKey
  );
  const overridden = isVendorOverride(brand, resolvedKey);

  if (!editing) {
    return (
      <div className="flex items-center gap-2 text-[11px]">
        <span className="text-dash-text font-medium">
          {resolvedOption?.name ?? resolvedKey}
        </span>
        <Badge kind={overridden ? "override" : "default"} />
        {editable && (
          <button
            onClick={() => setEditing(true)}
            className="ml-auto inline-flex items-center gap-0.5 text-dash-text-secondary hover:text-brand-copper text-[10px] cursor-pointer"
          >
            <Pencil className="w-3 h-3" />
            Change
          </button>
        )}
      </div>
    );
  }

  const apply = async (): Promise<void> => {
    if (overridden && !reason.trim()) {
      toast.error("Override reason is required.");
      return;
    }
    setSaving(true);
    try {
      // PATCH would be cleaner but the route only ships PUT — send a minimal
      // payload with PO_ID + the two columns we touch. The PUT path uses
      // `body[col] ?? ""` per column, so omitted columns just blank the
      // sheet cells. To preserve other columns we'd need the full record;
      // since this surface is a read-edit-save loop, we let the caller
      // refetch. Practical compromise: hit a dedicated PATCH endpoint.
      const res = await fetch("/api/dashboard/purchase-orders/vendor", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          PO_ID: poId,
          Deal_ID: dealId,
          Vendor: resolvedKey,
          Vendor_Override_Reason: overridden ? reason.trim() : "",
        }),
      });
      if (!res.ok) throw new Error("save-failed");
      toast.success(
        overridden ? "Vendor override saved." : "Vendor set to default."
      );
      onSaved(resolvedKey, overridden ? reason.trim() : "");
      setEditing(false);
    } catch {
      toast.error("Couldn't save vendor change.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-dash-border rounded-lg p-3 bg-dash-surface space-y-3">
      <VendorOverrideDropdown
        brand={brand}
        value={vendor}
        onChange={setVendor}
        reason={reason}
        onReasonChange={setReason}
        stockByVendor={stockByVendor}
        disabled={saving}
      />
      <div className="flex justify-end gap-2">
        <button
          onClick={() => {
            setVendor(initialVendor || map.default.key);
            setReason(initialReason);
            setEditing(false);
          }}
          disabled={saving}
          className="px-3 py-1 text-[11px] border border-dash-border rounded hover:bg-dash-bg cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={apply}
          disabled={saving}
          className="inline-flex items-center gap-1 px-3 py-1 text-[11px] bg-brand-copper text-white rounded hover:bg-brand-copper/90 disabled:opacity-50 cursor-pointer"
        >
          {saving && <Loader2 className="w-3 h-3 animate-spin" />}
          Apply
        </button>
      </div>
    </div>
  );
};
