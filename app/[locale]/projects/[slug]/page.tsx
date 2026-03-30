import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PROJECTS, getProjectBySlug } from "@/app/lib/projects";
import { ProjectDetail } from "./project-detail";

interface ProjectPageProps {
  params: Promise<{ slug: string; locale: string }>;
}

const BASE_URL = "https://countercultures.mx";

export const generateStaticParams = () =>
  PROJECTS.flatMap((p) => [
    { locale: "en", slug: p.slug },
    { locale: "es", slug: p.slug },
  ]);

export const generateMetadata = async ({
  params,
}: ProjectPageProps): Promise<Metadata> => {
  const { slug, locale } = await params;
  const isEs = locale === "es";
  const project = getProjectBySlug(slug);
  if (!project) return { title: "Project Not Found" };

  const title = isEs
    ? `${project.title} — ${project.location.es} | Counter Cultures`
    : `${project.title} — ${project.location.en} | Counter Cultures`;
  const description = project.description[isEs ? "es" : "en"];

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/projects/${slug}`,
      languages: {
        en: `${BASE_URL}/en/projects/${slug}`,
        es: `${BASE_URL}/es/projects/${slug}`,
        "x-default": `${BASE_URL}/en/projects/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/projects/${slug}`,
      locale: isEs ? "es_MX" : "en_US",
      alternateLocale: isEs ? "en_US" : "es_MX",
      type: "article",
      images: [
        {
          url: project.heroImage,
          width: 1200,
          height: 630,
          alt: project.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [project.heroImage],
    },
  };
};

const ProjectPage = async ({ params }: ProjectPageProps) => {
  const { slug, locale } = await params;
  const lang = (locale as "en" | "es") || "en";
  const isEs = lang === "es";
  const project = getProjectBySlug(slug);

  if (!project) notFound();

  // GEO: Enriched CreativeWork with entity-rich data — architects, brands, location
  const projectJsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": `${BASE_URL}/${lang}/projects/${slug}#project`,
    name: project.title,
    description: project.description[lang],
    image: project.gallery.map((img) => ({
      "@type": "ImageObject",
      url: img.src,
      description: img.alt[lang],
    })),
    locationCreated: {
      "@type": "Place",
      name: project.location[lang],
      address: {
        "@type": "PostalAddress",
        addressLocality: project.location[lang],
        addressRegion: "Guanajuato",
        addressCountry: "MX",
      },
    },
    creator: {
      "@type": "Person",
      name: project.architect,
      ...(project.architectFirm && {
        worksFor: { "@type": "Organization", name: project.architectFirm },
      }),
    },
    contributor: {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      name: "Counter Cultures",
      url: BASE_URL,
    },
    dateCreated: String(project.year),
    genre: project.type[lang],
    keywords: project.brands.join(", "),
    about: project.brands.map((brand) => ({
      "@type": "Brand",
      name: brand,
    })),
    mentions: project.fixtures.map((fixture) => ({
      "@type": "Product",
      name: fixture.product,
      brand: { "@type": "Brand", name: fixture.brand },
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
        item: `${BASE_URL}/${lang}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: isEs ? "Proyectos" : "Projects",
        item: `${BASE_URL}/${lang}/projects`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: project.title,
        item: `${BASE_URL}/${lang}/projects/${slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(projectJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ProjectDetail project={project} locale={lang} />
    </>
  );
};

export default ProjectPage;
