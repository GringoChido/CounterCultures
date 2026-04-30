import Link from "next/link";
import type { BrandCount } from "@/app/lib/products-full";
import type { Brand } from "@/app/lib/brand-kit-types";

interface CatalogDepthBandProps {
  locale: "en" | "es";
  brandCounts: BrandCount[];
  allBrands: Brand[];
  totalCatalog: number;
  /** How many brands to show in the leaderboard. Default: 10. */
  limit?: number;
}

/**
 * Catalog-depth leaderboard with the data itself as the texture.
 * Each row gets a copper-tinted depth bar scaled to the brand's
 * relative SKU count, so the section reads at a glance — no need
 * to parse numbers to feel the scale.
 */
const CatalogDepthBand = ({
  locale,
  brandCounts,
  allBrands,
  totalCatalog,
  limit = 10,
}: CatalogDepthBandProps) => {
  const isEs = locale === "es";
  const numFmt = isEs ? "es-MX" : "en-US";

  const top = brandCounts
    .filter((b) => b.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  if (top.length === 0) return null;

  const maxCount = top[0].count; // biggest entry sets the scale

  return (
    <section className="relative py-16 md:py-24 bg-brand-linen overflow-hidden">
      {/* Soft copper wash on the right margin — frames the data as warm */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-32 w-[520px] h-[520px] rounded-full opacity-[0.10] blur-3xl"
        style={{ background: "radial-gradient(closest-side, #B87333, transparent)" }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header — full-width editorial layout, dramatic stat on the right */}
        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-10 lg:gap-16 items-end mb-12 md:mb-16">
          <div>
            <p className="font-body font-semibold text-[11px] tracking-[0.25em] text-brand-copper uppercase">
              {isEs ? "Profundidad real" : "Real depth"}
            </p>
            <h2 className="mt-3 font-display text-4xl md:text-5xl lg:text-6xl font-light tracking-wide text-brand-charcoal leading-[1.05]">
              {isEs ? (
                <>
                  Algunas marcas las{" "}
                  <span className="italic text-brand-copper">
                    conocemos por dentro.
                  </span>
                </>
              ) : (
                <>
                  Some brands we know{" "}
                  <span className="italic text-brand-copper">inside out.</span>
                </>
              )}
            </h2>
            <p className="mt-5 font-body text-base md:text-lg text-brand-stone max-w-xl leading-relaxed">
              {isEs
                ? "Ranking por SKUs autorizados disponibles para especificar. Entre más profunda la barra, más opciones tienes."
                : "Ranked by authorized SKUs we can pull from. The deeper the bar, the more there is to spec."}
            </p>
          </div>

          {/* Right-side total stat — anchors the scale */}
          <div className="lg:text-right">
            <p className="font-body font-semibold text-[11px] tracking-[0.25em] text-brand-stone uppercase">
              {isEs ? "Catálogo completo" : "Full catalog"}
            </p>
            <p className="mt-2 font-display text-5xl md:text-6xl font-light text-brand-charcoal tabular-nums leading-none">
              {totalCatalog.toLocaleString(numFmt)}
            </p>
            <p className="mt-2 font-body text-sm text-brand-stone">
              {isEs ? "piezas autorizadas" : "authorized pieces"}
            </p>
            <Link
              href={`/${locale}/shop/catalog`}
              className="mt-5 inline-flex items-center gap-2 font-body text-sm font-semibold tracking-wide text-brand-copper hover:text-brand-charcoal transition-colors"
            >
              {isEs ? "Buscar el catálogo" : "Search the catalog"} →
            </Link>
          </div>
        </div>

        {/* Leaderboard — bar visualization makes scale visible */}
        <ol className="border-t border-brand-stone/15">
          {top.map((b, i) => {
            const slug = allBrands.find(
              (br) => br.name.toLowerCase() === b.brand.toLowerCase()
            )?.slug;
            const href = slug
              ? `/${locale}/brands/${slug}`
              : `/${locale}/shop/catalog?brand=${encodeURIComponent(b.brand)}`;
            const widthPct = Math.max(2, Math.round((b.count / maxCount) * 100));
            return (
              <li
                key={b.brand}
                className="border-b border-brand-stone/15"
              >
                <Link
                  href={href}
                  className="group block py-5 md:py-6 transition-colors hover:bg-white/60"
                >
                  <div className="flex items-baseline justify-between gap-4 mb-2.5">
                    <div className="flex items-baseline gap-4 min-w-0">
                      <span className="font-mono text-xs text-brand-stone w-7 shrink-0 tabular-nums">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="font-display text-2xl md:text-3xl font-light text-brand-charcoal group-hover:text-brand-copper transition-colors truncate">
                        {b.brand}
                      </span>
                    </div>
                    <span className="font-mono text-sm md:text-base text-brand-charcoal tabular-nums shrink-0 group-hover:text-brand-copper transition-colors">
                      {b.count.toLocaleString(numFmt)}
                      <span className="ml-1 text-[10px] tracking-[0.2em] uppercase text-brand-stone group-hover:text-brand-copper/70">
                        SKUs
                      </span>
                    </span>
                  </div>

                  {/* Depth bar — the visual hook */}
                  <div className="ml-11 h-[3px] bg-brand-stone/15 overflow-hidden">
                    <div
                      className="h-full bg-brand-copper origin-left transition-transform duration-700 ease-out group-hover:bg-brand-charcoal"
                      style={{
                        transform: `scaleX(${widthPct / 100})`,
                      }}
                    />
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
};

export { CatalogDepthBand };
