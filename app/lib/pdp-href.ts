import { toSlug } from "./slug";

export interface SlugSource {
  slug?: string;
  name?: string;
  sku: string;
  category: string;
}

const resolveSlug = (product: SlugSource): string => {
  const slug =
    product.slug ||
    (product.name ? toSlug(product.name, product.sku) : product.sku.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));

  if (!slug || slug === "undefined") {
    throw new Error(
      `[pdpHref] slug resolved to "${slug}" for sku=${product.sku}. This is a bug — every product must have a slug.`
    );
  }

  return slug;
};

export const pdpPath = (product: SlugSource): string =>
  `/shop/${product.category}/p/${resolveSlug(product)}`;

export const pdpHref = (locale: string, product: SlugSource): string =>
  `/${locale}${pdpPath(product)}`;

export const pdpUrl = (
  locale: string,
  product: SlugSource,
  baseUrl = "https://countercultures.mx"
): string => `${baseUrl}${pdpHref(locale, product)}`;
