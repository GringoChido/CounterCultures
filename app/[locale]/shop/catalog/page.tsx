import type { Metadata } from "next";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";
import {
  getQuoteCatalogBrands,
  getCatalogStats,
} from "@/app/lib/products-full";
import { CatalogView } from "./catalog-view";
import { ProjectListBar } from "./project-list-bar";

export const dynamic = "force-dynamic";

const BASE_URL = "https://countercultures.mx";

interface CatalogPageProps {
  params: Promise<{ locale: string }>;
}

export const generateMetadata = async ({
  params,
}: CatalogPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const isEs = locale === "es";
  return {
    title: isEs
      ? "Catálogo completo — Counter Cultures"
      : "Full Catalog — Counter Cultures",
    description: isEs
      ? "Explora más de 350,000 SKUs de Brizo, Kohler, TOTO, Emtek, Blanco, California Faucets, Sun Valley Bronze y más. Solicita cotización directa."
      : "Explore 350,000+ SKUs from Brizo, Kohler, TOTO, Emtek, Blanco, California Faucets, Sun Valley Bronze and more. Request a quote directly.",
    alternates: {
      canonical: `${BASE_URL}/${locale}/shop/catalog`,
      languages: {
        en: `${BASE_URL}/en/shop/catalog`,
        es: `${BASE_URL}/es/shop/catalog`,
        "x-default": `${BASE_URL}/en/shop/catalog`,
      },
    },
    robots: { index: false, follow: true },
  };
};

const CatalogPage = async ({ params }: CatalogPageProps) => {
  const { locale } = await params;
  const isEs = locale === "es";
  const [brandCounts, stats] = await Promise.all([
    getQuoteCatalogBrands(),
    getCatalogStats(),
  ]);

  return (
    <>
      <Header locale={locale} />
      <main className="pt-16 md:pt-20 bg-white">
        {/* Editorial hero */}
        <section className="bg-brand-linen border-b border-brand-stone/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
            <div className="grid lg:grid-cols-[1.6fr_1fr] gap-8 items-end">
              <div>
                <span className="font-body font-semibold text-[11px] tracking-[0.25em] text-brand-stone uppercase">
                  {isEs ? "Catálogo completo" : "The Full Catalog"}
                </span>
                <h1 className="mt-3 font-display text-4xl md:text-6xl font-light tracking-wide text-brand-charcoal leading-[1.05]">
                  {isEs ? (
                    <>
                      {stats.total.toLocaleString("es-MX")}&nbsp;piezas.
                      <br />
                      <span className="italic text-brand-copper">
                        Buscables, especificables,
                      </span>{" "}
                      listas.
                    </>
                  ) : (
                    <>
                      {stats.total.toLocaleString("en-US")} pieces.
                      <br />
                      <span className="italic text-brand-copper">
                        Searchable, specifiable,
                      </span>{" "}
                      ready.
                    </>
                  )}
                </h1>
                <p className="mt-5 font-body text-[15px] md:text-base text-brand-stone max-w-xl leading-relaxed">
                  {isEs
                    ? `Todo el catálogo autorizado de nuestros proveedores en un solo lugar: ${stats.brandCount} marcas, importación directa, respuesta de cotización en 24 horas hábiles. Esta es la herramienta que usan arquitectos y especificadores con proyectos reales.`
                    : `Our full distributor catalog in one place: ${stats.brandCount} brands, factory-direct import, 24-hour quote turnaround. The tool architects and specifiers actually use on real projects.`}
                </p>
              </div>
              <div className="hidden lg:block">
                <div className="grid grid-cols-3 gap-2 text-xs font-body">
                  <div className="p-4 bg-white border border-brand-stone/15">
                    <div className="font-display text-2xl font-light text-brand-charcoal">
                      {stats.brandCount}
                    </div>
                    <div className="mt-1 text-[10px] tracking-[0.2em] text-brand-stone uppercase">
                      {isEs ? "Marcas" : "Brands"}
                    </div>
                  </div>
                  <div className="p-4 bg-white border border-brand-stone/15">
                    <div className="font-display text-2xl font-light text-brand-charcoal">
                      24h
                    </div>
                    <div className="mt-1 text-[10px] tracking-[0.2em] text-brand-stone uppercase">
                      {isEs ? "Respuesta" : "Response"}
                    </div>
                  </div>
                  <div className="p-4 bg-brand-copper text-white">
                    <div className="font-display text-2xl font-light">
                      50%
                    </div>
                    <div className="mt-1 text-[10px] tracking-[0.2em] uppercase">
                      {isEs ? "Depósito" : "Deposit"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <CatalogView
          locale={locale as "en" | "es"}
          brandCounts={brandCounts}
          totalProducts={stats.total}
        />
      </main>
      <Footer locale={locale} />
      <ProjectListBar locale={locale as "en" | "es"} />
    </>
  );
};

export default CatalogPage;
