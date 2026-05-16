import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FileDown } from "lucide-react";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { getQuoteCatalogBySlug } from "@/app/lib/products-full";
import { QuoteForm } from "./quote-form-client";
import { ProductGallery } from "./product-gallery";
import { DescriptionToggle } from "./description-toggle";

export const dynamic = "force-dynamic";

const BASE_URL = "https://countercultures.mx";

interface QuoteDetailProps {
  params: Promise<{ locale: string; slug: string }>;
}

export const generateMetadata = async ({
  params,
}: QuoteDetailProps): Promise<Metadata> => {
  const { locale, slug } = await params;
  const product = await getQuoteCatalogBySlug(slug);
  if (!product) return {};
  const isEs = locale === "es";
  return {
    title: isEs ? `${product.name} — Solicitar Cotización` : `${product.name} — Request a Quote`,
    description: product.description || product.name,
    robots: { index: false, follow: true },
    alternates: {
      canonical: `${BASE_URL}/${locale}/shop/quote/${slug}`,
    },
  };
};

const formatCurrency = (amount: number, currency: "MXN" | "USD", locale: string) =>
  amount.toLocaleString(locale === "es" ? "es-MX" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });

const QuoteDetailPage = async ({ params }: QuoteDetailProps) => {
  const { locale, slug } = await params;
  const product = await getQuoteCatalogBySlug(slug);
  if (!product) notFound();
  const isEs = locale === "es";

  const specSheetHref = product.specifications?.specSheetLocal
    ?? product.specifications?.specSheetUrl;

  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="pt-16 md:pt-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          {/* Breadcrumb */}
          <nav className="text-xs font-body text-dash-text-secondary mb-6">
            <Link href={`/${locale}`} className="hover:text-brand-copper">
              {isEs ? "Inicio" : "Home"}
            </Link>
            <span className="mx-2">/</span>
            <Link href={`/${locale}/shop/quote`} className="hover:text-brand-copper">
              {isEs ? "Catálogo Especial" : "Special Order Catalog"}
            </Link>
            {product.subcategory && (
              <>
                <span className="mx-2">/</span>
                <span>{product.subcategory}</span>
              </>
            )}
            <span className="mx-2">/</span>
            <span>{product.sku}</span>
          </nav>

          <div className="grid md:grid-cols-[1fr_400px] gap-8 lg:gap-12">
            {/* Left column: gallery + product info */}
            <div className="space-y-8">
              {/* Gallery */}
              <ProductGallery
                images={product.images}
                productId={product.id}
                brand={product.brand}
                sku={product.sku}
                name={product.name}
              />

              {/* Product header */}
              <div>
                <span className="font-mono text-xs text-dash-text-secondary">{product.sku}</span>
                <h1 className="mt-2 font-display text-3xl md:text-4xl font-light text-brand-charcoal">
                  {product.name}
                </h1>
                {product.brand && (
                  <p className="mt-2 font-body text-sm text-dash-text-secondary">{product.brand}</p>
                )}
                <div className="mt-4 inline-block px-3 py-1 border border-brand-terracotta text-brand-terracotta text-xs uppercase tracking-wider font-body">
                  {isEs ? "Solo bajo cotización" : "Quote Only"}
                </div>
              </div>

              {/* Price */}
              {product.price > 0 && (
                <div>
                  <p className="font-display text-2xl text-brand-charcoal">
                    {formatCurrency(product.price, product.currency, locale)}
                  </p>
                  <p className="mt-1 font-body text-xs text-dash-text-secondary">
                    {isEs
                      ? "Precio de referencia — cotización final bajo pedido"
                      : "Reference price — final quote on request"}
                  </p>
                </div>
              )}

              {/* Description toggle (EN/ES) */}
              <DescriptionToggle
                description={product.description}
                descriptionEn={product.descriptionEn}
                locale={isEs ? "es" : "en"}
              />

              {/* Features */}
              {product.features && product.features.length > 0 && (
                <div>
                  <h2 className="font-body text-xs font-semibold tracking-[0.2em] uppercase text-dash-text-secondary mb-3">
                    {isEs ? "Características" : "Features"}
                  </h2>
                  <ul className="space-y-2">
                    {product.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 font-body text-sm text-brand-charcoal leading-relaxed">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-copper shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Finishes / variants */}
              {product.finishes.length > 0 && (
                <div>
                  <h2 className="font-body text-xs font-semibold tracking-[0.2em] uppercase text-dash-text-secondary mb-3">
                    {isEs ? "Acabados Disponibles" : "Available Finishes"}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {product.finishes.map((f) => (
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

              {/* Spec sheet download */}
              {specSheetHref && (
                <div>
                  <a
                    href={specSheetHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-body text-brand-charcoal border border-brand-stone/30 hover:border-brand-copper hover:text-brand-copper transition-colors"
                  >
                    <FileDown className="w-4 h-4" />
                    {isEs ? "Descargar Ficha Técnica" : "Download Spec Sheet"}
                  </a>
                </div>
              )}

              {/* Special order info */}
              <div className="p-4 bg-brand-linen border border-brand-stone/15">
                <p className="font-body text-xs text-dash-text-secondary leading-relaxed">
                  {isEs
                    ? "Este producto forma parte de nuestro catálogo especial. Se ordena directamente al proveedor. Responderemos tu cotización con precio, tiempo de entrega y disponibilidad en menos de 24 horas hábiles."
                    : "This product is part of our special-order catalog, sourced directly from the supplier. We'll reply with pricing, lead time, and availability within 24 business hours."}
                </p>
              </div>
            </div>

            {/* Right column: quote form */}
            <aside className="md:sticky md:top-24 md:self-start">
              <QuoteForm
                locale={isEs ? "es" : "en"}
                productId={product.id}
                productSku={product.sku}
                productName={product.name}
                productBrand={product.brand}
              />
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default QuoteDetailPage;
