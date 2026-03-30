"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, MessageCircle, ChevronDown, Download, Sparkles } from "lucide-react";
import { ProductCard, formatPrice } from "@/app/components/ui/product-card";
import type { Product } from "@/app/lib/types";
import { SITE_CONFIG } from "@/app/lib/constants";

interface ProductDetailProps {
  product: Product;
  crossSells: Product[];
  locale: "en" | "es";
  categoryLabel: string;
  subcategoryLabel: string;
  subcategorySlug: string;
}

const availabilityMap = {
  "in-stock": { en: "In Stock", es: "En Stock", color: "text-brand-sage" },
  "made-to-order": { en: "Made to Order (4-8 weeks)", es: "Hecho a Pedido (4-8 semanas)", color: "text-brand-copper" },
  "special-order": { en: "Special Order", es: "Pedido Especial", color: "text-brand-terracotta" },
} as const;

const t = (locale: "en" | "es", key: string) => {
  const translations: Record<string, Record<string, string>> = {
    inquire: { en: "Inquire About This Piece", es: "Preguntar Sobre Esta Pieza" },
    tradePricing: { en: "Request Trade Pricing", es: "Solicitar Precio Profesional" },
    specSheet: { en: "Download Spec Sheet", es: "Descargar Ficha Técnica" },
    finishes: { en: "Available Finishes", es: "Acabados Disponibles" },
    specifications: { en: "Specifications", es: "Especificaciones" },
    artisanBadge: { en: "Handcrafted by Mexican Artisans", es: "Hecho a Mano por Artesanos Mexicanos" },
    tradePriceNote: { en: "Trade pricing available — apply for access", es: "Precios profesionales disponibles — solicita acceso" },
    relatedProducts: { en: "You May Also Like", es: "También Te Puede Interesar" },
    home: { en: "Home", es: "Inicio" },
    shop: { en: "Shop", es: "Tienda" },
  };
  return translations[key]?.[locale] || key;
};

const ProductDetail = ({
  product,
  crossSells,
  locale,
  categoryLabel,
  subcategoryLabel,
  subcategorySlug,
}: ProductDetailProps) => {
  const [selectedFinish, setSelectedFinish] = useState(product.finishes[0] || "");
  const [selectedImage, setSelectedImage] = useState(0);
  const [specsOpen, setSpecsOpen] = useState(false);

  const whatsappMessage = locale === "es"
    ? `Hola, me interesa ${product.name} (SKU: ${product.sku}). ¿Me pueden dar más información?`
    : `Hi, I'm interested in ${product.nameEn} (SKU: ${product.sku}). Could you provide more information?`;
  const whatsappUrl = `https://wa.me/${SITE_CONFIG.showroom.whatsapp.replace(/\s+/g, "")}?text=${encodeURIComponent(whatsappMessage)}`;

  const productName = locale === "es" ? product.name : product.nameEn;
  const productDescription = locale === "es" ? product.description : product.descriptionEn;
  const availabilityInfo = availabilityMap[product.availability];

  return (
    <>
      {/* Breadcrumbs */}
      <nav className="bg-brand-linen border-b border-brand-stone/10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 font-mono text-xs text-brand-stone flex-wrap">
            <Link href={`/${locale}`} className="hover:text-brand-terracotta transition-colors">
              {t(locale, "home")}
            </Link>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <Link href={`/${locale}/shop`} className="hover:text-brand-terracotta transition-colors">
              {t(locale, "shop")}
            </Link>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <Link
              href={`/${locale}/shop/${product.category}`}
              className="hover:text-brand-terracotta transition-colors"
            >
              {categoryLabel}
            </Link>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <Link
              href={`/${locale}/shop/${product.category}/${subcategorySlug}`}
              className="hover:text-brand-terracotta transition-colors"
            >
              {subcategoryLabel}
            </Link>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <span className="text-brand-charcoal">{productName}</span>
          </div>
        </div>
      </nav>

      {/* Product Section */}
      <section className="py-12 lg:py-20 bg-brand-linen">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            {/* Image Gallery */}
            <div className="lg:sticky lg:top-28 lg:self-start">
              <motion.div
                key={selectedImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="aspect-square bg-brand-sand/20 overflow-hidden"
              >
                <img
                  src={product.images[selectedImage] || product.images[0]}
                  alt={product.nameEn}
                  className="w-full h-full object-cover"
                />
              </motion.div>
              {product.images.length > 1 && (
                <div className="flex gap-3 mt-4">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`w-20 h-20 overflow-hidden border-2 transition-colors cursor-pointer ${
                        selectedImage === i
                          ? "border-brand-terracotta"
                          : "border-transparent hover:border-brand-stone/30"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${product.nameEn} view ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              <p className="font-mono text-xs tracking-[0.2em] text-brand-terracotta uppercase">
                {product.brand}
              </p>
              <h1 className="mt-2 font-display text-3xl md:text-4xl font-light tracking-wide text-brand-charcoal">
                {productName}
              </h1>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mt-3">
                {product.artisanal && (
                  <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.15em] uppercase bg-brand-copper text-white px-3 py-1">
                    <Sparkles className="w-3 h-3" />
                    {t(locale, "artisanBadge")}
                  </span>
                )}
                <span className={`font-mono text-[10px] tracking-[0.15em] uppercase px-3 py-1 border border-brand-stone/20 ${availabilityInfo.color}`}>
                  {availabilityInfo[locale]}
                </span>
              </div>

              {/* Price */}
              <div className="mt-6">
                <span className="font-mono text-2xl text-brand-charcoal">
                  {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(product.price)}
                </span>
                <span className="font-mono text-sm text-brand-stone ml-2">
                  {product.currency}
                </span>
              </div>
              <p className="mt-1 font-body text-xs text-brand-stone italic">
                {t(locale, "tradePriceNote")}
              </p>

              {/* Description */}
              <p className="mt-6 font-body text-base text-brand-stone leading-relaxed">
                {productDescription}
              </p>

              {/* Finish selector */}
              {product.finishes.length > 0 && (
                <div className="mt-8">
                  <p className="font-body text-sm font-medium text-brand-charcoal mb-3">
                    {t(locale, "finishes")}:{" "}
                    <span className="font-normal text-brand-stone">
                      {selectedFinish}
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.finishes.map((finish) => (
                      <button
                        key={finish}
                        onClick={() => setSelectedFinish(finish)}
                        className={`px-4 py-2 text-sm font-body border rounded-sm transition-colors cursor-pointer ${
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
              <div className="mt-8 flex flex-col gap-3">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-4 bg-brand-terracotta text-white font-body text-sm font-medium tracking-wider hover:bg-brand-copper transition-colors duration-300 flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  {t(locale, "inquire")}
                </a>
                <div className="flex gap-3">
                  <Link
                    href={`/${locale}/trade`}
                    className="flex-1 py-3 border border-brand-charcoal text-brand-charcoal font-body text-sm font-medium tracking-wider hover:bg-brand-charcoal hover:text-white transition-colors duration-300 text-center"
                  >
                    {t(locale, "tradePricing")}
                  </Link>
                  <button
                    className="flex-1 py-3 border border-brand-stone/30 text-brand-stone font-body text-sm font-medium tracking-wider hover:border-brand-stone hover:text-brand-charcoal transition-colors duration-300 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    {t(locale, "specSheet")}
                  </button>
                </div>
              </div>

              {/* Specifications */}
              {product.specifications && Object.keys(product.specifications).length > 0 && (
                <div className="mt-10 border-t border-brand-stone/10 pt-6">
                  <button
                    onClick={() => setSpecsOpen(!specsOpen)}
                    className="flex items-center justify-between w-full py-2 cursor-pointer"
                  >
                    <span className="font-body text-sm font-medium text-brand-charcoal">
                      {t(locale, "specifications")}
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
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h2 className="font-display text-3xl font-light tracking-wide text-brand-charcoal mb-10">
              {t(locale, "relatedProducts")}
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
