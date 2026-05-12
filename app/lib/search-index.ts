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
import { FLAGSHIP_FALLBACK } from "./featured-brands";

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

  if (!brands.length) {
    console.warn("[search-index] getBrands() returned empty — using FLAGSHIP_FALLBACK for brand search docs");
  }

  const brandDocs: SearchDoc[] = brands.length > 0
    ? brands.map((b) => {
        const nameTokens = b.name.toLowerCase().split(/\s+/);
        return {
          id: `brand:${b.slug}`,
          type: "brand" as const,
          slug: b.slug,
          nameEn: b.name,
          nameEs: b.name,
          subtitleEn: b.taglineEn || b.originCountryName || "",
          subtitleEs: b.taglineEs || b.taglineEn || b.originCountryName || "",
          bodyEn: b.descriptionEn || "",
          bodyEs: b.descriptionEs || b.descriptionEn || "",
          keywords: [
            ...nameTokens,
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
        };
      })
    : Object.entries(FLAGSHIP_FALLBACK).map(([slug, meta]) => {
        const nameTokens = meta.name.toLowerCase().split(/\s+/);
        return {
          id: `brand:${slug}`,
          type: "brand" as const,
          slug,
          nameEn: meta.name,
          nameEs: meta.name,
          subtitleEn: "",
          subtitleEs: "",
          bodyEn: "",
          bodyEs: "",
          keywords: nameTokens.join(" "),
          hrefSuffix: `/brands/${slug}`,
        };
      });

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

  // Dedup by `id` to defend against upstream data with duplicate slugs.
  // MiniSearch.addAll throws on the second duplicate-ID document, breaking
  // the entire client search palette. First-wins keeps the dedup outcome
  // deterministic. Each dropped duplicate gets a console warn so the
  // upstream data quality issue stays visible without crashing.
  const allDocs = [...brandDocs, ...articleDocs];
  const seen = new Map<string, SearchDoc>();
  for (const doc of allDocs) {
    if (seen.has(doc.id)) {
      console.warn(
        `[search-index] duplicate document ID "${doc.id}" — keeping first, dropping duplicate. ` +
          `Fix upstream data (likely duplicate slug in Posts sheet or articles.ts).`
      );
      continue;
    }
    seen.set(doc.id, doc);
  }

  return {
    generatedAt: new Date().toISOString(),
    documents: Array.from(seen.values()),
  };
};
