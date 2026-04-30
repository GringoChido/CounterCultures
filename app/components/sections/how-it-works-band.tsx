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
        body: "Send a piece, a SKU, or a list. We confirm price, lead time, and finishes within one business day. Some pieces are in stock at the showroom; most ship factory-direct.",
      },
      {
        title: "Deposit to start",
        body: "Once you approve the quote, a deposit of 70% (or more, depending on the brand and order) reserves the order. We place it direct with the manufacturer the same day.",
      },
      {
        title: "Balance when ready",
        body: "When the order is built and ready to ship, we send the balance request. After balance clears we deliver — factory-direct across Mexico, white-glove on request.",
      },
    ],
  },
  es: {
    eyebrow: "Cómo funciona",
    headline: "De la consulta a la instalación — un solo equipo, sin fricción.",
    items: [
      {
        title: "Cotización en 24 horas",
        body: "Envíanos una pieza, un SKU o una lista. Confirmamos precio, tiempo de entrega y acabados en un día hábil. Algunas piezas están en showroom; la mayoría se envían directo de fábrica.",
      },
      {
        title: "Anticipo para iniciar",
        body: "Al aprobar la cotización, un anticipo desde 70% (o más, según la marca y el pedido) reserva la orden. La colocamos directo con el fabricante el mismo día.",
      },
      {
        title: "Saldo al estar listo",
        body: "Cuando el pedido está listo para enviarse, te solicitamos el saldo. Una vez liquidado, entregamos — directo de fábrica en toda la República. Servicio premium bajo solicitud.",
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
          : "bg-dash-surface text-brand-charcoal border-y border-brand-stone/15"
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
                  isDark ? "bg-brand-charcoal" : "bg-dash-surface"
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
                    isDark ? "text-white/70" : "text-dash-text-secondary"
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
