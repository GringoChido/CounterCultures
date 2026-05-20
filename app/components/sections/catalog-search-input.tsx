"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "@/app/i18n/navigation";
import { Search } from "lucide-react";

interface CatalogSearchInputProps {
  locale: "en" | "es";
  totalCatalog: number;
}

const CatalogSearchInput = ({ locale, totalCatalog }: CatalogSearchInputProps) => {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const isEs = locale === "es";
  const numFmt = isEs ? "es-MX" : "en-US";
  const count = totalCatalog.toLocaleString(numFmt);

  const placeholder = isEs
    ? `Busca entre ${count} piezas…`
    : `Search ${count} pieces…`;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/shop/catalog?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex items-center gap-0 max-w-md">
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dash-text-secondary/50 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 rounded-l-full border border-brand-stone/25 border-r-0 bg-white font-body text-sm text-brand-charcoal placeholder:text-dash-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper/40"
        />
      </div>
      <button
        type="submit"
        className="px-5 py-2.5 rounded-r-full bg-brand-copper text-white font-body text-sm font-semibold tracking-wide hover:bg-brand-copper/90 transition-colors cursor-pointer shrink-0"
      >
        {isEs ? "Buscar" : "Search"}
      </button>
    </form>
  );
};

export { CatalogSearchInput };
