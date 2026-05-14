const DIACRITICS: Record<string, string> = {
  à: "a", á: "a", â: "a", ã: "a", ä: "a", å: "a",
  è: "e", é: "e", ê: "e", ë: "e",
  ì: "i", í: "i", î: "i", ï: "i",
  ò: "o", ó: "o", ô: "o", õ: "o", ö: "o",
  ù: "u", ú: "u", û: "u", ü: "u",
  ñ: "n", ç: "c", ß: "ss",
};

const deAccent = (s: string): string =>
  s.normalize("NFC").replace(/[àáâãäåèéêëìíîïòóôõöùúûüñçß]/gi, (ch) => DIACRITICS[ch.toLowerCase()] ?? ch);

const MAX_NAME_CHARS = 60;
const MAX_SLUG = 80;

export const toSlug = (name: string, sku: string): string => {
  const cleanName = deAccent(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, MAX_NAME_CHARS)
    .replace(/-$/, "");

  const cleanSku = sku.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const slug = cleanName ? `${cleanName}-${cleanSku}` : cleanSku;
  return slug.slice(0, MAX_SLUG).replace(/-$/, "");
};

export const extractSkuFromSlug = (slug: string): string | null => {
  const lastDash = slug.lastIndexOf("-");
  if (lastDash === -1) return slug;
  return slug;
};
