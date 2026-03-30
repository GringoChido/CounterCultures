import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PROJECTS, getProjectBySlug } from "@/app/lib/projects";
import { ProjectDetail } from "./project-detail";

interface ProjectPageProps {
  params: Promise<{ slug: string; locale: string }>;
}

const BASE_URL = "https://countercultures.mx";

export const generateStaticParams = () =>
  PROJECTS.map((p) => ({ slug: p.slug }));

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
      images: [
        {
          url: project.heroImage,
          width: 1920,
          height: 1080,
          alt: project.title,
        },
      ],
    },
  };
};

const ProjectPage = async ({ params }: ProjectPageProps) => {
  const { slug, locale } = await params;
  const lang = (locale as "en" | "es") || "en";
  const project = getProjectBySlug(slug);

  if (!project) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.description[lang],
    image: project.heroImage,
    locationCreated: {
      "@type": "Place",
      name: project.location[lang],
    },
    creator: {
      "@type": "Person",
      name: project.architect,
      ...(project.architectFirm && {
        worksFor: { "@type": "Organization", name: project.architectFirm },
      }),
    },
    dateCreated: String(project.year),
    provider: {
      "@type": "Organization",
      name: "Counter Cultures",
      url: BASE_URL,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProjectDetail project={project} locale={lang} />
    </>
  );
};

export default ProjectPage;
