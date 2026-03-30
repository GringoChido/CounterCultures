import type { Metadata } from "next";
import { ContactContent } from "./contact-content";

const BASE_URL = "https://countercultures.mx";

interface ContactPageProps {
  params: Promise<{ locale: string }>;
}

export const generateMetadata = async ({
  params,
}: ContactPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const isEs = locale === "es";

  const title = isEs
    ? "Contacto — Counter Cultures San Miguel de Allende"
    : "Contact Us — Counter Cultures San Miguel de Allende";
  const description = isEs
    ? "Contáctanos para consultas sobre proyectos, cotizaciones de productos, el programa Trade o para visitar nuestro showroom en San Miguel de Allende, Guanajuato."
    : "Contact Counter Cultures for project consultations, product quotes, Trade Program inquiries, or to book a showroom visit in San Miguel de Allende, Guanajuato.";

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/contact`,
      languages: {
        en: `${BASE_URL}/en/contact`,
        es: `${BASE_URL}/es/contact`,
        "x-default": `${BASE_URL}/en/contact`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/contact`,
      locale: isEs ? "es_MX" : "en_US",
      alternateLocale: isEs ? "en_US" : "es_MX",
      type: "website",
      images: [
        {
          url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80",
          width: 1200,
          height: 630,
          alt: isEs
            ? "Contacto — Counter Cultures San Miguel de Allende"
            : "Contact — Counter Cultures San Miguel de Allende",
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

const ContactPage = async ({ params }: ContactPageProps) => {
  const { locale } = await params;
  const isEs = locale === "es";

  // ContactPage + LocalBusiness JSON-LD for contact pages
  const contactJsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: isEs
      ? "Contacto — Counter Cultures"
      : "Contact — Counter Cultures",
    description: isEs
      ? "Página de contacto de Counter Cultures en San Miguel de Allende."
      : "Contact page for Counter Cultures in San Miguel de Allende.",
    url: `${BASE_URL}/${locale}/contact`,
    mainEntity: {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      name: "Counter Cultures",
      telephone: "+52-415-000-0000",
      email: "info@countercultures.mx",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Providencia",
        addressLocality: "San Miguel de Allende",
        addressRegion: "Guanajuato",
        postalCode: "37700",
        addressCountry: "MX",
      },
      contactPoint: [
        {
          "@type": "ContactPoint",
          telephone: "+52-415-000-0000",
          contactType: "customer service",
          availableLanguage: ["English", "Spanish"],
          areaServed: "MX",
          hoursAvailable: {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            opens: "10:00",
            closes: "18:00",
          },
        },
        {
          "@type": "ContactPoint",
          contactType: "sales",
          email: "info@countercultures.mx",
          availableLanguage: ["English", "Spanish"],
        },
      ],
    },
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
        name: isEs ? "Contacto" : "Contact",
        item: `${BASE_URL}/${locale}/contact`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ContactContent />
    </>
  );
};

export default ContactPage;
