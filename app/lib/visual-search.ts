/**
 * Visual search — architect snaps a fixture, we find the closest catalog
 * matches. Claude Haiku 4.5 handles vision natively so we don't add a Gemini
 * dependency; same Anthropic SDK / env var as PDF extraction and AI
 * descriptions, one billing line.
 *
 * Cost: ~$0.001-0.003 per call (Haiku vision on a single image).
 *
 * Flow: image → Claude returns structured attributes (brand, type, finish,
 * category, query) → searchProducts(query) returns ranked ProductFull rows.
 */
import Anthropic from "@anthropic-ai/sdk";
import {
  searchProducts,
  type ProductCategory,
  type ProductFull,
} from "./products-full";
import { parseModelJson } from "./parse-model-json";

const MODEL = "claude-haiku-4-5-20251001";

// Soft cap to keep one upload from blowing the budget on a 4K hero shot.
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB

export interface VisualAttributes {
  brand?: string;
  productType?: string;
  category?: ProductCategory;
  finish?: string;
  descriptiveTerms: string[];
  searchQuery: string;
  /** Model-assigned 0-1 confidence in the visual identification */
  confidence: number;
}

export interface VisualSearchResult {
  attributes: VisualAttributes;
  matches: ProductFull[];
  totalMatched: number;
}

const SYSTEM_PROMPT = `You identify high-end architectural fixtures (faucets, sinks, hardware, tubs, toilets, drains, appliances) for Counter Cultures, an authorized dealer in San Miguel de Allende.

Look at the image and return JSON describing what you see:
  - brand: the manufacturer name if you can recognize a logo or distinctive design language (e.g. "Brizo", "Sun Valley Bronze"). Omit if uncertain.
  - productType: short noun phrase like "kitchen faucet", "cabinet pull", "freestanding tub", "door lever".
  - category: one of "bathroom", "kitchen", "hardware". Pick the best fit.
  - finish: dominant finish color/material as a short label (e.g. "matte black", "polished chrome", "aged bronze", "stainless").
  - descriptiveTerms: array of 3-5 distinctive visual keywords that would help match in a SKU/name catalog (e.g. ["single-lever", "industrial", "pull-down sprayer"]).
  - searchQuery: a single concise string (3-8 words max) suitable for a substring catalog search. Combine the most distinctive terms — e.g. "Brizo Litze pull-down kitchen" or "matte black cross-handle".
  - confidence: 0-1 float reflecting how sure you are this is the actual depicted product.

Rules:
  - Don't fabricate a brand. If the logo isn't visible and the design isn't a signature piece, omit it.
  - The searchQuery is what we'll run against a SKU/name catalog — include the most distinctive 2-3 visual elements only. No prose, no full sentences.
  - Output strict JSON only, no commentary, no code fences.`;

export const analyzeImage = async (
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif"
): Promise<VisualAttributes> => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const client = new Anthropic({ apiKey });
  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 600,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: "Identify this fixture. Output JSON.",
          },
        ],
      },
    ],
  });

  const text = resp.content[0].type === "text" ? resp.content[0].text : "";
  const parsed = parseModelJson<Record<string, unknown>>(text);

  const validCats: ProductCategory[] = ["bathroom", "kitchen", "hardware"];
  const rawCat = typeof parsed.category === "string" ? parsed.category : "";
  const category = validCats.includes(rawCat as ProductCategory)
    ? (rawCat as ProductCategory)
    : undefined;

  const terms = Array.isArray(parsed.descriptiveTerms)
    ? parsed.descriptiveTerms.filter((t) => typeof t === "string").slice(0, 5)
    : [];

  return {
    brand: typeof parsed.brand === "string" ? parsed.brand.trim() : undefined,
    productType:
      typeof parsed.productType === "string"
        ? parsed.productType.trim()
        : undefined,
    category,
    finish: typeof parsed.finish === "string" ? parsed.finish.trim() : undefined,
    descriptiveTerms: terms as string[],
    searchQuery:
      typeof parsed.searchQuery === "string"
        ? parsed.searchQuery.trim()
        : terms.join(" "),
    confidence:
      typeof parsed.confidence === "number"
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0.5,
  };
};

/**
 * Two-pass search: brand-scoped first if a brand was identified, then a
 * broader fallback if the brand-scoped pool is thin. Keeps results tight when
 * we recognize the maker, broad when we don't.
 */
export const matchVisualToCatalog = async (
  attrs: VisualAttributes,
  limit = 24
): Promise<{ matches: ProductFull[]; totalMatched: number }> => {
  const q = attrs.searchQuery || attrs.descriptiveTerms.join(" ") || attrs.productType || "";

  if (attrs.brand) {
    const brandFirst = await searchProducts({
      q,
      brand: attrs.brand,
      category: attrs.category ?? "all",
      saleOnly: true,
      limit,
    });
    if (brandFirst.items.length >= 4) {
      return { matches: brandFirst.items, totalMatched: brandFirst.total };
    }
  }

  // Broader pass — drop the brand filter, keep category if present
  const broad = await searchProducts({
    q,
    category: attrs.category ?? "all",
    saleOnly: true,
    limit,
  });
  return { matches: broad.items, totalMatched: broad.total };
};

export const visualSearch = async (
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif"
): Promise<VisualSearchResult> => {
  const attributes = await analyzeImage(imageBase64, mediaType);
  const { matches, totalMatched } = await matchVisualToCatalog(attributes);
  return { attributes, matches, totalMatched };
};
