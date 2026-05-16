import { Link } from "@/app/i18n/navigation";

interface TwoPathsBandProps {
  locale: "en" | "es";
}

/**
 * Two side-by-side conversion paths on a dark band — Visit the showroom
 * + Trade Program. Same charcoal background, copper eyebrow, hover wash.
 */
const TwoPathsBand = ({ locale }: TwoPathsBandProps) => {
  const isEs = locale === "es";
  return (
    <section className="py-14 md:py-20 bg-brand-charcoal text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-px bg-white/10">
          <Link
            href="/showroom"
            className="group bg-brand-charcoal p-8 md:p-12 hover:bg-brand-charcoal/80 transition-colors"
          >
            <p className="font-body font-semibold text-[11px] tracking-[0.25em] text-brand-copper uppercase mb-3">
              {isEs ? "Visítanos" : "Visit us"}
            </p>
            <h3 className="font-display text-2xl md:text-4xl font-light tracking-wide leading-tight mb-4">
              {isEs
                ? "Conoce el showroom en San Miguel."
                : "Visit the San Miguel showroom."}
            </h3>
            <p className="font-body text-sm md:text-base text-white/70 leading-relaxed mb-6 max-w-md">
              {isEs
                ? "Acabados, dimensiones y combinaciones que es difícil decidir desde una pantalla. Lunes a viernes, en Providencia."
                : "Finishes, dimensions, and combinations are hard to commit to from a screen. Monday–Friday, in Providencia."}
            </p>
            <span className="inline-flex items-center gap-2 font-body text-sm font-semibold tracking-wide text-brand-copper group-hover:text-white transition-colors">
              {isEs ? "Cómo llegar" : "Get directions"} →
            </span>
          </Link>

          <Link
            href="/trade"
            className="group bg-brand-charcoal p-8 md:p-12 hover:bg-brand-charcoal/80 transition-colors"
          >
            <p className="font-body font-semibold text-[11px] tracking-[0.25em] text-brand-copper uppercase mb-3">
              {isEs ? "Para arquitectos y diseñadores" : "For architects & designers"}
            </p>
            <h3 className="font-display text-2xl md:text-4xl font-light tracking-wide leading-tight mb-4">
              {isEs
                ? "Programa Trade — precios y soporte de especificación."
                : "Trade Program — pricing and specification support."}
            </h3>
            <p className="font-body text-sm md:text-base text-white/70 leading-relaxed mb-6 max-w-md">
              {isEs
                ? "Precios trade en las 19 marcas autorizadas, gerente de cuenta dedicado, presentaciones privadas para clientes. Aprobación en 48 horas."
                : "Trade pricing across 19 authorized brands, a dedicated account manager, and private client presentations. Approval within 48 hours."}
            </p>
            <span className="inline-flex items-center gap-2 font-body text-sm font-semibold tracking-wide text-brand-copper group-hover:text-white transition-colors">
              {isEs ? "Solicitar acceso" : "Apply for access"} →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export { TwoPathsBand };
