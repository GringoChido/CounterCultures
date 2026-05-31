import { Link } from "@/app/i18n/navigation";
import { ChevronRight, Sparkles } from "lucide-react";
import { buildDisciplineColumns } from "@/app/lib/catalog-headline";

interface BrowseByDisciplineProps {
  locale: "en" | "es";
}

const COPY = {
  eyebrow: { en: "Browse by Discipline", es: "Explora por Disciplina" },
  headline: {
    en: "Three rooms. Seventy-three brands. One catalog.",
    es: "Tres ambientes. Setenta y tres marcas. Un catálogo.",
  },
  artisanal: { en: "Artisanal Collection", es: "Colección Artesanal" },
  artisanalDesc: {
    en: "Browse handcrafted pieces by Mexico’s master artisans",
    es: "Explora piezas hechas a mano por los maestros artesanos de México",
  },
} as const;

const BrowseByDiscipline = ({ locale }: BrowseByDisciplineProps) => {
  const columns = buildDisciplineColumns(locale);

  return (
    <section className="bg-brand-linen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="mb-10 md:mb-14">
          <p className="font-body text-[11px] uppercase tracking-[0.25em] text-brand-terracotta mb-3">
            {COPY.eyebrow[locale]}
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-light tracking-wide text-brand-charcoal">
            {COPY.headline[locale]}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {columns.map((col) => (
            <div key={col.key}>
              <Link
                href={col.href}
                className="font-display text-lg font-light tracking-wide text-brand-charcoal hover:text-brand-terracotta transition-colors"
              >
                {col.label}
              </Link>
              <div className="mt-1 mb-4 w-8 h-px bg-brand-terracotta" />
              <ul className="space-y-2">
                {col.subcategories.map((sub) => (
                  <li key={sub.href}>
                    <Link
                      href={sub.href}
                      className="font-body text-sm text-dash-text-secondary hover:text-brand-terracotta transition-colors duration-200"
                    >
                      {sub.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href={col.href}
                className="inline-flex items-center gap-1 mt-4 font-body text-xs font-medium text-brand-terracotta hover:text-brand-copper transition-colors"
              >
                {col.viewAllLabel}
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-brand-stone/10">
          <Link
            href="/brands"
            className="flex items-center gap-3 group"
          >
            <Sparkles className="w-4 h-4 text-brand-copper" />
            <span className="font-body text-sm font-medium text-brand-charcoal group-hover:text-brand-terracotta transition-colors">
              {COPY.artisanal[locale]}
            </span>
            <span className="font-body text-xs text-dash-text-secondary">
              {COPY.artisanalDesc[locale]}
            </span>
            <ChevronRight className="w-3 h-3 text-dash-text-secondary ml-auto group-hover:text-brand-terracotta transition-colors" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export { BrowseByDiscipline };
