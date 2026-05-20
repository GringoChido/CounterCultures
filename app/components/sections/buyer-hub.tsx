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

type TileKind = "locale" | "raw" | "external" | "pdf";

const tiles: {
  icon: typeof FolderPlus;
  label: { en: string; es: string };
  desc: { en: string; es: string };
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
    href: "/account/projects?src=hub_start_project",
    kind: "raw",
  },
  {
    icon: BadgeCheck,
    label: { en: "Apply for Trade", es: "Solicitar Trade" },
    desc: {
      en: "Exclusive pricing for professionals",
      es: "Precios exclusivos para profesionales",
    },
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
      <section className="py-14 md:py-20 bg-brand-charcoal">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <p className="font-body font-semibold text-[11px] tracking-[0.25em] text-brand-copper uppercase mb-3">
              {isEs ? "¿Cómo podemos ayudarte?" : "How can we help?"}
            </p>
            <h2 className="font-display text-2xl md:text-4xl font-light tracking-wide text-white mb-10 md:mb-14">
              {isEs
                ? "Tu punto de partida."
                : "Your starting point."}
            </h2>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10">
            {tiles.map((tile, i) => {
              const Icon = tile.icon;
              const label = tile.label[locale];
              const desc = tile.desc[locale];

              const ctaLabel =
                tile.kind === "pdf"
                  ? isEs ? "Subir archivo" : "Upload file"
                  : tile.kind === "external"
                    ? isEs ? "Abrir WhatsApp" : "Open WhatsApp"
                    : isEs ? "Continuar" : "Continue";

              const inner = (
                <AnimatedSection delay={i * 0.05}>
                  <div className="flex items-start gap-4">
                    <Icon className="w-5 h-5 text-brand-copper mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <h3 className="font-display text-lg md:text-xl font-light tracking-wide text-white leading-tight">
                        {label}
                      </h3>
                      <p className="mt-1.5 font-body text-sm text-white/60 leading-relaxed">
                        {desc}
                      </p>
                      <span className="inline-flex items-center gap-1.5 mt-4 font-body text-xs font-semibold tracking-wide text-brand-copper group-hover:text-white transition-colors">
                        {ctaLabel}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </AnimatedSection>
              );

              const cellClass =
                "group bg-brand-charcoal p-6 md:p-8 hover:bg-brand-charcoal/80 transition-colors cursor-pointer";

              if (tile.kind === "pdf") {
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

              if (tile.kind === "external") {
                return (
                  <a
                    key={i}
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cellClass}
                  >
                    {inner}
                  </a>
                );
              }

              if (tile.kind === "raw") {
                return (
                  <NextLink key={i} href={tile.href} className={cellClass}>
                    {inner}
                  </NextLink>
                );
              }

              return (
                <Link key={i} href={tile.href} className={cellClass}>
                  {inner}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

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
