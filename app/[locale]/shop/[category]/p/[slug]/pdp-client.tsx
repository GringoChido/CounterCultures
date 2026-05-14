"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Package,
  TrendingUp,
  ShoppingBag,
  FileDown,
  ChevronRight,
  Check,
} from "lucide-react";
import { ProductVisual } from "@/app/components/product-visual";
import { useCartStore } from "@/app/lib/stores/cart-store";
import { focusRing } from "@/app/components/ui/focus-ring";

interface SerializedProduct {
  id: string;
  name: string;
  sku: string;
  brand: string;
  category: string;
  listPrice: number;
  currency: string;
  uom: string;
  inStock: boolean;
  stockQty: number;
  imageSrc?: string;
}

interface RelatedProductItem {
  id: string;
  name: string;
  sku: string;
  brand: string;
  category: string;
  listPrice: number;
  currency: string;
  imageSrc?: string;
  slug: string;
}

export interface PDPClientProps {
  product: SerializedProduct;
  locale: "en" | "es";
  categoryLabel: string;
  categorySlug: string;
  brandSlug: string | null;
  relatedProducts: RelatedProductItem[];
  inShowroom: boolean;
  projectCount: number;
  descriptionEs?: string;
  descriptionEn?: string;
  features?: string[];
  gallery?: string[];
  finishes?: string[];
  specSheetUrl?: string;
  specSheetLocal?: string;
  pdpSlug: string;
}

const T = {
  en: {
    home: "Home",
    catalog: "Catalog",
    addToProject: "Add to Project List",
    added: "Added to List",
    from: "from",
    quote: "Quote on request",
    inShowroom: "In Showroom",
    inStock: "In Stock",
    specifiedCount: (n: number) => `${n} projects`,
    features: "Features",
    finishes: "Available Finishes",
    specSheet: "Download Spec Sheet",
    related: "You may also like",
    priceNote:
      "Reference price — final quote confirmed on request. IVA not included.",
    viewBrand: "View all",
    description: "Description",
  },
  es: {
    home: "Inicio",
    catalog: "Catálogo",
    addToProject: "Agregar al Proyecto",
    added: "Agregado",
    from: "desde",
    quote: "Cotización bajo pedido",
    inShowroom: "En Showroom",
    inStock: "En Existencia",
    specifiedCount: (n: number) => `${n} proyectos`,
    features: "Características",
    finishes: "Acabados Disponibles",
    specSheet: "Descargar Ficha Técnica",
    related: "También te puede interesar",
    priceNote:
      "Precio de referencia — cotización final bajo pedido. IVA no incluido.",
    viewBrand: "Ver todo",
    description: "Descripción",
  },
};

const fmtPrice = (amount: number, currency: string, locale: string) =>
  amount.toLocaleString(locale === "es" ? "es-MX" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });

const PDPClient = ({
  product,
  locale,
  categoryLabel,
  categorySlug,
  brandSlug,
  relatedProducts,
  inShowroom,
  projectCount,
  descriptionEs,
  descriptionEn,
  features,
  gallery,
  finishes,
  specSheetUrl,
  specSheetLocal,
  pdpSlug,
}: PDPClientProps) => {
  const t = T[locale];
  const [activeImg, setActiveImg] = useState(0);
  const [descLang, setDescLang] = useState<"en" | "es">(locale);

  const cartAdd = useCartStore((s) => s.add);
  const cartHas = useCartStore((s) => s.has);
  const inCart = cartHas(product.id);

  const images = gallery ?? [];
  const specHref = specSheetLocal ?? specSheetUrl;

  const hasBothDescs = !!descriptionEs && !!descriptionEn;
  const descText = descLang === "es" ? descriptionEs : descriptionEn;
  const singleDesc = descriptionEs || descriptionEn;

  const handleAdd = () => {
    if (inCart) return;
    cartAdd({
      id: product.id,
      sku: product.sku,
      name: product.name,
      brand: product.brand,
      category: product.category,
      currency: (product.currency === "USD" ? "USD" : "MXN") as "MXN" | "USD",
      listPrice: product.listPrice,
      quantity: 1,
      imageSrc: product.imageSrc,
      productHref: `/${locale}/shop/${categorySlug}/p/${pdpSlug}`,
      availability: product.inStock ? "in-stock" : "quote_only",
      buyable: product.listPrice > 10 && product.inStock,
    });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="text-xs font-body text-dash-text-secondary mb-6 flex items-center gap-1 flex-wrap"
      >
        <Link
          href={`/${locale}`}
          className="hover:text-brand-copper transition-colors"
        >
          {t.home}
        </Link>
        <ChevronRight className="w-3 h-3" />
        <Link
          href={`/${locale}/shop/catalog`}
          className="hover:text-brand-copper transition-colors"
        >
          {t.catalog}
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span>{categoryLabel}</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-brand-charcoal truncate max-w-[200px]">
          {product.name || product.sku}
        </span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* ─── Gallery ─── */}
        <div className="space-y-3 md:sticky md:top-24 md:self-start">
          {images.length > 0 ? (
            <>
              <div
                className="relative w-full overflow-hidden bg-brand-linen border border-brand-stone/15"
                style={{ aspectRatio: "4/3" }}
              >
                <img
                  src={images[activeImg]}
                  alt={product.name}
                  loading="eager"
                  className="absolute inset-0 w-full h-full object-contain"
                />
                <BadgeCluster
                  inShowroom={inShowroom}
                  inStock={product.inStock}
                  projectCount={projectCount}
                  t={t}
                />
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((src, i) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setActiveImg(i)}
                      className={`shrink-0 w-16 h-16 overflow-hidden border-2 transition-colors cursor-pointer ${
                        i === activeImg
                          ? "border-brand-copper"
                          : "border-brand-stone/20 hover:border-brand-stone/40"
                      }`}
                    >
                      <img
                        src={src}
                        alt={`${product.name} ${i + 1}`}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="relative">
              <ProductVisual
                id={product.id}
                brand={product.brand}
                sku={product.sku}
                name={product.name}
                aspect="4/3"
                size="hero"
              />
              <BadgeCluster
                inShowroom={inShowroom}
                inStock={product.inStock}
                projectCount={projectCount}
                t={t}
              />
            </div>
          )}
        </div>

        {/* ─── Product info ─── */}
        <div className="space-y-6">
          {/* SKU + title + brand */}
          <div>
            <span className="font-mono text-xs text-dash-text-secondary">
              {product.sku}
            </span>
            <h1 className="mt-2 font-display text-3xl md:text-4xl font-light text-brand-charcoal leading-tight">
              {product.name}
            </h1>
            {product.brand && (
              <p className="mt-2 font-body text-sm text-dash-text-secondary">
                {brandSlug ? (
                  <Link
                    href={`/${locale}/brands/${brandSlug}`}
                    className="hover:text-brand-copper transition-colors underline underline-offset-2 decoration-brand-stone/30"
                  >
                    {product.brand}
                  </Link>
                ) : (
                  product.brand
                )}
                {brandSlug && (
                  <span className="ml-2 text-[10px] text-dash-text-secondary/60">
                    —{" "}
                    <Link
                      href={`/${locale}/brands/${brandSlug}`}
                      className="hover:text-brand-copper transition-colors"
                    >
                      {t.viewBrand} →
                    </Link>
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Price */}
          <div>
            {product.listPrice > 10 ? (
              <>
                <p className="font-display text-2xl text-brand-charcoal">
                  <span className="text-sm font-body text-dash-text-secondary mr-1">
                    {t.from}
                  </span>
                  {fmtPrice(product.listPrice, product.currency, locale)}
                  <span className="text-sm font-body text-dash-text-secondary ml-2">
                    {product.currency}
                  </span>
                </p>
                {/* TODO: Step 8 (trade pricing) — swap to trade price when tradeContext is available */}
                <p className="mt-1 font-body text-[11px] text-dash-text-secondary">
                  {t.priceNote}
                </p>
              </>
            ) : (
              <div className="inline-block px-3 py-1.5 border border-brand-terracotta text-brand-terracotta text-xs uppercase tracking-wider font-body">
                {t.quote}
              </div>
            )}
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={handleAdd}
            disabled={inCart}
            className={`w-full py-3.5 font-body text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${
              inCart
                ? "bg-brand-sage text-white cursor-default"
                : "bg-brand-charcoal text-white hover:bg-brand-copper cursor-pointer"
            } ${focusRing}`}
          >
            {inCart ? (
              <>
                <Check className="w-4 h-4" />
                {t.added}
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                {t.addToProject}
              </>
            )}
          </button>

          {/* Description */}
          {singleDesc && (
            <div>
              <h2 className="font-body text-xs font-semibold tracking-[0.2em] uppercase text-dash-text-secondary mb-3">
                {t.description}
              </h2>
              {hasBothDescs && (
                <div className="flex items-center gap-1 mb-3">
                  {(["en", "es"] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setDescLang(l)}
                      className={`px-2.5 py-1 text-xs font-body transition-colors cursor-pointer ${
                        descLang === l
                          ? "bg-brand-charcoal text-white"
                          : "bg-brand-linen text-dash-text-secondary hover:text-brand-charcoal"
                      }`}
                    >
                      {l.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
              <div className="font-body text-sm text-brand-charcoal leading-relaxed whitespace-pre-line">
                {hasBothDescs ? descText : singleDesc}
              </div>
            </div>
          )}

          {/* Features */}
          {features && features.length > 0 && (
            <div>
              <h2 className="font-body text-xs font-semibold tracking-[0.2em] uppercase text-dash-text-secondary mb-3">
                {t.features}
              </h2>
              <ul className="space-y-2">
                {features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 font-body text-sm text-brand-charcoal leading-relaxed"
                  >
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-copper shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Finishes */}
          {finishes && finishes.length > 0 && (
            <div>
              <h2 className="font-body text-xs font-semibold tracking-[0.2em] uppercase text-dash-text-secondary mb-3">
                {t.finishes}
              </h2>
              <div className="flex flex-wrap gap-2">
                {finishes.map((f) => (
                  <span
                    key={f}
                    className="px-3 py-1.5 text-xs font-body text-brand-charcoal bg-brand-linen border border-brand-stone/15 rounded-full"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Spec sheet */}
          {specHref && (
            <a
              href={specHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-body text-brand-charcoal border border-brand-stone/30 hover:border-brand-copper hover:text-brand-copper transition-colors"
            >
              <FileDown className="w-4 h-4" />
              {t.specSheet}
            </a>
          )}
        </div>
      </div>

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <section className="mt-16 pt-12 border-t border-brand-stone/15">
          <h2 className="font-display text-2xl font-light text-brand-charcoal mb-8">
            {t.related}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedProducts.map((rp) => (
              <Link
                key={rp.id}
                href={`/${locale}/shop/${rp.category}/p/${rp.slug}`}
                className="group bg-dash-surface border border-brand-stone/15 hover:border-brand-copper/60 transition-colors"
              >
                <ProductVisual
                  id={rp.id}
                  brand={rp.brand}
                  sku={rp.sku}
                  name={rp.name || rp.sku}
                  aspect="4/3"
                  size="card"
                  className="group-hover:[&>img]:scale-[1.02] [&>img]:transition-transform [&>img]:duration-500"
                />
                <div className="p-3">
                  <span className="font-body text-[10px] tracking-[0.15em] text-brand-copper uppercase">
                    {rp.brand || "—"}
                  </span>
                  <h3 className="font-body text-xs text-brand-charcoal line-clamp-2 leading-snug mt-1">
                    {rp.name || rp.sku}
                  </h3>
                  {rp.listPrice > 10 && (
                    <p className="mt-1 font-body text-[11px] text-dash-text-secondary">
                      {fmtPrice(rp.listPrice, rp.currency, locale)}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

const BadgeCluster = ({
  inShowroom,
  inStock,
  projectCount,
  t,
}: {
  inShowroom: boolean;
  inStock: boolean;
  projectCount: number;
  t: (typeof T)["en"];
}) => (
  <>
    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
      {inShowroom && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-charcoal/90 text-white font-body text-[10px] tracking-[0.1em] uppercase backdrop-blur-sm">
          <MapPin className="w-3 h-3" />
          {t.inShowroom}
        </span>
      )}
      {inStock && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-sage/95 text-white font-body text-[10px] tracking-[0.1em] uppercase backdrop-blur-sm">
          <Package className="w-3 h-3" />
          {t.inStock}
        </span>
      )}
    </div>
    {projectCount > 1 && (
      <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 bg-brand-copper/95 text-white font-body text-[10px] tracking-[0.1em] uppercase backdrop-blur-sm">
        <TrendingUp className="w-3 h-3" />
        {t.specifiedCount(projectCount)}
      </span>
    )}
  </>
);

export { PDPClient };
