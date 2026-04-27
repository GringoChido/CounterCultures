/**
 * Search index builder.
 *
 * Pulls brands + articles, returns a flat array of bilingual search documents
 * the client can load once and search in-memory with MiniSearch. Deliberately
 * does NOT include the 354k full-catalog products — that lives behind the
 * existing `/shop/catalog?q=` server-side search to keep the client index small
 * (~50KB for ~163 entries).
 */

import { getBrands } from "./brand-kit-sheets";
import { getAllArticles } from "./posts-sheet";

export type SearchDocType = "brand" | "article";

export interface SearchDoc {
  /** Stable key — `${type}:${slug}` so MiniSearch IDs don't collide across types. */
  id: string;
  type: SearchDocType;
  slug: string;
  /** Display name in EN — what the client renders by default if locale mismatch. */
  nameEn: string;
  nameEs: string;
  /** Short subtitle (tagline / pillar / category) */
  subtitleEn: string;
  subtitleEs: string;
  /** Body text — searchable but not displayed in result rows. */
  bodyEn: string;
  bodyEs: string;
  /** Categories (brand) or pillar (article) — extra search keywords. */
  keywords: string;
  /** Path the result row navigates to when clicked. Locale prefix applied client-side. */
  hrefSuffix: string;
  /** True if external link — client opens in new tab. */
  external?: boolean;
}

export interface SearchIndexPayload {
  generatedAt: string;
  documents: SearchDoc[];
}

const stripMarkdown = (md: string): string =>
  md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[.*?\]\(.*?\)/g, " ")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/[#>*_`~]/g, " ")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const buildSearchIndex = async (): Promise<SearchIndexPayload> => {
  const [brands, articles] = await Promise.all([
    getBrands().catch(() => []),
    getAllArticles().catch(() => []),
  ]);

  const brandDocs: SearchDoc[] = brands.map((b) => ({
    id: `brand:${b.slug}`,
    type: "brand",
    slug: b.slug,
    nameEn: b.name,
    nameEs: b.name,
    subtitleEn: b.taglineEn || b.originCountryName || "",
    subtitleEs: b.taglineEs || b.taglineEn || b.originCountryName || "",
    bodyEn: b.descriptionEn || "",
    bodyEs: b.descriptionEs || b.descriptionEn || "",
    keywords: [
      b.originCountry,
      b.originCountryName,
      ...(b.categorySlugs || []),
      b.primaryCategorySlug,
    ]
      .filter(Boolean)
      .join(" "),
    hrefSuffix:
      b.stockedState === "external" && (b.externalUrl || b.websiteUrl)
        ? b.externalUrl || b.websiteUrl
        : `/brands/${b.slug}`,
    external: b.stockedState === "external" && Boolean(b.externalUrl || b.websiteUrl),
  }));

  // Filter draft articles out of public search. Sheet-backed articles carry a
  // `status` field; hardcoded ones don't (treat as published).
  const publishedArticles = articles.filter(
    (a) => !("status" in a) || (a as { status?: string }).status !== "draft",
  );

  const articleDocs: SearchDoc[] = publishedArticles.map((a) => ({
    id: `article:${a.slug}`,
    type: "article",
    slug: a.slug,
    nameEn: a.title.en,
    nameEs: a.title.es,
    subtitleEn: a.pillar,
    subtitleEs: a.pillar,
    bodyEn: `${a.excerpt.en} ${stripMarkdown(a.body?.en || "")}`.slice(0, 1200),
    bodyEs: `${a.excerpt.es} ${stripMarkdown(a.body?.es || "")}`.slice(0, 1200),
    keywords: [a.pillar, ...(a.brandSlugs || [])].join(" "),
    hrefSuffix: `/insights/${a.slug}`,
  }));

  return {
    generatedAt: new Date().toISOString(),
    documents: [...brandDocs, ...articleDocs],
  };
};
