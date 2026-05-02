"use client";

/**
 * Off-books cash entry form. Lives only on /dashboard/finance/cash-bucket
 * (owner-gated). Writes a row into Deal_Payments with Fiscal_Disposition
 * = "cash_bucket" so the rollup + table on this page picks it up next
 * fetch.
 */

import { useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import type { CashEarmark } from "@/app/(dashboard)/components/payments/fiscal-bucket-picker";

interface Props {
  onRecorded: () => void;
}

const EARMARK_OPTIONS: Array<{ value: Exclude<CashEarmark, "">; label: string }> = [
  { value: "rent", label: "Rent (showroom + bodega)" },
  { value: "petty_cash", label: "Petty cash" },
  { value: "salaries", label: "Salaries (bookkeeper · manager)" },
  { value: "other", label: "Other" },
];

const todayIso = (): string => new Date().toISOString().slice(0, 10);

export const RecordCashEntryForm = ({ onRecorded }: Props): React.ReactElement => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayIso());
  const [dealId, setDealId] = useState("");
  const [earmark, setEarmark] = useState<CashEarmark>("");
  const [memo, setMemo] = useState("");

  const reset = (): void => {
    setAmount("");
    setDate(todayIso());
    setDealId("");
    setEarmark("");
    setMemo("");
  };

  const submit = async (): Promise<void> => {
    const numericAmount = Number.parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      toast.error("Amount must be greater than zero.");
      return;
    }
    if (!earmark) {
      toast.error("Pick an earmark — what is this cash going to cover?");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/deal-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Payment_ID: `CASH-${Date.now()}`,
          Deal_ID: dealId.trim(),
          Type: "off-books",
          Invoice_ID: "",
          Stripe_Invoice_ID: "",
          Stripe_Payment_ID: "",
          Amount: numericAmount.toFixed(2),
          Currency: "MXN",
          Stripe_Fees: "",
          Net_Received: numericAmount.toFixed(2),
          Status: "paid",
          Due_Date: date,
          Paid_Date: date,
          Installment_Num: "",
          Fiscal_Disposition: "cash_bucket",
          Cash_Earmark: earmark,
        }),
      });
      if (!res.ok) throw new Error("save-failed");
      toast.success("Cash bucket entry recorded.");
      reset();
      setOpen(false);
      onRecorded();
    } catch {
      toast.error("Couldn't record entry. Try again?");
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-brand-copper text-white rounded-lg hover:bg-brand-copper/90 transition-colors cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        Record cash entry
      </button>
    );
  }

  const labelClass = "block text-[10px] font-medium uppercase tracking-wider text-dash-text-secondary mb-1.5";
  const inputClass = "w-full text-sm bg-dash-bg border border-dash-border rounded-lg px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2";

  return (
    <div className="border border-dash-border rounded-lg p-5 bg-dash-surface space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-dash-text">Record off-books cash entry</h3>
        <button
          onClick={() => {
            reset();
            setOpen(false);
          }}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-dash-bg cursor-pointer"
        >
          <X className="w-4 h-4 text-dash-text-secondary" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>
            Amount (MXN) <span className="text-dash-danger">*</span>
          </label>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className={inputClass}
            autoFocus
          />
        </div>
        <div>
          <label className={labelClass}>Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>
          Earmark <span className="text-dash-danger">*</span>
        </label>
        <select
          value={earmark}
          onChange={(e) => setEarmark(e.target.value as CashEarmark)}
          className={inputClass}
        >
          <option value="">Select earmark…</option>
          {EARMARK_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Linked deal (optional)</label>
        <input
          type="text"
          value={dealId}
          onChange={(e) => setDealId(e.target.value)}
          placeholder="CC-2026-0142"
          className={`${inputClass} font-mono`}
        />
      </div>

      <div>
        <label className={labelClass}>Memo</label>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={2}
          placeholder="Free text — what was this for?"
          className={`${inputClass} resize-none`}
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          onClick={() => {
            reset();
            setOpen(false);
          }}
          className="px-3 py-1.5 text-sm border border-dash-border rounded-lg hover:bg-dash-bg cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-brand-copper text-white rounded-lg hover:bg-brand-copper/90 disabled:opacity-50 transition-colors cursor-pointer"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Record
        </button>
      </div>
    </div>
  );
};
