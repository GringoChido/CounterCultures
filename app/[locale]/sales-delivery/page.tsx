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

  const title = isEs ? "Políticas de Venta y Entrega" : "Sales & Delivery Policy";
  const description = isEs
    ? "Políticas de venta, entrega, precios y tiempos de procesamiento de Counter Cultures."
    : "Counter Cultures sales, delivery, pricing, and processing policies.";

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/sales-delivery`,
      languages: {
        en: `${BASE_URL}/en/sales-delivery`,
        es: `${BASE_URL}/es/sales-delivery`,
        "x-default": `${BASE_URL}/en/sales-delivery`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/sales-delivery`,
      locale: isEs ? "es_MX" : "en_US",
      type: "website",
    },
  };
};

const SalesDeliveryPage = async ({ params }: PageProps) => {
  const { locale } = await params;
  const lang = (locale as "en" | "es") || "en";
  const isEs = lang === "es";

  return (
    <>
      <Header locale={lang} />
      <main className="pt-20 bg-brand-linen min-h-screen">
        <div className="mx-auto max-w-3xl px-6 lg:px-8 py-16 md:py-24">
          <h1 className="font-display text-3xl md:text-4xl font-light text-brand-charcoal mb-8">
            {isEs ? "Políticas de Venta y Entrega" : "Sales & Delivery Policy"}
          </h1>

          <h2 className="font-display text-xl font-medium text-brand-charcoal mt-10 mb-4">
            {isEs ? "Seguridad" : "Security"}
          </h2>
          <p className="font-body text-base text-brand-charcoal/80 leading-relaxed mb-4">
            {isEs
              ? "Utilizamos una variedad de medidas de seguridad de la información para proteger sus transacciones. Nuestro sistema encripta los datos para proteger pedidos que contienen nombres y direcciones."
              : "We use a variety of information security measures to protect your transactions. Our system encrypts data to protect orders containing names and addresses."}
          </p>

          <h2 className="font-display text-xl font-medium text-brand-charcoal mt-10 mb-4">
            {isEs ? "Términos de Entrega" : "Delivery Terms"}
          </h2>
          <ul className="font-body text-base text-brand-charcoal/80 list-disc pl-6 space-y-2 mb-4">
            <li>{isEs ? "Las entregas se realizan en la dirección proporcionada por el comprador dentro de los plazos acordados" : "Deliveries are made to the address provided by the buyer within agreed timeframes"}</li>
            <li>{isEs ? "Los costos de envío al interior están sujetos a condiciones particulares y se declaran al momento de la compra" : "Interior shipping costs are subject to particular conditions and are stated at the time of purchase"}</li>
            <li>{isEs ? "El riesgo de envío corresponde al cliente" : "Shipping risk belongs to the customer"}</li>
            <li>{isEs ? "Entregas a toda la República: 70% de anticipo, 30% al notificar el envío; la entrega es gratuita" : "Republic-wide deliveries: 70% upfront payment, 30% upon shipment notification; delivery is free"}</li>
            <li>{isEs ? "La disponibilidad del producto determina los tiempos de entrega" : "Product availability determines delivery timelines"}</li>
            <li>{isEs ? "Los precios y existencias están sujetos a cambio sin previo aviso" : "Prices and stock are subject to change without notice"}</li>
          </ul>

          <h2 className="font-display text-xl font-medium text-brand-charcoal mt-10 mb-4">
            {isEs ? "Tiempos de Procesamiento" : "Processing Timeline"}
          </h2>
          <ul className="font-body text-base text-brand-charcoal/80 list-disc pl-6 space-y-2 mb-4">
            <li>{isEs ? "El procesamiento inicia al recibir la orden de compra y el depósito bancario" : "Processing begins upon receipt of purchase orders and bank deposits"}</li>
            <li>
              {isEs ? "Los clientes deben enviar comprobante por correo a " : "Customers must email proof of payment to "}
              <a href="mailto:roger@countercultures.com.mx" className="text-brand-terracotta hover:underline">
                roger@countercultures.com.mx
              </a>
            </li>
            <li>{isEs ? "El envío de mercancía toma de 4 a 6 semanas para su entrega" : "Merchandise shipment takes 4 to 6 weeks for delivery"}</li>
          </ul>

          <h2 className="font-display text-xl font-medium text-brand-charcoal mt-10 mb-4">
            {isEs ? "Precios" : "Pricing"}
          </h2>
          <ul className="font-body text-base text-brand-charcoal/80 list-disc pl-6 space-y-2 mb-4">
            <li>{isEs ? "Los precios de lista no incluyen IVA" : "List prices do not include VAT (IVA)"}</li>
            <li>{isEs ? "Los precios cotizados en dólares se convierten a moneda local al tipo de cambio del día según las tasas del sitio web" : "Dollar-quoted prices are converted to local currency at the day\u2019s exchange rate per website rates"}</li>
            <li>{isEs ? "Las cotizaciones son válidas por 7 días a partir de su emisión" : "Quotations are valid for 7 days from the date of issuance"}</li>
            <li>{isEs ? "Los productos se entregan LAB (punto de destino)" : "Products are delivered LAB (destination point)"}</li>
          </ul>

          <h2 className="font-display text-xl font-medium text-brand-charcoal mt-10 mb-4">
            {isEs ? "Requisitos Adicionales" : "Additional Requirements"}
          </h2>
          <ul className="font-body text-base text-brand-charcoal/80 list-disc pl-6 space-y-2 mb-4">
            <li>{isEs ? "Se requiere información completa de facturación y dirección de envío para el cumplimiento del pedido" : "Complete billing and shipping address information is required for order fulfillment"}</li>
            <li>{isEs ? "La facturación solo se permite dentro de los 5 días posteriores a la compra con comprobante" : "Invoicing is only permitted within 5 days of purchase with proof"}</li>
            <li>{isEs ? "De lo contrario, se factura como público en general" : "Otherwise, the order will be invoiced as \u201cgeneral public\u201d"}</li>
          </ul>

          <div className="font-body text-sm text-brand-stone mt-8 pt-8 border-t border-brand-stone/10">
            <p>
              {isEs ? "Contacto" : "Contact"}:{" "}
              <a href="mailto:roger@countercultures.com.mx" className="text-brand-terracotta hover:underline">
                roger@countercultures.com.mx
              </a>
            </p>
          </div>
        </div>
      </main>
      <Footer locale={lang} />
    </>
  );
};

export default SalesDeliveryPage;
