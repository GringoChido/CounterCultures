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

  const title = isEs ? "Políticas de Devolución y Garantías" : "Returns & Warranty Policy";
  const description = isEs
    ? "Políticas de devolución, garantías y cambios de Counter Cultures."
    : "Counter Cultures return, warranty, and exchange policies.";

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/returns-warranty`,
      languages: {
        en: `${BASE_URL}/en/returns-warranty`,
        es: `${BASE_URL}/es/returns-warranty`,
        "x-default": `${BASE_URL}/en/returns-warranty`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/returns-warranty`,
      locale: isEs ? "es_MX" : "en_US",
      type: "website",
    },
  };
};

const ReturnsWarrantyPage = async ({ params }: PageProps) => {
  const { locale } = await params;
  const lang = (locale as "en" | "es") || "en";
  const isEs = lang === "es";

  return (
    <>
      <Header locale={lang} />
      <main className="pt-20 bg-brand-linen min-h-screen">
        <div className="mx-auto max-w-3xl px-6 lg:px-8 py-16 md:py-24">
          <h1 className="font-display text-3xl md:text-4xl font-light text-brand-charcoal mb-8">
            {isEs ? "Políticas de Devolución y Garantías" : "Returns & Warranty Policy"}
          </h1>

          <h2 className="font-display text-xl font-medium text-brand-charcoal mt-10 mb-4">
            {isEs ? "Mercancía Dañada o Incorrecta" : "Damaged or Incorrect Merchandise"}
          </h2>
          <p className="font-body text-base text-brand-charcoal/80 leading-relaxed mb-4">
            {isEs
              ? "Los intercambios físicos solo se aceptan si se reportan dentro de las 72 horas posteriores a la recepción."
              : "Physical exchanges are only accepted if reported within 72 hours of receipt."}
          </p>
          <p className="font-body text-base text-brand-charcoal/80 leading-relaxed mb-4">
            {isEs ? "Contacto: " : "Contact: "}
            <a href="mailto:roger@countercultures.com.mx" className="text-brand-terracotta hover:underline">
              roger@countercultures.com.mx
            </a>
            {" o "}
            <a href="tel:4151548375" className="text-brand-terracotta hover:underline">
              (415) 154 8375
            </a>
          </p>

          <h2 className="font-display text-xl font-medium text-brand-charcoal mt-10 mb-4">
            {isEs ? "Cobertura de Garantía" : "Warranty Coverage"}
          </h2>
          <ul className="font-body text-base text-brand-charcoal/80 list-disc pl-6 space-y-2 mb-4">
            <li>{isEs ? "Garantía eléctrica/electrónica: Válida por 30 días a partir de la recepción" : "Electrical/Electronic Warranty: Valid for 30 days from receipt"}</li>
            <li>{isEs ? "La garantía cubre reemplazo de piezas y reparaciones solo por defectos de fabricación" : "Warranty covers parts replacement and repairs for manufacturing defects only"}</li>
          </ul>

          <h2 className="font-display text-xl font-medium text-brand-charcoal mt-10 mb-4">
            {isEs ? "Requisitos de Devolución" : "Return Requirements"}
          </h2>
          <ul className="font-body text-base text-brand-charcoal/80 list-disc pl-6 space-y-2 mb-4">
            <li>{isEs ? "Todos los artículos deben ser devueltos en sus cajas originales con todos los accesorios" : "All items must be returned in their original boxes with all accessories"}</li>
            <li>{isEs ? "Se requiere el empaque original" : "Original packaging is required"}</li>
          </ul>

          <h2 className="font-display text-xl font-medium text-brand-charcoal mt-10 mb-4">
            {isEs ? "Verificación con Proveedor" : "Supplier Verification"}
          </h2>
          <p className="font-body text-base text-brand-charcoal/80 leading-relaxed mb-4">
            {isEs
              ? "Counter Cultures contacta a los proveedores para determinar la elegibilidad de la garantía."
              : "Counter Cultures contacts suppliers to determine warranty eligibility."}
          </p>

          <h2 className="font-display text-xl font-medium text-brand-charcoal mt-10 mb-4">
            {isEs ? "Disponibilidad de Inventario" : "Stock Availability"}
          </h2>
          <p className="font-body text-base text-brand-charcoal/80 leading-relaxed mb-4">
            {isEs
              ? "Si el producto no está disponible, se ofrece intercambio por un artículo equivalente o un reembolso del 75% al método de pago original."
              : "If the product is unavailable, an exchange for an equivalent item or a 75% refund to the original payment method will be offered."}
          </p>

          <h2 className="font-display text-xl font-medium text-brand-charcoal mt-10 mb-4">
            {isEs ? "Cargo Operativo del 25%" : "25% Operational Fee"}
          </h2>
          <p className="font-body text-base text-brand-charcoal/80 leading-relaxed mb-4">
            {isEs
              ? "Se aplica un cargo operativo del 25% a todas las devoluciones, cambios o cancelaciones."
              : "A 25% operational fee is applied to all returns, exchanges, or cancellations."}
          </p>

          <h2 className="font-display text-xl font-medium text-brand-charcoal mt-10 mb-4">
            {isEs ? "Exclusiones de Garantía" : "Warranty Exclusions"}
          </h2>
          <ul className="font-body text-base text-brand-charcoal/80 list-disc pl-6 space-y-2 mb-4">
            <li>{isEs ? "Daño por mal uso, errores de instalación, vandalismo, accidentes, incendio o inundación" : "Damage from misuse, installation errors, vandalism, accidents, fire, or flooding"}</li>
            <li>{isEs ? "Artículos abiertos por personal no autorizado" : "Items opened by unauthorized personnel"}</li>
            <li>{isEs ? "Productos cerámicos (sin garantía; envío bajo riesgo del cliente)" : "Ceramic products (no warranty; shipping at customer\u2019s risk)"}</li>
          </ul>

          <h2 className="font-display text-xl font-medium text-brand-charcoal mt-10 mb-4">
            {isEs ? "Costos de Envío de Devolución" : "Return Shipping Costs"}
          </h2>
          <ul className="font-body text-base text-brand-charcoal/80 list-disc pl-6 space-y-2 mb-4">
            <li>{isEs ? "Los clientes cubren todos los gastos de envío de devolución" : "Customers cover all return shipping expenses"}</li>
            <li>
              {isEs ? "Dirección de devolución" : "Return address"}: San Juan 11A, Col. Providencia, San Miguel de Allende, Gto. México CP.37737
            </li>
          </ul>

          <div className="font-body text-sm text-brand-stone mt-8 pt-8 border-t border-brand-stone/10">
            <p>
              {isEs ? "Ubicación" : "Location"}: Providencia, San Miguel de Allende, Guanajuato, 37737
            </p>
            <p className="mt-2">
              {isEs
                ? "Horario: Lunes a Viernes 10 AM \u2013 6 PM; Cerrado fines de semana"
                : "Hours: Monday\u2013Friday 10 AM \u2013 6 PM; Closed weekends"}
            </p>
            <p className="mt-2">
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

export default ReturnsWarrantyPage;
