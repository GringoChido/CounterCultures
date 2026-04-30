"use client";

import { useState, useEffect } from "react";
import { X, Copy, Check, Loader2, Send, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface ShareQuoteModalProps {
  dealId: string;
  onClose: () => void;
}

interface ShareResponse {
  shareUrl: string;
  depositLinkUrl: string | null;
  docNumber: string;
  company: string;
  grandTotal: number;
  depositAmount: number;
  validUntil: string;
}

const ShareQuoteModal = ({ dealId, onClose }: ShareQuoteModalProps) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ShareResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [cc, setCc] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/dashboard/deals/${encodeURIComponent(dealId)}/share`, {
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((d: ShareResponse) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not generate share link");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dealId]);

  const copy = async () => {
    if (!data?.shareUrl) return;
    try {
      await navigator.clipboard.writeText(data.shareUrl);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Copy failed");
    }
  };

  const sendEmail = async () => {
    if (!email.trim()) {
      toast.error("Enter a recipient email");
      return;
    }
    setSending(true);
    try {
      const res = await fetch(
        `/api/dashboard/deals/${encodeURIComponent(dealId)}/send-quote`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: email.trim(),
            cc: cc.trim() || undefined,
            message: message.trim() || undefined,
          }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Send failed");
      }
      toast.success(`Quote sent to ${email.trim()}`);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Send failed";
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-[560px] max-w-[92vw] bg-dash-surface border border-dash-border rounded-xl shadow-xl flex flex-col overflow-hidden">
        <div className="flex items-start justify-between px-5 py-3.5 border-b border-dash-border">
          <div>
            <h3 className="text-base font-semibold text-dash-text">Share quote</h3>
            <p className="text-xs text-dash-text-secondary mt-0.5">
              Send this link to the customer. They'll see the full quote and
              can pay the 50% deposit online.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-dash-bg text-dash-text-secondary cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {loading ? (
            <div className="text-center py-10">
              <Loader2 className="w-6 h-6 text-dash-text-secondary animate-spin mx-auto" />
            </div>
          ) : !data ? (
            <p className="text-sm text-red-400 text-center py-4">
              Could not generate share link.
            </p>
          ) : (
            <>
              <div className="bg-dash-bg rounded-lg p-3 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-dash-text-secondary">Quote</span>
                  <span className="font-mono text-dash-text">
                    {data.docNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-dash-text-secondary">Customer</span>
                  <span className="text-dash-text">{data.company}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-dash-text-secondary">Total</span>
                  <span className="text-dash-text font-medium">
                    MXN {data.grandTotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-dash-text-secondary">
                    50% deposit link
                  </span>
                  <span
                    className={
                      data.depositLinkUrl
                        ? "text-green-400"
                        : "text-dash-text-secondary"
                    }
                  >
                    {data.depositLinkUrl
                      ? `MXN ${data.depositAmount.toLocaleString()} — generated`
                      : data.grandTotal <= 0
                        ? "—"
                        : "unavailable"}
                  </span>
                </div>
              </div>

              {/* Copy link */}
              <div>
                <label className="block text-[11px] font-medium text-dash-text-secondary mb-1.5 uppercase tracking-wider">
                  Share URL
                </label>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={data.shareUrl}
                    onFocus={(e) => e.currentTarget.select()}
                    className="flex-1 px-3 py-2 text-xs font-mono bg-dash-bg border border-dash-border rounded-lg text-dash-text"
                  />
                  <button
                    onClick={copy}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs bg-brand-copper text-white rounded-lg hover:bg-brand-copper/90 transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    {copied ? "Copied" : "Copy"}
                  </button>
                  <a
                    href={data.shareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 text-xs border border-dash-border text-dash-text rounded-lg hover:bg-dash-bg transition-colors"
                    title="Preview as customer"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                <p className="mt-1 text-[11px] text-dash-text-secondary">
                  Valid through {new Date(data.validUntil).toLocaleDateString()}
                  . Anyone with this link can view the quote; revoke by
                  rotating SESSION_SECRET.
                </p>
              </div>

              {/* Email form */}
              <div className="space-y-2 pt-3 border-t border-dash-border">
                <label className="block text-[11px] font-medium text-dash-text-secondary uppercase tracking-wider">
                  Email it to customer
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="architect@example.com"
                    className="px-3 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg text-dash-text focus:outline-none focus:ring-1 focus:ring-brand-copper"
                  />
                  <input
                    type="email"
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    placeholder="CC (optional)"
                    className="px-3 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg text-dash-text focus:outline-none focus:ring-1 focus:ring-brand-copper"
                  />
                </div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Optional personal note (appears above the button in the email)"
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg text-dash-text focus:outline-none focus:ring-1 focus:ring-brand-copper resize-none"
                />
                <button
                  onClick={sendEmail}
                  disabled={sending || !email.trim()}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-brand-copper text-white rounded-lg text-sm font-semibold hover:bg-brand-copper/90 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {sending ? "Sending…" : "Send quote"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export { ShareQuoteModal };
