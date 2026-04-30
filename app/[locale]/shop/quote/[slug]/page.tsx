import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { getQuoteCatalogBySlug } from "@/app/lib/products-full";
import { QuoteForm } from "./quote-form-client";

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

const QuoteDetailPage = async ({ params }: QuoteDetailProps) => {
  const { locale, slug } = await params;
  const product = await getQuoteCatalogBySlug(slug);
  if (!product) notFound();
  const isEs = locale === "es";

  return (
    <>
      <Header locale={locale} />
      <main className="pt-16 md:pt-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <nav className="text-xs font-body text-brand-stone mb-6">
            <Link href={`/${locale}`} className="hover:text-brand-copper">
              {isEs ? "Inicio" : "Home"}
            </Link>
            <span className="mx-2">/</span>
            <Link href={`/${locale}/shop/quote`} className="hover:text-brand-copper">
              {isEs ? "Catálogo Especial" : "Special Order Catalog"}
            </Link>
            <span className="mx-2">/</span>
            <span>{product.sku}</span>
          </nav>

          <div className="grid md:grid-cols-[1fr_400px] gap-8">
            <div>
              <span className="font-mono text-xs text-brand-stone">{product.sku}</span>
              <h1 className="mt-2 font-display text-3xl md:text-4xl font-light text-brand-charcoal">
                {product.name}
              </h1>
              {product.brand && (
                <p className="mt-2 font-body text-sm text-brand-stone">{product.brand}</p>
              )}
              <div className="mt-4 inline-block px-3 py-1 border border-brand-terracotta text-brand-terracotta text-xs uppercase tracking-wider font-body">
                {isEs ? "Solo bajo cotización" : "Quote Only"}
              </div>

              {product.description && (
                <div className="mt-6 font-body text-sm text-brand-charcoal leading-relaxed">
                  {product.description}
                </div>
              )}

              <div className="mt-8 p-4 bg-brand-linen border border-brand-stone/15">
                <p className="font-body text-xs text-brand-stone leading-relaxed">
                  {isEs
                    ? "Este producto forma parte de nuestro catálogo especial. Se ordena directamente al proveedor. Responderemos tu cotización con precio, tiempo de entrega y disponibilidad en menos de 24 horas hábiles."
                    : "This product is part of our special-order catalog, sourced directly from the supplier. We'll reply with pricing, lead time, and availability within 24 business hours."}
                </p>
              </div>
            </div>

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
      <Footer locale={locale} />
    </>
  );
};

export default QuoteDetailPage;
