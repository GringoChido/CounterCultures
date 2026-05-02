"use client";

/**
 * FiscalBucketPicker — three-bucket disposition for a payment, plus an
 * earmark capture for the off-books bucket. Roger's reality: in-stock
 * walk-in payments via Netpay-non-fiscal / cash / check sometimes need
 * to leave the books to cover same-month cash expenses (rent, petty
 * cash, salaries, bookkeeper). This is operating cash flow, not
 * accounting trickery — but the cash bucket needs honest tracking so
 * Roger can answer "where did it go?" at month-end.
 *
 * Buckets:
 *   A · stamped CFDI            — fiscal customer with Constancia
 *   B · factura general público — on-books, anonymous
 *   C · cash bucket             — off-books, earmarked for cash expense
 *
 * Bucket C is owner-gated upstream — this component just renders the
 * picker. Pages that don't have view_cash_bucket should not pass
 * `allowCashBucket={true}`.
 */

import type React from "react";

export type FiscalBucket = "cfdi" | "general" | "cash_bucket";
export type CashEarmark = "" | "rent" | "petty_cash" | "salaries" | "other";

const EARMARK_LABELS: Record<Exclude<CashEarmark, "">, string> = {
  rent: "Rent (showroom + bodega)",
  petty_cash: "Petty cash",
  salaries: "Salaries (bookkeeper · manager)",
  other: "Other (note in memo)",
};

interface Props {
  bucket: FiscalBucket;
  onBucketChange: (b: FiscalBucket) => void;
  earmark: CashEarmark;
  onEarmarkChange: (e: CashEarmark) => void;
  /**
   * Whether bucket C is offered at all. False hides cash-bucket from the
   * picker entirely (e.g. for sales-role payment recording where the
   * off-books bucket isn't allowed).
   */
  allowCashBucket: boolean;
  disabled?: boolean;
}

export const FiscalBucketPicker = ({
  bucket,
  onBucketChange,
  earmark,
  onEarmarkChange,
  allowCashBucket,
  disabled,
}: Props): React.ReactElement => {
  const cellClass = (active: boolean): string =>
    `flex flex-col items-start gap-1 px-3 py-2.5 rounded-lg border text-left text-xs transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
      active
        ? "bg-brand-copper/10 text-brand-copper border-brand-copper/30"
        : "bg-dash-bg text-dash-text-secondary border-dash-border hover:border-brand-copper/30"
    }`;

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-dash-text-secondary mb-1.5">
          Fiscal disposition
        </label>
        <div className={`grid gap-2 ${allowCashBucket ? "grid-cols-3" : "grid-cols-2"}`}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onBucketChange("cfdi")}
            className={cellClass(bucket === "cfdi")}
          >
            <span className="font-medium text-[11px] uppercase tracking-wider">CFDI</span>
            <span className="text-[10.5px] leading-tight opacity-80">
              Stamped — fiscal customer with Constancia
            </span>
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onBucketChange("general")}
            className={cellClass(bucket === "general")}
          >
            <span className="font-medium text-[11px] uppercase tracking-wider">Público</span>
            <span className="text-[10.5px] leading-tight opacity-80">
              Factura general — on-books, anonymous
            </span>
          </button>
          {allowCashBucket && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onBucketChange("cash_bucket")}
              className={cellClass(bucket === "cash_bucket")}
            >
              <span className="font-medium text-[11px] uppercase tracking-wider">Cash bucket</span>
              <span className="text-[10.5px] leading-tight opacity-80">
                Off-books — earmark for cash expense
              </span>
            </button>
          )}
        </div>
      </div>

      {bucket === "cash_bucket" && allowCashBucket && (
        <div>
          <label className="block text-xs font-medium text-dash-text-secondary mb-1.5">
            Earmark <span className="text-dash-danger">*</span>
            <span className="ml-2 text-[10px] font-normal text-dash-text-secondary/80">
              what is this cash going to cover?
            </span>
          </label>
          <select
            value={earmark}
            onChange={(e) => onEarmarkChange(e.target.value as CashEarmark)}
            disabled={disabled}
            className="w-full text-sm bg-dash-bg border border-dash-border rounded-lg px-3 py-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2"
          >
            <option value="">Select earmark…</option>
            {(Object.keys(EARMARK_LABELS) as Array<keyof typeof EARMARK_LABELS>).map((k) => (
              <option key={k} value={k}>
                {EARMARK_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

/**
 * Loose-typed label lookup. The API rollup uses "unspecified" as a key
 * for empty earmarks, which isn't a CashEarmark value — we fall back to
 * the raw key for any unknown bucket so the cell never renders blank.
 */
export const earmarkLabel = (e: string): string => {
  if (!e) return "—";
  return (EARMARK_LABELS as Record<string, string>)[e] ?? e;
};
