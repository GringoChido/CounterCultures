"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, ArrowUpRight } from "lucide-react";
import type { Brand, CategorySlug } from "@/app/lib/brand-kit-types";
import { CATEGORY_LABELS } from "@/app/lib/brand-kit-types";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

interface BrandCardData {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  originCountry: string;
  originCountryName: string;
  heroImage?: string;
  primaryCategorySlug: string;
  categorySlugs: CategorySlug[];
  stockedState: string;
  externalHref?: string;
  internalHref: string;
  catalogCount?: number;
}

interface BrandsGridProps {
  locale: "en" | "es";
  brands: BrandCardData[];
  /** Total count of brands marked stocked across the entire catalog (not just nonFlagship). Drives the counter copy. */
  totalStockedCount: number;
  /** Total brand count across the catalog. */
  totalBrandCount: number;
}

const CATEGORY_OPTIONS: Array<CategorySlug | "all"> = [
  "all",
  "faucetry-showers",
  "door-cabinet-hardware",
  "bathroom-sinks",
  "kitchen-sinks",
  "drains",
  "toilets",
  "bathtubs",
  "appliances",
  "other",
];

export const BrandsGrid = ({
  locale,
  brands,
  totalStockedCount,
  totalBrandCount,
}: BrandsGridProps) => {
  const isEs = locale === "es";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const stockedOnlyParam = searchParams.get("stocked") === "1";
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategorySlug | "all">("all");
  const [stockedOnly, setStockedOnly] = useState(stockedOnlyParam);

  // Keep state in sync if the URL param changes externally (back/forward nav).
  useEffect(() => {
    setStockedOnly(stockedOnlyParam);
  }, [stockedOnlyParam]);

  // Toggle handler: push the new URL so the chip is shareable / back-buttonable.
  const toggleStockedOnly = useCallback(() => {
    const next = !stockedOnly;
    setStockedOnly(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set("stocked", "1");
    else params.delete("stocked");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [stockedOnly, pathname, router, searchParams]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return brands.filter((b) => {
      if (stockedOnly && b.stockedState !== "stocked") return false;
      if (category !== "all") {
        const inCats =
          b.primaryCategorySlug === category ||
          b.categorySlugs.includes(category);
        if (!inCats) return false;
      }
      if (q) {
        return (
          b.name.toLowerCase().includes(q) ||
          b.slug.includes(q) ||
          b.tagline.toLowerCase().includes(q) ||
          b.originCountryName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [brands, query, category, stockedOnly]);

  // Build A-Z anchor index (only letters that appear in the filtered set)
  const letterToFirstSlug = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of filtered) {
      const letter = b.name.charAt(0).toUpperCase();
      if (!map.has(letter)) map.set(letter, b.slug);
    }
    return map;
  }, [filtered]);

  const scrollToLetter = (letter: string) => {
    const slug = letterToFirstSlug.get(letter);
    if (!slug) return;
    const el = document.getElementById(`brand-${slug}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Sticky filter bar — add shadow when scrolled past its natural position
  const barRef = useRef<HTMLDivElement | null>(null);
  const [barStuck, setBarStuck] = useState(false);
  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setBarStuck(entry.intersectionRatio < 1),
      { threshold: [1] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      {/* Catalog-wide stocking counter — sits above the grid as a discoverable
          headline, not buried inside a card. Acts as the visual home of CC's
          biggest commercial advantage. */}
      <p className="mb-5 font-body text-xs tracking-[0.18em] uppercase text-brand-stone/80">
        <span className="font-mono text-brand-charcoal">{totalBrandCount}</span>{" "}
        {isEs ? "marcas" : "brands"}
        <span className="mx-2 text-brand-stone/30">·</span>
        <span className="font-mono text-brand-copper">{totalStockedCount}</span>{" "}
        {isEs ? "en stock local" : "stocked locally"}
      </p>

      {/* Sticky filter bar */}
      <div
        ref={barRef}
        className={`sticky top-16 md:top-20 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 mb-10 bg-brand-linen/95 backdrop-blur-sm transition-shadow ${
          barStuck ? "shadow-[0_6px_12px_-10px_rgba(0,0,0,0.25)]" : ""
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-stone/50" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  isEs ? "Buscar marca…" : "Search brands…"
                }
                className="w-full pl-9 pr-3 py-2 bg-white border border-brand-stone/20 rounded-lg text-sm font-body text-brand-charcoal placeholder:text-brand-stone/40 focus:outline-none focus:border-brand-copper/40 focus:ring-2 focus:ring-brand-copper/20"
              />
            </div>
            {/* Category */}
            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as CategorySlug | "all")
              }
              className="px-3 py-2 bg-white border border-brand-stone/20 rounded-lg text-sm font-body text-brand-charcoal focus:outline-none focus:border-brand-copper/40 focus:ring-2 focus:ring-brand-copper/20"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c === "all"
                    ? isEs
                      ? "Todas las categorías"
                      : "All categories"
                    : CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>

            {/* Stocked-only chip — copper accent so it reads as the primary
                commercial filter even amidst the search/category controls. */}
            <button
              type="button"
              onClick={toggleStockedOnly}
              aria-pressed={stockedOnly}
              className={`group inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-body font-semibold tracking-wide transition-colors border cursor-pointer ${
                stockedOnly
                  ? "bg-brand-copper text-white border-brand-copper hover:bg-brand-copper/90"
                  : "bg-white text-brand-charcoal border-brand-stone/25 hover:border-brand-copper/60 hover:text-brand-copper"
              }`}
            >
              <span
                aria-hidden
                className={`w-2 h-2 rounded-full transition-colors ${
                  stockedOnly ? "bg-white" : "bg-brand-copper"
                }`}
              />
              {stockedOnly
                ? isEs ? "Mostrando solo en stock" : "Showing in-stock only"
                : isEs ? "Solo lo que tenemos en stock" : "Show in-stock only"}
            </button>
          </div>

          {/* Count */}
          <span className="font-body text-xs text-brand-stone/70 tracking-wider uppercase">
            {isEs
              ? `Mostrando ${filtered.length} de ${brands.length}`
              : `Showing ${filtered.length} of ${brands.length}`}
          </span>
        </div>

        {/* A-Z anchors (hidden on mobile — too dense) */}
        <div className="hidden md:flex items-center gap-0.5 mt-3 overflow-x-auto">
          {ALPHABET.map((letter) => {
            const has = letterToFirstSlug.has(letter);
            return (
              <button
                key={letter}
                onClick={() => scrollToLetter(letter)}
                disabled={!has}
                className={`w-7 h-7 flex items-center justify-center text-xs font-body font-medium rounded transition-colors ${
                  has
                    ? "text-brand-charcoal hover:bg-brand-copper/15 hover:text-brand-copper cursor-pointer"
                    : "text-brand-stone/30 cursor-not-allowed"
                }`}
              >
                {letter}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-body text-sm text-brand-stone">
            {isEs
              ? "No encontramos marcas con estos filtros."
              : "No brands match those filters."}
          </p>
          <button
            onClick={() => {
              setQuery("");
              setCategory("all");
              if (stockedOnly) toggleStockedOnly();
            }}
            className="mt-3 font-body text-xs text-brand-terracotta hover:underline tracking-wider uppercase cursor-pointer"
          >
            {isEs ? "Limpiar filtros" : "Clear filters"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((brand) => (
            <BrandCard key={brand.slug} brand={brand} isEs={isEs} />
          ))}
        </div>
      )}
    </>
  );
};

interface BrandCardProps {
  brand: BrandCardData;
  isEs: boolean;
}

const BrandCard = ({ brand, isEs }: BrandCardProps) => {
  const isExternal = brand.stockedState === "external";
  const isStocked = brand.stockedState === "stocked";
  const href = isExternal && brand.externalHref
    ? brand.externalHref
    : brand.internalHref;

  const stockedTooltip = isEs
    ? "En stock en nuestro showroom"
    : "In stock at our showroom";

  const cardBody = (
    <>
      <div className="absolute top-0 left-0 w-0 h-0.5 bg-brand-copper transition-all duration-500 group-hover:w-full z-10" />

      {/* Subtle stocked indicator — small filled copper dot, no label.
          Sits in the top-right of the card, with a faint white halo for
          contrast against either dark or light backgrounds underneath. */}
      {isStocked && (
        <span
          aria-label={stockedTooltip}
          title={stockedTooltip}
          className="absolute top-3 right-3 z-30 w-2.5 h-2.5 rounded-full bg-brand-copper ring-2 ring-white/80 shadow-[0_0_0_1px_rgba(0,0,0,0.05)]"
        />
      )}

      {brand.heroImage ? (
        <div className="relative h-44 sm:h-48 overflow-hidden">
          <Image
            src={brand.heroImage}
            alt={brand.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
          <h3 className="absolute bottom-3 left-5 font-display text-2xl font-light text-white tracking-wide">
            {brand.name}
          </h3>
        </div>
      ) : (
        <div className="relative h-44 sm:h-48 overflow-hidden bg-brand-charcoal flex items-end">
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h1v40H0zM0 0v1h40V0z' fill='%23ffffff'/%3E%3C/svg%3E\")",
            }}
          />
          <h3 className="relative font-display text-2xl font-light text-white tracking-wide px-5 pb-3">
            {brand.name}
          </h3>
        </div>
      )}

      <div className="p-5 flex flex-col flex-1">
        {brand.originCountryName && (
          <p className="font-body font-semibold text-[10px] text-brand-terracotta tracking-[0.15em] uppercase">
            {brand.originCountryName}
          </p>
        )}
        {brand.tagline && (
          <p className="mt-1.5 font-body text-xs text-brand-stone/80 tracking-wide italic">
            {brand.tagline}
          </p>
        )}
        {brand.description && (
          <p className="mt-2.5 font-body text-sm text-brand-stone leading-relaxed line-clamp-2">
            {brand.description}
          </p>
        )}
        <div className="mt-auto pt-3 flex items-center justify-between gap-2">
          {brand.catalogCount && brand.catalogCount > 0 ? (
            <span className="font-body text-[10px] tracking-[0.15em] uppercase text-brand-stone/70">
              <span className="font-mono text-brand-copper">
                {brand.catalogCount.toLocaleString()}
              </span>{" "}
              {isEs ? "piezas" : "pieces"}
            </span>
          ) : (
            <span />
          )}
          {isExternal && (
            <span className="flex items-center gap-1.5 text-[10px] text-brand-stone/50 tracking-wider uppercase">
              <ArrowUpRight className="w-3 h-3" />
              {isEs ? "Sitio externo" : "External site"}
            </span>
          )}
        </div>
      </div>
    </>
  );

  if (isExternal && brand.externalHref) {
    return (
      <a
        id={`brand-${brand.slug}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative bg-white border border-brand-stone/8 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-lg hover:border-brand-copper/20 hover:-translate-y-0.5"
      >
        {cardBody}
      </a>
    );
  }

  return (
    <Link
      id={`brand-${brand.slug}`}
      href={href}
      className="group relative bg-white border border-brand-stone/8 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-lg hover:border-brand-copper/20 hover:-translate-y-0.5"
    >
      {cardBody}
    </Link>
  );
};
