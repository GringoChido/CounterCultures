"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Send,
  Loader2,
  X,
  Copy,
  Mail,
  MessageCircle,
} from "lucide-react";
import { useFeatures } from "@/app/lib/use-features";

interface SendQuoteButtonProps {
  orderId: number;
  orderName: string;
  orderState: string;
  partnerName: string;
  partnerEmail: string;
  partnerLang?: string;
  amountTotal: number;
  currency: string;
}

interface TemplateCtx {
  orderName: string;
  partnerName: string;
  amountTotal: number;
  currency: string;
}

const fmtAmount = (n: number, c: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: c }).format(n);

interface QuoteTemplate {
  id: string;
  label: string;
  subject: (ctx: TemplateCtx) => string;
  body: (ctx: TemplateCtx) => string;
}

const TEMPLATES: QuoteTemplate[] = [
  {
    id: "send_en",
    label: "Send quote (EN)",
    subject: (c) => `Your quote ${c.orderName} from Counter Cultures`,
    body: (c) =>
      `Hi ${c.partnerName},\n\nPlease find attached your quote ${c.orderName} for ${fmtAmount(c.amountTotal, c.currency)}.\n\nThis quote is valid for 15 days. To confirm your order, please reply to this email or pay the deposit via the payment link we'll send separately.\n\nLet me know if you have any questions or would like to adjust anything.\n\nBest,\nCounter Cultures`,
  },
  {
    id: "send_es",
    label: "Enviar cotización (ES)",
    subject: (c) => `Tu cotización ${c.orderName} de Counter Cultures`,
    body: (c) =>
      `Hola ${c.partnerName},\n\nAdjunto encontrarás tu cotización ${c.orderName} por ${fmtAmount(c.amountTotal, c.currency)}.\n\nEsta cotización tiene vigencia de 15 días. Para confirmar tu pedido, puedes responder a este correo o realizar el anticipo a través del enlace de pago que enviaremos por separado.\n\nQuedo a tus órdenes para cualquier duda o ajuste.\n\nSaludos,\nCounter Cultures`,
  },
  {
    id: "resend_en",
    label: "Resend / follow-up (EN)",
    subject: (c) => `Updated quote ${c.orderName} — Counter Cultures`,
    body: (c) =>
      `Hi ${c.partnerName},\n\nHere is your updated quote ${c.orderName} (${fmtAmount(c.amountTotal, c.currency)}). Let me know if everything looks good or if you'd like any changes.\n\nThanks,\nCounter Cultures`,
  },
  {
    id: "resend_es",
    label: "Reenviar / seguimiento (ES)",
    subject: (c) => `Cotización actualizada ${c.orderName} — Counter Cultures`,
    body: (c) =>
      `Hola ${c.partnerName},\n\nTe reenvío la cotización actualizada ${c.orderName} (${fmtAmount(c.amountTotal, c.currency)}). Avísame si todo se ve bien o si deseas algún cambio.\n\nSaludos,\nCounter Cultures`,
  },
];

const pickDefaultTemplate = (lang: string | undefined, state: string): string => {
  const code = (lang || "").trim().toLowerCase().slice(0, 2);
  const isResend = state === "sent" || state === "sale" || state === "done";
  if (code === "es") return isResend ? "resend_es" : "send_es";
  return isResend ? "resend_en" : "send_en";
};

const SendQuoteButton = ({
  orderId,
  orderName,
  orderState,
  partnerName,
  partnerEmail,
  partnerLang,
  amountTotal,
  currency,
}: SendQuoteButtonProps) => {
  const router = useRouter();
  const features = useFeatures();
  const [open, setOpen] = useState(false);
  const [tplId, setTplId] = useState(() =>
    pickDefaultTemplate(partnerLang, orderState)
  );
  const [to, setTo] = useState(partnerEmail);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);

  const canSend = features.has("send_quote");
  if (!features.ready || !canSend) return null;
  if (orderState === "cancel") return null;

  const ctx: TemplateCtx = { orderName, partnerName, amountTotal, currency };

  const applyTemplate = (id: string) => {
    setTplId(id);
    const tpl = TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
    setSubject(tpl.subject(ctx));
    setBody(tpl.body(ctx));
    setTouched(false);
  };

  const openModal = () => {
    if (!touched) applyTemplate(tplId);
    setOpen(true);
  };

  const sendViaGmail = async () => {
    if (!to.trim()) {
      toast.error("Recipient email required");
      return;
    }
    setSending(true);
    const r = await fetch("/api/gmail/send", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: to.trim(), subject, body }),
    });
    setSending(false);
    if (!r.ok) {
      const data = await r.json().catch(() => ({}));
      if (r.status === 409 || data.error === "Gmail not connected") {
        toast.error(
          "Connect your Gmail in Settings, then try again — or use Email/Copy below."
        );
      } else {
        toast.error(data.error || "Send failed");
      }
      return;
    }
    toast.success(`Quote sent to ${partnerName}`);
    setOpen(false);
    router.refresh();
  };

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
      toast.success("Message copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  const isResend = orderState === "sent" || orderState === "sale" || orderState === "done";
  const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const wa = `https://wa.me/?text=${encodeURIComponent(body)}`;

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-brand-copper text-brand-copper bg-dash-surface rounded hover:bg-brand-copper hover:text-white transition-colors cursor-pointer"
      >
        <Send className="w-3.5 h-3.5" />
        {isResend ? "Resend" : "Send Quote"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8"
          onClick={(e) => {
            if (e.target === e.currentTarget && !sending) setOpen(false);
          }}
        >
          <div className="w-full max-w-2xl bg-dash-surface rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-dash-border flex items-center justify-between">
              <h2 className="font-display text-lg font-light text-dash-text">
                {isResend ? "Resend" : "Send"} {orderName}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={sending}
                className="p-1 rounded hover:bg-dash-bg-muted transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-dash-text-secondary" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div className="bg-dash-bg/60 border border-dash-border rounded p-3 text-xs text-dash-text-secondary">
                Tip: Download the PDF first, then attach it in your email client.
                The quote PDF is available via the download button in the header.
              </div>
              <div>
                <label className="block text-[11px] font-medium text-dash-text-muted uppercase tracking-wider mb-1.5">
                  Template
                </label>
                <select
                  value={tplId}
                  onChange={(e) => applyTemplate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-dash-border rounded-lg bg-dash-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
                >
                  {TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-dash-text-muted uppercase tracking-wider mb-1.5">
                  To
                </label>
                <input
                  type="email"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="customer@example.com"
                  className="w-full px-3 py-2 text-sm border border-dash-border rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
                />
                {!partnerEmail && (
                  <p className="text-[11px] text-dash-warn mt-1">
                    No email on file for {partnerName}. Add one in Odoo or paste
                    here.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-[11px] font-medium text-dash-text-muted uppercase tracking-wider mb-1.5">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value);
                    setTouched(true);
                  }}
                  className="w-full px-3 py-2 text-sm border border-dash-border rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-dash-text-muted uppercase tracking-wider mb-1.5">
                  Message
                </label>
                <textarea
                  value={body}
                  onChange={(e) => {
                    setBody(e.target.value);
                    setTouched(true);
                  }}
                  rows={10}
                  className="w-full px-3 py-2 text-sm border border-dash-border rounded-lg font-mono focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-copper focus-visible:ring-offset-2 focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-dash-border flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={copyMessage}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs border border-dash-border bg-dash-surface rounded hover:border-brand-copper transition-colors cursor-pointer text-dash-text"
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </button>
                <a
                  href={mailto}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs border border-dash-border bg-dash-surface rounded hover:border-brand-copper transition-colors text-dash-text"
                >
                  <Mail className="w-3 h-3" />
                  mailto
                </a>
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs border border-dash-success bg-dash-surface rounded hover:border-dash-success transition-colors text-dash-success"
                >
                  <MessageCircle className="w-3 h-3" />
                  WhatsApp
                </a>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={sending}
                  className="px-3 py-1.5 text-sm text-dash-text-secondary hover:text-dash-text transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={sendViaGmail}
                  disabled={
                    sending || !subject.trim() || !body.trim() || !to.trim()
                  }
                  className="flex items-center gap-2 px-4 py-1.5 bg-brand-copper text-white text-sm font-medium rounded-lg hover:bg-brand-copper/90 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Send via Gmail
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export { SendQuoteButton };
