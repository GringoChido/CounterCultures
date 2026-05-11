export interface ShippingRate {
  carrier: "fedex" | "estafeta" | "dhl" | "ups";
  service: "express" | "economy" | "ground" | "next_day";
  amount_mxn: number;
  currency: "MXN";
  days_min: number;
  days_max: number;
  rate_id: string;
}

interface ParcelInput {
  weight_kg: number;
  length_cm: number;
  width_cm: number;
  height_cm: number;
}

interface GetRatesInput {
  fromZip: string;
  toZip: string;
  country: "MX" | "US";
  parcels: ParcelInput[];
}

const SKYDROPX_API_URL = "https://pro.skydropx.com/api/v1/quotations";

const SERVICE_MAP: Record<string, ShippingRate["service"]> = {
  "express_saver": "express",
  "express": "express",
  "international_economy": "economy",
  "economy": "economy",
  "ground": "ground",
  "home_delivery": "ground",
  "next_day": "next_day",
  "standard_overnight": "next_day",
  "priority_overnight": "next_day",
};

const CARRIER_MAP: Record<string, ShippingRate["carrier"]> = {
  fedex: "fedex",
  estafeta: "estafeta",
  dhl: "dhl",
  ups: "ups",
};

function normalizeCarrier(raw: string): ShippingRate["carrier"] | null {
  const lower = raw.toLowerCase();
  for (const [key, val] of Object.entries(CARRIER_MAP)) {
    if (lower.includes(key)) return val;
  }
  return null;
}

function normalizeService(raw: string): ShippingRate["service"] {
  const lower = raw.toLowerCase().replace(/[\s-]+/g, "_");
  for (const [key, val] of Object.entries(SERVICE_MAP)) {
    if (lower.includes(key)) return val;
  }
  return "ground";
}

export async function getRates(input: GetRatesInput): Promise<ShippingRate[]> {
  const apiKey = process.env.SKYDROPX_API_KEY;
  if (!apiKey) return [];

  const originZip = input.fromZip || process.env.SHIPPING_ORIGIN_ZIP || "37700";

  const body = {
    zip_from: originZip,
    zip_to: input.toZip,
    parcel: {
      weight: input.parcels.reduce((sum, p) => sum + p.weight_kg, 0),
      length: Math.max(...input.parcels.map((p) => p.length_cm)),
      width: Math.max(...input.parcels.map((p) => p.width_cm)),
      height: input.parcels.reduce((sum, p) => sum + p.height_cm, 0),
    },
  };

  try {
    const res = await fetch(SKYDROPX_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Token token=${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) return [];

    const data = await res.json();
    const included = data?.included as Array<Record<string, unknown>> | undefined;
    if (!Array.isArray(included)) return [];

    const allRates: ShippingRate[] = [];

    for (const item of included) {
      if (item.type !== "rates") continue;
      const attrs = item.attributes as Record<string, unknown> | undefined;
      if (!attrs) continue;

      const providerName = String(attrs.provider ?? "");
      const carrier = normalizeCarrier(providerName);
      if (!carrier) continue;

      const serviceName = String(attrs.service_level_name ?? attrs.service_name ?? "");
      const service = normalizeService(serviceName);
      const amount = Number(attrs.total_pricing ?? attrs.amount_local ?? 0);
      const daysMin = Number(attrs.days ?? attrs.min_delivery_days ?? 3);
      const daysMax = Number(attrs.out_of_area_pricing ? daysMin + 2 : attrs.max_delivery_days ?? daysMin + 1);

      allRates.push({
        carrier,
        service,
        amount_mxn: Math.round(amount * 100) / 100,
        currency: "MXN",
        days_min: daysMin,
        days_max: daysMax,
        rate_id: String(item.id ?? `${carrier}-${service}-${Date.now()}`),
      });
    }

    // Prefer FedEx; fall back to others only if FedEx returns nothing
    const fedexRates = allRates.filter((r) => r.carrier === "fedex");
    const ratesToReturn = fedexRates.length > 0 ? fedexRates : allRates;

    return ratesToReturn.sort((a, b) => a.amount_mxn - b.amount_mxn);
  } catch {
    return [];
  }
}
