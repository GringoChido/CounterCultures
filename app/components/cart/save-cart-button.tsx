"use client";

import { useState } from "react";
import { Bookmark, Mail, MessageCircle, Link2, Check, Loader2 } from "lucide-react";
import { useCartStore } from "@/app/lib/stores/cart-store";

const T = {
  en: {
    label: "Save or share",
    hint: "Send a branded email to yourself or a collaborator, share via WhatsApp, or copy a link.",
    emailPlaceholder: "Email address",
    send: "Send",
    sent: "Sent!",
    sending: "Sending...",
    sendError: "Failed to send. Try again.",
    whatsapp: "Send via WhatsApp",
    copy: "Copy shareable link",
    copied: "Link copied",
    waIntro: "My Counter Cultures cart:",
    each: "each",
  },
  es: {
    label: "Guardar o compartir",
    hint: "Envía un correo con diseño a tu correo o a un colaborador, comparte por WhatsApp, o copia un enlace.",
    emailPlaceholder: "Correo electrónico",
    send: "Enviar",
    sent: "Enviado!",
    sending: "Enviando...",
    sendError: "Error al enviar. Intenta de nuevo.",
    whatsapp: "Enviar por WhatsApp",
    copy: "Copiar enlace para compartir",
    copied: "Enlace copiado",
    waIntro: "Mi carrito de Counter Cultures:",
    each: "c/u",
  },
};

interface SaveCartButtonProps {
  locale: "en" | "es";
}

export const SaveCartButton = ({ locale }: SaveCartButtonProps) => {
  const t = T[locale];
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const tradeCode = useCartStore((s) => s.tradeCode);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailState, setEmailState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const currency = items[0]?.currency ?? "MXN";
  const formatted = (amount: number) =>
    new Intl.NumberFormat(locale === "es" ? "es-MX" : "en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  if (items.length === 0) return null;

  const shareUrl = (() => {
    if (typeof window === "undefined") return "";
    const payload = {
      v: 1,
      items: items.map((i) => ({
        id: i.id,
        sku: i.sku,
        q: i.quantity,
        f: i.selectedFinish ?? null,
      })),
      trade: tradeCode ?? null,
    };
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    return `${window.location.origin}/${locale}/cart#cart=${encoded}`;
  })();

  const itemList = items
    .map((i) => {
      const finish = i.selectedFinish ? ` — ${i.selectedFinish}` : "";
      const each =
        i.quantity > 1 ? ` (${formatted(i.listPrice)} ${t.each})` : "";
      return `· ${i.name}${finish} ×${i.quantity} — ${formatted(i.listPrice * i.quantity)}${each}`;
    })
    .join("\n");

  const totalLine = `\nSubtotal: ${formatted(subtotal)}`;

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(
    `${t.waIntro}\n\n${itemList}${totalLine}\n\n${shareUrl}`
  )}`;

  const handleSendEmail = async () => {
    const trimmed = emailTo.trim();
    if (!trimmed) return;
    setEmailState("sending");
    try {
      const res = await fetch("/api/cart/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: trimmed,
          locale,
          items: items.map((i) => ({
            name: i.name,
            brand: i.brand,
            sku: i.sku,
            quantity: i.quantity,
            unitPrice: i.tradePrice && i.tradePrice > 0 ? i.tradePrice : i.listPrice,
            currency: i.currency,
            imageSrc: i.imageSrc,
            selectedFinish: i.selectedFinish,
          })),
          subtotal,
          currency,
          shareUrl,
        }),
      });
      if (res.ok) {
        setEmailState("sent");
        setTimeout(() => {
          setEmailState("idle");
          setEmailTo("");
        }, 3000);
      } else {
        setEmailState("error");
      }
    } catch {
      setEmailState("error");
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt(t.copy, shareUrl);
    }
  };

  return (
    <details
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
      className="cc-surface-card group"
    >
      <summary className="px-4 py-3 cursor-pointer flex items-center justify-between list-none">
        <div className="flex items-center gap-2.5">
          <Bookmark className="w-4 h-4 text-brand-copper" />
          <span className="font-body text-sm font-medium text-brand-charcoal">
            {t.label}
          </span>
        </div>
        <span className="font-body text-xs text-dash-text-secondary group-open:hidden">
          +
        </span>
        <span className="font-body text-xs text-dash-text-secondary hidden group-open:inline">
          −
        </span>
      </summary>

      <div className="px-4 pb-4 pt-1">
        <p className="font-body text-xs text-dash-text-secondary leading-relaxed mb-4">
          {t.hint}
        </p>

        {/* Email input + send */}
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-copper" />
            <input
              type="email"
              value={emailTo}
              onChange={(e) => {
                setEmailTo(e.target.value);
                if (emailState === "error") setEmailState("idle");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSendEmail()}
              placeholder={t.emailPlaceholder}
              className="w-full pl-9 pr-3 py-2.5 border border-brand-stone/25 font-body text-xs text-brand-charcoal placeholder:text-dash-text-secondary/50 focus:outline-none focus:border-brand-copper transition-colors"
            />
          </div>
          <button
            type="button"
            onClick={handleSendEmail}
            disabled={!emailTo.trim() || emailState === "sending" || emailState === "sent"}
            className="px-4 py-2.5 bg-brand-copper text-white font-body text-xs font-medium hover:bg-brand-copper/90 disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-default flex items-center gap-1.5 shrink-0"
          >
            {emailState === "sending" && <Loader2 className="w-3 h-3 animate-spin" />}
            {emailState === "sent" && <Check className="w-3 h-3" />}
            {emailState === "sending" ? t.sending : emailState === "sent" ? t.sent : t.send}
          </button>
        </div>
        {emailState === "error" && (
          <p className="font-body text-xs text-red-600 mb-3">{t.sendError}</p>
        )}

        {/* WhatsApp + Copy link */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-3 py-2.5 border border-brand-stone/25 hover:border-brand-charcoal/60 transition-colors font-body text-xs font-medium text-brand-charcoal cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5 text-vendor-whatsapp" />
            {t.whatsapp}
          </a>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 px-3 py-2.5 border border-brand-stone/25 hover:border-brand-charcoal/60 transition-colors font-body text-xs font-medium text-brand-charcoal cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-brand-sage" />
                {t.copied}
              </>
            ) : (
              <>
                <Link2 className="w-3.5 h-3.5 text-brand-copper" />
                {t.copy}
              </>
            )}
          </button>
        </div>
      </div>
    </details>
  );
};
