"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

interface HeroSearchProps {
  locale: "en" | "es";
  catalogSize: number;
  onDark?: boolean;
}

const T = {
  en: {
    placeholder: "Search by brand, model, or finish…",
    cta: "Open catalog",
    hint: (n: string) => `Search ${n} pieces across 160 brands`,
  },
  es: {
    placeholder: "Busca por marca, modelo o acabado…",
    cta: "Abrir catálogo",
    hint: (n: string) => `Busca ${n} piezas en 160 marcas`,
  },
};

const HeroSearch = ({ locale, catalogSize, onDark = false }: HeroSearchProps) => {
  const t = T[locale];
  const router = useRouter();
  const [q, setQ] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    const target =
      query.length > 0
        ? `/${locale}/shop/catalog?q=${encodeURIComponent(query)}`
        : `/${locale}/shop/catalog`;
    router.push(target);
  };

  return (
    <form onSubmit={submit} className="mt-8 max-w-2xl">
      <div className="flex items-stretch border border-brand-stone/25 bg-white shadow-sm">
        <div className="flex items-center pl-4 pr-1 text-brand-stone">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.placeholder}
          className="flex-1 min-w-0 py-4 px-3 text-base font-body text-brand-charcoal focus:outline-none placeholder:text-brand-stone/60"
        />
        <button
          type="submit"
          className="px-5 sm:px-7 bg-brand-copper text-white font-body font-semibold text-sm tracking-wide hover:bg-brand-copper/90 transition-colors whitespace-nowrap"
        >
          {t.cta} →
        </button>
      </div>
      <p
        className={`mt-2 text-[11px] font-body ${
          onDark ? "text-white/75" : "text-brand-stone"
        }`}
      >
        {t.hint(catalogSize.toLocaleString(locale === "es" ? "es-MX" : "en-US"))}
      </p>
    </form>
  );
};

export { HeroSearch };
