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
  // PR 8 — auto-route the quote send back to the channel the lead came in
  // on. When leadSource === "WhatsApp" and customerPhone is provided, both
  // channels are checked by default and the customer gets a short note +
  // link on WA plus the full PDF + payment link on email.
  leadSource?: string;
  customerPhone?: string;
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
  leadSource,
  customerPhone,
}: SendDialogProps) => {
  const sourceIsWA = leadSource === "WhatsApp" || leadSource === "whatsapp";
  // Default channel selection follows the lead's origin: WA leads get both
  // channels checked when we have a phone; everyone else defaults to email.
  const [emailChecked, setEmailChecked] = useState(true);
  const [waChecked, setWaChecked] = useState(sourceIsWA && !!customerPhone);
  const [emailTo, setEmailTo] = useState(customerEmail);
  const [waTo, setWaTo] = useState(customerPhone ?? "");
  const [subject, setSubject] = useState(
    `Your ${docType} from Counter Cultures${dealName ? ` — ${dealName}` : ""}`
  );
  const [message, setMessage] = useState(
    `Hi ${customerName || "there"},\n\nPlease find attached your ${docType.toLowerCase()} from Counter Cultures.\n\nIf you have any questions, feel free to reply to this email or message us on WhatsApp.\n\nBest regards,\nCounter Cultures\nSan Miguel de Allende`
  );
  const [waMessage, setWaMessage] = useState(
    `Hola ${customerName || ""}, gracias por la consulta. Le adjunto su ${docType.toLowerCase()}${dealName ? ` para ${dealName}` : ""}.`
  );
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!emailChecked && !waChecked) {
      toast.error("Pick at least one channel");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/dashboard/documents/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send-multi",
          docId,
          email: emailChecked ? emailTo : undefined,
          phone: waChecked ? waTo : undefined,
          emailSubject: subject,
          emailMessage: message,
          whatsappMessage: waMessage,
          leadSource,
        }),
      });

      if (!res.ok) throw new Error("Send failed");
      const data = (await res.json()) as {
        emailSent: boolean;
        whatsappUrl: string | null;
        whatsappDryRun: boolean;
        warnings: string[];
      };

      if (data.whatsappUrl) {
        window.open(data.whatsappUrl, "_blank");
      }

      const parts: string[] = [];
      if (data.emailSent) parts.push("email");
      if (data.whatsappUrl)
        parts.push(data.whatsappDryRun ? "WhatsApp (dry-run)" : "WhatsApp");
      toast.success(
        parts.length > 0
          ? `${docType} sent · ${parts.join(" + ")}`
          : `${docType} dispatched`,
      );
      for (const w of data.warnings) toast.warning(w);
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

                {/* Channel selection — dual-checkbox now. Defaults are
                    auto-set from the lead's source so a WhatsApp lead gets
                    both checked, an email lead gets just email. */}
                <div>
                  <label className="text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-dash-text-secondary mb-2 block">
                    Channels{leadSource ? ` · source: ${leadSource}` : ""}
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setEmailChecked((v) => !v)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                        emailChecked
                          ? "bg-brand-copper/10 text-brand-copper border border-brand-copper/30"
                          : "bg-dash-bg text-dash-text-secondary border border-dash-border hover:border-brand-copper/30"
                      }`}
                    >
                      <Mail className="w-4 h-4" />
                      Email {emailChecked ? "✓" : ""}
                    </button>
                    <button
                      type="button"
                      onClick={() => setWaChecked((v) => !v)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                        waChecked
                          ? "bg-vendor-whatsapp/15 text-vendor-whatsapp-dark border border-vendor-whatsapp/40"
                          : "bg-dash-bg text-dash-text-secondary border border-dash-border hover:border-vendor-whatsapp/40"
                      }`}
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp {waChecked ? "✓" : ""}
                    </button>
                  </div>
                  {sourceIsWA && (
                    <p className="text-[10px] text-dash-text-secondary mt-1.5">
                      WhatsApp lead — Roger&rsquo;s rule: send on the channel that
                      found us. Email carries the full PDF; WhatsApp carries
                      a short note + link.
                    </p>
                  )}
                </div>

                {/* Email block */}
                {emailChecked && (
                  <div className="space-y-2 border border-dash-border rounded-lg p-3 bg-dash-bg/40">
                    <div>
                      <label className="text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-dash-text-secondary mb-1 block">
                        Email · To
                      </label>
                      <input
                        className="w-full px-3 py-2 bg-dash-surface border border-dash-border rounded-lg text-sm text-dash-text placeholder:text-dash-text-secondary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:border-brand-copper transition-colors"
                        value={emailTo}
                        onChange={(e) => setEmailTo(e.target.value)}
                        placeholder="email@example.com"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-dash-text-secondary mb-1 block">
                        Subject
                      </label>
                      <input
                        className="w-full px-3 py-2 bg-dash-surface border border-dash-border rounded-lg text-sm text-dash-text placeholder:text-dash-text-secondary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:border-brand-copper transition-colors"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-dash-text-secondary mb-1 block">
                        Message
                      </label>
                      <textarea
                        className="w-full px-3 py-2 bg-dash-surface border border-dash-border rounded-lg text-sm text-dash-text placeholder:text-dash-text-secondary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:border-brand-copper transition-colors resize-none"
                        rows={4}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* WhatsApp block */}
                {waChecked && (
                  <div className="space-y-2 border border-vendor-whatsapp/30 rounded-lg p-3 bg-vendor-whatsapp/5">
                    <div>
                      <label className="text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-dash-text-secondary mb-1 block">
                        WhatsApp · Phone
                      </label>
                      <input
                        className="w-full px-3 py-2 bg-dash-surface border border-dash-border rounded-lg text-sm text-dash-text placeholder:text-dash-text-secondary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:border-brand-copper transition-colors"
                        value={waTo}
                        onChange={(e) => setWaTo(e.target.value)}
                        placeholder="+52 415 123 4567"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-dash-text-secondary mb-1 block">
                        WhatsApp · Note
                      </label>
                      <textarea
                        className="w-full px-3 py-2 bg-dash-surface border border-dash-border rounded-lg text-sm text-dash-text placeholder:text-dash-text-secondary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:border-brand-copper transition-colors resize-none"
                        rows={3}
                        value={waMessage}
                        onChange={(e) => setWaMessage(e.target.value)}
                      />
                      <p className="text-[10px] text-dash-text-secondary mt-1">
                        A signed share link to the document is appended
                        automatically. WhatsApp opens in a new tab.
                      </p>
                    </div>
                  </div>
                )}
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
                  disabled={
                    sending ||
                    (!emailChecked && !waChecked) ||
                    (emailChecked && !emailTo) ||
                    (waChecked && !waTo)
                  }
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-brand-copper text-white rounded-lg hover:bg-brand-copper/90 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {emailChecked && waChecked
                    ? "Send to both"
                    : emailChecked
                    ? "Send Email"
                    : "Open WhatsApp"}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
