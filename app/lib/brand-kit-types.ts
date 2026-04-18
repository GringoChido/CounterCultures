/**
 * Brand Kit shared types + display constants.
 *
 * Separated from `brand-kit-sheets.ts` so client components can import types
 * + labels without pulling in `googleapis` (server-only) into the browser bundle.
 */

export type CategorySlug =
  | "faucetry-showers"
  | "door-cabinet-hardware"
  | "bathroom-sinks"
  | "kitchen-sinks"
  | "drains"
  | "toilets"
  | "bathtubs"
  | "appliances"
  | "other";

export type StockedState = "stocked" | "request" | "external" | "";

export type NomStatus =
  | "certified"
  | "partial"
  | "in_progress"
  | "needs_cert"
  | "not_required"
  | "unknown";

export interface Brand {
  slug: string;
  name: string;
  taglineEn: string;
  taglineEs: string;
  descriptionEn: string;
  descriptionEs: string;
  originCountry: string;
  originCountryName: string;
  websiteUrl: string;
  externalUrl: string;
  stockedState: StockedState;
  primaryCategorySlug: CategorySlug | "";
  categorySlugs: CategorySlug[];
  logoDriveId: string;
  heroDriveId: string;
  brandFolderDriveId: string;
  featuredProductIds: string[];
  featuredProjectSlugs: string[];
  nomStatusSummary: NomStatus;
  isArtisan: boolean;
  isFeatured: boolean;
  displayOrder: number | null;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

export const CATEGORY_LABELS: Record<CategorySlug, string> = {
  "faucetry-showers": "Faucetry & Showers",
  "door-cabinet-hardware": "Door & Cabinet Hardware",
  "bathroom-sinks": "Bathroom Sinks",
  "kitchen-sinks": "Kitchen Sinks",
  drains: "Drains",
  toilets: "Toilets",
  bathtubs: "Bathtubs",
  appliances: "Appliances",
  other: "Other",
};
