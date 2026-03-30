import type { Metadata } from "next";
import { ProjectsContent } from "./projects-content";

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
  };
};

const ProjectsPage = () => {
  return <ProjectsContent />;
};

export default ProjectsPage;
