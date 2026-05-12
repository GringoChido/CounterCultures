"use client";

import { useUiStore, type DisplayCurrency } from "@/app/lib/stores/ui-store";

/**
 * Compact MXN ↔ USD pill switch. Drops into any cart/checkout header.
 * Reads + writes the user's preferred display currency via the UI store
 * (persisted to localStorage), so a return visitor sees their last pick.
 *
 * Display-only — actual charges go through in the cart's source currency.
 */

interface CurrencyToggleProps {
  /** When true, render with darker borders for use over white panels. */
  variant?: "subtle" | "outlined";
  className?: string;
}

const OPTIONS: Array<{ value: Exclude<DisplayCurrency, "auto">; label: string }> = [
  { value: "MXN", label: "MXN" },
  { value: "USD", label: "USD" },
];

export const CurrencyToggle = ({
  variant = "subtle",
  className = "",
}: CurrencyToggleProps) => {
  const display = useUiStore((s) => s.displayCurrency);
  const setDisplay = useUiStore((s) => s.setDisplayCurrency);

  // "auto" reads from cart, but for the visual toggle we anchor to MXN
  // when nothing has been picked. This matches Counter Cultures' default
  // (Mexico-based, MXN-first).
  const active: "MXN" | "USD" = display === "USD" ? "USD" : "MXN";

  const baseBorder =
    variant === "outlined"
      ? "border border-brand-stone/30"
      : "border border-brand-stone/20";

  return (
    <div
      role="group"
      aria-label="Display currency"
      className={`inline-flex items-center bg-white/60 ${baseBorder} ${className}`}
    >
      {OPTIONS.map((opt) => {
        const isActive = active === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setDisplay(opt.value)}
            aria-pressed={isActive}
            className={`px-2.5 py-1 font-mono text-[11px] tracking-wider transition-colors cursor-pointer ${
              isActive
                ? "bg-brand-charcoal text-white"
                : "text-dash-text-secondary hover:text-brand-charcoal"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};
