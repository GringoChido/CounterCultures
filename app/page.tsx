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

const HomePage = () => (
  <>
    <Header />
    <main>
      {/* 1 */} <Hero />
      {/* 2 */} <BrandBar />
      {/* 3 */} <ShopByRoom />
      {/* 4 */} <FeaturedProducts />
      {/* 5 */} <FounderStory />
      {/* 6 */} <ArtisanalSpotlight />
      {/* 7 */} <ProjectGallery />
      {/* 8 */} <TradeTeaser />
      {/* 9 */} <Testimonial />
      {/* 10 */} <ContactCTA />
      {/* 11 */} <NewsletterStrip />
    </main>
    <Footer />
  </>
);

export default HomePage;
