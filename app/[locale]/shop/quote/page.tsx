import type { Metadata } from "next";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { QuoteCatalog } from "./quote-catalog";
import { getAllQuoteBrands } from "@/app/lib/sheets";

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
    ? "Catálogo Especial — Solicita Cotización"
    : "Special Order Catalog — Request a Quote";
  const description = isEs
    ? "Más de 700 SKUs especiales de nuestros proveedores: California Faucets, Brizo, Delta, Emtek y más. Solicita cotización directamente."
    : "700+ special-order SKUs from California Faucets, Brizo, Delta, Emtek and more. Request a quote directly.";
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
  const brands = await getAllQuoteBrands();

  return (
    <>
      <Header locale={locale} />
      <main className="pt-16 md:pt-20">
        <section className="py-10 md:py-16 bg-brand-linen border-b border-brand-stone/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <span className="font-body font-semibold text-xs tracking-[0.2em] text-brand-stone uppercase">
              {isEs ? "Catálogo Especial" : "Special Order Catalog"}
            </span>
            <h1 className="mt-3 font-display text-4xl md:text-6xl font-light tracking-wide text-brand-charcoal">
              {isEs ? "Solicita Cotización" : "Request a Quote"}
            </h1>
            <p className="mt-4 font-body text-base text-brand-stone max-w-2xl">
              {isEs
                ? "Más de 700 SKUs especiales disponibles bajo pedido. Busca por SKU, nombre o marca y envía tu solicitud — te respondemos en menos de 24 horas."
                : "Over 700 special-order SKUs available from our distributor partners. Search by SKU, name, or brand and send your request — we respond within 24 hours."}
            </p>
          </div>
        </section>

        <QuoteCatalog locale={locale as "en" | "es"} brands={brands} />
      </main>
      <Footer locale={locale} />
    </>
  );
};

export default QuoteShopPage;
