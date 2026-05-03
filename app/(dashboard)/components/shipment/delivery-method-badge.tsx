"use client";

import { Truck, Package2, MapPin, Building2 } from "lucide-react";
import {
  type DeliveryMethod,
  DELIVERY_METHOD_META,
  normalizeDeliveryMethod,
} from "@/app/lib/delivery-methods";

const ICON: Record<DeliveryMethod, React.ComponentType<{ className?: string }>> = {
  standard: Truck,
  dropship: Package2,
  "mexican-supplier": MapPin,
  "broker-direct": Building2,
};

const TONE: Record<DeliveryMethod, string> = {
  standard:
    "bg-dash-bg border-dash-border text-dash-text-secondary",
  dropship:
    "bg-brand-copper/10 border-brand-copper/30 text-brand-copper",
  "mexican-supplier":
    "bg-brand-sage/10 border-brand-sage/30 text-brand-sage",
  "broker-direct":
    "bg-dash-warn-soft border-dash-warn/40 text-dash-warn",
};

interface DeliveryMethodBadgeProps {
  method: DeliveryMethod | string | undefined | null;
  /** When true, show only the icon + short label (for tight rows). */
  compact?: boolean;
  /** Optional supplier or destination subtitle (e.g. "→ Manzanillo"). */
  subtitle?: string;
}

export const DeliveryMethodBadge = ({
  method,
  compact = false,
  subtitle,
}: DeliveryMethodBadgeProps) => {
  const m = normalizeDeliveryMethod(typeof method === "string" ? method : "");
  const meta = DELIVERY_METHOD_META[m];
  const Icon = ICON[m];

  return (
    <span
      title={meta.hint}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-medium ${TONE[m]}`}
    >
      <Icon className="w-3 h-3" />
      <span>{compact ? meta.shortLabel : meta.label}</span>
      {subtitle && (
        <span className="opacity-70 font-normal">· {subtitle}</span>
      )}
    </span>
  );
};
