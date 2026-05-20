"use client";

import { Tag } from "lucide-react";
import { useCartStore, type CartItem, type ShippingMethod } from "@/app/lib/stores/cart-store";
import { useDisplayedMoney } from "@/app/lib/currency";
import { FinishSwatch } from "./finish-swatch";

interface OrderSummaryProps {
  locale: "en" | "es";
  showIva?: boolean;
  isMxShipTo?: boolean;
  /** IVA extracted from the published (tax-inclusive) prices */
  ivaAmount?: number;
  /** Product cost before tax (published total minus IVA) */
  productSubtotal?: number;
  shippingMethod?: ShippingMethod;
  shippingCost?: number;
  variant?: "panel" | "inline";
  density?: "full" | "compact";
}

const SHIPPING_LABELS = {
  en: {
    local_pickup: "Local pickup (SMA)",
    sma_delivery: "Local delivery (SMA)",
    ship: "FedEx Economy",
    custom_freight: "Custom freight quote",
    calcAtCheckout: "Calculated at checkout",
    quotedAfterReview: "Quoted after order review",
  },
  es: {
    local_pickup: "Recoger en showroom (SMA)",
    sma_delivery: "Entrega local (SMA)",
    ship: "FedEx Economy",
    custom_freight: "Cotización de flete",
    calcAtCheckout: "Calculado en checkout",
    quotedAfterReview: "Cotizado tras revisión",
  },
};

const T = {
  en: {
    summary: "Order Summary",
    items: (n: number) => `${n} ${n === 1 ? "item" : "items"}`,
    subtotal: "Subtotal",
    iva: "IVA (16%)",
    ivaPending: "Included in price",
    ivaApplied: "Mexico delivery",
    shipping: "Shipping",
    shippingNote: "Quoted after order review",
    total: "Total (IVA included)",
    tradeApplied: "Trade pricing active",
    each: "each",
    finish: "Finish",
    quoteOnly: "Quote",
    free: "Free",
  },
  es: {
    summary: "Resumen del Pedido",
    items: (n: number) => `${n} ${n === 1 ? "artículo" : "artículos"}`,
    subtotal: "Subtotal",
    iva: "IVA (16%)",
    ivaPending: "Incluido en el precio",
    ivaApplied: "Envío a México",
    shipping: "Envío",
    shippingNote: "Cotizado tras revisión",
    total: "Total (IVA incluido)",
    tradeApplied: "Precio trade activo",
    each: "c/u",
    finish: "Acabado",
    quoteOnly: "Cotización",
    free: "Gratis",
  },
};

export const OrderSummary = ({
  locale,
  showIva = true,
  isMxShipTo = false,
  ivaAmount = 0,
  productSubtotal,
  shippingMethod,
  shippingCost,
  variant = "panel",
  density = "compact",
}: OrderSummaryProps) => {
  const t = T[locale];
  const sl = SHIPPING_LABELS[locale];
  const items = useCartStore((s) => s.items);
  const publishedTotal = useCartStore((s) => s.subtotal());
  const tradeCode = useCartStore((s) => s.tradeCode);
  const tradePartnerName = useCartStore((s) => s.tradePartnerName);

  const sourceCurrency = items[0]?.currency ?? "MXN";
  const { format: formatted, converted, fxNote } = useDisplayedMoney({
    sourceCurrency,
    locale,
  });

  const shippingAmount = shippingCost ?? 0;
  const displaySubtotal = productSubtotal ?? publishedTotal;
  const total = publishedTotal + shippingAmount;
  const itemCount = items.reduce((acc, i) => acc + i.quantity, 0);

  const wrapperClass =
    variant === "panel"
      ? "cc-surface-card p-6 lg:p-7"
      : "";

  return (
    <div className={wrapperClass}>
      {variant === "panel" && (
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="font-display text-lg font-light tracking-wide text-brand-charcoal">
            {t.summary}
          </h2>
          <span className="font-body text-xs uppercase tracking-[0.18em] text-brand-stone">
            {t.items(itemCount)}
          </span>
        </div>
      )}

      {/* Trade applied badge */}
      {tradeCode && (
        <div className="flex items-center gap-2 px-3 py-2 mb-5 bg-brand-sage/10 border-l-2 border-brand-sage">
          <Tag className="w-3.5 h-3.5 text-brand-sage shrink-0" />
          <span className="font-body text-xs text-brand-charcoal">
            {t.tradeApplied}
            {tradePartnerName && ` · ${tradePartnerName}`}
          </span>
        </div>
      )}

      {/* Line items */}
      <ul className="space-y-3.5">
        {items.map((item) => (
          <SummaryRow
            key={item.id}
            item={item}
            density={density}
            formatted={formatted}
            eachLabel={t.each}
            quoteLabel={t.quoteOnly}
          />
        ))}
      </ul>

      {/* Hairline */}
      <div className="cc-rule-copper my-5" />

      {/* Totals */}
      <dl className="space-y-2.5">
        <div className="flex items-baseline justify-between">
          <dt className="font-body text-sm text-dash-text-secondary">
            {t.subtotal}
          </dt>
          <dd className="font-mono text-sm text-brand-charcoal tabular-nums">
            {formatted(displaySubtotal)}
          </dd>
        </div>

        {showIva && (
          <div className="flex items-baseline justify-between">
            <dt className="font-body text-sm text-dash-text-secondary">
              {t.iva}
            </dt>
            <dd
              className={`tabular-nums ${
                isMxShipTo
                  ? "font-mono text-sm text-brand-charcoal"
                  : "font-body text-xs text-dash-text-secondary/70"
              }`}
            >
              {isMxShipTo ? formatted(ivaAmount) : t.ivaPending}
            </dd>
          </div>
        )}

        <div className="flex items-baseline justify-between">
          <dt className="font-body text-sm text-dash-text-secondary">
            {t.shipping}
            {shippingMethod && (
              <span className="block text-xs text-dash-text-secondary/70 mt-0.5">
                {sl[shippingMethod]}
              </span>
            )}
          </dt>
          <dd
            className={
              shippingMethod && shippingCost != null
                ? "font-mono text-sm text-brand-charcoal tabular-nums"
                : "font-body text-xs text-dash-text-secondary/70"
            }
          >
            {shippingMethod
              ? shippingCost != null && shippingCost > 0
                ? formatted(shippingCost)
                : t.free
              : sl.calcAtCheckout}
          </dd>
        </div>

        <div className="cc-rule-stone my-2" />

        <div className="flex items-baseline justify-between pt-1">
          <dt className="font-display text-base font-light text-brand-charcoal tracking-wide">
            {t.total}
          </dt>
          <dd className="font-display text-2xl font-light text-brand-charcoal tabular-nums">
            {formatted(total)}
          </dd>
        </div>

        {converted && (
          <p className="pt-2 font-body text-[11px] text-dash-text-secondary/70 italic text-right">
            {fxNote}
          </p>
        )}
      </dl>
    </div>
  );
};

interface SummaryRowProps {
  item: CartItem;
  density: "full" | "compact";
  formatted: (n: number) => string;
  eachLabel: string;
  quoteLabel: string;
}

const SummaryRow = ({
  item,
  density,
  formatted,
  eachLabel,
  quoteLabel,
}: SummaryRowProps) => {
  const isQuoteOnly = item.availability === "quote_only" || !item.buyable;

  const unitPrice = item.listPrice;

  if (density === "full") {
    return (
      <li className="flex gap-3 cc-item-in">
        {item.imageSrc ? (
          <div className="w-14 h-14 shrink-0 bg-brand-stone/5 overflow-hidden">
            <img
              src={item.imageSrc}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-14 h-14 shrink-0 bg-brand-stone/8" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-body text-sm text-brand-charcoal leading-tight truncate">
            {item.name}
          </p>
          <div className="mt-1 flex items-center gap-2 text-xs text-dash-text-secondary">
            <span className="truncate">{item.brand}</span>
            {item.selectedFinish && (
              <>
                <span className="text-brand-stone/40">·</span>
                <FinishSwatch finish={item.selectedFinish} />
                <span className="truncate">{item.selectedFinish}</span>
              </>
            )}
          </div>
          <div className="mt-1.5 flex items-baseline justify-between gap-2">
            <span className="font-mono text-xs text-dash-text-secondary tabular-nums">
              ×{item.quantity}
              {item.quantity > 1 && (
                <span className="text-brand-stone/60"> · {formatted(unitPrice)} {eachLabel}</span>
              )}
            </span>
            <span className="font-mono text-sm text-brand-charcoal tabular-nums">
              {isQuoteOnly ? quoteLabel : formatted(unitPrice * item.quantity)}
            </span>
          </div>
        </div>
      </li>
    );
  }

  // compact
  return (
    <li className="flex items-baseline justify-between gap-3 cc-item-in">
      <div className="min-w-0 flex-1">
        <p className="font-body text-sm text-brand-charcoal leading-snug">
          {item.name}
          <span className="font-mono text-xs text-dash-text-secondary ml-1.5">
            ×{item.quantity}
          </span>
        </p>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-dash-text-secondary">
          <span>{item.brand}</span>
          {item.selectedFinish && (
            <>
              <span className="text-brand-stone/40">·</span>
              <FinishSwatch finish={item.selectedFinish} />
              <span className="truncate">{item.selectedFinish}</span>
            </>
          )}
        </div>
      </div>
      <span className="font-mono text-sm text-brand-charcoal tabular-nums shrink-0">
        {isQuoteOnly ? quoteLabel : formatted(unitPrice * item.quantity)}
      </span>
    </li>
  );
};
