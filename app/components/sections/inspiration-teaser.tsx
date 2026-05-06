import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AnimatedSection } from "@/app/components/ui/animated-section";
import { PROJECTS } from "@/app/lib/projects";

const InspirationTeaser = ({ locale = "en" }: { locale?: string }) => {
  const lang = locale as "en" | "es";
  const isEs = lang === "es";
  const t = (en: string, es: string) => (isEs ? es : en);

  // Curated four-project collage — picked for visual range
  const featured = [
    PROJECTS.find((p) => p.slug === "casa-atelier"),
    PROJECTS.find((p) => p.slug === "boutique-hotel-cantera"),
    PROJECTS.find((p) => p.slug === "residencia-el-charco"),
    PROJECTS.find((p) => p.slug === "restaurante-lumbre"),
  ].filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <section className="py-16 md:py-32 bg-brand-linen overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Copy block — restrained, evocative */}
          <AnimatedSection className="lg:col-span-4 lg:order-1 order-2 lg:pr-4">
            <span className="font-body font-semibold text-[11px] tracking-[0.32em] text-brand-terracotta uppercase">
              {t("Inspiration", "Inspiración")}
            </span>
            <h2 className="mt-5 font-display text-3xl md:text-4xl font-light tracking-wide text-brand-charcoal leading-[1.1]">
              {t(
                "Make the room unforgettable.",
                "Crea una habitación inolvidable."
              )}
            </h2>
            <p className="mt-5 font-body text-base text-dash-text-secondary leading-relaxed max-w-sm">
              {t(
                "Modern, curated, sourced piece by piece. Brizo over hand-hammered copper. Bronze on mesquite. The suite people come back for, the powder room you'd photograph. Whatever you're picturing — we help you build it.",
                "Moderno, curado, abastecido pieza por pieza. Brizo sobre cobre martillado. Bronce sobre mezquite. La suite a la que regresan, el medio baño que fotografiarías. Lo que sea que estés imaginando — te ayudamos a construirlo."
              )}
            </p>
            <div className="mt-8">
              <Link
                href={`/${lang}/inspiration`}
                className="group inline-flex items-center gap-3 font-body text-sm font-semibold tracking-[0.18em] uppercase text-brand-charcoal hover:text-brand-terracotta transition-colors"
              >
                {t("Explore the Work", "Explorar el Trabajo")}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </AnimatedSection>

          {/* Editorial collage — staggered 4-image grid */}
          <AnimatedSection delay={0.15} className="lg:col-span-8 lg:order-2 order-1">
            <Link
              href={`/${lang}/inspiration`}
              aria-label={t("Explore inspiration", "Explorar inspiración")}
              className="block group"
            >
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                {/* Tall left tile */}
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-brand-stone/10">
                  <Image
                    src={featured[0].heroImage}
                    alt={featured[0].title}
                    fill
                    sizes="(max-width: 1024px) 50vw, 30vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <p className="font-mono text-[9px] tracking-[0.2em] uppercase opacity-80">
                      {featured[0].location[lang]}
                    </p>
                    <p className="font-display text-base md:text-lg leading-tight">
                      {featured[0].title}
                    </p>
                  </div>
                </div>

                {/* Right column — two stacked tiles */}
                <div className="grid grid-rows-2 gap-3 md:gap-4">
                  <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-brand-stone/10">
                    <Image
                      src={featured[1].heroImage}
                      alt={featured[1].title}
                      fill
                      sizes="(max-width: 1024px) 50vw, 30vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <p className="font-mono text-[9px] tracking-[0.2em] uppercase opacity-80">
                        {featured[1].location[lang]}
                      </p>
                      <p className="font-display text-base md:text-lg leading-tight">
                        {featured[1].title}
                      </p>
                    </div>
                  </div>
                  <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-brand-stone/10">
                    <Image
                      src={featured[2].heroImage}
                      alt={featured[2].title}
                      fill
                      sizes="(max-width: 1024px) 50vw, 30vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <p className="font-mono text-[9px] tracking-[0.2em] uppercase opacity-80">
                        {featured[2].location[lang]}
                      </p>
                      <p className="font-display text-base md:text-lg leading-tight">
                        {featured[2].title}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Wide bottom tile */}
              <div className="mt-3 md:mt-4 relative aspect-[16/7] rounded-lg overflow-hidden bg-brand-stone/10">
                <Image
                  src={featured[3].heroImage}
                  alt={featured[3].title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <p className="font-mono text-[9px] tracking-[0.2em] uppercase opacity-80">
                    {featured[3].location[lang]}
                  </p>
                  <p className="font-display text-lg md:text-2xl leading-tight">
                    {featured[3].title}
                  </p>
                </div>
              </div>
            </Link>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
};

export { InspirationTeaser };
