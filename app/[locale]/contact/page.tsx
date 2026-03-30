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
    },
  };
};

const ContactPage = () => {
  return <ContactContent />;
};

export default ContactPage;
