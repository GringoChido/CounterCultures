"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Send,
  Skull,
  Loader2,
  X,
  Copy,
  Mail,
  MessageCircle,
} from "lucide-react";
import { useFeatures } from "@/app/lib/use-features";

interface StaleQuoteActionsProps {
  orderId: number;
  orderName: string;
  partnerName: string;
  partnerEmail: string;
  /** Odoo locale string ("en_US", "es_MX"). Used to auto-pick the default
   *  template language so Roger doesn't have to swap manually for each
   *  customer. Falls back to English when empty or unrecognized. */
  partnerLang?: string;
  daysOpen: number;
  amountTotal: number;
  currency: string;
  isStale: boolean;
}

interface FollowupTemplate {
  id: string;
  label: string;
  subject: (ctx: TemplateCtx) => string;
  body: (ctx: TemplateCtx) => string;
}

interface TemplateCtx {
  orderName: string;
  partnerName: string;
  daysOpen: number;
  amountTotal: number;
  currency: string;
}

const fmtAmount = (n: number, c: string) =>
  `${new Intl.NumberFormat("en-US", { style: "currency", currency: c }).format(n)}`;

const TEMPLATES: FollowupTemplate[] = [
  {
    id: "soft_en",
    label: "Soft check-in (EN)",
    subject: (c) => `Following up on quote ${c.orderName}`,
    body: (c) =>
      `Hi ${c.partnerName},\n\nWanted to circle back on quote ${c.orderName} (${fmtAmount(
        c.amountTotal,
        c.currency
      )}). It's been ${c.daysOpen} days and I want to make sure we haven't lost the thread.\n\nIs there anything missing on the quote, a question I can answer, or a timing change I should know about?\n\nHappy to revise pricing, swap items, or hold the quote open longer if useful.\n\nThanks,\nCounter Cultures`,
  },
  {
    id: "soft_es",
    label: "Seguimiento amigable (ES)",
    subject: (c) => `Seguimiento de cotización ${c.orderName}`,
    body: (c) =>
      `Hola ${c.partnerName},\n\nQuería retomar la cotización ${c.orderName} (${fmtAmount(
        c.amountTotal,
        c.currency
      )}). Han pasado ${c.daysOpen} días y quiero asegurarme de que no se haya quedado pendiente algo.\n\n¿Falta información en la cotización, alguna duda que pueda resolver, o cambió el cronograma?\n\nCon gusto reviso precios, cambio piezas o extiendo la vigencia.\n\nGracias,\nCounter Cultures`,
  },
  {
    id: "firm_en",
    label: "Firmer ask (EN)",
    subject: (c) => `Closing out quote ${c.orderName} — still active?`,
    body: (c) =>
      `Hi ${c.partnerName},\n\nQuote ${c.orderName} (${fmtAmount(
        c.amountTotal,
        c.currency
      )}) has been open ${c.daysOpen} days. Before I close it out on our side, I want to confirm whether the project is still moving forward.\n\nA quick reply with one of these gives me what I need:\n  • "Still active — not ready yet"\n  • "Move it forward — let's confirm the order"\n  • "Project is off — please close the quote"\n\nThanks,\nCounter Cultures`,
  },
  {
    id: "firm_es",
    label: "Cierre directo (ES)",
    subject: (c) => `Cierre de cotización ${c.orderName} — ¿sigue activa?`,
    body: (c) =>
      `Hola ${c.partnerName},\n\nLa cotización ${c.orderName} (${fmtAmount(
        c.amountTotal,
        c.currency
      )}) ha estado abierta ${c.daysOpen} días. Antes de cerrarla por nuestro lado, quiero confirmar si el proyecto sigue avanzando.\n\nCon una respuesta corta tengo lo que necesito:\n  • "Sigue activa — todavía no es momento"\n  • "Avancemos — confirmemos el pedido"\n  • "El proyecto se cayó — favor de cerrar"\n\nGracias,\nCounter Cultures`,
  },
];

const pickDefaultTemplate = (lang: string | undefined): string => {
  // Odoo locales are like "es_MX", "es_ES", "en_US". Match the language part.
  const code = (lang || "").trim().toLowerCase().slice(0, 2);
  return code === "es" ? "soft_es" : "soft_en";
};

const StaleQuoteActions = ({
  orderId,
  orderName,
  partnerName,
  partnerEmail,
  partnerLang,
  daysOpen,
  amountTotal,
  currency,
  isStale,
}: StaleQuoteActionsProps) => {
  const router = useRouter();
  const features = useFeatures();
  const [open, setOpen] = useState(false);
  const [tplId, setTplId] = useState(() => pickDefaultTemplate(partnerLang));
  const [to, setTo] = useState(partnerEmail);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const canSend = features.has("send_quote");
  const canCancel = features.has("cancel_order");
  if (!features.ready || (!canSend && !canCancel)) return null;
  if (!isStale) return null;

  const ctx: TemplateCtx = {
    orderName,
    partnerName,
    daysOpen,
    amountTotal,
    currency,
  };

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
    toast.success(`Follow-up sent to ${partnerName}`);
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

  const handleCancel = async () => {
    if (
      !confirm(
        `Mark ${orderName} as dead?\n\nThis cancels the quote in Odoo (state → cancel). The order is preserved for audit; reversible from inside Odoo if needed.`
      )
    ) {
      return;
    }
    setCancelling(true);
    const r = await fetch("/api/dashboard/orders/cancel", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, reason: "Stale quote — marked dead" }),
    });
    setCancelling(false);
    if (!r.ok) {
      const data = await r.json().catch(() => ({}));
      toast.error(data.error || "Cancel failed");
      return;
    }
    toast.success(`${orderName} cancelled`);
    router.refresh();
  };

  const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
  const wa = `https://wa.me/?text=${encodeURIComponent(body)}`;

  return (
    <>
      <section className="mb-6 bg-amber-50 border border-amber-200 rounded p-4">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-800">
            Stale quote · {daysOpen} days open
          </h2>
          <span className="text-[11px] text-amber-700/80">
            Customer hasn't responded. Push to close, or close it out.
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {canSend && (
            <button
              type="button"
              onClick={openModal}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-amber-300 bg-white text-amber-900 rounded hover:border-amber-500 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Send follow-up
            </button>
          )}
          {canCancel && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelling}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-red-300 bg-white text-red-700 rounded hover:border-red-500 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {cancelling ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Skull className="w-3.5 h-3.5" />
              )}
              Mark dead
            </button>
          )}
        </div>
      </section>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8"
          onClick={(e) => {
            if (e.target === e.currentTarget && !sending) setOpen(false);
          }}
        >
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-dash-border flex items-center justify-between">
              <h2 className="font-display text-lg font-light text-dash-text">
                Follow-up on {orderName}
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
              <div>
                <label className="block text-[11px] font-medium text-dash-text-muted uppercase tracking-wider mb-1.5">
                  Template
                </label>
                <select
                  value={tplId}
                  onChange={(e) => applyTemplate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-dash-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
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
                  className="w-full px-3 py-2 text-sm border border-dash-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
                />
                {!partnerEmail && (
                  <p className="text-[11px] text-amber-700 mt-1">
                    No email on file for {partnerName}. Add one in Odoo's
                    contact record, or paste here for this send.
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
                  className="w-full px-3 py-2 text-sm border border-dash-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
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
                  rows={12}
                  className="w-full px-3 py-2 text-sm border border-dash-border rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-dash-border flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={copyMessage}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs border border-dash-border bg-white rounded hover:border-brand-copper transition-colors cursor-pointer text-dash-text"
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </button>
                <a
                  href={mailto}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs border border-dash-border bg-white rounded hover:border-brand-copper transition-colors text-dash-text"
                >
                  <Mail className="w-3 h-3" />
                  mailto
                </a>
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs border border-emerald-300 bg-white rounded hover:border-emerald-500 transition-colors text-emerald-700"
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
                  disabled={sending || !subject.trim() || !body.trim() || !to.trim()}
                  className="flex items-center gap-2 px-4 py-1.5 bg-brand-copper text-white text-sm font-medium rounded-lg hover:bg-brand-copper/90 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Send via my Gmail
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export { StaleQuoteActions };
