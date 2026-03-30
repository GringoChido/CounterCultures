"use client";

import Link from "next/link";
import Image from "next/image";
import { AnimatedSection } from "@/app/components/ui/animated-section";
import { Button } from "@/app/components/ui/button";

const featured = [
  {
    brand: "BLANCO",
    name: "Ikon 30\" Silgranit Apron Sink",
    price: "$39,341",
    finishes: ["Anthracite", "Blanco", "Cinder", "Truffle", "Gris Metálico", "Café", "Coal Negro", "Gris Volcánico"],
    href: "/shop/kitchen/sinks/blanco-ikon-30",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=75&auto=format",
    badge: "Kitchen",
    badgeColor: "bg-brand-charcoal",
  },
  {
    brand: "Brizo",
    name: "Litze Pull-Down Kitchen Faucet",
    price: "$28,500",
    finishes: ["Chrome", "Matte Black", "Polished Nickel", "Luxe Gold"],
    href: "/shop/kitchen/faucets/brizo-litze",
    image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=75&auto=format",
    badge: "New Arrival",
    badgeColor: "bg-brand-copper",
  },
  {
    brand: "Mistoa",
    name: "Lavabo Poas — Artisanal Basin",
    price: "$8,900",
    finishes: ["Gris Natural", "Arcilla", "Rosa Crudo", "Durazno", "Mostaza", "Menta", "Azul Somero", "Azul Profundo", "Carbon", "Coco"],
    href: "/shop/bathroom/sinks/mistoa-poas",
    image: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&q=75&auto=format",
    badge: "Artisan Made",
    badgeColor: "bg-brand-terracotta",
  },
  {
    brand: "Sun Valley Bronze",
    name: "Contemporary Entry Lock Set",
    price: "$76,100",
    finishes: ["Aged Bronze", "Dark Bronze", "Silicon Bronze"],
    href: "/shop/hardware/entry-locks/svb-contemporary",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=75&auto=format",
    badge: "Hardware",
    badgeColor: "bg-brand-charcoal",
  },
  {
    brand: "Badeloft",
    name: "Freestanding Soaking Tub",
    price: "$45,000",
    finishes: ["Glossy White", "Matte White"],
    href: "/shop/bathroom/bathtubs/badeloft-freestanding",
    image: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=600&q=75&auto=format",
    badge: "Bathroom",
    badgeColor: "bg-brand-charcoal",
  },
  {
    brand: "Kohler",
    name: "Strive 24\" Undermount Kitchen Sink",
    price: "$17,726",
    finishes: ["Stainless Steel"],
    href: "/shop/kitchen/sinks/kohler-strive-24",
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=75&auto=format",
    badge: "Kitchen",
    badgeColor: "bg-brand-charcoal",
  },
  {
    brand: "California Faucets",
    name: "Bridge-Style Kitchen Faucet",
    price: "$22,000",
    finishes: ["Chrome", "Satin Nickel", "Antique Brass", "Oil Rubbed Bronze", "Matte Black"],
    href: "/shop/kitchen/faucets/california-faucets-bridge",
    image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=75&auto=format",
    badge: "New Arrival",
    badgeColor: "bg-brand-copper",
  },
  {
    brand: "Counter Cultures",
    name: "Michelle Polished Copper Vessel",
    price: "$5,156",
    finishes: ["Polished Copper"],
    href: "/shop/bathroom/sinks/michelle-copper",
    image: "https://images.unsplash.com/photo-1615529328331-f8917597711f?w=600&q=75&auto=format",
    badge: "Artisan Made",
    badgeColor: "bg-brand-terracotta",
  },
];

const FeaturedProducts = ({ locale = "en" }: { locale?: string }) => (
  <section className="py-14 md:py-32 bg-brand-linen">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <AnimatedSection>
        <h2 className="text-center font-display text-3xl md:text-5xl font-normal tracking-wide text-brand-charcoal mb-4">
          {locale === "en" ? "Curated Selections" : "Selecciones Curadas"}
        </h2>
        <p className="text-center font-body text-brand-stone mb-8 md:mb-12 max-w-2xl mx-auto">
          {locale === "en" ? "Hand-picked pieces from our current collection" : "Piezas seleccionadas a mano de nuestra colección actual"}
        </p>
      </AnimatedSection>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {featured.map((product, i) => (
          <AnimatedSection key={product.href} delay={i * 0.06}>
            <Link href={product.href} className="group flex flex-col bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 h-full">
              <div className="relative aspect-[4/5] overflow-hidden shrink-0">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
                />
                <span className={`absolute top-3 left-3 ${product.badgeColor} text-white px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-sm`}>
                  {product.badge}
                </span>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <p className="font-mono text-xs text-brand-stone uppercase tracking-wider">
                  {product.brand}
                </p>
                <h3 className="mt-1 font-body text-base font-medium text-brand-charcoal group-hover:text-brand-terracotta transition-colors duration-300 leading-snug line-clamp-2 min-h-[2.75rem]">
                  {product.name}
                </h3>
                <div className="flex items-center gap-1.5 mt-2 min-h-[0.75rem]">
                  {product.finishes.length > 1 && (
                    <>
                      {product.finishes.slice(0, 5).map((finish) => (
                        <span
                          key={finish}
                          className="w-3 h-3 rounded-full bg-brand-stone/30 border border-brand-stone/20"
                          title={finish}
                        />
                      ))}
                      {product.finishes.length > 5 && (
                        <span className="font-mono text-[10px] text-brand-stone">
                          +{product.finishes.length - 5}
                        </span>
                      )}
                    </>
                  )}
                </div>
                <p className="mt-auto pt-2 font-mono text-lg text-brand-copper font-medium">
                  {product.price} <span className="text-xs text-brand-stone font-normal">MXN</span>
                </p>
              </div>
            </Link>
          </AnimatedSection>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Button variant="primary" href="/shop">
          {locale === "en" ? "Browse the Full Collection" : "Ver la Colección Completa"}
        </Button>
      </div>
    </div>
  </section>
);

export { FeaturedProducts };
