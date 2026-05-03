"use client";

import { useEffect, useState } from "react";
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
import { defaultSendChannels } from "@/app/lib/lead-sources";

interface SendDialogProps {
  open: boolean;
  onClose: () => void;
  docId: string;
  docType: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  dealName?: string;
  /**
   * Lead source carried forward from the deal. R4 Note 3: email is the
   * artifact and is always sent — the source only governs whether the
   * "also send via WhatsApp" toggle defaults on.
   */
  source?: string;
  onSent?: () => void;
}

const emailRegex = /.+@.+\..+/;

const initialAlsoWhatsApp = (source: string | undefined): boolean =>
  defaultSendChannels(source ?? "").includes("whatsapp");

export const SendDialog = ({
  open,
  onClose,
  docId,
  docType,
  customerName,
  customerEmail,
  customerPhone,
  dealName,
  source,
  onSent,
}: SendDialogProps) => {
  const [alsoWhatsApp, setAlsoWhatsApp] = useState<boolean>(
    initialAlsoWhatsApp(source)
  );
  // When source changes (dialog reopened on a different deal), recompute
  // the WhatsApp default. User can still flip after.
  useEffect(() => {
    if (open) setAlsoWhatsApp(initialAlsoWhatsApp(source));
  }, [open, source]);

  const [emailTo, setEmailTo] = useState(customerEmail);
  const [phoneTo, setPhoneTo] = useState(customerPhone ?? "");
  useEffect(() => {
    if (open) {
      setEmailTo(customerEmail);
      setPhoneTo(customerPhone ?? "");
    }
  }, [open, customerEmail, customerPhone]);

  const [subject, setSubject] = useState(
    `Your ${docType} from Counter Cultures${dealName ? ` — ${dealName}` : ""}`
  );
  const [message, setMessage] = useState(
    `Hi ${customerName || "there"},\n\nPlease find attached your ${docType.toLowerCase()} from Counter Cultures.\n\nIf you have any questions, feel free to reply to this email or message us on WhatsApp.\n\nBest regards,\nCounter Cultures\nSan Miguel de Allende`
  );
  const [sending, setSending] = useState(false);

  const emailValid = emailRegex.test(emailTo.trim());
  const phoneValid = phoneTo.trim().length > 0;
  const canSend = !sending && emailValid && (!alsoWhatsApp || phoneValid);

  const handleSend = async () => {
    if (!emailValid) {
      toast.error("Email is required — every quote ships by email.");
      return;
    }
    if (alsoWhatsApp && !phoneValid) {
      toast.error("Add a phone number or uncheck 'Also send via WhatsApp'.");
      return;
    }

    setSending(true);
    try {
      const emailRes = await fetch("/api/dashboard/documents/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send-email",
          docId,
          to: emailTo.trim(),
          subject,
          message,
        }),
      });
      if (!emailRes.ok) throw new Error("Email send failed");

      let waUrl: string | null = null;
      if (alsoWhatsApp) {
        const waRes = await fetch("/api/dashboard/documents/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "send-whatsapp",
            docId,
            to: phoneTo.trim(),
            message,
          }),
        });
        if (waRes.ok) {
          const data = await waRes.json();
          if (data.whatsappUrl) waUrl = data.whatsappUrl as string;
        } else {
          // Email already went through — surface the WhatsApp failure but don't
          // block the success path. Roger can retry WhatsApp manually.
          toast.error("Email sent, but WhatsApp send failed.");
        }
      }

      if (waUrl) window.open(waUrl, "_blank");

      toast.success(
        alsoWhatsApp
          ? `${docType} sent to ${customerName || emailTo} (email + WhatsApp)`
          : `${docType} emailed to ${customerName || emailTo}`
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

                {/* Email — always on. R4 Note 3: every quote ships by email. */}
                <div className="rounded-lg border border-brand-copper/30 bg-brand-copper/5 p-3 space-y-3">
                  <div className="flex items-center gap-2 text-brand-copper">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm font-medium">Email</span>
                    <span className="text-[10px] uppercase tracking-wider text-brand-copper/80 ml-auto">
                      Always sent
                    </span>
                  </div>

                  <div>
                    <label className="text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-dash-text-secondary mb-1 block">
                      To <span className="text-dash-danger">*</span>
                    </label>
                    <input
                      className="w-full px-3 py-2 bg-dash-bg border border-dash-border rounded-lg text-sm text-dash-text placeholder:text-dash-text-secondary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:border-brand-copper transition-colors"
                      type="email"
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
                      className="w-full px-3 py-2 bg-dash-bg border border-dash-border rounded-lg text-sm text-dash-text placeholder:text-dash-text-secondary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:border-brand-copper transition-colors"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-dash-text-secondary mb-1 block">
                      Message
                    </label>
                    <textarea
                      className="w-full px-3 py-2 bg-dash-bg border border-dash-border rounded-lg text-sm text-dash-text placeholder:text-dash-text-secondary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:border-brand-copper transition-colors resize-none"
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </div>
                </div>

                {/* Optional WhatsApp companion */}
                <div className="rounded-lg border border-dash-border p-3 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alsoWhatsApp}
                      onChange={(e) => setAlsoWhatsApp(e.target.checked)}
                      className="cursor-pointer"
                    />
                    <MessageCircle className="w-4 h-4 text-dash-success" />
                    <span className="text-sm text-dash-text">
                      Also send via WhatsApp
                    </span>
                  </label>

                  {alsoWhatsApp && (
                    <div>
                      <label className="text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-wider text-dash-text-secondary mb-1 block">
                        Phone <span className="text-dash-danger">*</span>
                      </label>
                      <input
                        className="w-full px-3 py-2 bg-dash-bg border border-dash-border rounded-lg text-sm text-dash-text placeholder:text-dash-text-secondary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:border-brand-copper transition-colors"
                        type="tel"
                        value={phoneTo}
                        onChange={(e) => setPhoneTo(e.target.value)}
                        placeholder="+52 415 123 4567"
                      />
                    </div>
                  )}
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
                  disabled={!canSend}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-brand-copper text-white rounded-lg hover:bg-brand-copper/90 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {alsoWhatsApp ? "Send Email + WhatsApp" : "Send Email"}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
