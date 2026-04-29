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

import { Send } from "lucide-react";
import { Modal } from "@/app/components/ui/modal";
import { focusRing } from "@/app/components/ui/focus-ring";

export interface ChatConfirmModalProps {
  open: boolean;
  title: string;
  preview: { label: string; value: string }[];
  bodyHtml?: string;
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
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <div className="space-y-3">
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
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-dash-border -mx-6 px-6 -mb-6 pb-3 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className={`px-3 py-1.5 text-xs border border-dash-border rounded-lg hover:bg-dash-bg cursor-pointer ${focusRing}`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-brand-copper text-white rounded-lg hover:bg-brand-copper/90 cursor-pointer ${focusRing}`}
          >
            <Send className="w-3 h-3" />
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};
