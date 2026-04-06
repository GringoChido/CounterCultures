"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Mail,
  MessageCircle,
  Send,
  Loader2,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

interface SendDialogProps {
  open: boolean;
  onClose: () => void;
  docId: string;
  docType: string;
  customerName: string;
  customerEmail: string;
  dealName?: string;
  onSent?: () => void;
}

export const SendDialog = ({
  open,
  onClose,
  docId,
  docType,
  customerName,
  customerEmail,
  dealName,
  onSent,
}: SendDialogProps) => {
  const [channel, setChannel] = useState<"email" | "whatsapp">("email");
  const [to, setTo] = useState(customerEmail);
  const [subject, setSubject] = useState(
    `Your ${docType} from Counter Cultures${dealName ? ` — ${dealName}` : ""}`
  );
  const [message, setMessage] = useState(
    `Hi ${customerName || "there"},\n\nPlease find attached your ${docType.toLowerCase()} from Counter Cultures.\n\nIf you have any questions, feel free to reply to this email or message us on WhatsApp.\n\nBest regards,\nCounter Cultures\nSan Miguel de Allende`
  );
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);
    try {
      const res = await fetch("/api/dashboard/documents/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: channel === "email" ? "send-email" : "send-whatsapp",
          docId,
          to,
          subject,
          message,
        }),
      });

      if (!res.ok) throw new Error("Send failed");

      const data = await res.json();

      if (channel === "whatsapp" && data.whatsappUrl) {
        window.open(data.whatsappUrl, "_blank");
      }

      toast.success(
        channel === "email"
          ? `${docType} sent to ${customerName || to}`
          : "WhatsApp opened with share link"
      );
      onSent?.();
      onClose();
    } catch {
      toast.error("Failed to send document");
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 z-[70]"
          />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-dash-surface rounded-xl border border-dash-border shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-dash-border shrink-0">
                <h2 className="text-lg font-semibold text-dash-text">
                  Send {docType}
                </h2>
                <button
                  onClick={onClose}
                  className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-dash-bg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-dash-text-secondary" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Document badge */}
                <div className="flex items-center gap-3 p-3 bg-dash-bg rounded-lg">
                  <div className="w-9 h-9 rounded-lg bg-brand-copper/10 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-brand-copper" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-dash-text">{docId}</p>
                    <p className="text-[11px] text-dash-text-secondary">
                      {docType} &middot; {customerName}
                    </p>
                  </div>
                </div>

                {/* Channel toggle */}
                <div>
                  <label className="text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-dash-text-secondary mb-2 block">
                    Send via
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setChannel("email")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                        channel === "email"
                          ? "bg-brand-copper/10 text-brand-copper border border-brand-copper/30"
                          : "bg-dash-bg text-dash-text-secondary border border-dash-border hover:border-brand-copper/30"
                      }`}
                    >
                      <Mail className="w-4 h-4" />
                      Email
                    </button>
                    <button
                      onClick={() => setChannel("whatsapp")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                        channel === "whatsapp"
                          ? "bg-green-500/10 text-green-400 border border-green-500/30"
                          : "bg-dash-bg text-dash-text-secondary border border-dash-border hover:border-green-500/30"
                      }`}
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </button>
                  </div>
                </div>

                {/* To */}
                <div>
                  <label className="text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-dash-text-secondary mb-1 block">
                    To
                  </label>
                  <input
                    className="w-full px-3 py-2 bg-dash-bg border border-dash-border rounded-lg text-sm text-dash-text placeholder:text-dash-text-secondary/50 focus:outline-none focus:border-brand-copper transition-colors"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    placeholder={
                      channel === "email"
                        ? "email@example.com"
                        : "+52 415 123 4567"
                    }
                  />
                </div>

                {/* Subject (email only) */}
                {channel === "email" && (
                  <div>
                    <label className="text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-dash-text-secondary mb-1 block">
                      Subject
                    </label>
                    <input
                      className="w-full px-3 py-2 bg-dash-bg border border-dash-border rounded-lg text-sm text-dash-text placeholder:text-dash-text-secondary/50 focus:outline-none focus:border-brand-copper transition-colors"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>
                )}

                {/* Message */}
                <div>
                  <label className="text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-dash-text-secondary mb-1 block">
                    Message
                  </label>
                  <textarea
                    className="w-full px-3 py-2 bg-dash-bg border border-dash-border rounded-lg text-sm text-dash-text placeholder:text-dash-text-secondary/50 focus:outline-none focus:border-brand-copper transition-colors resize-none"
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-dash-border shrink-0">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm border border-dash-border rounded-lg hover:bg-dash-bg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={sending || !to}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-brand-copper text-white rounded-lg hover:bg-brand-copper/90 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {channel === "email" ? "Send Email" : "Open WhatsApp"}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
