"use client";

import { Search } from "lucide-react";
import { formatCatalogCount } from "@/app/lib/format-catalog-count";

interface HeroSearchProps {
  locale: "en" | "es";
  catalogSize: number;
}

const T = {
  en: {
    placeholder: "Search by brand, model, or finish…",
    cta: "Search",
    hint: (n: string) => `Search ${n} pieces across 160+ brands`,
  },
  es: {
    placeholder: "Busca por marca, modelo o acabado…",
    cta: "Buscar",
    hint: (n: string) => `Busca ${n} piezas en 160+ marcas`,
  },
};

const openSearchPalette = () => {
  window.dispatchEvent(new CustomEvent("open-search-palette"));
};

const HeroSearch = ({ locale, catalogSize }: HeroSearchProps) => {
  const t = T[locale];

  return (
    <div className="mt-8 max-w-2xl">
      <button
        type="button"
        onClick={openSearchPalette}
        className="w-full flex items-stretch border border-brand-stone/25 bg-dash-surface shadow-sm cursor-text"
      >
        <div className="flex items-center pl-4 pr-1 text-dash-text-secondary">
          <Search className="w-5 h-5" />
        </div>
        <span className="flex-1 min-w-0 py-4 px-3 text-base font-body text-dash-text-secondary/60 text-left">
          {t.placeholder}
        </span>
        <span className="px-5 sm:px-7 bg-brand-copper text-white font-body font-semibold text-sm tracking-wide flex items-center whitespace-nowrap">
          {t.cta} →
        </span>
      </button>
      <p className="mt-2 text-[11px] font-body text-dash-text-secondary">
        {t.hint(formatCatalogCount(catalogSize, locale))}
      </p>
    </div>
  );
};

export { HeroSearch };
