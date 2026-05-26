import type { Metadata } from "next";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.countercultures.com.mx"
).replace(/\/+$/, "");
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;

export type Locale = "en" | "es";
type Bilingual = { en: string; es: string };

interface BuildLocaleMetadataInput {
  locale: Locale;
  /** Path under the locale prefix, e.g. "" for home, "brands", "shop/bathroom" */
  path?: string;
  title: Bilingual;
  description: Bilingual;
  /** Optional alternate OG image URL. Defaults to /og-image.jpg */
  ogImage?: string;
  ogImageAlt?: Bilingual;
  /** Override the title template behavior (use absolute title with no suffix) */
  absoluteTitle?: boolean;
  /** Set to false to noindex the page (e.g. tokenized links, payment receipts) */
  index?: boolean;
}

const cleanPath = (path?: string) =>
  path ? `/${path.replace(/^\/+|\/+$/g, "")}` : "";

/**
 * Single source of truth for page metadata. Returns a fully-formed `Metadata`
 * object with bilingual title/description, hreflang alternates, OG, and
 * Twitter — so a page only declares the bilingual strings + path.
 */
export const buildLocaleMetadata = ({
  locale,
  path,
  title,
  description,
  ogImage = DEFAULT_OG_IMAGE,
  ogImageAlt,
  absoluteTitle = false,
  index = true,
}: BuildLocaleMetadataInput): Metadata => {
  const localizedPath = cleanPath(path);
  const enUrl = `${SITE_URL}/en${localizedPath}`;
  const esUrl = `${SITE_URL}/es${localizedPath}`;
  const canonical = locale === "es" ? esUrl : enUrl;

  const t = title[locale];
  const d = description[locale];
  const altImage = ogImageAlt ? ogImageAlt[locale] : t;

  return {
    title: absoluteTitle ? { absolute: t } : t,
    description: d,
    alternates: {
      canonical,
      languages: {
        en: enUrl,
        es: esUrl,
        "x-default": enUrl,
      },
    },
    openGraph: {
      title: t,
      description: d,
      url: canonical,
      locale: locale === "es" ? "es_MX" : "en_US",
      alternateLocale: locale === "es" ? "en_US" : "es_MX",
      type: "website",
      siteName: "Counter Cultures",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: altImage,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t,
      description: d,
      images: [ogImage],
    },
    robots: index
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        }
      : { index: false, follow: false },
  };
};
