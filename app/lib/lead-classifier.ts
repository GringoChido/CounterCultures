/**
 * Lead message classifier — extracts brands, SKUs, and profession guess
 * from an inbound WhatsApp/email body using Claude Haiku.
 *
 * Same Anthropic SDK + env var as visual-search.ts and pdf-extraction.ts.
 * Cost: ~$0.0005 per classification.
 */
import Anthropic from "@anthropic-ai/sdk";
import { parseModelJson } from "./parse-model-json";

const MODEL = "claude-haiku-4-5-20251001";

export type LeadProfession =
  | "Architect"
  | "Designer"
  | "Builder"
  | "Hospitality"
  | "Homeowner"
  | "Unknown";

export interface LeadClassification {
  brands: string[];
  skus: string[];
  profession: LeadProfession;
  confidence: number;
}

const PROFESSIONS: LeadProfession[] = [
  "Architect",
  "Designer",
  "Builder",
  "Hospitality",
  "Homeowner",
  "Unknown",
];

const SYSTEM_PROMPT = `You read inbound sales messages for Counter Cultures, a high-end plumbing and architectural-fixtures dealer in San Miguel de Allende, Mexico. Customers ask about brands like Kohler, Brizo, BLANCO, TOTO, Sun Valley Bronze, Dornbracht, California Faucets, Rohl, Waterworks, Newport Brass.

Read the message and return strict JSON describing what the customer wants:
  - brands: array of brand names mentioned or strongly implied (e.g. ["BLANCO", "Brizo", "Kohler"]). Use the brand's canonical capitalization. Empty array if none.
  - skus: array of model/SKU strings the customer named (e.g. ["QUATRUS R15", "Litze Pull-down", "Artifacts Bridge"]). Include the brand-specific model name even if no part-number was given. Empty array if none.
  - profession: best guess at the customer's role. One of: "Architect", "Designer", "Builder", "Hospitality", "Homeowner", "Unknown". Use clues like "estoy especificando" (Architect/Designer), "para mi obra" (Builder), "hotel/restaurant" (Hospitality), "para mi casa" (Homeowner). When unclear, return "Unknown".
  - confidence: 0-1 float reflecting how sure you are about the profession guess.

Output strict JSON only, no commentary, no code fences.`;

export const classifyLeadMessage = async (
  message: string,
): Promise<LeadClassification> => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const trimmed = message.trim();
  if (!trimmed) {
    return { brands: [], skus: [], profession: "Unknown", confidence: 0 };
  }

  const client = new Anthropic({ apiKey });
  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 400,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: trimmed }],
  });

  const text = resp.content[0]?.type === "text" ? resp.content[0].text : "";
  const parsed = parseModelJson<Record<string, unknown>>(text);

  const brands = Array.isArray(parsed.brands)
    ? parsed.brands
        .filter((b): b is string => typeof b === "string")
        .map((b) => b.trim())
        .filter(Boolean)
        .slice(0, 10)
    : [];

  const skus = Array.isArray(parsed.skus)
    ? parsed.skus
        .filter((s): s is string => typeof s === "string")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 10)
    : [];

  const rawProf = typeof parsed.profession === "string" ? parsed.profession.trim() : "";
  const profession: LeadProfession = PROFESSIONS.includes(
    rawProf as LeadProfession,
  )
    ? (rawProf as LeadProfession)
    : "Unknown";

  const confidence =
    typeof parsed.confidence === "number"
      ? Math.max(0, Math.min(1, parsed.confidence))
      : 0;

  return { brands, skus, profession, confidence };
};
