"use client";

import { MessageCircle } from "lucide-react";
import { SITE_CONFIG } from "@/app/lib/constants";

const WA_NUMBER = SITE_CONFIG.showroom.whatsapp.replace(/\s+/g, "");

const GREETINGS = {
  en: "Hi, I'd like to learn more about Counter Cultures",
  es: "Hola, me interesa conocer más sobre Counter Cultures",
} as const;

const ARIA_LABELS = {
  en: "Chat with us on WhatsApp",
  es: "Escríbenos por WhatsApp",
} as const;

const WhatsAppFloat = ({ locale }: { locale: string }) => {
  const lang = locale === "es" ? "es" : "en";
  const greeting = `${GREETINGS[lang]} [src=whatsapp_float]`;
  const href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(greeting)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ARIA_LABELS[lang]}
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-terracotta text-white shadow-lg transition-colors hover:bg-brand-copper"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
};

export { WhatsAppFloat };
