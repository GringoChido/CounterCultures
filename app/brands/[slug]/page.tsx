import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import { ShopCatalog } from "@/app/shop/shop-catalog";
import { getProductsByBrand } from "@/app/lib/sheets";
import { BRANDS } from "@/app/lib/constants";

interface BrandPageProps {
  params: Promise<{ slug: string }>;
}

export const generateMetadata = async ({ params }: BrandPageProps): Promise<Metadata> => {
  const { slug } = await params;
  const brand = BRANDS.find((b) => b.slug === slug);
  if (!brand) return { title: "Brand Not Found" };

  return {
    title: `${brand.name} — Authorized Dealer in San Miguel de Allende`,
    description: `Shop ${brand.name} bath, kitchen, and hardware fixtures at Counter Cultures. Authorized dealer in San Miguel de Allende, Mexico.`,
  };
};

const BrandPage = async ({ params }: BrandPageProps) => {
  const { slug } = await params;
  const brand = BRANDS.find((b) => b.slug === slug);

  if (!brand) notFound();

  const products = await getProductsByBrand(brand.name);

  return (
    <>
      <Header />
      <main className="pt-16 md:pt-20">
        <section className="py-16 lg:py-24 bg-brand-charcoal text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <span className="font-mono text-xs tracking-[0.2em] text-brand-stone uppercase">
              Authorized Dealer
            </span>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl md:text-7xl font-light tracking-wider">
              {brand.name}
            </h1>
            <p className="mt-6 font-body text-base text-white/60 max-w-xl leading-relaxed">
              Shop the complete {brand.name} collection at Counter Cultures.
              Expert consultation, local support, and installation guidance in
              San Miguel de Allende.
            </p>
          </div>
        </section>

        {/* Why buy from Counter Cultures */}
        <section className="py-12 bg-brand-sand/20 border-b border-brand-stone/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="font-body text-sm font-semibold text-brand-charcoal">
                  Authorized Dealer
                </h3>
                <p className="mt-2 font-body text-sm text-brand-stone">
                  Full manufacturer warranty, genuine products, and factory-direct
                  support.
                </p>
              </div>
              <div>
                <h3 className="font-body text-sm font-semibold text-brand-charcoal">
                  Local Expertise
                </h3>
                <p className="mt-2 font-body text-sm text-brand-stone">
                  20 years of experience specifying {brand.name} for Mexican homes,
                  hotels, and commercial projects.
                </p>
              </div>
              <div>
                <h3 className="font-body text-sm font-semibold text-brand-charcoal">
                  Installation Support
                </h3>
                <p className="mt-2 font-body text-sm text-brand-stone">
                  Specification guidance, plumber coordination, and post-install
                  support — all in San Miguel de Allende.
                </p>
              </div>
            </div>
          </div>
        </section>

        <ShopCatalog initialProducts={products} />
      </main>
      <Footer />
    </>
  );
};

export default BrandPage;
