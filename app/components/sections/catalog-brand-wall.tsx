import Image from "next/image";
import { Link } from "@/app/i18n/navigation";
import {
  CATEGORY_BRAND_INDEX,
  type CategoryBrand,
} from "@/app/lib/category-brand-index";
import { artisans } from "@/app/lib/artisan-data";
import { brandTheme } from "@/app/lib/product-visuals";
import type { BrandCount } from "@/app/lib/products-full";

interface CatalogBrandWallProps {
  locale: "en" | "es";
  brandCounts: BrandCount[];
  brandImageMap: Record<string, string>;
  /**
   * Explicit count for the section headline. Defaults to brandCounts.length
   * when not provided. Pinned by page.tsx so the headline and BrowseByDiscipline
   * report the same number when Sheets returns a partial set.
   */
  brandCount?: number;
}

interface Discipline {
  key: string;
  label: { en: string; es: string };
  type: "brand" | "workshop";
}

const DISCIPLINES: Discipline[] = [
  { key: "bathroom", label: { en: "Bathroom", es: "Baño" }, type: "brand" },
  { key: "kitchen", label: { en: "Kitchen", es: "Cocina" }, type: "brand" },
  {
    key: "hardware",
    label: { en: "Door Hardware", es: "Herrajes" },
    type: "brand",
  },
  {
    key: "workshops",
    label: { en: "The Workshops", es: "Los Talleres" },
    type: "workshop",
  },
];

const getUniqueBrands = (key: string): CategoryBrand[] => {
  const sections = CATEGORY_BRAND_INDEX[key];
  if (!sections) return [];
  const seen = new Set<string>();
  const unique: CategoryBrand[] = [];
  for (const section of sections) {
    for (const brand of section.brands) {
      if (!seen.has(brand.name)) {
        seen.add(brand.name);
        unique.push(brand);
      }
    }
  }
  return unique;
};

const brandCountMap = (brandCounts: BrandCount[]): Map<string, number> => {
  const m = new Map<string, number>();
  for (const b of brandCounts) {
    m.set(b.brand, b.count);
  }
  return m;
};

const CatalogBrandWall = ({
  locale,
  brandCounts,
  brandImageMap,
  brandCount,
}: CatalogBrandWallProps) => {
  const counts = brandCountMap(brandCounts);
  const totalBrands = brandCount ?? brandCounts.length ?? 73;

  return (
    <section
      id="brands"
      className="scroll-mt-24 bg-brand-linen py-16 md:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-14 md:mb-20">
          <span className="font-body font-semibold text-[11px] tracking-[0.25em] text-brand-copper uppercase">
            {locale === "es"
              ? "Marcas Autorizadas"
              : "Authorized Brands"}
          </span>
          <h2 className="mt-4 font-display text-3xl md:text-5xl font-light tracking-wide text-brand-charcoal leading-[1.05]">
            {locale === "es" ? (
              <>
                <span className="tabular-nums">{totalBrands}</span> nombres.{" "}
                <span className="italic text-brand-copper">Tres disciplinas.</span>{" "}
                Un catálogo.
              </>
            ) : (
              <>
                <span className="tabular-nums">{totalBrands}</span> names.{" "}
                <span className="italic text-brand-copper">Three rooms.</span>{" "}
                One catalog.
              </>
            )}
          </h2>
          <p className="mt-5 font-body text-base text-dash-text-secondary max-w-2xl leading-relaxed">
            {locale === "es"
              ? "Cada marca que abastecemos — organizada por la disciplina donde vive. Del gres al bronce, de la grifería a la jaladera."
              : "Every brand we source — organized by the discipline where it lives. From porcelain to bronze, from faucetry to hardware."}
          </p>
        </div>

        {/* Discipline sub-sections — continuous scroll, no tabs */}
        <div className="space-y-16 md:space-y-24">
          {DISCIPLINES.map((discipline) => {
            if (discipline.type === "workshop") {
              return (
                <WorkshopSection
                  key={discipline.key}
                  discipline={discipline}
                  locale={locale}
                  brandImageMap={brandImageMap}
                />
              );
            }

            const brands = getUniqueBrands(discipline.key);
            return (
              <DisciplineSection
                key={discipline.key}
                discipline={discipline}
                brands={brands}
                locale={locale}
                counts={counts}
                brandImageMap={brandImageMap}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
};

const DisciplineSection = ({
  discipline,
  brands,
  locale,
  counts,
  brandImageMap,
}: {
  discipline: Discipline;
  brands: CategoryBrand[];
  locale: "en" | "es";
  counts: Map<string, number>;
  brandImageMap: Record<string, string>;
}) => {
  const label = discipline.label[locale];
  const countLabel =
    locale === "es"
      ? `${brands.length} marcas`
      : `${brands.length} brands`;

  return (
    <div>
      {/* Discipline header */}
      <div className="mb-6 md:mb-8">
        <h3 className="font-display text-2xl md:text-3xl font-light tracking-wide text-brand-charcoal">
          {label}
        </h3>
        <div className="mt-2 flex items-center gap-3">
          <div className="h-px flex-1 max-w-16 bg-brand-copper" />
          <span className="font-body text-[11px] tracking-[0.18em] uppercase text-brand-copper">
            {countLabel}
          </span>
        </div>
      </div>

      {/* Brand tile grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {brands.map((brand) => (
          <BrandTile
            key={brand.name}
            brand={brand}
            count={counts.get(brand.name)}
            heroImage={brandImageMap[brand.name]}
            locale={locale}
          />
        ))}
      </div>
    </div>
  );
};

const BrandTile = ({
  brand,
  count,
  heroImage,
  locale,
}: {
  brand: CategoryBrand;
  count?: number;
  heroImage?: string;
  locale: "en" | "es";
}) => {
  const theme = brandTheme(brand.name);
  const href = brand.slug
    ? `/brands/${brand.slug}`
    : `/shop/catalog?brand=${encodeURIComponent(brand.name)}`;

  return (
    <Link
      href={href}
      className="group relative aspect-[4/5] overflow-hidden transition-transform duration-300 hover:-translate-y-0.5"
      style={{ background: theme.bg, color: theme.fg }}
    >
      {heroImage && (
        <Image
          src={heroImage}
          alt={brand.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
        />
      )}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundColor: theme.bg,
          opacity: heroImage ? 0.78 : 1,
        }}
      />
      <div className="absolute inset-0 ring-1 ring-inset ring-black/10 pointer-events-none" />

      <div className="absolute inset-0 flex items-center justify-center px-4">
        <span
          className="font-display font-light tracking-wide text-lg md:text-xl lg:text-2xl text-center"
          style={{ color: theme.fg }}
        >
          {brand.name}
        </span>
      </div>

      {count !== undefined && (
        <div
          className="absolute inset-x-0 bottom-0 px-3 py-2 flex items-center justify-between"
          style={{ background: "rgba(0,0,0,0.22)" }}
        >
          <span
            className="font-mono text-[10px] tabular-nums opacity-85"
            style={{ color: theme.fg }}
          >
            {count.toLocaleString()}
          </span>
          <span
            className="font-body text-[10px] tracking-wider uppercase opacity-0 group-hover:opacity-95 transition-opacity"
            style={{ color: theme.fg }}
          >
            {locale === "es" ? "Ver →" : "View →"}
          </span>
        </div>
      )}
    </Link>
  );
};

const WorkshopSection = ({
  discipline,
  locale,
  brandImageMap,
}: {
  discipline: Discipline;
  locale: "en" | "es";
  brandImageMap: Record<string, string>;
}) => {
  const label = discipline.label[locale];
  const countLabel =
    locale === "es"
      ? `${artisans.length} creadores`
      : `${artisans.length} makers`;

  return (
    <div>
      <div className="mb-6 md:mb-8">
        <h3 className="font-display text-2xl md:text-3xl font-light tracking-wide text-brand-charcoal">
          {label}
        </h3>
        <div className="mt-2 flex items-center gap-3">
          <div className="h-px flex-1 max-w-16 bg-brand-copper" />
          <span className="font-body text-[11px] tracking-[0.18em] uppercase text-brand-copper">
            {countLabel}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {artisans.map((artisan) => (
          <Link
            key={artisan.name}
            href={artisan.href}
            className="group relative aspect-[3/4] overflow-hidden transition-transform duration-300 hover:-translate-y-0.5 bg-brand-charcoal"
          >
            <Image
              src={artisan.image}
              alt={`${artisan.name} — ${artisan.craft[locale]}`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.02] opacity-80"
            />

            {/* ARTISAN tag */}
            <div className="absolute top-3 right-3 z-10">
              <span className="font-body font-semibold text-[9px] tracking-[0.2em] uppercase bg-brand-copper text-white px-2 py-1">
                {locale === "es" ? "ARTESANO" : "ARTISAN"}
              </span>
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 px-4 pb-4">
              <span className="font-display font-light tracking-wide text-xl md:text-2xl text-white block">
                {artisan.name}
              </span>
              <span className="font-body text-[11px] tracking-wider text-white/70 uppercase">
                {artisan.craft[locale]}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export { CatalogBrandWall };
