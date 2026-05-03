/**
 * Delivery method variants (R4 Note 7).
 *
 * Roger: "other ways to receive: drop-ship from copper/brass supplier,
 * Mexican suppliers, broker direct from Nuevo Laredo. Could cross a
 * Badeloft bathtub and ship direct to Manzanillo — Counter Cultures
 * never touches it."
 *
 * The default historically was "everything goes through CC warehouse in
 * SMA." That's still the most common path, but it's no longer the only
 * path — these four variants capture every shape Roger described.
 */

export type DeliveryMethod =
  | "standard"
  | "dropship"
  | "mexican-supplier"
  | "broker-direct";

export interface DeliveryMethodMeta {
  label: string;
  shortLabel: string;
  hint: string;
  /** Does CC physically receive these goods at the SMA warehouse? */
  ccReceives: boolean;
  /** Does this shipment cross a customs border (USMCA / pedimento territory)? */
  crossesCustoms: boolean;
}

export const DELIVERY_METHOD_META: Record<DeliveryMethod, DeliveryMethodMeta> = {
  standard: {
    label: "Standard import",
    shortLabel: "Standard",
    hint: "Vendor → CC warehouse in SMA → customer. Crosses customs (tráfico).",
    ccReceives: true,
    crossesCustoms: true,
  },
  dropship: {
    label: "Drop-ship to customer",
    shortLabel: "Drop-ship",
    hint: "Vendor ships direct to the customer. Counter Cultures never touches the goods.",
    ccReceives: false,
    crossesCustoms: false,
  },
  "mexican-supplier": {
    label: "Mexican supplier",
    shortLabel: "MX supplier",
    hint: "Domestic vendor — no border crossing. Can land at CC warehouse or direct to client.",
    ccReceives: false,
    crossesCustoms: false,
  },
  "broker-direct": {
    label: "Broker direct",
    shortLabel: "Broker direct",
    hint: "Broker handles import + final-mile to a destination port (Manzanillo, Monterrey, etc.). CC tracks but doesn't receive.",
    ccReceives: false,
    crossesCustoms: true,
  },
};

export const DELIVERY_METHODS: DeliveryMethod[] = [
  "standard",
  "dropship",
  "mexican-supplier",
  "broker-direct",
];

/**
 * Normalize whatever's in the sheet to a valid DeliveryMethod, defaulting
 * to "standard" for legacy rows that predate this column. Empty / unknown
 * strings also collapse to "standard" — that's the historical default and
 * matches Roger's most common shape.
 */
export const normalizeDeliveryMethod = (raw: string | undefined | null): DeliveryMethod => {
  const v = (raw ?? "").trim().toLowerCase();
  if ((DELIVERY_METHODS as string[]).includes(v)) return v as DeliveryMethod;
  return "standard";
};
