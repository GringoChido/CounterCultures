"use client";

/**
 * Pending-move banner — shown at the top of the deal slideout when a
 * high-value (> $500K MXN) transition has been queued by the rule engine
 * and is awaiting the 2h cool-off.
 *
 * Real-time countdown updates every 30s (server-side 2h window is
 * authoritative; client countdown is for visual feedback).
 *
 * Wired to W7 APIs:
 *   POST  /api/dashboard/pipeline/pending-move/[dealId]   — execute now
 *   DELETE same path                                       — cancel
 */

import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, Zap, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  dealId: string;
  toStage: string;
  queuedAt: string;          // ISO timestamp
  onAction: () => void;      // refetch deal after execute / cancel
}

const COOLOFF_MS = 2 * 60 * 60 * 1000;

const formatRemaining = (ms: number): string => {
  if (ms <= 0) return "executing now";
  const mins = Math.floor(ms / (60 * 1000));
  if (mins < 1) return "under 1m";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hours}h ${remMins}m`;
};

const PendingMoveBanner = ({ dealId, toStage, queuedAt, onAction }: Props) => {
  const executeAt = Date.parse(queuedAt) + COOLOFF_MS;
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState<"execute" | "cancel" | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const remaining = executeAt - now;
  const nearZero = remaining < 10 * 60 * 1000; // < 10min
  const overdue = remaining <= 0;

  const handleExecute = useCallback(async () => {
    setBusy("execute");
    try {
      const res = await fetch(`/api/dashboard/pipeline/pending-move/${encodeURIComponent(dealId)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Execute failed");
        return;
      }
      toast.success("Transition executed");
      onAction();
    } finally {
      setBusy(null);
    }
  }, [dealId, onAction]);

  const handleCancel = useCallback(async () => {
    setBusy("cancel");
    try {
      const res = await fetch(`/api/dashboard/pipeline/pending-move/${encodeURIComponent(dealId)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Cancel failed");
        return;
      }
      toast.success("Pending move cancelled");
      onAction();
    } finally {
      setBusy(null);
    }
  }, [dealId, onAction]);

  return (
    <div
      className={`flex items-start gap-3 p-3 border rounded-lg mb-4 ${
        overdue || nearZero
          ? "bg-red-500/10 border-red-500/30"
          : "bg-amber-500/10 border-amber-500/30"
      }`}
    >
      <AlertTriangle
        className={`shrink-0 mt-0.5 w-4 h-4 ${overdue || nearZero ? "text-red-400" : "text-amber-400"}`}
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-dash-text">
          Pending auto-move to <span className="font-mono">{toStage}</span>
        </div>
        <div className="text-xs text-dash-text-secondary mt-0.5">
          Executes in {formatRemaining(remaining)} · queued {new Date(queuedAt).toLocaleString()}
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={handleExecute}
          disabled={busy !== null}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-brand-copper text-white rounded hover:bg-brand-copper/90 transition-colors disabled:opacity-50"
        >
          {busy === "execute" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
          Execute now
        </button>
        <button
          onClick={handleCancel}
          disabled={busy !== null}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-dash-surface border border-dash-border rounded hover:border-red-400/40 hover:text-red-400 transition-colors disabled:opacity-50"
        >
          {busy === "cancel" ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
          Cancel
        </button>
      </div>
    </div>
  );
};

export default PendingMoveBanner;
