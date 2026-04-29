import Link from "next/link";
import Image from "next/image";
import { AnimatedSection } from "@/app/components/ui/animated-section";
import { ArrowRight } from "lucide-react";

const categories = [
  {
    title: { en: "Bathroom Fixtures", es: "Accesorios de Baño" },
    eyebrow: { en: "Explore", es: "Explorar" },
    count: {
      en: "Faucets · Sinks · Tubs · Toilets · Showers",
      es: "Grifos · Lavabos · Bañeras · Sanitarios · Regaderas",
    },
    href: "/shop/bathroom",
    image: "/images/home/browse-bathroom.webp",
  },
  {
    title: { en: "Kitchen Fixtures", es: "Accesorios de Cocina" },
    eyebrow: { en: "Explore", es: "Explorar" },
    count: {
      en: "Sinks · Faucets · Range Hoods · Appliances",
      es: "Tarjas · Mezcladoras · Campanas · Electrodomésticos",
    },
    href: "/shop/kitchen",
    image: "/images/home/browse-kitchen.webp",
  },
  {
    title: { en: "Door & Cabinet Hardware", es: "Chapas y Herrajes" },
    eyebrow: { en: "Explore", es: "Explorar" },
    count: {
      en: "Locks · Deadbolts · Pulls · Handles · Hooks",
      es: "Chapas · Cerrojos · Jaladeras · Manijas · Ganchos",
    },
    href: "/shop/hardware",
    image: "/images/home/browse-hardware.webp",
  },
];

const ShopByRoom = ({ locale: localeProp = "en" }: { locale?: string }) => {
  const locale = localeProp as "en" | "es";
  return (
  <section id="browse" className="py-14 md:py-32 bg-brand-linen scroll-mt-20">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <AnimatedSection>
        <h2 className="text-center font-display text-3xl md:text-5xl font-normal tracking-wide text-brand-charcoal mb-4">
          {locale === "en" ? "Explore Our Collection" : "Explora Nuestra Colección"}
        </h2>
        <p className="text-center font-body text-dash-text-secondary mb-8 md:mb-12 max-w-2xl mx-auto">
          {locale === "en"
            ? "Kitchen, bathroom, and architectural hardware from 19 authorized brands and Mexican artisans. Browse over 354,000 SKUs in the full catalog or explore our curated selection — delivery nationwide."
            : "Cocina, baño y herrajes arquitectónicos de 19 marcas autorizadas y artesanos mexicanos. Explora más de 354,000 SKUs en el catálogo completo o nuestra selección curada — entrega en todo el país."}
        </p>
      </AnimatedSection>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((cat, i) => (
          <AnimatedSection key={cat.href} delay={i * 0.12}>
            <Link href={cat.href} className="group block relative overflow-hidden rounded-lg">
              <div className="relative aspect-[4/5]">
                <Image
                  src={cat.image}
                  alt={cat.title[locale]}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8 flex items-end justify-between">
                <div>
                  <p className="font-body font-semibold text-xs uppercase tracking-wider text-brand-terracotta">
                    {cat.eyebrow[locale]}
                  </p>
                  <h3 className="mt-1 font-display text-2xl md:text-3xl font-light text-white tracking-wide">
                    {cat.title[locale]}
                  </h3>
                  <p className="mt-1 font-body text-sm text-white/70">
                    {cat.count[locale]}
                  </p>
                </div>
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-brand-terracotta text-white shrink-0 group-hover:bg-brand-terracotta-dark transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          </AnimatedSection>
        ))}
      </div>
    </div>
  </section>
  );
};

export { ShopByRoom };
