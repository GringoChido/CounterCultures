import type { Metadata } from "next";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { ShopCatalog } from "./shop-catalog";
import { getProducts } from "@/app/lib/sheets";

const BASE_URL = "https://countercultures.mx";

interface ShopPageProps {
  params: Promise<{ locale: string }>;
}

export const generateMetadata = async ({
  params,
}: ShopPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const isEs = locale === "es";

  const title = isEs
    ? "Tienda — Accesorios de Baño, Cocina y Herrajes"
    : "Shop — Bath, Kitchen & Hardware Fixtures";
  const description = isEs
    ? "Explora nuestra colección de accesorios de lujo para baño, cocina y herrajes de Kohler, TOTO, Brizo, BLANCO, Sun Valley Bronze y artesanos mexicanos."
    : "Browse our curated collection of luxury bath, kitchen, and door hardware fixtures from Kohler, TOTO, Brizo, BLANCO, Sun Valley Bronze, and Mexican artisans.";

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/shop`,
      languages: {
        en: `${BASE_URL}/en/shop`,
        es: `${BASE_URL}/es/shop`,
        "x-default": `${BASE_URL}/en/shop`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/shop`,
      locale: isEs ? "es_MX" : "en_US",
      alternateLocale: isEs ? "en_US" : "es_MX",
      type: "website",
      images: [
        {
          url: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&q=80",
          width: 1200,
          height: 630,
          alt: isEs
            ? "Tienda Counter Cultures — accesorios de lujo para baño, cocina y herrajes"
            : "Counter Cultures Shop — luxury bath, kitchen and hardware fixtures",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&q=80"],
    },
  };
};

const ShopPage = async ({ params }: ShopPageProps) => {
  const { locale } = await params;
  const isEs = locale === "es";
  const products = await getProducts();

  // BreadcrumbList JSON-LD
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: isEs ? "Inicio" : "Home",
        item: `${BASE_URL}/${locale}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: isEs ? "Tienda" : "Shop",
        item: `${BASE_URL}/${locale}/shop`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Header locale={locale} />
      <main className="pt-16 md:pt-20">
        {/* Hero */}
        <section className="py-10 md:py-20 bg-brand-linen border-b border-brand-stone/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <span className="font-body font-semibold text-xs tracking-[0.2em] text-brand-stone uppercase">
              The Collection
            </span>
            <h1 className="mt-3 font-display text-4xl md:text-6xl font-light tracking-wide text-brand-charcoal">
              Shop All
            </h1>
            <p className="mt-4 font-body text-base text-brand-stone max-w-xl">
              Faucets, sinks, bathtubs, toilets, showers, kitchen fixtures, and
              artisanal door hardware — curated for the discerning home.
            </p>
          </div>
        </section>

        <ShopCatalog initialProducts={products} />
      </main>
      <Footer locale={locale} />
    </>
  );
};

export default ShopPage;
