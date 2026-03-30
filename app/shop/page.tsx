import { Metadata } from "next";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { ShopCatalog } from "./shop-catalog";
import { getProducts } from "@/app/lib/sheets";

export const metadata: Metadata = {
  title: "Shop — Bath, Kitchen & Hardware Fixtures",
  description:
    "Browse our curated collection of luxury bath, kitchen, and door hardware fixtures from Kohler, TOTO, Brizo, BLANCO, Sun Valley Bronze, and Mexican artisans.",
};

const ShopPage = async () => {
  const products = await getProducts();

  return (
    <>
      <Header />
      <main className="pt-16 md:pt-20">
        {/* Hero */}
        <section className="py-16 lg:py-20 bg-brand-linen border-b border-brand-stone/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <span className="font-mono text-xs tracking-[0.2em] text-brand-stone uppercase">
              The Collection
            </span>
            <h1 className="mt-3 font-display text-4xl md:text-5xl lg:text-6xl font-light tracking-wide text-brand-charcoal">
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
      <Footer />
    </>
  );
};

export default ShopPage;
