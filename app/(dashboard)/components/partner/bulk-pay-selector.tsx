"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Loader2, CheckSquare, Square, Banknote } from "lucide-react";
import { toast } from "sonner";
import { useFeatures } from "@/app/lib/use-features";

interface OpenBill {
  id: string;
  name: string;
  invoice_date: string;
  invoice_date_due: string;
  amount_total: string;
  amount_residual: string;
  currency_id: string;
  invoice_origin: string;
}

interface BulkPaySelectorProps {
  bills: OpenBill[];
  vendorName: string;
  onPaymentRegistered?: () => void;
}

const num = (s: string): number => {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};

const fmt = (n: number, cur = "MXN") =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cur}`;

export const BulkPaySelector = ({
  bills,
  vendorName,
  onPaymentRegistered,
}: BulkPaySelectorProps) => {
  const features = useFeatures();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [paying, setPaying] = useState(false);

  const sorted = useMemo(() => {
    return [...bills].sort((a, b) => {
      const dueDateA = a.invoice_date_due || a.invoice_date || "";
      const dueDateB = b.invoice_date_due || b.invoice_date || "";
      return dueDateA.localeCompare(dueDateB);
    });
  }, [bills]);

  if (!features.has("register_payment") || bills.length === 0) return null;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllByAging = () => {
    setSelected(new Set(sorted.map((b) => b.id)));
  };

  const clearAll = () => setSelected(new Set());

  const runningTotals = useMemo(() => {
    const totals: { id: string; residual: number; runningTotal: number; currency: string }[] = [];
    let running = 0;
    for (const bill of sorted) {
      if (!selected.has(bill.id)) continue;
      const residual = num(bill.amount_residual);
      running += residual;
      totals.push({
        id: bill.id,
        residual,
        runningTotal: running,
        currency: bill.currency_id || "MXN",
      });
    }
    return totals;
  }, [sorted, selected]);

  const totalAmount = runningTotals.length > 0
    ? runningTotals[runningTotals.length - 1].runningTotal
    : 0;
  const primaryCurrency = runningTotals.length > 0
    ? runningTotals[0].currency
    : sorted[0]?.currency_id || "MXN";

  const handleBulkPay = async () => {
    if (selected.size === 0) return;
    const selectedBills = sorted.filter((b) => selected.has(b.id));
    const msg = `Register payment of ${fmt(totalAmount, primaryCurrency)} for ${selected.size} bill(s) from ${vendorName}?`;
    if (!confirm(msg)) return;

    setPaying(true);
    let successCount = 0;
    let errorCount = 0;

    for (const bill of selectedBills) {
      try {
        const res = await fetch("/api/dashboard/payments/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            invoiceId: parseInt(bill.id, 10),
            amount: num(bill.amount_residual),
          }),
        });
        if (res.ok) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch {
        errorCount++;
      }
    }

    if (successCount > 0) {
      toast.success(
        `${successCount} payment(s) registered — ${fmt(totalAmount, primaryCurrency)}`
      );
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} payment(s) failed — check bills individually`);
    }

    setSelected(new Set());
    setPaying(false);
    onPaymentRegistered?.();
  };

  const today = new Date().toISOString().slice(0, 10);
  const isOverdue = (due: string) => due && due < today;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={selected.size === sorted.length ? clearAll : selectAllByAging}
            className="text-[11px] text-brand-copper hover:underline"
          >
            {selected.size === sorted.length ? "Deselect all" : "Select all (oldest first)"}
          </button>
          {selected.size > 0 && (
            <span className="text-[11px] text-dash-text-secondary">
              {selected.size} selected
            </span>
          )}
        </div>
        {selected.size > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-brand-copper">
              {fmt(totalAmount, primaryCurrency)}
            </span>
            <button
              type="button"
              disabled={paying}
              onClick={handleBulkPay}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-brand-copper text-white hover:bg-brand-copper/90 disabled:opacity-50"
            >
              {paying ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Banknote className="w-3.5 h-3.5" />
              )}
              Pay {selected.size} bill{selected.size !== 1 ? "s" : ""}
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-dash-border text-xs uppercase tracking-wider text-dash-text-secondary">
            <tr>
              <th className="w-8 p-2" />
              <th className="text-left p-2">Bill #</th>
              <th className="text-left p-2">PO ref</th>
              <th className="text-left p-2">Due</th>
              <th className="text-right p-2">Outstanding</th>
              {selected.size > 0 && <th className="text-right p-2">Running total</th>}
            </tr>
          </thead>
          <tbody>
            {sorted.map((b) => {
              const isSelected = selected.has(b.id);
              const residual = num(b.amount_residual);
              const running = runningTotals.find((r) => r.id === b.id);
              const overdue = isOverdue(b.invoice_date_due);
              return (
                <tr
                  key={b.id}
                  onClick={() => toggle(b.id)}
                  className={`border-b border-dash-border/50 cursor-pointer transition-colors ${
                    isSelected ? "bg-brand-copper/5" : "hover:bg-dash-bg-hover"
                  }`}
                >
                  <td className="p-2 text-center">
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-brand-copper" />
                    ) : (
                      <Square className="w-4 h-4 text-dash-text-secondary" />
                    )}
                  </td>
                  <td className="p-2 font-mono text-xs">
                    <Link
                      href={`/dashboard/invoices/${b.id}`}
                      className="hover:text-dash-accent"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {b.name}
                    </Link>
                  </td>
                  <td className="p-2 text-xs text-dash-text-secondary">
                    {b.invoice_origin || "—"}
                  </td>
                  <td className={`p-2 text-xs ${overdue ? "text-dash-danger font-medium" : ""}`}>
                    {(b.invoice_date_due || "").slice(0, 10) || "—"}
                  </td>
                  <td className="p-2 text-right text-xs font-medium text-brand-terracotta">
                    {fmt(residual, b.currency_id)}
                  </td>
                  {selected.size > 0 && (
                    <td className="p-2 text-right text-xs">
                      {running ? (
                        <span className="font-medium text-brand-copper">
                          {fmt(running.runningTotal, running.currency)}
                        </span>
                      ) : (
                        <span className="text-dash-text-muted">—</span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
