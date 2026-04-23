/**
 * Product visual language — brand + finish palette that makes all 354k
 * catalog cards feel intentional regardless of whether we have an image.
 *
 * The rule: **finish encodes the product's actual appearance**, brand
 * encodes identity. A "Matte Black" Brizo and a "Matte Black" Emtek are
 * both matte black — the finish tells the honest truth. When a SKU's
 * finish code is recognized, we use the finish palette. When it isn't,
 * we fall back to the brand's signature palette. This means:
 *
 *   1. Finish chip is always on-SKU (e.g. MB, PC, GL, BLGL) — architects
 *      parse finish codes at a glance and this is more useful than a
 *      random product photo
 *   2. Background color matches the actual product color when known
 *   3. Brand wordmark in Cormorant serves as the logo substitute
 *
 * The same component is used for cards, tiles, and drawer heros; the
 * typography scales by size.
 */

export interface BrandTheme {
  bg: string; // CSS color (hex or rgb)
  fg: string; // text color that reads on bg
  ringOnBg?: string; // subtle inner ring color override
}

export interface FinishTheme {
  code: string; // canonical display code
  label: string; // human-readable label
  bg: string; // CSS background (hex, rgb, or linear-gradient)
  fg: string;
}

// Hand-curated for the top ~25 brands by catalog volume. Long tail
// defaults to linen. Each choice is the brand's *visual signature* —
// what someone pictures when they hear "Brizo" vs "Kohler" vs "Emtek".
const BRAND_THEMES: Record<string, BrandTheme> = {
  // Dark/charcoal brands
  Brizo: { bg: "#1C1A18", fg: "#F5F0EB" },
  Dornbracht: { bg: "#111111", fg: "#F5F0EB" },
  Watermark: { bg: "#1F1D1A", fg: "#F5F0EB" },

  // Deep / jewel tones
  Kohler: { bg: "#0F1A23", fg: "#F5F0EB" },
  TOTO: { bg: "#0E3A52", fg: "#F5F0EB" },
  Toto: { bg: "#0E3A52", fg: "#F5F0EB" },
  Axor: { bg: "#1A1F26", fg: "#F5F0EB" },

  // Architectural warm neutrals
  Emtek: { bg: "#E6DDD1", fg: "#2C2C2C" },
  Baldwin: { bg: "#3A2C1E", fg: "#F5F0EB" },
  "Rocky Mountain Hardware": { bg: "#3F2C1C", fg: "#F5F0EB" },
  "Sun Valley Bronze": { bg: "#3C2817", fg: "#F5F0EB" },

  // Copper / bronze tones
  "California Faucets": { bg: "#B87333", fg: "#FFFFFF" },
  "Kingston Brass": { bg: "#A87E3D", fg: "#FFFFFF" },
  "Waterworks": { bg: "#8C7864", fg: "#F5F0EB" },

  // Cool / steel
  Hansgrohe: { bg: "#2A2E33", fg: "#F5F0EB" },
  Grohe: { bg: "#2B4A6A", fg: "#F5F0EB" },
  CRL: { bg: "#5C6369", fg: "#F5F0EB" },
  Delta: { bg: "#3B5168", fg: "#F5F0EB" },
  Peerless: { bg: "#435261", fg: "#F5F0EB" },

  // Ceramic / stone / appliance whites
  Blanco: { bg: "#E8E3DB", fg: "#2C2C2C" },
  Badeloft: { bg: "#EDE9E2", fg: "#2C2C2C" },
  "Villeroy & Boch": { bg: "#EAE5DD", fg: "#2C2C2C" },
  Duravit: { bg: "#E6E1D9", fg: "#2C2C2C" },

  // Kitchen appliances
  BlueStar: { bg: "#1F3A5F", fg: "#F5F0EB" },
  BLUESTAR: { bg: "#1F3A5F", fg: "#F5F0EB" },
  Smeg: { bg: "#7A1E2A", fg: "#F5F0EB" },
  Viking: { bg: "#1B4F3A", fg: "#F5F0EB" },
  Teka: { bg: "#2F3E2D", fg: "#F5F0EB" },
  TEKA: { bg: "#2F3E2D", fg: "#F5F0EB" },

  // Specialty
  Ebbe: { bg: "#8A6F3A", fg: "#FFFFFF" },
  Rohl: { bg: "#D9CEB8", fg: "#2C2C2C" },
  AQUASPA: { bg: "#4A7A8A", fg: "#F5F0EB" },
  Aquaspa: { bg: "#4A7A8A", fg: "#F5F0EB" },
};

// Finish code → palette. Codes extracted from trailing SKU suffix.
// Ordered/grouped by finish family; duplicate keys where multiple codes
// indicate the same finish.
const FINISH_THEMES: Record<string, FinishTheme> = {
  // ── Black family ─────────────────────────────────────────────
  MB: { code: "MB", label: "Matte Black", bg: "#1A1A1A", fg: "#F5F0EB" },
  MBL: { code: "MBL", label: "Matte Black", bg: "#1A1A1A", fg: "#F5F0EB" },
  MTB: { code: "MTB", label: "Matte Black", bg: "#1A1A1A", fg: "#F5F0EB" },
  HMB: { code: "HMB", label: "Matte Black", bg: "#1A1A1A", fg: "#F5F0EB" },
  BLK: { code: "BLK", label: "Black", bg: "#0E0E0E", fg: "#F5F0EB" },
  BL: { code: "BL", label: "Black", bg: "#0E0E0E", fg: "#F5F0EB" },

  // ── Chrome / polished silver family ─────────────────────────
  PC: { code: "PC", label: "Polished Chrome", bg: "#CACED2", fg: "#2C2C2C" },
  CH: { code: "CH", label: "Chrome", bg: "#CACED2", fg: "#2C2C2C" },
  CHR: { code: "CHR", label: "Chrome", bg: "#CACED2", fg: "#2C2C2C" },
  US26: { code: "US26", label: "Polished Chrome", bg: "#CACED2", fg: "#2C2C2C" },

  // ── Brushed / satin silver family ───────────────────────────
  BN: { code: "BN", label: "Brushed Nickel", bg: "#B6B7B0", fg: "#2C2C2C" },
  SN: { code: "SN", label: "Satin Nickel", bg: "#A9AAA3", fg: "#F5F0EB" },
  PN: { code: "PN", label: "Polished Nickel", bg: "#C2C6BB", fg: "#2C2C2C" },
  SS: { code: "SS", label: "Stainless", bg: "#B8BCBF", fg: "#2C2C2C" },
  US26D: { code: "US26D", label: "Satin Chrome", bg: "#ACB2B6", fg: "#2C2C2C" },
  US32D: { code: "US32D", label: "Satin Stainless", bg: "#ACB2B6", fg: "#2C2C2C" },

  // ── Gold / brass family ─────────────────────────────────────
  GL: { code: "GL", label: "Luxe Gold", bg: "#B8904A", fg: "#FFFFFF" },
  LG: { code: "LG", label: "Luxe Gold", bg: "#B8904A", fg: "#FFFFFF" },
  BG: { code: "BG", label: "Brushed Gold", bg: "#C09A5A", fg: "#FFFFFF" },
  PG: { code: "PG", label: "Polished Gold", bg: "#C8A055", fg: "#FFFFFF" },
  SG: { code: "SG", label: "Satin Gold", bg: "#B39255", fg: "#FFFFFF" },
  AG: { code: "AG", label: "Aged Gold", bg: "#8C7338", fg: "#FFFFFF" },
  PB: { code: "PB", label: "Polished Brass", bg: "#B09058", fg: "#FFFFFF" },
  SB: { code: "SB", label: "Satin Brass", bg: "#A68A4F", fg: "#FFFFFF" },
  UB: { code: "UB", label: "Unlacquered Brass", bg: "#9C8148", fg: "#FFFFFF" },

  // ── Bronze family ───────────────────────────────────────────
  ORB: { code: "ORB", label: "Oil-Rubbed Bronze", bg: "#3B2817", fg: "#F5F0EB" },
  US10B: { code: "US10B", label: "Oil-Rubbed Bronze", bg: "#3B2817", fg: "#F5F0EB" },
  VB: { code: "VB", label: "Venetian Bronze", bg: "#3F2A1A", fg: "#F5F0EB" },
  VEN: { code: "VEN", label: "Venetian Bronze", bg: "#3F2A1A", fg: "#F5F0EB" },
  BRZ: { code: "BRZ", label: "Bronze", bg: "#4A3323", fg: "#F5F0EB" },
  MBRZ: { code: "MBRZ", label: "Matte Bronze", bg: "#3F2A1A", fg: "#F5F0EB" },
  RB: { code: "RB", label: "Rustic Bronze", bg: "#402A1B", fg: "#F5F0EB" },
  RBBRZ: { code: "RB", label: "Rustic Bronze", bg: "#402A1B", fg: "#F5F0EB" },
  TB: { code: "TB", label: "Tumbled Bronze", bg: "#4D3622", fg: "#F5F0EB" },

  // ── Copper ──────────────────────────────────────────────────
  CP: { code: "CP", label: "Copper", bg: "#B87333", fg: "#FFFFFF" },
  COP: { code: "COP", label: "Copper", bg: "#B87333", fg: "#FFFFFF" },

  // ── White / pearl family ────────────────────────────────────
  WH: { code: "WH", label: "White", bg: "#F4EFE7", fg: "#2C2C2C" },
  MW: { code: "MW", label: "Matte White", bg: "#F0EBE5", fg: "#2C2C2C" },
  PW: { code: "PW", label: "Pearl White", bg: "#EFEAE0", fg: "#2C2C2C" },

  // ── Duotone specials (diagonal split) ───────────────────────
  BLGL: {
    code: "BLGL",
    label: "Matte Black / Luxe Gold",
    bg: "linear-gradient(135deg, #1A1A1A 0% 50%, #B8904A 50% 100%)",
    fg: "#F5F0EB",
  },
  BLPG: {
    code: "BLPG",
    label: "Black / Polished Gold",
    bg: "linear-gradient(135deg, #1A1A1A 0% 50%, #C8A055 50% 100%)",
    fg: "#F5F0EB",
  },
};

const FALLBACK_BRAND: BrandTheme = { bg: "#F5F0EB", fg: "#2C2C2C" };

/**
 * Trailing SKU finish-code parser. Handles common patterns:
 *   BRI- 63054LF-GL   → GL
 *   K-10433-BN        → BN
 *   1153CRLHMB        → HMB   (concatenated, 3 chars)
 *   3021-FSTF-BN      → BN
 *   EMTEK -  1153CRLHMB → HMB
 * Looks for 2-6 uppercase letters at the end, optionally preceded by dash/space.
 */
const FINISH_RE = /[-_\s]?([A-Z]{2,6})(?:\d{1,2})?$/;

export const finishFromSku = (sku: string): FinishTheme | null => {
  if (!sku) return null;
  const trimmed = sku.trim().toUpperCase();
  const m = FINISH_RE.exec(trimmed);
  if (!m) return null;
  // Find the longest known code match (try the whole suffix first, then trim)
  for (let len = m[1].length; len >= 2; len--) {
    const code = m[1].slice(m[1].length - len);
    if (FINISH_THEMES[code]) return FINISH_THEMES[code];
  }
  return null;
};

export const brandTheme = (brand: string): BrandTheme => {
  if (!brand) return FALLBACK_BRAND;
  return BRAND_THEMES[brand] ?? FALLBACK_BRAND;
};

/**
 * Resolve the visual theme for a product. Finish wins when present
 * because it describes THIS exact SKU; brand is the fallback identity.
 */
export const resolveVisualTheme = (
  brand: string,
  sku: string
): {
  bg: string;
  fg: string;
  finishCode?: string;
  finishLabel?: string;
  /** Whether the bg is a gradient (used for tweaking overlays). */
  isGradient: boolean;
} => {
  const finish = finishFromSku(sku);
  if (finish) {
    return {
      bg: finish.bg,
      fg: finish.fg,
      finishCode: finish.code,
      finishLabel: finish.label,
      isGradient: finish.bg.startsWith("linear-gradient"),
    };
  }
  const b = brandTheme(brand);
  return { bg: b.bg, fg: b.fg, isGradient: false };
};
