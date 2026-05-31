import { PRODUCT_CATEGORIES, type CategoryKey } from "./constants";

const MIN_QUERY = 2;

type Locale = "en" | "es";

export const getSectionEyebrow = (
  query: string,
  brand: string,
  category: string,
  sortKey: string,
  locale: Locale,
): string =>
  query.trim().length >= MIN_QUERY
    ? locale === "es" ? "Resultados" : "Results"
    : brand
      ? locale === "es" ? "Marca" : "Brand"
      : category !== "all"
        ? locale === "es" ? "Categoría" : "Category"
        : sortKey === "most_specified"
          ? locale === "es" ? "Más especificados" : "Most Specified"
          : locale === "es" ? "Explorar" : "Browse";

export const getSectionHeadline = (
  query: string,
  brand: string,
  category: string,
  locale: Locale,
): string =>
  query.trim().length >= MIN_QUERY
    ? `"${query.trim()}"`
    : brand
      ? brand
      : category === "bathroom"
        ? locale === "es" ? "Baño" : "Bathroom"
        : category === "kitchen"
          ? locale === "es" ? "Cocina" : "Kitchen"
          : category === "hardware"
            ? locale === "es" ? "Chapas y Herrajes" : "Door Hardware"
            : locale === "es"
              ? "Explora el Catálogo"
              : "Explore the Catalog";

export interface DisciplineColumn {
  key: CategoryKey;
  label: string;
  href: string;
  subcategories: Array<{ label: string; href: string }>;
  viewAllLabel: string;
}

export const buildDisciplineColumns = (locale: Locale): DisciplineColumn[] =>
  (Object.entries(PRODUCT_CATEGORIES) as [CategoryKey, (typeof PRODUCT_CATEGORIES)[CategoryKey]][]).map(
    ([key, cat]) => ({
      key,
      label: cat.label[locale],
      href: `/shop/${key}`,
      subcategories: cat.subcategories.map((sub) => ({
        label: sub.label[locale],
        href: `/shop/${key}/${sub.slug}`,
      })),
      viewAllLabel:
        locale === "es"
          ? `Ver Todo ${cat.label[locale]}`
          : `View All ${cat.label[locale]}`,
    }),
  );
