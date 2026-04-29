"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Loader2, X } from "lucide-react";
import { useFeatures } from "@/app/lib/use-features";

interface Journal {
  id: number;
  name: string;
  code: string;
  type: string;
  currency_id: string;
}

interface MarkPaidButtonProps {
  invoiceId: number;
  invoiceName: string;
  invoiceCurrency: string;
  residual: number;
  partnerName: string;
}

const todayISO = (): string => new Date().toISOString().slice(0, 10);

const MarkPaidButton = ({
  invoiceId,
  invoiceName,
  invoiceCurrency,
  residual,
  partnerName,
}: MarkPaidButtonProps) => {
  const router = useRouter();
  const features = useFeatures();
  const [open, setOpen] = useState(false);
  const [journals, setJournals] = useState<Journal[] | null>(null);
  const [loadingJournals, setLoadingJournals] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [amount, setAmount] = useState<string>(residual.toFixed(2));
  const [journalId, setJournalId] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState(todayISO);
  const [ref, setRef] = useState("");
  const [memo, setMemo] = useState(`Payment for ${invoiceName}`);

  useEffect(() => {
    if (!open || journals !== null) return;
    setLoadingJournals(true);
    fetch("/api/dashboard/odoo/journals?type=bank,cash", {
      credentials: "include",
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        const data = (await r.json()) as { journals: Journal[] };
        setJournals(data.journals);
        // Prefer a journal matching the invoice currency if any
        const match =
          data.journals.find((j) => j.currency_id?.includes(invoiceCurrency)) ??
          data.journals[0];
        if (match) setJournalId(String(match.id));
      })
      .catch((err) => {
        console.error("[MarkPaidButton] journals load failed:", err);
        toast.error("Couldn't load journals");
      })
      .finally(() => setLoadingJournals(false));
  }, [open, journals, invoiceCurrency]);

  if (!features.ready || !features.has("register_payment")) {
    return null;
  }

  const handleSubmit = async () => {
    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!journalId) {
      toast.error("Pick a journal");
      return;
    }
    setSubmitting(true);
    const r = await fetch("/api/dashboard/payments/register", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoiceId,
        amount: amountNum,
        journalId: Number(journalId),
        paymentDate,
        ref: ref.trim() || undefined,
        memo: memo.trim() || undefined,
      }),
    });
    setSubmitting(false);
    if (!r.ok) {
      const body = await r.json().catch(() => ({}));
      toast.error(body.error || "Payment failed");
      return;
    }
    const data = (await r.json()) as {
      payment: { paymentName: string; paymentId: number };
    };
    toast.success(`Payment ${data.payment.paymentName} registered in Odoo`);
    setOpen(false);
    // Mirror is sheet-based; the new payment won't appear until the next
    // extraction. Refresh anyway so cached UI state recomputes.
    router.refresh();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-brand-sage/40 bg-brand-sage/5 text-brand-sage rounded hover:bg-brand-sage/10 transition-colors cursor-pointer"
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        Mark paid
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8"
          onClick={(e) => {
            if (e.target === e.currentTarget && !submitting) setOpen(false);
          }}
        >
          <div className="w-full max-w-md bg-dash-surface rounded-xl shadow-2xl">
            <div className="px-5 py-4 border-b border-dash-border flex items-center justify-between">
              <h2 className="font-display text-lg font-light text-dash-text">
                Register payment
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={submitting}
                className="p-1 rounded hover:bg-dash-bg-muted transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-dash-text-secondary" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div className="bg-dash-bg-muted rounded-lg p-3 text-xs text-dash-text-secondary">
                <div>
                  <span className="font-medium text-dash-text">{invoiceName}</span>
                  {" · "}
                  {partnerName}
                </div>
                <div className="mt-0.5">
                  Outstanding {invoiceCurrency} {residual.toFixed(2)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-dash-text-muted uppercase tracking-wider mb-1.5">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-dash-border rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
                  />
                  <p className="text-[10px] text-dash-text-muted mt-1">
                    Currency: {invoiceCurrency}
                  </p>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-dash-text-muted uppercase tracking-wider mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-dash-border rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-dash-text-muted uppercase tracking-wider mb-1.5">
                  Journal
                </label>
                {loadingJournals ? (
                  <div className="flex items-center gap-2 text-sm text-dash-text-secondary">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading bank accounts…
                  </div>
                ) : journals && journals.length > 0 ? (
                  <select
                    value={journalId}
                    onChange={(e) => setJournalId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-dash-border rounded-lg bg-dash-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
                  >
                    {journals.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.name} {j.currency_id ? `· ${j.currency_id}` : ""}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-dash-danger">
                    No bank/cash journals found. Re-run the Odoo extract.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-medium text-dash-text-muted uppercase tracking-wider mb-1.5">
                  Reference (optional)
                </label>
                <input
                  type="text"
                  value={ref}
                  onChange={(e) => setRef(e.target.value)}
                  placeholder="Wire ref, cheque #, etc."
                  className="w-full px-3 py-2 text-sm border border-dash-border rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
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
                  className="w-full px-3 py-2 text-sm border border-dash-border rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-dash-border flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={submitting}
                className="px-3 py-1.5 text-sm text-dash-text-secondary hover:text-dash-text transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !journalId}
                className="flex items-center gap-2 px-4 py-1.5 bg-brand-sage text-white text-sm font-medium rounded-lg hover:bg-brand-sage/90 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Register payment
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export { MarkPaidButton };
