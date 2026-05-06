/**
 * Project case-study schema. The catalog is intentionally empty: when
 * Roger has real photography and approval to publish a project, slot it
 * in here and the inspiration page picks it up automatically.
 *
 * Until then the inspiration page leans on hospitality-clients.ts (real)
 * and notable-installations.ts (real) for proof.
 */
import type { BilingualText } from "./types";

export interface ProjectImage {
  src: string;
  alt: BilingualText;
  caption?: BilingualText;
}

export interface ProjectFixture {
  product: string;
  brand: string;
  location: BilingualText;
  slug?: string;
}

export type ProjectLook =
  | "contemporary"
  | "hacienda"
  | "boutique-hotel"
  | "restaurant";

export const PROJECT_LOOKS: Record<ProjectLook, BilingualText> = {
  contemporary: { en: "Contemporary", es: "Contemporáneo" },
  hacienda: { en: "Hacienda", es: "Hacienda" },
  "boutique-hotel": { en: "Boutique Hotel", es: "Hotel Boutique" },
  restaurant: { en: "Restaurant", es: "Restaurante" },
};

export interface Project {
  slug: string;
  title: string;
  location: BilingualText;
  architect: string;
  architectFirm?: string;
  type: { en: string; es: string };
  look: ProjectLook;
  year: number;
  description: BilingualText;
  longDescription: BilingualText;
  heroImage: string;
  gallery: ProjectImage[];
  brands: string[];
  fixtures: ProjectFixture[];
  testimonial?: {
    quote: BilingualText;
    author: string;
    role: BilingualText;
  };
  stats?: {
    label: BilingualText;
    value: string;
  }[];
}

export const PROJECTS: Project[] = [];

export const getProjectBySlug = (slug: string): Project | undefined =>
  PROJECTS.find((p) => p.slug === slug);
