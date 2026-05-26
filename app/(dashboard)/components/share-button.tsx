"use client";

/**
 * <ShareButton /> — reusable "forward this to a teammate" dropdown.
 *
 * Pulls the recipient list from /api/dashboard/reps (sheet-backed). Each
 * rep can receive via WhatsApp (uses Reps.whatsapp_phone → wa.me) or Email
 * (uses Reps.email → Resend). Every share appends a row to Activity_Log
 * regardless of medium, so audits are complete.
 *
 * Usage:
 *   <ShareButton
 *     entityType="lead"
 *     entityId={lead.id}
 *     summary="Lead: Gabor Goded — Residencial San Antonio"
 *     deepLink={`https://www.countercultures.com.mx/dashboard/leads#${lead.id}`}
 *   />
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Mail,
  MessageCircle,
  Share2,
  Users,
  X,
} from "lucide-react";
import type { EntityType } from "@/app/lib/notes";

interface Rep {
  id: string;
  name: string;
  email: string;
  whatsappPhone: string;
}

interface ShareButtonProps {
  entityType: EntityType;
  entityId: string;
  summary: string;
  deepLink: string;
  authorEmail?: string;
  label?: string;
  compact?: boolean;
}

export const ShareButton = ({
  entityType,
  entityId,
  summary,
  deepLink,
  authorEmail = "admin@countercultures.com.mx",
  label = "Share",
  compact = false,
}: ShareButtonProps) => {
  const [open, setOpen] = useState(false);
  const [reps, setReps] = useState<Rep[] | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchReps = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/reps");
      const data = await res.json();
      setReps((data.reps ?? []) as Rep[]);
    } catch (err) {
      console.error("[ShareButton] reps fetch failed", err);
      setReps([]);
    }
  }, []);

  useEffect(() => {
    if (open && reps === null) fetchReps();
  }, [open, reps, fetchReps]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const share = async (rep: Rep, medium: "whatsapp" | "email") => {
    const key = `${rep.id}-${medium}`;
    setSending(key);
    try {
      const res = await fetch("/api/dashboard/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType,
          entityId,
          recipient: {
            name: rep.name,
            email: rep.email,
            whatsappPhone: rep.whatsappPhone,
          },
          medium,
          summary,
          deepLink,
          authorEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Couldn't share");
        return;
      }
      if (medium === "whatsapp" && data.waUrl) {
        window.open(data.waUrl, "_blank", "noopener,noreferrer");
        toast.success(`WhatsApp opened for ${rep.name}`);
      } else if (medium === "email") {
        toast.success(`Emailed ${rep.name}`);
      } else {
        toast.success(`Shared with ${rep.name}`);
      }
      setOpen(false);
    } catch (err) {
      console.error("[ShareButton] share failed", err);
      toast.error("Couldn't share");
    } finally {
      setSending(null);
    }
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className={
          compact
            ? "flex items-center gap-1.5 px-2.5 py-1.5 text-xs border border-dash-border rounded-lg hover:bg-dash-bg transition-colors cursor-pointer"
            : "flex items-center gap-2 px-4 py-2 text-sm border border-dash-border rounded-lg hover:bg-dash-bg transition-colors cursor-pointer"
        }
      >
        <Share2 className={compact ? "w-3 h-3" : "w-4 h-4"} />
        {label}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-dash-surface border border-dash-border rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-dash-border">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-dash-text">
              <Users className="w-3.5 h-3.5" />
              Share with
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-dash-bg text-dash-text-secondary cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {reps === null ? (
            <div className="flex items-center gap-2 px-3 py-4 text-xs text-dash-text-secondary">
              <Loader2 className="w-3 h-3 animate-spin" />
              Loading teammates…
            </div>
          ) : reps.length === 0 ? (
            <p className="px-3 py-4 text-xs text-dash-text-secondary">
              No reps in the <code className="bg-dash-bg px-1 rounded">Reps</code> sheet yet.
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {reps.map((r) => {
                const hasWA = r.whatsappPhone.replace(/\D/g, "").length >= 8;
                const hasEmail = r.email.includes("@");
                const waKey = `${r.id}-whatsapp`;
                const emailKey = `${r.id}-email`;
                return (
                  <li
                    key={r.id || r.email || r.name}
                    className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-dash-bg/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-dash-text truncate">{r.name || r.email}</p>
                      <p className="text-[10px] text-dash-text-secondary truncate">
                        {r.email || "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        disabled={!hasWA || !!sending}
                        onClick={() => share(r, "whatsapp")}
                        title={hasWA ? "Share via WhatsApp" : "No WhatsApp phone on file"}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-dash-success hover:bg-dash-success/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      >
                        {sending === waKey ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <MessageCircle className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        disabled={!hasEmail || !!sending}
                        onClick={() => share(r, "email")}
                        title={hasEmail ? "Share via Email" : "No email on file"}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-dash-info hover:bg-dash-info/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      >
                        {sending === emailKey ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Mail className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
