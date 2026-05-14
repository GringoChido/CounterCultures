"use client";

/**
 * Take-payment panel — replaces the Stripe-only deposit flow.
 *
 * Roger picks 1-of-11 methods, flips the Fiscal/Non-fiscal toggle if
 * needed (the same Netpay swipe runs either depending on what he asks
 * the customer at the counter), picks 70% deposit / 100% upfront /
 * custom, and records it. The new row lands on Deal_Payments with
 * status=paid (Roger only logs payments he's actually taken).
 */

import { useState, useMemo } from "react";
import { Loader2, DollarSign } from "lucide-react";
import { toast } from "sonner";
import {
  PAYMENT_METHODS,
  getPaymentMethod,
  type PaymentMethodId,
  type FiscalPosture,
} from "@/app/lib/payment-methods";
import type { DealPayment } from "@/app/lib/sample-dashboard-data";

interface TakePaymentPanelProps {
  dealId: string;
  dealValue: number;
  dealCurrency: "MXN" | "USD";
  cfdiYes?: boolean;
  alreadyCollected: number;
  /** Called with the optimistic payment record so the caller can merge
   *  it onto the deal without a full refetch. */
  onRecorded: (payment: DealPayment) => void;
}

type DepositChoice = "70" | "100" | "custom";

export const TakePaymentPanel = ({
  dealId,
  dealValue,
  dealCurrency,
  cfdiYes,
  alreadyCollected,
  onRecorded,
}: TakePaymentPanelProps) => {
  const [methodId, setMethodId] = useState<PaymentMethodId>("stripe");
  const method = useMemo(() => getPaymentMethod(methodId), [methodId]);
  const [posture, setPosture] = useState<FiscalPosture>(method.defaultFiscal);
  const [depositChoice, setDepositChoice] = useState<DepositChoice>("70");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [reference, setReference] = useState("");
  const [recording, setRecording] = useState(false);

  const balanceDue = Math.max(0, dealValue - alreadyCollected);
  const computedAmount = useMemo(() => {
    if (depositChoice === "70") return Math.round(dealValue * 0.7);
    if (depositChoice === "100") return Math.round(balanceDue);
    const n = parseFloat(customAmount);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [depositChoice, customAmount, dealValue, balanceDue]);

  const onMethod = (id: PaymentMethodId) => {
    setMethodId(id);
    setPosture(getPaymentMethod(id).defaultFiscal);
  };

  const submit = async () => {
    if (computedAmount <= 0) {
      toast.error("Amount must be greater than zero");
      return;
    }
    if (computedAmount > balanceDue + 0.01) {
      toast.error("Amount exceeds balance due");
      return;
    }
    setRecording(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const paymentId = `PAY-${dealId.slice(-6)}-${Date.now().toString(36).toUpperCase().slice(-5)}`;
      const isFullPayment = computedAmount >= balanceDue - 0.01;
      const res = await fetch("/api/dashboard/deal-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Payment_ID: paymentId,
          Deal_ID: dealId,
          Type:
            alreadyCollected === 0 && isFullPayment
              ? "full"
              : alreadyCollected === 0
              ? "deposit"
              : "balance",
          Invoice_ID: paymentId,
          Stripe_Invoice_ID: "",
          Stripe_Payment_ID: "",
          Amount: String(computedAmount),
          Currency: method.currency,
          Stripe_Fees: methodId === "stripe" ? String(Math.round(computedAmount * 0.036 + 3)) : "0",
          Net_Received: String(computedAmount),
          Status: "paid",
          Due_Date: today,
          Paid_Date: today,
          Installment_Num: "",
          Method: methodId,
          Fiscal_Posture: posture,
          Reference: reference,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const cfdiNote =
        cfdiYes && posture === "fiscal" ? " · CFDI stamps" : "";
      toast.success(
        `Recorded ${method.label} payment ${computedAmount.toLocaleString()} ${method.currency}${cfdiNote}`,
      );
      const stripeFees =
        methodId === "stripe" ? Math.round(computedAmount * 0.036 + 3) : 0;
      const optimistic: DealPayment = {
        id: paymentId,
        type:
          alreadyCollected === 0 && isFullPayment
            ? "full"
            : alreadyCollected === 0
            ? "deposit"
            : "balance",
        invoiceId: paymentId,
        amount: computedAmount,
        currency: method.currency,
        stripeFees,
        netReceived: computedAmount,
        status: "paid",
        paidDate: today,
        method: methodId,
        fiscalPosture: posture,
        reference: reference || undefined,
      };
      setReference("");
      setCustomAmount("");
      onRecorded(optimistic);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to record payment");
    } finally {
      setRecording(false);
    }
  };

  const fmt = (n: number) =>
    n.toLocaleString(method.currency === "MXN" ? "es-MX" : "en-US", {
      style: "currency",
      currency: method.currency,
    });

  return (
    <div className="rounded-lg border border-brand-copper/30 bg-brand-copper/5 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-copper inline-flex items-center gap-2">
          <DollarSign className="w-3.5 h-3.5" />
          Take payment
        </h4>
        <span className="text-[10px] text-dash-text-secondary uppercase tracking-wider">
          balance {dealValue.toLocaleString()} {dealCurrency} · already{" "}
          {alreadyCollected.toLocaleString()}
        </span>
      </div>

      {/* Fiscal toggle — independent of method, but seeded from defaults */}
      <div className="flex items-center justify-between border border-dash-border bg-dash-surface rounded-md px-3 py-2">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-dash-text-secondary">
            Fiscal posture
          </p>
          <p className="text-[11px] text-dash-text mt-0.5">
            {cfdiYes ? "CFDI: Sí · stamps when fiscal payment clears" : "CFDI: not set"}
          </p>
        </div>
        <div className="flex gap-1">
          {(["fiscal", "non-fiscal"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setPosture(v)}
              disabled={!method.fiscalToggleable && method.defaultFiscal !== v}
              className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-colors cursor-pointer ${
                posture === v
                  ? "bg-brand-copper text-white border-brand-copper"
                  : "bg-dash-surface text-dash-text-secondary border-dash-border hover:border-brand-copper/40"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
              title={
                !method.fiscalToggleable && method.defaultFiscal !== v
                  ? `${method.label} is locked to ${method.defaultFiscal}`
                  : undefined
              }
            >
              {v === "fiscal" ? "Fiscal" : "Non-fiscal"}
            </button>
          ))}
        </div>
      </div>

      {/* Method picker — 11-up grid */}
      <div>
        <p className="text-[10px] uppercase tracking-wider text-dash-text-secondary mb-2">
          Payment method
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {PAYMENT_METHODS.map((m) => {
            const active = methodId === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onMethod(m.id)}
                className={`text-left border rounded-md px-3 py-2 transition-colors cursor-pointer ${
                  active
                    ? "border-brand-copper bg-brand-copper/10"
                    : "border-dash-border bg-dash-surface hover:border-brand-copper/30"
                }`}
              >
                <p
                  className={`text-[12px] font-medium ${
                    active ? "text-brand-copper" : "text-dash-text"
                  }`}
                >
                  {m.label}
                </p>
                <p className="text-[10px] text-dash-text-secondary mt-0.5">
                  {m.detail}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Amount path — 70% / 100% / custom */}
      <div>
        <p className="text-[10px] uppercase tracking-wider text-dash-text-secondary mb-2">
          Amount
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setDepositChoice("70")}
            className={`text-[11px] px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
              depositChoice === "70"
                ? "bg-brand-copper text-white border-brand-copper"
                : "bg-dash-surface text-dash-text-secondary border-dash-border hover:border-brand-copper/40"
            }`}
          >
            70% deposit · {fmt(Math.round(dealValue * 0.7))}
          </button>
          <button
            type="button"
            onClick={() => setDepositChoice("100")}
            className={`text-[11px] px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
              depositChoice === "100"
                ? "bg-brand-copper text-white border-brand-copper"
                : "bg-dash-surface text-dash-text-secondary border-dash-border hover:border-brand-copper/40"
            }`}
          >
            100% upfront · {fmt(Math.round(balanceDue))}
          </button>
          <button
            type="button"
            onClick={() => setDepositChoice("custom")}
            className={`text-[11px] px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
              depositChoice === "custom"
                ? "bg-brand-copper text-white border-brand-copper"
                : "bg-dash-surface text-dash-text-secondary border-dash-border hover:border-brand-copper/40"
            }`}
          >
            Custom
          </button>
          {depositChoice === "custom" && (
            <input
              type="number"
              min={0}
              step={0.01}
              placeholder="Amount"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="w-32 text-[12px] bg-dash-surface border border-dash-border rounded-md px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:border-brand-copper"
            />
          )}
        </div>
        <p className="text-[10px] text-dash-text-secondary mt-2">
          No merchandise releases without full payment, or partial taken
          must be ≤ deposit value.
        </p>
      </div>

      {/* Reference — wire confirmation, check number, Stripe ref, etc. */}
      <div>
        <label className="text-[10px] uppercase tracking-wider text-dash-text-secondary mb-1 block">
          Reference (optional)
        </label>
        <input
          type="text"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder={
            methodId.startsWith("wire-")
              ? "TRF-2026-0412"
              : methodId.startsWith("check-")
              ? "Check # 1234"
              : methodId.startsWith("cc-")
              ? "Auth ref"
              : "Reference"
          }
          className="w-full text-[12px] bg-dash-surface border border-dash-border rounded-md px-2 py-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:border-brand-copper"
        />
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-dash-border">
        <div className="text-[12px]">
          <span className="text-dash-text-secondary">Recording</span>{" "}
          <span className="text-dash-text font-semibold">
            {fmt(computedAmount)}
          </span>{" "}
          <span className="text-dash-text-secondary">
            via {method.label} · {posture}
          </span>
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={recording || computedAmount <= 0}
          className="inline-flex items-center gap-1.5 text-xs px-4 py-1.5 rounded-md bg-brand-copper text-white hover:bg-brand-copper/90 transition-colors cursor-pointer disabled:opacity-50"
        >
          {recording ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            "Record payment"
          )}
        </button>
      </div>
    </div>
  );
};
