"use client";

/**
 * Confirmation modal for customer-facing tools (send_email,
 * reply_to_thread, share_entity).
 *
 * v2 status: scaffolding only. v2 ships the simpler "ask first as text,
 * execute on yes" pattern (see webchat-v2-design.md §4.3 revised). The
 * modal here is wired up but not yet hooked into the streaming agent
 * loop — that pause/resume + new /api/dashboard-chat/approve endpoint
 * lands in v3.
 */

import { Send, X } from "lucide-react";

export interface ChatConfirmModalProps {
  open: boolean;
  title: string;
  preview: { label: string; value: string }[]; // ordered fields
  bodyHtml?: string; // optional rendered body (e.g., email html)
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
}

export const ChatConfirmModal = ({
  open,
  title,
  preview,
  bodyHtml,
  onConfirm,
  onCancel,
  confirmLabel = "Send",
}: ChatConfirmModalProps) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-dash-surface border border-dash-border rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        <header className="px-4 py-3 border-b border-dash-border flex items-center justify-between">
          <p className="text-sm font-semibold text-dash-text">{title}</p>
          <button
            type="button"
            onClick={onCancel}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-dash-bg cursor-pointer"
          >
            <X className="w-4 h-4 text-dash-text-secondary" />
          </button>
        </header>
        <div className="p-4 space-y-3">
          {preview.map(({ label, value }) => (
            <div key={label}>
              <p className="text-[10px] uppercase tracking-wider text-dash-text-secondary mb-0.5">
                {label}
              </p>
              <p className="text-sm text-dash-text">{value}</p>
            </div>
          ))}
          {bodyHtml && (
            <div className="bg-dash-bg border border-dash-border rounded-lg p-3 text-xs text-dash-text whitespace-pre-wrap max-h-60 overflow-y-auto">
              {bodyHtml}
            </div>
          )}
        </div>
        <footer className="px-4 py-3 border-t border-dash-border flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs border border-dash-border rounded-lg hover:bg-dash-bg cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-brand-copper text-white rounded-lg hover:bg-brand-copper/90 cursor-pointer"
          >
            <Send className="w-3 h-3" />
            {confirmLabel}
          </button>
        </footer>
      </div>
    </div>
  );
};
