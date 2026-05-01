/**
 * Skydropx outbound shipping integration for Counter Cultures.
 *
 * Skydropx is the carrier-aggregator Roger uses for anything that needs
 * to be shipped (Mexico-domestic and inbound from US consolidators).
 * The portal calls Skydropx on confirm-shipment to:
 *   1. Generate a shipping label
 *   2. Get a tracking number + tracking URL
 *   3. Pull the label PDF so we can drop it into the deal's Drive folder
 *
 * The API expects a Bearer token (SKYDROPX_API_KEY). When the key is
 * absent (local dev, fresh deploys) we return a clearly-labelled mock
 * response so the rest of the flow is exercisable end-to-end without a
 * live carrier account.
 *
 * NOTE: Skydropx's real shape may need tweaking — this is the v1 contour
 * shared in their public docs. Real account flow:
 *   - POST /quotations  → list of rate quotes
 *   - POST /shipments   → buy a label using a quote ID
 *   - GET  /labels/:id  → download the label PDF
 * For PR-9 we collapse those to a single createShipment() call so the
 * UI doesn't need to walk the rate-shopping flow on first integration.
 */

export interface SkydropxAddress {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  email?: string;
}

export interface SkydropxParcel {
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  contents: string;
  declaredValueMxn?: number;
}

export interface SkydropxShipmentRequest {
  from: SkydropxAddress;
  to: SkydropxAddress;
  parcel: SkydropxParcel;
  /** Reference Roger sees on the manifest. We pass the deal id + PO id. */
  reference: string;
}

export interface SkydropxShipmentResult {
  /** Always present. "dry-run" means SKYDROPX_API_KEY was unset. */
  mode: "dry-run" | "live";
  trackingNumber: string;
  trackingUrl: string;
  carrier: string;
  /** Label PDF as a Buffer. Empty buffer in dry-run mode. */
  labelPdf: Buffer;
  /** Quote total in MXN — surfaced so Roger can verify before settling. */
  rateMxn: number;
  /** Human-readable warnings — e.g. "fallback to ground service". */
  warnings: string[];
}

const API_BASE = process.env.SKYDROPX_API_BASE || "https://pro.skydropx.com/api/v1";

const dryRunResult = (req: SkydropxShipmentRequest): SkydropxShipmentResult => ({
  mode: "dry-run",
  trackingNumber: `SDX-MX-DRY-${Date.now().toString(36).slice(-7).toUpperCase()}`,
  trackingUrl: "https://tracking.skydropx.com/dry-run",
  carrier: "DHL (mock)",
  labelPdf: Buffer.from(""),
  rateMxn: 0,
  warnings: [
    "SKYDROPX_API_KEY not set — returning a dry-run shipment. No label was actually generated.",
    `Would have shipped from ${req.from.city} to ${req.to.city} (${req.parcel.weightKg} kg).`,
  ],
});

/**
 * Create a shipment via Skydropx and return the tracking + label.
 * The function never throws on missing credentials — it falls back to
 * the dry-run path so callers can write their flow once.
 */
export const createShipment = async (
  req: SkydropxShipmentRequest,
): Promise<SkydropxShipmentResult> => {
  const apiKey = process.env.SKYDROPX_API_KEY;
  if (!apiKey) return dryRunResult(req);

  const warnings: string[] = [];

  // Step 1 — request rate quotations. Skydropx returns a list and we pick
  // the cheapest by default. Roger can override by setting
  // SKYDROPX_PREFERRED_CARRIER (e.g. "DHL").
  const quoteRes = await fetch(`${API_BASE}/quotations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      address_from: skydropxAddr(req.from),
      address_to: skydropxAddr(req.to),
      parcels: [skydropxParcel(req.parcel)],
    }),
  });
  if (!quoteRes.ok) {
    const t = await quoteRes.text();
    throw new Error(`Skydropx quotations failed (${quoteRes.status}): ${t}`);
  }
  const quoteJson = (await quoteRes.json()) as {
    rates?: Array<{
      id: string;
      provider: string;
      service_level: string;
      total: string | number;
    }>;
  };
  const rates = quoteJson.rates ?? [];
  if (rates.length === 0) {
    throw new Error("Skydropx returned no rates for this shipment");
  }
  const preferred = process.env.SKYDROPX_PREFERRED_CARRIER;
  const chosen =
    (preferred &&
      rates.find((r) => r.provider.toLowerCase() === preferred.toLowerCase())) ||
    rates.reduce((a, b) =>
      Number(a.total) <= Number(b.total) ? a : b,
    );
  if (preferred && chosen.provider.toLowerCase() !== preferred.toLowerCase()) {
    warnings.push(
      `Preferred carrier ${preferred} unavailable — used ${chosen.provider}.`,
    );
  }

  // Step 2 — buy the label using the chosen rate id.
  const buyRes = await fetch(`${API_BASE}/shipments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      rate_id: chosen.id,
      reference: req.reference,
    }),
  });
  if (!buyRes.ok) {
    const t = await buyRes.text();
    throw new Error(`Skydropx shipment purchase failed (${buyRes.status}): ${t}`);
  }
  const buyJson = (await buyRes.json()) as {
    tracking_number: string;
    tracking_url_provider?: string;
    label_url?: string;
  };

  // Step 3 — download the label PDF as a buffer.
  let labelPdf = Buffer.from("");
  if (buyJson.label_url) {
    const labelRes = await fetch(buyJson.label_url);
    if (labelRes.ok) {
      const ab = await labelRes.arrayBuffer();
      labelPdf = Buffer.from(ab);
    } else {
      warnings.push(
        `Label PDF download failed (${labelRes.status}); tracking number is still valid.`,
      );
    }
  } else {
    warnings.push("Skydropx shipment created but no label_url returned.");
  }

  return {
    mode: "live",
    trackingNumber: buyJson.tracking_number,
    trackingUrl:
      buyJson.tracking_url_provider ||
      `https://tracking.skydropx.com/?tracking_number=${buyJson.tracking_number}`,
    carrier: chosen.provider,
    labelPdf,
    rateMxn: Number(chosen.total) || 0,
    warnings,
  };
};

const skydropxAddr = (a: SkydropxAddress) => ({
  name: a.name,
  street1: a.street1,
  street2: a.street2 ?? "",
  city: a.city,
  state: a.state,
  postal_code: a.postalCode,
  country: a.country,
  phone: a.phone ?? "",
  email: a.email ?? "",
});

const skydropxParcel = (p: SkydropxParcel) => ({
  weight: p.weightKg,
  length: p.lengthCm,
  width: p.widthCm,
  height: p.heightCm,
  content_description: p.contents,
  declared_value: p.declaredValueMxn ?? 0,
});
