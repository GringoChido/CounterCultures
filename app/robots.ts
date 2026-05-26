import type { MetadataRoute } from "next";
import { SITE_URL } from "@/app/lib/seo";

// Index ONLY when explicitly allowed (prod). Staging stays noindex even when
// SITE_URL is the production domain.
const isProduction = process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true";

const DISALLOW = ["/api/", "/dashboard/", "/dashboard"];

export default function robots(): MetadataRoute.Robots {
  if (!isProduction) {
    return {
      rules: [{ userAgent: "*", disallow: ["/"] }],
      sitemap: `${SITE_URL}/sitemap.xml`,
      host: SITE_URL,
    };
  }

  const crawlerRules: MetadataRoute.Robots["rules"] = [
    "*",
    "GPTBot",
    "ChatGPT-User",
    "PerplexityBot",
    "ClaudeBot",
    "Anthropic-AI",
    "cohere-ai",
  ].map((ua) => ({
    userAgent: ua,
    allow: "/",
    disallow: DISALLOW,
  }));

  return {
    rules: crawlerRules,
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
