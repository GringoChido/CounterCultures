import { SITE_URL } from "./seo";
import { toSlug } from "./slug";

export interface SlugSource {
  slug?: string;
  name?: string;
  sku: string;
  category: string;
}

const resolveSlug = (product: SlugSource): string => {
  // Always use toSlug when name is available — guarantees consistency
  // with the slug index in products-full.ts. Stored slug field is only
  // used as last resort (no name).
  const slug = product.name
    ? toSlug(product.name, product.sku)
    : (product.slug || toSlug("", product.sku));

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
  baseUrl = SITE_URL
): string => `${baseUrl}${pdpHref(locale, product)}`;
