"use client";

import { useState } from "react";
import { Link } from "@/app/i18n/navigation";
import NextLink from "next/link";
import {
  FolderPlus,
  BadgeCheck,
  FileText,
  MapPin,
  MessageCircle,
  CalendarCheck,
  ArrowRight,
} from "lucide-react";
import { AnimatedSection } from "@/app/components/ui/animated-section";
import { PdfDropModal } from "@/app/components/pdf-drop-modal";
import { SITE_CONFIG } from "@/app/lib/constants";
import { useCartStore } from "@/app/lib/stores/cart-store";

interface BuyerHubProps {
  locale: "en" | "es";
}

const WA_NUMBER = SITE_CONFIG.showroom.whatsapp.replace(/\s+/g, "");
const CONSULTATION_URL = process.env.NEXT_PUBLIC_CONSULTATION_BOOKING_URL ?? "";

type TileKind = "locale" | "raw" | "external" | "pdf";

const tiles: {
  icon: typeof FolderPlus;
  label: { en: string; es: string };
  desc: { en: string; es: string };
  cta: { en: string; es: string };
  href: string;
  kind: TileKind;
}[] = [
  {
    icon: FolderPlus,
    label: { en: "Start a Project", es: "Iniciar un Proyecto" },
    desc: {
      en: "Collect pieces, request a quote",
      es: "Reúne piezas, solicita cotización",
    },
    cta: { en: "Get Started", es: "Comenzar" },
    href: "/account/projects/new?src=hub_start_project",
    kind: "raw",
  },
  {
    icon: BadgeCheck,
    label: { en: "Apply for Trade", es: "Solicitar Trade" },
    desc: {
      en: "Exclusive pricing for professionals",
      es: "Precios exclusivos para profesionales",
    },
    cta: { en: "Apply Now", es: "Solicitar" },
    href: "/trade?src=hub_trade",
    kind: "locale",
  },
  {
    icon: FileText,
    label: { en: "Drop a Spec", es: "Sube una Especificación" },
    desc: {
      en: "Upload a PDF, we match your items",
      es: "Sube un PDF, encontramos tus piezas",
    },
    cta: { en: "Upload File", es: "Subir Archivo" },
    href: "",
    kind: "pdf",
  },
  {
    icon: MapPin,
    label: { en: "Visit the Showroom", es: "Visita el Showroom" },
    desc: {
      en: "San Miguel de Allende, by appointment",
      es: "San Miguel de Allende, con cita previa",
    },
    cta: { en: "Get Directions", es: "Cómo Llegar" },
    href: "/showroom?src=hub_showroom",
    kind: "locale",
  },
  {
    icon: MessageCircle,
    label: { en: "WhatsApp Us", es: "Escríbenos por WhatsApp" },
    desc: {
      en: "Quick answers, real people",
      es: "Respuestas rápidas, personas reales",
    },
    cta: { en: "Open WhatsApp", es: "Abrir WhatsApp" },
    href: "",
    kind: "external",
  },
  {
    icon: CalendarCheck,
    label: { en: "Schedule a Consultation", es: "Agenda una Consulta" },
    desc: {
      en: "We'll walk you through options",
      es: "Te guiamos entre las opciones",
    },
    cta: { en: "Book Now", es: "Agendar" },
    href: "/contact?src=hub_consult",
    kind: "locale",
  },
];

const BuyerHub = ({ locale }: BuyerHubProps) => {
  const [pdfOpen, setPdfOpen] = useState(false);
  const addToCart = useCartStore((s) => s.add);
  const isEs = locale === "es";

  const waGreeting = isEs
    ? "Hola, me interesa conocer más sobre Counter Cultures"
    : "Hi, I'd like to learn more about Counter Cultures";
  const waHref = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(waGreeting)}&src=hub_whatsapp`;

  return (
    <>
      <div className="mt-14 md:mt-20">
        <AnimatedSection>
          <p className="font-body font-semibold text-[11px] tracking-[0.25em] text-brand-copper uppercase mb-3">
            {isEs ? "¿Cómo podemos ayudarte?" : "How can we help?"}
          </p>
          <h2 className="font-display text-2xl md:text-4xl font-light tracking-wide text-brand-charcoal mb-10 md:mb-14">
            {isEs ? "Tu punto de partida." : "Your starting point."}
          </h2>
        </AnimatedSection>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {tiles.map((tile, i) => {
            const Icon = tile.icon;
            const label = tile.label[locale];
            const desc = tile.desc[locale];
            const ctaLabel = tile.cta[locale];

            // Consultation tile: override to external booking URL when configured
            const isConsultation = tile.icon === CalendarCheck;
            const effectiveKind: TileKind =
              isConsultation && CONSULTATION_URL ? "external" : tile.kind;
            const effectiveHref =
              isConsultation && CONSULTATION_URL
                ? `${CONSULTATION_URL}${CONSULTATION_URL.includes("?") ? "&" : "?"}src=hub_consultation`
                : tile.href;

            const inner = (
              <AnimatedSection delay={i * 0.05}>
                <div className="flex flex-col items-start">
                  <div className="w-11 h-11 md:w-[46px] md:h-[46px] rounded-full bg-brand-copper flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 md:w-[22px] md:h-[22px] text-white" strokeWidth={1.75} />
                  </div>
                  <h3 className="mt-4 font-display text-lg md:text-xl font-light tracking-wide text-brand-charcoal leading-tight">
                    {label}
                  </h3>
                  <p className="mt-1.5 font-body text-sm text-dash-text-secondary leading-relaxed">
                    {desc}
                  </p>
                  <span className="inline-flex items-center gap-1.5 mt-4 font-body text-[11px] font-semibold tracking-[0.15em] uppercase text-brand-copper group-hover:text-brand-charcoal transition-colors">
                    {ctaLabel}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </AnimatedSection>
            );

            const cellClass =
              "group bg-dash-surface rounded-lg cc-card p-6 md:p-7 cursor-pointer";

            if (effectiveKind === "pdf") {
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPdfOpen(true)}
                  className={`${cellClass} text-left`}
                >
                  {inner}
                </button>
              );
            }

            if (effectiveKind === "external") {
              const externalHref = tile.icon === MessageCircle ? waHref : effectiveHref;
              return (
                <a
                  key={i}
                  href={externalHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cellClass}
                >
                  {inner}
                </a>
              );
            }

            if (effectiveKind === "raw") {
              return (
                <NextLink key={i} href={effectiveHref} className={cellClass}>
                  {inner}
                </NextLink>
              );
            }

            return (
              <Link key={i} href={effectiveHref} className={cellClass}>
                {inner}
              </Link>
            );
          })}
        </div>
      </div>

      <PdfDropModal
        open={pdfOpen}
        onClose={() => setPdfOpen(false)}
        onCommit={async (results) => {
          for (const r of results) {
            addToCart({
              id: r.product.id,
              sku: r.product.sku,
              name: r.product.name,
              brand: r.product.brand,
              category: r.product.category,
              currency: (r.product.currency as "USD" | "MXN") ?? "USD",
              listPrice: r.product.listPrice ?? 0,
              quantity: r.quantity,
              selectedFinish: r.finish,
              imageSrc: r.product.imageSrc,
              productHref: `/shop/${r.product.category}/${r.product.sku}`,
              availability: "in-stock",
              buyable: r.product.saleOk ?? true,
            });
          }
          setPdfOpen(false);
        }}
        locale={locale}
      />
    </>
  );
};

export { BuyerHub };
