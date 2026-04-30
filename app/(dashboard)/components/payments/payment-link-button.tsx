"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Link2, Loader2, Copy, Mail, MessageCircle, X, Check } from "lucide-react";
import { useFeatures } from "@/app/lib/use-features";

interface PaymentLinkButtonProps {
  invoiceId: number;
  invoiceName: string;
  invoiceCurrency: string;
  residual: number;
  partnerName: string;
  partnerEmail?: string;
}

interface LinkResult {
  url: string;
  paymentLinkId: string;
  amount: number;
  currency: string;
  cached: boolean;
}

const fmtAmount = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);

const PaymentLinkButton = ({
  invoiceId,
  invoiceName,
  invoiceCurrency,
  residual,
  partnerName,
  partnerEmail,
}: PaymentLinkButtonProps) => {
  const features = useFeatures();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState<LinkResult | null>(null);
  const [copied, setCopied] = useState(false);

  if (!features.ready || !features.has("send_payment_link")) return null;

  const generate = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/dashboard/invoices/payment-link", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          odooInvoiceId: invoiceId,
          invoiceName,
          partnerName,
          amount: residual,
          currency: invoiceCurrency.toUpperCase(),
          customerEmail: partnerEmail,
        }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        toast.error(body.error || "Couldn't create payment link");
        return;
      }
      const data = (await r.json()) as LinkResult;
      setLink(data);
      setOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const subject = `Payment link · ${invoiceName}`;
  const body = link
    ? [
        `Hi ${partnerName},`,
        "",
        `Here's a secure link to pay invoice ${invoiceName} (${fmtAmount(
          link.amount,
          link.currency
        )}).`,
        "",
        link.url,
        "",
        "The receipt is automatic — no need to send proof of payment.",
        "",
        "Thanks,",
        "Counter Cultures",
      ].join("\n")
    : "";
  const mailto = link
    ? `mailto:${partnerEmail ?? ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    : "";
  const wa = link ? `https://wa.me/?text=${encodeURIComponent(body)}` : "";

  const copyLink = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(true);
      toast.success("Payment link copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copy failed");
    }
  };

  const copyMessage = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
      toast.success("Message copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={generate}
        disabled={loading}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-dash-info bg-dash-info-soft text-dash-info rounded hover:bg-dash-info-soft disabled:opacity-50 transition-colors cursor-pointer"
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Link2 className="w-3.5 h-3.5" />
        )}
        Send payment link
      </button>

      {open && link && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-lg bg-dash-surface rounded-xl shadow-2xl">
            <div className="px-5 py-4 border-b border-dash-border flex items-center justify-between">
              <h2 className="font-display text-lg font-light text-dash-text">
                Payment link ready
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 rounded hover:bg-dash-bg-muted transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-dash-text-secondary" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div className="bg-dash-bg-muted rounded-lg p-3 text-xs text-dash-text-secondary space-y-1">
                <div>
                  <span className="font-medium text-dash-text">{invoiceName}</span>
                  {" · "}
                  {partnerName}
                </div>
                <div>
                  Amount:{" "}
                  <span className="font-medium text-dash-text">
                    {fmtAmount(link.amount, link.currency)}
                  </span>
                </div>
                {link.cached && (
                  <div className="text-[11px] text-dash-text-muted">
                    Reusing existing link for this amount.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-medium text-dash-text-muted uppercase tracking-wider mb-1.5">
                  URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={link.url}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="flex-1 px-3 py-2 text-xs font-mono border border-dash-border rounded-lg bg-dash-bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
                  />
                  <button
                    type="button"
                    onClick={copyLink}
                    className="px-3 py-2 text-xs font-medium border border-dash-border rounded-lg hover:border-brand-copper transition-colors cursor-pointer text-dash-text"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-brand-sage" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-dash-text-muted uppercase tracking-wider mb-1.5">
                  Send to {partnerName}
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={copyMessage}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-dash-border bg-dash-surface rounded hover:border-brand-copper transition-colors cursor-pointer text-dash-text"
                  >
                    <Copy className="w-3 h-3" />
                    Copy message
                  </button>
                  <a
                    href={mailto}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-dash-border bg-dash-surface rounded hover:border-brand-copper transition-colors text-dash-text"
                  >
                    <Mail className="w-3 h-3" />
                    Email
                  </a>
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-dash-success bg-dash-surface rounded hover:border-dash-success transition-colors text-dash-success"
                  >
                    <MessageCircle className="w-3 h-3" />
                    WhatsApp
                  </a>
                </div>
              </div>

              <div className="bg-dash-info-soft border border-dash-info rounded-lg px-3 py-2 text-[11px] text-dash-info">
                When the customer pays, the Stripe webhook auto-registers the
                payment in Odoo against this invoice. No further steps needed.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export { PaymentLinkButton };
