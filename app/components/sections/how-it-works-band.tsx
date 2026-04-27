import { Clock, Wallet, Truck } from "lucide-react";

interface HowItWorksBandProps {
  locale: "en" | "es";
  variant?: "light" | "dark";
  /** Optional override for the eyebrow text (one per locale). */
  eyebrow?: { en: string; es: string };
  /** Optional override for the headline (one per locale). */
  headline?: { en: string; es: string };
}

const COPY = {
  en: {
    eyebrow: "How it works",
    headline: "From inquiry to install — one team, no friction.",
    items: [
      {
        title: "24-hour quote",
        body: "Send a piece, a SKU, or a list. We confirm price, lead time, and finishes within one business day.",
      },
      {
        title: "50% deposit",
        body: "We place the order direct with the manufacturer. Balance due before delivery.",
      },
      {
        title: "We deliver",
        body: "Factory-direct shipping to your project across Mexico. White-glove on request.",
      },
    ],
  },
  es: {
    eyebrow: "Cómo funciona",
    headline: "De la consulta a la instalación — un solo equipo, sin fricción.",
    items: [
      {
        title: "Cotización en 24 horas",
        body: "Envíanos una pieza, un SKU o una lista. Confirmamos precio, tiempo de entrega y acabados en un día hábil.",
      },
      {
        title: "50% de anticipo",
        body: "Hacemos el pedido directo con el fabricante. El saldo se cubre antes de la entrega.",
      },
      {
        title: "Entregamos",
        body: "Envío directo de fábrica a tu proyecto en todo México. Servicio premium bajo solicitud.",
      },
    ],
  },
};

const ICONS = [Clock, Wallet, Truck] as const;

const HowItWorksBand = ({
  locale,
  variant = "light",
  eyebrow,
  headline,
}: HowItWorksBandProps) => {
  const t = COPY[locale];
  const isDark = variant === "dark";
  const eyebrowText = eyebrow ? eyebrow[locale] : t.eyebrow;
  const headlineText = headline ? headline[locale] : t.headline;

  return (
    <section
      className={
        isDark
          ? "bg-brand-charcoal text-white border-y border-white/10"
          : "bg-white text-brand-charcoal border-y border-brand-stone/15"
      }
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <div className="max-w-2xl mb-10 md:mb-12">
          <p
            className={`font-body font-semibold text-[11px] tracking-[0.25em] uppercase mb-3 ${
              isDark ? "text-brand-copper" : "text-brand-terracotta"
            }`}
          >
            {eyebrowText}
          </p>
          <h2 className="font-display text-2xl md:text-4xl font-light leading-tight">
            {headlineText}
          </h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-px bg-brand-stone/15 overflow-hidden">
          {t.items.map((item, i) => {
            const Icon = ICONS[i];
            return (
              <div
                key={item.title}
                className={`p-6 md:p-8 ${
                  isDark ? "bg-brand-charcoal" : "bg-white"
                }`}
              >
                <Icon
                  className={`w-5 h-5 mb-4 ${
                    isDark ? "text-brand-copper" : "text-brand-terracotta"
                  }`}
                />
                <h3 className="font-display text-lg md:text-xl font-light mb-2">
                  {item.title}
                </h3>
                <p
                  className={`font-body text-sm leading-relaxed ${
                    isDark ? "text-white/70" : "text-brand-stone"
                  }`}
                >
                  {item.body}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export { HowItWorksBand };
