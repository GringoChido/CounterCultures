/**
 * Posts sheet tab reader + merge with hardcoded Article[] from articles.ts.
 *
 * Sheet schema (18 columns):
 *   slug, title_en, title_es, excerpt_en, excerpt_es, pillar, date,
 *   readTime, image, author, featured, editorsPick, body_en, body_es,
 *   relatedSlugs, brandSlugs, status, driveFileId
 *
 * Status: 'draft' | 'published' — draft posts only show in dashboard, not /insights
 * driveFileId: source of truth tracking for re-imports from Drive
 */
import { readSheet } from "./dashboard-sheets";
import type { Article, ArticlePillar } from "./articles";
import { articles as hardcodedArticles } from "./articles";

interface PostRow {
  [key: string]: string;
  slug: string;
  title_en: string;
  title_es: string;
  excerpt_en: string;
  excerpt_es: string;
  pillar: string;
  date: string;
  readTime: string;
  image: string;
  author: string;
  featured: string;
  editorsPick: string;
  body_en: string;
  body_es: string;
  relatedSlugs: string;
  brandSlugs: string;
  status: string;
  driveFileId: string;
}

const VALID_PILLARS: ArticlePillar[] = ["Design", "Product", "Trade", "Craft"];

const rowToArticle = (r: PostRow): Article & { status: string; driveFileId: string } => {
  const pillar = (VALID_PILLARS.includes(r.pillar as ArticlePillar)
    ? r.pillar
    : "Craft") as ArticlePillar;
  return {
    slug: r.slug,
    title: { en: r.title_en, es: r.title_es || r.title_en },
    excerpt: { en: r.excerpt_en, es: r.excerpt_es || r.excerpt_en },
    pillar,
    date: r.date || new Date().toISOString().slice(0, 10),
    readTime: r.readTime || "5 min",
    image: r.image,
    author: r.author || "Counter Cultures",
    featured: r.featured === "true" || r.featured === "TRUE",
    editorsPick: r.editorsPick === "true" || r.editorsPick === "TRUE",
    body: { en: r.body_en, es: r.body_es || r.body_en },
    relatedSlugs: (r.relatedSlugs || "").split(",").map((s) => s.trim()).filter(Boolean),
    brandSlugs: (r.brandSlugs || "").split(",").map((s) => s.trim()).filter(Boolean),
    status: r.status || "published",
    driveFileId: r.driveFileId || "",
  };
};

// ── Cache ────────────────────────────────────────────────────────

let cachedPosts: (Article & { status: string; driveFileId: string })[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000;

export const getSheetPosts = async (): Promise<
  (Article & { status: string; driveFileId: string })[]
> => {
  const now = Date.now();
  if (cachedPosts && now - cacheTimestamp < CACHE_TTL) return cachedPosts;
  try {
    const rows = await readSheet<PostRow>("Posts");
    cachedPosts = rows.filter((r) => r.slug).map(rowToArticle);
  } catch {
    cachedPosts = [];
  }
  cacheTimestamp = now;
  return cachedPosts;
};

// ── Merge with hardcoded articles ────────────────────────────────

/**
 * Merged article list: hardcoded in repo + sheet-sourced.
 * Sheet posts with matching slug override hardcoded.
 * For public-facing: filter to status === 'published'.
 */
export const getAllArticles = async (
  opts: { includeDrafts?: boolean } = {}
): Promise<Article[]> => {
  const sheet = await getSheetPosts();
  const sheetBySlug = new Map(sheet.map((a) => [a.slug, a]));

  const merged: (Article & { status?: string })[] = [];
  // Hardcoded first, unless overridden by sheet
  for (const a of hardcodedArticles) {
    if (!sheetBySlug.has(a.slug)) merged.push(a);
  }
  // Sheet articles (all of them, since they may not be in hardcoded)
  for (const a of sheet) merged.push(a);

  return opts.includeDrafts
    ? merged
    : merged.filter((a) => !("status" in a) || a.status !== "draft");
};

export const getAllArticlesWithStatus = async (): Promise<
  (Article & { status: string; source: "hardcoded" | "sheet" })[]
> => {
  const sheet = await getSheetPosts();
  const sheetBySlug = new Map(sheet.map((a) => [a.slug, a]));
  const out: (Article & { status: string; source: "hardcoded" | "sheet" })[] = [];
  for (const a of hardcodedArticles) {
    if (sheetBySlug.has(a.slug)) continue;
    out.push({ ...a, status: "published", source: "hardcoded" });
  }
  for (const a of sheet) out.push({ ...a, source: "sheet" });
  return out;
};

export const getArticleBySlug = async (
  slug: string,
  opts: { includeDrafts?: boolean } = {}
): Promise<Article | null> => {
  const all = await getAllArticles(opts);
  return all.find((a) => a.slug === slug) ?? null;
};

// For cache busting after a write (import pipeline)
export const invalidatePostsCache = () => {
  cachedPosts = null;
  cacheTimestamp = 0;
};
