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
import { stripHtml } from "./strip-html";

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

/**
 * Detect posts where title_en/es are identical AND the content reads as
 * Spanish (common Spanish articles + function words). The Drive importer
 * copied Spanish source text into both locale fields, so the language
 * toggle looks broken when EN shows Spanish content.
 */
const SPANISH_SIGNALS = /\b(la|el|los|las|un|una|del|con|para|por|que|ese|este|esta|son|está|sus|hay|más)\b/gi;
const looksSpanish = (s: string): boolean => {
  if (!s || s.length < 20) return false;
  const matches = s.match(SPANISH_SIGNALS);
  return (matches?.length ?? 0) >= 2;
};

const isSpanishOnlyPost = (en: string, es: string): boolean =>
  en === es && looksSpanish(en);

/**
 * Clean text coming out of the Posts sheet.
 * The Drive importer dumps raw HTML + BOM + Windows line endings verbatim, so
 * we normalise here at read time.
 */
const clean = (s: string): string => {
  if (!s) return "";
  return stripHtml(s)
    .replace(/^\uFEFF/, "") // BOM
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

/**
 * Some posts were imported with the entire body crammed into the title field.
 * If a "title" is absurdly long, peel off the first natural break as the real
 * title and return the remainder as body spillover.
 */
const splitBloatedTitle = (
  raw: string
): { title: string; spillover: string } => {
  // Re-insert missing spaces at camelCase boundaries first: "saludablesLa" → "saludables La"
  // The Drive importer strips paragraph breaks and glues heading-to-body directly.
  const t = clean(raw).replace(/([a-záéíóúñ])([A-ZÁÉÍÓÚÑ])/g, "$1 $2");
  if (t.length <= 120) return { title: t, spillover: "" };

  const breaks = ["\n", ". ", ": ", "? ", "! ", " – ", " — "];
  const punctIdx = Math.min(
    ...breaks
      .map((b) => t.indexOf(b))
      .filter((i) => i > 8 && i < 120)
      .concat(Infinity)
  );

  // Second-sentence heuristic: after any punct-split, further split on the first
  // "Word followed by another Word group that looks like a sentence start" — e.g.
  // the original heading was "Consejos saludables" + new paragraph "La magia…"
  let idx: number;
  if (Number.isFinite(punctIdx)) {
    idx = punctIdx;
  } else {
    // No punct break — look for "lowercase SPACE Capital" which usually marks
    // a heading→paragraph boundary that lost its newline in import.
    const m = t.slice(0, 120).match(/[a-záéíóúñ]\s+[A-ZÁÉÍÓÚÑ]/);
    if (m && m.index !== undefined && m.index > 8) {
      idx = m.index + 1; // split at the space, before the capital
    } else {
      const firstSpace = t.indexOf(" ", 40);
      idx = firstSpace > 0 && firstSpace < 80 ? firstSpace : 80;
    }
  }

  const head = t.slice(0, idx).replace(/[:.?!–—]\s*$/, "").trim();
  const tail = t.slice(idx).replace(/^[:.?!–—\s]+/, "").trim();
  return { title: head, spillover: tail };
};

const rowToArticle = (
  r: PostRow
): Article & { status: string; driveFileId: string; isSpanishOnly: boolean } => {
  const pillar = (VALID_PILLARS.includes(r.pillar as ArticlePillar)
    ? r.pillar
    : "Craft") as ArticlePillar;

  const titleEn = splitBloatedTitle(r.title_en || r.title_es);
  const titleEs = splitBloatedTitle(r.title_es || r.title_en);

  const excerptEn = clean(r.excerpt_en || r.excerpt_es) || titleEn.spillover.slice(0, 280);
  const excerptEs = clean(r.excerpt_es || r.excerpt_en) || titleEs.spillover.slice(0, 280);

  const bodyEn = clean(r.body_en || r.body_es) || titleEn.spillover;
  const bodyEs = clean(r.body_es || r.body_en) || titleEs.spillover;

  const spanishOnly =
    isSpanishOnlyPost(titleEn.title, titleEs.title) ||
    isSpanishOnlyPost(excerptEn, excerptEs);

  return {
    slug: r.slug,
    title: { en: titleEn.title, es: titleEs.title },
    excerpt: { en: excerptEn, es: excerptEs },
    pillar,
    date: r.date || new Date().toISOString().slice(0, 10),
    readTime: r.readTime || "5 min",
    image: r.image,
    author: r.author || "Counter Cultures",
    featured: r.featured === "true" || r.featured === "TRUE",
    editorsPick: r.editorsPick === "true" || r.editorsPick === "TRUE",
    body: { en: bodyEn, es: bodyEs },
    relatedSlugs: (r.relatedSlugs || "").split(",").map((s) => s.trim()).filter(Boolean),
    brandSlugs: (r.brandSlugs || "").split(",").map((s) => s.trim()).filter(Boolean),
    status: r.status || "published",
    driveFileId: r.driveFileId || "",
    isSpanishOnly: spanishOnly,
  };
};

// ── Cache ────────────────────────────────────────────────────────

let cachedPosts:
  | (Article & { status: string; driveFileId: string; isSpanishOnly: boolean })[]
  | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000;

export const getSheetPosts = async (): Promise<
  (Article & { status: string; driveFileId: string; isSpanishOnly: boolean })[]
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
  opts: { includeDrafts?: boolean; locale?: "en" | "es" } = {}
): Promise<Article[]> => {
  const sheet = await getSheetPosts();
  const sheetBySlug = new Map(sheet.map((a) => [a.slug, a]));

  const merged: (Article & { status?: string; isSpanishOnly?: boolean })[] = [];
  // Hardcoded first, unless overridden by sheet
  for (const a of hardcodedArticles) {
    if (!sheetBySlug.has(a.slug)) merged.push(a);
  }
  // Sheet articles (all of them, since they may not be in hardcoded)
  for (const a of sheet) merged.push(a);

  let out = opts.includeDrafts
    ? merged
    : merged.filter((a) => !("status" in a) || a.status !== "draft");

  // Hide Spanish-only posts from EN listing — the content isn't actually
  // in English so showing it there is confusing. ES still sees them.
  if (opts.locale === "en") {
    out = out.filter((a) => !a.isSpanishOnly);
  }

  return out;
};

export const getAllArticlesWithStatus = async (): Promise<
  (Article & {
    status: string;
    source: "hardcoded" | "sheet";
    isSpanishOnly: boolean;
  })[]
> => {
  const sheet = await getSheetPosts();
  const sheetBySlug = new Map(sheet.map((a) => [a.slug, a]));
  const out: (Article & {
    status: string;
    source: "hardcoded" | "sheet";
    isSpanishOnly: boolean;
  })[] = [];
  for (const a of hardcodedArticles) {
    if (sheetBySlug.has(a.slug)) continue;
    out.push({ ...a, status: "published", source: "hardcoded", isSpanishOnly: false });
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
