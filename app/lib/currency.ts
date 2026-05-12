/**
 * Currency conversion + formatting for the cart/checkout surface.
 *
 * The cart store always holds prices in a single currency (MXN or USD).
 * Customers may prefer to *see* prices in the other currency for mental
 * math — especially expat / US trade buyers shopping in San Miguel who
 * think in USD but get charged in MXN.
 *
 * Conversion is display-only. The actual charge always goes through in
 * the cart's native currency, and we surface a clear "displayed in X,
 * charged in Y" disclaimer wherever a converted amount appears.
 *
 * The FX rate is hard-coded for v1. When we wire up a real rates feed
 * (Banxico DOF, currencybeacon, etc.), replace `FX_USD_PER_MXN` with the
 * fetched rate and date-stamp.
 */

import { useUiStore, type DisplayCurrency } from "./stores/ui-store";

// As of mid-2026, indicative spot ~17.5 MXN/USD. We use a slightly
// conservative rate so the USD figure shown to the customer skews high
// vs. low (better to over-state than under-state on the customer side).
export const FX_USD_PER_MXN = 1 / 17.5;
export const FX_MXN_PER_USD = 17.5;
export const FX_RATE_AS_OF = "2026-05";

export type Currency = "MXN" | "USD";

export interface DisplayedMoney {
  /** Amount to render, already converted if needed. */
  amount: number;
  /** Currency the amount is in (after any conversion). */
  currency: Currency;
  /** True when the displayed currency differs from the source currency. */
  converted: boolean;
  /** "displayed in USD, charged in MXN"-style note. Empty when not converted. */
  note: string;
}

interface ResolveOpts {
  /** The amount in `sourceCurrency`. */
  amount: number;
  /** The cart's native currency (the one we'll actually charge). */
  sourceCurrency: Currency;
  /** What the user wants to see. "auto" means use sourceCurrency. */
  display: DisplayCurrency;
  /** Locale for the disclaimer text. */
  locale: "en" | "es";
}

const NOTE_TEMPLATES = {
  en: (display: Currency, source: Currency) =>
    `Displayed in ${display} · charged in ${source}`,
  es: (display: Currency, source: Currency) =>
    `Mostrado en ${display} · cobrado en ${source}`,
};

export const resolveDisplayedAmount = ({
  amount,
  sourceCurrency,
  display,
  locale,
}: ResolveOpts): DisplayedMoney => {
  const target: Currency = display === "auto" ? sourceCurrency : display;

  if (target === sourceCurrency) {
    return {
      amount,
      currency: sourceCurrency,
      converted: false,
      note: "",
    };
  }

  // Convert
  let converted = amount;
  if (sourceCurrency === "MXN" && target === "USD") {
    converted = amount * FX_USD_PER_MXN;
  } else if (sourceCurrency === "USD" && target === "MXN") {
    converted = amount * FX_MXN_PER_USD;
  }

  return {
    amount: converted,
    currency: target,
    converted: true,
    note: NOTE_TEMPLATES[locale](target, sourceCurrency),
  };
};

export const formatMoney = (
  amount: number,
  currency: Currency,
  locale: "en" | "es"
): string =>
  new Intl.NumberFormat(locale === "es" ? "es-MX" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "USD" ? 2 : 0,
    maximumFractionDigits: currency === "USD" ? 2 : 0,
  }).format(amount);

/**
 * One-stop hook for any cart/checkout surface that renders money. Reads
 * the user's display preference from the UI store, exposes a
 * pre-bound formatter, and tells you whether to show the "converted"
 * disclaimer.
 *
 * Usage:
 *   const { format, fxNote, converted } = useDisplayedMoney({
 *     sourceCurrency: "MXN",
 *     locale,
 *   });
 *   <span>{format(item.listPrice * item.quantity)}</span>
 *   {converted && <p>{fxNote}</p>}
 */
export const useDisplayedMoney = ({
  sourceCurrency,
  locale,
}: {
  sourceCurrency: Currency;
  locale: "en" | "es";
}) => {
  const display = useUiStore((s) => s.displayCurrency);

  const sample = resolveDisplayedAmount({
    amount: 0,
    sourceCurrency,
    display,
    locale,
  });

  const format = (amount: number) => {
    const r = resolveDisplayedAmount({
      amount,
      sourceCurrency,
      display,
      locale,
    });
    return formatMoney(r.amount, r.currency, locale);
  };

  return {
    format,
    converted: sample.converted,
    fxNote: sample.note,
    targetCurrency: sample.currency,
  };
};
