"use client";

import { useState } from "react";
import { Bookmark, Mail, MessageCircle, Link2, Check } from "lucide-react";
import { useCartStore } from "@/app/lib/stores/cart-store";

/**
 * "Save / Share this cart" — pure client-side share, no backend.
 *
 * MX high-ticket buying is rarely a solo decision. Architects spec for
 * clients, couples consult before committing, and design teams pass
 * options around on WhatsApp. This button gives the customer three
 * lightweight ways to escape the funnel without abandoning the cart:
 *
 *   1. Email it to themselves (mailto: with itemized list)
 *   2. Send via WhatsApp (wa.me with summary text)
 *   3. Copy a shareable link to clipboard
 *
 * Cart contents are encoded into the URL hash so when someone opens the
 * link, the items are reconstituted client-side. No server needed.
 */

const T = {
  en: {
    label: "Save or share",
    title: "Save this cart",
    hint: "Send a copy to yourself or a collaborator. The link reopens this exact selection.",
    email: "Email to me",
    whatsapp: "Send via WhatsApp",
    copy: "Copy shareable link",
    copied: "Link copied",
    subject: "My Counter Cultures selection",
    bodyIntro: "Hi, here's the selection I'm reviewing from Counter Cultures:",
    bodyOutro: "Reopen the cart:",
    waIntro: "My Counter Cultures cart:",
    each: "each",
    close: "Close",
  },
  es: {
    label: "Guardar o compartir",
    title: "Guarda este carrito",
    hint: "Envíalo a tu correo o a un colaborador. El enlace abre esta misma selección.",
    email: "Enviar a mi correo",
    whatsapp: "Enviar por WhatsApp",
    copy: "Copiar enlace para compartir",
    copied: "Enlace copiado",
    subject: "Mi selección de Counter Cultures",
    bodyIntro: "Hola, esta es la selección que estoy revisando de Counter Cultures:",
    bodyOutro: "Volver a abrir el carrito:",
    waIntro: "Mi carrito de Counter Cultures:",
    each: "c/u",
    close: "Cerrar",
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

  const currency = items[0]?.currency ?? "MXN";
  const formatted = (amount: number) =>
    new Intl.NumberFormat(locale === "es" ? "es-MX" : "en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  if (items.length === 0) return null;

  // Compose share artifacts.
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

  const totalLine = `\n${locale === "es" ? "Subtotal" : "Subtotal"}: ${formatted(subtotal)}`;

  const emailHref = `mailto:?subject=${encodeURIComponent(t.subject)}&body=${encodeURIComponent(
    `${t.bodyIntro}\n\n${itemList}${totalLine}\n\n${t.bodyOutro}\n${shareUrl}`
  )}`;

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(
    `${t.waIntro}\n\n${itemList}${totalLine}\n\n${shareUrl}`
  )}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback: select-and-prompt
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <a
            href={emailHref}
            className="flex items-center justify-center gap-2 px-3 py-2.5 border border-brand-stone/25 hover:border-brand-charcoal/60 transition-colors font-body text-xs font-medium text-brand-charcoal cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5 text-brand-copper" />
            {t.email}
          </a>
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
