import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AnimatedSection } from "@/app/components/ui/animated-section";
import { HOTEL_CLIENTS, HOTEL_REGIONS } from "@/app/lib/hotel-clients";

const FEATURED_SLUGS = [
  "belmond-sierra-nevada",
  "rosewood-sma",
  "one-only-palmilla",
  "four-seasons-caye-chapel",
];

const HospitalityTeaser = ({ locale = "en" }: { locale?: string }) => {
  const lang = locale as "en" | "es";
  const isEs = lang === "es";
  const t = (en: string, es: string) => (isEs ? es : en);

  const featured = FEATURED_SLUGS.map((slug) =>
    HOTEL_CLIENTS.find((h) => h.slug === slug)
  ).filter((h): h is NonNullable<typeof h> => Boolean(h));
  const remaining = HOTEL_CLIENTS.length - featured.length;

  return (
    <section className="py-16 md:py-28 bg-brand-linen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header — editorial split */}
        <AnimatedSection>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-end mb-10 md:mb-14">
            <div className="lg:col-span-8">
              <span className="font-body font-semibold text-[11px] tracking-[0.32em] text-brand-terracotta uppercase">
                {t("Trusted By", "Elegidos Por")}
              </span>
              <h2 className="mt-4 font-display text-3xl md:text-5xl lg:text-[3.25rem] font-light tracking-wide text-brand-charcoal leading-[1.05]">
                {t(
                  "Mexico's hospitality leaders.",
                  "Líderes de hospitalidad en México."
                )}
              </h2>
              <p className="mt-5 font-body text-base text-dash-text-secondary leading-relaxed max-w-xl">
                {t(
                  "Hotels and residences across Mexico — each one has chosen Counter Cultures to specify their fixtures.",
                  "Hoteles y residencias en todo México — cada uno ha elegido a Counter Cultures para especificar sus accesorios."
                )}
              </p>
            </div>
            <div className="lg:col-span-4 lg:text-right">
              <Link
                href={`/${lang}/hospitality`}
                className="group inline-flex items-center gap-3 font-body text-sm font-semibold tracking-[0.18em] uppercase text-brand-charcoal hover:text-brand-terracotta transition-colors"
              >
                {t("See All Properties", "Ver Todas las Propiedades")}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </AnimatedSection>

        {/* Gallery — 4 LARGE image-led tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {featured.map((hotel, i) => (
            <AnimatedSection key={hotel.slug} delay={i * 0.08}>
              <a
                href={hotel.website}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${hotel.name}, ${hotel.location[lang]} (opens in new tab)`}
                className="group relative block aspect-[4/5] rounded-lg overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-copper"
              >
                <Image
                  src={hotel.heroImage}
                  alt={`${hotel.name}, ${hotel.location[lang]}`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                <div className="absolute top-4 left-4">
                  <span className="inline-block font-mono text-[10px] tracking-[0.22em] uppercase text-white/95 bg-brand-charcoal/40 backdrop-blur-sm px-2.5 py-1 rounded-sm">
                    {HOTEL_REGIONS[hotel.region][lang]}
                  </span>
                </div>
                <div className="absolute bottom-5 left-5 right-5 text-white">
                  <h3 className="font-display text-xl md:text-2xl leading-tight">
                    {hotel.name}
                  </h3>
                  <p className="mt-1.5 font-body text-sm text-white/80">
                    {hotel.location[lang]}
                  </p>
                </div>
              </a>
            </AnimatedSection>
          ))}
        </div>

        {/* + N more */}
        {remaining > 0 && (
          <AnimatedSection delay={0.3}>
            <div className="mt-8 md:mt-10 text-center md:text-left">
              <Link
                href={`/${lang}/hospitality`}
                className="group inline-flex items-center gap-2 font-body text-sm text-dash-text-secondary hover:text-brand-terracotta transition-colors"
              >
                + {remaining} {t("more properties", "propiedades más")}
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </AnimatedSection>
        )}
      </div>
    </section>
  );
};

export { HospitalityTeaser };
