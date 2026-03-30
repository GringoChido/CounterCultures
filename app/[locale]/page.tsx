import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { Hero } from "@/app/components/sections/hero";
import { BrandBar } from "@/app/components/sections/brand-bar";
import { ShopByRoom } from "@/app/components/sections/shop-by-room";
import { FeaturedProducts } from "@/app/components/sections/featured-products";
import { FounderStory } from "@/app/components/sections/founder-story";
import { ArtisanalSpotlight } from "@/app/components/sections/artisanal-spotlight";
import { ProjectGallery } from "@/app/components/sections/project-gallery";
import { TradeTeaser } from "@/app/components/sections/trade-teaser";
import { Testimonial } from "@/app/components/sections/testimonial";
import { ContactCTA } from "@/app/components/sections/contact-cta";
import { NewsletterStrip } from "@/app/components/sections/newsletter-strip";

const BASE_URL = "https://countercultures.mx";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export const generateMetadata = async ({
  params,
}: HomePageProps): Promise<Metadata> => {
  const { locale } = await params;
  const isEs = locale === "es";

  const title = isEs
    ? "Counter Cultures — Accesorios de Lujo para Baño y Cocina en San Miguel de Allende"
    : "Counter Cultures — Luxury Bath & Kitchen Fixtures in San Miguel de Allende";
  const description = isEs
    ? "El showroom principal de San Miguel de Allende para accesorios de lujo de baño, cocina y herrajes. Distribuidor autorizado de Kohler, TOTO, Brizo, BLANCO y piezas artesanales mexicanas."
    : "San Miguel de Allende's premier showroom for luxury bath, kitchen, and hardware fixtures. Authorized dealer for Kohler, TOTO, Brizo, BLANCO, and handcrafted Mexican artisanal pieces.";

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}`,
      languages: {
        en: `${BASE_URL}/en`,
        es: `${BASE_URL}/es`,
        "x-default": `${BASE_URL}/en`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}`,
      locale: isEs ? "es_MX" : "en_US",
      alternateLocale: isEs ? "en_US" : "es_MX",
    },
  };
};

const HomePage = async ({ params }: HomePageProps) => {
  const { locale } = await params;
  setRequestLocale(locale);
  const lang = locale as "en" | "es";

  return (
    <>
      <Header locale={lang} />
      <main>
        <Hero locale={lang} />
        <BrandBar locale={lang} />
        <ShopByRoom locale={lang} />
        <FeaturedProducts locale={lang} />
        <FounderStory locale={lang} />
        <ArtisanalSpotlight locale={lang} />
        <ProjectGallery locale={lang} />
        <TradeTeaser locale={lang} />
        <Testimonial locale={lang} />
        <ContactCTA locale={lang} />
        <NewsletterStrip locale={lang} />
      </main>
      <Footer locale={lang} />
    </>
  );
};

export default HomePage;
