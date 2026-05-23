"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Check } from "lucide-react";
import { pdpHref } from "@/app/lib/pdp-href";
import { SafeProductImage } from "@/app/components/safe-product-image";
import { useProjectStore } from "@/app/lib/stores/project-store";
import { ARTISAN_BRANDS } from "@/app/lib/products-mapping";

interface ProductCardProps {
  id: string;
  sku: string;
  brand: string;
  name: string;
  nameEn: string;
  price: number;
  currency: string;
  finishes: string[];
  image: string;
  category: string;
  subcategory: string;
  slug: string;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("es-MX", { style: "decimal" }).format(price);

const ProductCard = ({
  id,
  sku,
  brand,
  name,
  nameEn,
  price,
  currency,
  finishes,
  image,
  category,
  subcategory,
  slug,
}: ProductCardProps) => {
  const pathname = usePathname();
  const locale = pathname.startsWith("/es") ? "es" : "en";

  const projectAdd = useProjectStore((s) => s.add);
  const inProject = useProjectStore((s) => s.items.some((i) => i.id === id));

  const href = pdpHref(locale, { slug, sku, category, name });

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inProject) return;
    projectAdd({
      id,
      sku,
      name: nameEn || name,
      brand,
      category,
      currency: (currency === "USD" ? "USD" : "MXN") as "MXN" | "USD",
      listPrice: price,
      quantity: 1,
      imageSrc: image,
      productHref: href,
    });
  };

  return (
    <div className="group">
      <Link
        href={href}
        className="block"
      >
        <div className="relative overflow-hidden aspect-square bg-brand-sand/20">
          <SafeProductImage
            id={id}
            brand={brand}
            sku={sku}
            name={nameEn || name}
            imageSrc={image}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            imageClassName="transition-transform duration-500 ease-in-out group-hover:scale-105"
          />
          {ARTISAN_BRANDS.has(brand) && (
            <span className="absolute top-3 left-3 z-20 font-body font-semibold text-[10px] tracking-[0.15em] uppercase bg-brand-copper text-white px-2.5 py-1">
              {locale === "es" ? "Artesanal" : "Artisanal"}
            </span>
          )}

          <button
            type="button"
            onClick={handleAdd}
            disabled={inProject}
            className={`absolute bottom-3 right-3 z-20 flex items-center justify-center w-9 h-9 rounded-full shadow-md transition-all duration-200 cursor-pointer ${
              inProject
                ? "bg-brand-sage text-white"
                : "bg-white/90 text-brand-charcoal hover:bg-brand-copper hover:text-white opacity-0 group-hover:opacity-100"
            }`}
            aria-label={
              inProject
                ? locale === "es" ? "Agregado" : "Added"
                : locale === "es" ? "Agregar al proyecto" : "Add to project"
            }
            title={
              inProject
                ? locale === "es" ? "Agregado al proyecto" : "Added to project"
                : locale === "es" ? "Agregar al proyecto" : "Add to project"
            }
          >
            {inProject ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>

        <div className="mt-4 space-y-1.5">
          {brand && (
            <p className="font-body font-semibold text-xs text-dash-text-secondary tracking-wide uppercase">
              {brand}
            </p>
          )}
          <h3 className="font-body text-sm font-medium text-brand-charcoal group-hover:text-brand-terracotta transition-colors duration-300 leading-snug line-clamp-2">
            {nameEn}
          </h3>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-brand-charcoal">
              ${formatPrice(price)}{" "}
              <span className="text-dash-text-secondary text-xs">{currency}</span>
            </span>
          </div>
          {finishes.length > 1 && (
            <div className="flex items-center gap-1.5 pt-1">
              {finishes.slice(0, 5).map((finish) => (
                <span
                  key={finish}
                  className="w-3 h-3 rounded-full bg-brand-stone/30 border border-brand-stone/20"
                  title={finish}
                />
              ))}
              {finishes.length > 5 && (
                <span className="font-mono text-[10px] text-dash-text-secondary">
                  +{finishes.length - 5}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
};

export { ProductCard, formatPrice };
