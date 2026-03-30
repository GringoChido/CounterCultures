"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronRight, MessageCircle, ChevronDown } from "lucide-react";
import { ProductCard, formatPrice } from "@/app/components/ui/product-card";
import type { Product } from "@/app/lib/types";

interface ProductDetailProps {
  product: Product;
  crossSells: Product[];
}

const ProductDetail = ({ product, crossSells }: ProductDetailProps) => {
  const [selectedFinish, setSelectedFinish] = useState(product.finishes[0] || "");
  const [selectedImage, setSelectedImage] = useState(0);
  const [specsOpen, setSpecsOpen] = useState(false);

  return (
    <>
      {/* Breadcrumbs */}
      <nav className="bg-brand-linen border-b border-brand-stone/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 font-mono text-xs text-brand-stone">
            <Link href="/shop" className="hover:text-brand-terracotta transition-colors">
              Shop
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link
              href={`/shop/${product.category}`}
              className="hover:text-brand-terracotta transition-colors capitalize"
            >
              {product.category}
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-brand-charcoal">{product.brand}</span>
          </div>
        </div>
      </nav>

      {/* Product Section */}
      <section className="py-12 lg:py-20 bg-brand-linen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            {/* Image Gallery */}
            <div>
              <motion.div
                key={selectedImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative aspect-square bg-brand-sand/20 overflow-hidden"
              >
                <Image
                  src={product.images[selectedImage] || product.images[0]}
                  alt={`${product.nameEn} by ${product.brand}`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                  className="object-cover"
                />
              </motion.div>
              {product.images.length > 1 && (
                <div className="flex gap-3 mt-4">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`relative w-20 h-20 overflow-hidden border-2 transition-colors cursor-pointer ${
                        selectedImage === i
                          ? "border-brand-terracotta"
                          : "border-transparent hover:border-brand-stone/30"
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`${product.nameEn} view ${i + 1}`}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              <p className="font-mono text-xs tracking-[0.2em] text-brand-stone uppercase">
                {product.brand}
              </p>
              <h1 className="mt-2 font-display text-3xl md:text-4xl font-light tracking-wide text-brand-charcoal">
                {product.nameEn}
              </h1>
              {product.artisanal && (
                <span className="inline-block mt-3 font-mono text-[10px] tracking-[0.15em] uppercase bg-brand-copper text-white px-3 py-1">
                  Artisanal · Handcrafted in Mexico
                </span>
              )}

              <div className="mt-6">
                <span className="font-mono text-2xl text-brand-charcoal">
                  ${formatPrice(product.price)}
                </span>
                <span className="font-mono text-sm text-brand-stone ml-2">
                  {product.currency}
                </span>
              </div>

              <p className="mt-6 font-body text-base text-brand-stone leading-relaxed">
                {product.descriptionEn}
              </p>

              {/* Finish selector */}
              {product.finishes.length > 0 && (
                <div className="mt-8">
                  <p className="font-body text-sm font-medium text-brand-charcoal mb-3">
                    Finish:{" "}
                    <span className="font-normal text-brand-stone">
                      {selectedFinish}
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.finishes.map((finish) => (
                      <button
                        key={finish}
                        onClick={() => setSelectedFinish(finish)}
                        className={`px-4 py-2 text-sm font-body border rounded-sm transition-colors ${
                          selectedFinish === finish
                            ? "border-brand-terracotta text-brand-terracotta bg-brand-terracotta/5"
                            : "border-brand-stone/20 text-brand-charcoal hover:border-brand-stone"
                        }`}
                      >
                        {finish}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* SKU */}
              <p className="mt-6 font-mono text-xs text-brand-stone">
                SKU: {product.sku}
              </p>

              {/* CTAs */}
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <button className="flex-1 py-4 bg-brand-terracotta text-white font-body text-sm font-medium tracking-wider hover:bg-brand-copper transition-colors duration-300">
                  Request a Quote
                </button>
                <a
                  href={`https://wa.me/+524151234567?text=I'm interested in the ${product.nameEn} (${product.sku})`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-4 border border-brand-charcoal text-brand-charcoal font-body text-sm font-medium tracking-wider hover:bg-brand-charcoal hover:text-white transition-colors duration-300 flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
              </div>

              {/* Specifications */}
              {product.specifications && Object.keys(product.specifications).length > 0 && (
                <div className="mt-10 border-t border-brand-stone/10 pt-6">
                  <button
                    onClick={() => setSpecsOpen(!specsOpen)}
                    className="flex items-center justify-between w-full py-2"
                  >
                    <span className="font-body text-sm font-medium text-brand-charcoal">
                      Specifications
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-brand-stone transition-transform ${
                        specsOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {specsOpen && (
                    <div className="mt-4 space-y-2">
                      {Object.entries(product.specifications).map(
                        ([key, value]) => (
                          <div
                            key={key}
                            className="flex justify-between py-2 border-b border-brand-stone/5"
                          >
                            <span className="font-body text-sm text-brand-stone">
                              {key}
                            </span>
                            <span className="font-mono text-sm text-brand-charcoal">
                              {value}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Cross-sells */}
      {crossSells.length > 0 && (
        <section className="py-16 lg:py-20 bg-white border-t border-brand-stone/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-3xl font-light tracking-wide text-brand-charcoal mb-10">
              Complete the Look
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {crossSells.map((p) => (
                <ProductCard
                  key={p.id}
                  brand={p.brand}
                  name={p.name}
                  nameEn={p.nameEn}
                  price={p.price}
                  currency={p.currency}
                  finishes={p.finishes}
                  image={p.images[0] || ""}
                  category={p.category}
                  subcategory={p.subcategory}
                  slug={p.slug}
                  artisanal={p.artisanal}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export { ProductDetail };
