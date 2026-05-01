/**
 * Per-vendor payment terms — drives auto-queueing of vendor payments
 * when a PO is generated. Roger's spec from PR-11:
 *
 *   - "advance"  → due_date = PO date (pay before vendor ships)
 *   - "net_30"   → due_date = PO date + 30 days
 *   - "net_60"   → due_date = PO date + 60 days
 *   - "other"    → no auto-queue; Roger handles it manually
 *
 * Defaults are encoded here; future iteration will move this to a
 * Vendors sheet so non-technical edits don't require a deploy.
 */

export type VendorPaymentTerms = "advance" | "net_30" | "net_60" | "other";

const TERMS_BY_VENDOR_LOWER: Record<string, VendorPaymentTerms> = {
  ferguson: "net_30",
  jcr: "advance",
  "toto usa": "net_30",
  dornbracht: "net_30",
  "california faucets": "net_30",
  rohl: "net_30",
  waterworks: "net_60",
  "newport brass": "net_30",
  "sun valley bronze": "advance",
};

export const getVendorPaymentTerms = (vendor: string): VendorPaymentTerms => {
  const key = (vendor ?? "").trim().toLowerCase();
  return TERMS_BY_VENDOR_LOWER[key] ?? "other";
};

export const getVendorPaymentDueDate = (
  vendor: string,
  poDateIso: string,
): string => {
  const terms = getVendorPaymentTerms(vendor);
  const base = poDateIso ? new Date(poDateIso) : new Date();
  if (!Number.isFinite(base.getTime())) return "";
  if (terms === "advance") return base.toISOString().split("T")[0];
  if (terms === "net_30") {
    const d = new Date(base);
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  }
  if (terms === "net_60") {
    const d = new Date(base);
    d.setDate(d.getDate() + 60);
    return d.toISOString().split("T")[0];
  }
  return "";
};

export const formatVendorTerms = (t: VendorPaymentTerms): string => {
  if (t === "advance") return "Advance";
  if (t === "net_30") return "Net 30";
  if (t === "net_60") return "Net 60";
  return "Other";
};
