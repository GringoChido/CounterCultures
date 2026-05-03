"use client";

/**
 * "Send to Broker" — fires the auto-drafted email to the tráfico's
 * broker, advances status to sent-to-broker, and writes Activity_Log.
 *
 * Visible when status is "collecting" or "at-warehouse" — the natural
 * moments when the broker first needs the invoice bundle. After
 * sent-to-broker the button collapses to a quiet badge.
 *
 * R4 Note 6 — sub-gap 6b. Outbound only; inbound parsing of broker
 * confirmations stays manual until a separate PR.
 */

import { useState } from "react";
import { Send, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import type { TraficoStatus } from "@/app/lib/customs-data";

const ELIGIBLE_STATUSES: ReadonlySet<TraficoStatus> = new Set([
  "collecting",
  "at-warehouse",
] as TraficoStatus[]);

interface SendToBrokerButtonProps {
  traficoId: string;
  currentStatus: TraficoStatus;
  brokerEmail: string;
  onSent?: () => void;
}

export const SendToBrokerButton = ({
  traficoId,
  currentStatus,
  brokerEmail,
  onSent,
}: SendToBrokerButtonProps) => {
  const [sending, setSending] = useState(false);

  if (currentStatus === "sent-to-broker") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] text-brand-sage">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Sent to broker
      </span>
    );
  }

  if (!ELIGIBLE_STATUSES.has(currentStatus)) return null;

  const handleClick = async () => {
    if (!brokerEmail) {
      toast.error("This tráfico has no broker email — set it before sending.");
      return;
    }
    if (
      !confirm(
        `Send invoice bundle to ${brokerEmail}? Status will move to "sent-to-broker".`
      )
    ) {
      return;
    }
    setSending(true);
    try {
      const res = await fetch(
        `/api/dashboard/traficos/${encodeURIComponent(traficoId)}/send-to-broker`,
        { method: "POST" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? `HTTP ${res.status}`);
        return;
      }
      if (data.emailStatus === "sent") {
        toast.success(`Email sent to ${brokerEmail}`);
      } else if (data.emailStatus === "dry_run") {
        toast.success(
          "Status advanced (email skipped — RESEND_API_KEY not configured)"
        );
      } else {
        toast.error("Email send failed — status still advanced. Check logs.");
      }
      onSent?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={sending}
      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-brand-copper text-white hover:bg-brand-copper/90 disabled:opacity-50"
    >
      {sending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Send className="w-3.5 h-3.5" />
      )}
      Send to broker
    </button>
  );
};
