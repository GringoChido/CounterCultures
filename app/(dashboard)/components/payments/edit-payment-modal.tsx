"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Loader2, X, AlertTriangle } from "lucide-react";
import { useFeatures } from "@/app/lib/use-features";

interface EditPaymentModalProps {
  paymentId: string;
  paymentName: string;
  currentDate: string;
  currentRef: string;
  currentMemo: string;
  currentAmount: number;
  currentCurrency: string;
  currentJournalId: string;
}

const EditPaymentModal = ({
  paymentId,
  paymentName,
  currentDate,
  currentRef,
  currentMemo,
  currentAmount,
  currentCurrency,
  currentJournalId,
}: EditPaymentModalProps) => {
  const router = useRouter();
  const features = useFeatures();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [date, setDate] = useState(currentDate);
  const [ref, setRef] = useState(currentRef);
  const [memo, setMemo] = useState(currentMemo);
  const [amount, setAmount] = useState(String(currentAmount));
  const [exchangeRate, setExchangeRate] = useState("");

  const [confirmation, setConfirmation] = useState<{
    warnings: string[];
    preservedLinks: { invoiceIds: string[]; billIds: string[] };
  } | null>(null);

  if (!features.ready || !features.has("edit_payment")) {
    return null;
  }

  const buildPatch = () => {
    const patch: Record<string, string | boolean> = {};
    if (date !== currentDate) patch.date = date;
    if (ref !== currentRef) patch.ref = ref;
    if (memo !== currentMemo) patch.memo = memo;
    const amountNum = parseFloat(amount);
    if (Number.isFinite(amountNum) && Math.abs(amountNum - currentAmount) > 0.01) {
      patch.amount = amount;
    }
    if (exchangeRate.trim()) patch.exchange_rate = exchangeRate;
    return patch;
  };

  const handleSubmit = async (force = false) => {
    const patch = buildPatch();
    if (Object.keys(patch).length === 0) {
      toast.info("No changes to save");
      return;
    }

    setSubmitting(true);
    const r = await fetch(`/api/dashboard/payments/${paymentId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...patch, force }),
    });
    const data = await r.json();
    setSubmitting(false);

    if (data.requiresConfirmation && !force) {
      setConfirmation({
        warnings: data.warnings ?? [],
        preservedLinks: data.preservedLinks ?? { invoiceIds: [], billIds: [] },
      });
      return;
    }

    if (!data.ok) {
      toast.error(data.error || "Update failed");
      return;
    }

    if (data.warnings?.length > 0) {
      toast.warning(data.warnings[0]);
    } else {
      toast.success("Payment updated — reconciliations preserved");
    }
    setOpen(false);
    setConfirmation(null);
    router.refresh();
  };

  const totalLinks = confirmation
    ? confirmation.preservedLinks.invoiceIds.length + confirmation.preservedLinks.billIds.length
    : 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-brand-copper/40 bg-brand-copper/5 text-brand-copper rounded hover:bg-brand-copper/10 transition-colors cursor-pointer"
      >
        <Pencil className="w-3.5 h-3.5" />
        Editar pago
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8"
          onClick={(e) => {
            if (e.target === e.currentTarget && !submitting) {
              setOpen(false);
              setConfirmation(null);
            }
          }}
        >
          <div className="w-full max-w-md bg-dash-surface rounded-xl shadow-2xl">
            <div className="px-5 py-4 border-b border-dash-border flex items-center justify-between">
              <h2 className="font-display text-lg font-light text-dash-text">
                {confirmation ? "Confirm edit" : "Edit payment"}
              </h2>
              <button
                type="button"
                onClick={() => { setOpen(false); setConfirmation(null); }}
                disabled={submitting}
                className="p-1 rounded hover:bg-dash-bg-muted transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-dash-text-secondary" />
              </button>
            </div>

            {confirmation ? (
              <div className="px-5 py-4 space-y-4">
                <div className="bg-dash-warn-soft border border-dash-warn rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-dash-warn shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-dash-text">
                        Este cambio afecta {totalLinks} documento(s) reconciliado(s)
                      </p>
                      <p className="text-xs text-dash-text-secondary mt-1">
                        Los enlaces de pago se preservarán — confirme para continuar.
                      </p>
                      <p className="text-xs text-dash-text-secondary mt-0.5">
                        This change affects {totalLinks} reconciled document(s). Payment links will be preserved.
                      </p>
                    </div>
                  </div>
                  {confirmation.warnings.map((w, i) => (
                    <p key={i} className="text-xs text-dash-warn mt-2">{w}</p>
                  ))}
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmation(null)}
                    disabled={submitting}
                    className="px-3 py-1.5 text-sm text-dash-text-secondary hover:text-dash-text transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmit(true)}
                    disabled={submitting}
                    className="flex items-center gap-2 px-4 py-1.5 bg-brand-copper text-white text-sm font-medium rounded-lg hover:bg-brand-copper/90 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Confirmar / Confirm
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="px-5 py-4 space-y-4">
                  <div className="bg-dash-bg-muted rounded-lg p-3 text-xs text-dash-text-secondary">
                    <span className="font-medium text-dash-text">{paymentName}</span>
                    {" · "}{currentCurrency} {currentAmount.toFixed(2)}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-dash-text-muted uppercase tracking-wider mb-1.5">
                        Monto / Amount
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-dash-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-dash-text-muted uppercase tracking-wider mb-1.5">
                        Fecha / Date
                      </label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-dash-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-dash-text-muted uppercase tracking-wider mb-1.5">
                      Referencia / Reference
                    </label>
                    <input
                      type="text"
                      value={ref}
                      onChange={(e) => setRef(e.target.value)}
                      placeholder="Wire ref, cheque #, etc."
                      className="w-full px-3 py-2 text-sm border border-dash-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-dash-text-muted uppercase tracking-wider mb-1.5">
                      Memo
                    </label>
                    <input
                      type="text"
                      value={memo}
                      onChange={(e) => setMemo(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-dash-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-dash-text-muted uppercase tracking-wider mb-1.5">
                      Tipo de cambio / Exchange rate (optional)
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      min="0"
                      value={exchangeRate}
                      onChange={(e) => setExchangeRate(e.target.value)}
                      placeholder="e.g. 19.4500"
                      className="w-full px-3 py-2 text-sm border border-dash-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
                    />
                    <p className="text-[10px] text-dash-text-muted mt-1">
                      Leave empty to keep current rate
                    </p>
                  </div>
                </div>
                <div className="px-5 py-4 border-t border-dash-border flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => { setOpen(false); setConfirmation(null); }}
                    disabled={submitting}
                    className="px-3 py-1.5 text-sm text-dash-text-secondary hover:text-dash-text transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmit(false)}
                    disabled={submitting}
                    className="flex items-center gap-2 px-4 py-1.5 bg-brand-copper text-white text-sm font-medium rounded-lg hover:bg-brand-copper/90 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Guardar / Save
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export { EditPaymentModal };
