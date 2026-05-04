import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { AnimatedSection } from "@/app/components/ui/animated-section";
import { HOTEL_CLIENTS, HOTEL_REGIONS } from "@/app/lib/hotel-clients";

const ProjectGallery = ({ locale = "en" }: { locale?: string }) => {
  const lang = locale as "en" | "es";

  // Lead with the first property as a 2x2 magazine tile, the rest fall into
  // the standard grid. Same editorial rhythm as before, real clients now.
  const [featured, ...rest] = HOTEL_CLIENTS;

  return (
    <section className="py-14 md:py-32 bg-brand-linen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatedSection>
          <h2 className="text-center font-display text-3xl md:text-5xl font-normal tracking-wide text-brand-charcoal mb-4">
            {locale === "en"
              ? "Trusted by Mexico's hospitality leaders"
              : "Elegidos por los líderes de hospitalidad en México"}
          </h2>
          <p className="text-center font-body text-dash-text-secondary mb-12 max-w-2xl mx-auto">
            {locale === "en"
              ? "Properties across San Miguel de Allende, Los Cabos, and the Riviera Maya that have specified Counter Cultures."
              : "Propiedades en San Miguel de Allende, Los Cabos y la Riviera Maya que han especificado Counter Cultures."}
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {featured && (
            <AnimatedSection className="sm:col-span-2 lg:col-span-2 lg:row-span-2">
              <a
                href={featured.website}
                target="_blank"
                rel="noopener noreferrer"
                className="group block rounded-lg overflow-hidden h-full"
                aria-label={`${featured.name}, ${featured.location[lang]} (opens in new tab)`}
              >
                <div className="relative aspect-[16/10] sm:aspect-[16/9] lg:aspect-auto lg:h-full overflow-hidden">
                  <Image
                    src={featured.heroImage}
                    alt={`${featured.name}, ${featured.location[lang]}`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 100vw, 66vw"
                    className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
                  <div className="absolute top-5 left-5">
                    <span className="inline-block font-mono text-[10px] tracking-[0.2em] uppercase text-white/90 bg-brand-copper/85 px-2.5 py-1 rounded-sm">
                      {HOTEL_REGIONS[featured.region][lang]}
                    </span>
                  </div>
                  <div className="absolute bottom-6 left-6 right-6 text-white">
                    <h3 className="font-display text-2xl md:text-3xl lg:text-4xl font-light leading-tight">
                      {featured.name}
                    </h3>
                    <p className="font-mono text-xs md:text-sm text-brand-copper mt-2 inline-flex items-center gap-1.5">
                      {locale === "en" ? "Visit hotel" : "Visitar hotel"}
                      <ExternalLink className="w-3 h-3" />
                    </p>
                  </div>
                </div>
              </a>
            </AnimatedSection>
          )}

          {rest.map((hotel, i) => (
            <AnimatedSection key={hotel.slug} delay={i * 0.06}>
              <a
                href={hotel.website}
                target="_blank"
                rel="noopener noreferrer"
                className="group block rounded-lg overflow-hidden"
                aria-label={`${hotel.name}, ${hotel.location[lang]} (opens in new tab)`}
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={hotel.heroImage}
                    alt={`${hotel.name}, ${hotel.location[lang]}`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span className="inline-block font-mono text-[9px] tracking-[0.2em] uppercase text-white/85 bg-black/40 px-2 py-0.5 rounded-sm backdrop-blur-sm">
                      {HOTEL_REGIONS[hotel.region][lang]}
                    </span>
                  </div>
                  <div className="absolute bottom-5 left-5 right-5 text-white">
                    <h3 className="font-display text-xl leading-tight">
                      {hotel.name}
                    </h3>
                    <p className="font-mono text-xs text-brand-copper mt-1.5 inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {locale === "en" ? "Visit hotel" : "Visitar hotel"}
                      <ExternalLink className="w-3 h-3" />
                    </p>
                  </div>
                </div>
              </a>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};

export { ProjectGallery };
