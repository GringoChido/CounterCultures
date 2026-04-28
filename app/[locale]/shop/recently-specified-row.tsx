"use client";

import Link from "next/link";
import { TrendingUp } from "lucide-react";
import type { RecentlySpecifiedTile } from "@/app/lib/recently-specified";
import { ProductVisual } from "@/app/components/product-visual";

interface RecentlySpecifiedRowProps {
  items: RecentlySpecifiedTile[];
  locale: "en" | "es";
}

const T = {
  en: {
    eyebrow: "Recently specified",
    headline: "What's actually going into homes and projects this year.",
    subhead: "Ranked by real order history — not an editor's pick.",
    specifiedIn: (n: number) =>
      n === 1 ? "1 project" : `${n} projects`,
    from: "from",
    viewDetails: "View details",
  },
  es: {
    eyebrow: "Recientemente especificado",
    headline: "Lo que realmente se está instalando en casas y proyectos este año.",
    subhead: "Ordenado por historial de pedidos real — no por intuición del editor.",
    specifiedIn: (n: number) =>
      n === 1 ? "1 proyecto" : `${n} proyectos`,
    from: "desde",
    viewDetails: "Ver detalles",
  },
};

const Tile = ({
  item,
  locale,
  t,
}: {
  item: RecentlySpecifiedTile;
  locale: "en" | "es";
  t: (typeof T)["en"];
}) => {
  const price =
    item.listPrice > 0
      ? `${item.currency} ${item.listPrice.toLocaleString(
          locale === "es" ? "es-MX" : "en-US",
          { maximumFractionDigits: 0 }
        )}`
      : null;
  const href =
    `/${locale}/shop/catalog?brand=${encodeURIComponent(item.brand)}` +
    (item.sku ? `&q=${encodeURIComponent(item.sku)}` : "");
  return (
    <Link
      href={href}
      className="group shrink-0 w-[260px] snap-start bg-white border border-brand-stone/15 hover:border-brand-copper/60 transition-colors"
    >
      <div className="relative">
        <ProductVisual
          id={item.id}
          brand={item.brand}
          sku={item.sku}
          name={item.name || item.sku}
          aspect="4/3"
          size="card"
          className="group-hover:[&>img]:scale-[1.02] [&>img]:transition-transform [&>img]:duration-500"
        />
        {/* Project count badge — overlays both image and typographic cards */}
        <div className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-1 bg-brand-charcoal/90 text-white text-[10px] font-body tracking-wide backdrop-blur-sm">
          <TrendingUp className="w-3 h-3 text-brand-copper" />
          {t.specifiedIn(item.projectCount)}
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <span className="font-body text-[10px] tracking-[0.15em] text-brand-copper uppercase">
            {item.brand || "—"}
          </span>
        </div>
        <h3 className="font-body font-medium text-sm text-brand-charcoal line-clamp-2 leading-snug group-hover:text-brand-copper transition-colors">
          {item.name || item.sku}
        </h3>
        <p className="mt-1 font-mono text-[10px] text-brand-stone truncate">
          {item.sku || "—"}
        </p>
        {price && (
          <p className="mt-2 pt-2 border-t border-brand-stone/10 font-body text-[11px] text-brand-stone">
            <span>{t.from}</span>{" "}
            <span className="text-brand-charcoal font-medium">{price}</span>
          </p>
        )}
      </div>
    </Link>
  );
};

const RecentlySpecifiedRow = ({ items, locale }: RecentlySpecifiedRowProps) => {
  const t = T[locale];
  if (items.length === 0) return null;
  return (
    <section className="py-14 md:py-20 bg-white border-b border-brand-stone/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-6 mb-8">
          <div>
            <p className="font-body font-semibold text-[11px] tracking-[0.25em] text-brand-copper uppercase">
              {t.eyebrow}
            </p>
            <h2 className="mt-3 font-display text-3xl md:text-4xl font-light tracking-wide text-brand-charcoal leading-[1.1] max-w-2xl">
              {t.headline}
            </h2>
            <p className="mt-2 font-body text-sm text-brand-stone">
              {t.subhead}
            </p>
          </div>
        </div>
      </div>
      {/* Horizontal scroller — full-bleed right, padded left */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
          {items.map((item) => (
            <Tile key={item.id} item={item} locale={locale} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
};

export { RecentlySpecifiedRow };
