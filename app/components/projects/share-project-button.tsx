"use client";

import { useState } from "react";
import { Share2, Mail, MessageCircle, Check, Loader2 } from "lucide-react";
import type { Project } from "@/app/lib/project-store";
import { computeIva } from "@/app/lib/iva";

const T = {
  en: {
    share: "Share Project",
    hint: "Send the project contents via email or share a summary on WhatsApp.",
    emailTab: "Email",
    whatsappTab: "WhatsApp",
    emailPlaceholder: "Recipient email",
    namePlaceholder: "Your name (optional)",
    notePlaceholder: "Add a note (optional)",
    send: "Send",
    sent: "Sent!",
    sending: "Sending...",
    sendError: "Failed to send. Try again.",
    whatsappBtn: "Open WhatsApp",
    whatsappHint: "Opens WhatsApp with a pre-filled summary. You choose the recipient.",
    waIntro: "Check out my project",
    waItems: "items",
    waTotal: "total",
    waFrom: "From Counter Cultures.",
  },
  es: {
    share: "Compartir Proyecto",
    hint: "Envía el contenido del proyecto por correo o comparte un resumen por WhatsApp.",
    emailTab: "Correo",
    whatsappTab: "WhatsApp",
    emailPlaceholder: "Correo del destinatario",
    namePlaceholder: "Tu nombre (opcional)",
    notePlaceholder: "Agrega una nota (opcional)",
    send: "Enviar",
    sent: "Enviado!",
    sending: "Enviando...",
    sendError: "Error al enviar. Intenta de nuevo.",
    whatsappBtn: "Abrir WhatsApp",
    whatsappHint: "Abre WhatsApp con un resumen. Tú eliges al destinatario.",
    waIntro: "Mira mi proyecto",
    waItems: "artículos",
    waTotal: "total",
    waFrom: "De Counter Cultures.",
  },
};

interface ShareProjectButtonProps {
  project: Project;
  subtotal: number;
  locale: "en" | "es";
}

export const ShareProjectButton = ({
  project,
  subtotal,
  locale,
}: ShareProjectButtonProps) => {
  const t = T[locale];
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"email" | "whatsapp">("email");
  const [emailTo, setEmailTo] = useState("");
  const [senderName, setSenderName] = useState("");
  const [note, setNote] = useState("");
  const [emailState, setEmailState] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");

  const currency = project.items[0]?.currency ?? "MXN";
  const { total } = computeIva(subtotal, "MX");

  const fmtPrice = (amount: number) =>
    new Intl.NumberFormat(locale === "es" ? "es-MX" : "en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const whatsappText = `${t.waIntro} "${project.name}" — ${project.items.length} ${t.waItems}, ${fmtPrice(total)} ${t.waTotal}. ${t.waFrom}`;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;

  const handleSendEmail = async () => {
    const trimmed = emailTo.trim();
    if (!trimmed) return;
    setEmailState("sending");
    try {
      const res = await fetch(`/api/projects/${project.id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          locale,
          senderName: senderName.trim() || undefined,
          note: note.trim() || undefined,
          projectName: project.name,
          items: project.items.map((i) => ({
            name: i.name,
            brand: i.brand,
            sku: i.sku,
            qty: i.qty,
            unitPrice: i.unitPrice,
            currency: i.currency,
            imageSrc: i.imageSrc,
          })),
          subtotal,
          currency,
        }),
      });
      if (res.ok) {
        setEmailState("sent");
        setTimeout(() => {
          setEmailState("idle");
          setEmailTo("");
          setNote("");
        }, 3000);
      } else {
        setEmailState("error");
      }
    } catch {
      setEmailState("error");
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full py-3.5 border border-dash-border text-brand-charcoal text-sm font-body font-medium rounded-lg hover:border-brand-copper/40 hover:text-brand-copper transition-colors cursor-pointer flex items-center justify-center gap-2"
      >
        <Share2 className="w-4 h-4" />
        {t.share}
      </button>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-dash-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-light text-brand-charcoal">
          {t.share}
        </h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-dash-text-secondary hover:text-brand-charcoal cursor-pointer font-body"
        >
          ✕
        </button>
      </div>
      <p className="font-body text-xs text-dash-text-secondary leading-relaxed">
        {t.hint}
      </p>

      {/* Tab switcher */}
      <div className="flex border-b border-dash-border">
        <button
          type="button"
          onClick={() => setTab("email")}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-body font-medium cursor-pointer transition-colors ${
            tab === "email"
              ? "text-brand-copper border-b-2 border-brand-copper"
              : "text-dash-text-secondary hover:text-brand-charcoal"
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          {t.emailTab}
        </button>
        <button
          type="button"
          onClick={() => setTab("whatsapp")}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-body font-medium cursor-pointer transition-colors ${
            tab === "whatsapp"
              ? "text-brand-copper border-b-2 border-brand-copper"
              : "text-dash-text-secondary hover:text-brand-charcoal"
          }`}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          {t.whatsappTab}
        </button>
      </div>

      {/* Email tab */}
      {tab === "email" && (
        <div className="space-y-3">
          <input
            type="email"
            value={emailTo}
            onChange={(e) => {
              setEmailTo(e.target.value);
              if (emailState === "error") setEmailState("idle");
            }}
            placeholder={t.emailPlaceholder}
            className="w-full px-3 py-2.5 text-sm border border-dash-border rounded-lg focus:outline-none focus:border-brand-copper font-body"
          />
          <input
            type="text"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            placeholder={t.namePlaceholder}
            className="w-full px-3 py-2.5 text-sm border border-dash-border rounded-lg focus:outline-none focus:border-brand-copper font-body"
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t.notePlaceholder}
            rows={2}
            className="w-full px-3 py-2.5 text-sm border border-dash-border rounded-lg focus:outline-none focus:border-brand-copper font-body resize-none"
          />
          <button
            type="button"
            onClick={handleSendEmail}
            disabled={
              !emailTo.trim() ||
              emailState === "sending" ||
              emailState === "sent"
            }
            className="w-full py-3 bg-brand-copper text-white text-sm font-body font-medium rounded-lg hover:bg-brand-copper-dark disabled:opacity-50 cursor-pointer disabled:cursor-default transition-colors flex items-center justify-center gap-2"
          >
            {emailState === "sending" && (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
            {emailState === "sent" && <Check className="w-4 h-4" />}
            {emailState === "sending"
              ? t.sending
              : emailState === "sent"
                ? t.sent
                : t.send}
          </button>
          {emailState === "error" && (
            <p className="font-body text-xs text-dash-danger">{t.sendError}</p>
          )}
        </div>
      )}

      {/* WhatsApp tab */}
      {tab === "whatsapp" && (
        <div className="space-y-3">
          <p className="font-body text-xs text-dash-text-secondary leading-relaxed">
            {t.whatsappHint}
          </p>
          <div className="bg-brand-linen rounded-lg p-3">
            <p className="font-body text-xs text-brand-charcoal italic leading-relaxed">
              &ldquo;{whatsappText}&rdquo;
            </p>
          </div>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 bg-vendor-whatsapp text-white text-sm font-body font-medium rounded-lg hover:bg-vendor-whatsapp/90 transition-colors flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            {t.whatsappBtn}
          </a>
        </div>
      )}
    </div>
  );
};
