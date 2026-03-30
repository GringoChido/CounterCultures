"use client";

import { ProductCard } from "@/app/components/ui/product-card";
import { AnimatedSection } from "@/app/components/ui/animated-section";
import type { Product } from "@/app/lib/types";

interface ArtisanalGalleryProps {
  products: Product[];
}

const ArtisanalGallery = ({ products }: ArtisanalGalleryProps) => (
  <section className="py-20 lg:py-28 bg-brand-sand/20">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <AnimatedSection>
        <span className="font-mono text-xs tracking-[0.2em] text-brand-stone uppercase">
          The Collection
        </span>
        <h2 className="mt-3 font-display text-4xl md:text-5xl font-light tracking-wide text-brand-charcoal mb-14">
          Artisanal Pieces
        </h2>
      </AnimatedSection>

      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
          {products.map((product, i) => (
            <AnimatedSection key={product.id} delay={i * 0.08}>
              <ProductCard
                brand={product.brand}
                name={product.name}
                nameEn={product.nameEn}
                price={product.price}
                currency={product.currency}
                finishes={product.finishes}
                image={product.images[0] || ""}
                category={product.category}
                subcategory={product.subcategory}
                slug={product.slug}
                artisanal={product.artisanal}
              />
            </AnimatedSection>
          ))}
        </div>
      ) : (
        <p className="font-body text-brand-stone text-center py-12">
          Artisanal collection coming soon.
        </p>
      )}
    </div>
  </section>
);

export { ArtisanalGallery };
