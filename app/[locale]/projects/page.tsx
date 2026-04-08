import type { Metadata } from "next";
import { ProjectsContent } from "./projects-content";
import { PROJECTS } from "@/app/lib/projects";

const BASE_URL = "https://countercultures.mx";

interface ProjectsPageProps {
  params: Promise<{ locale: string }>;
}

export const generateMetadata = async ({
  params,
}: ProjectsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const isEs = locale === "es";

  const title = isEs
    ? "Proyectos — Casas, Hoteles y Restaurantes en México"
    : "Projects — Homes, Hotels & Restaurants Across Mexico";
  const description = isEs
    ? "Explora proyectos residenciales, hoteleros y comerciales en San Miguel de Allende y Guanajuato — cada uno una colaboración entre marcas de clase mundial, artesanos locales y arquitectos visionarios."
    : "Explore residential, hospitality, and commercial projects across San Miguel de Allende and Guanajuato — each a collaboration between world-class brands, local artisans, and visionary architects.";

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/projects`,
      languages: {
        en: `${BASE_URL}/en/projects`,
        es: `${BASE_URL}/es/projects`,
        "x-default": `${BASE_URL}/en/projects`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/projects`,
      locale: isEs ? "es_MX" : "en_US",
      alternateLocale: isEs ? "en_US" : "es_MX",
      type: "website",
      images: [
        {
          url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80",
          width: 1200,
          height: 630,
          alt: isEs
            ? "Proyectos residenciales y hoteleros en San Miguel de Allende"
            : "Residential and hospitality projects in San Miguel de Allende",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80"],
    },
  };
};

const ProjectsPage = async ({ params }: ProjectsPageProps) => {
  const { locale } = await params;
  const isEs = locale === "es";

  // ItemList JSON-LD — GEO: enumerate projects for AI engines
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: isEs
      ? "Proyectos — Counter Cultures"
      : "Projects — Counter Cultures",
    description: isEs
      ? "Proyectos residenciales, hoteleros y comerciales especificados por Counter Cultures en San Miguel de Allende y México."
      : "Residential, hospitality, and commercial projects specified by Counter Cultures across San Miguel de Allende and Mexico.",
    url: `${BASE_URL}/${locale}/projects`,
    numberOfItems: PROJECTS.length,
    itemListElement: PROJECTS.map((project, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${BASE_URL}/${locale}/projects/${project.slug}`,
      name: project.title,
    })),
  };

  // BreadcrumbList JSON-LD
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: isEs ? "Inicio" : "Home",
        item: `${BASE_URL}/${locale}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: isEs ? "Proyectos" : "Projects",
        item: `${BASE_URL}/${locale}/projects`,
      },
    ],
  };

  return (
    <>
        <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ProjectsContent />
    </>
  );
};

export default ProjectsPage;
