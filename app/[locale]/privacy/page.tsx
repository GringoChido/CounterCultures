import type { Metadata } from "next";
import { Header } from "@/app/components/layout/header";
import { Footer } from "@/app/components/layout/footer";

interface PageProps {
  params: Promise<{ locale: string }>;
}

const BASE_URL = "https://countercultures.mx";

export const generateMetadata = async ({ params }: PageProps): Promise<Metadata> => {
  const { locale } = await params;
  const isEs = locale === "es";

  const title = isEs ? "Política de Privacidad" : "Privacy Policy";
  const description = isEs
    ? "Aviso de privacidad de Counter Cultures. Cómo protegemos y utilizamos sus datos personales."
    : "Counter Cultures privacy notice. How we protect and use your personal data.";

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/privacy`,
      languages: {
        en: `${BASE_URL}/en/privacy`,
        es: `${BASE_URL}/es/privacy`,
        "x-default": `${BASE_URL}/en/privacy`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/privacy`,
      locale: isEs ? "es_MX" : "en_US",
      type: "website",
    },
  };
};

const PrivacyPage = async ({ params }: PageProps) => {
  const { locale } = await params;
  const lang = (locale as "en" | "es") || "en";
  const isEs = lang === "es";

  return (
    <>
      <Header locale={lang} />
      <main className="pt-20 bg-brand-linen min-h-screen">
        <div className="mx-auto max-w-3xl px-6 lg:px-8 py-16 md:py-24">
          <h1 className="font-display text-3xl md:text-4xl font-light text-brand-charcoal mb-8">
            {isEs ? "Política de Privacidad" : "Privacy Policy"}
          </h1>

          <p className="font-body text-base text-brand-charcoal/80 leading-relaxed mb-4">
            {isEs
              ? "Su privacidad y confianza son muy importantes para nosotros. Por ello nos comprometemos a mantener su información a salvo y hacer todos los esfuerzos para utilizarla de forma cuidadosa y sensata. Es importante para nosotros que usted conozca el tipo de información que recopilamos y la forma en que la utilizamos. En cumplimiento a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares publicada en el Diario Oficial de la Federación del 5 de julio de 2010 y su Reglamento publicado en el Diario Oficial de la Federación el 21 de diciembre de 2011."
              : "Your privacy and trust are very important to us. We are committed to keeping your information safe and making every effort to use it carefully and responsibly. It is important to us that you understand the type of information we collect and how we use it. In compliance with Mexico\u2019s Federal Law for the Protection of Personal Data Held by Private Parties, published in the Official Gazette on July 5, 2010, and its Regulations published on December 21, 2011."}
          </p>

          <h2 className="font-display text-xl font-medium text-brand-charcoal mt-10 mb-4">
            {isEs ? "1. Datos del Responsable" : "1. Responsible Party"}
          </h2>
          <p className="font-body text-base text-brand-charcoal/80 leading-relaxed mb-4">
            {isEs
              ? "Empresa legalmente constituida conforme a las leyes mexicanas, con domicilio en San Juan 11a, Colonia Providencia, C.P. 37737, San Miguel de Allende, Guanajuato, comprometida con la protección de sus datos personales."
              : "A company legally established under Mexican law, located at San Juan 11a, Colonia Providencia, C.P. 37737, San Miguel de Allende, Guanajuato, committed to the protection of your personal data."}
          </p>

          <h2 className="font-display text-xl font-medium text-brand-charcoal mt-10 mb-4">
            {isEs ? "2. Información Proporcionada por el Titular" : "2. Information Provided by the Data Subject"}
          </h2>
          <p className="font-body text-base text-brand-charcoal/80 leading-relaxed mb-4">
            {isEs
              ? "Los datos personales que recabamos incluyen: nombre completo, registro federal de contribuyentes con homo clave (RFC), correo electrónico, domicilio, número de teléfono y nombre de empresa."
              : "The personal data we collect includes: full name, Federal Taxpayer Registry number (RFC), email address, home address, telephone number, and company name."}
          </p>

          <h2 className="font-display text-xl font-medium text-brand-charcoal mt-10 mb-4">
            {isEs ? "3. Finalidad del Tratamiento de Datos" : "3. Purpose of Data Processing"}
          </h2>
          <p className="font-body text-base text-brand-charcoal/80 leading-relaxed mb-4">
            {isEs ? "Sus datos personales serán utilizados para:" : "Your personal data will be used for:"}
          </p>
          <ul className="font-body text-base text-brand-charcoal/80 list-disc pl-6 space-y-2 mb-4">
            <li>{isEs ? "Transacciones comerciales de productos" : "Commercial product transactions"}</li>
            <li>{isEs ? "Comunicaciones promocionales vía correo electrónico, teléfono u otros medios electrónicos" : "Promotional communications via email, telephone, or other electronic means"}</li>
            <li>{isEs ? "Usted tendrá un plazo de cinco días hábiles después de la compra para optar por no recibir comunicaciones promocionales" : "You will have a period of five business days after purchase to opt out of promotional communications"}</li>
          </ul>

          <h2 className="font-display text-xl font-medium text-brand-charcoal mt-10 mb-4">
            {isEs ? "4. Limitación del Uso y Divulgación" : "4. Limitations on Use and Disclosure"}
          </h2>
          <p className="font-body text-base text-brand-charcoal/80 leading-relaxed mb-4">
            {isEs
              ? "Implementamos medidas de seguridad para proteger sus datos. Si desea solicitar limitaciones en el uso o divulgación de sus datos, puede contactarnos en "
              : "We implement security measures to protect your data. To request limitations on the use or disclosure of your data, contact us at "}
            <a href="mailto:equipo@countercultures.com.mx" className="text-brand-terracotta hover:underline">
              equipo@countercultures.com.mx
            </a>
          </p>

          <h2 className="font-display text-xl font-medium text-brand-charcoal mt-10 mb-4">
            {isEs ? "5. Transferencia y Remisión de Datos" : "5. Data Transfer"}
          </h2>
          <p className="font-body text-base text-brand-charcoal/80 leading-relaxed mb-4">
            {isEs
              ? "Nos comprometemos a mantener los principios de protección legal durante cualquier transferencia de datos a terceros."
              : "We commit to maintaining legal protection principles during any transfer of data to third parties."}
          </p>

          <h2 className="font-display text-xl font-medium text-brand-charcoal mt-10 mb-4">
            {isEs ? "6. Cambios al Aviso" : "6. Changes to This Notice"}
          </h2>
          <p className="font-body text-base text-brand-charcoal/80 leading-relaxed mb-4">
            {isEs
              ? "Counter Cultures se reserva el derecho de modificar este aviso de privacidad. Las actualizaciones serán publicadas en countercultures.com.mx"
              : "Counter Cultures reserves the right to modify this privacy notice. Updates will be published at countercultures.com.mx"}
          </p>

          <div className="font-body text-sm text-brand-stone mt-8 pt-8 border-t border-brand-stone/10">
            <p>
              {isEs ? "Contacto" : "Contact"}:{" "}
              <a href="mailto:equipo@countercultures.com.mx" className="text-brand-terracotta hover:underline">
                equipo@countercultures.com.mx
              </a>
              {" | "}
              <a href="tel:4151548375" className="text-brand-terracotta hover:underline">
                415.154.8375
              </a>
            </p>
          </div>
        </div>
      </main>
      <Footer locale={lang} />
    </>
  );
};

export default PrivacyPage;
