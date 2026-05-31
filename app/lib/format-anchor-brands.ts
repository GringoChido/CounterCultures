type Locale = "en" | "es";

export const formatAnchorBrands = (brands: string[], locale: Locale): string => {
  if (brands.length === 0) return "";
  if (brands.length === 1) return brands[0];
  const conjunction = locale === "es" ? " y " : " and ";
  const head = brands.slice(0, -1).join(", ");
  return `${head}${conjunction}${brands[brands.length - 1]}`;
};
