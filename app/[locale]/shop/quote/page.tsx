import type { Metadata } from "next";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { QuoteCatalog } from "./quote-catalog";
import {
  getQuoteCatalogBrands,
  getCatalogStats,
} from "@/app/lib/products-full";

export const revalidate = 300;

const BASE_URL = "https://countercultures.mx";

interface QuoteShopProps {
  params: Promise<{ locale: string }>;
}

export const generateMetadata = async ({
  params,
}: QuoteShopProps): Promise<Metadata> => {
  const { locale } = await params;
  const isEs = locale === "es";
  const title = isEs
    ? "Catálogo Completo — Solicita Cotización"
    : "Full Catalog — Request a Quote";
  const description = isEs
    ? "Más de 350,000 SKUs de nuestros proveedores: Emtek, Brizo, Delta, California Faucets y más. Solicita cotización directamente."
    : "350,000+ SKUs from our distributor partners: Emtek, Brizo, Delta, California Faucets and more. Request a quote directly.";
  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/shop/quote`,
      languages: {
        en: `${BASE_URL}/en/shop/quote`,
        es: `${BASE_URL}/es/shop/quote`,
        "x-default": `${BASE_URL}/en/shop/quote`,
      },
    },
    robots: { index: false, follow: true },
  };
};

const QuoteShopPage = async ({ params }: QuoteShopProps) => {
  const { locale } = await params;
  const isEs = locale === "es";
  const [brandCounts, stats] = await Promise.all([
    getQuoteCatalogBrands(),
    getCatalogStats(),
  ]);

  return (
    <>
      <Header locale={locale} />
      <main className="pt-16 md:pt-20">
        <section className="py-10 md:py-16 bg-brand-linen border-b border-brand-stone/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <span className="font-body font-semibold text-xs tracking-[0.2em] text-brand-stone uppercase">
              {isEs ? "Catálogo Completo" : "Full Catalog"}
            </span>
            <h1 className="mt-3 font-display text-4xl md:text-6xl font-light tracking-wide text-brand-charcoal">
              {isEs ? "Solicita Cotización" : "Request a Quote"}
            </h1>
            <p className="mt-4 font-body text-base text-brand-stone max-w-2xl">
              {isEs
                ? `Más de ${stats.total.toLocaleString("es-MX")} SKUs de nuestros proveedores. Busca por SKU, nombre o marca — respondemos tu cotización en menos de 24 horas hábiles.`
                : `Over ${stats.total.toLocaleString("en-US")} SKUs from our distributor partners. Search by SKU, name, or brand — we respond with pricing and lead time within 24 business hours.`}
            </p>
          </div>
        </section>

        <QuoteCatalog
          locale={locale as "en" | "es"}
          brandCounts={brandCounts}
          totalProducts={stats.total}
        />
      </main>
      <Footer locale={locale} />
    </>
  );
};

export default QuoteShopPage;
