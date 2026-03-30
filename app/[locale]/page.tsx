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

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

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
